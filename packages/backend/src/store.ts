// store.ts — DOT's data substrate. ONE job: hold the accumulating record (users,
// messages, stories, events) and make the objective-mirror comparison cheap.
//
// In-proc Map FIRST (per PORT-MEMORY-DB §"Recommended store for 9 hours" +
// docs/ARCHITECTURE). This is a real, documented fallback — NOT a silent stub —
// that lets the turn loop run before SQLite exists. By design, a later
// Map→SQLite swap touches ONLY this file: every other module talks to the
// `store` singleton through the typed methods below, never to the Maps.
//
// statSheet() is a FUNCTION (an aggregate over events), not a table — derived,
// never stored (PORT-MEMORY-DB §3: "make it a VIEW or a function").
//
// Determinism: ids come from a monotonic per-collection counter; timestamps are
// always passed in by the caller (no Math.random / implicit Date.now), so a test
// or seed run is reproducible.

import type { Event, Story } from './types.js';

// ── Records the store owns ────────────────────────────────────────────────────

/** Identity. The demo is single-user; this is one row. */
export interface User {
  id: string;
  name: string;
  createdAt: string; // ISO
}

/** The raw conversation/story input. The message log IS the memory. */
export interface Message {
  id: string;
  userId: string;
  role: 'user' | 'dot';
  content: string;
  ts: string; // ISO
}

/** One aggregate line for the provider stat sheet (derived from events). */
export interface StatLine {
  kind: string;
  count: number;
  window: string; // e.g. '7d'
}

// ── Query option shapes ───────────────────────────────────────────────────────

export interface EventQuery {
  kind?: string;
  sinceTs?: string; // ISO; inclusive lower bound
}

export interface CountQuery {
  kind: string;
  sinceDays: number; // window measured back from `now`
}

// ── The store ─────────────────────────────────────────────────────────────────
//
// One handle, shared process-wide. The Maps are private; the only contract is
// the methods. (Swap target: each method body becomes a SQLite query; the
// signatures do not move.)

class MapStore {
  private users = new Map<string, User>();
  private messages = new Map<string, Message>();
  private stories = new Map<string, Story>();
  private events = new Map<string, Event>();

  // Monotonic id counters, one namespace per collection. Deterministic, no RNG.
  private counters: Record<string, number> = {
    user: 0,
    msg: 0,
    story: 0,
    event: 0,
  };

  private nextId(ns: keyof typeof this.counters): string {
    const n = (this.counters[ns] ?? 0) + 1;
    this.counters[ns] = n;
    return `${ns}_${n}`;
  }

  // ── users ──────────────────────────────────────────────────────────────────

  /** Create a user. Caller supplies the timestamp (determinism). */
  createUser(input: { name: string; createdAt: string; id?: string }): User {
    const id = input.id ?? this.nextId('user');
    const user: User = { id, name: input.name, createdAt: input.createdAt };
    this.users.set(id, user);
    return user;
  }

  getUser(userId: string): User | undefined {
    return this.users.get(userId);
  }

  // ── messages ─────────────────────────────────────────────────────────────────

  /** Append one message to the log. */
  addMessage(input: {
    userId: string;
    role: 'user' | 'dot';
    content: string;
    ts: string;
    id?: string;
  }): Message {
    const id = input.id ?? this.nextId('msg');
    const message: Message = {
      id,
      userId: input.userId,
      role: input.role,
      content: input.content,
      ts: input.ts,
    };
    this.messages.set(id, message);
    return message;
  }

  /** The last N messages for a user, oldest→newest (chat-context order). */
  getMessages(userId: string, lastN: number): Message[] {
    const mine = [...this.messages.values()]
      .filter((m) => m.userId === userId)
      .sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0));
    return lastN >= mine.length ? mine : mine.slice(mine.length - lastN);
  }

  /** /reset — clear a user's conversation (messages + told stories + the facts DOT
   *  extracted), KEEPING the seeded synthetic counter-evidence (source !== 'story').
   *  So the thread restarts fresh but the objective record to reflect against stays. */
  reset(userId: string): void {
    for (const [id, m] of this.messages) if (m.userId === userId) this.messages.delete(id);
    for (const [id, s] of this.stories) if (s.userId === userId) this.stories.delete(id);
    for (const [id, e] of this.events) if (e.userId === userId && e.source === 'story') this.events.delete(id);
  }

  // ── stories ──────────────────────────────────────────────────────────────────

  /** Persist one told story (a glass dot). The Story arrives fully shaped. */
  addStory(story: Story): Story {
    this.stories.set(story.id, story);
    return story;
  }

  /** All stories for a user, newest→oldest (the dot stream). */
  getStories(userId: string): Story[] {
    return [...this.stories.values()]
      .filter((s) => s.userId === userId)
      .sort((a, b) => (a.createdAt > b.createdAt ? -1 : a.createdAt < b.createdAt ? 1 : 0));
  }

  /** Re-read one story by id (the roundtrip proof). */
  getStory(storyId: string): Story | undefined {
    return this.stories.get(storyId);
  }

  // ── events (the load-bearing objective record) ───────────────────────────────

  /** Append one event. Id auto-assigned unless supplied (idempotent seeding). */
  addEvent(event: Omit<Event, 'id'> & { id?: string }): Event {
    const id = event.id ?? this.nextId('event');
    const row: Event = {
      id,
      userId: event.userId,
      kind: event.kind,
      label: event.label,
      value: event.value,
      source: event.source,
      ts: event.ts,
    };
    this.events.set(id, row);
    return row;
  }

  /** True if an event with this id already exists (for idempotent seeds). */
  hasEvent(id: string): boolean {
    return this.events.has(id);
  }

  /**
   * Read events for a user, optionally filtered by kind and/or a since-timestamp.
   * Returned oldest→newest. This is the one read the reflect step uses.
   */
  getEvents(userId: string, opts: EventQuery = {}): Event[] {
    return [...this.events.values()]
      .filter((e) => e.userId === userId)
      .filter((e) => (opts.kind ? e.kind === opts.kind : true))
      .filter((e) => (opts.sinceTs ? e.ts >= opts.sinceTs : true))
      .sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0));
  }

  /**
   * The counter-evidence query: how many events of `kind` in the last
   * `sinceDays` days. This IS "your friends texted you 50x this week."
   * `now` is injected (determinism); defaults to the wall clock if omitted.
   */
  countEvents(userId: string, q: CountQuery, now: string = new Date().toISOString()): number {
    const sinceTs = new Date(Date.parse(now) - q.sinceDays * 86_400_000).toISOString();
    return this.getEvents(userId, { kind: q.kind, sinceTs }).length;
  }

  /**
   * statSheet — the provider aggregate. GROUP BY kind over events in a window.
   * A FUNCTION, not a stored table (derived on read). `now` injected.
   */
  statSheet(
    userId: string,
    opts: { sinceDays?: number; now?: string } = {},
  ): StatLine[] {
    const now = opts.now ?? new Date().toISOString();
    const sinceDays = opts.sinceDays ?? 7;
    const sinceTs = new Date(Date.parse(now) - sinceDays * 86_400_000).toISOString();
    const window = `${sinceDays}d`;

    const counts = new Map<string, number>();
    for (const e of this.getEvents(userId, { sinceTs })) {
      counts.set(e.kind, (counts.get(e.kind) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([kind, count]) => ({ kind, count, window }))
      .sort((a, b) => b.count - a.count);
  }
}

// One handle, shared process-wide — and PINNED to globalThis so it survives across
// Next.js dev route cold-compiles / HMR / separate route bundles (each route does its
// own `await import('@dot/backend')`; webpack can hand a route its own module copy, so
// without this pin a story written by /api/turn could be invisible to /api/record —
// exactly the Scene 2→Scene 4 read the demo depends on). In a single production server
// process this is just the one singleton; the global key makes "one store per process"
// hold even when the module is evaluated more than once. (No effect on the backend's
// own tsx test runs — there's one module graph there.)
const STORE_KEY = Symbol.for('dot.store.singleton');
type GlobalWithStore = typeof globalThis & { [STORE_KEY]?: MapStore };
const g = globalThis as GlobalWithStore;
export const store: MapStore = (g[STORE_KEY] ??= new MapStore());
export type DotStore = MapStore;
