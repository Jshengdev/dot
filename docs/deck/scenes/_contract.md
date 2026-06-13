# DOT Deck — Scene Contract

**Read this whole file before writing a scene. Conform exactly. You do NOT need to see any existing scene code — everything you need is here.** The two reference beats (`01-age-20.js`, `02-age-50.js`) are the gold standard; copy their *shape*, not just their mechanics.

This is an animated **p5.js** pitch deck. A single full-window canvas, **white room** (`#ffffff`), driven by a shell that calls the active scene's `draw(p, t, world)` every frame. You write **one scene file per beat**. Scenes are visual-first, calm, deliberate, expensive. **Almost no on-screen text. Nothing bounces.**

---

## 0. The TASTE — law for every scene (read first, it governs everything)

> The "paper-light world." Top-tier motion-studio bold editorial minimalism. The result must look **deliberate and expensive**, never generic, never decorative.

- **SIMPLE / BOLD / MINIMAL.** ONE precise gesture per beat carries the whole meaning, on generous negative space. **One hero element per view.** Bold = a single decisive large move on a clean field — never loud, never busy, never many things at once. If a mark has no meaning, **cut it**.
- **DEPTH FROM LIGHT, NOT LINES.** **No stroke heavier than 1px anywhere** — favor hairlines (0.5–1px). Model objects with soft light (a 1px white inset highlight + a faint shadow), **never a flat border**. Use `DOT.hairline(...)` for every line; never raw `p.line` with `strokeWeight > 1`.
- **COLOR = MEANING.** The white room. **ONE ink** (`#0b1620`) at alphas only — no second gray, never pure black. **ONE accent**, trust-blue `#007AFF`, on the ONE thing alive/active right now. **warm-red** `#fc7981` **ONLY** for caution / wrong / an ending. Nothing else is colored.
- **DOTS ARE ALIVE.** A dot is a heartbeat — small, with baked-in light (a soft radial highlight + faint colored underglow), **breathing at rest**, never flashing. Use `DOT.aliveDot(...)`.
- **SHOW LESS WORDS ALWAYS.** Essentially **no on-screen sentences** — the visual carries it. Any tiny label/count is IBM Plex Mono, 9–12px, faint. Use `DOT.label(...)`.
- **MOTION SIGNATURE.** House ease `cubic-bezier(.16,1,.3,1)` = `DOT.ease` (siblings `DOT.easeA` .23,1,.32,1 / `DOT.easeB` .22,1,.36,1) — fast out, long settle. **Nothing bounces**; no elastic/overshoot/glow-auras/screen-shake/parallax. The shell handles the **blur-up** transition between beats (blur ~7px→0, ~420ms) — you do nothing for it. Use **organic stagger** (`DOT.stagger`) so fields breathe, never tick in lockstep.
- **≤1 whimsy per beat.** Restraint is the point.

**Ban list (hard):** strokes > 1px · flat borders · decorative gradients · a second gray · pure black/pure white text · more than one accent at once · bounce/elastic/overshoot · glow auras · screen shake · parallax · on-screen sentences · motion that depicts nothing.

---

## 1. File format — `window.SCENES.push(...)`

Each scene lives in its own file under `scenes/`, wrapped in an IIFE, and pushes **exactly one** object onto the global `window.SCENES` array. **Array order = beat order.**

```js
/* scenes/NN-your-id.js */
(function () {
  "use strict";
  var DOT = window.DOT; // shared helpers + palette (see §4–§5)

  window.SCENES.push({
    id: "your-id",                  // string, unique, kebab-case
    note: "Speaker note shown in the 'n' overlay. One short paragraph.",

    onEnter: function (world) {
      // Seed THIS scene's world objects. PRESERVE carried-in motifs
      // (read world.X; only create it if missing). Retarget tweens here.
    },

    onExit: function (world) {
      // Leave carry-out motifs in `world`. Null out scene-private state
      // you do NOT want the next beat to inherit (world.tempThing = null).
    },

    draw: function (p, t, world) {
      // Called every frame while active. `p` is the p5 instance (or an
      // off-screen buffer during a transition — same API, don't assume
      // it's the visible canvas). `t` is 0..1 progress through THIS beat.
      // Animate your 1–2 movements as a function of DOT.ease(t).
    }
  });
})();
```

**Registration:** add `<script src="scenes/NN-your-id.js"></script>` to `index.html`, **after** `shared/helpers.js` and **before** `shared/shell.js`. Keep scripts in beat order.

### Required keys
| key | type | meaning |
|---|---|---|
| `id` | `string` | unique, kebab-case (e.g. `"age-50"`). |
| `note` | `string` | speaker note for the `n` overlay. ~1 short paragraph. |
| `draw(p, t, world)` | `fn` | render one frame. Read `world`, draw via `p`. |
| `onEnter(world)` | `fn` | seed/retarget world objects. **Idempotent.** |
| `onExit(world)` | `fn` | leave carry-out motifs; clear scene-private state. |

All five keys are required. `onEnter`/`onExit` may have empty bodies but **must exist**.

---

## 2. The `t` parameter (per-beat progress)

- `t` runs **0 → 1** over the beat's intro window once entered, then **holds at 1** until the presenter advances. The shell owns this clock — do not track your own wall-clock for the main movement.
- Animate your **1–2 movements** as a function of `DOT.ease(t)` (the house curve — front-loaded, gentle settle, **no overshoot**).
- **At most 1–2 movements per beat.** Restraint is the aesthetic. When in doubt, animate one thing well.
- Do **not** rely on `t` for continuity tweens that must survive being held or revisited — use `DOT.tween` on persistent `world` objects (see §3).
- For ambient *rest* motion (breathing, drift) read `world.clock` (ms), **not** `t`.

---

## 3. The `world` object (CONTINUITY BUS) — the most important rule

`world` is a **single persistent, mutable object** passed to every scene. The shell **never clears it.** It is how motifs **carry and morph across beats** — this is the whole point of the deck.

### The carry-and-morph law
> A scene must **never re-create** a motif it can **inherit**. If a motif already exists in `world`, read it and **retarget its tweens** (`world.X.foo.target = ...`). Only *create* a motif if it is absent (first appearance, or a safe fallback for deep-linking).

The reference beats prove it: `01-age-20` seeds `world.slider` (a bar with `len` + labels). `02-age-50` inherits the **same** `world.slider` object and only sets `len.target` larger and swaps label alphas. The bar visibly **persists and extends through the blur-up** — it is not redrawn from scratch. (Verified: `02` reads the identical object reference `01` left behind.)

### Shell-managed fields (read-only for scenes)
Refreshed every frame — read them, don't overwrite:
| field | meaning |
|---|---|
| `world.w`, `world.h` | live canvas width / height (px). |
| `world.cx`, `world.cy` | canvas center (px). |
| `world.clock` | `performance.now()` ms — for ambient motion (breathing) only. |
| `world.transitioning` | `true` only during a blur-up develop. May read it to hush motion; optional. |

**Resolve all geometry from `world.w`/`world.h` every frame** (store fractional anchors like `xFrac`/`yFrac`, not absolute px) so motifs survive window resize.

### Named shared motifs (the continuity vocabulary)
Use these canonical slots so motifs are recognizable across beats. Animatable numbers are `{value, target}` (see below). Add new ones sparingly and document them here.

| slot | shape (convention) | meaning |
|---|---|---|
| `world.slider` | `{ xFrac, yFrac, len:{value,target}, leftLabel, rightLabel:{text, alpha:{value,target}}, leftAlpha:{value,target} }` | the age/timeline **bar**. Grows, extends, re-labels. |
| `world.character` | `{ xFrac, yFrac, scale:{value,target}, mood:'calm'｜'tense'｜'off', glow:{value,target}, _drawX }` | the protagonist **dot** (see §4 `drawCharacter`). Carries everywhere. `_drawX` is its glided live px. |
| `world.glass` | `{ xFrac, yFrac, r:{value,target}, core:{value,target} }` | the brand **glass sphere** (see §4 `glassDot`). |
| `world.peopleDots` | `[ { x, y, r, alpha, phase, ... } ]` | a **crowd field** of alive dots. |
| `world.storyRibbon` | `{ pts:[{x,y}...], ... }` | a flowing **ribbon/path** of a life. |
| `world.factDots` | `[ { x, y, alpha, phase, ... } ]` | scattered **evidence points**. |

You may invent a new motif slot, but: (a) namespace it on `world`, (b) give it a tweenable shape (`{value,target}` for animatable numbers), (c) add a row to this table.

### Tweenable-number convention
Any number that should glide (not snap) is stored as `{ value, target }`. Each frame call `DOT.tween(obj, rate)` to step `value` toward `target`. **Set `target` in `onEnter` (the morph); let `draw` tween it.** `rate ≈ 0.12` is calm; lower is slower.

### Carry-in / carry-out discipline
- `onEnter`: **preserve** carried-in motifs — `if (!world.X) world.X = seed(); else retarget`. Idempotent so jumping back re-centers cleanly.
- `onExit`: leave carry-out motifs in `world`. **Null out** scene-private fields the next beat shouldn't inherit (`world.tempThing = null`).
- Never read a carried motif without a fallback seed — a presenter may **deep-link** straight to your beat. **Never blank out**; degrade to a sane default (the reference `02` does this).

---

## 4. Shared helpers (on `window.DOT`) — exact signatures

All helpers live on `window.DOT` (defined in `shared/helpers.js`, loaded before scenes). Do **not** redefine them; do **not** mutate `DOT.palette`. Prefer these helpers over raw p5 drawing — they *are* the taste.

### Color
```js
DOT.col(p, hex, a)   // p5 color from a palette hex at alpha 0..1.
```
The **only** sanctioned way to get faint ink: `DOT.col(p, DOT.palette.ink, 0.5)`. No second gray, ever.

### Hairline (every line goes through this)
```js
DOT.hairline(p, x1, y1, x2, y2, opts)
```
A line **modeled by light**: a 1px ink stroke + a 1px white "lip" beneath it (the page's light catching the lower edge) — reads as an object, never a border.
`opts` (optional): `alpha` ink alpha 0..1 (def `.8`) · `hex` color (def ink) · `lip` white-lip strength 0..1 (def `.9`) · `weight` (def `1`, **clamped to ≤1 by law**).

### Alive dot (every dot goes through this)
```js
DOT.aliveDot(p, x, y, r, opts)
```
A **heartbeat**: a filled disc with a baked top-left highlight + a faint colored underglow, optionally breathing.
`opts` (optional): `hex` (def accent — "alive") · `alpha` 0..1 (def `1`) · `glow` underglow 0..1 (def `.55`) · `breath` pass `world.clock` to breathe, omit to keep still · `phase` breath phase in radians (give each dot in a field its own so they don't pulse as one).

### Character (identical in every scene)
```js
DOT.drawCharacter(p, x, y, opts)
```
The one, simple, **always-identical** protagonist: an alive translucent ink dot (baked light + breath) with a minimal calm face (two eyes + a short mouth hairline). Draw it identically everywhere — it must read as the same "someone".
`opts` (all optional): `scale` (1 ≈ 58px Ø, def `1`) · `mood` `'calm'｜'tense'｜'off'` (def `'calm'`) · `glow` 0..1 (def `.5`) · `alpha` 0..1 (def `1`) · `look` -1..1 gaze offset (def `0`) · `breath` pass `world.clock` to breathe · `phase` breath phase (def `0`).
Mood semantics (keep consistent): **calm** = round eyes, soft curved mouth, blue underglow · **tense** = narrowed eyes, flat mouth, warm-red underglow hint · **off** = body fades to ghost, eyes become closed hairlines.

### Glass dot (brand object)
```js
DOT.glassDot(p, x, y, r, coreOn)
```
Translucent glass sphere modeled by light: faint cool fill, 1px hairline rim, top-left specular, and an accent-blue **core** lit by `coreOn` (0..1 — the "focus / on" state; `0` = dormant glass).

### Label (the only on-screen text)
```js
DOT.label(p, text, x, y, opts)
```
IBM Plex Mono micro-label. `opts`: `size` px (def `11`, clamped 9..13) · `alpha` 0..1 (def `.4`) · `hex` (def ink) · `align` `p.LEFT｜p.CENTER｜p.RIGHT` (def `p.LEFT`) · `track` letter-spacing px (def `.6`, applied on LEFT-aligned only). **Use sparingly.**

### Motion / math
```js
DOT.ease(t)            // HOUSE ease  cubic-bezier(.16,1,.3,1) — fast out, long settle, no overshoot
DOT.easeA(t)           // sibling     cubic-bezier(.23,1,.32,1)
DOT.easeB(t)           // sibling     cubic-bezier(.22,1,.36,1)
DOT.easeInOut(t)       // symmetric smootherstep (in-and-out movements)
DOT.stagger(i, n, t, opts)   // organic per-index local progress (breathes, never lockstep)
                             //   opts.spread (def .55) · opts.ease (def DOT.ease) · opts.seed
DOT.breathe(clock, opts)     // calm rest oscillation around 1.0
                             //   opts.period ms (def 3400) · opts.amp (def .035) · opts.phase rad
DOT.tween(obj, rate)         // step obj.{value->target}; returns new value (rate ~.12 calm)
DOT.lerp(a, b, t)            // numeric lerp
DOT.clamp(v, a, b)           // clamp to [a,b]
DOT.map(v, a, b, c, d)       // remap v from [a,b] to [c,d]
```

---

## 5. Palette (locked — `DOT.palette`)

Use **only** these. No new hexes. No pure black, no second gray.

| token | value | use |
|---|---|---|
| `DOT.palette.page` | `#ffffff` | the white room — canvas background (shell paints it each frame). |
| `DOT.palette.ink` | `#0b1620` | the ONE ink — primary marks at alphas (`DOT.col`). **Never pure black.** |
| `DOT.palette.accent` | `#007AFF` | trust-blue — the ONE thing **alive / active right now**. |
| `DOT.palette.warmRed` | `#fc7981` | **caution / wrong / an ending ONLY.** Never decorative. |

For faint ink, **don't add a gray** — use the one ink at an alpha: `DOT.col(p, DOT.palette.ink, 0.5)` (sensible alphas: `.9 / .8 / .7 / .5 / .4`).

---

## 6. Transition & continuity model (BLUR-UP — shell-owned)

- **Advance** (Right / Space / click-right) fires a **blur-up develop**, run by the shell: the incoming beat is rendered to an off-screen buffer and drawn back **blurred**, the blur easing **~7px → 0 over ~420ms** on the house curve — the composition **develops like a photo, never a hard cut**. You do **nothing** for the blur-up.
- **The real continuity is the `world` morph.** On advance the shell calls your `onExit` then the next beat's `onEnter`, so a carried motif keeps its `value` and only gets a new `target` — it visibly **tweens from the old state to the new while the frame develops up to sharp**. (See the reference bar extending from `20`→`50`.)
- So: to make a beat feel connected, **inherit a motif and move it**, never fade in a brand-new composition.
- During the develop your `draw` may receive an **off-screen buffer** instead of the visible canvas — it has the identical p5 API, so just draw normally; never assume `p` is the real canvas.

---

## 7. Navigation (shell-owned — for reference)

| input | action |
|---|---|
| `→` / `Space` / click right half | next beat |
| `←` / click left half | previous beat |
| `Home` / `End` | first / last beat |
| `f` | toggle fullscreen |
| `n` | toggle speaker-notes overlay (shows active `note`) |

A faint mono **beat counter** (`NN / NN`) sits bottom-right. You don't manage any of this.

---

## 8. Checklist before you commit a scene

- [ ] One IIFE, one `window.SCENES.push({...})`, all five keys present.
- [ ] `<script>` added to `index.html` in beat order (after helpers, before shell).
- [ ] Inherits carried-in motifs (no needless re-creation); seeds only if absent.
- [ ] All animatable numbers are `{value,target}` + `DOT.tween`; `target` set in `onEnter`.
- [ ] Geometry resolved from `world.w/h` each frame (fractional anchors stored).
- [ ] **1–2 movements max**, driven by `DOT.ease(t)`; nothing overshoots/bounces.
- [ ] **Every line via `DOT.hairline` (≤1px); every dot via `DOT.aliveDot`.** No raw stroke > 1px, no flat borders.
- [ ] Only `DOT.palette` colors; one accent at a time; warm-red only for caution/ending.
- [ ] Almost no text; any label via `DOT.label` (mono, faint, 9–12px).
- [ ] `onExit` leaves carry-out motifs, nulls scene-private state.
- [ ] Degrades gracefully if deep-linked (fallback seed, never blanks).
- [ ] `node --check scenes/NN-your-id.js` passes.
