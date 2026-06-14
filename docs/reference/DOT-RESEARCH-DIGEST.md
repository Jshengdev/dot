# DOT — Research Digest (the objective goal, self-contained)

> One consolidated digest so the `dot/` repo carries its own *why*. Distilled 2026-06-13 from the
> `next/` research folder (problem space, landscape/gaps, design-thinking session, judges, vision yap,
> AI good/bad doctrine, tech channels, founder chats). This is the OBJECTIVE GOAL + the INTERACTION,
> not the UI styling and not the build plan.

---

## 1. What DOT is + why (the mission)

**The one line:** Reflect your life back to you — honestly, objectively — so you catch when anxiety is
lying, advocate for yourself, and stop spiraling; and so the *truth* (not your minimized self-report)
is what reaches the people who can help you.

**The thesis — healthcare should start from your STORY.** People experience and seek help as stories
("I've been feeling X, this happened, I'm scared of Y"), not symptom-codes or intake forms. The system
forces the story into its categories and loses the truth. DOT starts from the story: you tell it, DOT
reflects the *objective truth within your story* back to you. The story is the interface; the objective
reflection is the value; agency is the outcome.

**The deeper need is perspective, not a fix.** Rising quality of life, rising depression — people see
their life through a distorted lens. DOT's job is *perspective*: reflect the objective facts so the
anxious lens loosens. It does what a clinician can't — hold the objective record of your *whole story*.

**Why this democratizes healthcare.** A therapist or doctor only knows what you tell them, and anxious
people minimize ("I downplay everything"). DOT produces the *objective record* — "panic attack every
day for 3 weeks" — that you bring to a provider, so they can finally assist you instead of working off a
minimized self-report. Objective truth does double duty: agency for the person, an honest record for the
provider. (Grounded in WRAP self-advocacy research.)

**Founder-fit (the soul anchor).** Johnny's own anxiety. He had a therapist tell him "there's nothing
wrong" and had no way to vouch for himself because he downplays everything to battle stigma. DOT is the
tool he needed. *"You can use my story as the use case."* This is the "Carlos" of the build — the real
person at the center.

---

## 2. The judges + sponsors

This is an invite-only one-day SF hackathon themed *"move the needle on patient agency,"* hosted by
**Legion Health × Atlas**. Both companies were born from the SAME wound: someone they loved fell through
the cracks of a fragmented system that *missed* them. That shared wound is the emotional key to the room.

- **Legion Health** — AI-native telepsychiatry; *"autonomous medical care, starting with psychiatry."*
  Three Princeton founders, each watched someone they love struggle to get mental healthcare. Mechanism
  (confirmed first-hand): name+phone → aggregate public + medical records → chat → recommended
  therapy/prescription. **Earned autonomy + human-on-risk:** stable cases automate; anything that *can't
  be verified or carries risk* hands to a human, instantly. Built *"for people we love."* DOT is the
  **front door** upstream of their funnel, not a competitor.
- **Atlas** — recommendation/agency identity: community-driven help + **self-diagnosis** + *"the agency
  to get better recommendations and make my own choices with full context."* DOT's "you keep the meaning,
  you choose the next step" framing is dead-on.

**Sponsor stack (each tool gets a real job — never bolt-on):**
- **Grok Voice** (`grok-voice-think-fast-1.0`) — journal out loud; the entry surface. *Best Use of Grok
  Voice is its own $5k prize* — the highest-ROI differentiator.
- **grok-4.3** — multimodal text model: extract the objective facts from the narrative; reason over
  patient photos (image *understanding* is built in).
- **Grok image-gen (Grok Imagine)** — render the objective reflection as a beautiful DOT card.
- **Inngest** — durable, human-in-the-loop-pausable workflow spine.
- **Vercel** — the live deployed URL (submission requirement).
- **Cursor** — assemble fast.

---

## 3. The AI good / bad line (the honesty layer)

DOT's safety mechanism IS its doctrine, drawn from the "machines prove" principle + CBT + APA red lines:

- **"Machines PROVE; humans MEAN."** DOT proves the objective facts; the human extracts the meaning.
  DOT stays on the *prove* side (reflect facts) and never crosses to *mean* (no diagnosis, no verdict,
  no reassurance). The honesty is the product.
- **Two Eyes / the delta is the gap.** Eye 1 = what you *felt*; Eye 2 = what objectively *happened*; the
  **delta is the anxious distortion.** DOT surfaces the delta as a neutral observation — it does not
  announce it.
- **Validate FIRST — never invalidate.** Invalidation escalates anxiety, causes shame, ruptures trust
  (sourced). DOT shows *"your friends texted you 50 times this week"* and lets the **user conclude**. It
  must NOT say *"so your anxiety is lying"* or *"you're overreacting."* (Telling someone "everyone
  struggles, it's normal" reads as erasure — normalize the *act of reaching out*, never minimize the
  *feeling*.)
- **Not a therapist.** Journaling/reflection tool only. No sycophancy (the lethal 2025-26 AI-affirmation
  failure mode), no fake intimacy, no surveillance, never block the path to a human. **Crisis → human
  handoff** — the same earned-autonomy safeguard Legion runs.
- **Grounded.** Operationalizes CBT cognitive restructuring / thought records + DBT "Check the Facts"
  (separate objective event from interpretation) — both evidence-based; goal is *accurate/balanced*
  thinking, not "replace negative with positive." Within APA red lines.

---

## 4. The interaction elements (the e2e flow + data shape, NOT the frontend)

The interaction, end to end:

1. **Entry — Grok Voice.** You journal *out loud* (or by text). Talking is lower-activation than facing a
   themed mental-health app; voice decouples disclosure. Input can include a photo. No download, no
   clinical UI.
2. **Continuous conversation — iMessage thread.** The thread is *continuous and remembered* — DOT is one
   ongoing relationship keyed to you, not a stateless chatbot. (AI that *forgets* re-wounds; shared
   memory is load-bearing.) You journal, react with tapbacks, log moments over time.
3. **Backend — director / multi-agent routing.** A "director" routes each turn: extract objective facts
   from the narrative (grok-4.3), decide what's a logged event vs. an interpretation, route any
   risk/crisis to a human. Voice and text agents read from and write to **one shared conversation store
   keyed by patient** (the canonical thread + memory). Actions are channel-agnostic — both agents
   tool-call into the same backend.
4. **Story into a record.** Each story becomes a structured entry: the *subjective* (what you felt/said)
   separated from the *objective* (what verifiably happened). The delta between them is preserved, not
   resolved.
5. **The "glass dot" per story.** Every story renders as a DOT — a beautiful, non-clinical reflection
   object (Grok image-gen). The dot is the unit; your record is a constellation of dots over time.
6. **Click to connect objective truth from the subjective.** Tapping a dot reveals the objective
   counter-evidence behind a distorted thought — *"you said your friends hate you; they texted you 50×
   this week."* The user reads the fact and draws their own conclusion. (Reflection is **reviewed, not a
   real-time dial** — periodic, so it doesn't feed reassurance-seeking or rumination.)
7. **Provider-syncable objective stat sheet.** The accumulated objective record exports as a stat sheet a
   provider can read — "panic attack every day for 3 weeks." This is the self-advocacy artifact and the
   democratization bridge: the truth reaches the clinician, de-minimized.

**Data shape, minimal:** one story in → one structured entry { subjective, objective, delta } → one dot →
an aggregate objective stat sheet. Everything else is hidden. One conversation store keyed by patient is
the source of truth; voice is ephemeral, durable memory lives in the DB.

---

## 5. The honest constraints

- **Synthetic data only** (PHI rule + audited repos). Say "synthetic" out loud in the demo.
- **The "50 texts" behavioral data is FAKED for the demo.** The behavioral-counter-evidence moat
  (texts/calls/calendar as objective counter-evidence to a distorted thought) is the differentiator, but
  it's privacy-sensitive and the real ingestion pipeline is **unbuilt**. For the hackathon: fake the data
  streams, show the value-return loop.
- **The gap is real but narrow, and the hard half is unbuilt.** Mindsera catches distortions from *text*
  (no outside data); Exist.io has *behavioral data* (no narrative). The intersection —
  distortion-catching + real behavioral counter-evidence — is empty. That intersection (the objective
  mirror fused with behavioral counter-evidence) is exactly the part DOT *fakes* for the demo. Lead the
  pitch with the data-counter-evidence *mechanism*, not "AI journaling."
- **Crowded-space caveats.** AI journaling and reframing tools exist (Woebot RCT d=0.44 within APA red
  lines — modest). The defensible wedge is the *objective behavioral counter-evidence* + the
  anti-sycophancy safety story, not "another journaling app."
- **Don't overclaim "objective truth."** It's *your own record + any real behavioral data,
  de-catastrophized* — not omniscient truth. Be precise; don't let the mirror become a verdict. DOT
  proves; the human means.
- **Scope honesty (9 hours).** Build the *slice*: one story → one honest reflection → one provider stat
  sheet, on synthetic data, beautifully. The full Gmail/iMessage/Calendar ingestion + personal-CRM +
  "knows 50,000 people" is the long-term consumer vision — show the *feeling* of it, build the slice.
