# LESSONS — the gotchas of arriving at DOT

> A retrospective. Not *what* DOT is — the lessons of *what it took* to find and shape it. The non-obvious ones, the
> ones that bit, the ones that unlocked it. Written for the next idea.

---

## Finding the idea

**1. Don't generate the idea. Constrain first.**
The move that worked: define the best angles + tools as *constraints* (patient agency · Grok voice/reasoning · iMessage · the stigma wedge · the sponsors), then shape the idea to fit them. DOT fell out of the constraints — it wasn't pitched and then justified. When you start from the solution you fall in love with the wrong thing.

**2. The real painpoint is never the stated ask.**
People said they wanted medication reminders, fewer missed appointments, a translator. Dig one layer past the obvious and every one of them wanted the same thing: *to feel normal again.* The surface ask is a decoy. (The Mom Test: don't pitch — find the thing behind the thing.)

**3. Your own pain is the wedge — not market research.**
The idea got real the moment it got personal: a therapist told you "there's nothing wrong" because you downplay everything. Founder-fit beat every persona doc. If it's drawn from a wound you actually carry, you'll know which details are true.

---

## Making it buildable

**4. Reframe the problem until it's a mechanism.**
"Help people feel understood" is a mood, not a product. "There are always two truths — what objectively happened vs. the story you tell — and the *gap* is the diagnosis no one sees" is a mechanism: one Grok reasoning call that splits objective from subjective. **The reframe is the product.** Keep reframing until you can point at the one thing the machine does.

**5. Position against the obvious competitor, or you're just another one.**
Without "AI is a bridge, not a replacement — an honest mirror, not the companion that agrees," DOT is one more health chatbot. The *danger* of sycophantic AI became the entire moat: the anti-companion. Name the thing everyone else builds, then be its opposite.

**6. One engine, output adapts. Resist building three apps.**
The same split handles a panic attack (escalate → 988), a broken toe (advocate → "get an X-ray"), a stigmatized women's-health story (democratize → what to ask for). Prove ONE engine; let the output adapt. The instinct to build a feature per use-case is how a 1-day build dies.

---

## Keeping it honest + shippable

**7. Decide what must be REAL — exactly one thing.**
Only the two-truths split is live (real Grok on a real journal). Everything else is a *labeled* synthetic seed. This is both honesty ("this is a sample story; the reasoning is live" — no silent stubs) and feasibility (you cannot build it all in a day). Pick the one beat that must be real and make only that bulletproof.

**8. Halfsies: scripted where you paste, live where it thinks.**
Premade content guarantees the best output on stage; the *same path* runs any live input. Reliable and truthful at once — you never have a "fake reflection" branch, you just have known-good inputs.

**9. The whole demo's credibility rides on ONE moment firing live.**
The paste → the split on screen. Everything else is theater around that single real beat. Protect it above all; rehearse the fallback for everything else.

---

## Process gotchas

**10. Keep planning and building in separate windows.**
When the planning window started writing into the builder's files, it collided and made a mess. The planner produces the spec/report; the builder loops over it. Respect the lanes.

**11. Validate the spec against the actual code before the crunch.**
Three landmines caught *before* handoff, saving the build clock: risk detection lived only in the Inngest director (not the live path), `feeling_validation` wasn't persisted (so the story page would've re-run the model), and the seed was the *wrong story* (loneliness, not anxiety). Assumptions ≠ reality — verify, then hand off.

**12. For the pitch: less on screen, more in your voice.**
The deck went 27 slides → 15 → short header-anchors. You narrate the full line; the visual breathes; the word just anchors. The founder *is* the script — don't make the slide compete with you.

---

_One line: **the idea got real when it got personal, became buildable when it became a mechanism, and stayed honest by making exactly one thing live.**_
