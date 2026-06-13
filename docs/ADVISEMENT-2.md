# ADVISEMENT ITERATION 2 — the single build spec for DOT

> **This is the one doc the build window reads.** It supersedes the scattered references for the demo build. It is verified against the live source on disk (2026-06-13): `packages/backend/src/{grok,extract,run,director,types}.ts`, `docs/sample-story.json`, `docs/KEYS.md`. Where two earlier docs disagreed, this doc picks the **simpler option that already works on the sample** and notes the call inline (`▸ CALL:`).
>
> **ANXIETY IS LOCKED as the demo hero.** Do not re-open it.

---

## (0) TL;DR — what to build

Build the **anxiety hero** end-to-end on the enriched sample story (`docs/sample-story.json`, `id: "anxiety-hero"`): a person privately journals daily panic attacks, severe chest pain, arm-scratching, and "I want to sleep forever," but out loud says "I'm just a nervous person, lowkey chilling." DOT runs the told story through one live Grok reasoning call that produces the **two-truths split** — `feeling_validation` (validate first), `objective[]` (what happened), `subjective[]` (the story being told), and `delta` (the neutral gap, never a verdict) — then assembles a provider-ready S/O report from it, with a human-on-risk branch that surfaces 988 when a self-harm/ideation cue fires. **The two-truths split is the ONLY must-be-real core**: it is a single `generateObject` call against `grok-4.20-0309-reasoning`, grounded in a seeded objective record, fail-loud, no canned fallback. Everything else — the transcript, the behavioral events, the check-in timing, the glass-dot image, and voice entry — is a labeled synthetic seed or optional polish. Say it out loud in Q&A: **"This is a sample story; the reasoning is live."** Build it simply: get `test-e2e.ts` green first (the one live gate), then layer the UI on the proven shape. Do not add Postgres, embeddings, RRF, decay, or a second LLM call. Satisfice everything that isn't the split.

---

## (1) The locked hero + the enriched sample

**Hero file:** `/Users/johnnysheng/code/dot/docs/sample-story.json` — `id: "anxiety-hero"`, `kind: "mental health / anxiety / panic — LOCKED DEMO HERO"`, `userId: "demo"`.

**What is REAL in the sample (preserved verbatim from a live `grok-4.20-0309-reasoning` call):** `feeling_validation`, `objective` (4 items), `subjective` (3 items), `delta`, `risk` (`{flag:true, why, message}`), `provider_summary`. These replay exactly; a live re-run produces the same shape.

**What is a labeled SYNTHETIC seed** (so the UI has data to render): `events[]` (10), `timeline[]` (6: Mon 6/8 → Sat 6/13), `check_ins[]` (3 staggered iMessages), `grounding{}` (GAD-7 metadata), `provider_report{}`, `stat_sheet{}`.

The hero run demonstrates, end to end:

1. **The split (the core "two truths" mechanism).** Same week, two ways. Private journal: daily panic attacks, severe chest pain, blurred vision, arm-scratching, "sleep forever." Said out loud: "just a nervous person," "chest hurts a bit," "lowkey chilling." `delta` names the gap neutrally — felt vs. recorded — never a verdict. This is the spine; everything else serves it.
2. **The over-time pattern.** `events[]` + `timeline[]` render the connect-the-dots arc: a panic attack after every club event for 6 straight days (severity 8–9/10, peaking Thu 6/11), two arm-scratching self-harm events (Wed/Fri), two sub-6h restless nights, the "sleep forever" signal on 6/13. The pattern accumulates while the user keeps minimizing in the moment.
3. **"Truth built over time" — staggered check-ins.** `check_ins[]` (3 dated iMessages, each with the user's reply + DOT's follow-up): (1) Tue night, mirrors the user's "nervous person" framing without correcting it; (2) Thu night, gently names the arm-scratching ("that takes a lot"); (3) Sat morning, the risk catch. Truth emerges across days, not one entry.
4. **The risk catch → 988 handoff.** `risk.flag: true` (verbatim Grok). Check-in 3 fires off "sleep forever": DOT surfaces 988 (call/text) + Crisis Text Line (HOME to 741741), without alarm, without diagnosing, without dismissing the walk-back ("didn't mean it like THAT"). Resource set matches `risk.message` exactly.
5. **Light GAD-7 grounding (metadata, never a clinical verdict).** `grounding{}` maps the user's own words to GAD-7 items 1, 2, 4, 5, 7 + the shared impairment item, each tagged `provenance: conversational→instrument:GAD-7#N`. Hard guardrails baked in: `display_to_user: false`, `computed_total: null`, explicit `_note` that no score/cutoff is shown to the user. A `safety_cross_reference` ties ideation/self-harm to PHQ-9 item 9 → escalation, never scored.
6. **Clean provider-report block.** `provider_report{}` (per `docs/reference/PROVIDER-REPORT.md`): single-page, <60s read, most-important-first — provenance header ("patient-generated · not a medical record · not a diagnosis"), top `safety_banner`, `chief_concern` in the patient's voice, OLDCARTS-shaped `whats_been_happening`, counted `objective_record`, `noticed_or_tried`, `would_like_to_discuss` ("I'd like to discuss X, because Y"), `most_worried_about`. **DOT authors S and O only** — Assessment and Plan are the clinician's columns. This is the guardrail line DOT must not cross.

---

## (2) Verified Grok wiring + the proven call

**Source of truth:** `docs/KEYS.md` §"Grok wiring — VERIFIED LIVE against this account (2026-06-13)". Base URL `https://api.x.ai/v1` · Auth `Bearer $XAI_API_KEY` · `XAI_API_KEY` lives in `dot/.env` (✅ present + verified live, loaded by `grok.ts`'s tiny `.env` reader — no `dotenv` dep).

### Models / endpoints

| Capability | Endpoint / model | Transport | Live status |
|---|---|---|---|
| **Text reasoning** (the split) — REQUIRED | `grok-4.20-0309-reasoning` | `@ai-sdk/xai` → `generateObject({ schema })` | ✅ model in list; **e2e `generateObject` round-trip proven green** via `test-e2e.ts` (see §4) |
| TTS (DOT speaks back) — optional | `POST /v1/tts` `{ text, voice_id:"eve", language:"en" }` → mp3 | REST | ✅ tested: 200, audio/mpeg 24kHz |
| Realtime voice (voice entry) — optional | `wss://api.x.ai/v1/realtime?model=grok-voice-think-fast-1.1` (server resolves → `grok-voice-latest`) | WSS, Bearer `$XAI_API_KEY`, OpenAI-Realtime-compatible | ✅ handshake verified; `session.created` returns |
| Image-gen (glass-dot render) — optional | `grok-imagine-image` | xAI image API | ⚠️ in model list only; **NOT tested live** |

Realtime notes: default voice `ara`, modalities `["audio"]`; at the voice layer send `session.update` to set `voice="eve"` + enable `input_audio_transcription` for the live transcript. **No standalone STT** (`/v1/audio/transcriptions` → 404) — speech→text happens inside the realtime session.

### The PROVEN extraction call (copy-pasteable, verified against `extract.ts`)

The model is resolved once in `grok.ts` (env-overridable via `DOT_REASONING_MODEL`; throws at import if `XAI_API_KEY` missing — never an unauthenticated client). The one call:

```ts
import { generateObject } from 'ai';
import { reasoningModel } from './grok.js'; // = xai('grok-4.20-0309-reasoning')

export const ExtractResultSchema = z.object({
  feeling_validation: z.string(), // validate the feeling FIRST (esp. physical symptoms)
  subjective: z.array(z.string()), // what they FELT / interpreted — one discrete claim per item
  objective:  z.array(z.string()), // what verifiably HAPPENED — grounded in transcript + RECORD FACTS
  delta:      z.string(),          // the neutral gap ("you feel X; the record shows Y") — NEVER a verdict
});

const { object } = await generateObject({
  model: reasoningModel,
  schema: ExtractResultSchema,
  system: EXTRACT_PROMPT,                 // the doctrine prompt (below)
  prompt: `RECORD FACTS (...real seeded counts...)\n\nTHE PERSON'S STORY:\n"${transcript}"\n\nValidate first, split objective from subjective, reflect the delta.`,
});
```

> **▸ CALL (resolves grok-section vs. code contradiction): the LIVE Grok call returns the 4-field split ONLY — `{feeling_validation, subjective[], objective[], delta}`.** The richer schema floated in earlier advisement (with `risk{}`, `recommendation{}`, `provider_summary`) is **NOT** one Grok call. In the real code: `risk` is a **deterministic crisis-cue scan** in `director.ts` (`CRISIS_CUES`, no second LLM call), and `provider_summary` / the report are **assembled downstream** in `run.ts` (`buildReport`). The `sample-story.json` `risk` and `provider_summary` fields are **pre-rendered seed values for the UI**, not outputs of the live split. Build the 4-field call; do not try to make Grok emit risk/report in one shot. (Simpler, already-green, and it keeps the safety path deterministic.)

> **▸ CALL (resolves arch Flag 2 — string vs array): `subjective`/`objective` are `string[]`, NOT plain strings.** The live `ExtractResultSchema`, `StorySchema`, and the enriched sample all use arrays. `SKELETON-SPEC §8`'s single-string variant is stale; `types.ts` is the authoritative shape and says so explicitly. Arrays win.

### System-prompt doctrine (lives in `EXTRACT_PROMPT`, `extract.ts` — edit there to tune tone)

- **Validate-first.** Lead with `feeling_validation` before any analysis. Name physical symptoms as real ("the chest tightness is real"). Never minimize, never "everyone feels this," never "it's normal."
- **objective vs subjective.** `objective` = what verifiably happened (grounded in transcript + the injected RECORD FACTS; never invent counts). `subjective` = the story / how it's framed or downplayed.
- **delta is a NEUTRAL OBSERVATION, never a verdict.** Names the gap only. Never "you're overreacting" / "you're fine" / "your anxiety is lying."
- **No diagnosis, no clinical language.** DOT is a reflection tool, not a clinician.
- **Crisis → human handoff.** On any self-harm/crisis cue, the delta gently points toward a person who can help; DOT does not try to handle it itself. The 988 handoff lives on the risk branch (§3), keyed off the deterministic cue scan.

### ⚠️ Flags carried forward (transport vs. application)

- **`grok-imagine-image` (glass-dot)** — in model list, **not** tested live. Treat image-gen as optional polish; gate it; do not block the demo on it.
- **Voice (realtime + TTS)** — handshake/200 proven, but full voice entry carries open `⚑ NEEDS FROM JOHNNY` items. Optional surface; gate it.
- **Post-event:** `XAI_API_KEY` was shared in plaintext — **rotate it on the xAI console after the event** (KEYS.md).

---

## (3) Architecture — orchestrator pipeline + contracts + memory

**Verdict: coherent and buildable; the load-bearing flags are resolved above.** The spine is identical across all source docs and the live code: two-truths split as the hero, `{subjective[], objective[], delta}` as the contract, `events`-table-as-objective-record as the memory mechanism, in-proc `Map` → SQLite, human-on-risk pause, fail-loud.

### The node → decision map (canonical runtime pipeline — `director.ts` §6)

> **▸ CALL (resolves arch Flag 1 — node vocabulary): use the RUNTIME node names** `extract → classify → reflect → refine → finalize`, the ones the live `director.ts` already emits on the `DotEvent` stream. The demo-facing `ingest / schedule` labels from `SUCCESS-SCENARIO` map onto these; don't introduce a third vocabulary.

```
extract ──→ classify ──→ reflect ──→ (≤1 refine) ──→ finalize
(the ONE   (event vs      (the DELTA   (optional, can    (provider
 Grok call) interpretation  = THE       be cut)           report S/O)
 ⭐REAL)     + risk flag)    catch ⭐)

         classify.risk === true
                  │  self-harm / PHQ-9 item-9 cue
                  ▼
        step.waitForSignal('await-human-clearance')   [pauses; resumes on per-run clear → 988 handoff]
```

| runtime node | input | output | decision it owns | real / faked |
|---|---|---|---|---|
| `extract` | `{ transcript, userId }` | `{ feeling_validation, subjective[], objective[], delta }` + persisted `Story` | the fact/feeling split + the delta; validate-first | **REAL Grok** ⭐ |
| `classify` | the extracted items + raw transcript | `{ items: ClassifiedItem[], risk: boolean }` | per item: `event` vs `interpretation`; **risk via deterministic `CRISIS_CUES` scan** (no LLM) | logic real; deterministic |
| (risk branch) | `{ risk:true }` | pauses; resumes on per-run signal | the one decision that can hand control to a human (988) | branch present |
| `reflect` | the Story | `{ delta }` streamed as `reflect:delta` | surface the delta as the demo moment | REAL (reuses extract) |
| `refine` | the Story | refined Story (≤1 loop) | optional tighten | **CUT CANDIDATE** (see below) |
| `finalize` | the Story + stats | `ReportSO` (S/O only) | what goes in the provider summary | assembled from real split |

The hero moment is `reflect:delta` — `"you feel X; the record shows Y"` as a neutral gap. The `reflect:delta` `DotEvent` carries the full grounded `Story` and **is** the demo-moment event the frontend renders.

### The typed contracts (authoritative = `packages/backend/src/types.ts`)

```ts
interface Story {
  id: string;
  userId: string;
  transcript: string;        // the raw told story
  subjective: string[];      // what they FELT / claimed
  objective: string[];       // what verifiably HAPPENED (extracted facts)
  delta: string;             // the neutral gap
  timeline?: string[];       // ordered moments, if reconstructed
  createdAt: string;         // ISO
}

interface Event {
  id: string; userId: string;
  kind: string;              // OPEN vocab, NO sql enum ('panic_attack' | 'self_harm' | 'message_received' | …)
  label?: string;
  value?: number | string;
  source: 'story' | 'synthetic'; // the connector registry; 'story' = DOT-extracted, 'synthetic' = seeded
  ts: string;                // ISO
}

const ExtractResultSchema = z.object({   // the ONE Grok boundary (extract.ts)
  feeling_validation: z.string(),
  subjective: z.array(z.string()),
  objective:  z.array(z.string()),
  delta:      z.string(),
});

interface ClassifiedItem { text: string; type: 'event' | 'interpretation'; }
interface ClassifyResult  { items: ClassifiedItem[]; risk: boolean; }

interface DotRun {
  id: string; userId: string; transcript: string;
  extract?:  { subjective: string[]; objective: string[] };
  classify?: ClassifyResult;
  reflect?:  { delta: string };
  story?:    Story;
  status: 'running' | 'awaiting-human' | 'done' | 'failed';
}

type DotEvent =
  | { type: 'node:start';        node: string; runId: string }
  | { type: 'node:done';         node: string; runId: string; data: unknown }
  | { type: 'reflect:delta';     runId: string; story: Story }   // ← THE demo-moment event
  | { type: 'run:awaiting-human'; runId: string }
  | { type: 'run:failed';        runId: string; node: string; error: string };
```

The L6 render payload (`run.ts`) wraps the Story for the UI:
```ts
interface Reflection {
  story: Story;
  feelingValidation: string;          // validate-first line
  stats: StatAggregate[];             // GROUP BY over events (counter-evidence)
  report: { header; preparedFor; date; subjective: string[]; objective: string[] }; // SOAP S/O ONLY
  model: string;                      // surfaced so the UI names the real engine — no faked provenance
}
```

### The memory schema (`store.ts`, in-proc `Map` → SQLite)

```
users        { id PK, name, created_at }                          -- one row; demo is single-user
messages     { id, user_id, role('user'|'dot'), content, ts }     -- raw conversation/story input
stories      { id, user_id, transcript, subjective, objective,    -- one row per told story = a glass dot
               delta, created_at }                                --   subjective/objective stored as JSON arrays
events       { id, user_id, kind, label, value, source, ts }      -- accumulating OBJECTIVE record + synthetic
stat_sheet   = derived GROUP BY over events (kind → count)         -- NOT a stored table; a function
```

- `events` is load-bearing: `kind` is **open vocabulary, no SQL enum** (the chokepoint for "add a connector later"). `source` is the registry (`'story'` | `'synthetic'`).
- Reflect grounding = a flat windowed read over `events` (e.g. `count(*) WHERE kind=... AND ts > now()-7d`). No RRF, no embeddings, no decay.
- `provider_summary` is a **function** (`buildReport`), not a table.
- Store path: in-proc `Map` → SQLite (`better-sqlite3`). Postgres/Neon explicitly cut.

### Cut / monitor

- **`refine` (≤1 loop): CUT for the hero slice.** `extract → classify → reflect → finalize` over SQLite + the synthetic seed is the whole catch. Add `refine` only if there's time.
- **voice + glass-dot image-gen + durable Inngest Cloud: entry-surface polish, GATE them.** They carry unresolved `⚑` items; an unresolved voice slug must never block the demo path. Dev Inngest is keyless and works; Cloud keys are optional.

---

## (4) The e2e golden path + BDD acceptance + the ONE live gate

**Verdict: BUILDABLE and PROVEN.** The minimal e2e path runs live on the hero sample today — `test-e2e.ts` exits 0, all gates green, against real `grok-4.20-0309-reasoning` (key present + verified; backend `tsc --noEmit` clean).

### The minimal required spine (what MUST work)

```
chunk the sample transcript → REAL two-truths split → render objective-vs-subjective → assemble the report card
   (turns / ingest)            (grok-4.20-0309-reasoning,    (the connect-the-dots catch)    (timeline · S/O · recs)
                                generateObject, Zod schema)
        └─ risk → human branch PRESENT (waitForSignal pause + 988 handoff), even if the happy path never triggers it
```

Each node is real code on disk:
- **Split (the one must-be-real node):** `packages/backend/src/extract.ts` — `generateObject` returning typed `{feeling_validation, subjective[], objective[], delta}`. Throws on model/parse error — no canned fallback. Grounded in seeded counter-evidence before the call.
- **Model wiring:** `packages/backend/src/grok.ts` — `@ai-sdk/xai` → `grok-4.20-0309-reasoning`; throws at import if `XAI_API_KEY` missing.
- **Report assembly:** `packages/backend/src/run.ts` — `runStory()` shapes the real split + GROUP-BY stat aggregates into a SOAP S/O report; never authors A/P; surfaces `model`.
- **Risk → human branch:** `packages/backend/src/director.ts` — deterministic `CRISIS_CUES` scan sets `risk`; `step.waitForSignal` durably pauses; timeout fails loud (never proceeds past an un-cleared crisis flag).
- **Live harness:** `packages/backend/src/test-e2e.ts` (the runnable gate).
- **Sample:** `docs/sample-story.json` — real prior model output in the `Story{subjective[],objective[],delta}` shape; `events[]`/`timeline[]` are the labeled synthetic seed.

### BDD acceptance criteria

- **GIVEN** the seeded demo user + sample transcript, **WHEN** chunked into turns, **THEN** each chunk routes + persists with no silent drop.
- **GIVEN** a chunk, **WHEN** the director runs, **THEN** a single live `grok-4.20-0309-reasoning` `generateObject` returns valid typed `{feeling_validation, subjective[], objective[], delta}`, with tone that **validates the feeling first and never invalidates** (Johnny eyeballs this — the one human sign-off).
- **GIVEN** a self-harm/risk chunk, **WHEN** classify's cue scan flags it, **THEN** the pipeline emits `run:awaiting-human` and pauses for a human (988 handoff) — branch present even when the happy path doesn't trigger it.
- **GIVEN** the real split, **WHEN** "connect the dots" renders, **THEN** the UI animates objective facts vs the subjective story from the real output (validate-first, never a verdict).
- **GIVEN** the real extraction, **WHEN** "Complete" fires, **THEN** a provider-ready report (timeline · objective · subjective · recs) assembles with **no invented data**.
- **GIVEN** any node failure, **WHEN** it errors, **THEN** a visible FAILED state renders — **no silent stubs**.

### The ONE live verification gate (= "works e2e on sample")

**Sample transcript → real Grok `generateObject` returns valid `{subjective[], objective[], delta}` → UI renders the split → report assembles from it.**

Operationally:
```
pnpm --filter @dot/backend exec tsx src/test-e2e.ts
```
Must exit 0 with all gates green: **chat varied · reflection grounded in the record · provider report built (S + O).** Confirmed passing live — `feelingValidation` validated chest tightness without minimizing, `delta` surfaced real counter-evidence, report built S 3 · O 13. **If this runs, the demo works; everything else is polish.**

---

## (5) Real vs faked — the honesty line for Q&A

**REAL:** the objective/subjective split (live Grok reasoning on the sample story), the report generated from that real extraction, the pipeline, and the human-on-risk branch.

**FAKED (say it out loud):** the story/transcript itself, the behavioral events, the check-in timing, the GAD-7 grounding metadata, the glass-dot image, and voice (optional) are synthetic — PHI rule.

Say it plainly: **"This is a sample story; the reasoning is live."** Defensible and true — the seam (the two-truths catch) is real; the live feeds are the next layer.

---

## (6) Build order + discipline

1. **Gate first.** Get `pnpm --filter @dot/backend exec tsx src/test-e2e.ts` green (§4). That proves the only must-be-real core. Do not touch UI until this is green.
2. **Render the proven shape.** Build the connect-the-dots UI off the `Reflection`/`Story` shape and `docs/sample-story.json`. The `reflect:delta` event is the demo moment.
3. **Wire the risk branch visibly.** Deterministic cue scan → `run:awaiting-human` → 988 handoff card (resources verbatim from `risk.message`).
4. **Assemble the provider report** (S/O only; never A/P) from the real split + stat aggregates.
5. **Then, and only if time:** glass-dot image-gen, voice entry, durable Inngest Cloud, the `refine` loop. All gated behind their `⚑` resolution.

**Discipline (locked):**
- **Simple.** No Postgres, embeddings, RRF, decay, or second LLM call. In-proc `Map` → SQLite. One Grok call per story.
- **No silent stubs.** Every failure throws and renders a visible FAILED badge. Dev mocks gated behind `MOCK_*` env. A row that saves but vanishes on re-read is a LARP failure — re-read to prove the roundtrip.
- **Demo-path sacred.** Nothing optional (voice/image/Cloud) may block the `extract → classify → reflect → finalize` spine.
- **Satisfice.** Everything that isn't the two-truths split is good-enough-and-move-on.

---

## (7) Locked messaging / copy

### The OPENING (Johnny's voice — verbatim, `STORY-FINAL.md` lines 70–94)

> About six months ago, I cold-called strangers — to find their pain, and pitch a solution. People as young as 20, as old as 50.
>
> I expected to hear that they wanted easier medication reminders. To stop missing appointments. Translators on demand.
>
> But instead, they were all afraid. And they all wanted the same thing.
>
> To feel normal again.
>
> Then I started seeing it everywhere. Friends. People close to me. Who I knew wanted to feel normal — through their anxiety, their depression. Trying to know what was causing the white hairs. Was it that they barely slept? They had all these symptoms they couldn't explain. Maybe all their energy went into just looking normal enough to not be labeled as "something wrong."
>
> Because there are always two truths. The story you feel — and what actually happened, the part a doctor can actually help with.
>
> But when your story goes unheard, when the system fails you and sends you off without understanding you — you turn to ChatGPT. And like all medical advice, it can lead you astray. Because AI is designed to agree with you. To make you feel better.
>
> That's why I built DOT.
>
> **[ Tell it how you feel. ]**

The opening ends here. The demo flow continues the story — each step (the catch, the check-ins, connect-the-dots, the report) carries the next beat.

### North-star "two truths" line

> **There are always two truths: the story you feel, and what actually happened — which is all a doctor can diagnose.**

### Tagline

> **Tell it how you feel.**

### The advocacy-knowledge sharpening (women's-health / IUD story)

> **You can only advocate for what you know to ask for.** She got the IUD because her mom told her — most people don't have that person. **DOT is that person for everyone:** the objective record *plus* the knowledge of what to bring up, stigma-free. (Patient agency = the power to advocate, democratized.)

Source files: `docs/reference/STORY-FINAL.md` (opening 70–94; north-star 7; tagline 94), `docs/reference/DECK-STORY.md`, `docs/reference/CONCEPT-MAP.md`, `docs/samples/README.md` (advocacy lines 19–22).

---

## (8) OPEN ITEMS FOR JOHNNY — the human calls only he can make

1. **Tone sign-off (the one human gate in §4 AC#2).** Eyeball the live `feeling_validation` + `delta` from a `test-e2e.ts` run. Does it validate the feeling first and never invalidate ("you're overreacting" / "you're fine" / "your anxiety is lying")? If it drifts, tune `EXTRACT_PROMPT` in `extract.ts` — that's the only knob. **This is the single content sign-off that can't be automated.**
2. **The demo subject (PHI).** Confirm the hero transcript shipped in `docs/sample-story.json` / `test-e2e.ts` is the one to show on stage, and that it's de-identified / sample-only (the "this is a sample story" line depends on it). If a different journal should be the hero, say so now — anxiety stays locked as the *category*, but the exact words are yours to confirm.
3. **Unconfirmed optional flags — confirm or explicitly cut:**
   - **Voice entry** (realtime WS) carries open `⚑ NEEDS FROM JOHNNY` items. Cut for the hero, or commit to wiring it as optional?
   - **Glass-dot image-gen** (`grok-imagine-image`) is in the model list but **never tested live**. Confirm whether to spend a slot proving it, or render a static dot.
   - **iMessage + Inngest Cloud keys** — `IMESSAGE_*` present in `dot/.env`; `INNGEST_*` Cloud keys are `⏳ needed` (dev server is keyless and works). Confirm if the live demo needs Cloud or stays on the dev server.
4. **Post-event:** rotate `XAI_API_KEY` on the xAI console (it was shared in plaintext — KEYS.md).
