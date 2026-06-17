// persistence.ts — the DURABILITY BOUNDARY for serverless. ONE job: make the
// in-proc Map survive across Vercel function instances. Each route hydrate()s the
// user's slice from a shared store BEFORE the engine runs and persist()s it back
// AFTER — so the Map is a per-request working copy and the shared store is the
// source of truth between requests.
//
// AUTO-DETECTS the store by which env vars are present (zero code change to switch):
//   • Neon / Postgres   (DATABASE_URL / POSTGRES_URL)        → one JSONB row per user
//   • Upstash Redis      (UPSTASH_REDIS_REST_* / KV_REST_API_*) → one JSON blob per user
//   • neither            → local in-proc Map (both calls no-op; dev/tests/iMessage)
//
// Both store the SAME unit — one user's whole snapshot (snapshotUser/restoreUser) —
// so the engine + store stay synchronous and untouched. Neon uses the @neondatabase/
// serverless HTTP driver (no connection-pool exhaustion on serverless). Correct for
// the demo's single-user-sequential traffic; concurrent writes to ONE user are
// last-write-wins (a documented limitation — production adds per-user locking).
//
// Fail loud: a store error throws (the route turns it into a visible 500) — we never
// silently fall back to an empty conversation and pretend it persisted.

import { store, type UserSnapshot } from './store.js';

const PG_URL =
  process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

export type StoreMode = 'neon' | 'redis' | 'map';
const MODE: StoreMode = PG_URL ? 'neon' : REDIS_URL && REDIS_TOKEN ? 'redis' : 'map';

/** True when a shared store is configured (durable across instances). */
export function isDurable(): boolean {
  return MODE !== 'map';
}
/** Which store backs persistence this process (for /health + logs). */
export function storeMode(): StoreMode {
  return MODE;
}

const keyFor = (userId: string) => `dot:user:${userId}`;
const EMPTY: UserSnapshot = {
  messages: [],
  stories: [],
  events: [],
  graphNodes: [],
  graphEdges: [],
  checkins: [],
  signals: [],
  counters: {},
};

// ── Neon / Postgres (one JSONB row per user; HTTP driver — serverless-safe) ───
/* eslint-disable @typescript-eslint/no-explicit-any */
type Sql = (strings: TemplateStringsArray, ...vals: unknown[]) => Promise<any[]>;
let sql: Sql | null = null;
let tableReady: Promise<void> | null = null;

async function neonSql(): Promise<Sql> {
  if (sql) return sql;
  const { neon } = await import('@neondatabase/serverless');
  sql = neon(PG_URL as string) as unknown as Sql;
  // KV-in-Postgres: the snapshot is the row. Created once, idempotently.
  tableReady ??= (async () => {
    await sql!`CREATE TABLE IF NOT EXISTS dot_state (
      user_id text PRIMARY KEY,
      snapshot jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`;
  })();
  await tableReady;
  return sql;
}

// ── Upstash Redis (REST; one JSON blob per user) ──────────────────────────────
type RedisLike = { get(k: string): Promise<unknown>; set(k: string, v: unknown): Promise<unknown> };
let redis: RedisLike | null = null;
async function getRedis(): Promise<RedisLike> {
  if (redis) return redis;
  const { Redis } = await import('@upstash/redis');
  redis = new Redis({ url: REDIS_URL as string, token: REDIS_TOKEN as string }) as unknown as RedisLike;
  return redis;
}

/** Load one user's slice from the shared store into the in-proc Map. No-op locally;
 *  on serverless it always leaves the Map holding exactly this user (clean copy). */
export async function hydrate(userId: string): Promise<void> {
  if (MODE === 'map') return;
  if (MODE === 'neon') {
    const q = await neonSql();
    const rows = await q`SELECT snapshot FROM dot_state WHERE user_id = ${userId}`;
    store.restoreUser(userId, (rows[0]?.snapshot as UserSnapshot | undefined) ?? EMPTY);
    return;
  }
  const r = await getRedis();
  store.restoreUser(userId, ((await r.get(keyFor(userId))) as UserSnapshot | null) ?? EMPTY);
}

/** Write this user's in-proc slice back to the shared store. No-op locally. */
export async function persist(userId: string): Promise<void> {
  if (MODE === 'map') return;
  const snap = store.snapshotUser(userId);
  if (MODE === 'neon') {
    const q = await neonSql();
    await q`INSERT INTO dot_state (user_id, snapshot, updated_at)
            VALUES (${userId}, ${JSON.stringify(snap)}::jsonb, now())
            ON CONFLICT (user_id) DO UPDATE SET snapshot = EXCLUDED.snapshot, updated_at = now()`;
    return;
  }
  const r = await getRedis();
  await r.set(keyFor(userId), snap);
}
