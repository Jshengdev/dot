// test-turn.ts — THE L3 GATE. Proves the text turn loop round-trips:
//   1. seeds the synthetic demo user (the counter-evidence exists first),
//   2. runs ONE turn (the spiral story) through runTurn,
//   3. prints the inbound text, a ONE-LINE context summary (what fed the call),
//      and DOT's reply (the grounded reflection),
//   4. re-reads `messages` to show BOTH turns persisted (user in, dot out).
//
// Run:  pnpm --filter @dot/backend test:turn
//
// This is the L3 gate from BUILDER-START: "a terminal exchange round-trips: you
// type a story, DOT replies with the reflection. No iMessage yet." Johnny eyeballs
// the TONE — validate the feeling, show facts, never a verdict.

import { store } from './store.js';
import { seedDemoUser, SEED_NOW } from './seed.js';
import { runTurn, summarizeContext } from './turn.js';
import { REASONING_MODEL } from './extract.js';

// ── The synthetic spiral (EDITABLE demo COPY — same shape as the L2 gate) ─────
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

  // ── the inbound ─────────────────────────────────────────────────────────────
  console.log('── INBOUND (the person types) ──────────────────────────────────');
  console.log(`  "${SPIRAL_STORY}"\n`);

  // ── one turn through the loop ───────────────────────────────────────────────
  const { reply, story, context } = await runTurn({
    userId,
    text: SPIRAL_STORY,
    now: SEED_NOW,
  });

  // ── the one-line context summary (what the ≤2 layers assembled) ─────────────
  console.log('── CONTEXT (≤2 layers, assembled in parallel) ──────────────────');
  console.log(`  ${summarizeContext(context)}\n`);

  // ── DOT's reply (the grounded reflection) ───────────────────────────────────
  console.log("── DOT'S REPLY (the grounded reflection) ───────────────────────");
  for (const line of reply.split('\n')) console.log(`  ${line}`);
  console.log('');

  // ── re-read messages: BOTH turns must be persisted ──────────────────────────
  const msgs = store.getMessages(userId, 10);
  console.log('── PERSISTED messages (re-read from store) ─────────────────────');
  for (const m of msgs) {
    const preview = m.content.length > 72 ? m.content.slice(0, 69) + '...' : m.content;
    console.log(`  [${m.role}] ${preview}`);
  }
  console.log('');

  // ── structural assertions (a failure throws — no silent green) ──────────────
  assert(reply.trim().length > 0, 'reply is empty (the turn produced no reflection)');
  assert(story.subjective.length > 0, 'story.subjective is empty (no felt-claims)');
  assert(story.objective.length > 0, 'story.objective is empty (no facts)');
  assert(story.delta.trim().length > 0, 'story.delta is empty (no reflection)');

  // the reply must carry the grounded delta (the reflection, not just validation).
  assert(
    reply.includes(story.delta.trim()),
    'reply does not contain the grounded delta — the reflection was dropped',
  );

  // BOTH turns persisted: the inbound (user) and the outbound (dot).
  const userMsgs = msgs.filter((m) => m.role === 'user');
  const dotMsgs = msgs.filter((m) => m.role === 'dot');
  assert(
    userMsgs.some((m) => m.content === SPIRAL_STORY),
    'inbound user message was not persisted to the log',
  );
  assert(
    dotMsgs.some((m) => m.content === reply),
    'outbound dot reply was not persisted to the log',
  );
  // ordering: the user turn precedes the dot turn (one in → one out).
  assert(
    msgs.length >= 2 && msgs[0]?.role === 'user' && msgs[msgs.length - 1]?.role === 'dot',
    'message order is wrong — expected user turn then dot turn',
  );

  // tone tripwire (same as L2): the reply must not contain an invalidating verdict.
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
  const lower = reply.toLowerCase();
  const verdict = verdictPhrases.find((p) => lower.includes(p));
  assert(
    verdict === undefined,
    `reply contains an invalidating verdict ("${verdict}") — DOT must reflect, not judge`,
  );

  console.log('── both turns persisted (user in · dot out)                 ✓');
  console.log('── reply carries the grounded delta (the reflection)        ✓');
  console.log('── tone: no invalidating verdict in the reply               ✓');
  console.log('\nALL GATES GREEN.  (Johnny: eyeball the reply tone — validate, never invalidate.)');
}

main().catch((err) => {
  console.error('\nTURN GATE FAILED:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
