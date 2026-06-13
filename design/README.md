# Johnny's Taste Library

A portable, reimplementation-grade design language. This is not a brand guide for one product — it is the **physics** of Johnny's identity, extracted from the proven `said-built` cofounder grammar, the `vortex-ui` token canon, and the shipped `sayhello` product, so that any new product can be built in his voice from exact values.

Everything here is a recipe, not a vibe. Hex, rem, px, cubic-beziers, box-shadow stacks, font weights, ms, keyframes, prop shapes, DOM structure — all quoted at the fidelity an engineer can paste and ship.

---

## The identity statement (read this first)

> A lit paper world: warm gray ground, cards held by white light instead of borders, not a stroke over 1px anywhere. One warm ink does all the talking while a tiny mono whispers what the system is doing — counts, timers, lowercase purpose notes. Dashed wires carry small dots that are actually traveling; one accent thing on the page is the thing that's alive right now. Buttons look like keys and give exactly 1px when pressed. Somewhere a number counts up once, slowly, like it was earned; somewhere exactly one small pixel-grain joke stands where a logo would be. Nothing bounces, nothing shouts, and confetti exists — but only when a human says yes. By the second screen you already know how to read it, because every shape means the same thing it meant the first time.

**The blind test:** in a grid of 20 SaaS screenshots, you can find his in 3 seconds — warm paper ground (everyone else is white or dark), a mono whispering at 9px, dashed wires with dots actually moving, not one visible border, and exactly one accent-colored thing alive.

---

## What this library is

A set of decision-frozen documents + one compiling CSS sheet. The **neutral + light-depth + ink-alpha + motion** foundation is the most portable layer: it survives any rebrand. Swap a single accent token and you have a new brand in one line. Everything composes upward from that bedrock — tokens → motion → components → flow.

The library carries **two living skins**:
1. **Paper-light (original):** warm gray world, warm ink `#262323`, violet `--live`, ocean brand-blue. The proven `sayhello` grammar.
2. **Clean-blue (new):** clinical-clean-white world, cool ink `#0b1620`, trust-blue `#007AFF`, iMessage bubbles as the primary surface — a healthcare brand that deliberately refuses to look like healthcare. See [05-NEW-BRAND.md](./05-NEW-BRAND.md).

Both skins run on the **same physics**: depth-from-light, one-ink-alpha-ladder, one-accent law, mono-system-voice, the single signature ease, ≤1 whimsy per surface.

---

## The files

| File | What it holds |
|---|---|
| [00-PRINCIPLES.md](./00-PRINCIPLES.md) | The constitution. The 11 laws, the soul/WHY behind each, the explicit BANS, and the identity checklist you score a new design against. Read this to understand *why* every value below is what it is. |
| [01-TOKENS.md](./01-TOKENS.md) | The complete token system in prose + tables: palette with roles + alpha ladders, depth/shadow recipes (verbatim stacks), type families/weights/sizes, spacing + radii rhythm, the thin-line law. Documents both the paper-light original and the trust-blue adaptation path. |
| [tokens.css](./tokens.css) | The real, copy-paste `:root` sheet implementing 01-TOKENS. Organized by section, every var commented, with a commented `[brand: clean-blue]` override block. Valid, compiling CSS. |
| [02-MOTION.md](./02-MOTION.md) | Every easing curve, duration, stagger, and signature gesture with its exact verbatim keyframe and the rule for each. Copy-paste keyframes for shimmer, blur-up, draw-in wire, stagger-rise, gate-stamp, confetti, the bird flight-cycle, and more. |
| [03-COMPONENTS.md](./03-COMPONENTS.md) | The component catalog — every reusable pattern from both the lab study and the shipped product, with generic names. Structure + exact CSS recipe + motion + when-to-use, grouped by family (surfaces, conversation, data-display, navigation, hero/visual). The bulk of the library. |
| [04-FLOW.md](./04-FLOW.md) | The experience patterns: the three-act journey, one-thing-at-a-time focus, the guided step-through engine, signature interactions, state transitions, and the conversation-as-data-density / least-text philosophy as concrete UI rules. |
| [05-NEW-BRAND.md](./05-NEW-BRAND.md) | The clean-blue healthcare-not-healthcare application: full new palette, the bubble/conversation system spec, type, the keep/adapt/ban table, the "do NOT look like healthcare" anti-pattern list, and how each extracted component re-skins. |

---

## "Use it on a new brand" quickstart

1. **Start from the bedrock.** Copy [tokens.css](./tokens.css)'s default `:root` block verbatim. This gives you the grounds ladder, the one-ink-six-alpha ladder, the depth recipes, the radii rhythm, and the motion curve. Do not change the *structure* — these are the physics.
2. **Swap exactly two values.** `--live` (the active-state accent) and the brand color (`--ocean` in paper-light). Everything else stays. For a cooler brand, also nudge `--ink` toward a cool near-black and the grounds toward true white — but keep the 5-level elevation logic. The [tokens.css](./tokens.css) `[brand: clean-blue]` block shows the exact override.
3. **Lift the recipe classes verbatim** from [01-TOKENS.md](./01-TOKENS.md) §depth and [03-COMPONENTS.md](./03-COMPONENTS.md): `.ring-card / .ring-panel / .ring-float / .ring-hover / .board-recess / .key-bevel / .pill-emboss / .bar-track / .bar-fill / .dot-glow / .btn-crunch / .crunch-dark / .dotted-canvas`. The class names are canon — components port unchanged.
4. **Lift the motion keyframes verbatim** from [02-MOTION.md](./02-MOTION.md) plus the reduced-motion guard. Never ship without the guard.
5. **Pick a world-metaphor.** The metaphor decides which shapes exist *and which you refuse* (see [00-PRINCIPLES.md](./00-PRINCIPLES.md) §world-model). A reading room, an organism, a study, a conversation — choose one and hold it system-wide.
6. **Score against the checklist** in [00-PRINCIPLES.md](./00-PRINCIPLES.md) §identity-checklist. A genuinely-his design hits ≥90% with zero ban violations.

**Font-hardening (never skip):** self-host woff2, put the `.variable` font classes on `<html>` (not `<body>` — on `<body>` they don't compose into `:root` and the page collapses to serif/Times), and give every `var(--font-x)` an inline fallback chain.
