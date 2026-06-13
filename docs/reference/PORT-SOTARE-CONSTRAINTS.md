# PORT — SOTARE Constraints → DOT (build without overcomplicating)

> Ported for the 9-hour clock. The SOTARE research lab spent waves deriving how to *develop under
> constraint* instead of maximizing. This is that discipline, distilled to what a hackathon builder can
> hold in one hand. Sources cited inline.
>
> **Sources:** `SOTARE/srm-state/constraint-set.md` (CP-1..CP-10) · `SOTARE/srm-state/research-compass.md`
> (G1–G5) · `SOTARE/principles/extracted/philosophy.md` (#6, #15, #26, #41, #43, #44) ·
> `SOTARE/principles/karpathy-principles.md` · `SOTARE/principles/ralph-principles.md`.

---

## 1. The constraint principles (each = one purpose)

| # | Principle | The single PURPOSE |
|---|---|---|
| **Bounding-box first** | Declare problem + stop-condition before you spawn. No stop condition → no spawn. *(CP-1)* | So work can END. Unbounded scope is how things disintegrate, not ship. |
| **One-sentence problem** | Write the most succinct definition of the problem at open; quote it at close. *(CP-7)* | So every line of code can be checked against the one thing it's for. |
| **Bottleneck-first** | The next build targets the *named* weak node, not your strongest existing capability. *(CP-3, #26)* | So effort lands where throughput is actually blocked — the only place it moves the demo. |
| **Satisfice-then-STOP** | Every metric carries a pre-registered "good enough"; hit it and STOP. No post-hoc raising the bar. *(CP-4, Simon)* | So you stop polishing what already works and move to what's broken. |
| **WIP = 1 (stop starting, start finishing)** | One active thing at a time; the queue must shrink before a new class of work opens. *(CP-6, ralph #2, karpathy #1)* | So throughput is real, not the illusion of ten half-things. |
| **Build the skeleton to reveal gaps** | End-to-end first on stubs; the running pipe shows you the real gaps. *(#6 video-game progression, karpathy #5 "the loop IS the product")* | So you debug reality, not your imagination of it. |
| **Verify before done — confidence ≠ evidence** | "Done/working" needs a run command + observed output. Fluent prose is not verification. A claim is MET only after its named test RAN. *(G2, ralph #3 quality-gate, karpathy #4)* | So "it works" means it was *seen* to work, not that it reads like it should. |
| **No LARP — persistence without verification is fake** | If a layer emits → stores → retrieves, prove the roundtrip. An iter that *looks* like it's contributing while feeding a black hole is LARP. *(#41, G5)* | So you never spend hours on work that silently went nowhere. |
| **Machines prove, humans mean** | The build presents data/output; the human decides what it means. Don't let the model self-certify the conclusion. *(compass worldview, G1)* | So judgment stays with Johnny, and the system stays honest about what it actually showed. |
| **Don't overcomplicate — one clear purpose each** | Every artifact, node, file has one job stated in a sentence. Subtract ≥1 thing each pass. *(CP-2 subtraction audit, CP-5 visible constraints)* | So the system stays legible under pressure and the cut list keeps it small. |

---

## 2. How these reinforce DOT's existing discipline

DOT's `CLAUDE.md` already locks five disciplines. SOTARE doesn't replace them — it *sharpens* each.
**(Proposals only — do not rewrite CLAUDE.md.)**

| DOT rule (CLAUDE.md) | SOTARE reinforcement | Proposed ADDITION / sharpening |
|---|---|---|
| **No silent stubs** (rule 1) | #41 *persistence-without-verification-is-LARP* + G5 *ritual-as-LARP* | Extend "no silent stubs" to **no silent persistence**: if a node emits an event or writes to the store, the demo path should *prove the roundtrip* (event arrives, bubble renders) — not assume it. A stub that fails loud is fine; a write that silently no-ops is the dangerous one. |
| **Demo path is sacred** (rule 2) | CP-1 bounding-box + CP-7 one-sentence problem | Pin the demo path to **one written stop-condition**: the exact moment in `DEMO-SCRIPT.md` where the run is "good enough." Polish stops there. Anything past it is the post-hoc-raising trap (CP-4). |
| **Ship > elegant; "done" needs run + output** (rule 6) | G2 *confidence-is-not-evidence* + karpathy single-metric | Sharpen "done" to a **named check**: state the ONE observable that proves a stage works *before* building it, then run it. No "looks right." A descending demo is reassurance, not proof. |
| **Real vs cached vs mocked** (rule 3) | CP-5 *visible mechanical constraints* (detect→BLOCK, never advisory prose) | Make the real/cached/mocked status **render on screen**, not live in a comment. The env-gate already exists; surface which mode each panel is in so "mocked" can never quietly masquerade as "real." |
| **Main always demoable / one run end-to-end** (rule 3) | #6 skeleton-first + CP-6 WIP=1 + ralph one-story-per-iter | Reinforce S1: **end-to-end skeleton on stubs before any node gets smart.** One thing in flight at a time; the carry-forward queue shrinks before S2 opens. Don't parallelize until main runs green once. |
| **Don't be a blocker; flag findings** (rule 7) | CP-2 subtraction audit + #43 constraints-as-development | ADD a **subtraction pass** at each stage close: name one thing to cut (a node, a panel, a dependency) and either cut it or ticket it in `OPEN-QUESTIONS.md`. Constraint is the development mechanism, not a brake. |
| **Mission is Johnny's** (rule 8) | "Machines prove, humans mean" (G1) | Already aligned — the doc just names *why*: the build produces proof-bearing output; Johnny extracts the meaning. Don't let the agent conclude the product. |

---

## 3. The "build simply" checklist (hold this in your head)

1. **One sentence.** Can I say what this is for in one breath? If not, stop and write it. *(CP-7)*
2. **Where's the bottleneck?** Build *there*, not where I'm already strong. *(CP-3)*
3. **What's good enough?** Pre-name it. Hit it → STOP. Don't raise the bar after. *(CP-4)*
4. **One thing at a time.** Finish before starting the next. Queue shrinks, not grows. *(CP-6)*
5. **Skeleton first.** Make the whole pipe run on stubs before any part gets smart. *(#6)*
6. **Prove it ran.** "Done" = a command I ran + output I saw. Confidence is not evidence. *(G2)*
7. **Prove it persisted.** If it writes/emits, watch the roundtrip land. Silent ≠ working. *(#41)*
8. **One job per thing.** Each file/node/panel does one thing, stated. Subtract one each pass. *(CP-2)*
9. **Machines prove, I mean.** The build shows data; I decide what it means. *(G1)*
10. **Does this make the 3-min demo better?** If no — cut it. *(DOT rule 2 × CP-2)*

> The whole port in one line: **name the one problem, build the skeleton that reveals the real gap,
> fix the bottleneck to a pre-set "good enough," prove every claim with a run — and cut the rest.**
