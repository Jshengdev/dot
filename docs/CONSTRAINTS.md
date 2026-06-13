# CONSTRAINTS — the locked rules. Changing one needs Johnny.

> These are the non-negotiables. They are LOCKED *before* the mission is, because they're the discipline, not
> the idea. They carry over verbatim from the proven operating contract. Adapt names to DOT; don't soften the
> rules.

## The non-negotiables

1. **No silent stubs, ever.** A failure logs structurally and renders a **visible FAILED badge** (`design/`
   §C12 fail-LOUD). Mocks are dev-only and env-gated (`MOCK_*=1`). Never fake success to make a demo flow.

2. **Demo path is sacred.** The demo path (`docs/DEMO-SCRIPT.md`) gets polish + error handling. Everything
   else gets the minimum to not crash. Before any work, ask: *"does this make the 3-min demo better?"* If no,
   it's not on the critical path.

3. **Main always demoable.** One end-to-end run works before any parallelism, second feature, or polish. At
   every point in the build, `main` can be shown to a judge without apology.

4. **Real vs cached vs mocked is explicit.** Real = computed live (default). Cached = pre-built demo inputs in
   `data/` as a stage fallback. Mocked = dev-only, env-gated. The badge on screen always tells the truth about
   which one you're seeing.

5. **Sponsors are load-bearing + named on screen.** Every CORE sponsor is a real seam on the one journey line
   and is named on screen at its step. **Don't add a node/step just to claim a badge.** (Count + names: ⏳
   MISSION TODO, see `docs/SPONSORS.md` — the rule holds regardless.)

6. **Ship > elegant.** Working ugly beats broken beautiful. But: no silent stubs, and "done/working" requires
   a **run command + observed output** — not "should work."

7. **Don't be a blocker.** Hit a conflict or an undecided call? Flag it as a finding in
   `docs/OPEN-QUESTIONS.md`, keep moving — don't silently decide an OPEN question (`docs/DECISIONS.md`).

8. **The design system is frozen.** Build to `design/` (the clean-blue taste library). Wrap the app in
   `class="brand-clean-blue"`; lift the recipe classes + motion keyframes verbatim. No new colors, no second
   gray, no borders, nothing bounces, one accent (trust-blue). The healthcare-cliché BAN list
   (`design/05-NEW-BRAND.md` §4) is a hard rule.

## ⏳ MISSION-DEPENDENT rules (locked once the mission is)

> These rules exist in shape but need the mission to get their content. The reference repo's equivalents were
> things like "Critic model ≠ drafter model" and "render the fabricatedClaims the instant it's non-empty" —
> rules that only make sense once you know what DOT does.

- > ⏳ **MISSION TODO:** the rule(s) that protect DOT's THE-moment beat. Whatever the demo is built around,
>   write the constraint that guarantees it fires honestly and lands on screen the instant it's true.
- > ⏳ **MISSION TODO:** any "model A ≠ model B" / "human-in-the-loop" / "never auto-send" guardrail the mission
>   demands.

## The clock

> ⏳ **MISSION TODO (M7):** freeze time + submit time. Pattern: freeze ~1 hr before deadline, submit ~10 min
> before. Until set: **build the end-to-end skeleton first, tune content after it runs.**
