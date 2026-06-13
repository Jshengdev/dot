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

**Build findings (L0–L4, 2026-06-13):**
- [OPEN → carry to L5] **Multi-turn memory not wired into the call.** `turn.ts` assembles a ≤2-layer ContextPacket (history + recentStories + evidence) but does NOT feed history/recentStories into the reasoning call — `extract.ts` re-derives grounding from `events` only. Fine for the single-turn demo; MUST wire before L5 (continuous iMessage conversation = the "remembered relationship", DIGEST §4.2). Also dedupe the evidence read (derived twice/turn: turn.ts + extract.ts).
- [OPEN → TONE/SAFETY, needs Johnny] **Crisis branch post-clearance content.** The human-on-risk PAUSE works (durable WaitForSignal). But after clearance, the director currently produces a normal counter-evidence reflection on a self-harm transcript ("everyone would be better off without me" → "…the record shows friends reached out…"). Counter-evidencing active suicidal ideation may be wrong; doctrine routes crisis → human, not reframe. Decide: crisis → help-routing message only (no counter-evidence delta), vs. normal reflection once a human clears.
- [OPEN, non-blocking] **`refine` step is a provable no-op** (director.ts self-assign). Keep the seam (SCOPE-LOCK journey step 5) but make it an explicit pass-through or a real wider-window re-query, not a retry that can't retry.
- [RESOLVED] **`waitForSignal` instead of `waitForEvent`** (L4). `@inngest/test@1.0.0` + `inngest@4.5.1` makes a mocked `waitForEvent` resume un-CLI-verifiable; `waitForSignal` carries the same `dot/human.cleared` semantics with per-run targeting (arguably more correct). Note for demo Q&A.
- [RESOLVED] **Mission is effectively locked** in `docs/reference/DOT-RESEARCH-DIGEST.md` (objective-mirror); the build is proceeding on it. The `⏳ MISSION TODO` placeholders above predate the digest.
