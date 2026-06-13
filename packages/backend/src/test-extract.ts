// test-extract.ts — THE L2 GATE. Proves the one Grok extraction:
//   1. seeds the synthetic demo user (the counter-evidence exists first),
//   2. feeds a synthetic anxiety spiral through extractStory,
//   3. prints the full parsed object (feeling_validation + the split + delta),
//   4. re-reads the persisted Story from the store (the roundtrip proof),
//   5. shows the objective facts appended to `events` (source='story').
//
// Run:  pnpm --filter @dot/backend test:extract
//
// Johnny eyeballs the TONE (the one thing the model can't self-certify): the
// reflection must VALIDATE the feeling and show facts — never tip into a verdict
// ("you're overreacting" / "your anxiety is lying" / "you're fine"). Machines
// prove; humans mean.

import { store } from './store.js';
import { seedDemoUser, SEED_NOW } from './seed.js';
import { extractStory, REASONING_MODEL } from './extract.js';

// ── The synthetic spiral (EDITABLE demo COPY) ─────────────────────────────────
const SPIRAL_STORY =
  'Today was awful. My friends barely replied, I\'m always the one reaching out, ' +
  "they're probably tired of me. My chest was tight all afternoon. I feel like I'm " +
  'falling apart and everyone can see it.';

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`GATE FAILED: ${msg}`);
}

async function main(): Promise<void> {
  const { userId } = seedDemoUser();
  console.log(`model: ${REASONING_MODEL}`);
  console.log(`user:  ${userId}  (seeded)\n`);
  console.log('THE PERSON SAID:');
  console.log(`  "${SPIRAL_STORY}"\n`);

  // ── the one Grok call (grounded in the seeded record) ───────────────────────
  const { result, story, appendedEvents } = await extractStory({
    transcript: SPIRAL_STORY,
    userId,
    now: SEED_NOW,
  });

  // ── 1. the full parsed object ───────────────────────────────────────────────
  console.log('── PARSED EXTRACTION ───────────────────────────────────────────');
  console.log('feeling_validation:');
  console.log(`  ${result.feeling_validation}\n`);
  console.log('subjective (what they FELT):');
  for (const s of result.subjective) console.log(`  - ${s}`);
  console.log('\nobjective (what HAPPENED — grounded in the record):');
  for (const o of result.objective) console.log(`  - ${o}`);
  console.log('\ndelta (the neutral observation):');
  console.log(`  ${result.delta}\n`);

  // ── 2. re-read the persisted Story (the roundtrip proof) ────────────────────
  const reread = store.getStory(story.id);
  assert(reread !== undefined, 'story did not re-read from the store (LARP persistence)');
  assert(
    JSON.stringify(reread) === JSON.stringify(story),
    'persisted story does not match the returned story',
  );
  console.log('── PERSISTED STORY (re-read from store) ────────────────────────');
  console.log(`  id:         ${reread!.id}`);
  console.log(`  userId:     ${reread!.userId}`);
  console.log(`  subjective: ${JSON.stringify(reread!.subjective)}`);
  console.log(`  objective:  ${JSON.stringify(reread!.objective)}`);
  console.log(`  delta:      ${reread!.delta}`);
  console.log(`  createdAt:  ${reread!.createdAt}\n`);

  // ── 3. the objective facts appended to events (source='story') ──────────────
  console.log(`── APPENDED TO events (source='story'): ${appendedEvents.length} facts ──`);
  for (const e of appendedEvents) console.log(`  - [${e.kind}] ${e.label}`);
  console.log('');

  // ── structural assertions (a failure throws — no silent green) ──────────────
  assert(typeof result.feeling_validation === 'string' && result.feeling_validation.trim().length > 0,
    'feeling_validation is empty (validation must come first)');
  assert(result.subjective.length > 0, 'subjective is empty (no felt-claims extracted)');
  assert(result.objective.length > 0, 'objective is empty (no facts extracted)');
  assert(result.delta.trim().length > 0, 'delta is empty (no reflection produced)');

  // grounding check: the delta + objective must reference the seeded
  // counter-evidence by its DISTINCTIVE counts — 48 texts received, 19
  // friend-initiated, 12 you-initiated. Require at least TWO distinct hits so a
  // single coincidental number can't pass it. (We deliberately DON'T count the
  // weak '7' token — it also matches "7 days", "7am", a time-of-day, etc., so it
  // is not evidence the model read the record.) If <2 distinctive counts appear,
  // the model invented instead of grounding — the gate fails loud.
  const haystack = (result.delta + ' ' + result.objective.join(' ')).toLowerCase();
  const distinctiveCounts = ['48', '19', '12'];
  const hits = distinctiveCounts.filter((n) => haystack.includes(n));
  assert(
    hits.length >= 2,
    `delta/objective references only ${hits.length} distinctive seeded count(s) ` +
      `(${hits.join(', ') || 'none'}); expected >=2 of 48 / 19 / 12 from the record ` +
      '— model is not grounded in the counter-evidence',
  );

  // tone tripwire: the delta must not contain an outright invalidating verdict.
  const verdictPhrases = [
    "you're overreacting",
    'you are overreacting',
    "you're being irrational",
    'your anxiety is lying',
    "you're fine",
    'you are fine',
    "there's nothing wrong",
    'nothing wrong with you',
  ];
  const delta = result.delta.toLowerCase();
  const verdict = verdictPhrases.find((p) => delta.includes(p));
  assert(
    verdict === undefined,
    `delta contains an invalidating verdict ("${verdict}") — DOT must reflect, not judge`,
  );

  console.log(`── grounding: delta/objective cites ${hits.length} distinctive counts [${hits.join(', ')}]  ✓`);
  console.log('── tone:      no invalidating verdict in the delta          ✓');
  console.log('\nALL GATES GREEN.  (Johnny: eyeball the tone above — validate, never invalidate.)');
}

main().catch((err) => {
  console.error('\nEXTRACT GATE FAILED:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
