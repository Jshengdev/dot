# BUILDER-START — the first target + per-layer verification gates

> How the build begins. Get **the big one** (the minimal end-to-end loop) running first, proving every seam; then
> loop workflows/objectives on top, each as a new layer with its OWN gate. Nothing advances until its gate is green.
> Pairs with `SKELETON-SPEC.md` (the WHAT) — this is the ORDER + the VERIFY. Discipline: `PORT-SOTARE-CONSTRAINTS.md`.

## "The big one" (build this first, everything else loops on it)
**Synthetic story in → Grok splits objective from subjective → store it → reflect the delta against seeded events
→ one glass dot + the catch line on screen.** That's the whole spine. Get it running on stub, then make each node
real. Resist every feature that isn't on this line until it's green end-to-end.

## The verification contract (every layer obeys it)
- A layer is **DONE** only with a **run command + observed output** (no "looks right"). No silent stubs — a failure
  renders a visible FAILED state.
- Each gate below is a command **Johnny can run too**, so we both see the same green/red and debug fast.
- Build the layer, run its gate, paste the output, move on. One layer at a time (WIP=1).

## The foundation layers (in order, each with its gate)

**L0 — Scaffold + env + types.** pnpm + Next.js (Vercel) + a shared `types` module built from `CONTRACTS.md`
(`Story{subjective,objective,delta}`, `Event`, `DotRun`, `DotEvent`). Copy `.env` (XAI_API_KEY is already there).
- **Gate:** `pnpm i && pnpm typecheck` clean; `pnpm dev` boots; `curl -s -H "Authorization: Bearer $XAI_API_KEY" https://api.x.ai/v1/models` returns the model list (✅ already verified).

**L1 — The store + synthetic seed (in-proc Map first).** Tables: `users · messages · stories · events · stat_sheet(view)`.
Seed synthetic `events` (the demo's counter-evidence: ~50 `message_received` this week, etc.).
- **Gate:** a script writes one story + queries `COUNT(*) events WHERE kind='message_received' AND ts>now()-7d` → prints **50**. The counter-evidence exists before any LLM.

**L2 — The one Grok extraction (the core).** Vercel AI SDK `@ai-sdk/xai`, model `grok-4.20-0309-reasoning`,
`generateObject({ schema: Story })` → `{ subjective, objective, delta }` from a transcript.
- **Gate:** feed a synthetic spiral ("my friends hate me, no one cares") → returns a valid typed object; `objective`
  is grounded in the transcript, `delta` is non-empty. **Johnny eyeballs the tone: facts, not a verdict, never "you're overreacting."**

**L3 — The turn loop (text, before any channel).** inbound text → assemble ≤2 context layers (this story + relevant
events) → ONE Grok call → reply. (Collapse any multi-agent impersonation — DOT does one reasoning call.)
- **Gate:** a terminal/HTTP exchange round-trips: you type a story, DOT replies with the reflection. No iMessage yet.

**L4 — The director (Inngest), stub → real.** `dotRun`: extract → classify → reflect → (≤1 refine) → finalize, with a
`waitForEvent` **human-on-risk** branch. Emits the event stream; the `reflect:delta` event is THE moment.
- **Gate:** trigger one run → the Inngest dev dashboard (`127.0.0.1:8288`) shows the durable steps; the `reflect:delta`
  event fires with the catch payload; the human-on-risk branch pauses + resumes on approve.

**L5 — The connectors (plugins).** (a) iMessage in/out (carry the **GUID-dedup** + `isFromMe` filters + bubble pacing).
(b) Voice entry via the realtime WS (`wss://api.x.ai/v1/realtime`) → live transcript into the same turn loop; TTS
(`/v1/tts`, `eve`) for DOT's spoken reply. The data-ingest `Connector` interface = `SyntheticConnector` now.
- **Gate (iMessage):** a real text to the number → DOT replies once (no double-send). **Gate (voice):** speak a story →
  transcript appears → pipeline runs → DOT speaks back (the TTS mp3 already verified at 200).

**L6 — The reflection output.** glass-dot render (`grok-imagine-image`), the stat-sheet aggregate, the provider summary.
- **Gate:** a run renders one glass dot in-brand (`design/`), the stat-sheet shows real aggregates from `events`, and
  the provider summary generates from the stored story (no invented data).

## The loop-on-top model (after the big one is green)
Once L0–L4 run end-to-end (even on stub → then real), **add each new workflow/objective as its own layer with its own
gate** — e.g. richer extraction, a second connector, the refine loop's intelligence, longitudinal patterns. Never stack
an unverified layer on a verified one. The demo path (`DEMO-SCRIPT.md`) is the only code that gets polish.

## How Johnny helps (the human in the loop)
- **Run the gates with me** — paste the output of each (esp. L1's "50", L2's extraction, L4's Inngest trace). Two eyes.
- **The tone call is yours** — at L2/L4, judge whether the reflection *validates the feeling and shows facts* vs. tips
  into invalidation. That's the one thing the model can't self-certify (it's the "humans mean" half).
- **Unblock the two remaining keys** — Inngest (dev-server is keyless to start) and iMessage/Photon (point me at the
  reference `.env` to copy). Voice + reasoning + image + TTS are already wired.
- **Confirm the exact realtime voice model id** when L5 starts (the endpoint's live; we just need the model string).
