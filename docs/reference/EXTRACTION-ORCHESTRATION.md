# EXTRACTION ORCHESTRATION — wired to EXACTLY what the demo renders

> **The demo is the spec.** The conversation surface renders one shape — `Reflection` (`packages/backend/src/run.ts`)
> — beat for beat (`packages/frontend/components/ThreadSurface.tsx`, `DEMO-SCRIPT.md` [1:00]). The orchestration's
> ONLY job is to produce that object as well as possible. We split the one Grok call into specialized agents
> **only where a split makes a rendered beat better.** Anything the demo doesn't render is CUT (§5). Contracts stay
> identical — `runStory()` still returns the same `Reflection`, so the frontend (L6) does not change.
>
> **Status:** designed here, demo-scoped. Implemented as the next backend workflow (task #9) once L6 lands.
> Acceptance = the demo story (`data/demo-story.md`) round-trips through the agents into a correct `Reflection`.

---

## 1. What the demo actually renders (the contract — build to THIS, nothing more)

`GET /api/run → runStory({}) → Reflection`. The surface reveals it in 7 beats. Every field is a real
Story/Event/store read — no invented data.

| Beat (ThreadSurface) | `Reflection` field | Produced by | Demo line |
|---|---|---|---|
| 1 · validate first | `feelingValidation` | **Validate agent** | "the chest tightness — that's real." |
| 2 · the story you told yourself | `story.subjective[]` | **Subjective agent** | "everyone's tired of me" · "I'm falling apart" |
| 3 · "what the record shows" (label) | — | static copy | — |
| 4 · the count-ups | `stats[]` | **`store.statSheet()`** (deterministic GROUP BY) | 48 texts · 19-vs-12 · 7 calls |
| 5 · the facts | `story.objective[]` | **Objective agent** (grounded in `stats`) | friends reached out more than you did |
| 6 · ⭐ THE DELTA (the catch) | `story.delta` | **Delta agent** (most polish) | "it shows you the gap. machines prove; you mean." |
| 7 · the provider report | `report` (SOAP S/O) | **`buildReport()`** (deterministic) | de-minimized S + counted O |
| (badge) | `model` | metadata | "real · grok-4.20…" |

**Reading of the contract:** only **four fields need a model** (`feelingValidation`, `subjective`, `objective`,
`delta`). `stats` and `report` are deterministic store reads (no agent — and they must stay that way: the report's
de-minimization power is that the numbers are *counted*, not generated). So the demo orchestration is **4 reasoning
agents + 1 safety guard + 2 deterministic reads.** That's the whole pipeline. No more.

---

## 2. The demo-scoped agent graph

```
   transcript (the seeded demo story)
        │
        ▼
  ┌──────────────────┐  ALWAYS first, high-recall, conservative
  │ SAFETY SENTINEL  │  crisis/self-harm? ── yes ─►  CRISIS MODE (§4): delta = care+routing,
  └──────────────────┘                               suppress stats+objective counter-evidence
        │ no
        ├───────────────┬───────────────┐   (parallel — independent reads of the same transcript+record)
        ▼               ▼               ▼
  ┌───────────┐  ┌───────────────┐  ┌────────────────────────┐
  │ VALIDATE  │  │ SUBJECTIVE    │  │ OBJECTIVE              │  reads store.statSheet (the 19-vs-12)
  │ → feeling │  │ → subjective[]│  │ → objective[] grounded │  so facts are COUNTED, never invented
  │  Validation│ └───────────────┘  └────────────────────────┘
  └───────────┘          └───────────────┬───────────────┘
        │                                ▼
        │                       ┌────────────────────────┐
        └──────────────────────►│ DELTA  (the catch)     │  the single most-watched line — most polish.
                                │ → story.delta          │  felt vs recorded, neutral observation, no verdict
                                └────────────────────────┘
                                         │
              store.statSheet() ─────────┤ (deterministic)
              buildReport(story,stats) ──┘ (deterministic)
                                         ▼
                                   Reflection  ── identical shape L6 already renders
```

| Agent | Fills | Model | Why split (the demo payoff) |
|---|---|---|---|
| **Safety Sentinel** | (gate) → `safety?` | reasoning, hi-recall | The crisis case (the demo story HAS arm-scratching + "sleep forever") must be caught **before** any counter-evidence is composed. One job: flag risk. §4. |
| **Validate** | `feelingValidation` | reasoning | The reflection OPENS on this (beat 1). Validate-first / body-first is the trust make-or-break; a dedicated agent nails the tone (`VOICE-AND-TONE.md` §4) instead of it being one clause in a big prompt. |
| **Subjective** | `story.subjective[]` | reasoning | The distorted self-account, in their words — short felt-claim chips. Separate so it isn't contaminated by the fact-finding. |
| **Objective** | `story.objective[]` | reasoning, **grounded in `stats`** | The facts MUST trace to the counted record (the 19-vs-12), not the model's imagination. This agent is handed `store.statSheet()` output and may only restate what's counted + what's verifiable in the transcript. |
| **Delta** | `story.delta` | reasoning | **The catch — the demo moment.** Its own agent with the full two-way-delta + voice doctrine + the "machines prove, you mean" landing. Gets the most prompt care of anything in the build. Reads subjective+objective+stats, frames the gap as a neutral observation, never a verdict. |
| `stats` | `stats[]` | — (deterministic) | `store.statSheet()` GROUP BY. Counted, not generated — that's the point. |
| `report` | `report` | — (deterministic) | `buildReport(story, stats)` — S = subjective, O = objective + dated counts. SOAP S/O only. |

The director here is thin (the demo is one linear run): **safety → {validate ∥ subjective ∥ objective} → delta →
assemble.** No routing brain needed for a single demo turn — `runStory()` orchestrates inline. (A full router agent
is post-demo, §5.)

---

## 3. Model routing (verified slugs — `docs/KEYS.md`)

| Agent | Model | Resolve via |
|---|---|---|
| Safety Sentinel | `grok-4.20-0309-reasoning` | `resolveModel('safety','DOT_SAFETY_MODEL',…)` |
| Validate · Subjective · Objective · Delta | `grok-4.20-0309-reasoning` | per-agent env override |
| (post-demo) director/router | `grok-4.20-multi-agent-0309` | — |
| glass-dot image | `grok-imagine-image` | post-finalize |
| voice in / TTS out (L5) | `grok-voice-think-fast-1.1` / `/v1/tts` `eve` | — |

For the demo all four reasoning agents use the verified reasoning slug; the win is **specialization** (four focused
prompts > one mushy prompt), not four different models. Each model env-overridable, none hard-coded (the `grok.ts`
resolver pattern). A faster slug for Safety is a post-demo optimization — confirm before swapping.

---

## 4. Crisis ON the demo path (the elegant part — no new UI required)

The demo story (`data/demo-story.md`) contains real risk signals (arm-scratching, "sleep forever"). The Safety
Sentinel runs first. **The contract already absorbs the crisis case through the SAME `Reflection` shape:**

- **`risk=true` → CRISIS MODE:** the **Delta agent runs in crisis-mode** — `story.delta` becomes the care +
  route-to-human line (`VOICE-AND-TONE.md` §6 / `HIGH-ROI-QUESTIONS.md` §3c), **not** a counter-evidence delta.
  The Reflection still renders; only the delta's *content* changes.
- **Suppress the counter-evidence beats.** On a crisis run, the surface must NOT count-up the 19-vs-12 / show the
  objective "friends reached out" chips — you do not counter-evidence "I want to sleep forever." So a crisis run
  returns empty/withheld `stats` + `objective` (or the frontend skips beats 4–5 when `safety.flagged`). This is the
  **one small UI conditional** the crisis path needs — a crisis variant: validate → care+routing, skip the
  counter-evidence. `feelingValidation` + the de-minimized provider record still render.
- **Additive contract field (optional → L6-safe):** `Reflection.safety?: { flagged, signals[], routedToHuman }`.
  The current surface ignores it (compiles); a crisis-variant render reads it.

> **⚖️ Demo-design decision for Johnny (pick one — affects what we wire on screen):**
> 1. **Clean catch on a NON-crisis story** (e.g. the social-spiral entry): renders all 7 beats, catch = the
>    **catastrophe** delta (you said "there's a wall" → you hung out 5×). Safety/human-on-risk shown as a separate
>    deliberate beat or in Q&A (the Inngest pause — judges love it). **Lowest risk, cleanest reveal. (Recommended.)**
> 2. **Crisis story drives the on-screen catch** (the panic/arm-scratching entry): needs the crisis-variant UI
>    (validate + routing, suppressed counter-evidence) + the **minimization** delta framing + the de-minimized
>    provider report as the payoff. More powerful, more to build/verify.
> The orchestration produces the right `Reflection` for either; only the on-screen handling differs. **Which story
> drives the live catch, and does the human-on-risk pause render on screen or stay a Q&A beat?**

---

## 5. CUT for the demo (do NOT build now — the surface doesn't render them)

Per SCOPE-LOCK simplicity + "the demo is the spec," these from the general design are **post-demo extensions**, not
demo work:

- **Check-in Generator** — the demo flow has no check-in beat (it's a one-shot reflection, not a multi-turn
  intake). The whole `HIGH-ROI-QUESTIONS.md` question set is **post-demo / the continuous-use loop (L5+ chat)**, not
  the 3-minute reflection. KEEP the research; don't wire the agent for the demo.
- **Clinical Shaper (OLDCARTS / invisible instruments / provenance tags)** — the demo's `report` is already a clean
  deterministic SOAP S/O (`buildReport`). It does NOT render OLDCARTS slots or instrument items. So no Clinical
  Shaper agent for the demo — `buildReport` stays deterministic.
- **The router/director brain** (`grok-4.20-multi-agent`) — overkill for one linear demo turn; `runStory`
  orchestrates inline. Post-demo, when there are real multi-turn routes.
- **RRF / embeddings / decay**, a **second connector**, **multi-turn memory wiring into the call**, the **refine
  step as a real wider-window re-query** — all post-demo (`OPEN-QUESTIONS.md`).

The win of keeping it to 4 agents: each is live-testable on the demo story, the catch agent gets all the polish, and
there's nothing on stage that isn't rendered.

---

## 6. Implementation (additive — the frontend never changes)

`runStory()` becomes the orchestration internally; the returned `Reflection` is **byte-for-byte the same shape**.
Build agent-by-agent, live-testing each against the demo story (no silent stub):

1. Split `extract.ts` into the four agent calls (validate · subjective · objective-grounded · delta), each its own
   editable prompt const + one Zod boundary. Run validate ∥ subjective ∥ objective with `Promise.all`; then delta.
2. Add the **Safety Sentinel** as the first call; on `risk=true`, route the Delta agent to crisis-mode + set
   `safety` + withhold counter-evidence.
3. Keep the **single-call path** as an env-gated fallback (`DOT_PIPELINE=single` → today's one `extractStory`
   call) so `main` stays demoable while the multi-agent path is wired (rails: no silent stub, main always demoable).
4. `buildStats` + `buildReport` unchanged (deterministic). `buildReflection` unchanged.
5. On the L4 Inngest director, each agent is a `step.run` (the watchable node graph); `reflect:delta` stays THE
   moment, now fed by the dedicated Delta agent.

**Gate (the acceptance test):** run the orchestration on the demo story; the resulting `Reflection` must satisfy
`data/demo-story.md`'s criteria — validate-first present; subjective = the distorted account; objective grounded in
the counted `stats`; delta = the correct (catastrophe or minimization) framing as a neutral observation; on the
crisis story, safety flags + delta is care+routing + counter-evidence withheld. Live pipeline output in the real
`Reflection` format — never hand-faked. Each agent live-tested as it's wired; the full gate is the demo story →
correct `Reflection` end-to-end, rendered on the surface (Playwright).
