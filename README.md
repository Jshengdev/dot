# DOT

**The objective mirror.** You tell DOT how you're doing. It reflects back two truths: the story you *feel*,
and the record of what *actually happened* — the version a clinician can act on. DOT never diagnoses; it just
makes sure the truth you carry into a doctor's office is the whole one.

> A live hackathon build · 2026 · by Johnny Sheng.

---

## Why

When you're struggling, you minimize. *"Just a stressful week."* *"My chest hurts a bit."* By the time you're
in front of a doctor, the daily panic attacks, the lost sleep, the scary moments — they've all been sanded
down to "I've been a little anxious." The story you tell isn't the record of what happened, and the gap is
exactly what gets missed.

DOT closes that gap. It holds the objective record so you don't have to relive it to be believed.

## How it works

One calm blue conversation does all the talking — data arrives as rich bubbles, almost no words.

1. **Tell it your week.** Type or paste a journal entry; DOT speaks back.
2. **It reflects two truths.** A single live reasoning call splits what you said into the **subjective** (the
   told, minimized version) and the **objective** (what verifiably happened), and names the **gap** between
   them — never a verdict, never a label.
3. **It keeps in touch.** Over the following days, DOT sends grounded check-ins over **iMessage** — objective
   reminders tied to the real pattern ("that's two club nights your chest tightened up after"), not
   "are you ok?"
4. **You view your story.** The things you said thread into one blue line; the facts pop off and float free —
   tap any node to read its **verbatim** source and the counted record behind it.
5. **It hands off.** A shareable, provider-ready summary — **Subjective / Objective only, never a diagnosis** —
   with the safety information on top.

## Real, not mocked

Every submission is a **live reasoning call** — the reflection is generated on the spot, grounded in a record
that's actually persisted across the conversation. The check-ins really text your phone. Failures fail loud and
visible; nothing is silently stubbed.

## Safety

DOT produces an **S/O record, never an assessment or plan** — it surfaces the pattern for a human clinician, it
doesn't play one. On any signal of risk it validates first and routes to human help (**988**, Suicide & Crisis
Lifeline — call or text, 24/7; or text HOME to 741741). It never argues with a walk-back and never counter-
evidences someone in crisis.

## Stack

- **pnpm monorepo** — a Next.js (App Router) conversation surface + a TypeScript reasoning engine.
- **Grok (xAI)** for the live reflection and the spoken voice.
- **framer-motion** + **react-three-fiber** for the liquid-glass dot and the open-morph motion.
- A real **iMessage** channel for the staggered check-ins.

## Run

```bash
pnpm install
pnpm dev          # the conversation surface
```

Real keys live in a gitignored `.env` — see [`docs/KEYS.md`](./docs/KEYS.md) for the variables you'll need.

## Design

DOT runs on a frozen, paste-grade design system: clinical-clean white + a single trust-blue (`#007AFF`),
iMessage-bubble warmth, conversation-as-data-density, visual-first / least-text. Healthcare-adjacent,
deliberately **not** looking like healthcare. The full taste library lives in [`design/`](./design) — start
with [`design/README.md`](./design/README.md) and [`design/05-NEW-BRAND.md`](./design/05-NEW-BRAND.md).

## For builders

The operating contract and canonical context live in [`CLAUDE.md`](./CLAUDE.md) and [`docs/`](./docs). Read
those in the order `CLAUDE.md` lists before building anything.
