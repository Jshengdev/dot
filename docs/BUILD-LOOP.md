# BUILD-LOOP — how we build, stage by stage. The clock + the order.

> The build *order* is locked even before the mission: prove the pipe before the intelligence, one run before
> any parallelism, demo path before polish. The mission fills in *what* each stage builds.

## The constraint-discipline loop — CP-1..CP-7 (run this on every unit of work)

The whole-day discipline: **find the one thing blocking the demo, do the smallest thing that unblocks it, prove
it ran, move on.** WIP = 1. Bottleneck first. Satisfice — don't gold-plate.

- **CP-1 — On the one line?** Is this on `docs/SCOPE-LOCK.md`? If not, it's a CUT or a finding — not work.
- **CP-2 — Bottleneck first.** What is the single thing most blocking a demoable `main` *right now*? Work that.
  Not the easy thing, not the fun thing — the blocking thing. There is exactly one at a time.
- **CP-3 — WIP = 1.** Finish (to "ran + observed") before starting the next. No half-built parallel threads. A
  second task is started only when the first is demoable.
- **CP-4 — Satisfice, don't optimize.** Pick the smallest implementation that clears the bottleneck and is honest
  (no silent stub). Good-enough that runs beats elegant that doesn't. Polish lives ONLY on the demo path (CP-5).
- **CP-5 — Demo-path test.** Does this make `docs/DEMO-SCRIPT.md` land better? If yes → it earns polish + error
  handling. If no → it gets the minimum to not crash, and nothing more.
- **CP-6 — Log the wiring seam.** Every time two pieces are joined (a node→node boundary, a sponsor call, the
  stream→frontend wire, an env key), **write down the seam**: what shape crosses it, what proves it works, what
  the fallback is. *Wiring seams must be logged* — an unlogged seam is where the demo dies at 3:55. Seams live in
  `docs/CONTRACTS.md` (types) + `docs/KEYS.md` (keys) + a note in the PR/commit.
- **CP-7 — Prove it.** "Done" = a **run command + observed output**, never "should work" (`docs/CONSTRAINTS.md`).
  Hit an OPEN call mid-task? Flag it in `docs/OPEN-QUESTIONS.md`, keep moving — don't block, don't silently decide.

**Build the skeleton end-to-end first**, then tune content. Leave copy/prompts in clearly-marked editable consts
so Johnny tunes narrative after the skeleton runs.

## Stages (S0–S4 — shape locked, content ⏳ TODO)

- **S0 — scaffold (~15m).** Monorepo skeleton (the package layout in `docs/ARCHITECTURE.md`), env from
  `docs/KEYS.md`, write the types from `docs/CONTRACTS.md` verbatim, wire the design system
  (`class="brand-clean-blue"`, `design/tokens.css`).
  - > ⏳ **MISSION TODO (M5):** confirm the stack (frontend framework, backend, store, LLM provider).

- **S1 — prove the pipe (STUB).** One run end-to-end on canned content — every node emits its full event
  sequence, the conversation surface renders the live stream as rich bubbles. **Prove the pipe before the
  intelligence.**
  - > ⏳ **MISSION TODO (M3):** the node list to stub.

- **S2 — real intelligence.** Swap stubs for the real nodes. THE demo moment fires on a real input.
  - > ⏳ **MISSION TODO (M1/M6):** what "real" means + which node is THE moment.

- **S3 — persistence + trace + the rich surfaces.** Store each run (in-proc Map fallback first), add tracing,
  build out the rich bubbles (stat / card / chart / chips) the output needs.
  - > ⏳ **MISSION TODO (M4/M5):** the store + trace sponsors.

- **S4 — sponsors on-line + deploy + polish.** Wire any remaining CORE sponsors (each on the line, named on
  screen), deploy, polish to `design/`. **Freeze, then submit.**
  - > ⏳ **MISSION TODO (M4/M7):** the deploy target + the freeze/submit times.

## The two rails that never bend

- **No silent stubs** (failures render a FAILED badge).
- **Main always demoable** (one run works before anything else).
