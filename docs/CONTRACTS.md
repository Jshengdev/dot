# CONTRACTS — the typed boundaries. Build to this EXACTLY.

> ⏳ **MISSION TODO (Johnny fills the types).** This file is the single source of truth for every shape that
> crosses a node boundary, the live event stream, the store schema, and the API. The *structure* of this doc
> is locked; the types depend on the mission (`docs/SCOPE-LOCK.md` → `docs/ARCHITECTURE.md`). When a type is
> here, it is canon — the frontend and backend both import it; no panel renders a shape that isn't defined here.

## The core context object

The single accumulating object that flows through the node graph and is returned by the engine.

```ts
// ⏳ MISSION TODO: name + fields once input/output (M2) are locked.
// Pattern: one root type that grows a slice per node, ending with the rendered artifact + any score/trajectory.
export type DotRun = {
  id: string;
  // input: …            ⏳ TODO (the crystal input)
  // <slice per node>: … ⏳ TODO
  // output: …           ⏳ TODO (the rendered artifact)
  // generations?: …     ⏳ TODO (if there's a retry/loop, the trajectory)
  status: 'running' | 'done' | 'failed';
};
```

## Per-node slice types

> ⏳ **MISSION TODO:** one type per node from the `docs/ARCHITECTURE.md` table. Each is the `outputSchema` of
> its node and a slice of `DotRun`.

## The live event stream

The frontend consumes a typed event stream and routes each event into the conversation surface. Every panel /
bubble maps to a real event — **no panel renders invented data.**

```ts
// ⏳ MISSION TODO: enumerate the events the engine emits (one per node start/finish, plus the THE-moment event).
export type DotEvent =
  | { type: 'node:start'; node: string; runId: string }
  | { type: 'node:done';  node: string; runId: string; data: unknown } // ⏳ TODO: type `data` per node
  | { type: 'run:failed'; runId: string; node: string; error: string } // fail LOUD — renders a FAILED badge
  // | { type: '<THE moment>'; … }  ⏳ TODO: the event the demo is built around
  ;
```

## Store schema

> ⏳ **MISSION TODO:** the persistence schema for a run (so a refresh rehydrates, not re-runs). Depends on the
> data store chosen in M5. Until then, an in-process `Map<id, DotRun>` is the fallback (no silent stub — it's a
> real, documented fallback).

## API surface

| Method | Path | Returns |
|---|---|---|
| ⏳ TODO | ⏳ TODO | starts a run → `{ runId }` |
| ⏳ TODO | ⏳ TODO | a `DotRun` (rehydrate on refresh) |
| ⏳ TODO | ⏳ TODO | the live `DotEvent[]` stream |

> ⏳ **MISSION TODO:** fill once the stack (M5) is chosen. Mirror this exact table into `CLAUDE.md`'s API surface
> section so the two never drift.

## The discipline (LOCKED, independent of types)

- One Zod schema validates each node boundary. A node that can't state its input/output schema isn't ready.
- The frontend imports these types; it never invents a shape. If a bubble needs a field that isn't here, the
  field gets added here first.
