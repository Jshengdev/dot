# DOT · visual lab

The **experimental front-end window** — where we hone glass UI assets against the locked clean-blue design
language and *see* them live. Not the product engine; a sandbox. Finished assets get ported into the real
frontend later.

```bash
cd packages/lab
npm install --legacy-peer-deps      # postprocessing's peer range is over-strict; the pinned set is known-good
npm run dev                         # → http://localhost:5180
```

## What's here — Liquid Chrome UI, in clean-blue

The glass system is a liquid-chrome surface retinted white + trust-blue. A scrolling gallery, each panel an
isolated glass asset, hot-reloading as we tune.

| Panel | What it is | Interaction |
|---|---|---|
| **the glass dot** | DOT's hero — a liquid metaball orb in the transmission skin, a faint blue heart inside clear glass | hover melts a droplet toward the cursor · press ignites the core (bloom) |
| **the jelly slider** | a liquid blue fill on a lagged lerp; fast drags stretch a neck that pinches off | drag the fill |
| **the glass toggle** | a round glass knob that slides + squashes; the blue fill ignites on | click to flip |

## How the glass works (the taste, extracted)

- **`glass/materials/LiquidGlass`** — drei `MeshTransmissionMaterial`. `distortion` is the melt (the refraction
  field wobbles). Glass stays clear; the accent is never the glass.
- **`glass/scene/Studio`** — local `Lightformer` strip-lights become the streak highlights on every curved
  silhouette = wet chrome. A cool gradient backdrop gives the clear glass something to refract (a pure-white
  room would make it invisible).
- **`glass/post/PostFX`** — selective `Bloom` (luminance ≥ 1.0): only the blue ignite blooms; the glass never does.
- **`glass/sim/damp`** — `expDamp` (lagged lerp, never a spring) for follows; `VSpring` for overshoot settles.
- **`glass/interaction/pointer`** — one pointer **per canvas** via `<GlassScene>` context (a shared singleton
  leaked one panel's cursor into another's metaballs — the bug behind the stretched knob).
- **`glass/components/LiquidBody`** — the metaball (marching-cubes) engine: author balls, the field authors the
  liquid (merge / neck / pinch-off for free).

## Verifying glass renders (important)

`MeshTransmissionMaterial` needs a real GPU. **Headless Chromium renders it wrong** (software WebGL → you see
only the inner core, not the glass). Capture with a real GPU — `headless: false` (see the
`capture-three.mjs` pattern). In a normal browser at `localhost:5180` it renders correctly.

## On-brand, no drift

Wrapped in `class="brand-clean-blue"` (`src/main.tsx`), importing the **frozen** `design/tokens.css` directly.
A single `<Leva collapsed />` (top-right) tunes the live glass / slider params. Read
`design/moodboard/FINGERPRINT.md` (the four pillars) before tuning.

## Add a glass panel

Make a component that calls `usePointer()`, wrap its scene in `<GlassScene>`, drop it in `src/panels/`, register
it in the `PANELS` array in `App.tsx`. Keep demo copy in clearly-marked consts (content ≠ structure).
