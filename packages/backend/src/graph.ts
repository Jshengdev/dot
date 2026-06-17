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
  ClinicalSignalSchema,
  EDGE_WEIGHTS,
  GraphEdgeSchema,
  GraphNodeSchema,
  NodeTypeSchema,
  type ClinicalSignal,
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

// ── The inferential-layer schema (ONE Grok-call boundary) ─────────────────────
// The model returns the inferential layer: the graph (nodes/edges, no 'turn' nodes)
// AND the classified clinical signals[] — the VALIDATED META FORMAT that is the
// objective record. Each signal self-describes (kind/status/count/countBasis/severity/
// confidence/basis/evidence) so the count is the model's justified judgment, never a
// regex guess — and a single mention can never silently inflate to many.
const InferenceSchema = z.object({
  nodes: z.array(GraphNodeSchema),
  edges: z.array(GraphEdgeSchema),
  signals: z.array(ClinicalSignalSchema),
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

CLINICAL SIGNALS — output as \`signals[]\`, the OBJECTIVE RECORD in a validated meta format. Emit one classified signal per distinct clinical pattern the turns evidence. Each MUST carry enough semantics to classify it WITHOUT guessing:
- id: stable slug 'sig:<kind>' (e.g. 'sig:panic_attack') so a re-mention merges.
- kind: panic_attack | self_harm | ideation | sleep_disturbance | somatic | other.
- label: a short human phrase.
- status: 'stated' (they said it outright) or 'inferred' (you concluded it).
- basis: the EXACT evidence + reasoning for the classification AND the count — quote their words (e.g. "user said 'panic every day this week'").
- count + countBasis: 'single-mention' → count 1 (said once — DO NOT inflate); 'recurring-pattern' → they described a recurrence ("every day", "after every session") so count the days implied, capped at 7; 'explicit-number' → they gave a number.
- severity: 0-10 only if they expressed intensity, else null. timeframe: their words ("this week") or null.
- confidence: high | medium | low. evidenceTurnIds: the turns it came from.
THE NO-INFLATION RULE (hard): a single mention is ALWAYS count 1 / 'single-mention'. A number > 1 requires recurrence language quoted in basis. Never output a number you cannot defend in basis. Scratching mentioned once is count 1, not 6.

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

  // 2 + 3. Infer all new windows CONCURRENTLY — each window is one model call and is
  //   the dominant cost of the close, so we fan them out instead of awaiting serially.
  //   (They each read the same starting graph, so cross-window id reuse is looser, but
  //   the store merges by stable slug id — "symptom:insomnia" etc. — so the same
  //   concept still converges to one node.) 4. then merge in window order.
  const windows = slidingWindows(newMessages);
  const inferences = await Promise.all(windows.map((w) => inferWindow(userId, w)));
  for (const inference of inferences) mergeInference(userId, inference);

  // 5. The OBJECTIVE RECORD = the model's classified clinical signals (the validated
  //    meta format), merged by id (max count, union evidence). No regex, no silent
  //    inflation: every count carries the countBasis + basis that justifies it.
  store.upsertSignals(
    userId,
    inferences.flatMap((i) => i.signals),
  );

  // SAFETY BACKSTOP — risk must NEVER depend on model whim. If the person's own words
  // carry a crisis cue but the inferential pass missed the risk_signal, guarantee it
  // (+ an ideation signal) deterministically. (The per-turn 988 gate is separate.)
  ensureRiskCaptured(userId, newMessages);

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
      `Extract the inferential layer — the GRAPH (symptoms, events, timeframes, people, ` +
      `triggers, coping, the subjective-claim vs objective-fact split with minimizes/` +
      `contradicts, risk signals) AND the classified clinical signals[] (kind / status / ` +
      `count + countBasis / severity / confidence / basis). Conservative + evidence-only; ` +
      `never inflate a count past what its basis can justify (one mention = count 1).`,
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

// ── Safety backstop: risk is deterministic, never model-dependent ─────────────
// The model SHOULD surface risk, but a missed crisis cue is the worst failure here.
// So we also scan the person's OWN words and, if a cue fired, GUARANTEE the matching
// classified signal (self-harm and/or ideation) + a risk_signal node — even if the
// model missed it. Cues are split so the classification is precise, not lumped.
// Lenient by design — safety errs toward the human, never away; never a verdict.
const SELF_HARM_CUES =
  /scratch\w*[^.]{0,24}(arm|skin|myself|raw)|cut(ting)? myself|hurt(ing)? myself|harm(ing)? myself|self.?harm|marks? on my/i;
const IDEATION_CUES =
  /sleep forever|want to (die|disappear)|don'?t want to (be here|wake up|live|exist)|end it all|kill myself|suicid|better off (dead|without me)|no reason to live|can'?t go on/i;

function ensureRiskCaptured(userId: string, newMessages: Message[]): void {
  const userTurns = newMessages.filter((m) => m.role === 'user');
  const shTurns = userTurns.filter((m) => SELF_HARM_CUES.test(m.content));
  const idTurns = userTurns.filter((m) => IDEATION_CUES.test(m.content));
  if (shTurns.length === 0 && idTurns.length === 0) return;
  const allEvidence = [...new Set([...shTurns, ...idTurns].map((m) => turnNodeId(m.id)))];

  if (!store.getGraph(userId).nodes.some((n) => n.type === 'risk_signal')) {
    store.upsertNodes(userId, [
      {
        id: 'risk:crisis-cue',
        type: 'risk_signal',
        name: 'crisis cue in their words',
        summary:
          'the person used language signalling possible self-harm or wanting to escape; surfaced for a human, never a verdict.',
        tags: ['risk', 'safety'],
        salience: 'high',
        panel: 'risk',
        evidenceTurnIds: allEvidence,
      },
    ]);
  }

  const guaranteed: ClinicalSignal[] = [];
  if (shTurns.length > 0 && !store.getSignals(userId).some((s) => s.kind === 'self_harm')) {
    guaranteed.push({
      id: 'sig:self_harm',
      kind: 'self_harm',
      label: 'self-harm (e.g. arm-scratching to self-calm)',
      status: 'stated',
      basis: "the person's own words named a self-harm behavior (deterministic safety backstop)",
      count: 1, // single-mention; the model raises it only with quoted recurrence
      countBasis: 'single-mention',
      severity: null,
      timeframe: null,
      confidence: 'high',
      evidenceTurnIds: shTurns.map((m) => turnNodeId(m.id)),
    });
  }
  if (idTurns.length > 0 && !store.getSignals(userId).some((s) => s.kind === 'ideation')) {
    guaranteed.push({
      id: 'sig:ideation',
      kind: 'ideation',
      label: 'expressed wanting to escape / not be here',
      status: 'stated',
      basis: "the person's own words carried an ideation cue (deterministic safety backstop)",
      count: 1,
      countBasis: 'single-mention',
      severity: null,
      timeframe: null,
      confidence: 'high',
      evidenceTurnIds: idTurns.map((m) => turnNodeId(m.id)),
    });
  }
  if (guaranteed.length > 0) store.upsertSignals(userId, guaranteed);
}

