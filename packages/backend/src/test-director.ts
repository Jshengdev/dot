// test-director.ts — THE L4 GATE. Proves the durable director (Inngest) from ONE
// `tsx` run, NO dashboard required (the gate is the CLI assertion; the dev
// dashboard is a bonus visual — see the serve handler in serve-director.ts).
//
// Run:  pnpm --filter @dot/backend test:director
//
// It asserts, in-process via @inngest/test's InngestTestEngine:
//
//  PART A — the happy path (REAL Grok extract, grounded):
//    1. the steps ran in order: extract → classify → reflect → finalize,
//    2. the reflect:delta event fired carrying the grounded Story (THE moment),
//    3. the Story is grounded in the seeded counter-evidence (a distinctive count),
//    4. the run finalized (status 'done', not paused).
//
//  PART B — human-on-risk (mocked extract for speed/determinism):
//    5. a crisis input drives the run to 'awaiting-human' (it PAUSES at the wait),
//    6. then RESUMES and finalizes after the clearance signal arrives,
//    7. the resumed run emits the full sequence incl. run:awaiting-human + reflect:delta.
//
// This proves the durable steps + the human-on-risk pause/resume from a single
// command. A failure throws (no silent green). Johnny eyeballs the delta tone.

import { InngestTestEngine } from '@inngest/test';
import { dotRun, RUN_REQUESTED, clearanceSignal } from './director.js';
import { seedDemoUser, SEED_NOW, DEMO_USER_ID } from './seed.js';
import { REASONING_MODEL } from './extract.js';
import type { DotEvent, DotRun, Story } from './types.js';

// ── The result shape dotRun returns (mirror of DotRunResult in director.ts) ────
interface RunResult {
  runId: string;
  status: 'done';
  story: Story;
  events: DotEvent[];
  classify: { items: Array<{ text: string; type: string }>; risk: boolean };
  paused: boolean;
}

// ── EDITABLE demo COPY (same spiral as the L2/L3 gates) ───────────────────────
const SPIRAL_STORY =
  'Today was awful. My friends barely replied, I\'m always the one reaching out, ' +
  "they're probably tired of me. My chest was tight all afternoon. I feel like I'm " +
  'falling apart and everyone can see it.';

// A crisis input — contains a PHQ-9 item-9 / self-harm cue (drives the human fork).
const CRISIS_STORY =
  "Honestly I can't do this anymore. Some days I think everyone would be better off " +
  'without me. I just want it to stop.';

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`GATE FAILED: ${msg}`);
}

/** The node sequence from the emitted DotEvent stream (node:start markers, in order). */
function nodeOrder(events: DotEvent[]): string[] {
  return events.filter((e) => e.type === 'node:start').map((e) => (e as { node: string }).node);
}

/** Pretty one-line event trace for the console. */
function traceLine(events: DotEvent[]): string {
  return events
    .map((e) => ('node' in e && e.node ? `${e.type}(${e.node})` : e.type))
    .join(' -> ');
}

async function main(): Promise<void> {
  seedDemoUser();
  console.log(`model: ${REASONING_MODEL}`);
  console.log(`user:  ${DEMO_USER_ID}  (seeded)\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // PART A — the happy path, REAL grounded Grok extract.
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('══ PART A — happy path (real Grok extract, grounded) ════════════');
  const tA = new InngestTestEngine({ function: dotRun });
  const outA = await tA.execute({
    events: [
      {
        name: RUN_REQUESTED,
        id: 'run_A',
        data: { userId: DEMO_USER_ID, transcript: SPIRAL_STORY, now: SEED_NOW },
      },
    ],
  });
  const rA = outA.result as unknown as RunResult | undefined;
  assert(rA !== undefined, 'happy-path run produced no result (did it pause unexpectedly?)');
  const A = rA as RunResult;

  const orderA = nodeOrder(A.events);
  console.log(`steps ran:   ${orderA.join(' -> ')}`);
  console.log(`event trace: ${traceLine(A.events)}\n`);

  // 1. steps ran in the contracted order.
  assert(
    JSON.stringify(orderA) === JSON.stringify(['extract', 'classify', 'reflect', 'finalize']),
    `steps out of order — got [${orderA.join(', ')}], expected extract,classify,reflect,finalize`,
  );

  // also assert the durable step tools were actually invoked (ctx spies).
  const stepRunSpy = outA.ctx?.step?.run as { mock?: { calls?: unknown[][] } } | undefined;
  const runStepIds = (stepRunSpy?.mock?.calls ?? []).map((c) => c[0]);
  console.log(`step.run() calls: ${JSON.stringify(runStepIds)}`);
  assert(
    ['extract', 'classify', 'reflect', 'finalize'].every((id) => runStepIds.includes(id)),
    `not all durable steps invoked via step.run — saw [${runStepIds.join(', ')}]`,
  );

  // 2. the reflect:delta event fired, carrying the grounded Story.
  const delta = A.events.find((e) => e.type === 'reflect:delta') as
    | { type: 'reflect:delta'; runId: string; story: Story }
    | undefined;
  assert(delta !== undefined, 'reflect:delta event did NOT fire (THE moment is missing)');
  const story = (delta as { story: Story }).story;
  console.log('\n── reflect:delta (THE moment) — the grounded Story ─────────────');
  console.log(`  subjective: ${JSON.stringify(story.subjective)}`);
  console.log(`  objective:  ${JSON.stringify(story.objective)}`);
  console.log(`  delta:      ${story.delta}\n`);
  assert(story.subjective.length > 0, 'reflect:delta Story has no subjective claims');
  assert(story.objective.length > 0, 'reflect:delta Story has no objective facts');
  assert(story.delta.trim().length > 0, 'reflect:delta Story has an empty delta');

  // 3. grounded in the seeded counter-evidence (>=1 distinctive seeded count).
  const haystack = (story.delta + ' ' + story.objective.join(' ')).toLowerCase();
  const distinctive = ['48', '19', '12'].filter((n) => haystack.includes(n));
  console.log(`grounding: delta/objective cites distinctive seeded count(s) [${distinctive.join(', ') || 'none'}]`);
  assert(
    distinctive.length >= 1,
    'reflect:delta Story is not grounded in the seeded counter-evidence (no 48/19/12)',
  );

  // 4. finalized, not paused; classify saw no risk on the (non-crisis) spiral.
  assert(A.status === 'done', `happy-path status was '${A.status}', expected 'done'`);
  assert(A.paused === false, 'happy-path run paused — it should NOT (no crisis cue)');
  assert(A.classify.risk === false, 'happy-path classify flagged risk on a non-crisis story');
  // classify tagged objective→event and subjective→interpretation.
  const hasEvent = A.classify.items.some((i) => i.type === 'event');
  const hasInterp = A.classify.items.some((i) => i.type === 'interpretation');
  assert(hasEvent && hasInterp, 'classify did not tag both event + interpretation items');
  console.log('PART A green: extract→classify→reflect→finalize, reflect:delta grounded, not paused ✓\n');

  // ═══════════════════════════════════════════════════════════════════════════
  // PART B — human-on-risk: pause at awaiting-human, resume + finalize.
  // Extract is MOCKED here (fast + deterministic; risk is detected on the
  // transcript regardless of the model). The mock Story is grounded-shaped.
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('══ PART B — human-on-risk (pause → resume → finalize) ═══════════');

  const mockStory: Story = {
    id: 'story_crisis_1',
    userId: DEMO_USER_ID,
    transcript: CRISIS_STORY,
    subjective: ['everyone would be better off without me', 'I can\'t do this anymore'],
    objective: ['friends reached out 19 times this week', '48 texts received in 7 days'],
    delta:
      'You feel everyone would be better off without you; the record shows friends ' +
      'reached out 19 times this week. This is serious — a person who can help is being looped in.',
    createdAt: SEED_NOW,
  };
  const mockExtractStep = () => ({
    id: 'extract',
    handler: () => ({
      story: mockStory,
      subjective: mockStory.subjective,
      objective: mockStory.objective,
      delta: mockStory.delta,
    }),
  });

  // ── B1: run WITHOUT clearing — prove it PAUSES at the human handoff. ─────────
  // executeStep stops the run AT the named step (the durable wait) without
  // resolving it: it proves the run halts awaiting a human, and never reaches
  // reflect/finalize.
  console.log('── B1: run to the wait (no clearance) → must PAUSE at awaiting-human');
  const tB = new InngestTestEngine({ function: dotRun });
  const pausedOut = await tB.executeStep('await-human-clearance', {
    events: [
      { name: RUN_REQUESTED, id: 'run_B', data: { userId: DEMO_USER_ID, transcript: CRISIS_STORY, now: SEED_NOW } },
    ],
    steps: [mockExtractStep()],
  });
  // the run registered the wait step (it's paused there, not finalized).
  const waitStep = pausedOut.step as { op?: string; displayName?: string; name?: string } | undefined;
  console.log(`  paused at step: ${waitStep?.displayName ?? waitStep?.name} (op=${waitStep?.op})`);
  assert(
    (waitStep?.displayName ?? waitStep?.name) === 'await-human-clearance',
    `expected to pause at 'await-human-clearance', paused at '${waitStep?.displayName ?? waitStep?.name}'`,
  );
  // the waitForSignal step is non-runnable (it's a pause op, not a step.run).
  assert(
    waitStep?.op === 'WaitForSignal' || /signal/i.test(waitStep?.op ?? ''),
    `paused step op was '${waitStep?.op}', expected a WaitForSignal pause`,
  );
  console.log('  → run is durably PAUSED awaiting a human ✓\n');

  // ── B2: resume — provide the clearance signal → run finalizes. ──────────────
  console.log('── B2: clearance signal arrives → run RESUMES and finalizes');
  const tB2 = new InngestTestEngine({ function: dotRun });
  const resumedOut = await tB2.execute({
    events: [
      { name: RUN_REQUESTED, id: 'run_B', data: { userId: DEMO_USER_ID, transcript: CRISIS_STORY, now: SEED_NOW } },
    ],
    steps: [
      mockExtractStep(),
      // the human cleared THIS run: the per-run clearance signal resolves the wait.
      {
        id: 'await-human-clearance',
        handler: () => ({ signal: clearanceSignal('run_B'), data: { runId: 'run_B', clearedBy: 'on-call-human' } }),
      },
    ],
  });
  const rB = resumedOut.result as unknown as RunResult | undefined;
  assert(rB !== undefined, 'resumed run produced no result (it did not finalize after clearance)');
  const B = rB as RunResult;

  console.log(`  event trace: ${traceLine(B.events)}`);
  const orderB = nodeOrder(B.events);

  // 5. it WENT THROUGH the human-on-risk branch (paused flag + the event).
  assert(B.paused === true, 'resumed run was not marked paused — the risk fork did not fire');
  assert(B.classify.risk === true, 'crisis story did not trip the risk flag');
  const awaiting = B.events.find((e) => e.type === 'run:awaiting-human');
  assert(awaiting !== undefined, 'run:awaiting-human event did not fire on the crisis run');

  // 6. it RESUMED and finalized after clearance.
  assert(B.status === 'done', `resumed run status was '${B.status}', expected 'done'`);
  assert(
    JSON.stringify(orderB) === JSON.stringify(['extract', 'classify', 'reflect', 'finalize']),
    `resumed steps out of order — got [${orderB.join(', ')}]`,
  );

  // 7. reflect:delta fired AFTER the pause, carrying the Story (the moment lands post-clearance).
  const idxAwait = B.events.findIndex((e) => e.type === 'run:awaiting-human');
  const idxDelta = B.events.findIndex((e) => e.type === 'reflect:delta');
  assert(idxDelta > idxAwait, 'reflect:delta did not fire AFTER the human pause (resume order wrong)');
  const deltaB = B.events[idxDelta] as { story: Story };
  console.log(`  reflect:delta (post-clearance) delta: ${deltaB.story.delta.slice(0, 80)}...`);
  console.log('  → run RESUMED past the pause and finalized ✓\n');

  // ── Final summary ───────────────────────────────────────────────────────────
  console.log('── asserted ────────────────────────────────────────────────────');
  console.log('  A) durable steps ran in order: extract → classify → reflect → finalize ✓');
  console.log('  A) reflect:delta fired carrying the grounded Story (THE moment)        ✓');
  console.log('  B) crisis input drove the run to awaiting-human (durable PAUSE)         ✓');
  console.log('  B) run RESUMED + finalized after the dot/human.cleared signal           ✓');
  console.log('\nALL GATES GREEN.  (Johnny: eyeball the PART A delta tone — validate, never invalidate.)');
}

main().catch((err) => {
  console.error('\nDIRECTOR GATE FAILED:', err instanceof Error ? (err.stack ?? err.message) : err);
  process.exitCode = 1;
});

// Satisfy DotRun import (the run contract this gate verifies against — keep the
// type referenced so a drift in types.ts surfaces here at compile time).
export type _RunContract = DotRun;
