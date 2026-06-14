// graph.ts — THE knowledge-graph chunker (understand-anything style). ONE job:
// turn the live conversation into a typed, evidence-backed graph the five intake
// panels render against (symptoms / timeline / two-truths / risk / context).
//
// Two layers, on purpose:
//   1. DETERMINISTIC SCAFFOLD (no LLM) — every message becomes a 'turn' node, in
//      lockstep with the message log. This is the conversation spine; the panels'
//      evidence links resolve to these ids. Cheap, reproducible, always present.
//   2. INFERENTIAL LAYER (ONE Grok call per new window) — the concepts that hang
//      off the turns: symptoms, people, events, the subjective-claim vs objective-
//      fact split (the two-truths signal), triggers/coping, risk signals. The model
//      ONLY emits this layer; it never re-emits turn nodes.
//
// Incremental + idempotent: ConversationMeta.lastChunkedTurnId is the watermark —
// only messages newer than it get re-chunked, in sliding ~8-turn windows (2 overlap)
// so a concept spanning a window boundary is still seen. Re-running over the same
// turns merges in place (store.upsertNodes/upsertEdges union evidence + keep the
// louder node / heavier edge) and the OBJECTIVE-record events are guarded by a
// stable id, so nothing duplicates.
//
// The objective record is DERIVED HERE, not seeded: when the inferential layer
// surfaces a counted occurrence (panic_attack / self_harm / ideation / sleep_hours
// — exactly the vocabulary extract.ts counts), we store.addEvent it with
// source='story', so the mirror's counts come from what the person actually said in
// the conversation, not from a fixture.
//
// Determinism / FAIL LOUD (house rules): `now` is injected by the caller (never
// Date.now() in here); a model/parse error throws — no canned fallback masks a dead
// chunker.

import { z } from 'zod';
import { generateObject } from 'ai';
import { reasoningModel } from './grok.js';
import { store } from './store.js';
import {
  EDGE_WEIGHTS,
  GraphEdgeSchema,
  GraphNodeSchema,
  NodeTypeSchema,
  type ConversationMeta,
  type Graph,
  type GraphEdge,
  type GraphNode,
} from './types.js';
import type { Message } from './store.js';

// ── Tunables (the chunker's window — editable, the skeleton runs regardless) ──
const WINDOW_SIZE = 8; // turns per inferential window
const WINDOW_OVERLAP = 2; // turns shared with the previous window (catch boundary concepts)
const TURN_SUMMARY_MAX = 160; // chars before a turn node's summary is truncated
const MESSAGE_FETCH_CAP = 10_000; // "all messages" — the log is short in the demo

// The counted objective vocabulary extract.ts reflects against. A node typed as one
// of these kinds becomes a row in the OBJECTIVE record (source='story'), so the
// mirror's counts come from the conversation, not a seed. Keep in lockstep with
// extract.ts::buildRecordFacts.
const COUNTED_KINDS = ['panic_attack', 'self_harm', 'ideation', 'sleep_hours'] as const;
type CountedKind = (typeof COUNTED_KINDS)[number];

// Deterministic BACKSTOP for the objective count. The model MAY tag an occurrence, but
// it under-tags (LLM variance — a live run extracted all the panic content as symptom/
// fact nodes yet never set the tag, so the count came up 0). So the COUNT is derived
// deterministically from the node text instead of trusting a model flag: scan each
// occurrence-type node for the counted vocabulary. Precise on purpose (no bare "sleep"/
// "chest") and ORDERED so ideation ("sleep forever") wins over a naive sleep match.
const OCCURRENCE_NODE_TYPES = new Set(['symptom', 'fact_objective', 'event', 'risk_signal']);
const KIND_PATTERNS: Array<[CountedKind, RegExp]> = [
  ['ideation', /sleep forever|want to (die|disappear|sleep forever)|don'?t want to (wake|be here|live|exist)|end it all|kill myself|suicid/i],
  ['self_harm', /scratch\w*[^.]{0,24}(arm|skin|myself|raw)|self.?harm|cutting myself|hurt(ing)? myself|leaves? marks|marks? on my/i],
  ['panic_attack', /panic|chest (tight|pain|ache|hurt|heav)|can'?t breathe|cannot breathe|hyperventilat|heart (racing|pounding)|racing heart|hands? (go(ing)? )?numb|numb hands?/i],
  ['sleep_hours', /\b\d+\s*(h\b|hr|hour)s?\b[^.]{0,14}sleep|sleep[^.]{0,14}\b\d+\s*(h\b|hr|hour)|insomnia|can'?t sleep|barely slept|sleepless|no sleep/i],
];
// "every day / daily / all week" reads as the whole window, not one event — so a panic
// "after every club event this week" counts as the pattern it is (capped at 6). Episodic
// kinds only; ideation/sleep are point-in-time here.
const FREQ_RE = /every day|each day|\bdaily\b|every morning|every (club )?(event|meeting|night)|all week|this (past )?week|(6|six|7|seven) days/i;
function occurrenceCount(text: string, kind: CountedKind): number {
  if (kind === 'ideation' || kind === 'sleep_hours') return 1;
  return FREQ_RE.test(text) ? 6 : 1;
}
function isoMinusDays(now: string, days: number): string {
  return new Date(Date.parse(now) - days * 86_400_000).toISOString();
}

// ── The inferential-layer schema (ONE Grok-call boundary) ─────────────────────
// The model returns ONLY the inferential layer (no 'turn' nodes). We reuse the
// canonical node/edge shapes from types.ts so there is exactly one graph contract.
// `occurrenceKind` is an OPTIONAL extra the model tags onto a node it recognises as
// one of the counted objective events (panic_attack / self_harm / ideation /
// sleep_hours); we read it to derive the objective record, then drop it (it is not
// part of the stored GraphNode).
const InferredNodeSchema = GraphNodeSchema.extend({
  occurrenceKind: z
    .enum(COUNTED_KINDS)
    .nullish()
    .describe(
      'If and ONLY if this node is a concrete logged occurrence of one of the four ' +
        'counted objective events, tag it: panic_attack | self_harm | ideation | ' +
        'sleep_hours. Otherwise leave null. Drives the objective count.',
    ),
  occurrenceTs: z
    .string()
    .nullish()
    .describe(
      'ISO timestamp of the occurrence if the turns place it in time (use the ' +
        'timeframe the person gave). Null if no time was stated.',
    ),
});

const InferenceSchema = z.object({
  nodes: z.array(InferredNodeSchema),
  edges: z.array(GraphEdgeSchema),
});
type Inference = z.infer<typeof InferenceSchema>;

// ── The system prompt (EDITABLE — tune the extraction doctrine here) ──────────
// Leave COPY in this const so Johnny tunes it after the skeleton runs.
const GRAPH_PROMPT = `You extract a therapy-INTAKE knowledge graph from a short slice of a live conversation. Output ONLY the INFERENTIAL layer — the concepts that hang off the turns. Do NOT re-emit the turn nodes; they already exist and are listed for you to link to.

You are mapping, not diagnosing. Be CONSERVATIVE and EVIDENCE-ONLY: only emit a node or edge the turns in this window actually support, and ground every one in the turn ids it came from (evidenceTurnIds). When in doubt, leave it out.

NODE TYPES and the PANEL each belongs on:
- symptom        → panel 'symptoms'   (a felt/reported symptom: insomnia, chest tightness, panic)
- event          → panel 'timeline'   (a concrete thing that happened: "the club meeting Monday")
- timeframe      → panel 'timeline'   (a time anchor: "this week", "Monday night", "for 6 days")
- person         → panel 'context'    (someone who appears: a friend, a manager, a partner)
- trigger        → panel 'context'    (what sets a symptom off: meetings, the club events)
- coping         → panel 'context'    (what they do to cope: scratching, leaving, distraction)
- claim_subjective → panel 'two-truths' (what they FELT/INTERPRETED in their own frame: "everyone can see I'm falling apart", "I'm fine, lowkey chilling")
- fact_objective   → panel 'two-truths' (what verifiably HAPPENED, from the turns: "had a panic attack after every club event this week")
- risk_signal    → panel 'risk'       (self-harm, ideation, crisis cue: "wanting to sleep forever")

NODE IDS — the merge key. Use a stable, typed, lowercase-slug id so a re-mention MERGES instead of duplicating: 'symptom:insomnia', 'person:manager', 'event:mon-club', 'risk:ideation'. REUSE an id from the EXISTING NODE IDS list when the thing already exists. Every node needs a one-sentence summary and its evidenceTurnIds.

EDGE TYPES (relations between non-turn nodes — do NOT emit 'said_in', the spine owns that):
- experiences   (person/self → symptom)
- minimizes     (claim_subjective → symptom/fact_objective)  ← THE two-truths signal
- contradicts   (claim_subjective → fact_objective)          ← THE two-truths signal
- caused_by     (symptom/event → trigger)
- occurred_on   (event → timeframe)
- escalates     (symptom/event → risk_signal, or risk → risk)
- relieves      (coping → symptom)
- co_occurs     (any ↔ any, bidirectional)

THE CORE TWO-TRUTHS SIGNAL: when the person DOWNPLAYS or DENIES something the turns themselves evidence — they say "I'm fine / it's not a big deal / lowkey chilling" while the same turns describe panic attacks, scratching, not sleeping — emit a claim_subjective node for the downplaying, a fact_objective node for what the turns show, and a 'minimizes' (downplays) or 'contradicts' (denies) edge between them. This gap is the whole point of the intake.

RISK: emit a risk_signal node for any self-harm, ideation, or crisis cue, panel 'risk', and 'escalates' edges from the symptoms/events that lead toward it. Surface it calmly as a signal — never a verdict.

OCCURRENCE TAGGING (for the objective count): if a node is a concrete logged occurrence of one of these four — a panic attack, a self-harm act, an ideation statement, or a night's sleep duration — set occurrenceKind to panic_attack | self_harm | ideation | sleep_hours and occurrenceTs to when it happened (if the turns say). This is how the objective record is built from the conversation. Leave occurrenceKind null for everything else.

Use these default edge weights unless the turns give you strong reason to deviate: ${JSON.stringify(EDGE_WEIGHTS)}. salience is 'high' for the load-bearing concepts (the central symptom, the risk signal, the minimized truth), 'med' for supporting ones, 'low' for incidental mentions.`;

// ── Deterministic layer: the turn spine ───────────────────────────────────────

/** The stable id for a message's turn node. One turn node per message, forever. */
function turnNodeId(messageId: string): string {
  return `turn:${messageId}`;
}

/** Truncate a turn's content into a one-line summary (no mid-word cut surprises;
 *  a hard char cap is enough for the spine). */
function truncate(text: string, max: number): string {
  const t = text.trim().replace(/\s+/g, ' ');
  return t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`;
}

/** Build the deterministic 'turn' node for one message. Panel 'context' (the spine
 *  lives in context); name is the role; evidence is the message itself. */
function turnNodeFor(m: Message): GraphNode {
  return {
    id: turnNodeId(m.id),
    type: 'turn',
    name: m.role, // 'user' | 'dot'
    summary: truncate(m.content, TURN_SUMMARY_MAX),
    tags: [m.role],
    salience: 'low',
    panel: 'context',
    evidenceTurnIds: [m.id],
  };
}

// ── Windowing: only the un-chunked tail, in overlapping slices ─────────────────

/** Slice `messages` into sliding windows of ~WINDOW_SIZE with WINDOW_OVERLAP shared
 *  turns. Pure; an empty input yields no windows, a short input yields one. */
function slidingWindows(messages: Message[]): Message[][] {
  if (messages.length === 0) return [];
  const step = Math.max(1, WINDOW_SIZE - WINDOW_OVERLAP);
  const windows: Message[][] = [];
  for (let start = 0; start < messages.length; start += step) {
    windows.push(messages.slice(start, start + WINDOW_SIZE));
    if (start + WINDOW_SIZE >= messages.length) break; // last window reached the end
  }
  return windows;
}

/** The slice of messages the chunker has NOT yet consumed: everything strictly
 *  after `lastChunkedTurnId`. If the watermark is unknown/missing, all messages are
 *  new. (Messages arrive oldest→newest from the store.) */
function unchunkedTail(all: Message[], lastChunkedTurnId?: string): Message[] {
  if (!lastChunkedTurnId) return all;
  const idx = all.findIndex((m) => m.id === lastChunkedTurnId);
  return idx === -1 ? all : all.slice(idx + 1);
}

// ── The public entrypoint ─────────────────────────────────────────────────────

export interface UpdateGraphInput {
  userId: string;
  /** Injected "now" — the fallback ts for an occurrence with no stated time, and the
   *  open/openedAt for a first-time conversation. Never Date.now() in here. */
  now: string;
}

/**
 * updateGraph — fold the conversation's NEW turns into the user's knowledge graph.
 *
 * 1. DETERMINISTIC: ensure a 'turn' node per message (upsert — idempotent).
 * 2. WINDOW: find messages newer than the watermark; slice into overlapping windows.
 * 3. INFER: ONE Grok call per new window → the inferential layer (no turn nodes).
 * 4. MERGE: upsert nodes then edges (the store unions evidence + drops dangling edges).
 * 5. DERIVE: each occurrence-tagged node → an objective-record event (stable id).
 * 6. WATERMARK: advance ConversationMeta.lastChunkedTurnId to the newest message.
 *
 * Returns the whole user graph. Idempotent: re-running adds no duplicate nodes or
 * events. Fails LOUD on a model/parse error (no canned fallback).
 */
export async function updateGraph(input: UpdateGraphInput): Promise<Graph> {
  const { userId, now } = input;

  if (!store.getUser(userId)) {
    throw new Error(`updateGraph: no user '${userId}' in the store. Seed first (seedDemoUser()).`);
  }

  const allMessages = store.getMessages(userId, MESSAGE_FETCH_CAP); // oldest→newest

  // 1. DETERMINISTIC — the turn spine. Upsert every message's turn node (cheap,
  //    reproducible; the inferential layer links its evidence to these ids).
  store.upsertNodes(
    userId,
    allMessages.map(turnNodeFor),
  );

  const meta = store.getConversation(userId);
  const newMessages = unchunkedTail(allMessages, meta?.lastChunkedTurnId);

  // Nothing new to infer over — return the current graph (spine may still have grown,
  // which is why we upserted turns above before this early return).
  if (newMessages.length === 0) {
    return store.getGraph(userId);
  }

  // 2 + 3 + 4. One inferential pass per new window (merge in place).
  for (const window of slidingWindows(newMessages)) {
    const inference = await inferWindow(userId, window);
    mergeInference(userId, inference);
  }

  // 5. DERIVE the objective record from the WHOLE accumulated graph — a deterministic
  //    count over the node text, robust to the model under-tagging any single window.
  deriveObjectiveRecord(userId, now);

  // 6. WATERMARK — advance to the newest message we've now chunked. Carry/seed the
  //    conversation meta (open if this is the first chunk). turnCount tracks the spine.
  const newest = allMessages[allMessages.length - 1];
  if (newest) {
    const next: ConversationMeta = meta
      ? { ...meta, turnCount: allMessages.length, lastChunkedTurnId: newest.id }
      : {
          userId,
          status: 'open',
          openedAt: now,
          turnCount: allMessages.length,
          lastChunkedTurnId: newest.id,
        };
    store.upsertConversation(next);
  }

  return store.getGraph(userId);
}

// ── (3) the one Grok call per window ──────────────────────────────────────────

/** Run the inferential extraction over one window of turns. Builds the turn-context
 *  block + the existing-id reuse list, makes ONE generateObject call, returns the
 *  parsed inferential layer. Fails loud (generateObject throws on a parse miss). */
async function inferWindow(userId: string, window: Message[]): Promise<Inference> {
  // The turns the model reads + links against (id → role → content).
  const turnsBlock = window
    .map((m) => `[${turnNodeId(m.id)}] (${m.role}) ${m.content}`)
    .join('\n');

  // The existing non-turn node ids, so the model REUSES one instead of duplicating.
  const existingIds = store
    .getGraph(userId)
    .nodes.filter((n) => n.type !== 'turn')
    .map((n) => `${n.id}  (${n.type}: ${n.name})`);
  const existingBlock =
    existingIds.length > 0
      ? existingIds.join('\n')
      : '(none yet — this is the first inferential pass)';

  const { object } = await generateObject({
    model: reasoningModel,
    schema: InferenceSchema,
    system: GRAPH_PROMPT,
    prompt:
      `EXISTING NODE IDS (reuse one when the concept already exists):\n${existingBlock}\n\n` +
      `THE TURNS IN THIS WINDOW (link every node's evidenceTurnIds to these turn ids; ` +
      `do NOT emit turn nodes):\n${turnsBlock}\n\n` +
      `Extract ONLY the inferential layer — symptoms, events, timeframes, people, ` +
      `triggers, coping, the subjective-claim vs objective-fact split (emit ` +
      `minimizes/contradicts when the person downplays or denies what these turns ` +
      `evidence), and any risk signal. Conservative, evidence-only.`,
  });

  return object;
}

// ── (4) merge the inferential layer into the store ────────────────────────────

/** Strip the occurrence-tagging extras off an inferred node, leaving the canonical
 *  GraphNode the store holds. Defends the type with NodeTypeSchema (the model can't
 *  hand us a 'turn' here — the prompt bans it — but we never trust silently). */
function toGraphNode(n: Inference['nodes'][number]): GraphNode {
  return {
    id: n.id,
    type: NodeTypeSchema.parse(n.type),
    name: n.name,
    summary: n.summary,
    tags: n.tags,
    salience: n.salience,
    panel: n.panel,
    evidenceTurnIds: n.evidenceTurnIds,
  };
}

/** Merge one window's inferred nodes + edges. Nodes FIRST (so the store's edge merge,
 *  which drops any edge whose endpoints aren't nodes, sees them). The model is told
 *  not to emit turn nodes; we also skip any 'turn' it leaks (the spine is deterministic). */
function mergeInference(userId: string, inference: Inference): void {
  const nodes: GraphNode[] = inference.nodes
    .filter((n) => n.type !== 'turn')
    .map(toGraphNode);
  store.upsertNodes(userId, nodes);

  const edges: GraphEdge[] = inference.edges.filter((e) => e.type !== 'said_in');
  store.upsertEdges(userId, edges);
}

// ── (5) derive the objective record from the conversation ─────────────────────

/** Derive the objective record DETERMINISTICALLY from the whole graph. For each counted
 *  kind, count = the most occurrences any single occurrence-type node implies (so two
 *  nodes both mentioning panic don't double it — we take the max, not the sum). Then
 *  ensure that many events exist (stable ids `graph_<user>_<kind>_<i>`, idempotent — the
 *  count only grows as the conversation reveals more). ts is spread back day-by-day so a
 *  7-day count window picks them up; the label carries the loudest matching node. */
function deriveObjectiveRecord(userId: string, now: string): void {
  const nodes = store.getGraph(userId).nodes.filter((n) => OCCURRENCE_NODE_TYPES.has(n.type));
  const want: Record<CountedKind, number> = { panic_attack: 0, self_harm: 0, ideation: 0, sleep_hours: 0 };
  const label: Partial<Record<CountedKind, string>> = {};
  for (const n of nodes) {
    const text = `${n.name} ${n.summary} ${n.tags.join(' ')}`;
    for (const [kind, re] of KIND_PATTERNS) {
      if (!re.test(text)) continue;
      const c = occurrenceCount(text, kind);
      if (c > want[kind] || label[kind] === undefined) label[kind] = n.summary;
      if (c > want[kind]) want[kind] = c;
    }
  }
  for (const kind of COUNTED_KINDS) {
    for (let i = 0; i < want[kind]; i++) {
      const id = `graph_${userId}_${kind}_${i}`;
      if (store.hasEvent(id)) continue; // idempotent — already counted
      store.addEvent({
        id,
        userId,
        kind,
        label: label[kind] ?? `${kind.replace(/_/g, ' ')} (from the conversation)`,
        source: 'story',
        ts: isoMinusDays(now, i),
      });
    }
  }
}
