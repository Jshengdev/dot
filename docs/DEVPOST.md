# DOT — Tell it how you feel.

> **There are always two truths: the story you feel, and what actually happened — which is all a doctor can diagnose.**

DOT is the honest mirror that holds both. You tell it how you feel — by voice or text, like texting a friend — and it separates *what objectively happened* from *the story your mind told about it*, builds that truth over time, catches you if you're in danger, and walks you to a human who can finally help. It's a bridge to a person, not a replacement for one.

---

## Inspiration

About six months ago, for a class project, I cold-called strangers — to find their pain, and pitch them a fix. People as young as 20, as old as 50.

I expected to hear that they wanted easier medication reminders. To stop missing appointments. A translator on demand. The obvious stuff.

Instead, they were all afraid. And every single one of them wanted the same thing.

**To feel normal again.**

Then I started seeing it everywhere. Friends. People close to me. Each one carrying a story they needed someone to hear — their anxiety, their depression, the white hairs they couldn't explain. Was it that they barely slept? They didn't know. All their energy went into just looking normal enough to not be labeled as "something wrong."

I knew the feeling, because I live it. I have bad anxiety. I once went to a therapist who told me, after listening, that there was *nothing wrong* — because I downplay everything. I make it sound smaller than it is. The way I talk about it makes me almost impossible to diagnose. And here's the thing that gutted me: **that minimization isn't the exception. It's the rule.** It's exactly what keeps people from being helped.

That's where the insight landed. There are always **two truths**: the story you feel — and what actually happened, the part a doctor can actually treat. When your story goes unheard and the system sends you off without understanding you, you turn to ChatGPT.

And like all medical advice, it can lead you astray. Because AI is built to *agree* with you. You say, *"I'm just being dramatic, right?"* — and it says, *"You're absolutely right."* It validated the one thing that should have been challenged.

That's why I built DOT.

## What it does

DOT lets you just **tell it how you feel** — out loud or typed, in your own messy words, like texting someone who's there for you. Not a clinical form. Not a 40-question intake. You talk; it listens.

Then it does the one thing nothing else does. It **holds both truths**:

- It **validates the feeling first** — names your chest pain, your exhaustion, your fear as *real*, never "everyone feels this," never "it's normal."
- It separates **what objectively happened** (the facts, grounded in your accumulating record) from **the story you're telling** (the way you're framing or downplaying it).
- It reflects the **delta** between them as a *neutral observation* — "you feel X; the record shows Y" — **never** "you're overreacting," never "you're fine." You draw the conclusion. You mean it; the machine just proves it.
- It **checks in over time**, gently, so the truth isn't one loud, exaggerated moment — it's a pattern built across days.
- It catches a **safety signal** — self-harm, ideation — and instead of trying to handle it, hands you to a **human (988)**.
- And it produces a **provider-ready report you own** — a clear picture of your week you can carry to the person who can actually help.

DOT isn't another AI you talk to *instead* of a person. It's the AI that helps a person *finally understand you.* It serves the need to be cared for by a human; it never pretends to be that care.

## The pain it solves

Here is the exact chain that fails people — every link, and how DOT breaks it. I'll trace each one through our demo hero: a college student privately journaling daily panic attacks.

**Link 1 — Stigma stops people from seeking care at all.**
61 million Americans live with mental illness; provider supply is outstripped 320 to 1. But long before access is the problem, *shame* is. People burn their energy "looking normal enough to not be labeled as 'something wrong.'" They never make the appointment.
**DOT breaks it:** the channel *is* the cure. DOT feels like texting, not a waiting room — "no white coats, no clinical form." Our hero never could have walked into an office and said "I have a panic attack every single day." But she *journaled* it: *"I think I've had at least one panic attack a day this week haha."* The "haha" is the stigma. DOT meets her there.

**Link 2 — When they do go, they downplay, so they get dismissed.**
This is the trap I personally fell into. You minimize, so the doctor can't see it, so you get sent home with "there's nothing wrong." Watch our hero do it in real time. What she *journaled*: daily panic attacks, severe chest pain, blurred vision from not breathing, scratching her arms during meetings to stay calm, *"all I want to do is sleep forever."* What she'd *say out loud*: *"It was a long week but not too bad. I think I'm just a very nervous person... my chest hurts a bit but we're lowkey chilling."*
A doctor only ever hears the second version. **DOT breaks it** by making the minimization *impossible to hide*: it puts the felt story and the recorded facts side by side, and names the gap — *"a clear gap where the raw intensity of daily severe symptoms... is privately acknowledged, yet outwardly reframed as mild nervousness that's mostly fine and 'chilling.'"* That gap **is** the diagnosis the doctor never got to see.

**Link 3 — So they turn to AI that's built to agree with them.**
This is the dangerous one. 700 million people use ChatGPT weekly; a majority use it for emotional support. And when prompted with suicidal or delusional scenarios, these chatbots have *validated the delusion and encouraged the harm.* Sycophancy is not a quirk — it's a safety failure. For someone already minimizing, an AI that agrees is an AI that helps them disappear.
**DOT breaks it** by being the *anti-companion*: an honest mirror that reflects the gap instead of flattering it — with a human always in the loop. When our hero writes *"sleep forever,"* DOT doesn't comfort and move on, and it doesn't diagnose. It surfaces **988 and the Crisis Text Line**, stays present, and doesn't dismiss her walk-back (*"didn't mean it like THAT"*). It logs the signal, offers the human, and never pretends to *be* the help.

Everyone else is building the replacement. We built the bridge.

## How we built it / How it works

The whole product rests on one thing being *real*: the two-truths split. Everything else serves it. Here's exactly how it works.

**The engine — one live Grok reasoning call.**
The heart of DOT is a single call to **`grok-4.20-0309-reasoning`** (xAI), made through the **Vercel AI SDK** (`@ai-sdk/xai`) using **`generateObject`** against a **Zod schema**. It returns the typed two-truths split:

```ts
const ExtractResultSchema = z.object({
  feeling_validation: z.string(),    // validate the feeling FIRST
  subjective: z.array(z.string()),   // the story being told / downplayed
  objective:  z.array(z.string()),   // what verifiably happened, grounded in the record
  delta:      z.string(),            // the neutral gap — NEVER a verdict
});
```

It's grounded in the user's accumulating record (real seeded counts are injected as `RECORD FACTS` before the call so the model can never invent numbers). It is **fail-loud**: the model wiring throws at import if the key is missing, and the call throws on any parse error — **no canned fallback, ever.** A failure renders a visible `FAILED` state, never a silent fake.

**The pipeline — `extract → classify → reflect → finalize`.**
A turn assembles context (the last N messages + recent stories + a windowed read over the evidence record), makes that *one* Grok call, persists the inbound message + the resulting `Story` + the extracted facts, and shapes a two-beat reply: **validate first, then the delta.** `classify` tags each item as an `event` vs. an `interpretation`; `finalize` assembles the provider report. The hero moment the UI renders is the `reflect:delta` event — the gap, surfaced as a neutral observation.

**The risk path — deterministic, not a guess.**
Safety is too important to leave to a probabilistic model. A **deterministic crisis-cue scan** (`CRISIS_CUES`, no second LLM call) flags self-harm / ideation language. On a hit, the durable director **pauses on a human-clearance signal** and surfaces **988 + Crisis Text Line** verbatim. DOT never diagnoses; it never auto-proceeds past an un-cleared crisis flag. Keeping the safety branch deterministic means it can't be talked out of firing.

**Memory — the objective record.**
An in-process `Map` (graduating to SQLite) holds four tables: `users`, `messages`, `stories`, `events`. The **objective record is the `events` table** — open-vocabulary `kind`, no SQL enum, so a new data connector can be added later without a migration. The `stat_sheet` (panic attacks this week, nights under 6h of sleep, ideation signals) is a **GROUP-BY over events**, not a stored table. Reflect grounds on a flat windowed read — no embeddings, no RRF, no decay, no second model call. Simple, and it round-trips.

**Channels.**
- **Grok Voice** (realtime, OpenAI-Realtime-compatible WS) for spoken entry — speech→text happens inside the session.
- **Grok TTS** (voice `"eve"`) so DOT speaks her intro back to you.
- **iMessage** for the staggered over-time check-ins — the truth gets built where you actually live.

**Durability + deploy.**
**Inngest** runs the durable director — including the human-on-risk pause (`waitForSignal`), which durably halts the run until a person clears it. The app is **Next.js** on **Vercel**. Built in **Cursor**.

**The honesty line (we say it out loud).**
*"This is a sample story; the reasoning is live."*
**REAL:** the two-truths split (live Grok on the actual journal), the report generated from it, and the human-on-risk branch.
**SYNTHETIC (PHI rule):** the transcript itself, the behavioral events, and the check-in timing are a labeled seed so the UI has data to render. The seam — the catch — is real. The live feeds are the next layer, not a fake.

## Challenges we ran into

- **Keeping the tone validate-*not*-invalidate.** The single hardest thing in the whole build is the one knob in `EXTRACT_PROMPT`. The reflection has to name the chest pain as *real* before it does anything else, and the delta has to stay a neutral observation. One drift into "you're overreacting" or "you're fine" and we've become the thing we're fighting. This is the one sign-off that can't be automated — a human eyeballs every live run.
- **Not becoming sycophantic OR a diagnosing chatbot.** Every AI mental-health tool falls into one of two traps: it affirms whatever you say (dangerous), or it tries to diagnose you (out of its lane, and unsafe). DOT had to thread the needle — an honest mirror that does *neither*. That meant explicitly architecting *against* agreement, and hard-stopping DOT at Subjective + Objective: it authors the patient's story and the facts, and stops before Assessment and Plan, which are the clinician's columns.
- **Making the split real and grounded, not canned.** It would have been easy to fake a beautiful split. We refused. The split is one live `generateObject` call, grounded in real seeded counts, fail-loud with no fallback — so what you see on stage is genuinely the model reasoning, not a script.
- **The human-on-risk handoff.** Getting the crisis catch right meant making it *deterministic* (a model should never be the gate on someone's safety), surfacing 988 *without alarm and without diagnosing*, and — critically — not dismissing the walk-back when the user says "I didn't mean it like that." That last detail is the difference between a safety feature and a trapdoor.

## Accomplishments we're proud of

- **The live two-truths split works on a real journal.** Fed an actual anxiety entry, the live Grok call validated the chest tightness without minimizing it, surfaced real counter-evidence from the record, and named the gap neutrally — built a provider report of 3 subjective claims against 13 objective facts. The catch is real.
- **The honest-mirror design.** In a field racing to build companions that agree with you, we built the one that *doesn't* — and we can defend exactly why that's safer.
- **The bridge-to-a-human safety model.** A deterministic crisis path with a durable human-in-the-loop pause and a 988 handoff that stays present without diagnosing. This is the experts' own recommendation — *"support professionals rather than replace them"* — built into the architecture, not bolted on.

## What we learned

The most dangerous thing about AI in healthcare isn't that it's wrong — it's that it's *agreeable*. Fluency reads as credibility, and the moment a person offloads their judgment to something that always says yes, the honest signal disappears. We learned that the valuable thing an AI can do here isn't to *answer* — it's to *reflect*: to hold up the gap between what you feel and what happened, and then get out of the way so a human can step in. And we learned that safety has to be the part you *don't* let the model decide. The handoff to a person isn't a fallback. It's the point.

## What's next

**One engine; the output adapts.** The two-truths split, the over-time record, the provider report, the human-on-risk bridge — none of it is anxiety-specific. The same pipeline that catches a minimized panic attack catches a minimized symptom of anything. Anxiety is the hero today; **depression, chronic pain, women's health, and the symptoms you can't even name** are the same shape — *you can only advocate for what you know to ask for*, and DOT becomes the person who tells you what to bring up, stigma-free, for everyone who doesn't have one. Then: real connectors into the objective record (wearables, labs, message history) so the "what actually happened" half writes itself, and a clean export into the hands of the providers who've been waiting to help.

## Built with

`xai` · `grok` · `grok-4.20-0309-reasoning` · `grok-voice` · `grok-tts` · `vercel-ai-sdk` (`@ai-sdk/xai`, `generateObject`) · `next.js` · `vercel` · `inngest` · `cursor` · `typescript` · `zod` · `imessage` · `sqlite` · `p5.js`

---

**DOT. Tell it how you feel.**
