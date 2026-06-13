# PRIZE-PLAN — which prizes we're playing for, and the line that wins each.

> ⏳ **MISSION TODO (Johnny fills the targets).** The strategy *shape* is locked: pick the prizes whose
> requirement already sits ON the one line, and for each, write the single sentence that makes that judge lean
> forward. Don't bend the build to chase a prize off the line — that breaks `docs/SCOPE-LOCK.md`.

## The strategy (LOCKED)

- A prize is worth chasing only if its requirement is **already on the journey line** (or a ≤10-min on-path
  add). Don't add a node for a prize any more than for a badge.
- For each sponsor prize, the integration in `docs/SPONSORS.md` IS the qualifying work — the prize plan just
  names the angle and the on-screen proof.

## The ledger — rank by `score = expected-$ × feasibility ÷ wiring-minutes`

Score every prize, then work them highest-first. This is the explicit trade — a big prize that costs an hour of
wiring loses to a smaller one already on the line.

- **expected-$** = prize value × honest odds we'd actually win it (don't inflate; a 1-of-200 grand prize is small).
- **feasibility** = 0..1, how cleanly its requirement sits on our line (1 = already on it, 0.3 = needs a detour).
- **wiring-minutes** = the real minutes to make the seam land + show on screen (log it per CP-6 in `docs/BUILD-LOOP.md`).
- Higher `score` = chase sooner. A prize whose feasibility is low or whose wiring-minutes are high sinks — that's
  the point.

## The target table (⏳ MISSION TODO)

| Prize | Requirement | On our line? | exp-$ | feas (0–1) | wiring-min | **score** | GO / NO-GO | The lean-forward line | On-screen proof |
|---|---|---|---|---|---|---|---|---|---|
| ⏳ TODO | ⏳ TODO | ⏳ yes/≤10min/no | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ "the one sentence" | ⏳ what the judge sees |

> ⏳ **MISSION TODO:** one row per prize. Compute `score`, then sort. **GO** = on the line + positive score; wire it.
> **NO-GO** = off the line, low feasibility, or wiring-minutes that steal time from the demo path — name it so it
> doesn't creep back in. The "lean-forward line" is the ability as a judge-facing claim (the reference repo's were
> like *"a growth signal that fires BEFORE funding data, from a free SQL endpoint"*) — specific and true.

## Grand-prize narrative

> ⏳ **MISSION TODO:** the one-paragraph "why DOT wins overall" — the through-line that ties the mission, the
> demo moment, and the sponsor seams into a single story a judge repeats to another judge.
