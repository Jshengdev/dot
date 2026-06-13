# DECISIONS — the locked calls (and the ones still open). READ SECOND.

> The running log of decisions that are LOCKED (don't re-litigate) vs OPEN (flag, don't decide silently).
> When Johnny locks the mission, the OPEN rows become LOCKED rows and the doc each points to gets filled.
> Until then, the only things truly locked are the **design system** and the **operating discipline**.

## LOCKED (do not re-open without Johnny)

| # | Decision | Where it lives |
|---|---|---|
| 1 | **Name = DOT.** Lowercase `dot` for paths/packages, `DOT` as the brand. | everywhere |
| 2 | **Design system is FROZEN** — the clean-blue skin (full taste library carried over). | `design/` · `docs/DESIGN.md` |
| 3 | **The conversation/thread is the primary surface.** Home is a thread, not a dashboard or a form; data arrives as rich bubbles (stat / card / chart / chips / inline-form), never a wall of text. | `design/05-NEW-BRAND.md` §2–3 |
| 4 | **Operating discipline is non-negotiable** — no silent stubs · demo path sacred · real-vs-cached-vs-mocked · main always demoable · ship>elegant · don't be a blocker. | `docs/CONSTRAINTS.md` · `docs/BUILD-LOOP.md` |
| 5 | **Sponsors must be load-bearing + named on screen** — every sponsor = a real seam on the one journey line; count + names TBD with the mission, the rule holds regardless. | `docs/SPONSORS.md` · `docs/KEYS.md` |

### Decision #2 in full — the locked design call (clean-blue)

The design IS decided. The paste-grade taste library lives in `design/`; `docs/DESIGN.md` is the in-repo pointer.

- **World metaphor:** the **conversation is the product**. Data arrives as rich bubbles, never a wall of text.
- **Palette:** clinical-clean-**white** ground (`--page:#ffffff`), one **cool** ink (`--ink:#0b1620`, never pure
  black) at a 6-rung alpha ladder, exactly **one accent**: **trust-blue `#007AFF`** (`#0A84FF` on dark). Blue is
  the whole "you/AI" conversation channel — still the only hue.
- **iMessage-bubble warmth:** warmth lives in the blue bubble (tail + 2px/12px grouping rhythm), not the paper.
  AI/brand = blue, user = grey (hold system-wide).
- **Grok-minimal:** monochrome + one accent, vast whitespace, near-zero ornament, type does the hierarchy, one
  clean geometric mark. Subtract until only meaning remains.
- **Least-text:** prefer a chip over a sentence, a stat over a paragraph, a chart over a list.
- **Healthcare-adjacent but NOT healthcare:** BAN teal/green-as-brand, medical cross/EKG/stethoscope/pill icons,
  form-first screens, clinical stock photography, red-for-routine, dashboard-as-home.
- **Physics carried verbatim:** depth-from-light (no borders, ring-shadows ≤1px), Onest 340/430/450/480 (never
  400/600), IBM Plex Mono = system voice, ease `cubic-bezier(.16,1,.3,1)` (nothing bounces), ≤1 whimsy/surface,
  confetti only on a human's yes.
- **Activation:** wrap the app in `class="brand-clean-blue"`; every recipe class ports unchanged.

## OPEN — ⏳ MISSION TODO (Johnny fills, then they move to LOCKED above)

| # | Question | What's needed to decide | Fills |
|---|---|---|---|
| M1 | **What does DOT do?** The core mission / the ONE problem. | Johnny's call. Everything below depends on this. | `docs/SCOPE-LOCK.md` |
| M2 | **Crystal input + output shape.** | Follows M1. | `docs/CONTRACTS.md` · `docs/SCOPE-LOCK.md` |
| M3 | **The node/step graph** (the ≤6-step journey as typed stages). | Follows M1–M2. | `docs/ARCHITECTURE.md` |
| M4 | **The CORE sponsor list** + each one's seam on the line. | Follows M3 + event sponsor list. | `docs/SPONSORS.md` · `docs/KEYS.md` · `docs/PRIZE-PLAN.md` |
| M5 | **The stack** (frontend framework, backend, data store, LLM provider). | Follows M3. Likely Next + the design system; confirm. | `docs/ARCHITECTURE.md` |
| M6 | **THE demo moment** — the single beat the 3-min walkthrough is built around. | Follows M1. | `docs/DEMO-SCRIPT.md` |
| M7 | **Freeze + submit times.** | Johnny's call (the clock). | `docs/CONSTRAINTS.md` · `docs/BUILD-LOOP.md` |

## How to use this file

- About to make an idea-specific call? If it's not in LOCKED above, it's OPEN — **flag it as a finding in
  `docs/OPEN-QUESTIONS.md`, keep moving, don't silently decide it.** (Constraint: don't be a blocker.)
- Locked something with Johnny? Move the row from OPEN → LOCKED and update the doc it points to.
