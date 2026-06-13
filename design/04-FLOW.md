# 04 — FLOW (the experience & interaction patterns)

How the components in [03-COMPONENTS.md](./03-COMPONENTS.md) compose into an experience. This is the transferable IP: a multi-stage async process turned into a calm, legible, *narrated* sequence where the user is never shown more than one decision/stage at once. Everything answers to the laws in [00-PRINCIPLES.md](./00-PRINCIPLES.md).

---

## 1. THE THREE-ACT JOURNEY

### Act 1 — Clean entry (almost nothing)
One centered route holding **one object and one sentence**: a wordmark, one quiet `text-[13px] text-mute` line, ONE input ([D4 autofill bar](./03-COMPONENTS.md#d4--autofill-bar--search-as-launcher--signature)), one `font-mono text-[9.5px] text-faint` tagline. Brand imagery lives behind at z-0 ([E8 masked backdrop](./03-COMPONENTS.md#e8--fixed-faint-masked-brand-backdrop)). Decisions are hidden behind the autofill (curated catalog) and one segmented control ([D2](./03-COMPONENTS.md#d2--segmented-control--mode-chips)). A persistent corner mode-light ([D6](./03-COMPONENTS.md#d6--corner-mode-light)).

**The taste:** an entry page is one object and one sentence. Layout: `flex min-h-screen max-w-[760px] flex-col items-center justify-center gap-5`.

### Act 2 — Guided step-through (the run)
The instant work starts, the whole screen becomes a **step rail + one focused stage** ([D1](./03-COMPONENTS.md#d1--step-rail--auto-advancing-single-focus-stage--the-flow-engine--the-crown-jewel)). Focus moves **one thing at a time**, auto-advancing on real events but each step holding a **minimum dwell** so it reads. Completed steps collapse to clickable tabs (you can scrub back; `pinned` respects you; the human-decision step always force-surfaces). A persistent **companion visual** ([E4](./03-COMPONENTS.md#e4--self-shaping-companion-visual--a-living-illustration-whose-state--your-datas-state)) sits beside the stage tracking the same state. Layout: `max-w-[1100px]` column; `grid lg:grid-cols-[1.7fr_1fr]`.

### Act 3 — Bloom report (the payoff)
The terminal step stacks the generated artifact + score + evidence — composed from real data ([C8 beat-cards](./03-COMPONENTS.md#c8--beat-cards--story-as-components--the-conversation--wall-of-text-engine), [C5 score bars](./03-COMPONENTS.md#c5--score-bars-n-axis--verdict), [C9 evidence](./03-COMPONENTS.md#c9--evidence-chips--provenance-row), optionally [E11 generative-UI receipt](./03-COMPONENTS.md#e11--generative-ui-receipt-renderer-render-a-typed-tree-into-the-design-system)).

**Why it's reusable:** it converts a multi-stage async process into a calm, narrated sequence where the user is never shown more than one decision/stage at once. For a least-text, visual-first brand this is ideal: each step can be a single card + one number, and the companion visual carries the state.

---

## 2. ONE-THING-AT-A-TIME FOCUS (the governing law of the run)

- **One hero element per view.** One big numeral, OR one canvas, OR one report. Everything else is 8–11px supporting cast. Ghost cards ([E12](./03-COMPONENTS.md#e12--ghost-placeholder-card)) sketch "more exists" without competing.
- **Exactly one live thing.** Whether the shimmer band (active row), the spinning arc (running task), the blinking dot (ready), or the focused stage — precisely one element is "alive"; everything else is quiet.
- **Calm at rest; only the work moves.** The surface is still by default; motion is an *event*, and every event depicts a real datum.

---

## 3. THE GUIDED STEP-THROUGH ENGINE (exact mechanics)

The crown jewel ([D1](./03-COMPONENTS.md#d1--step-rail--auto-advancing-single-focus-stage--the-flow-engine--the-crown-jewel)) — the rules that make it feel narrated, not janky:

1. **Monotonic `furthest`** is computed purely from real run data (each real milestone advances it by one). The flow never *fakes* progress — it reflects state.
2. **A minimum-dwell map** holds each step long enough to *read* before auto-advance (e.g. `{ gather:7200, person:3400, draft:3800, catch:5400, fix:3800, approve:1100, report:0 }`ms). Staged pacing layered over real async events: the work may finish faster than the human can read, so the dwell guarantees each beat lands.
3. **`shown` auto-walks toward `furthest`** via a `setTimeout` honoring elapsed dwell.
4. **`pinned`** lets a user click back to a completed step without the auto-walk fighting them.
5. **The human-decision step always un-pins** — the gate must surface no matter where the user is.
6. **Clean-path steps are skippable** (`skipCatch`): on a successful first try, the error/fix steps render as `line-through` tabs and are skipped.
7. **The `key={shownId}` re-mount** triggers `.stage-enter` on every step change — the stage *takes the screen* each time.

**Step-rail state vocabulary:** `active` (white pill + `dot-glow text-live dash-pulse`) · `done` (`text-good` dot) · `live` (`text-ocean dash-pulse`) · `todo` (25%-opacity dot) · `skipped` (`line-through`) · error tab forced `text-bad`. Separators are `→` glyphs.

---

## 4. THE SIGNATURE INTERACTIONS (portable inventory)

1. **Autofill search-as-launcher** ([D4](./03-COMPONENTS.md#d4--autofill-bar--search-as-launcher--signature)) — open-feeling input routing to curated states; `ring-float` dropdown, label+sub+category-chip rows, full keyboard nav, click-away close.
2. **Segmented mode chips** ([D2](./03-COMPONENTS.md#d2--segmented-control--mode-chips)) — `key-bevel` track, `pill-emboss` selected pill, **blur-swap** the dependent copy on toggle.
3. **Corner mode-light** ([D6](./03-COMPONENTS.md#d6--corner-mode-light)) — a fixed tiny always-present toggle; OFF = dim ink dot, ON = the brand color **glows**. The same primary input echoes the mode via its **ring color** (one mode signal, two places).
4. **Find-cards popping** ([E5](./03-COMPONENTS.md#e5--find-cards-popping--makes-gathering-feel-like-the-internet)) — timed staggered discovery cards on an absolute (elapsed-since-start) clock so the cadence survives navigation; deterministic per-source dot colors.
5. **Self-shaping companion visual** ([E4](./03-COMPONENTS.md#e4--self-shaping-companion-visual--a-living-illustration-whose-state--your-datas-state)) — a declarative `data-phase` SVG that grows/prunes/blooms purely via CSS transitions; real verdict chips + a thin-line threshold chart underneath.
6. **Hold-to-approve** — a 900ms press-fill → stamp + confetti; confetti reserved for the human's one act (see §6).
7. **Beat-cards** ([C8](./03-COMPONENTS.md#c8--beat-cards--story-as-components--the-conversation--wall-of-text-engine)) — model prose parsed into titled cards with inline evidence chips and indented reasoning rows; staggered rise+blur. The "a conversation > a wall of text" engine.
8. **Proof-trajectory chart + evidence chips** ([C6](./03-COMPONENTS.md#c6--trajectory--proof-chart-thin-line-inline-svg-with-a-threshold-hairline)/[C9](./03-COMPONENTS.md#c9--evidence-chips--provenance-row)) — 1px inline-SVG line charts with a dashed threshold hairline and numerals-in-mono over points; metadata as embossed pills.

---

## 5. HOLD-TO-APPROVE (the warm, deliberate, human-in-the-loop gesture)

The human gate — a **press-and-hold** button (`HOLD_MS=900`) that fills, then fires approve + a gate-stamp + confetti.
- **Mechanics:** `onPointerDown` starts a rAF measuring `(now-t0)/900`, painting an `absolute inset-y-0 left-0 bg-white/20` fill to `width:${progress*100}%`; `onPointerUp/Leave` cancels. At p≥1 → `await onApprove()` → on success, confetti (exact params in [02-MOTION.md](./02-MOTION.md) §3k).
- **Shell:** `.ring-float.bg-white.p-5` (floating, earning-white), warn-toned eyebrow "your call", a `text-[12.5px]` line, the hold button (`btn-crunch crunch-dark`), a "hold 0.9s" hint. On approved: a `.gate-stamp` ("approved", rotated -8deg) + a status line.
**When:** any human-in-the-loop confirm. The visible fill makes the moment deliberate; the confetti-only-on-human-action restraint is the taste. (Whimsy is *never* on money/gate-money moments — masked money is a flat mono chip.)

---

## 6. STATE TRANSITIONS (the motion law applied to flow)

- **One curve everywhere:** `--ease-signature: cubic-bezier(0.16,1,0.3,1)`. Durations: ~0.15s buttons · ~0.3s hover/state · 0.45–0.6s entrances · 0.7s bar widths · 1–1.5s companion-visual morphs · one 2600ms stat beat.
- **`blur-up`** — the universal "new content / swap" gesture (generations, blurbs, slides); re-trigger via `key` change.
- **`beat-rise`** — list/stack entrances (staggered `animationDelay`).
- **`find-pop`** — discovery cards (the one sanctioned overshoot).
- **`stage-enter`** — the focused stage taking the screen.
- **`dash-pop`** — any state-change/badge appearing.
- **`dash-pulse`** — the "live/working" dot.
- **`stamp-in`** — the approve stamp.
- **Hover lifts in light, never size.** `prefers-reduced-motion` clamps all animation/transition to 0.01ms; confetti never loads; count-ups jump to final.
- **Optimistic / reversible-feel:** ✕ never deletes (fades + leaves a restore micro-key); approved/skipped rows resolve in place to a faint mono chip; UI updates instantly, never blocks on the server. Nothing is destructive, nothing is laggy — safe to play with.
- **Restraint law:** ≤1 whimsy per surface; motion must *depict something true* (the mascot flies because work runs; the bar fills because the decision is arming).

---

## 7. CONVERSATION-AS-DATA-DENSITY / LEAST-TEXT (concrete UI rules)

The thesis: **a conversation/stream holds more than a wall of text because each turn can be a different shape** — a number, a card, a chart, a choice — chosen by what the datum asks for. This is Johnny's per-piece interrogation ("what does it serve? how should it feel? how abstract?") applied to chat turns. Concrete rules:

1. **Prefer a chip over a sentence, a stat over a paragraph, a chart over a list.** If a turn can be a tap or a number, it must NOT be a paragraph. Banned: walls of text where a card would do.
2. **Every dense panel earns a lowercase mono purpose label.** A whole project board in 268px ([C2](./03-COMPONENTS.md#c2--status-group-list-kanban-as-list--the-density-pattern)) is legible only because a mono kicker says what it's for. Density without a purpose label is just noise.
3. **Turn model prose into a stack of titled cards with inline data chips** ([C8](./03-COMPONENTS.md#c8--beat-cards--story-as-components--the-conversation--wall-of-text-engine)). `[signal_type]` tokens become evidence chips; `⟶ what this means:` becomes a quiet indented reasoning row. The text becomes *navigable structure*.
4. **The stream and the work-state are the same surface** ([B1](./03-COMPONENTS.md#b1--conversation-rail--the-core-conversation-as-data-pattern)). Typing a message materializes a live task row — the conversation *is* the dashboard.
5. **Two-tone everything.** Strong subject at a high ink alpha, faint context at a low one (ink alpha encodes importance, [C10](./03-COMPONENTS.md#c10--email--document-preview-card-cropped-by-light)).
6. **Carry meaning through motion/geometry, not copy.** The org canvas (moving packets), the metric card (self-animating number), the spiral (iteration as a reel), the self-shaping plant (state = shape) — all carry meaning visually. These are the templates for a visual-first brand.
7. **The mono system-voice replaces explanatory copy.** Counts, timers, statuses, provenance, `read`/`delivered` — the machine narrates itself in mono so prose isn't needed.

**Rich-bubble family** (when the conversation is the primary surface — see [05-NEW-BRAND.md](./05-NEW-BRAND.md) §rich-bubbles): each turn picks its shape — plain bubble (a sentence) · stat bubble (one count-up number) · card-in-bubble (a structured object) · chip row (quick replies → a tap replaces a typed turn) · visual-answer bubble (a chart/ring/sparkline) · inline form-bubble (structured input in-thread, *killing the form screen*) · selector/slider bubble (refine by direct manipulation).

---

## 8. THE WORLD-METAPHOR (the consistency engine for any new flow)

Each product gets a world metaphor that decides which shapes exist AND which to refuse:
- **Said↔Built = a reading room** (serif story-wrap, margin drawers, citation chips — no kanban chrome).
- **The loop canvas = an organism** (wires, traveling dots, pulse replays — no footnotes).
- **The lab = a study** (specimens pinned + labeled).
- **The conversation brand = a thread** (the bubble is the canvas; data arrives as rich bubbles; the home is a conversation, not a dashboard or a form).

Pick one and hold it system-wide. The metaphor tells you what to build and what to cut — it's how the work stands out from the crowd *consistently*.

→ Next: [05-NEW-BRAND.md](./05-NEW-BRAND.md) — applying all of this to the clean-blue healthcare-not-healthcare brand.
