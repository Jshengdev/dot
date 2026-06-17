// test-durable.ts — proves the shared store actually persists ACROSS instances.
// Writes a user's slice, WIPES the whole in-proc Map (simulating a fresh serverless
// instance), then hydrate()s the user back FROM the shared store and checks the data
// returned. With DATABASE_URL (Neon) or UPSTASH creds set this hits the real store;
// with neither it's Map-mode and the wipe makes it (correctly) fail — so run it with
// a store configured. `pnpm --filter @dot/backend test:durable`.
import { store, type UserSnapshot } from './store.js';
import { hydrate, persist, storeMode } from './persistence.js';

const U = 'durable_probe';
const NOW = '2026-06-15T12:00:00.000Z';
const EMPTY: UserSnapshot = {
  messages: [], stories: [], events: [], graphNodes: [], graphEdges: [], checkins: [], signals: [], counters: {},
};

async function main(): Promise<void> {
  console.log(`store mode: ${storeMode()}`);
  if (storeMode() === 'map') {
    console.log('SKIP — no shared store configured (set DATABASE_URL or UPSTASH_* to test durability).');
    return;
  }

  // 1. write a known slice for the probe user, persist to the shared store.
  await hydrate(U);
  store.reset(U);
  if (!store.getUser(U)) store.createUser({ id: U, name: U, createdAt: NOW });
  store.addMessage({ userId: U, role: 'user', content: 'durability check', ts: NOW });
  store.upsertNodes(U, [
    { id: 'symptom:probe', type: 'symptom', name: 'probe', summary: 'a probe node', tags: [], salience: 'high', panel: 'symptoms', evidenceTurnIds: [] },
  ]);
  await persist(U);

  // 2. WIPE this user's working copy (simulate a brand-new serverless instance).
  //    restoreUser is per-user now (the serverless concurrency fix), so we wipe U
  //    specifically — loading an EMPTY snapshot for U clears exactly U's rows.
  store.restoreUser(U, EMPTY);
  const beforeMsgs = store.getMessages(U, 10).length;
  console.log(`after wipe: ${beforeMsgs} messages (expect 0)`);

  // 3. hydrate the probe user back FROM the shared store.
  await hydrate(U);
  const msgs = store.getMessages(U, 10);
  const hasNode = store.getGraph(U).nodes.some((n) => n.id === 'symptom:probe');
  console.log(`after hydrate from ${storeMode()}: ${msgs.length} messages, probe node: ${hasNode}`);

  if (beforeMsgs === 0 && msgs.length >= 1 && hasNode) {
    console.log('PASS — the slice round-tripped through the shared store (durable across instances).');
  } else {
    console.log('FAIL — data did not survive the wipe.');
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('DURABILITY TEST FAILED:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
