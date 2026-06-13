# DEMO-SCRIPT — the judge-facing 3 minutes (= the demo path). Polish lives HERE and nowhere else.

> Structure ported from sayhello (problem → human truth → the catch → why-different → tagline). The "catch" gets the
> most polish of anything in the repo — slow down there. Hero condition = anxiety (founder-fit). 3 min live + 2 min Q&A.

## One-breath pitch (matches SCOPE-LOCK success-test)
**"DOT helps you tell it how you feel — turning your story into the objective truth of it, a story your provider can finally understand."**

## The beats (one run, live)

**[0:00] The human truth (problem).** A calm white room, the conversation surface breathing (clean-blue). Say it
first-person: *"Most people who need care never get it — first the stigma stops them, then when they finally talk they
can't explain it in a way that gets them understood. A therapist once told me 'there's nothing wrong' — because I
downplay everything. The way you say it makes you hard to diagnose."*

**[0:30] What DOT is.** *"DOT lets you just talk — by voice, like introducing yourself. It helps you tell it how you
feel, then separates what objectively happened from the story your mind added, and turns it into something your doctor
can actually understand. As easy as keeping a log of your day."*

**[1:00] ⭐ THE CATCH (the moment — most polish, slow down).** Live: speak a spiral —
*"Today was awful. My friends barely replied, I'm always the one reaching out, they're probably tired of me. My chest
was tight all afternoon. I feel like I'm falling apart and everyone can see it."* The glass DOT reveals, in order
(blur-up between each):
- **validate first:** *"the chest tightness — that's real."*
- **subjective** (the story the anxiety told): "everyone's tired of me" · "I'm always initiating" · "I'm falling apart"
- **objective** (the facts): *"your friends reached out more than you did this week — 19 times to your 12,"* saw two Tuesday, a coworker thanked you
- **the delta** as observations you weigh — **never** "you're overreacting." You draw the conclusion.
> The line to land: *"It doesn't tell you you're fine. It shows you the facts, and lets you see the gap. Machines prove; you mean."*

**[2:00] The output (agency, the human's yes).** *"From that, you draft your own report — the timeline, objective vs.
felt, what you want to ask and why. Not a diagnosis — a story your provider understands."* The report blooms as rich
bubbles; confetti ONLY on the human's confirm (per `design/`). *"One engine — anxiety today; depression, pain, chronic
illness next."*

**[2:30] Why it's different (architecture, not a prompt).** *"Every AI mental-health tool either affirms whatever you
say — which is dangerous — or tries to diagnose you. DOT does neither: an honest mirror with the human in the loop."*
The stack, each doing real work: **Grok Voice** (intro) · **Grok reasoning** (the objective/subjective split) · **Grok
image** (the dots) · **Inngest** (durable loop + human-on-risk) · **Vercel** (live).

**[2:50] Tagline, then stop.** *"DOT. Tell it how you feel."*

## Fallback (LOCKED discipline — we fail loud, on brand)
- Run ONE input live; keep 2 cached runs in `data/` for when voice/wifi flakes. **Web-mic fallback** if telephony/voice
  flakes — switch in seconds. Record a backup video before the freeze (`BUILD-LOOP.md` S4).
- A failure on stage renders a visible FAILED badge — never a silent fake.

## Q&A prep (pre-baked 20-sec answers)
- *Autonomous vs. scripted?* → extract→reflect runs on Inngest (durable, human-on-risk pause); the reflection is a live
  Grok reasoning call — show the run trace.
- *How is it safe / not a diagnosis?* → produces a *story*, never a diagnosis; validate-first, never invalidate, never
  sycophantic; **self-harm signal → human handoff** (PHQ-9 item-9 path, per `reference/INTAKE-QUESTIONS.md`).
- *Real vs. synthetic?* → synthetic for the demo (PHI); the objective log is a modular connector — the seam is real,
  live feeds are the next layer. Say "synthetic" out loud.
- *Why will people use it?* → it feels like texting, not a clinical form. The stigma barrier is the channel, dissolved.

## Submission (due 6:00 PM sharp · 821 Howard St)
- [ ] Team + emails · ≤140-char pitch · live Vercel URL · public GitHub repo
- [ ] Grok-Voice angle stated (the intro IS the voice) · xAI build credits claimed (tinyurl.com/xaivoice)
