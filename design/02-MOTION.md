# 02 — MOTION (every curve, duration, and signature keyframe)

Motion depicts something true (Law 9): execution = shimmer, new generation = blur-up, approval = stamp + confetti, flow = traveling dots, a result = a number counting up. ≤1 whimsy per surface (Law 10). The surface is still; only the *work* moves. Every keyframe below is verbatim and copy-paste ready. The reduced-motion guard is mandatory — never ship without it.

Cross-refs: the *why* per gesture is in [00-PRINCIPLES.md](./00-PRINCIPLES.md) §interaction-gems; the components each gesture lives in are in [03-COMPONENTS.md](./03-COMPONENTS.md).

---

## 1. THE SIGNATURE EASE (one curve, everywhere)

```css
--ease-signature: cubic-bezier(0.16, 1, 0.3, 1);   /* fast out, long graceful settle */
```
```ts
// lib/motion.ts
export const EASE     = "expo.out";                    // GSAP name
export const EASE_CSS = "cubic-bezier(0.16, 1, 0.3, 1)";
```
**Nothing bounces. Nothing springs. Nothing overshoots** (except one deliberate small overshoot on `find-pop` and the stamp's settle — both noted).

**Canon note:** the cofounder DNA had two house curves —
```css
--settle: cubic-bezier(0.23, 1, 0.32, 1);   /* reveals, swaps, slide-ins */
--spring: cubic-bezier(0.22, 1, 0.36, 1);   /* the long stat/bar fills    */
```
— preserved in the lab as `--lab-settle`/`--lab-spring`. The shipped product **collapsed both into the single expo-out signature.** All three are the same "fast-out, long-settle" family. **Carry the one curve.** (If you need the two-curve era for a port, both values are above.)

---

## 2. DURATION + STAGGER + RISE LADDER

```css
--dur-press: 150ms;   /* button light-change (140-150ms)         */
--dur-micro: 180ms;
--dur-fast:  450ms;   /* state pop-ins / reveals (350-500ms)     */
--dur-base:  900ms;   /* big reveals                             */
--dur-slow:  1400ms;  /* masked line reveals                     */
--dur-stat:  2600ms;  /* the ONE earned count-up beat (only legal place >700ms) */
```
```ts
DUR = { micro: 0.18, fast: 0.45, base: 0.9, slow: 1.4 };  // seconds (GSAP)
STAGGER = 0.09;        // default between sibling reveals
RISE = 22;             // default fade-rise distance (px)
PARALLAX_MAX = 30;     // parallax never exceeds 30px (and is mostly banned)
// LineReveal: stagger 0.11, yPercent 112
```
**The hard ceiling:** no UI motion > 700ms except the single `2600ms` stat beat. Durations cluster at **0.15s** (buttons), **0.3s** (hover/state), **0.45–0.6s** (entrances), **0.7s** (bar widths), **1–1.5s** (slow companion-visual morphs).

---

## 3. THE FULL KEYFRAME LIBRARY (verbatim)

### 3a. Core lab keyframes (the seven primitives)
```css
@keyframes spin      { to { transform: rotate(360deg); } }
@keyframes pulse     { 0%, 100% { opacity: 1; }   50% { opacity: 0.55; } }
@keyframes blink     { 0%, 100% { opacity: 1; }   50% { opacity: 0.35; } }
@keyframes blur-up   { from { opacity: 0.25; filter: blur(7px); }  to { opacity: 1; filter: blur(0); } }
@keyframes msg-in    { from { opacity: 0; transform: translateY(6px); }  to { opacity: 1; transform: translateY(0); } }
@keyframes shimmer   { from { transform: translateX(-120%); }  to { transform: translateX(220%); } }
@keyframes grid-cell { 0%, 100% { opacity: 0.2; }  20% { opacity: 0.9; }  45% { opacity: 0.45; } }

/* applied as: */
.blur-up { animation: blur-up 420ms var(--ease-signature) both; }   /* content swap reveal */
.msg-in  { animation: msg-in  350ms var(--ease-signature) both; }   /* new chat bubble/row */
.spin    { animation: spin    0.8s  linear infinite; transform-origin: center; }
```

### 3b. SHIMMER — light sweeping the executing element (depicts execution)
**Rule:** only the *active* item gets it — it marks "this is the live one, executing this second." Distinguishes "executing now" from merely "running."

Lab version (a 25%-wide white band traveling left→right):
```jsx
<div className="pointer-events-none absolute inset-y-0 w-1/4"
  style={{
    background: "linear-gradient(100deg, transparent, rgba(255,255,255,0.45), transparent)",
    animation: "shimmer 2.4s ease-in-out infinite",   /* -120% -> 220% */
  }} />
```
Product version (a skewed accent-tinted band, sweeping infinite):
```css
.node-shimmer::after {
  content: ""; position: absolute; inset: -2px;
  transform: translateX(-110%) skewX(-12deg);
  background: color-mix(in srgb, var(--live) 7%, transparent);
  width: 45%;
  animation: shimmer-sweep 1.5s var(--ease-signature) infinite;
}
@keyframes shimmer-sweep { to { transform: translateX(320%) skewX(-12deg); } }
```

### 3c. BLUR-UP SWAP — between generations / on new content landing
**Rule:** new content *develops* like a photo — never a hard cut, never a spinner for instant data. Re-trigger by changing a React `key` on the wrapper (re-mounts → replays).
```css
@keyframes blur-up { from { opacity: 0; filter: blur(8px); } to { opacity: 1; filter: blur(0); } }
.blur-up { animation: blur-up 0.6s var(--ease-signature) both; }
/* lab variant: 420ms, from { opacity: 0.25; filter: blur(7px); } */
```
Usage: `<div key={activeKey} className="blur-up">…</div>` — any tab/page/generation change replays the reveal.

### 3d. BEAT-RISE — story/list cards rising in (rise + blur, staggered)
```css
@keyframes beat-rise {
  from { opacity: 0; transform: translateY(9px); filter: blur(7px); }
  to   { opacity: 1; transform: translateY(0);   filter: blur(0); }
}
.beat-rise { animation: beat-rise 0.6s var(--ease-signature) both; }
/* stagger via inline style: animationDelay: `${i * 130}ms` */
```

### 3e. STAGGER-RISE / MSG-IN — new rows entering
```css
@keyframes msg-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
.msg-in { animation: msg-in 350ms var(--ease-signature) both; }
```

### 3f. POP-IN family — state changes / counts / discovery
```css
/* DASH-POP — any state-change/badge appearing (the micro workhorse) */
@keyframes dash-pop { from { opacity: 0; transform: translateY(4px) scale(0.97); } }
.dash-pop { animation: dash-pop 0.45s var(--ease-signature) both; }

/* FIND-POP — discovery cards, with a slight overshoot (the only sanctioned overshoot) */
@keyframes find-pop {
  0%   { opacity: 0; transform: translateY(10px) scale(0.92); }
  62%  { opacity: 1; transform: translateY(-2px) scale(1.015); }   /* the overshoot peak */
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
.find-pop { animation: find-pop 0.55s var(--ease-signature) both; }

/* STAGE-ENTER — a focused panel taking the screen */
@keyframes stage-enter { from { opacity: 0; transform: translateY(10px) scale(0.99); } }
.stage-enter { animation: stage-enter 0.5s var(--ease-signature) both; }
```

### 3g. TICK — a number incrementing (a quick scale bump)
```css
@keyframes dash-tick { 35% { transform: scale(1.22); } }
.dash-tick { display: inline-block; animation: dash-tick 0.3s var(--ease-signature); }
```

### 3h. PULSE / BLINK — a live thing breathing (the only `ease-in-out`, infinite)
```css
@keyframes dash-pulse { 50% { opacity: 0.35; } }
.dash-pulse { animation: dash-pulse 1.1s ease-in-out infinite; }   /* the "live/working" dot */
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.55; } }  /* run-pill tint 1.6-2s */
@keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }  /* "ready" dot, 2s */
```

### 3i. GRID-CELL — the breathing pixel-grid spinner (a distinctive non-rotary loader)
```css
@keyframes grid-cell { 0%, 100% { opacity: 0.2; } 20% { opacity: 0.9; } 45% { opacity: 0.45; } }
/* 3x3 grid of 1.5px squares; each cell: animation: grid-cell 1.4s ease-in-out ${i*0.12}s infinite */
```
The staggered `i*0.12s` sweep is the signature — cells breathe in a wave, never spin.

### 3j. GATE-STAMP — the ONE whimsy on the approval surface (a rubber-stamp slam)
**Rule:** human judgment leaves a durable, physical, audited mark. Resolves in place to a mono chip (`approved`/`sent ✓`).
```css
@keyframes stamp-in {
  0%   { opacity: 0; transform: rotate(-8deg) scale(1.7); }
  60%  { opacity: 1; transform: rotate(-8deg) scale(0.96); }   /* the slam-settle */
  100% { opacity: 1; transform: rotate(-8deg) scale(1); }
}
.gate-stamp {
  display: inline-block; transform: rotate(-8deg); color: var(--good);
  box-shadow:
    0 0 0 1.5px color-mix(in srgb, var(--good) 65%, transparent),
    inset 0 0 0 1px color-mix(in srgb, var(--good) 25%, transparent);
  border-radius: 6px;
  animation: stamp-in 0.5s var(--ease-signature) both;
}
/* richer variant: a feTurbulence rough mask over the ink chop, ~200ms settle */
```

### 3k. CONFETTI — fires ONLY on human approval, from the button itself
**Rule:** scarcity is the whole point — reward only HUMAN action, never system events / page loads / passive completions. Dynamic-import `canvas-confetti` on first use; never loads under reduced-motion.
```ts
// lib/confetti.ts — exact params (the two presets)
confetti({
  particleCount: big ? 64 : 26,
  spread:        big ? 72 : 52,
  startVelocity: big ? 26 : 16,
  gravity: 0.95, ticks: 90, scalar: 0.66,
  origin: { /* center of the approving element's bounding rect, normalized to viewport */ },
  colors: ["#6e2bff", "#1f7a4d", "#131c2e", "#b58900"],
  disableForReducedMotion: true,
});

// the ApproveGate variant (after a 900ms hold completes):
confetti({ particleCount: 90, spread: 70, startVelocity: 32, origin: { y: 0.7 },
           colors: ["#6e2bff", "#1f7a4d", "#262323", "#fbfbf8"] });
```
(Clean-blue colors: `["#007AFF", "#28a745", "#0b1620", "#0A84FF"]`.)

### 3l. DRAW-IN WIRE — an SVG path drawing itself on scroll
**Rule:** the wire *connects* something real; drawing it shows the relation being made.
```ts
// DrawnWire.tsx
const len = path.getTotalLength();
path.style.strokeDasharray  = `${len}`;
path.style.strokeDashoffset = `${len}`;
gsap.from(path, {
  strokeDashoffset: len, ease: "none",
  scrollTrigger: { start: "top 92%", end: "top 30%", scrub: 0.6 },
  onComplete: () => gsap.set(path, { clearProps: "all" }),
});
// fully drawn by default (a from()), gated on reduced-motion
```

### 3m. MARCHING WIRE — the regen/active back-edge (animated dashes)
```css
@keyframes wire-march { to { stroke-dashoffset: -16; } }
.wire-march { stroke: var(--ocean); stroke-dasharray: 4 4; animation: wire-march 0.9s linear infinite; }
```
(In `sayhello` the regen edge is tinted ocean-blue, not violet — the brand color carries the wire, the accent stays on the live node.)

### 3n. PACKET DOTS — traveling along a wire (flow witnessed, not implied)
SMIL version (org-canvas): 3.2px `<rect fill=#37a4f4>` with
```xml
<animateMotion path="M ax ay L bx by" dur="5.6s" begin="{i*0.7}s" repeatCount="indefinite"/>
<!-- opacity envelope so dots fade in/out at the wire ends: -->
<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.08;0.9;1" dur="5.6s" begin="{i*0.7}s" repeatCount="indefinite"/>
```
Even/odd index alternate travel direction. rAF version (loop-canvas): packet lerps a bezier with an `easeInOut`, `600ms` forward / `850ms` regen.

### 3o. MASKED LINE REVEAL — display type rising out of a mask
```ts
// LineReveal.tsx — visible by default (a from()), can hold until a `vx:release` event
gsap.from('[data-line]', { yPercent: 112, duration: 1.4 /* DUR.slow */, ease: EASE, stagger: 0.11 });
```
```html
<span class="block overflow-hidden pb-[0.08em] -mb-[0.08em]">
  <span data-line class="block will-change-transform">A line of display type</span>
</span>
```

### 3p. BIRD FLIGHT-CYCLE — a tiny mascot whose two states MEAN something
**Rule:** running vs idle. `aria-hidden`, purely decorative-by-meaning. Frame-flips a wing cycle (3 SVG frames: `wings-up → coasting → wings-down`) by toggling `display` every `FRAME_MS = 280`ms while active; idle pins the coasting frame.
```css
@keyframes bird-fly { from { transform: translateX(-64px); } to { transform: translateX(calc(100vw + 64px)); } }
.bird-fly  { position: absolute; top: 34px; left: 0; animation: bird-fly 34s linear infinite; }  /* crosses while a run is active */

@keyframes bird-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
.bird-idle { position: absolute; top: 40px; right: 9%; animation: bird-bob 3.6s ease-in-out infinite; }  /* bobs when idle */
```

### 3q. The garden / companion-visual morphs — declarative, CSS-only
Phases driven by a `data-phase` attr; all morphs are CSS transitions on `--ease-signature` (no JS animation). A `PRUNE_BEAT_MS = 1700` holds the withered state before a cut lands. The prune-leaf fall:
```css
@keyframes gdn-fall {   /* verbatim from the shipped product */
  0%   { opacity: 1; transform: rotate(0deg)    translate(0, 0); }
  100% { opacity: 0; transform: rotate(-140deg) translate(-30px, 86px); }
}
/* bloom: scale(0) -> scale(1) with a 0.35s delay; bloomed plant gets a slow gdn-sway */
@keyframes gdn-sway { 0%,100% { transform: rotate(-1.5deg); } 50% { transform: rotate(1.5deg); } }
```

---

## 4. THE REVEAL ARCHITECTURE PRINCIPLE

- All reveals are **progressive enhancement only** — written as GSAP `from()` tweens so no-JS / reduced-motion never *hides* content (the content is there; the tween only animates its arrival).
- `prefersReducedMotion()` must be SSR-safe (returns `true` when `window` is undefined).
- `FadeRise` is the workhorse scroll reveal, via a `useReveal({ selector, delay })` hook taking a delay for staggering children.
- **Hover lifts in light, never size.** The only geometric move anywhere is the `:active { translateY(1px) }` key-press.

---

## 5. THE GLOBAL REDUCED-MOTION GUARD (always ship this — verbatim)

```css
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```
Plus: confetti is JS-gated (`disableForReducedMotion: true` AND `prefersReducedMotion()` check before dynamic import); count-ups jump to their final value; the spiral/canvas falls back to a static frame and a clean indexed `<ol>`.

---

## 6. MOTION QUICK-MAP (gesture → trigger → component)

| Gesture | Keyframe | Trigger | Lives in ([03-COMPONENTS](./03-COMPONENTS.md)) |
|---|---|---|---|
| shimmer sweep | `shimmer-sweep` / lab `shimmer` | element is the one executing now | live node, active subagent row |
| blur-up swap | `blur-up` | content/key change | tab swaps, generation lands, blurb toggle, slides |
| beat-rise | `beat-rise` | list/stack mounts | beat-cards, story stack |
| msg-in | `msg-in` | new row/bubble | conversation rail, task rows |
| find-pop | `find-pop` | discovery card lands | find-cards (gather stage) |
| stage-enter | `stage-enter` | focused stage takes screen | step-stepper stage |
| dash-pop | `dash-pop` | badge/state appears | failed badge, status pills |
| dash-tick | `dash-tick` | number increments | counters |
| dash-pulse / pulse / blink | `dash-pulse`/`pulse`/`blink` | a live/ready thing breathes | live dot, run pill, ready dot |
| grid-cell | `grid-cell` | a working spinner | grid spinner |
| gate-stamp | `stamp-in` | human approves | approve gate |
| confetti | (JS) | human approves only | approve gate / approval button |
| draw-in wire | (GSAP) | scroll connects a relation | drawn wires |
| marching wire | `wire-march` | regen/active edge | loop canvas |
| packet dots | SMIL / rAF | flow along a wire | org canvas, loop canvas |
| masked line reveal | (GSAP) | display type enters | hero headlines |
| bird flight | `bird-fly`/`bird-bob` | run active vs idle | mascot |
| count-up | (rAF easeOutQuint, 2600ms) | scroll-into-view, once | metric card, stat bubble |

→ Next: [03-COMPONENTS.md](./03-COMPONENTS.md) — where each of these gestures lives.
