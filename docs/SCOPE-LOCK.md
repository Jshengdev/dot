# SCOPE-LOCK — the ONE problem, crystal I/O, no complexity. READ BEFORE BUILDING.

> Johnny's law: do not overcomplicate. EXTREMELY clear input and output. The whole journey flow defined.
> No time wasted on features or complexity. We are NOT building a toolset. We solve ONE problem. If a thing
> is not on the line below, we do not build it.

## The simplicity law (carries over — non-negotiable)
- One problem. One input. One output. One linear journey with at most one loop.
- Ship > elegant. Working ugly beats broken beautiful.
- Every panel on screen consumes a real endpoint/event. No invented data.
- If a feature doesn't make the one-breath demo land harder, it's CUT.
- "Done/working" requires a run command + observed output. No silent stubs, ever.

## The ONE problem

> ⏳ **MISSION TODO (Johnny fills):** The ONE problem DOT solves is: __________
> - State it as a real pain a real person feels (who hits it, what breaks, why it matters now).
> - One paragraph max. If you need two, the scope is too big — cut.
> - The whole repo points at this sentence. Everything below derives from it.

## Crystal INPUT

> ⏳ **MISSION TODO (Johnny fills):** The single input is: `{ __________ }`
> - One thing the user provides. Type it exactly (the literal field(s) + shape).
> - If there's an optional cached/demo fallback input, name it here too.
> - Cross-check: this must match `docs/DECISIONS.md §input` and `docs/CONTRACTS.md`.

## Crystal OUTPUT

> ⏳ **MISSION TODO (Johnny fills):** The single output is: `{ __________ }`
> - One artifact the product produces. Type it exactly.
> - Name how it's rendered (the on-screen form the judge sees).
> - Cross-check: must match `docs/CONTRACTS.md` output type.

## The journey (linear — name each step; at most one retry loop)

```
1. INPUT in
2. __________          (sponsor on this step → docs/KEYS.md)
3. __________          (sponsor)
4. __________          ← THE moment (the thing the demo is about)
5. __________          (the one retry/refine loop, if any)
6. HUMAN approves → OUTPUT out
```

> ⏳ **MISSION TODO (Johnny fills):** Replace each `__________` with a real verb-step.
> Keep it 6 steps or fewer. The only branch allowed is the single retry on step 5.
> "THE moment" is the beat the demo is built around — mark it.

## CORE sponsors (each ON the line above, nothing off it)

> ⏳ **MISSION TODO (Johnny fills):** List the CORE sponsors (target ~5), each pinned to a step above.
> Each one = a real seam on the journey line, named on screen. See `docs/SPONSORS.md` + `docs/KEYS.md`.
> Pending the event's sponsor list. Don't add a node just to earn a badge.

## CUT — do NOT build (off the one line)

Default CUTs (carry over; confirm once the mission lands):
- Any second input, second output, or second mode → CUT until the one line ships end-to-end.
- Parallelism / batch / multi-item → ONE item is the demo. "It scales" is cached-only, time permitting.
- Any sponsor integration not pinned to a step on the journey → CUT (don't add a node for a badge).
- Any feature that doesn't make "THE moment" (step 4) land harder → CUT.

> ⏳ **MISSION TODO (Johnny fills):** Add the mission-specific CUT list once the idea lands.
> The CUT list is as load-bearing as the build list — it's how we protect the clock.

## The success test

Can you explain the demo in one breath?

> ⏳ **MISSION TODO (Johnny fills):** The one-breath sentence is: "__________"
> If a feature doesn't serve that sentence, it's cut. This sentence is the whole scope.
