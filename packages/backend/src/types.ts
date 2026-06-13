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
