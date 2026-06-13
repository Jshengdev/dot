# GOAL.md — the `/goal` kickoff that launches the DOT build

> **What this is.** Paste this whole file (or run `/goal docs/GOAL.md`) to start the build. It is the
> single instruction that turns the locked docs into a running product. The **process** below is fully
> written and ready. The **mission-specific** bits are marked `> ⏳ MISSION TODO` — they unlock the moment
> Johnny fills `docs/MISSION-INTAKE.md` and that propagates into the lock-docs. **Do not run this until the
> MISSION TODO blocks are filled** (the engine will refuse — see STEP 1).

---

## You are the build engine for DOT

You are the build engine for **DOT**, Johnny's live hackathon project. Your job is to take the LOCKED
context in `docs/` and the LOCKED design system in `design/` and ship a working, demoable product
end-to-end before the deadline. You build the skeleton first and prove every seam live; you tune story
content only after it runs. **Ship > elegant. Working ugly beats broken beautiful.** But: no silent stubs,
the demo path is sacred, and a sponsor sits on every step.

---

## STEP 1 — Read the context IN ORDER, then confirm scope (do this before touching code)

Read these, in this order. Do not skim past the first three.

0. `docs/SCOPE-LOCK.md` — **the ONE problem, the crystal input, the crystal output, the linear journey, and
   the CUT list. The simplicity law. Read before anything.**
0b. `docs/DECISIONS.md` — the locked architecture / input / output / sponsor-seam calls.
1. `docs/ARCHITECTURE.md` — the node graph, the layout, per-node I/O, the data flow. Single source of truth.
2. `docs/CONTRACTS.md` — the typed contracts (the run object, the events, the API surface). Build to this EXACTLY.
3. `docs/CONSTRAINTS.md` — the locked rules. These override convenience.
4. `docs/SPONSORS.md` — each sponsor's seam + minimal integration + where it shows on screen.
5. `docs/DEMO-SCRIPT.md` — the judge-facing walkthrough = the demo path = the only code that gets polish.
6. `docs/KEYS.md` — where the working keys/.env come from. Copy, don't recreate.
7. `design/README.md` then `design/00-PRINCIPLES.md` + `design/05-NEW-BRAND.md` + `design/tokens.css` — the
   LOCKED design system. The dashboard you build must be in this language from the first pixel.

**The gate (mandatory).** Before authoring any workflow, **confirm scope in ONE paragraph**: restate the
ONE problem, the crystal input, the crystal output, the hero/"catch" moment, and the 5 core sponsors and
where each lands on the demo line. Then list the per-node I/O you will build to.

> ⏳ **MISSION TODO (the engine HALTS here if these are still blanks):** if `docs/SCOPE-LOCK.md` still
> contains unfilled `⏳ MISSION TODO` placeholders for the ONE problem / input / output / hero moment, or
> `docs/SPONSORS.md` has no concrete sponsor list, **STOP and tell Johnny the mission isn't locked yet —
> point him at `docs/MISSION-INTAKE.md`.** Do not invent a product to keep moving. The discipline is the
> point: you cannot build what isn't locked.

---

## STEP 2 — Author and run an ultracode Workflow (staged, live-tested from the first node)

Author a single ultracode **Workflow** with the stages below as discrete, checkpointed steps. Run it stage
by stage. **Live-test from the very first node** — do not batch up untested code. **Verbose-log every seam**
(every node boundary, every sponsor call, every event emitted) so the pipe is observable before the
intelligence is real.

### S0 — Scaffold + env + types (~15 min)
- Scaffold the monorepo (the layout in `docs/ARCHITECTURE.md`; pnpm workspace).
- Copy the working `.env` per `docs/KEYS.md` — **do not recreate keys; reuse the proven ones.** Confirm
  `.env` is gitignored.
- Write the typed contracts **verbatim** from `docs/CONTRACTS.md` into the shared types module. The
  contract is law; everything downstream imports from here.
- **Done when:** repo installs, type-checks, and a `dev` command boots backend + frontend with no errors.

### S1 — One path end-to-end on STUB, streaming to the design-system dashboard (the first milestone)
- Wire the full node sequence emitting the **complete event stream with canned/stub content**. No real
  intelligence yet — prove the pipe.
- The dashboard renders the live node graph / conversation **from the real event stream**, in the locked
  design language (`design/`). Not a mock screen — the real component reading the real stream.
- **Done when:** you trigger one run and watch the whole journey animate end-to-end on stub data, in-brand.
  This is "prove the pipe before the intelligence."

> ⏳ **MISSION TODO:** the exact node sequence + the stub content for each step come from
> `docs/SCOPE-LOCK.md` (the linear journey) and `docs/DEMO-SCRIPT.md` (the beats). Stub the content of the
> hero/"catch" moment so it's visible even before real wiring.

### S2 — Real wiring with sponsors (replace stubs node by node; the hero moment fires for real)
- Replace each stub with the real integration, one node at a time, live-testing after each swap.
- Each of the 5 core sponsors lands on its step per `docs/SPONSORS.md`, **named on screen** where it acts.
- The hero/"catch" moment must fire on a **real** input, not a fixture.
- **Done when:** one real input runs the whole journey live and the hero moment lands. Keep a cached
  fallback input (`data/` per `docs/ARCHITECTURE.md`) for when the live source flakes — fallback is
  explicit and visible, never a silent stub.

> ⏳ **MISSION TODO:** the real integrations, the sponsor-per-step mapping, and the live demo subject come
> from `docs/SPONSORS.md` + `docs/DECISIONS.md` + `docs/DEMO-SCRIPT.md`.

### S3 — Persistence + trace + polish to the design spec
- Persistence/archive + any trajectory/history per `docs/ARCHITECTURE.md` (in-memory fallback first, real
  store second — never block S2 on the store).
- Trace the loop (one wrapper, zero added node complexity).
- Polish the demo path **only** to `design/` — motion, the signature gestures, the in-brand details. Hold
  the design system: depth-from-light, one accent, mono = system voice, ≤1 whimsy per surface.
- **Done when:** the demo path is in-brand and recordable, and a refresh rehydrates a run.

### S4 — Deploy + freeze
- Deploy so the output lives somewhere (per `docs/SPONSORS.md`). Grab the URL.
- **Freeze early, submit with buffer** (see `docs/DEMO-SCRIPT.md` / the deadline in `docs/SPONSORS.md`).
- **Done when:** a public URL runs the demo path, the repo is public, `.env` is not in it, and the
  submission checklist is green.

---

## The hard rules (these override convenience — full list in `docs/CONSTRAINTS.md`)

1. **No silent stubs, ever.** A failure logs structurally and renders a visible FAILED state. Mocks are
   dev-only and env-gated. Cached fallbacks are explicit and labeled.
2. **The demo path is sacred.** Polish + error-handling live on the `docs/DEMO-SCRIPT.md` path and nowhere
   else. For every other line of code, ask: "does this make the demo better?" If no, do the minimum.
3. **Build to the contract.** `docs/CONTRACTS.md` is law. Every panel consumes a real endpoint/event — no
   panel renders invented data.
4. **A sponsor on every step, named on screen.** The 5 core sponsors each sit on the demo line
   (`docs/SPONSORS.md`). Don't add a node just to earn a badge.
5. **Main is always demoable.** One input end-to-end before any parallelism, breadth, or polish.
6. **Live-test from the first node. Verbose-log every seam.** "Done/working" requires a run command + the
   observed output. No claiming green without watching it run.
7. **Design is locked — build in it from pixel one.** The dashboard reads the real event stream in the
   `design/` language immediately; you do not "style it later."
8. **Don't be a blocker.** Open collisions → flag as a finding in `docs/OPEN-QUESTIONS.md`, keep moving.
   Locked things (`docs/CONSTRAINTS.md` / `docs/DECISIONS.md`) → change needs Johnny.
9. **Leave story COPY/prompts in clearly-marked editable consts** so Johnny tunes the narrative after the
   skeleton runs.

---

## The design-system mandate (non-negotiable)

Everything the judge sees is rendered in the **locked DOT design language** in `design/`. Before you write a
component, lift the bedrock: copy `design/tokens.css`'s `:root` (and the `brand-clean-blue` override) verbatim,
reuse the named recipe classes and motion keyframes from `design/01-TOKENS.md` / `design/02-MOTION.md` /
`design/03-COMPONENTS.md`, and obey the constitution in `design/00-PRINCIPLES.md`. The new-brand spec is
`design/05-NEW-BRAND.md` (clean white + trust-blue `#007AFF`, iMessage-bubble warmth, Grok-minimal,
conversation-as-data-density, visual-first / least-text, healthcare-adjacent but **deliberately NOT looking
like healthcare** — every medical cliché is banned). Font-harden per `design/README.md` (self-host woff2,
`.variable` classes on `<html>`, inline fallback chains) — never skip the guard.

---

## STOP condition (when you are done)

You are done when **all** of these are true — and not before:
- A real input runs the **entire** journey live, end-to-end, and the hero/"catch" moment lands on screen.
- Every panel reads a real endpoint/event; no invented data; no silent stubs (failures show a FAILED state).
- All 5 core sponsors are wired on their step and named on screen.
- The demo path matches `docs/DEMO-SCRIPT.md` and is rendered in the `design/` language.
- A public deploy URL serves the demo path; the repo is public; `.env` is gitignored.
- The submission checklist is green with time to spare.

If you hit any `⏳ MISSION TODO` you cannot resolve from the lock-docs, **STOP and surface it as a finding**
— do not invent the missing piece to keep moving.
