// test-store.ts — THE L1 GATE. Proves the counter-evidence exists BEFORE any
// LLM, and proves the store roundtrip (write a story → re-read it).
//
// Run:  pnpm --filter @dot/backend test:store
//
// What it asserts (a failure throws — no silent green):
//   1. countEvents(message_received, 7d) is in the believable ~48 range.
//   2. the "who reached out" split is friend 19 vs you 12 (the demo's hook).
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

  // ── 1. counter-evidence: messages received this week ─────────────────────────
  // Window anchored to SEED_NOW so the count is deterministic.
  const received = store.countEvents(
    userId,
    { kind: 'message_received', sinceDays: 7 },
    SEED_NOW,
  );
  console.log(`message_received in last 7d: ${received}`);
  assert(
    received === SEED_COUNTS.messageReceived,
    `expected ${SEED_COUNTS.messageReceived} message_received, got ${received}`,
  );

  // ── 2. the friend-vs-you split (the hook: "who reached out") ──────────────────
  const initiated = store.getEvents(userId, { kind: 'conversation_initiated' });
  const byFriend = initiated.filter((e) => e.value === 'friend').length;
  const byYou = initiated.filter((e) => e.value === 'you').length;
  console.log(`who reached out — friend: ${byFriend}  vs  you: ${byYou}`);
  assert(
    byFriend === SEED_COUNTS.initiatedByFriend && byYou === SEED_COUNTS.initiatedByYou,
    `expected friend ${SEED_COUNTS.initiatedByFriend} / you ${SEED_COUNTS.initiatedByYou}, ` +
      `got friend ${byFriend} / you ${byYou}`,
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
      "I feel like everyone has pulled away from me this week. Nobody actually cares.",
    subjective: ['everyone has pulled away', 'nobody cares about me'],
    objective: [
      'friends initiated 19 conversations this week',
      '48 texts received in 7 days',
      'saw two friends in person on Tuesday',
    ],
    delta:
      "You feel everyone pulled away — the record shows your friends reached out 19 times this week, " +
      "more than the 12 you started yourself.",
    timeline: ['Tue: saw Maya & Priya', 'Wed: coworker thanked you', 'all week: 48 texts in'],
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
