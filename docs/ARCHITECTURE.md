# ARCHITECTURE — DOT. The node graph, the layout, the data flow. Single source of truth.

> ⏳ **MISSION TODO (Johnny fills the graph + per-node I/O).** This file LOCKS the *shape* of the engine —
> typed nodes, one validated boundary per node, a single accumulating context — but the actual nodes depend
> on the mission. Fill the graph + table once `docs/SCOPE-LOCK.md` is locked.

## The node graph (the engine — this IS the product)

The journey from `docs/SCOPE-LOCK.md`, drawn as a graph of typed nodes. The reference repo's shape (kept as
the *form* to imitate, NOT the content):

```
[step1] → [step2] → [step3] → [emit] → [out]
                       │
                      loop (≤N retries)
                       ↓
                   [recover] ──→ back to a prior step
```

> ⏳ **MISSION TODO:** replace with DOT's real graph. Keep it linear with at most one loop (SCOPE-LOCK law).
> Each node should be one verb. Mark the node that fires THE demo moment.

## The node contract (LOCKED — independent of mission)

Each node is a **typed stage**: `defineNode({ inputSchema: zod, outputSchema: zod, executor })`. An
accumulating context object flows through; each node reads its slice + writes its slice + emits one event.
**One Zod-validated boundary per node, no spaghetti.** Clean conduct = one boundary in, one boundary out.

## Per-node I/O (the typed contract)

| node | input | output | sponsor on this node |
|---|---|---|---|
| ⏳ TODO | `{ … }` | `{ … }` | ⏳ TODO |
| ⏳ TODO | `{ … }` | `{ … }` | ⏳ TODO |

> ⏳ **MISSION TODO:** fill one row per node, with the exact Zod-shaped input/output and which sponsor (if any)
> is load-bearing on that node. A node with no clear I/O is not ready to build.

## Engine I/O (LOCKED shape, ⏳ TODO content)

- **Input:** the crystal input from `docs/SCOPE-LOCK.md` (⏳ TODO).
- **Output:** the complete accumulating context — the grounded result + any score/trajectory + the rendered
  artifact (⏳ TODO). One object, fully typed in `docs/CONTRACTS.md`.

## Monorepo layout (the shape — packages land in S0/S1)

```
dot/
├── CLAUDE.md                  ← the map / operating contract
├── README.md                  ← public stub
├── design/                    ← FROZEN taste library (the design IS locked)
│   ├── 00-PRINCIPLES.md · 01-TOKENS.md · 02-MOTION.md · 03-COMPONENTS.md
│   ├── 04-FLOW.md · 05-NEW-BRAND.md (clean-blue) · README.md · tokens.css
├── docs/                      ← canonical context (read order in CLAUDE.md)
│   └── reference/             ← deep planning docs (added as written)
├── packages/                  ← ⏳ MISSION TODO: lands in S0/S1 once the stack (M5) is chosen
│   ├── frontend/              ← the conversation surface (Next + the design system)  [planned]
│   └── backend/               ← the engine / node graph                              [planned]
└── data/                      ← cached demo inputs (fallback if live path fails)     [planned]
```

> Update this map whenever the top-level layout changes. A stale map is worse than no map.

## Data flow (LOCKED shape, ⏳ TODO endpoints)

- Client triggers a run → engine runs the nodes in order → each node emits a typed event over a live stream →
  the frontend routes events into the conversation surface (rich bubbles) as they arrive.
- Each run is also persisted so a refresh rehydrates from a stored record (not re-run).
- > ⏳ **MISSION TODO:** name the live-stream transport (ws/SSE), the store, and the rehydrate endpoint once M5
>   is chosen. Fill the API table in `CLAUDE.md` + `docs/CONTRACTS.md`.

## Real vs cached vs mocked (LOCKED)

- **Real:** computed live (the default).
- **Cached:** pre-built demo inputs in `data/` as fallback if a live call fails on stage.
- **Mocked:** dev-only, env-gated (`MOCK_*=1`). **No silent stubs** — a failure logs structurally and renders a
  visible FAILED badge (per `design/` §C12 fail-LOUD).
