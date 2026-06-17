// types.ts — DOT's typed contracts. One source of truth for every shape that
// crosses a node boundary or the store. The S0 contract per BUILDER-START /
// SCOPE-LOCK: a Story is the {subjective, objective, delta} spine (one glass
// dot); an Event is one row in the accumulating OBJECTIVE record.
//
// Note: this S0 contract types `subjective`/`objective` as string[] (a list of
// discrete felt-claims / discrete facts) — the granular shape the extractor and
// the timeline render against. SKELETON-SPEC §8's single-string variant is the
// later collapse; this file is the authoritative shape for the backend core.

import { z } from 'zod';

// ── The story (one row in `stories` = one glass dot) ──────────────────────────
export const StorySchema = z.object({
  id: z.string(),
  userId: z.string(),
  transcript: z.string(), // the raw told story
  subjective: z.array(z.string()), // what they FELT / claimed  ("my friends hate me")
  objective: z.array(z.string()), // what verifiably HAPPENED   (extracted facts)
  delta: z.string(), // the gap, framed neutrally   ("they texted you 50x this week")
  timeline: z.array(z.string()).optional(), // ordered moments, if reconstructed
  createdAt: z.string(), // ISO
});
export type Story = z.infer<typeof StorySchema>;

// ── The objective record + synthetic data (rows in `events`) ──────────────────
// `kind` is OPEN vocabulary (not a SQL enum) so a new connector adds kinds
// without a migration. `source` is the connector registry — 'story' for facts
// DOT extracted, 'synthetic' for the seeded counter-evidence.
export const EventSourceSchema = z.enum(['story', 'synthetic']);
export type EventSource = z.infer<typeof EventSourceSchema>;

export const EventSchema = z.object({
  id: z.string(),
  userId: z.string(),
  kind: z.string(), // 'message_received' | 'call' | 'panic_attack_logged' | 'calendar' | ...
  label: z.string().optional(), // human-readable ("text from Sam")
  value: z.union([z.number(), z.string()]).optional(), // optional magnitude
  source: EventSourceSchema, // 'story' (DOT-extracted) | 'synthetic' (seeded)
  ts: z.string(), // ISO
});
export type Event = z.infer<typeof EventSchema>;

// ── The extractor boundary lives in extract.ts ────────────────────────────────
// The ONE canonical fact/feeling/delta split schema is `ExtractResultSchema` in
// extract.ts (it carries feeling_validation + the split + delta). There is no
// second extractor shape here — one boundary, no drift.

// ── The director boundary (L4 — SKELETON-SPEC §8) ─────────────────────────────
// The durable director (`dotRun`, Inngest) flows an accumulating run through
// extract → classify → reflect → (≤1 refine) → finalize, with ONE human fork on
// risk. These are the shapes that cross its step boundaries + the live stream the
// frontend routes into the conversation surface. (Backend variant: extract/reflect
// reuse the array-shaped ExtractResult from extract.ts, not §8's single-string
// collapse — one source of truth, no drift.)

/** One extracted item, tagged logged-event vs interpretation (the classify step). */
export const ClassifiedItemSchema = z.object({
  text: z.string(),
  type: z.enum(['event', 'interpretation']),
});
export type ClassifiedItem = z.infer<typeof ClassifiedItemSchema>;

/** The classify step's output: each item tagged + the risk flag (the human fork). */
export const ClassifyResultSchema = z.object({
  items: z.array(ClassifiedItemSchema),
  risk: z.boolean(), // true → self-harm / PHQ-9 item-9 / crisis cue → human handoff
});
export type ClassifyResult = z.infer<typeof ClassifyResultSchema>;

/** Run status: the four states the director surfaces (one is the human pause). */
export const DotRunStatusSchema = z.enum(['running', 'awaiting-human', 'done', 'failed']);
export type DotRunStatus = z.infer<typeof DotRunStatusSchema>;

/**
 * The accumulating director context — flows through `dotRun`, returned at the end.
 * Each optional slot fills as its step completes (extract → classify → reflect →
 * story). `story` is the grounded glass dot; it IS the output.
 */
export interface DotRun {
  id: string;
  userId: string;
  transcript: string; // input
  extract?: { subjective: string[]; objective: string[] };
  classify?: ClassifyResult;
  reflect?: { delta: string };
  story?: Story; // output (the glass dot)
  status: DotRunStatus;
}

/**
 * The live event stream the director emits. The frontend routes each into the
 * conversation surface. `reflect:delta` carries the full grounded Story and IS the
 * demo moment; `run:awaiting-human` renders the handoff pause; `run:failed` fails
 * LOUD into a visible FAILED badge (no silent stub).
 */
export type DotEvent =
  | { type: 'node:start'; node: string; runId: string }
  | { type: 'node:done'; node: string; runId: string; data: unknown }
  | { type: 'reflect:delta'; runId: string; story: Story } // ← THE demo-moment event
  | { type: 'run:awaiting-human'; runId: string } // human-on-risk branch (pause)
  | { type: 'run:failed'; runId: string; node: string; error: string };

// ── The knowledge graph (the LIVE conversational intake substrate) ────────────
// A live intake turns the thread into a graph: every turn is a node, and each
// claim/symptom/event/person the user surfaces is its own node, edged back to the
// turn(s) it was said in. The graph IS what the five intake panels render against
// (symptoms / timeline / two-truths / risk / context). One typed id per node so a
// re-mention MERGES (no duplicate 'symptom:insomnia'); edges carry the evidence so
// every line is traceable back to a real turn.

/** The kinds of node the graph holds. Open-ended in spirit, fixed here so the
 *  panels know what to draw. 'turn' is the conversation spine; the rest are
 *  extracted concepts that hang off the turns they were said in. */
export const NODE_TYPES = [
  'turn',
  'person',
  'symptom',
  'event',
  'timeframe',
  'claim_subjective',
  'fact_objective',
  'trigger',
  'coping',
  'risk_signal',
] as const;
export const NodeTypeSchema = z.enum(NODE_TYPES);
export type NodeType = z.infer<typeof NodeTypeSchema>;

/** Which intake panel a node belongs on. The graph is sliced by panel for render. */
export const PanelSchema = z.enum(['symptoms', 'timeline', 'two-truths', 'risk', 'context']);
export type Panel = z.infer<typeof PanelSchema>;

/** How loud a node is. Drives sizing/ordering on its panel; merge keeps the higher. */
export const SalienceSchema = z.enum(['low', 'med', 'high']);
export type Salience = z.infer<typeof SalienceSchema>;

/** One node in the graph. `id` is typed (e.g. 'symptom:insomnia') so a re-mention
 *  merges in place; `evidenceTurnIds` are the turns that grounded it. */
export const GraphNodeSchema = z.object({
  id: z.string(), // typed id, e.g. 'symptom:insomnia' — the merge key
  type: NodeTypeSchema,
  name: z.string(), // short display label
  summary: z.string(), // one sentence
  tags: z.array(z.string()),
  salience: SalienceSchema,
  panel: PanelSchema,
  evidenceTurnIds: z.array(z.string()), // turn node ids that grounded this node
});
export type GraphNode = z.infer<typeof GraphNodeSchema>;

/** The kinds of edge the graph holds (how concepts relate / the objective-mirror
 *  relations: minimizes, contradicts, escalates...). */
export const EDGE_TYPES = [
  'said_in',
  'experiences',
  'minimizes',
  'contradicts',
  'caused_by',
  'occurred_on',
  'escalates',
  'relieves',
  'co_occurs',
] as const;
export const EdgeTypeSchema = z.enum(EDGE_TYPES);
export type EdgeType = z.infer<typeof EdgeTypeSchema>;

/** Default confidence per edge kind — a prior the extractor can lean on / override.
 *  Higher = a relation we trust more when we draw the line. */
export const EDGE_WEIGHTS: Record<EdgeType, number> = {
  said_in: 1,
  experiences: 0.8,
  minimizes: 0.8,
  contradicts: 0.9,
  caused_by: 0.8,
  occurred_on: 0.7,
  escalates: 0.9,
  relieves: 0.6,
  co_occurs: 0.5,
};

/** One edge: a typed, weighted, evidence-backed relation between two node ids. */
export const GraphEdgeSchema = z.object({
  source: z.string(), // node id
  target: z.string(), // node id
  type: EdgeTypeSchema,
  direction: z.enum(['forward', 'bidirectional']),
  weight: z.number().min(0).max(1), // 0..1 confidence; merge keeps the higher
  evidenceTurnIds: z.array(z.string()),
});
export type GraphEdge = z.infer<typeof GraphEdgeSchema>;

// ── The CLASSIFIED CLINICAL SIGNAL — the validated meta format ─────────────────
// The objective record is NOT a regex count. The model emits one fully-classified
// signal per clinical pattern, carrying enough semantics that any reader (the report,
// a clinician) can classify it WITHOUT guessing: what it is, whether the person STATED
// it or DOT INFERRED it, how the count was derived, how severe, how sure, and which
// turns ground it. This is the no-silent-inflation contract — a count of 1 with
// countBasis 'single-mention' can never masquerade as 6, and every number says WHY.
export const SIGNAL_KINDS = [
  'panic_attack',
  'self_harm',
  'ideation',
  'sleep_disturbance',
  'somatic',
  'other',
] as const;
export const SignalKindSchema = z.enum(SIGNAL_KINDS);
export type SignalKind = z.infer<typeof SignalKindSchema>;

export const ClinicalSignalSchema = z.object({
  /** Stable id so a re-mention MERGES instead of duplicating, e.g. 'sig:panic_attack'. */
  id: z.string(),
  kind: SignalKindSchema, // the classification
  label: z.string(), // a short human phrase ("panic before study group")
  status: z.enum(['stated', 'inferred']), // did they SAY it, or did DOT infer it
  basis: z.string(), // the evidence/reasoning for the classification + the count
  count: z.number().int().min(0), // occurrences in the window
  countBasis: z.enum(['single-mention', 'recurring-pattern', 'explicit-number']), // HOW the count was derived
  severity: z.number().min(0).max(10).nullable(), // 0-10 if expressed, else null
  timeframe: z.string().nullable(), // "this week", "every morning", or null
  confidence: z.enum(['high', 'medium', 'low']), // how sure the classification is
  evidenceTurnIds: z.array(z.string()), // the turns that ground it (traceable)
});
export type ClinicalSignal = z.infer<typeof ClinicalSignalSchema>;

/** The whole graph for one user — what the intake panels read. */
export const GraphSchema = z.object({
  nodes: z.array(GraphNodeSchema),
  edges: z.array(GraphEdgeSchema),
});
export type Graph = z.infer<typeof GraphSchema>;

// ── Conversation lifecycle (when the intake is live vs wrapping up vs done) ────
// One open conversation per user. The graph is built incrementally as turns land;
// `lastChunkedTurnId` marks how far the chunker has consumed so re-runs are cheap.

export const ConversationStatusSchema = z.enum(['open', 'closing', 'closed']);
export type ConversationStatus = z.infer<typeof ConversationStatusSchema>;

export const ConversationMetaSchema = z.object({
  userId: z.string(),
  status: ConversationStatusSchema,
  openedAt: z.string(), // ISO
  closedAt: z.string().optional(), // ISO
  turnCount: z.number(),
  closeReason: z.string().optional(),
  lastChunkedTurnId: z.string().optional(), // graph-build watermark
});
export type ConversationMeta = z.infer<typeof ConversationMetaSchema>;

// ── The check-in plan (the timer) ─────────────────────────────────────────────
// On close, the intake schedules forward check-ins: a prompt to send later, the
// node/concern it's WATCHING, and why. `getDueCheckIns(now)` is the timer read.

export const CheckInStatusSchema = z.enum(['pending', 'sent', 'done', 'skipped']);
export type CheckInStatus = z.infer<typeof CheckInStatusSchema>;

export const CheckInSchema = z.object({
  id: z.string(),
  userId: z.string(),
  prompt: z.string(), // what DOT will say at check-in time
  watching: z.string(), // the node id / concern this check-in is tracking
  reason: z.string(), // why this check-in was scheduled
  scheduledFor: z.string(), // ISO — when it's due
  status: CheckInStatusSchema,
  createdAt: z.string(), // ISO
  sentAt: z.string().optional(), // ISO — set when it fires
});
export type CheckIn = z.infer<typeof CheckInSchema>;
