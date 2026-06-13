# CLAUDE.md — DOT (live hackathon, 2026)

You are working in **DOT**, Johnny Sheng's hackathon project. This file is your map and operating contract.
Read it first; drill into linked docs only when your task needs them.

> **Status: SCAFFOLDING.** The **design** is LOCKED (`design/`) and the **operating discipline** is LOCKED
> (below + `docs/`). The **mission — what DOT does — is NOT decided yet.** Every idea-specific slot in this
> repo is a loud `⏳ MISSION TODO` block. **Do not invent the product.** When Johnny locks the mission, he drops
> it in `docs/MISSION-INTAKE.md`; propagate the six answers into `docs/SCOPE-LOCK.md` first, then the chain
> (CONTRACTS → ARCHITECTURE → SPONSORS → KEYS → DEMO-SCRIPT), then run `docs/GOAL.md` to start the build. Build
> the end-to-end skeleton first; tune content after it runs.

## TL;DR — what this is

> ⏳ **MISSION TODO (Johnny fills the one-liner):** the single sentence that says what DOT does and why it
> matters — the kind a stranger gets in one breath. Until then, what IS known: **DOT** is a live-hackathon
> product built in Johnny's frozen **clean-blue** design language (a calm white room where one trust-blue
> conversation does all the talking; the thread is the product, data arrives as rich bubbles, almost no words).
> The mission goes here; the design and discipline below already hold. Tagline: ⏳ MISSION TODO.

## The engine (the node graph — this WILL be the product)

> ⏳ **MISSION TODO:** the journey graph. See `docs/ARCHITECTURE.md` for the locked node *contract* (typed
> stages, one Zod boundary each, a single accumulating context) and the `⏳ TODO` graph to fill once the
> mission and its ≤6-step journey are locked (`docs/SCOPE-LOCK.md`). The node graph is meant to be *watchable*
> live on the conversation surface — events stream in as rich bubbles.

## Operating distinctions (these change how you behave)

1. **Ideation vs execution.** Ideation (the mission, the demo content) is Johnny's — **don't invent it**, flag
   what's missing. Execution (scaffold, wiring, the design system) is yours to build now. The design is LOCKED;
   build it, don't re-litigate.
2. **Demo path vs everything else.** The demo path = `docs/DEMO-SCRIPT.md`. That code gets polish + error
   handling. Everything else gets the minimum to not crash. Always ask: *"does this make the 3-min demo
   better?"*
3. **Real vs cached vs mocked.** Real = computed live (default). Cached = pre-built demo inputs in `data/` as a
   stage fallback. Mocked = dev-only, env-gated (`MOCK_*=1`). **No silent stubs, ever** — a failure logs
   structurally and renders a visible FAILED badge (`design/` fail-LOUD).
4. **Locked vs open.** Locked → `docs/DECISIONS.md` + `docs/CONSTRAINTS.md` (changing one needs Johnny). Open →
   `docs/OPEN-QUESTIONS.md` (flag a collision as a finding, keep moving, don't decide it silently).
5. **Hackathon clock.** Ship > elegant. Working ugly beats broken beautiful. But: no silent stubs, and
   "done/working" requires a **run command + observed output**.

## Read these first (in order)

0. `docs/SCOPE-LOCK.md` — **the ONE problem, crystal input/output, the linear journey, and the CUT list. The
   simplicity law. Read before anything.** (Currently `⏳ MISSION TODO` — the mission lands here first.)
1. `docs/DECISIONS.md` — **the locked calls (name, design, discipline) vs the OPEN mission questions (M1–M7).**
2. `docs/ARCHITECTURE.md` — the node graph, monorepo layout, per-node I/O, data flow. Single source of truth.
3. `docs/CONTRACTS.md` — the typed boundaries (context object / events / store schema / API). Build to it EXACTLY.
4. `docs/CONSTRAINTS.md` — the locked, non-negotiable rules.
5. `docs/BUILD-LOOP.md` — how we build, stage by stage (S0–S4) + the clock.
6. `docs/DEMO-SCRIPT.md` — the judge-facing walkthrough = the demo path.
7. `docs/SPONSORS.md` — each sponsor's seam + minimal integration + where it shows on screen.
8. `docs/KEYS.md` — env vars + credentials the build needs.
9. `docs/PRIZE-PLAN.md` — which prizes we play for + the line that wins each.
10. `docs/OPEN-QUESTIONS.md` — the running findings log (don't block; flag here).

Design law: `docs/DESIGN.md` (the in-repo pointer) → `design/` (the full, frozen taste library).

To unlock + start the build: `docs/MISSION-INTAKE.md` — **where Johnny writes the mission (the one missing
piece)** — then `docs/GOAL.md` — the `/goal` kickoff that turns the locked docs into a running product (it
HALTS if the mission slots are still blank, by design).

## Repo map

```
dot/
├── CLAUDE.md                  ← this file (the map)
├── README.md                  ← public-facing stub
├── design/                    ← FROZEN taste library (the design IS locked — do not edit, build to it)
│   ├── README.md · 00-PRINCIPLES.md · 01-TOKENS.md · tokens.css
│   ├── 02-MOTION.md · 03-COMPONENTS.md · 04-FLOW.md
│   ├── 05-NEW-BRAND.md        ← the clean-blue skin → READ THIS for DOT's look
│   └── moodboard/             ← references we're recreating + FINGERPRINT.md (Johnny's 4 pillars)
├── docs/                      ← canonical context (read order above)
│   ├── MISSION-INTAKE.md      ← ⏳ Johnny drops the mission here (the only missing piece)
│   ├── GOAL.md                ← the /goal kickoff that launches the build (halts if mission blank)
│   ├── SCOPE-LOCK.md · DECISIONS.md · ARCHITECTURE.md · CONTRACTS.md
│   ├── CONSTRAINTS.md · BUILD-LOOP.md · DEMO-SCRIPT.md · SPONSORS.md
│   ├── KEYS.md · PRIZE-PLAN.md · DESIGN.md · OPEN-QUESTIONS.md
│   └── reference/             ← deep planning docs (added as written)
├── packages/
│   ├── lab/                   ← the EXPERIMENTAL visual window (Vite) — hone visual assets in clean-blue [live]
│   ├── frontend/              ← the conversation surface (Next + the design system)  [planned]
│   └── backend/               ← the engine / node graph                              [planned]
├── data/                      ← cached demo inputs (fallback if live path fails)     [planned]
└── .env                       ← real keys (gitignored; see docs/KEYS.md)             [planned]
```

Update this map whenever the top-level layout changes. A stale map is worse than no map.

## Design system (the clean-blue world — full law in `docs/DESIGN.md` → `design/`)

The design is **LOCKED.** Wrap the app in `class="brand-clean-blue"`, import `design/tokens.css`, lift the
recipe classes + motion keyframes verbatim. The essentials:
`--page:#ffffff (the room) · --ink:#0b1620 (one cool ink, 6 alphas, all text, never pure black) · --blue:#007AFF
(the ONLY accent — the whole AI/you conversation channel)`. **No borders** (depth from light: ring-shadow
stacks ≤1px). Type: Onest 340/430/450/480 (never 400/600) + IBM Plex Mono (system voice) + Departure Mono
(numerals). Motion: `cubic-bezier(.16,1,.3,1)`, **nothing bounces**, `blur-up` on content change, ≤1 whimsy per
surface, **confetti only on a human's yes**. The **conversation/thread is the primary surface** — every turn is
the right *shape* (stat / card / chart / chips / inline-form), **never a paragraph where a shape will do.** Hard
BANs (healthcare-cliché): teal/green-as-brand, medical iconography, form-first screens, clinical photography,
red-for-routine, dashboard-as-home.

## API surface

| Method | Path | Returns |
|---|---|---|
| ⏳ TODO | ⏳ TODO | starts a run → `{ runId }` |
| ⏳ TODO | ⏳ TODO | a run object (rehydrate on refresh) |
| ⏳ TODO | ⏳ TODO | the live event stream |

> ⏳ **MISSION TODO:** fill once the stack (M5) + contracts (`docs/CONTRACTS.md`) are locked. Keep this table
> and the one in `docs/CONTRACTS.md` identical — never let them drift. Every frontend panel consumes a real
> endpoint/event — **no panel renders invented data.**

## Key constraints (locked — full list `docs/CONSTRAINTS.md`)

1. **No silent stubs.** Failures visible + logged; mocks env-gated, dev-only.
2. **Demo path is sacred.** Polish there; nowhere else.
3. **Main always demoable.** One run end-to-end before any parallelism or polish.
4. **Sponsors are load-bearing + named on screen.** Each CORE sponsor is a real seam on the one line; **don't
   add a node for a badge.** (Count + names: ⏳ MISSION TODO — `docs/SPONSORS.md`.)
5. **The design system is frozen.** Build to `design/`; no new colors, no second gray, no borders, nothing
   bounces, one accent. The healthcare-cliché BAN list is a hard rule.
6. **Ship > elegant.** Working ugly beats broken beautiful; "done" needs a run command + observed output.
7. **Don't be a blocker.** Flag conflicts as findings in `docs/OPEN-QUESTIONS.md`, keep moving.
8. **The mission is Johnny's.** Never fabricate a product, problem, input/output, sponsor list, or architecture.
   Every idea-specific slot stays a `⏳ MISSION TODO` until he fills it.

## Build order (stages — full detail `docs/BUILD-LOOP.md`)

- **S0** (~15m): scaffold monorepo (the layout above), env from `docs/KEYS.md`, types verbatim from
  `docs/CONTRACTS.md`, wire the design system (`brand-clean-blue` + `design/tokens.css`).
  ⏳ MISSION TODO (M5): confirm the stack.
- **S1**: one run end-to-end on STUB — nodes emit the full event sequence with canned content; the conversation
  surface renders the live stream as rich bubbles. Prove the pipe before the intelligence. ⏳ MISSION TODO (M3):
  the node list.
- **S2**: real nodes. THE demo moment fires on a real input. ⏳ MISSION TODO (M1/M6).
- **S3**: persistence (in-proc Map fallback first) + trace + the rich bubbles the output needs. ⏳ MISSION TODO
  (M4/M5).
- **S4**: remaining CORE sponsors on-line + deploy + polish to `design/`. **Freeze, then submit.** ⏳ MISSION
  TODO (M4/M7).

Leave story COPY/prompts in clearly-marked editable consts so Johnny tunes content after the skeleton runs.
