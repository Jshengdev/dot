# OPEN-QUESTIONS — flag a collision here, keep moving. Don't decide it silently.

> When you hit a call that isn't in `docs/DECISIONS.md` LOCKED, **add a row here and keep building.** Don't
> block, don't silently decide. Johnny (or the next clear signal) resolves it; then it moves to DECISIONS.

## The big one (blocks all idea-specific docs)

- **[OPEN] The core mission.** What does DOT actually do? Until Johnny locks it (M1 in `docs/DECISIONS.md`),
  every idea-specific slot across the docs is a `⏳ MISSION TODO` placeholder. **Do not invent it.** When it
  lands, fill `docs/SCOPE-LOCK.md` first, then the chain (CONTRACTS → ARCHITECTURE → SPONSORS → KEYS →
  DEMO-SCRIPT), then run `docs/GOAL.md`.

## Mission-derived opens (waiting on M1)

- **[OPEN] Crystal input/output shape** (M2) → `docs/CONTRACTS.md`.
- **[OPEN] The node/step graph** (M3) → `docs/ARCHITECTURE.md`.
- **[OPEN] CORE sponsor list + seams** (M4) → `docs/SPONSORS.md`, `docs/KEYS.md`, `docs/PRIZE-PLAN.md`.
- **[OPEN] The stack** — frontend framework, backend, store, LLM provider (M5) → `docs/ARCHITECTURE.md`.
- **[OPEN] THE demo moment** (M6) → `docs/DEMO-SCRIPT.md`.
- **[OPEN] Freeze + submit times** (M7) → `docs/CONSTRAINTS.md`, `docs/BUILD-LOOP.md`.

## Log (append findings as you build)

> Format: `- [OPEN|RESOLVED] <thing> — <context / what's needed> — <who/when resolved>`

- _(none yet — add as the build surfaces collisions)_
