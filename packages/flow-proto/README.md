# DOT · flow-proto

The **experiential front-end prototype** — the imagined run, end to end:

**enter → practice → check-ins → logs (knowledge graph) → summary**

A standalone Next.js app, **isolated from `packages/frontend`** (the concurrent "main" build, which wires
the real `@dot/backend`). This is the *experience* prototype; we combine the two intentionally later. The
glass dot is ported from `packages/lab`; **Dot speaks via real Grok TTS** (voice `eve`).

```bash
cd packages/flow-proto
npm install --legacy-peer-deps     # postprocessing's peer range is over-strict; the pinned set is known-good
npm run dev                        # → http://localhost:5175   (HMR)
# or, if the file-watcher hits EMFILE under the concurrent builds:
npm run build && npm run start     # → http://localhost:5175   (no watcher, stable)
```

> Needs `XAI_API_KEY` in `packages/flow-proto/.env.local` (gitignored). Already wired from the repo-root `.env`.

## The five phases (`components/phases/`)

1. **Enter** — the glass dot morphs into being (droplets converge), a lighter/matte core "turns on" and
   **blinks**; **poke him** → he reacts + speaks; a **begin** pill. He says "hi, this is dot." (real Grok voice).
2. **Practice** — 2–3 scripted turns where he *gets* you (he speaks each line); then a **paste-transcript**
   box to end the 15-min session → "i'll check in with ya on imessage."
3. **Check-ins** — **⏩ fast-forward** simulates the wait; the agent re-opens the thread days later with an
   **objective**, 2–3 turns toward it; repeat, then → logs.
4. **Logs** — the **"unload"** node branches into chunks; **connect the dots** links the subjective **story**
   into one blue thread and leaves the objective **facts** standing alone (`fact → provider`).
5. **Summary** — a timeline story card, small **stat cards** (perceived vs actual contact, panic logs, the
   Sunday cluster), a **provider recommendation**, and **see detailed**.

Jump between phases with the **dot-nav** (top-right) — demo convenience.

## How it's built

- **Next.js 14 (App Router) + TS**, wrapped in `brand-clean-blue`, importing the **frozen** `design/tokens.css`.
- **Tailwind** for layout (colors mapped to the locked tokens) · **Framer Motion** for phase/bubble motion ·
  **GSAP** available · **R3F** for the dot (`components/GlassDot.tsx`, client-only via `GlassDotClient`).
- **Voice:** `app/api/tts/route.ts` calls Grok `/v1/tts` server-side (key never reaches the client);
  `lib/voice.ts` caches + plays. Autoplay blocks fail quiet — the first **poke** (a gesture) always talks.
- **Content** is all in `lib/script.ts` (editable; content ≠ structure).

## Gotchas worth knowing

- **R3F glass needs a real GPU** — headless Chromium renders transmission wrong (verify headful).
- **Tailwind purges `@layer components`** classes whose names are built dynamically (`bubble--${...}`). Keep
  such component classes in **plain CSS** (outside `@layer`), as `globals.css` does.
- **`npm run dev` file-watcher** can hit `EMFILE` when several builds run at once — use `build && start`.
