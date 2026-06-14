// run.ts — the L6 reflection payload. ONE job: run the one grounded pipeline call
// and shape its result into the typed object the conversation surface renders, beat
// for beat (DEMO-SCRIPT [1:00]): validate-first → subjective[] → objective[] → the
// DELTA (the catch) → the stat aggregates → the provider report.
//
// Every field below maps to a REAL Story/Event/store read — NO invented data
// (CONTRACTS discipline). The Story comes from extractStory (the one Grok call,
// grounded in the seeded record, roundtrip-proven). The stat aggregates come from
// store.statSheet (a GROUP BY over `events`). The provider report is the SOAP
// Subjective/Objective split ONLY — DOT never authors Assessment or Plan
// (PROVIDER-REPORT.md §4: that boundary IS the guardrail).
//
// Fail loud (CONSTRAINTS): a model/store error throws — no canned fallback masks a
// dead path. Silence is never faked into a reflection.

import { extractStory } from './extract.js';
import { store } from './store.js';
import { seedDemoUser, SEED_NOW, DEMO_USER_ID } from './seed.js';
import { REASONING_MODEL } from './grok.js';
import type { Story } from './types.js';

// ── EDITABLE demo COPY (the same spiral as the L2/L3/L4 gates) ────────────────
// Leave story COPY in clearly-marked consts so Johnny tunes content after the
// skeleton runs. This is the [1:00] CATCH transcript from DEMO-SCRIPT.
export const DEMO_SPIRAL =
  'Today was awful. My friends barely replied, I\'m always the one reaching out, ' +
  "they're probably tired of me. My chest was tight all afternoon. I feel like I'm " +
  'falling apart and everyone can see it.';

// ── The window for the stat aggregates (the demo's "this week") ───────────────
const STAT_WINDOW_DAYS = 7;

// ── Human-readable labels for the stat-sheet kinds (the provider-facing names) ─
// Maps the raw `events.kind` vocabulary to the words the stat bubbles + report
// show. A kind without a label still renders (falls back to the raw kind) — no
// silent drop. EDITABLE.
const KIND_LABELS: Record<string, string> = {
  panic_attack: 'panic attacks logged',
  self_harm: 'self-harm events logged',
  sleep_hours: 'nights of sleep logged',
  ideation: 'ideation signals logged',
  story_fact: 'facts from this story',
};

// ── Types (the L6 reflection contract the frontend imports) ───────────────────

/** One aggregate line for the stat bubbles + the provider objective record. */
export interface StatAggregate {
  kind: string; // the raw events.kind (open vocabulary)
  label: string; // the human-readable name (KIND_LABELS, or the kind itself)
  count: number; // GROUP BY count over events in the window
  window: string; // e.g. '7d'
}

/** The provider report — SOAP Subjective/Objective ONLY (never A/P). */
export interface ReportSO {
  /** Header line — states the guardrail plainly (PROVIDER-REPORT.md §3). */
  header: string;
  preparedFor: string; // the patient name
  date: string; // the report date (the story's createdAt)
  /** S — what the patient FELT / reported (from story.subjective). */
  subjective: string[];
  /** O — counted, measurable facts (from story.objective + the stat aggregates). */
  objective: string[];
}

/** The full reflection payload — what the conversation surface renders, in order. */
export interface Reflection {
  /** The persisted Story (the glass dot) — the spine, re-read from the store. */
  story: Story;
  /** The validate-first line (DEMO-SCRIPT beat 1: "the chest tightness is real"). */
  feelingValidation: string;
  /** The stat aggregates — GROUP BY over events (the objective counter-evidence). */
  stats: StatAggregate[];
  /** The provider report — SOAP S/O split only, with the not-a-diagnosis header. */
  report: ReportSO;
  /** Which model produced the split (surfaced so the UI can name the real engine). */
  model: string;
}

// ── The stat aggregates (real GROUP BY over events) ───────────────────────────

/** Build the stat aggregates from the store's stat-sheet view (a real read). */
export function buildStats(userId: string, now: string): StatAggregate[] {
  return store
    .statSheet(userId, { sinceDays: STAT_WINDOW_DAYS, now })
    .map((line) => ({
      kind: line.kind,
      label: KIND_LABELS[line.kind] ?? line.kind.replace(/_/g, ' '),
      count: line.count,
      window: line.window,
    }));
}

// ── The provider report (SOAP S/O only) ───────────────────────────────────────

/**
 * Build the provider report from a persisted Story + the stat aggregates. SOAP
 * Subjective = story.subjective (what they felt); Objective = story.objective
 * (the counted facts) plus the windowed aggregates rendered as dated counts.
 * DOT NEVER authors Assessment or Plan — those are the clinician's (the guardrail).
 */
export function buildReport(story: Story, stats: StatAggregate[]): ReportSO {
  const dateLabel = story.createdAt.slice(0, 10); // YYYY-MM-DD

  // Objective = the story's extracted facts + the measurable aggregates, deduped.
  // The aggregates render as the dated "counted signs" SOAP's O column wants.
  const aggregateLines = stats
    // story_fact aggregates duplicate story.objective; skip them in the O column.
    .filter((s) => s.kind !== 'story_fact')
    .map((s) => `${s.label}: ${s.count} (last ${s.window})`);

  return {
    header: 'DOT SUMMARY — patient-generated · not a medical record · not a diagnosis',
    preparedFor: store.getUser(story.userId)?.name ?? story.userId,
    date: dateLabel,
    subjective: story.subjective,
    objective: [...story.objective, ...aggregateLines],
  };
}

// ── The one call (the whole L6 payload) ───────────────────────────────────────

export interface RunStoryInput {
  /** The told story (defaults to the demo spiral). */
  transcript?: string;
  /** The user (defaults to the seeded demo user). */
  userId?: string;
  /** Injected "now" for deterministic grounding (defaults to the seeded week). */
  now?: string;
}

/**
 * runStory — the L6 entry. Ensures the demo user + synthetic record exist, runs
 * the ONE grounded Grok call, and shapes the full Reflection the surface renders.
 *
 * Idempotent seeding: seedDemoUser() is stable-id so re-running never duplicates
 * the counter-evidence. Fail loud — a model/store error throws.
 */
export async function runStory(input: RunStoryInput = {}): Promise<Reflection> {
  const userId = input.userId ?? DEMO_USER_ID;
  const now = input.now ?? SEED_NOW;
  const transcript = input.transcript ?? DEMO_SPIRAL;

  // Ensure the synthetic record exists before the reflect call has something to
  // reflect against (a real, documented seed — not a silent stub).
  if (userId === DEMO_USER_ID) seedDemoUser();

  // THE one grounded Grok call (grounds in the record, splits fact/feeling,
  // reflects the delta, persists the Story, re-reads it — the roundtrip proof).
  const { result, story } = await extractStory({ transcript, userId, now });

  const stats = buildStats(userId, now);
  const report = buildReport(story, stats);

  return buildReflection({ story, feelingValidation: result.feeling_validation, stats, report });
}

/** Assemble the Reflection from its parts (pure — exported for testability). */
export function buildReflection(parts: {
  story: Story;
  feelingValidation: string;
  stats: StatAggregate[];
  report: ReportSO;
}): Reflection {
  return {
    story: parts.story,
    feelingValidation: parts.feelingValidation,
    stats: parts.stats,
    report: parts.report,
    // Surfaced so the UI can name the real engine (no faked provenance).
    model: REASONING_MODEL,
  };
}
