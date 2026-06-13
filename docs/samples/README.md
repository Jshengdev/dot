# Sample stories — the demo library

> Each is a REAL `grok-4.20-0309-reasoning` split (run live 2026-06-13) on a real/crafted journal. **One engine, one
> schema — the output adapts per entry.** That's the demo's power: the same split handles a panic attack, a broken toe,
> and a stigmatized women's-health story, and produces the *right* output each time (escalate · advocate · democratize).
> Builder: render any of these in the UI (connect-the-dots + report card); the live engine produces the same shape.

| Story | File | Range | What DOT does (the output) | Demo value |
|---|---|---|---|---|
| **Anxiety / panic** ⭐ | `../sample-story.json` | mental health | splits the downplaying ("lowkey chilling") from the reality (daily panic attacks, scratching arms, "sleep forever") → **catches the risk → 988 human handoff** | THE HERO — most dramatic; shows the safety / human-on-risk branch live |
| **Broken toe** | `samples/broken-toe.json` | physical / diagnosis | connects 5 casual entries over 2 weeks → the pattern says *possibly fractured* → **recommends "an X-ray," framed as advocacy** + a provider timeline | shows the **staggered-over-time** mechanism + the advocacy output (no false crisis) |
| **Women's health / IUD** | `samples/womens-health.json` | stigma / advocacy | names the stigma that silenced her ("it's natural / just take painkillers / embarrassing") + the **advocacy-knowledge gap** ("only got the IUD because mom knew") | shows DOT on a **stigmatized** topic + democratizing what-to-ask-for |

## The schema (every sample conforms — the contract the builder renders)
`{ feeling_validation, objective[], subjective[], delta, recommendation{should_check,what,why}, risk{flag,why,message}, provider_summary }`
+ `transcript`, `events[]`, `timeline[]` for the UI.
- **`risk.flag`** routes to the human-on-risk branch (988). **`recommendation.should_check`** routes to the advocacy/report output.

## The sharpened value prop (from the women's-health story — worth folding into the deck)
**You can only advocate for what you know to ask for.** She got the IUD because her mom told her — most people don't
have that person. **DOT is that person for everyone:** the objective record *plus* the knowledge of what to bring up,
stigma-free. (Patient agency = the power to advocate, democratized.)

## Options not yet built (say the word)
- **Migraines** — "told to just take Tylenol, but it was something worse" (logged: nausea, light-blindness, blurry, 3-hr episodes) → medical-dismissal case.
- **Mom's broken toe, undiagnosed for 3 years** — the long-arc cost of no objective record; "clean and spin it up."
- **A researched, citable women-misdiagnosis story** — to ground the deck's "why-now" stakes (Claude can pull a real one).
