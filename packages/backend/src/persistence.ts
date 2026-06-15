// persistence.ts — the DURABILITY BOUNDARY for serverless. ONE job: make the
// in-proc Map survive across Vercel function instances. Each route hydrate()s the
// user's slice from a shared store (Upstash Redis) into the Map BEFORE the engine
// runs, and persist()s it back AFTER — so the Map is a per-request working copy and
// Redis is the source of truth between requests.
//
// ENV-GATED: with no Redis creds set, both calls are no-ops and the local
// single-process Map works exactly as before (dev, tests, the iMessage agent). With
// UPSTASH_REDIS_REST_URL + _TOKEN (or the KV_REST_API_* aliases) set, it's durable.
//
// One user = one Redis key holding the whole slice (a conversation is KBs; @upstash/
// redis JSON-serializes the value). Correct for the demo's single-user-sequential
// traffic; concurrent writes to the SAME user are last-write-wins (a documented
// limitation — production would add per-user locking or request-scoped stores).
//
// Fail loud: a Redis error throws (the route turns it into a visible 500) — we never
// silently fall back to an empty conversation and pretend it persisted.

import { store, type UserSnapshot } from './store.js';

type RedisLike = {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<unknown>;
};

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

let client: RedisLike | null = null;
let inited = false;

async function getRedis(): Promise<RedisLike | null> {
  if (inited) return client;
  inited = true;
  if (!REDIS_URL || !REDIS_TOKEN) return null; // local Map mode
  const { Redis } = await import('@upstash/redis');
  client = new Redis({ url: REDIS_URL, token: REDIS_TOKEN }) as unknown as RedisLike;
  return client;
}

/** True when a shared store is configured (we're durable across instances). */
export function isDurable(): boolean {
  return !!(REDIS_URL && REDIS_TOKEN);
}

const keyFor = (userId: string) => `dot:user:${userId}`;

const EMPTY_SNAPSHOT: UserSnapshot = {
  messages: [],
  stories: [],
  events: [],
  graphNodes: [],
  graphEdges: [],
  checkins: [],
  counters: {},
};

/** Load one user's slice from the shared store into the in-proc Map. No-op locally
 *  (the singleton already holds state). On serverless it always leaves the Map
 *  holding exactly this user — a clean per-request working copy. */
export async function hydrate(userId: string): Promise<void> {
  const redis = await getRedis();
  if (!redis) return; // local Map mode
  const snap = (await redis.get(keyFor(userId))) as UserSnapshot | null;
  store.restoreUser(userId, snap ?? EMPTY_SNAPSHOT);
}

/** Write this user's in-proc slice back to the shared store. No-op locally. */
export async function persist(userId: string): Promise<void> {
  const redis = await getRedis();
  if (!redis) return; // local Map mode
  await redis.set(keyFor(userId), store.snapshotUser(userId));
}
