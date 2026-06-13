# SUCCESS-SCENARIO — the golden-path demo run-through (story → code → orchestrator decisions)

> The bridge from the story to the build: the ONE successful demo run, each beat mapped to the message it lands and
> the orchestrator node + decision responsible for it. Pairs with `USER-JOURNEY.md`, `SCOPE-LOCK.md`, `STORY-FINAL.md`.
> Formalize with [CS] `bmad-create-story` (the scenario) + [CA] `bmad-create-architecture` (the pipeline).

## What "successful" means (the acceptance bar)
A run succeeds when, across the e2e flow, **each beat lands its message** AND the **hero moment — the two-truths
split — fires on a REAL Grok reasoning call**, the **report generates from that real output** (no invented data, no
silent stubs), the run **visibly shows the staggered check-ins + the human-on-risk branch**, and it **ends on the
patient's agency** (you walk in seen). The judge leaves believing it's real because they watched it *reason live*.

## The golden path — experience → message → who decides
| # | Experience (what the judge sees) | The message it lands | Orchestrator node + the decision it OWNS | Real / faked |
|---|---|---|---|---|
| 1 | Glass dot morphs in, turns on, "hi, this is DOT" (voice) | warm, human, low-stakes — not a clinical app | — (frontend + Grok Voice) · no decision | voice real / sim |
| 2 | You talk; DOT asks simple questions, "gets" you (2–3 turns) | you can just speak, normally — tell it how you feel | **converse** node: decides *what to ask next* to draw out the holistic story | Grok (or scripted) |
| 3 | Paste full transcript → End | it captures the whole story | **ingest** node: decides *how to chunk* the story into logs | transcript synthetic |
| 4 | "I'll check in on iMessage" → simulate time → check-ins | the truth is built over time, not one exaggerated moment | **director (Inngest)**: decides *when to check in + what's still missing* (+ risk scan) | timing hardcoded |
| 5 | Logs page: the yap node branches into ideas (knowledge graph) | your story is rich + connected — DOT sees the whole web | **extract** node: decides *the distinct ideas/threads* in the story | Grok on synthetic |
| 6 | **Connect the dots** — each chunk splits: objective facts vs the subjective story; dots connect | **the two truths** — the story you feel vs. what actually happened — the catch | **classify / reflect** node: decides *for each thing you said, is it an objective fact (provider-bound) or the subjective story* + the delta; validate-first, never a verdict | **REAL Grok** (proved live) ⭐ |
| 7 | Complete → summary: timeline card + stat cards + provider rec | you draft your own report — a story your provider can finally understand; you own it | **finalize** node: decides *what goes in the provider-ready summary + what the provider should look for* | Grok on synthetic |

## The orchestrator pipeline (the director — who decides what)
```
ingest (chunk the story) → extract (the threads/graph) → classify:TWO-TRUTHS (objective vs subjective + delta) →
   → schedule (staggered check-ins over time) → finalize (the provider-ready report)
        └── risk-detect runs THROUGHOUT → self-harm/red-flag → waitForEvent (pause for a human) [Legion's human-on-risk]
```
- **The decision that IS the message, in code: `classify:two-truths`** — objective fact vs subjective story, per chunk.
  Everything else serves it. (We proved it: a real `generateObject` returns `{ subjective, objective, delta }`.)
- **risk-detect** is the safety spine — it's the one decision that can hand control to a human (the 988 / clinician handoff).
- **schedule** is the staggered-check-in mechanism — the decision *"sample over time so the truth isn't one moment."*

## Acceptance criteria (a successful run requires — the checklist the build is done against)
- [ ] The two-truths split = a **real Grok `generateObject` call**, valid `{subjective, objective, delta}`, tone = **validate-not-invalidate** (Johnny eyeballs it — the one thing the model can't self-certify).
- [ ] The **report is generated from that real extraction** — no invented data on screen.
- [ ] The **staggered check-in** is visibly demonstrated (simulated timing is fine).
- [ ] The **human-on-risk branch exists** in the pipeline (even if not triggered in the happy path).
- [ ] **No silent stubs** — any failure renders a visible FAILED state.
- [ ] The run **ends on the patient's agency** (the report they own → "walk in already seen").
- [ ] It runs on a **live Vercel URL**, and the catch fires on a **real input** (cached replay + web-mic fallback ready).

## Real vs faked (the honesty line for Q&A)
**Real:** the two-truths reasoning (live Grok), the report generation, the pipeline + the human-on-risk branch.
**Faked for the demo (say it out loud):** the behavioral data / the transcript / the check-in timing are synthetic
(PHI rule). The seam is real; the live feeds are the next layer.
