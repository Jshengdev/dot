# SCOPE-LOCK — the ONE problem, crystal I/O, no complexity. READ BEFORE BUILDING.

> Crystallized from `docs/reference/MISSION-VERBATIM.md` (Johnny, 2026-06-13). Edit any line; the whole repo points here.

## The simplicity law (non-negotiable)
- One problem. One input. One output. One linear journey with at most one loop.
- Ship > elegant. Working ugly beats broken beautiful. Every panel consumes a real endpoint/event — no invented data.
- If a feature doesn't make the one-breath demo land harder, it's CUT. "Done" = a run command + observed output. No silent stubs.

## The ONE problem (two-part, one root)
People don't get the care they need because (1) **stigma stops them from seeking it**, and (2) when they do, **they
can't explain what they're feeling well enough to be understood** — the *way* they say it makes them hard to
diagnose, so they end up self-searching for an answer. What they actually needed was something that helps them
**tell it how they feel** — and turns that into something a provider can act on.

## Crystal INPUT
`{ story }` — the person just talks/types about what's going on. Entry by **Grok Voice** (an intro chat — "getting to
know what's going on"), continuing in an **iMessage** thread. As easy as keeping a log of your condition.
*(Cached fallback: a pre-recorded synthetic session.)*

## Crystal OUTPUT
`{ report }` — **not a diagnosis: a story a provider can understand.** DOT extracts **objective + subjective** truths,
pieces them together, and reflects them back; the person **connects the dots and drafts their own report** —
the timeline + symptoms + what's objective vs. felt + recommendations and *why it needs to be this way*. Rendered as
calm **glass dots** (one per moment/thread) + a clean **pre-visit report**. Facts the person judges — never a verdict.
Typed: `{ subjective[], objective[], delta, timeline, report }`.

## Addressable conditions (one engine, four entries)
**anxiety · depression · pains & sickness · chronic illness.** The onboarding adapts the questions per area (see
`docs/reference/INTAKE-QUESTIONS.md`); the engine + output are the same. **Demo hero = anxiety** (founder-fit), built
so the others plug in.

## The journey (linear — one retry loop)
```
1. INTRO in        — Grok Voice: "tell me what's going on"            (Grok Voice realtime → live transcript)
2. ONBOARD         — simple, validated questions, conversational      (iMessage thread; Grok text)
3. TRACK / ROUTE   — the agent stays with you; director runs extract  (iMessage agent + Inngest)
4. REFLECT ← MOMENT— split objective from subjective, connect the     (grok-4.20-0309-reasoning + grok-imagine-image)
                     dots, reflect the delta as a glass dot
5. REFINE (loop)   — you react / add → it sharpens                     (one retry)
6. DRAFT → OUTPUT  — you draft your own report (recs + why) a          (Vercel surface)
                     provider can understand
```
**THE moment (step 4):** DOT shows objective facts beside the felt story and connects the dots toward the root —
gently, facts-not-verdict, validate-first. (e.g. *"your friends reached out more than you did this week — 19 times."*)

## CORE sponsors (each ON the line)
- **Grok Voice** (realtime) → step 1 (the intro). *Its own $5k prize + "xaivoice" build credits.*
- **Grok text reasoning** (`grok-4.20-0309-reasoning`) → step 4 (objective/subjective split + connect dots).
- **Grok image-gen** (`grok-imagine-image`) → step 4 (the glass dot) + the report visuals.
- **Inngest** → step 3 (durable tracking/routing + human-on-risk).
- **Vercel** (AI SDK runs the Grok calls; platform hosts/deploys) → the surface + step 6.
- *Cursor* = build velocity (off-screen).

## CUT — do NOT build
- A real **diagnosis** — DOT produces a *story/report*, never a diagnosis. Hard line (safety + APA red line).
- Real behavioral-data ingestion — the "objective log" is **synthetic seed** for the demo (the connector seam stays).
- Personal-CRM / social / "knows 50,000 people" moonshot · literal AR · any second input/output/mode · parallelism.
- Anything that doesn't make step 4 land harder.

## The success test — one breath
> **"DOT helps you tell it how you feel — turning your story into the objective truth of it, a story your provider can finally understand."**
