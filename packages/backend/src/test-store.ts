// test-store.ts — THE L1 GATE. Proves the counter-evidence exists BEFORE any
// LLM, and proves the store roundtrip (write a story → re-read it).
//
// Run:  pnpm --filter @dot/backend test:store
//
// ANXIETY HERO (docs/sample-story.json). What it asserts (a failure throws):
//   1. countEvents(panic_attack, 7d) === 6 (a panic attack after every club event).
//   2. self_harm 2 · ideation 1 (the safety signals the report surfaces).
//   3. a story written to the store re-reads identically (no LARP persistence).

import { store } from './store.js';
import { seedDemoUser, SEED_NOW, SEED_COUNTS } from './seed.js';
import type { Story } from './types.js';

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`GATE FAILED: ${msg}`);
}

function main(): void {
  // ── seed ────────────────────────────────────────────────────────────────────
  const { userId } = seedDemoUser();
  // re-seed once to prove idempotency (must NOT double the counts).
  seedDemoUser();

  // ── 1. counter-evidence: panic attacks this week ─────────────────────────────
  // Window anchored to SEED_NOW so the count is deterministic.
  const panic = store.countEvents(
    userId,
    { kind: 'panic_attack', sinceDays: 7 },
    SEED_NOW,
  );
  console.log(`panic_attack in last 7d: ${panic}`);
  assert(
    panic === SEED_COUNTS.panicAttack,
    `expected ${SEED_COUNTS.panicAttack} panic_attack, got ${panic}`,
  );

  // ── 2. the safety signals (self-harm + ideation — the report surfaces these) ──
  const selfHarm = store.countEvents(userId, { kind: 'self_harm', sinceDays: 7 }, SEED_NOW);
  const ideation = store.countEvents(userId, { kind: 'ideation', sinceDays: 7 }, SEED_NOW);
  console.log(`safety signals — self_harm: ${selfHarm}  ideation: ${ideation}`);
  assert(
    selfHarm === SEED_COUNTS.selfHarm && ideation === SEED_COUNTS.ideation,
    `expected self_harm ${SEED_COUNTS.selfHarm} / ideation ${SEED_COUNTS.ideation}, ` +
      `got self_harm ${selfHarm} / ideation ${ideation}`,
  );

  // a glimpse of the rest of the record (the provider stat sheet).
  console.log('stat sheet (7d):');
  for (const line of store.statSheet(userId, { sinceDays: 7, now: SEED_NOW })) {
    console.log(`  ${line.kind}: ${line.count} (${line.window})`);
  }

  // ── 3. write a story → re-read it (prove the roundtrip) ───────────────────────
  const story: Story = {
    id: 'story_demo_1',
    userId,
    transcript:
      "It was a long week but not too bad. I think im just a very nervous person, chest hurts a bit but we're lowkey chilling.",
    subjective: ['just a nervous person', "chest hurts a bit, lowkey chilling"],
    objective: [
      'panic attack after every club event this week (6 days)',
      'scratched arms to self-calm during meetings (2 days)',
      'journaled wanting to sleep forever',
    ],
    delta:
      "You tell people you're lowkey chilling — the record shows a panic attack after every club event " +
      "for 6 days straight, arm-scratching to get through meetings, and wanting to sleep forever.",
    timeline: ['Mon–Sat: panic after every club night', 'Wed & Fri: arm-scratching', 'Sat: "sleep forever"'],
    createdAt: SEED_NOW,
  };
  store.addStory(story);

  const reread = store.getStory(story.id);
  assert(reread !== undefined, 'story did not re-read (vanished after write)');
  assert(
    JSON.stringify(reread) === JSON.stringify(story),
    'story re-read does not match what was written',
  );
  console.log('\nstory roundtrip OK — re-read from store:');
  console.log(`  id:         ${reread!.id}`);
  console.log(`  subjective: ${JSON.stringify(reread!.subjective)}`);
  console.log(`  objective:  ${JSON.stringify(reread!.objective)}`);
  console.log(`  delta:      ${reread!.delta}`);

  // confirm it's in the user's story stream too.
  const stories = store.getStories(userId);
  assert(stories.length === 1 && stories[0]?.id === story.id, 'story not in getStories()');

  console.log('\nALL GATES GREEN.');
}

main();
