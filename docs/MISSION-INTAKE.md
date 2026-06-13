# MISSION-INTAKE.md — drop the core mission here to unlock the build

> ✅ **LOCKED 2026-06-13.** The six answers are crystallized + propagated into `docs/SCOPE-LOCK.md` (the build gate
> reads that one). DOT = the story-based "objective mirror" for anxiety. To change scope, edit `SCOPE-LOCK.md`.

> **Johnny:** this is the ONE place you write down what DOT actually does. The repo's structure, design
> system, and build engine are already set up and waiting. The product idea is the only missing piece — fill
> the six blanks below and DOT goes from "scaffolded" to "ready to build." Keep each answer tight; crystal
> clarity beats length. (This mirrors how `sayhello` locked its scope before a line of code was written.)

---

## The six blanks (fill every one)

### 1. The ONE problem
*One or two sentences. The single real pain DOT solves. If it's not on this line, we don't build it. No toolset, no grab-bag — one problem.*

> ⏳ MISSION TODO (Johnny fills): _______________________________________________

### 2. Crystal INPUT
*Exactly what a user hands DOT to start a run. The simplest possible thing — ideally one field.*

> ⏳ MISSION TODO (Johnny fills): `{ ______ }`  — _______________________________

### 3. Crystal OUTPUT
*Exactly what DOT gives back, and the shape it renders in. Every piece of it must trace to something real, or it gets cut.*

> ⏳ MISSION TODO (Johnny fills): _______________________________________________

### 4. The hero / "catch" demo moment
*The single beat the judge remembers — the thing that happens live on screen that makes the product land. (In sayhello it was the harness catching the agent inventing a fact.) What's DOT's equivalent?*

> ⏳ MISSION TODO (Johnny fills): _______________________________________________

### 5. The hackathon + its sponsors + the deadline
*Which hackathon, the exact submission deadline (with timezone), and the sponsor list — flag which ~5 are CORE (each must sit on the demo line) vs cut.*

> ⏳ MISSION TODO (Johnny fills):
> - Hackathon: ____________________
> - Deadline: ____________________ (tz)
> - Core sponsors (≤5, each on a step): ____________________
> - Cut / stretch: ____________________

### 6. The live demo subject
*The real input you'll run live in the demo (and the 1–2 cached fallbacks for when wifi/source flakes).*

> ⏳ MISSION TODO (Johnny fills):
> - Live subject: ____________________
> - Cached fallback(s): ____________________

---

## Known + locked (you do NOT fill these — they're already decided)

- **Name:** DOT (lowercase `dot` in paths, "DOT" as the name).
- **Design system:** LOCKED in `design/` — clean white + trust-blue `#007AFF`, iMessage-bubble warmth,
  Grok-minimal, conversation-as-data-density, visual-first / least-text, healthcare-adjacent but
  deliberately **not** looking like healthcare. See `design/README.md` + `design/05-NEW-BRAND.md`.
- **Discipline:** LOCKED in `docs/CONSTRAINTS.md` — no silent stubs, demo-path-sacred, sponsor-per-step,
  real-vs-cached-vs-mocked, ship > elegant.
- **Build engine:** ready in `docs/GOAL.md` — runnable as-is once the blanks above propagate into the lock-docs.

---

## When these are filled

Propagate the six answers into the lock-docs — **`docs/SCOPE-LOCK.md`** (problem / input / output / journey /
CUT list), **`docs/DECISIONS.md`** (the locked architecture + sponsor-seam calls), **`docs/KEYS.md`** (which
`.env` / keys to copy), **`docs/SPONSORS.md`** (the sponsor-per-step map), and **`docs/DEMO-SCRIPT.md`** (the
beats incl. the hero moment) — then run **`docs/GOAL.md`** to start the build.
