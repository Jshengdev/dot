# GOAL-FRONTEND — the `/goal` that builds DOT's live end-to-end demo flow

> **How to use.** Paste this whole file (or run `/goal docs/GOAL-FRONTEND.md`) in the build window to build the
> frontend. This is the **mission-specific companion** to `docs/GOAL.md` (the generic engine kickoff) and is **exact to
> how Johnny imagines the demo**. It supersedes flow-proto's scripted phases: the job is to make that arc **LIVE**.
> Read `docs/ADVISEMENT-2.md` first (the backend contract + the locked hero), then this.
>
> **Verified against live source on disk (2026-06-13):** `packages/frontend`, `packages/flow-proto`,
> `packages/backend/src/{turn,run,director,extract,store,seed,types}.ts`, `docs/sample-story.json`.

---

## (0) The ONE thing to build

Turn the existing scripted prototype (`packages/flow-proto`) into the **live, end-to-end DOT demo**: four scenes —
**poke intro → live onboarding conversation → staggered check-ins over simulated time → "view my story" (connect-the-
dots + provider report + timeline)** — every user response routed through the **real backend pipeline** (`runTurn()` →
one live Grok reasoning call → grounded two-truths split → persisted record). The demo runs on **premade scripts**
(DOT's side + paste-ready user content) so it's bulletproof on stage, **but the same path handles any live response** —
that's the **"halfsies"** rule (§3). The locked hero is `anxiety-hero` (`docs/sample-story.json`); the split it produces
is **already proven live** and preserved verbatim.

**What "done" means:** Johnny clicks through all four scenes live; in Scene 2 he types/speaks 1–2 answers and pastes the
rest; DOT reflects back the real validate-first split with traces; check-ins arrive over "simulated" time and he replies
(one live, one pasted); the story page animates connect-the-dots, pops the report, and shows the at-a-glance + provider
report + timeline. No silent stubs; failures show a FAILED state; voice/image are optional and gated.

---

## (1) Current reality — what exists, what's a gap

**Two Next.js apps today:**
- `packages/frontend` (port 5170) — the "real" one: a single `ThreadSurface` that auto-runs `GET /api/run` → `Reflection`
  and stages the reveal (spiral → glass dot → validate → subjective → stats → objective → delta → report). One page.
- `packages/flow-proto` (port 5175) — the **UX arc prototype** and the thing to grow: 5 phases in `components/phases/`
  (`enter → practice → check-ins → logs → summary`), all dialogue in `lib/script.ts`, voice via `lib/voice.ts` →
  `POST /api/tts`. **Everything except TTS is scripted/mock — no phase calls the real pipeline.** The glass dot ("poke")
  + the ⏩ fast-forward + the connect-the-dots graph + the summary are all here, but as content, not live.

> **▸ DECISION — build on `flow-proto`.** Its 5 phases already match Johnny's 4 scenes (practice+logs+summary fold into
> Scene 2 and Scene 4). Grow flow-proto into the live app; pull the proven glass-dot + the staged-reveal taste from
> `packages/frontend`/`packages/lab`. Don't start a third app. (If it's cleaner to converge both into one, do it — but
> the flow-proto arc is the spec.)

**Backend API that EXISTS (consume these):**
| Method · path | Body | Returns | Use |
|---|---|---|---|
| `GET /api/run` | — | `Reflection` | one-shot demo reflection (current frontend) |
| `POST /api/run` | `{ transcript?, userId?, now? }` | `Reflection` | reflect on a custom transcript |
| `POST /api/tts` | `{ text }` | audio/mpeg (24kHz) | DOT speaks (voice "eve"); flow-proto only |

**Backend logic that EXISTS but isn't exposed to the browser:**
- `turn.ts` `runTurn({ userId, text, now? })` → `{ reply, story, context }` — **the live conversation spine**: assembles
  context (last-N messages + recent stories + a windowed evidence read), makes **one** Grok `extract` call, persists the
  inbound message + the `Story` + appends `source:'story'` facts to `events`, and shapes a two-beat reply
  (validate, then the delta). The iMessage agent already drives this. **This is the engine for Scene 2 + Scene 3.**
- `seed.ts` (`SEED_COUNTS`, `SEED_NOW`) — seeds the synthetic objective record.
- `store.ts` — in-proc `Map` (users · messages · stories · events; `stat_sheet` is a GROUP-BY function).
- `run.ts` `buildReflection()`/`buildReport()` — the `Reflection`/`ReportSO` (S/O only) the UI renders.

**The gaps to BUILD (small, well-bounded):**
1. **`POST /api/turn`** — wrap `runTurn()` so the browser can have the live conversation (Scene 2 onboarding + Scene 3
   replies). **The one new core endpoint.** Body `{ userId, text, now? }` → `{ reply, story, context }`.
2. **`GET /api/story?userId=` (+ `GET /api/record?userId=`)** — read the persisted `stories[]`, `events[]`, the
   `stat_sheet`, and the `Reflection`/provider report for the **Scene 4 story page** (connect-the-dots, at-a-glance,
   report, timeline). Pure reads over the store; no new model calls.
3. **Seed-on-boot (or `POST /api/seed`)** — load the `anxiety-hero` synthetic `events[]`/timeline so the objective
   record + the 6-day pattern exist for connect-the-dots and the provider counts. (Use `seed.ts`; source the counts from
   `docs/sample-story.json`.)
4. **Frontend-driven "simulate time"** — NO backend scheduling, NO Inngest Cloud. The frontend holds the ordered
   check-in scripts and a fake clock; "simulate 3 hours" / "simulate next day" advances the clock, surfaces the next
   DOT check-in bubble, and passes the simulated timestamp as `now` to `POST /api/turn` for the user's reply.

> **NOT needed (cut/skip):** SSE/WebSocket streaming (the staged client-side reveal is enough), Inngest Cloud, a
> human-handoff signal route, Grok image-gen, multi-user auth, SQLite (in-proc `Map` is fine for the demo).

---

## (1.5) ⚠️ VALIDATED against live code — 4 things the builder MUST handle (do NOT skip)

These were verified against the real source (2026-06-13). Each is a place where the obvious assumption is wrong and
would burn build time. Handle all four or the demo won't match.

1. **flow-proto can't import the backend yet (5-min unblock, gates every route).** `packages/flow-proto/next.config.mjs`
   is missing `transpilePackages: ['@dot/backend']` + the `.js→.ts` extensionAlias webpack config that
   `packages/frontend/next.config.mjs` has. **Copy that config into flow-proto first** — otherwise none of the new
   routes can `import` from `@dot/backend`. Then reuse frontend's `app/api/run/route.ts` boilerplate verbatim
   (`ensureEnv()` that reads repo-root `.env`, `runtime='nodejs'`, `dynamic='force-dynamic'`, dynamic `await import('@dot/backend')` AFTER env load).

2. **Risk detection is NOT in `runTurn`/`runStory` — only in the Inngest `director.ts`.** `CRISIS_CUES` + `detectRisk()`
   live in `director.ts` and never run on the `/api/turn` path. So a "sleep forever" reply will **not** auto-surface 988
   through `runTurn`. **Demo fix (simple + true):** the risk check-in (check-in 3) is **fully scripted** — render the 988
   card from the script (`risk.message` verbatim). **To make it real & cheap:** have the `/api/turn` route also run
   `detectRisk(text)` (a substring scan — trivial to import/reimplement) and return a `risk` boolean; the frontend shows
   the 988 card when `risk === true`. Either way, **don't expect `runTurn` to hand you risk.**

3. **`feeling_validation` is NOT persisted on `Story` — Scene 4 must not re-run the model.** The `Story` shape has
   `subjective[]/objective[]/delta` but no `feeling_validation` (it only exists in the live turn's return). So you
   **cannot** rebuild the full reflection from the store alone without a new Grok call. **Fix (no schema change, no
   re-run):** when Scene 2's onboarding turn runs live, the frontend already receives the full reflection — **cache it
   client-side** and render Scene 4's validate-first beat from that cache. The provider report + at-a-glance O/S +
   timeline need only `Story` + stats (all persisted), so build those from `GET /api/record` via `buildReport`/
   `buildStats` (pure, no model call). Net: Scene 4 = cached onboarding reflection + read-back record. Zero re-run.

4. **The seed ≠ the anxiety hero — align it or the demo numbers won't match.** `seed.ts` seeds user `'demo'` with
   **social/loneliness** events only (48 `message_received`, 19/12 initiations, 7 calls, 3 physical-symptoms) — that's a
   *different* story. The anxiety hero's events (6 `panic_attack`, 2 `self_harm`, 2 nights sleep <6h, 1 `ideation`) live
   **only** in `docs/sample-story.json::events[]`. **Copy those 10 events into the seed for user `'demo'`** (matching
   `stat_sheet` counts) so the live turn grounds on the right record and connect-the-dots + the provider counts match
   the hero. Pass the same `now` (`SEED_NOW`) to seed + reads so the 7-day windows line up.

---

## (2) The exact flow — scene by scene (build to THIS)

Each scene below states: **what Johnny does**, **scripted vs live**, **the backend call**, **the premade content**, and
**acceptance**. Scene order is the demo order.

### SCENE 1 — Poke intro ("who are you?")
- **Johnny does:** lands on a calm screen with the glass DOT ("poke"). He **pokes her**; each poke, she speaks/shows a
  short blurb about who she is and what she does. A clear "begin / tell me your story" affordance ends the scene.
- **Scripted vs live:** fully **scripted** (the blurbs are authored). Voice (TTS) optional.
- **Backend:** none required. Optional `POST /api/tts` so poke speaks her blurbs (voice "eve").
- **Premade content — 🔒 LOCKED (use VERBATIM, Johnny's voice; do not reword).** `DOT.pokes` = **4 sequential** blurbs
  (play in order on the first 4 pokes — she wakes up, then greets, then the idea, then the invite), then `DOT.pokesFun`
  rotates the extras on further pokes. The "begin / tell me your story" CTA appears after poke 4 (or anytime):
  ```ts
  DOT.pokes = [                                                   // sequential, in order
    "okay okayyy. im awake now.",                                 // 1 — wakes up on first poke
    "say. hello. im dot.",                                        // 2
    "there are always 2 truths. the one you feel. and the one that happened.", // 3
    "chat with me. i dont bite.",                                // 4 → then the begin CTA
  ];
  DOT.pokesFun = [                                                // rotate after #4, short + sweet
    "no white coats. no waiting room.",
    "i'll never tell you youre fine.",
    "messy is fine. just talk.",
    "tell it how you feel. the report's yours.",
  ];
  ```
- **Acceptance:** poke is interactive (click → next blurb, cycles), reads in-brand, and the "begin" CTA opens Scene 2.

### SCENE 2 — Live onboarding conversation (the heart of "halfsies")
- **Johnny does:** the dot **grows larger**; a conversation surface opens with an **optional "paste transcript" box**.
  DOT asks the onboarding question — *"tell me about a journal entry, and what you're feeling that you want diagnosed."*
  Johnny answers **1–2 turns live** (typed or voice), then **pastes the longer journal entry** into the box for time.
  When he finishes, DOT processes and says **"thank you, I'll keep in touch ok?"**, then **sends the general message**
  (*"hey im here for you here ok! let me know if you need anything!"*), and is **transparent about the check-in plan** —
  *when* it will check in, *for what* questions, toward *what* it's trying to understand (never a diagnosis).
- **Scripted vs live:** **LIVE pipeline on every submission** (typed OR pasted). DOT's onboarding question + the two
  closing messages are **scripted**; the **paste-ready journal text is premade** (so Johnny can paste it fast); the
  **split/reflection is always live**.
- **Backend:** `POST /api/turn { userId:"demo", text:<typed or pasted>, now? }` per user submission → `{ reply, story,
  context }`. Render DOT's `reply` (validate-first beat, then the delta) **with visible traces** (show that a real Grok
  reasoning call ran — a small "reasoning" trace / the `model` name, the grounded counts from `context`). The big paste
  is one `runTurn` call; the live 1–2 answers are their own `runTurn` calls before it.
- **Premade content (canonical = `docs/sample-story.json`):**
  - The paste-ready journal = `transcript.journal` (the panic-attack entry). This exact text already produced the
    **locked, verified** `feeling_validation / objective[4] / subjective[3] / delta` — that's the reflection DOT shows.
  - DOT's closing line: *"thank you — I'll keep in touch, ok?"*
  - The general message: *"hey, I'm here for you, ok! let me know if you need anything."*
  - The transparent check-in plan: derived from the story — e.g. *"I'll check in after your next club night about the
    chest pain, and again in a couple days about how you're sleeping — I'm trying to understand the pattern, not label
    it."* (Map to the three `check_ins[].trigger` reasons.)
- **Acceptance:** a typed answer AND a pasted answer each return a real, grounded reflection; DOT validates the feeling
  first and never invalidates (the tone gate — Johnny signed off); the closing + general message + check-in plan render;
  the record now holds the told story (visible later in Scene 4).

### SCENE 3 — Staggered check-ins over simulated time ("truth built over time")
- **Johnny does:** clicks a control that says **"simulate 3 hours."** The next step **queues instantly**: DOT sends its
  first check-in (an iMessage-style bubble). Johnny **replies live** (typed). DOT follows up. Then DOT sends the second
  check-in; Johnny **pastes a bigger blurb** for time. DOT replies *"okok thank you for sharing. I'll follow up again —
  keep texting if you ever have more to add."* Then **"simulate the next day"** → the same paste-in-the-follow-up loop
  closes the arc (this is where the **risk catch → 988** lands).
- **Scripted vs live:** the **clock + DOT's check-in prompts are scripted/frontend-driven**; **Johnny's replies run the
  live pipeline** (typed live OR pasted) — halfsies again.
- **Backend:** for each user reply → `POST /api/turn { userId:"demo", text:<reply>, now:<simulated ts> }`. DOT's check-in
  *prompts* come from the frontend script (no model call needed to author them); the **replies** are live `runTurn`
  calls that ground in the now-accumulating record (so DOT's follow-up references the real pattern). **988 does NOT come
  from `runTurn`** (risk lives only in the Inngest director — see §1.5 #2): render the 988 card from the **scripted**
  risk check-in (`risk.message` verbatim), optionally gated on a cheap `detectRisk(text)` the route runs.
- **Premade content (canonical = `docs/sample-story.json` `check_ins[]`):** three check-ins, already authored AND
  tone-checked — each has DOT's `text`, a paste-ready `user_reply`, and DOT's `dot_followup`:
  - **check-in 1** (after 2nd club night): DOT mirrors "nervous person" without correcting. → Johnny's **live** reply.
  - **check-in 2** (4th panic + first self-harm): DOT names the arm-scratching gently. → Johnny **pastes** `user_reply`.
  - **check-in 3** (next day, "sleep forever" ideation): **the risk catch** — DOT surfaces 988 + Crisis Text Line
    (HOME to 741741) without alarm, without diagnosing, without dismissing the walk-back. → Johnny **pastes** `user_reply`.
- **Acceptance:** "simulate 3 hours" surfaces check-in 1 instantly; a live reply returns a grounded follow-up; "simulate
  next day" surfaces the risk check-in; the **988 card renders** (resources verbatim); the record now spans the week.

### SCENE 4 — "View my story" (the payoff)
- **Johnny does:** opens the story page. He **sees everything that happened** — the events/the week. He clicks **"connect
  the dots"**: the page **matches the told story into one** and the **facts float out as separate nodes**. A **"see
  report"** popup appears. Clicking it shows, in order: (a) a **quick at-a-glance: objective vs subjective**, (b) a
  **professionally organized provider report**, (c) a **timeline of the story mapped out**.
- **Scripted vs live:** **reads the real persisted record** (built by Scenes 2–3 + the seed). No new model calls — it
  renders what's in the store.
- **Backend:** `GET /api/record?userId=demo` → `{ stories, events, stats }` (reads `getStories`/`getEvents`/`statSheet`).
  Build the provider report with `buildReport(story, stats)` and stats with `buildStats(userId, now)` — **both pure, no
  model call.** The **validate-first line is NOT in the store** (§1.5 #3): render it from the **cached onboarding
  reflection** captured live in Scene 2. Net: Scene 4 = cached reflection + read-back record; **no re-run, no schema change.**
- **Premade content (canonical = `docs/sample-story.json`):**
  - **connect-the-dots:** the **story-as-one** = `transcript` + `subjective[]` (what was felt/said); the **floating
    facts** = `objective[]` + the `events[]`/`timeline[]` (the 6-day pattern). The animation joins the subjective story,
    then the objective facts float free and link to it.
  - **at-a-glance O/S:** `subjective[]` on one side, `objective[]` on the other, with the `delta` as the neutral bridge
    ("you feel X; the record shows Y") — **never a verdict**.
  - **provider report:** render `provider_report{}` (header/provenance · top `safety_banner` · `chief_concern` ·
    `whats_been_happening` (OLDCARTS) · counted `objective_record` · `noticed_or_tried` · `would_like_to_discuss`
    ("I'd like to discuss X because Y") · `most_worried_about`). **S and O only** — never Assessment/Plan.
  - **timeline:** render `timeline[]` (Mon 6/8 → Sat 6/13), each row "what happened" vs "what was felt/said."
- **Acceptance:** the page renders the real record; connect-the-dots animates story↔facts; the report popup shows the
  three views; the provider report is clean and most-important-first with the safety banner on top; nothing is invented.

---

## (3) The "halfsies" doctrine (scripted demo · live engine) — non-negotiable

The demo is **deterministic where Johnny pastes, live where the model thinks.** Concretely:
- **Scripted (premade, in `lib/script.ts`):** DOT's poke blurbs, DOT's onboarding question, DOT's closing + general
  message, DOT's three check-in prompts + follow-ups, the **clock**, AND the **paste-ready user content** (the journal +
  the two longer replies — sourced verbatim from `sample-story.json` so Johnny can paste them in seconds).
- **Live (real pipeline, every time):** **every user submission goes through `POST /api/turn` → `runTurn()` → one live
  Grok call.** Whether Johnny types a fresh answer or pastes the premade text, the split/reflection/reply is produced
  live and grounded in the real accumulating record. **There is no "fake reflection" branch.**
- **Therefore:** the demo handles **any** response — if Johnny improvises, the engine still works; if he pastes, the
  engine still works and the output is the known-good one. The premade content guarantees the *best* output on stage;
  the live path guarantees it's *real*. Say it out loud in Q&A: **"This is a sample story; the reasoning is live."**

---

## (4) Premade demo scripts + the test-the-outputs gate

**Canonical demo content lives in `docs/sample-story.json` (`anxiety-hero`).** `flow-proto/lib/script.ts` **already
exports** the right shape — **retarget the existing consts to the hero** (don't invent new names), keeping them as
clearly-marked editable consts so Johnny tunes copy without touching logic. Existing exports → map to the hero:

```ts
// lib/script.ts (EXISTING exports — point them at sample-story.json):
DOT = { hi, pokes[], beginPrompt, practiceClose }   // Scene 1 blurbs + onboarding prompt + closing
SAMPLE_TRANSCRIPT                                    // → set to transcript.journal (the Scene 2 big paste)
PRACTICE: Turn[]                                     // the 1–2 live onboarding turns (DOT asks, user answers)
PRACTICE_TRANSCRIPT_PLACEHOLDER                      // paste-box placeholder
CHECKINS: { after, objective, turns: Turn[] }[]      // EXTEND from 2 → 3, from check_ins[] (text/user_reply/dot_followup)
LOG_NODES: LogNode[]                                 // Scene 4 connect-the-dots — from objective[] (facts) + events[]/timeline[]
SUMMARY = { headline, timeline, stats, recommendation, report }  // → from provider_report{} + timeline[] + stat_sheet{}
// ADD: DOT.general ("hey, I'm here for you…"), DOT.checkinPlan (the when/what/why line)
```
Paste-ready user content (verbatim from `sample-story.json`): the journal (`transcript.journal`) and the two longer
replies (`check_ins[1].user_reply`, `check_ins[2].user_reply`). The 988 resources are `risk.message` verbatim.

**The test-the-outputs gate (build window MUST run this and confirm green):**
1. **Onboarding split — already verified.** `PASTE.journal` is the exact text that produced the locked
   `feeling_validation/objective/subjective/delta` in `sample-story.json`. Re-run it through `POST /api/turn` and confirm
   the live output still **validates the feeling first, never invalidates, and the delta is a neutral observation** (the
   one tone gate — Johnny eyeballs it; the only knob is `EXTRACT_PROMPT` in `extract.ts`).
2. **Check-in replies — verify grounded + in-tone.** Run `PASTE.reply2` and `PASTE.reply3` through `POST /api/turn`
   (with the simulated `now`) and confirm DOT's follow-up references the **real accumulating record** (counts/pattern,
   not invented) and stays validate-first. On `reply3`, confirm the **risk path surfaces 988** (deterministic
   `CRISIS_CUES` scan in `director.ts`/`turn.ts`) and DOT does **not** dismiss the walk-back.
3. **Story page — verify no invented data.** `GET /api/record` must return only what Scenes 2–3 + the seed wrote; the
   provider report renders S/O only; the timeline matches `timeline[]`.
4. **The one e2e gate still holds:** `pnpm --filter @dot/backend exec tsx src/test-e2e.ts` exits 0 (the split is real).

**Tone is LOCKED and signed off — do not regress it.** If a turn drifts, tune `EXTRACT_PROMPT` only; never add a
"you're fine"/"you're overreacting" branch.

---

## (5) Build plan — PARALLEL LANES (45-min crunch)

> Reuse all hard rules from `docs/GOAL.md` (no silent stubs, demo path sacred, build-to-contract, live-test every seam,
> design locked from pixel one, story copy in editable consts). Design system: `design/` — clean white + trust-blue
> `#007AFF`, iMessage-bubble warmth, visual-first, **deliberately not healthcare-looking**.

**Freeze the response contract first — every lane codes to it (no re-negotiation mid-build):**
- `POST /api/turn { userId, text, now? }` → `{ reply, story, feelingValidation, stats, report, risk }`
  — route calls `runTurn()`, then `buildStats(userId, now)` + `buildReport(story, stats)` over the store (no extra model
  call); `feelingValidation` = the validate beat from the turn; `risk` = `detectRisk(text)` (cheap substring scan).
- `GET /api/record?userId=demo` → `{ stories, events, stats }` (`getStories`/`getEvents`/`statSheet`).
- `POST /api/tts { text }` → audio (already exists in flow-proto).

**Lane 0 — UNBLOCK (serial, ~5 min, FIRST):** add `transpilePackages:['@dot/backend']` + the extensionAlias webpack
config to `flow-proto/next.config.mjs` (copy from `frontend`). Without it no route can import the backend. (§1.5 #1)

**Lane A — backend glue (~10 min, gates B/C/D):** ① align the seed — copy the 10 `events[]` from `sample-story.json`
into `seed.ts` for user `'demo'` (§1.5 #4). ② add `POST /api/turn` (per contract) + `GET /api/record` + seed-on-boot.
**Gate:** `curl /api/turn` with the journal → grounded validate-first reflection; `curl /api/record` → the 6-day record.

**Then run B · C · D · E concurrently** (E and the UI scaffolds of B/C/D can start at t=0 against the frozen contract;
B/C/D go live the moment Lane A lands). Each is a separate phase component → minimal collision.

- **Lane E — Scene 1 poke (`EnterPhase`, no backend, parallel from t=0):** wire poke interactivity to the 🔒 LOCKED
  `DOT.pokes` (4 sequential) → `DOT.pokesFun` (rotate), optional `useDotVoice().speak` on each, and the begin CTA after
  poke 4. **Gate:** the 4 sequential play in order, fun ones rotate after, CTA → `practice` (Scene 2). This page ships.
- **Lane B — Scene 2 onboarding (`PracticePhase`):** dot-grows transition + conversation surface + paste box; submit →
  `/api/turn`; render reply + reasoning traces; **cache the reflection for Scene 4**; closing + general message +
  check-in-plan beats. **Gate:** a typed answer AND a pasted journal each return a live validate-first reflection.
- **Lane C — Scene 3 check-ins (`CheckinsPhase`):** fake clock + "simulate 3h / next day"; surface the 3 scripted
  check-ins; replies → `/api/turn` with simulated `now`; render the 988 card on check-in 3 (scripted, §1.5 #2).
  **Gate:** full arc runs; the record spans the week.
- **Lane D — Scene 4 story (`LogsPhase` + `SummaryPhase`):** render from the **cached onboarding reflection** +
  `GET /api/record`; connect-the-dots (story↔facts); "see report" popup → at-a-glance O/S → provider report
  (`buildReport`, S/O only) → timeline. **Gate:** real record renders; report clean; nothing invented.

**Converge → record a backup video before freeze. Stretch (only if all gates green):** voice entry (realtime mic in
Scene 2), poke TTS everywhere, the vision stretch (§6).

---

## (6) Cuts + the one stretch

- **CUT:** Inngest Cloud (dev/in-proc only), Grok image-gen (static glass dot), SSE/WS streaming, SQLite, auth,
  human-handoff signal route. None may block the four-scene path.
- **STRETCH — image-send + vision classify (worktree, only if time):** let the user attach an image (e.g. a rash, a
  swollen toe, a medication label); run it through a vision model to classify what it shows; fold the result into the
  objective record as another `event`/objective fact. **Build in an isolated worktree so it can't destabilize the demo
  path**, behind a flag, and only after Scenes 1–4 are green. (Grok image *gen* stays cut; this is image *understanding*.)

---

## (7) Open items for Johnny

1. **Poke blurbs (Scene 1) — your words.** Approve/tune the 4–5 one-idea blurbs (draft from `STORY-FINAL.md`).
2. **The transparent check-in plan line (Scene 2 close)** — confirm the "when/what/why I'll check in" phrasing.
3. **Vision stretch (§6)** — confirm it's a real worktree stretch (only-if-time) and not core. Default: yes, stretch.
4. **(carried from ADVISEMENT-2)** rotate `XAI_API_KEY` post-event.

---
_The four scenes are the spec; the live engine (`runTurn` → one Grok call → grounded split) is the only must-be-real
core; the premade scripts guarantee the best output on stage; the same path handles any live response. Tone is locked._
