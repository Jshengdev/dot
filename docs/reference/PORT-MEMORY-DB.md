# PORT-MEMORY-DB.md — the memory/DB DOT reflects a story against

> **What this is.** The objective mirror only works if there's an *accumulated objective record* to
> reflect a new story against. This doc ports that substrate from two working implementations — **Juno**
> (the icarus memory engine, `~/code/icarus/src/memory/`) and **Doubles** (`~/code/doubles/src/`) — into
> the simplest store that delivers DOT's longitudinal mechanism. Read with `docs/ARCHITECTURE.md` (in-proc
> Map fallback first, real store second) and `docs/reference/PORT-SOTARE-CONSTRAINTS.md` (satisfice, one
> clear purpose per primitive). **Source of truth for the data shape DOT persists.**
>
> Note on provenance: Doubles' `schema.ts` header literally says its core 4 tables —
> `users · messages · shadow_entities · entity_embeddings` — were *ported from Juno*. So these are not two
> independent designs; Doubles is Juno's memory spine, slimmed and re-tuned. DOT inherits the same spine,
> slimmed again.

---

## 1. Juno's memory/DB — how it works + the primitives

Juno models a person as **conversation history + a growing personal wiki of facts that decays unless
reinforced.** Every turn appends to `messages`; an extractor distills durable facts into `shadow_entities`
(the wiki); vectors index them; a decay function fades stale facts at *read* time so the record self-prunes.
The accumulated context for any moment = recent messages + the wiki ranked by relevance. All Postgres (Neon),
all `CREATE TABLE IF NOT EXISTS` (idempotent), all **fail-loud**.

| Primitive | Purpose (one line) | File |
|---|---|---|
| **Connection helper** | One gateway — `query / queryOne / execute / withTransaction`, RLS-aware. Every DB call goes through it. | `icarus/src/memory/connection.ts` |
| **Schema init** | Idempotent DDL for the whole substrate; startup *asserts* `user_phone` columns exist (fails loud on drift). | `icarus/src/memory/schema.ts` |
| **`users`** | Identity (phone PK) + `profile JSONB` grab-bag for per-user flags. | `schema.ts` |
| **`messages`** | Conversation log = source of truth for context. `(user_phone, sent_at DESC)` index. | `schema.ts` |
| **`shadow_entities`** | THE accumulated record — extracted facts with `confidence`, `decay_anchor`, `entity_hash` dedup, `provenance JSONB`. | `schema.ts` |
| **`entity_embeddings`** | MiniLM vectors (JSON in a TEXT column) keyed by `(user_phone, entity_hash)` for semantic recall. | `schema.ts` |
| **`episodic_events`** | Append-only longitudinal tuples `(inbound, outbound, reflection, outcome)` — replayed for continuity. | `migrations/2026-04-30-juno-active.ts` |
| **Entity writer** | LLM extract → canonicalize → `SHA256(type:name)` hash → upsert; on conflict bump confidence +0.1, refresh anchor. | `icarus/src/memory/entities.ts` |
| **CRUD + decay-on-read** | `getEntities` applies exponential decay at read, filters composted facts, sorts by *effective* confidence. | `icarus/src/memory/queries.ts` |
| **Embeddings** | Local MiniLM-L6-v2 (384-d, ONNX); lazy singleton, FIFO cache; empty input throws. | `icarus/src/memory/semantic-embeddings.ts` |

The two ideas worth stealing: **(a) confidence + decay-on-read** = a record that strengthens with repetition
and fades without it (exactly how "objective truth" should accumulate); **(b) hash dedup with confidence-bump**
= the same fact mentioned twice gets *stronger*, not duplicated.

---

## 2. Doubles' memory/DB — how it works + the primitives

Doubles took Juno's spine and added a **hybrid retrieval layer** so each turn surfaces the *relevant* slice of
the record, plus a deterministic-counters table read every turn. Same Postgres/Neon, same fail-loud, same MiniLM.

| Primitive | Purpose (one line) | File |
|---|---|---|
| **`messages` (= memory)** | The message log IS the conversation memory; re-read last N each turn. | `doubles/src/memory/schema.ts` |
| **`shadow_entities`** | RRF-ranked fact store (`canonical_name, entity_type, summary, confidence, provenance`). | `doubles/src/memory/schema.ts` |
| **`entity_embeddings`** | Vectors for the semantic axis of RRF. | `doubles/src/memory/schema.ts` |
| **`recent_significant_events`** | Append-only log of state-changing events; last-5 fed as context (the "events" analog). | `doubles/src/memory/schema.ts` |
| **`relational_state`** | Deterministic counters (interactions_7d, ratios); interpretation is left to the LLM. *"State is data, interpretation is semantic."* | `doubles/src/memory/schema.ts` |
| **RRF memory layer** | Per turn: rank every fact by **semantic (2) + keyword (1) + recency (0.5)** Reciprocal Rank Fusion, return top-5 + full history + `allEntityNames`. Cold-start (0 facts) → log + empty, never throw. | `doubles/src/context/layers/memory.ts` |
| **Embeddings** | MiniLM-L6-v2, cosine = dot (pre-normalized). ~30 MB download on first embed. | `doubles/src/memory/embeddings.ts` |
| **Verification store** | Tiny single-use code table (`pending_verifications`) — the provider/account-binding analog. | `doubles/src/verification/store.ts` |

The idea worth stealing for DOT: **RRF retrieval** is how a *new* story gets matched against the *whole*
accumulated record without dumping all of it into the prompt — score every fact, take the top few, and crucially
keep `allEntityNames` around so a real fact that didn't rank "isn't invented" but also isn't shoved in.

---

## 3. The adapted DOT memory/DB design (the SIMPLEST thing that delivers the mirror)

DOT's mechanism in one line: **a new story's SUBJECTIVE claim is reflected against the accumulated OBJECTIVE
record + synthetic behavioral data, and the DELTA is the demo moment.** The store exists to hold that record and
make the comparison cheap. Per SOTARE *one-clear-purpose-per-primitive* and *satisfice-then-stop*, that is **five
tables and one retrieval function** — no decay engine, no RRF weights tuning, no bitmask lifecycle on day one.

### The tables (SQLite/Postgres; in-proc `Map` mirror first)

```
users        { id PK, name, created_at }                          -- one row; demo is single-user
messages     { id, user_id, role('user'|'dot'), content, ts }     -- the raw story/conversation input (Juno verbatim)
stories      { id, user_id, transcript, subjective, objective,    -- one row per told story = a "glass dot"
               delta, created_at }                                --   subjective/objective/delta are TEXT or JSONB
events       { id, user_id, kind, label, value, source, ts }      -- the accumulating OBJECTIVE record + synthetic data
stat_sheet   { user_id, metric, count, window, computed_at }      -- derived aggregates (a VIEW is even simpler)
```

- **`messages`** — PORT near-verbatim from Juno/Doubles (`direction/role`, `content`, `ts`, `(user_id, ts DESC)`
  index). This is the conversation/story *input*. Don't re-invent it.
- **`stories`** — NEW (DOT's contract). One row per told story holding `{ subjective, objective, delta }` — these
  ARE the glass dots the frontend renders. Mirror the exact field names from `docs/CONTRACTS.md` so no panel
  invents a shape. ADAPT Juno's `shadow_entities` *pattern* (a per-user durable record with a summary + provenance)
  but the columns are DOT's three-part split, not Juno's wiki shape.
- **`events`** — the load-bearing one. This is the **accumulating objective record + the synthetic behavioral
  data, unified in one table**: `kind` (`message_received`, `call`, `panic_attack_logged`, `calendar`, …),
  `label`/`value`, and `source` (`'story'` for facts DOT extracted, `'synthetic'` for the seeded "50 texts").
  Counter-evidence ("your friends texted you 50× this week") is just `SELECT count(*) FROM events WHERE
  kind='message_received' AND ts > now()-7d`. ADAPT from Doubles' `recent_significant_events` (append-only, typed
  `kind`) — but keep ALL of them, not last-5, because the longitudinal mechanism needs the full history.
- **`stat_sheet`** — derived. "panic attacks logged: 21 in 21 days" is `GROUP BY kind` over `events`. Make it a
  **SQL VIEW or a function**, not a stored table, until you actually need to cache it. (SOTARE subtraction pass:
  this is the first thing to cut to a view.)
- **`provider_summary`** — NOT a table. A function `buildProviderSummary(user_id)` that reads `stat_sheet` +
  recent `stories` and renders text/JSON. One purpose, zero new persistence.

### What to PORT vs ADAPT vs SKIP

| From | PORT near-verbatim | ADAPT | SKIP |
|---|---|---|---|
| **Juno** | `connection.ts` shape (`query/execute`), `messages` table, hash-dedup idea for `events`, fail-loud `CREATE TABLE IF NOT EXISTS` | `shadow_entities` confidence/`provenance` → DOT's `stories` + `events.source`; decay-on-read → *optional* recency weight | bitmask lifecycle, decay engine, trust scores, thompson/flywheel/nudge/hypotheses — all 20+ proactivity tables |
| **Doubles** | RRF memory layer (`memory.ts`) as the retrieval fn, `embeddings.ts` (only if you keep semantic match) | `recent_significant_events` → DOT's `events` (keep full history, add `source`) | `relational_state`, RLS policies, persona/MBTI, tapbacks, verify-by-text (no provider account on day one) |

### The retrieval pattern (how a new story gets reflected)

This is the only function that matters. Port Doubles' `loadMemoryLayer` and retarget it:

1. User tells a story → extractor (your `extract` node, the `life-synthesis.ts` pattern) returns
   `{ subjective, objective }`.
2. **Reflect:** pull the counter-evidence from the accumulated record —
   `events WHERE kind ∈ relevant AND ts > window` (aggregate counts) **+** optionally RRF-rank prior `stories`
   by similarity to the new `subjective` (semantic 2 / keyword 1 / recency 0.5, k=60) to surface "you said this
   before." For a 9-hr build, **a flat windowed `COUNT(*)` over `events` is enough** — RRF over `stories` is a
   stretch goal, not the demo.
3. **Delta** = the LLM (or a template) framing `objective` against `subjective` ("you feel X; the record shows
   Y"). Persist the full `{subjective, objective, delta}` row to `stories` (it becomes a glass dot) and append any
   newly-extracted facts to `events` with `source='story'`. **Prove the roundtrip** (write → re-read → render) —
   SOTARE *no-silent-persistence*.

### Recommended store for 9 hours

**In-proc `Map` first (per `docs/ARCHITECTURE.md`), then SQLite via Drizzle/`better-sqlite3` as the real store.**
Skip Postgres/Neon unless you're already deploying serverless — the whole engine here is synchronous, single-user,
and a few hundred rows. SQLite is one file, zero infra, and the same SQL ports straight from Juno/Doubles. The Map
fallback satisfies "real, documented fallback, no silent stub" and lets S1 run before the store exists.

---

## 4. Modularity toward the end-goal ("reflect your whole life")

The "whole life" vision = many data connectors (texts, calls, calendar, Spotify, …) feeding the objective record.
The design above is *already* the seam: **everything a connector knows lands as rows in `events`.** Keep that one
chokepoint and the system grows without a rewrite:

- **One ingest interface.** Define `Connector { name; pull(user_id, window) → Event[] }`. The synthetic-data
  seeder is just `SyntheticConnector` implementing it. A real iMessage/Calendar connector implements the *same*
  interface later. The mirror's reflect step never learns where an event came from — it only reads `events`.
- **`events.source` is the registry.** `'synthetic'` today, `'imessage'`/`'gcal'` tomorrow. The provider summary
  and stat-sheet aggregate by `kind`, agnostic to `source`. New connector = new `source` value + new `kind`s, no
  schema change.
- **`kind` is an open vocabulary, not an enum constraint** (unlike Doubles' `CHECK(...)`). A new connector adds
  new kinds without a migration. Keep one TS union type for the *known* kinds for autocomplete; don't enforce it
  in SQL.
- **Retrieval stays one function.** Adding connectors changes *what's in* `events`, never how the mirror queries
  it. That's the whole point of routing every source through one table.

So: build the `Connector` interface + `events` table on day one even though only `SyntheticConnector` exists.
That single abstraction is the difference between "add a connector" and "rewrite the memory layer."

---

## 5. Honest gotchas

- **Embeddings are probably overkill for the demo.** Doubles' MiniLM is a ~30 MB download on first embed
  (cold-start latency mid-demo) and earns its keep only for semantic recall over *hundreds* of facts. DOT's demo
  reflects against a handful of seeded events — a windowed `COUNT(*)` + keyword match beats it for both speed and
  legibility. **Skip embeddings on day one**; keep `embeddings.ts` on the shelf for the "RRF over prior stories"
  stretch goal. If you do warm it, do it at boot, not on the first user turn.
- **Synthetic seeding is the actual product risk, not the schema.** The "50 texts" only lands if the seeded
  `events` are *plausible and pre-loaded*. Build a `seed.ts` that inserts a believable 7–21 day history of
  `message_received` / `call` / `panic_attack_logged` rows **before** the demo, version it in `data/`, and make it
  idempotent. The delta is only as good as the counter-evidence behind it. This is where the demo-path polish goes.
- **Persist the roundtrip, prove it.** A `stories` row that "saved" but doesn't re-render on refresh is the LARP
  failure (`PORT-SOTARE-CONSTRAINTS.md` #41). Wire write → re-read → render and watch a glass dot survive a reload
  before calling persistence done.
- **Don't over-build the lifecycle.** Juno's decay/bitmask/composting and Doubles' RRF weight-tuning are months of
  production hardening for a *living* assistant. DOT is a 9-hr mirror over synthetic data — facts don't need to
  decay, the record doesn't need garbage collection, and there's no multi-tenant RLS to enforce (one demo user).
  **Cut all of it.** One table per purpose, one retrieval function, one seed script. Satisfice, then stop.
