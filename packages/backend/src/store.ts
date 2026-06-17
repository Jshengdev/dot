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

import type {
  CheckIn,
  ClinicalSignal,
  ConversationMeta,
  Event,
  Graph,
  GraphEdge,
  GraphNode,
  Story,
} from './types.js';

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

/** One user's WHOLE slice, serialized — the durability unit. On serverless the
 *  in-proc Map is a per-request working copy: a route restores this from the shared
 *  store before the engine runs and snapshots it back after. Carries the id counters
 *  so ids stay monotonic across instances. */
export interface UserSnapshot {
  user?: User;
  messages: Message[];
  stories: Story[];
  events: Event[];
  graphNodes: GraphNode[];
  graphEdges: GraphEdge[];
  conversation?: ConversationMeta;
  checkins: CheckIn[];
  signals: ClinicalSignal[];
  counters: Record<string, number>;
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

  // The LIVE-intake substrate. Graph is per-user (the panels read one user's
  // graph); nodes keyed by their typed id, edges keyed by (source|target|type) so
  // a re-mention/re-relation merges in place instead of duplicating. Conversation
  // meta is one row per user; check-ins are the forward timer (one map, queried
  // by user and by due-time).
  private conversations = new Map<string, ConversationMeta>(); // userId → meta
  private graphNodes = new Map<string, Map<string, GraphNode>>(); // userId → (nodeId → node)
  private graphEdges = new Map<string, Map<string, GraphEdge>>(); // userId → (edgeKey → edge)
  private checkins = new Map<string, CheckIn>(); // checkInId → check-in
  private signals = new Map<string, Map<string, ClinicalSignal>>(); // userId → (signalId → classified clinical signal)

  // Monotonic id counters, one namespace per collection. Deterministic, no RNG.
  private counters: Record<string, number> = {
    user: 0,
    msg: 0,
    story: 0,
    event: 0,
    checkin: 0,
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
    // Also wipe the live-intake substrate for this user: the whole graph, the
    // conversation meta, and every scheduled check-in. (The graph/conversation are
    // built fresh each intake; nothing here is the durable counter-evidence.)
    this.graphNodes.delete(userId);
    this.graphEdges.delete(userId);
    this.conversations.delete(userId);
    this.signals.delete(userId);
    for (const [id, c] of this.checkins) if (c.userId === userId) this.checkins.delete(id);
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

  // ── conversation lifecycle ─────────────────────────────────────────────────
  // One open conversation per user. upsert overwrites the row wholesale (the
  // caller owns the merge of turnCount / status / watermark).

  /** The user's conversation meta, or undefined if no intake has opened. */
  getConversation(userId: string): ConversationMeta | undefined {
    return this.conversations.get(userId);
  }

  /** Set/replace the user's conversation meta. Returns what was stored. */
  upsertConversation(meta: ConversationMeta): ConversationMeta {
    this.conversations.set(meta.userId, meta);
    return meta;
  }

  // ── the knowledge graph (per-user) ─────────────────────────────────────────
  // Incremental build: nodes merge by typed id (UNION evidence, keep louder
  // salience); edges merge by (source,target,type) (keep higher weight, UNION
  // evidence). Edges that dangle (a source/target with no node) are DROPPED — the
  // graph the panels read is always internally consistent.

  private nodeMapFor(userId: string): Map<string, GraphNode> {
    let m = this.graphNodes.get(userId);
    if (!m) {
      m = new Map<string, GraphNode>();
      this.graphNodes.set(userId, m);
    }
    return m;
  }

  private edgeMapFor(userId: string): Map<string, GraphEdge> {
    let m = this.graphEdges.get(userId);
    if (!m) {
      m = new Map<string, GraphEdge>();
      this.graphEdges.set(userId, m);
    }
    return m;
  }

  /** Merge nodes into the user's graph by `id`: UNION evidenceTurnIds, keep the
   *  higher salience, take the latest name/summary/tags/panel/type. */
  upsertNodes(userId: string, nodes: GraphNode[]): void {
    const m = this.nodeMapFor(userId);
    for (const incoming of nodes) {
      const existing = m.get(incoming.id);
      if (!existing) {
        m.set(incoming.id, {
          ...incoming,
          evidenceTurnIds: [...new Set(incoming.evidenceTurnIds)],
        });
        continue;
      }
      m.set(incoming.id, {
        ...existing,
        ...incoming,
        salience: maxSalience(existing.salience, incoming.salience),
        evidenceTurnIds: [...new Set([...existing.evidenceTurnIds, ...incoming.evidenceTurnIds])],
      });
    }
  }

  /** Merge edges into the user's graph. DROP any edge whose source or target is not
   *  an existing node id (no dangling lines). Dedupe by (source,target,type): keep
   *  the higher weight + UNION evidenceTurnIds. */
  upsertEdges(userId: string, edges: GraphEdge[]): void {
    const nodes = this.nodeMapFor(userId);
    const m = this.edgeMapFor(userId);
    for (const incoming of edges) {
      if (!nodes.has(incoming.source) || !nodes.has(incoming.target)) continue; // drop dangling
      const key = edgeKey(incoming);
      const existing = m.get(key);
      if (!existing) {
        m.set(key, {
          ...incoming,
          evidenceTurnIds: [...new Set(incoming.evidenceTurnIds)],
        });
        continue;
      }
      m.set(key, {
        ...existing,
        ...incoming,
        weight: Math.max(existing.weight, incoming.weight),
        evidenceTurnIds: [...new Set([...existing.evidenceTurnIds, ...incoming.evidenceTurnIds])],
      });
    }
  }

  /** The whole graph for a user (empty {nodes:[],edges:[]} if none yet). */
  getGraph(userId: string): Graph {
    return {
      nodes: [...this.nodeMapFor(userId).values()],
      edges: [...this.edgeMapFor(userId).values()],
    };
  }

  // ── clinical signals (the classified objective record — the validated meta) ──
  // One signal per id per user, merged by id: keep the LATEST classification, the MAX
  // count, and the union of evidence (a re-mention strengthens, never resets).

  private signalMapFor(userId: string): Map<string, ClinicalSignal> {
    let m = this.signals.get(userId);
    if (!m) {
      m = new Map<string, ClinicalSignal>();
      this.signals.set(userId, m);
    }
    return m;
  }

  /** Merge classified signals into the user's record by id. */
  upsertSignals(userId: string, signals: ClinicalSignal[]): void {
    const m = this.signalMapFor(userId);
    for (const incoming of signals) {
      const existing = m.get(incoming.id);
      if (!existing) {
        m.set(incoming.id, { ...incoming, evidenceTurnIds: [...new Set(incoming.evidenceTurnIds)] });
        continue;
      }
      m.set(incoming.id, {
        ...existing,
        ...incoming,
        count: Math.max(existing.count, incoming.count),
        evidenceTurnIds: [...new Set([...existing.evidenceTurnIds, ...incoming.evidenceTurnIds])],
      });
    }
  }

  /** The user's classified clinical signals, loudest first (severity, then count). */
  getSignals(userId: string): ClinicalSignal[] {
    return [...this.signalMapFor(userId).values()].sort(
      (a, b) => (b.severity ?? 0) - (a.severity ?? 0) || b.count - a.count,
    );
  }

  // ── check-ins (the forward timer) ──────────────────────────────────────────
  // Pre-shaped CheckIns arrive with ids (or get one assigned). The timer read is
  // getDueCheckIns(now): pending + past-due, soonest first.

  /** Schedule check-ins. Each gets an id if it doesn't carry one. */
  addCheckIns(checkins: CheckIn[]): void {
    for (const c of checkins) {
      const id = c.id || this.nextId('checkin');
      this.checkins.set(id, { ...c, id });
    }
  }

  /** All check-ins for a user, soonest-scheduled first. */
  getCheckIns(userId: string): CheckIn[] {
    return [...this.checkins.values()]
      .filter((c) => c.userId === userId)
      .sort((a, b) => (a.scheduledFor < b.scheduledFor ? -1 : a.scheduledFor > b.scheduledFor ? 1 : 0));
  }

  /** The timer read: pending check-ins whose time has come (scheduledFor <= now),
   *  soonest first. `now` is injected (determinism). Pass `userId` to scope to ONE
   *  user — a route-driven tick MUST do this so it never fires (and leaks the
   *  risk-signal prompt text of) another user's check-ins. Omit only for a trusted
   *  cron-style global sweep. */
  getDueCheckIns(now: string, userId?: string): CheckIn[] {
    return [...this.checkins.values()]
      .filter(
        (c) =>
          c.status === 'pending' &&
          c.scheduledFor <= now &&
          (userId === undefined || c.userId === userId),
      )
      .sort((a, b) => (a.scheduledFor < b.scheduledFor ? -1 : a.scheduledFor > b.scheduledFor ? 1 : 0));
  }

  /** Patch one check-in (e.g. status→'sent', sentAt). Returns the new row, or
   *  undefined if the id is unknown. `id` can't be patched away. */
  updateCheckIn(id: string, patch: Partial<CheckIn>): CheckIn | undefined {
    const existing = this.checkins.get(id);
    if (!existing) return undefined;
    const next: CheckIn = { ...existing, ...patch, id };
    this.checkins.set(id, next);
    return next;
  }

  // ── Durability seam: snapshot / restore one user's whole slice ───────────────
  // The serverless boundary (see persistence.ts). snapshotUser exports everything
  // for one user + the id counters; restoreUser WIPES the working copy and loads
  // exactly that snapshot (each serverless request handles one user, so a clean
  // per-request copy is correct and avoids cross-user id bleed in a warm instance).

  /** Export one user's whole slice (+ the current id counters). */
  snapshotUser(userId: string): UserSnapshot {
    return {
      user: this.users.get(userId),
      messages: [...this.messages.values()].filter((m) => m.userId === userId),
      stories: [...this.stories.values()].filter((s) => s.userId === userId),
      events: [...this.events.values()].filter((e) => e.userId === userId),
      graphNodes: [...this.nodeMapFor(userId).values()],
      graphEdges: [...this.edgeMapFor(userId).values()],
      conversation: this.conversations.get(userId),
      checkins: [...this.checkins.values()].filter((c) => c.userId === userId),
      signals: [...this.signalMapFor(userId).values()],
      counters: { ...this.counters },
    };
  }

  /** Load one user's snapshot into the Map, replacing ONLY that user's rows.
   *  Critical for serverless: the store is a shared singleton and Vercel runs
   *  concurrent requests on one warm instance — wiping everything here would erase a
   *  different in-flight user (the "no user in the store" crash). So we clear just
   *  this user, leave every other user untouched, and carry counters forward by MAX
   *  so ids stay monotonic without clobbering a concurrent user's counter. */
  restoreUser(userId: string, snap: UserSnapshot): void {
    // 1. drop ONLY this user's existing rows.
    for (const [id, m] of this.messages) if (m.userId === userId) this.messages.delete(id);
    for (const [id, s] of this.stories) if (s.userId === userId) this.stories.delete(id);
    for (const [id, e] of this.events) if (e.userId === userId) this.events.delete(id);
    for (const [id, c] of this.checkins) if (c.userId === userId) this.checkins.delete(id);
    this.users.delete(userId);
    this.graphNodes.delete(userId);
    this.graphEdges.delete(userId);
    this.conversations.delete(userId);
    this.signals.delete(userId);

    // 2. load the snapshot for this user.
    if (snap.user) this.users.set(snap.user.id, snap.user);
    for (const m of snap.messages) this.messages.set(m.id, m);
    for (const s of snap.stories) this.stories.set(s.id, s);
    for (const e of snap.events) this.events.set(e.id, e);
    const nm = this.nodeMapFor(userId);
    for (const n of snap.graphNodes) nm.set(n.id, n);
    const em = this.edgeMapFor(userId);
    for (const e of snap.graphEdges) em.set(edgeKey(e), e);
    if (snap.conversation) this.conversations.set(userId, snap.conversation);
    for (const c of snap.checkins) this.checkins.set(c.id, c);
    const sm = this.signalMapFor(userId);
    for (const sig of snap.signals ?? []) sm.set(sig.id, sig); // ?? [] tolerates pre-signals snapshots

    for (const k of Object.keys(snap.counters)) {
      const v = snap.counters[k];
      if (typeof v === 'number' && v > (this.counters[k] ?? 0)) this.counters[k] = v;
    }
  }
}

// Salience is ordinal; merge keeps the louder of two.
const SALIENCE_RANK: Record<GraphNode['salience'], number> = { low: 0, med: 1, high: 2 };
function maxSalience(a: GraphNode['salience'], b: GraphNode['salience']): GraphNode['salience'] {
  return SALIENCE_RANK[a] >= SALIENCE_RANK[b] ? a : b;
}

// Edge identity = (source, target, type). Pipe-joined; node ids don't contain '|'.
function edgeKey(e: GraphEdge): string {
  return `${e.source}|${e.target}|${e.type}`;
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
