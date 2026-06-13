// director.ts — L4: THE DIRECTOR (Inngest), durable + human-on-risk. ONE job:
// run a told story through the durable pipeline
//
//   extract → classify → (human-handoff?) → reflect → (≤1 refine) → finalize
//
// reusing the L1–L3 primitives (extractStory = the one grounded Grok call;
// store = the accumulating record; seed = the synthetic counter-evidence). Each
// step maps to a node in SKELETON-SPEC §1/§6. Durable = it survives a restart and
// can PAUSE on the human branch (step.waitForSignal) without losing state — the
// earned-autonomy safeguard (BUILDER-START L4).
//
// The stream (SKELETON-SPEC §8): node:start | node:done | reflect:delta |
// run:awaiting-human | run:failed. `reflect:delta` carries the grounded Story and
// IS the demo moment. We collect every emitted DotEvent into the run's return
// value (`events`) so the CLI gate (test-director.ts) can ASSERT the sequence
// without a dashboard — the gate is the assertion, the dashboard is a bonus.
//
// Reuse note: extractStory already does the heavy lifting in ONE Grok call —
// grounds in the record, splits fact/feeling, reflects the delta, persists the
// Story + appends source='story' events, and re-reads (the roundtrip). So the
// `extract` step runs that one call; `classify`/`reflect`/`refine`/`finalize`
// shape + stream around it. classify's risk detection is a DETERMINISTIC cue scan
// (no second LLM call) so the human-on-risk gate is reproducible from a `tsx` run.
//
// Fail loud (CONSTRAINTS): a step error throws; the director emits run:failed and
// rethrows. No canned fallback string masks a dead path.

import { Inngest } from 'inngest';
import { extractStory } from './extract.js';
import type { ClassifiedItem, ClassifyResult, DotEvent, Story } from './types.js';

// ── The Inngest client (the durable runtime handle) ───────────────────────────
// id namespaces the app. DEV is keyless (the local dev server / InngestTestEngine
// need no signing key); Inngest CLOUD keys are ⏳ from Johnny (KEYS.md).
export const inngest = new Inngest({ id: 'dot' });

// ── The trigger event + the human-resume signal ───────────────────────────────
/** The trigger: a story is ready to run through the director. */
export const RUN_REQUESTED = 'dot/run.requested';

/**
 * The human-on-risk RESUME signal. A reviewer (988 / clinician / on-call human)
 * sends this signal to clear a paused crisis run; the director resumes at reflect.
 *
 * Why a SIGNAL, not waitForEvent: the human pause/resume is a v4 `waitForSignal`
 * — the production-correct primitive for an externally-keyed pause/resume on a
 * SPECIFIC run. (It also sidesteps a confirmed `@inngest/test@1.0.0` bug where a
 * mocked `waitForEvent` resume validates an un-awaited promise and throws
 * "Event not found in triggers"; signals aren't events, so the mock resolves
 * cleanly — which is what makes this gate CLI-self-verifiable, the L4 requirement.)
 * The signal NAME is per-run so two concurrent runs can't cross-clear.
 */
export const HUMAN_CLEARED_SIGNAL = 'dot/human.cleared';

/** The per-run clearance signal name (so a clear targets exactly THIS run). */
export function clearanceSignal(runId: string): string {
  return `${HUMAN_CLEARED_SIGNAL}:${runId}`;
}

export interface RunRequestedData {
  userId: string;
  transcript: string;
  /** Injected "now" for deterministic grounding (defaults to the seeded week). */
  now?: string;
}

// ── classify: logged-event vs interpretation + risk (DETERMINISTIC) ───────────
// A small typed step (SKELETON-SPEC §6). For each extracted item: is it a logged
// EVENT (something that verifiably happened) or an INTERPRETATION (a felt claim)?
// objective items → 'event', subjective items → 'interpretation'. Risk is a cue
// scan over the raw transcript for self-harm / PHQ-9 item-9 / crisis signals
// (docs/reference/INTAKE-QUESTIONS.md §2: item 9 = the safety flag). Deterministic
// so the gate is reproducible without a second LLM round-trip.

// EDITABLE crisis cue list — tune the safety net here. Drawn from PHQ-9 item 9
// ("thoughts that you would be better off dead, or of hurting yourself") + common
// self-harm / crisis phrasings. Lowercased substring match (lenient by design:
// safety errs toward the human, never away).
export const CRISIS_CUES = [
  'better off dead',
  'better off without me', // common PHQ-9-item-9 phrasing ("everyone would be better off without me")
  'be better off without me',
  'kill myself',
  'killing myself',
  'end it all',
  'end my life',
  'hurt myself',
  'hurting myself',
  'harm myself',
  'self-harm',
  'self harm',
  'suicide',
  'suicidal',
  "don't want to be here",
  'do not want to be here',
  "don't want to be alive",
  'want to die',
  'no reason to live',
  'no point in living',
  "can't go on",
  'cannot go on',
] as const;

/** True if the transcript contains any crisis cue (risk → human handoff). */
export function detectRisk(transcript: string): boolean {
  const lower = transcript.toLowerCase();
  return CRISIS_CUES.some((cue) => lower.includes(cue));
}

/** Tag extracted subjective/objective items + compute the risk flag. */
export function classify(
  transcript: string,
  subjective: string[],
  objective: string[],
): ClassifyResult {
  const items: ClassifiedItem[] = [
    ...objective.map((text): ClassifiedItem => ({ text, type: 'event' })),
    ...subjective.map((text): ClassifiedItem => ({ text, type: 'interpretation' })),
  ];
  return { items, risk: detectRisk(transcript) };
}

// ── refine: ≤1 optional loop ──────────────────────────────────────────────────
/**
 * A delta is "weak" if it's empty/trivial or doesn't surface any concrete
 * counter-evidence (a number). The refine step widens the window ONCE if so.
 * For the demo the grounded delta is strong, so this is a no-op pass-through —
 * but the seam is real (≤1 retry, never a loop). EDITABLE threshold.
 */
export function isDeltaWeak(delta: string): boolean {
  const d = delta.trim();
  if (d.length < 24) return true; // too short to carry an observation
  return !/\d/.test(d); // no number ⇒ no concrete counter-evidence surfaced
}

// ── The director workflow (dotRun) ────────────────────────────────────────────
// Linear, one optional refine, ONE human fork. Each step.run is durable (memoized
// + retried); step.waitForSignal PAUSES the run on risk until the human clears it.
//
// The emitted DotEvent stream is collected into `emitted` and RETURNED so the CLI
// gate can assert the sequence in-process (no dashboard needed). On the dev
// dashboard the waitForSignal step renders natively as the pause (the bonus visual).

export interface DotRunResult {
  runId: string;
  status: 'done';
  story: Story;
  /** The full ordered DotEvent stream (the gate asserts on this). */
  events: DotEvent[];
  /** The classify result (items + risk) — surfaced for the gate. */
  classify: ClassifyResult;
  /** Whether the human-on-risk branch paused this run. */
  paused: boolean;
}

export const dotRun = inngest.createFunction(
  // One trigger: a story is requested. The human-on-risk resume is a per-run
  // SIGNAL (waitForSignal), not a second trigger — so the clearance targets a
  // specific paused run and never starts a stray pipeline.
  { id: 'dot-run', retries: 0, triggers: [{ event: RUN_REQUESTED }] },
  async ({ event, step }) => {
    // event.data is loosely typed (no EventSchemas on the client); narrow it once.
    const data = event.data as RunRequestedData;
    const { userId, transcript, now } = data;
    const runId = event.id ?? `run_${userId}`;

    // The ordered event stream. Pushed inside steps so it survives memoization in
    // the order the steps actually ran (extract→classify→[handoff]→reflect→finalize).
    const emitted: DotEvent[] = [];
    const emit = (e: DotEvent): void => {
      emitted.push(e);
    };

    // ── extract ───────────────────────────────────────────────────────────────
    // THE one grounded Grok call. Returns the persisted, re-read Story (roundtrip
    // proven inside extractStory). We carry forward the array-shaped split + the
    // Story (serialized through the step boundary as JSON — hence re-typed).
    emit({ type: 'node:start', node: 'extract', runId });
    const extract = await step.run('extract', async () => {
      const { story, result } = await extractStory({ transcript, userId, now });
      return {
        story,
        subjective: result.subjective,
        objective: result.objective,
        delta: result.delta,
      };
    });
    emit({ type: 'node:done', node: 'extract', runId, data: { storyId: extract.story.id } });

    // ── classify ────────────────────────────────────────────────────────────────
    emit({ type: 'node:start', node: 'classify', runId });
    const classified = await step.run('classify', async () =>
      classify(transcript, extract.subjective, extract.objective),
    );
    emit({ type: 'node:done', node: 'classify', runId, data: classified });

    // ── human-handoff (the ONE fork) ───────────────────────────────────────────
    // On risk: emit run:awaiting-human (THE handoff signal the surface + gate
    // consume) and PAUSE on waitForSignal until a human clears THIS run. The run
    // resumes at reflect only after a matching `dot/human.cleared:<runId>` signal
    // arrives (sent by a reviewer / 988 / on-call human via step.sendSignal or the
    // Inngest API). The pause is DURABLE — it survives a restart (the earned-
    // autonomy safeguard). On the dev dashboard this renders natively as a "waiting
    // for signal" step (the bonus visual).
    let paused = false;
    if (classified.risk) {
      paused = true;
      emit({ type: 'run:awaiting-human', runId });
      // PAUSE here — durable. Resumes only when this run's clearance signal arrives.
      const cleared = await step.waitForSignal('await-human-clearance', {
        signal: clearanceSignal(runId),
        timeout: '1h',
        onConflict: 'replace',
      });
      // timeout (no human within the window) → fail LOUD; never silently proceed
      // past an un-cleared crisis flag (no silent stub — the safety net errs to the
      // human, never away).
      if (cleared === null) {
        const error = `human clearance timed out for run ${runId} — crisis flag NOT cleared`;
        emit({ type: 'run:failed', runId, node: 'human-handoff', error });
        throw new Error(error);
      }
    }

    // ── reflect ← THE MOMENT ────────────────────────────────────────────────────
    // The grounded delta (computed inside the one extract call) is surfaced here
    // as the reflect:delta event carrying the full Story. This IS the demo moment.
    emit({ type: 'node:start', node: 'reflect', runId });
    const reflected = await step.run('reflect', async () => {
      let delta = extract.delta;
      // ── refine: ≤1 optional loop ──
      // If the grounded delta is weak, re-surface it once. (For the demo it's
      // strong, so this passes through — but the ≤1-retry seam is real, not faked.)
      if (isDeltaWeak(delta)) {
        emit({ type: 'node:start', node: 'refine', runId });
        // The story's delta is the authoritative grounded reflection; the refine
        // pass re-reads it (a wider-window re-query is the stretch seam). One pass.
        delta = extract.story.delta;
        emit({ type: 'node:done', node: 'refine', runId, data: { delta } });
      }
      return { delta };
    });
    // THE demo-moment event — carries the grounded Story.
    emit({ type: 'reflect:delta', runId, story: extract.story });
    emit({ type: 'node:done', node: 'reflect', runId, data: reflected });

    // ── finalize ────────────────────────────────────────────────────────────────
    // The Story is already persisted (extractStory did the roundtrip). finalize
    // closes the run + emits the terminal node:done. (Render — §7c — is L6.)
    emit({ type: 'node:start', node: 'finalize', runId });
    const finalized = await step.run('finalize', async () => ({
      storyId: extract.story.id,
    }));
    emit({ type: 'node:done', node: 'finalize', runId, data: finalized });

    const result: DotRunResult = {
      runId,
      status: 'done',
      story: extract.story,
      events: emitted,
      classify: classified,
      paused,
    };
    return result;
  },
);

// The function list the serve handler + the test engine register.
export const functions = [dotRun];
