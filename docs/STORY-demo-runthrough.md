# STORY 1.1 — DOT demo golden-path run-through

**Status:** ready-for-dev · **Source:** `reference/SUCCESS-SCENARIO.md` + `USER-JOURNEY.md` + `SCOPE-LOCK.md` +
`reference/SKELETON-SPEC.md` + the memory-DB design notes + `KEYS.md` + `STORY-FINAL.md`.

> ### 📋 REVIEW — shaped by Claude toward "minimal, works-e2e-on-sample, the split is real."
> Lines marked **⚠️ NEEDS JOHNNY** are the only ones requiring your judgment. Everything else I've simplified toward
> guaranteed-working — overwrite anything you disagree with. **The whole bet:** one run, on a hand-authored sample
> story, where the ONLY thing that must be genuinely real is the **objective-vs-subjective split** (already proven live).

---

## Story
**As** a person who needs care but can't make themselves understood, **I want** to tell DOT my story and watch it
reflect the objective truth (vs. the story I feel) and produce a report I own, **so that** I can finally be understood —
and my provider can finally help.

> 💬 **R:** Keep. The demo is ONE run on a sample story. Only the split must be real; everything else rides on sample data.

## Acceptance criteria (BDD)
**1.** Open DOT → the glass dot morphs in, turns on, greets (or a visible fallback — no silent stub).
> 💬 **R:** Simplify — **demote voice to OPTIONAL.** The dot animation + a typed/TTS greeting is enough; don't let realtime voice block the e2e run.

**2.** User tells their story (or pastes a SYNTHETIC transcript) → on End, the story is chunked into logs.
> 💬 **R:** For the demo the input = a **hand-authored sample transcript via the paste box.** Live-voice convo is a stretch — paste/typed is the default so it always works.

**3.** Director runs → for EACH chunk, decides objective-fact vs subjective-story + delta via a **REAL Grok `generateObject` call** → `{ feeling_validation, subjective[], objective[], delta }`.
> 💬 **R:** ⭐ The ONLY must-be-real node — and it already works (we ran `generateObject` live). Runs on the sample chunks. **This IS the demo; everything else serves it.**

**4.** Risk chunk (self-harm) → pipeline pauses for a human (`waitForEvent`) + 988 handoff. (Branch present even if not triggered.)
> 💬 **R:** Keep as a **visible branch** (a "flagged → a human reviews" beat on one seeded chunk) but DON'T build live risk-detection — a one-line classify + a paused-for-human UI state. Optional for e2e; add after the core is green.

**5.** "Connect the dots" → the UI animates objective facts vs the subjective story (the catch); validate-first, never a verdict.
> 💬 **R:** The catch — it just **renders AC#3's real output.** As long as the split is real on the sample story, this animates real data. Keep; it's the payoff.

**6.** "Complete" → a provider-ready report generates **from the real extraction** (timeline · objective · subjective · "discuss X because Y" recs · what the provider looks for) — no invented data.
> 💬 **R:** Report = the real split + the sample timeline, as a simple card. Must trace to the real split (no invented data). Keep simple — template the rec or one cheap Grok call.

**7.** Any node failure → a visible FAILED state. **No silent stubs.**
> 💬 **R:** Keep — cheap, protects credibility.

**8.** Live Vercel URL; the catch fires on a real input; cached replay + web-mic fallback ready.
> 💬 **R:** For the demo, "real input" = the sample transcript → the **real split** (that's the realness). Cached replay = the same run recorded. Deploy on Vercel. (web-mic only matters if voice stays live — demoted.)

## The orchestrator pipeline (node → the decision it OWNS)
```
ingest (chunk the story) → extract (threads/graph) → classify:TWO-TRUTHS (objective vs subjective + delta) →
   → schedule (staggered check-ins over time) → finalize (provider-ready report)
        └── risk-detect runs THROUGHOUT → self-harm/red-flag → waitForEvent (pause for a human) [988 / clinician]
```
- **`classify:two-truths` is THE decision** (the message, in code) — a real Grok `generateObject`.
- **`risk-detect`** = the only decision that hands control to a human. **`schedule`** = the staggered check-ins.

> 💬 **R:** Reduce the **REQUIRED e2e path** to: **chunk the sample transcript → real two-truths split per chunk → assemble the report.** The graph / check-ins / risk-detect are **VISUAL layers on top** — build them only after the required path is green. Don't let them block the split working e2e.

## Developer context / guardrails
- **Stack:** Next.js + **Vercel AI SDK (`@ai-sdk/xai`)** + Inngest (director, add at L4) + in-proc Map → SQLite. Deploy Vercel. Build in Cursor.
- **VERIFIED Grok wiring (`KEYS.md`):** text `grok-4.20-0309-reasoning` (`generateObject`); image `grok-imagine-image`; TTS `/v1/tts` eve; realtime `wss://api.x.ai/v1/realtime` (`grok-voice-think-fast-1.1`→`grok-voice-latest`). Key `XAI_API_KEY` in `dot/.env`.
> 💬 **R:** For the core you **only NEED `grok-4.20-0309-reasoning` via `@ai-sdk/xai` `generateObject`.** Image/TTS/realtime are polish-layer only. Confirm the builder calls that model for the split; the rest can come later.

- **The proven extraction (reuse it):** `generateObject({ schema: { feeling_validation, subjective:string[], objective:string[], delta } })`. **System-prompt rules:** validate the feeling first; separate objective from subjective; state the delta as neutral observations; NEVER "you're overreacting"/"you're fine"; the person draws the conclusion.
> 💬 **R: ⚠️ NEEDS JOHNNY** — run the split on the real sample story and read the delta + validation **out loud**: does it validate the feeling and never invalidate? This is the one thing only *you* can sign off.

- **Contracts:** `Story { id,userId,transcript,subjective[],objective[],delta,timeline?,createdAt }` · `Event { …,source:'story'|'synthetic',ts }`.
- **Memory (memory-DB design notes):** `users · messages · stories · events · stat_sheet(view)`; in-proc Map → SQLite; counter-evidence = a windowed `COUNT`; ONE `Connector` (`SyntheticConnector` now).
- **File structure:** engine in `packages/backend`; sample frontend in `packages/sample`. Don't scaffold twice.
- **Build order:** `BUILDER-START.md` L0→L6, each a LIVE gate. **Discipline:** build simply, no silent stubs, demo-path-sacred.
> 💬 **R:** `Story{subjective[],objective[],delta}` is exactly what AC#5/#6 render — coherent. For sample data: hand-author one `sampleStory.json` in this shape; the **real split overwrites** subjective/objective/delta at runtime. Don't over-build the store — in-proc Map is fine for the demo.

- **Real vs faked:** REAL = the two-truths reasoning + the report generation + the pipeline/human-on-risk branch. FAKED (synthetic, say it out loud) = the transcript, the behavioral data, the check-in timing.
> 💬 **R:** Honest line for the demo: **REAL = the objective/subjective split (live Grok on the sample story).** FAKED = the story itself, the behavioral data, the check-in timing, the voice (if demoted). Say "this is a sample story; the reasoning is live" — defensible + true.

## Testing / verification (the live gates)
- [ ] two-truths split = a real Grok `generateObject`, valid typed object; **tone = validate-not-invalidate** (Johnny).
- [ ] report generated from the real extraction · staggered check-in shown · human-on-risk branch present · no silent stubs · ends on the patient's agency · live Vercel URL + cached fallback.
> 💬 **R:** The ONE gate that means "works e2e on sample": **sample transcript → real split returns valid `{subjective,objective,delta}` → UI renders it → report assembles from it.** If that runs end-to-end, the demo works. The rest are polish gates.

## Project context references
`SCOPE-LOCK.md` · `reference/SUCCESS-SCENARIO.md` · `USER-JOURNEY.md` · `reference/SKELETON-SPEC.md` ·
the memory-DB design notes · `KEYS.md` · `STORY-FINAL.md` · `DEMO-SCRIPT.md` · `reference/PROVIDER-REPORT.md`.

## Open questions
> 💬 **R:** Resolved toward simplicity: **voice = optional · input = sample transcript (paste) · risk + check-ins = visual layers, not required for e2e.** ⚠️ The only things that need **YOU**: (1) the **sample STORY content**, (2) the **tone check**, (3) is the demo subject **your own story** or a synthetic persona.

---
_Status: ready-for-dev. Shaped toward minimal-working-e2e on sample data; the split is the real core._
