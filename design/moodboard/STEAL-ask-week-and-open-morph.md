# STEAL — "ask about your week" + the open-morph (for regular UI)

> **Source:** `~/code/test` (cloned from `github.com/teriyapi/dot`, a companion "dot" frontend).
> Stack: **React + TS + GSAP + Tailwind, no WebGL.** Files cited below are under `~/code/test/src/`.
>
> **What we're taking (and what we're NOT):** the **"ask about your week" pill component** and its **open
> animation** — the way a small element *blooms open into a panel*. We want this open-morph **brought out as
> a reusable primitive for regular UI components** (cards, bubbles, panels). It does **NOT** replace the
> blob-wobble; the blob-wobble stays for the playful dots. This morph is the clean "open" for normal UI.
>
> This file is written to be pasted as a prompt into the other front end.

---

## A · The "ask about your week" component (`components/AskPill.tsx`)

A small **glass pill** reading **"ask about your week"**, pinned top-center (`position: fixed; left:50%;
translateX(-50%)`), breathing gently like the dots. It's the conversational entry point.

**Behavior:**
- **Collapsed:** a 220×48 pill (radius 24), one line of text, a real `<button>`.
- **Click → opens in place** (the Dynamic-Island morph in §B-1) into a **540×300 panel** (radius 28) holding a
  text input (`placeholder: "do my friends actually hate me?"`) + a send key + a three-dot "thinking" indicator.
- **Submit →** an ~850ms reflective beat (thinking dots), then it hands off to a full-screen reflection flow
  and the pill collapses behind it.
- **Courtesy:** when any other pane is open, the pill fades out + `pointer-events:none`, and restores on close.
- **A11y:** focus-trapped while expanded, `Esc` collapses, `aria-expanded`, a click-scrim behind it.

The pill IS a `<Glass>` surface, so the input/answer panel it morphs into refracts the live background.

---

## B · The open-morph — the reusable "bloom open" primitive

There are **two flavors**. Both share the same *feel* (§B-3). Pick by where the panel opens.

### B-1 · In-place geometry morph (pill → panel, same spot) — `AskPill.tsx`
Best when the thing **expands in place** (a pill, a search box, a card growing into a panel). **No Flip.**
A single GSAP tween drives a proxy `t` (0→1); `applyT(t)` interpolates the box geometry and cross-fades the
two contents.

```ts
const PILL  = { w: 220, h: 48,  radius: 24 };
const PANEL = { w: Math.min(540, innerWidth * 0.92), h: 300, radius: 28 };
const lerp  = (a, b, t) => a + (b - a) * t;
const clamp01 = (n) => Math.max(0, Math.min(1, n));

function applyT(t /* 0..1 */) {
  const w = lerp(PILL.w, PANEL.w, t);
  const h = lerp(PILL.h, PANEL.h, t);
  const r = lerp(PILL.radius, PANEL.radius, t);
  root.style.width = `${w}px`;
  root.style.height = `${h}px`;
  root.style.borderRadius = `${r}px`;
  // cross-fade: label out by the halfway point, panel in for the back half
  collapsedEl.style.opacity = String(clamp01(1 - t * 2));       // gone by t=0.5
  panelEl.style.opacity     = String(clamp01((t - 0.5) * 2));   // appears after t=0.5
  // GLASS ONLY: re-refract the new box each frame → glass.syncOptics({ w, h, radius: r })
}

// open / close (proxy avoids React re-renders per frame):
const proxy = { t: 0 };
gsap.to(proxy, { t: open ? 1 : 0, duration: 0.62, ease: SOFT, onUpdate: () => applyT(proxy.t) });
```
Centering trick: keep `translateX(-50%)` on the root so it **re-centers automatically** as the width grows —
no position math needed.

### B-2 · Shared-element Flip morph (small element → pane elsewhere) — `MorphPane.tsx`
Best when a small element (a dot, thumbnail, list row, bubble) **blooms into a pane somewhere else** on screen.
Uses **GSAP Flip** (ships free in `gsap/Flip`).

```ts
import { Flip } from 'gsap/Flip';

// 1) capture the SOURCE element's bounds the instant before it changes/unmounts:
const state = Flip.getState(sourceEl);          // e.g. the dot's box

// 2) mount the TARGET pane at its FINAL geometry (centered), give source+target the
//    SAME data-flip-id so Flip pairs them, then bloom:
Flip.from(state, {
  duration: 0.62,
  ease: SOFT,
  scale: false,            // animate REAL width/height (not transform-scale) — sharper text/edges
  props: 'borderRadius',   // tween the radius too
  onUpdate: () => {        // GLASS ONLY: keep the refraction synced to the live box
    glass.syncOptics({ w: root.clientWidth, h: root.clientHeight, radius: readRadiusPx(root) });
  },
  onComplete: revealContent,   // stagger the inner content in AFTER the shape settles
});
// CLOSE = reverse the exact same timeline: tl.reverse(); tl.eventCallback('onReverseComplete', unmount);
```
`data-flip-id` on both the source (`dot-${id}`) and the target pane is what lets Flip match and morph one
into the other.

### B-3 · The shared "feel" (this is what makes it read premium — copy these exactly)
- **One soft ease everywhere:** `SOFT = cubic-bezier(0.22, 1, 0.36, 1)` (a gentle expo-out). Register it once
  as a GSAP `CustomEase` so JS tweens match CSS transitions 1:1. (`lib/motion.ts`.)
- **Duration:** the morph is **~0.62s** (`DUR_MORPH`); secondary fades ~0.4s; fast bits ~0.24s.
- **Hide content during the morph, reveal AFTER it settles.** The opening surface stays clean (just the
  shape + refraction); then on `onComplete`: header fades+slides up (`y:8→0`), and rows **stagger in ~40ms
  apart** (`gsap.from(rows, { opacity:0, y:12, stagger:0.04 })`). This staggered settle is the "cool" part.
- **Animate real width/height, not `scale`** — keeps text crisp and corners sharp through the morph.
- **Reduced motion:** skip the morph entirely; cross-fade in at final size, all content at once.

---

## C · How to apply it to regular UI components

The morph is **geometry, not glass** — it works on ANY DOM element. To make a normal card/bubble/panel "open":
1. Decide the flavor: **expands in place → B-1** (lerp the box); **opens elsewhere → B-2** (Flip from source).
2. Tween with `SOFT` over `~0.62s`, animating `width/height/borderRadius` (+ position for Flip).
3. Keep inner content `opacity:0` during the morph; on complete, **stagger it in** (B-3).
4. Reverse the same timeline to close.
5. *(Only if the surface is liquid-glass)* call `syncOptics` in `onUpdate` so the refraction tracks the box.

Wrap it as a hook/util so every component opens the same way, e.g. `useOpenMorph(sourceRef, finalGeo)` →
`{ open, close, applyT }`. That single primitive, reused, becomes the recognizable "open" of the whole UI.

---

## D · Files to read in the source (`~/code/test/src/`)
- `components/AskPill.tsx` — the "ask about your week" pill + the **in-place geometry morph** (B-1).
- `components/MorphPane.tsx` — the **Flip shared-element morph** (B-2), open + reverse-to-close, content stagger.
- `components/Glass.tsx` — the CSS/SVG liquid-glass surface (only needed if the morphing surface is glass).
- `lib/motion.ts` — `EASE_SOFT` (the cubic-bezier), `DUR_MORPH/BASE/FAST`, GSAP plugin registration.
- `components/AskFlow.tsx` — the full reflection flow the pill launches (bubbles + drag-to-connect + report).
- `components/FieldContext.tsx` — the "only one thing open at a time" orchestration.

Run it: `cd ~/code/test && npm install && npm run dev` → http://localhost:5190.
