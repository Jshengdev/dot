# 00 — PRINCIPLES (the constitution)

The soul, the laws, the bans, and the checklist. This is the document every other file answers to. Read it first; it tells you *why* every value in [01-TOKENS.md](./01-TOKENS.md), [02-MOTION.md](./02-MOTION.md), and [03-COMPONENTS.md](./03-COMPONENTS.md) is what it is. A new product is "his" only if it can trace each choice back to a law here.

---

## THE SOUL — one paragraph (the blind-test fingerprint)

> "A lit paper world: warm gray ground, cards held by white light instead of borders, not a stroke over 1px anywhere. One warm ink does all the talking while a tiny mono whispers what the system is doing — counts, timers, lowercase purpose notes. Dashed wires carry small dots that are actually traveling; one violet thing on the page is the thing that's alive right now. Buttons look like keys and give exactly 1px when pressed. Somewhere a number counts up once, slowly, like it was earned; somewhere exactly one small pixel-grain joke stands where a logo would be. Nothing bounces, nothing shouts, and confetti exists — but only when a human says yes. By the second screen you already know how to read it, because every shape means the same thing it meant the first time."

This is the verification baseline. A new design is genuinely his if a stranger could match it to that paragraph.

---

## THE LAWS (the 11 — lead with these)

These are the invariants. They survive any rebrand and are the whole reason the work reads expensive and quiet. Each law has a one-line WHY (the thing that guards it from decay into decoration).

### Law 1 — Depth belongs to light, never to borders.
Every surface is modeled by a stack: `1px white inset ring` (top-lip highlight) + `1px ~8% black outer ring` (the "border" that isn't) + a stack of 1–6% blurs (the cast shadow). A literal `border:` appears only as a deliberate sub-px hairline (0.36–0.73px) or a dashed/striped gradient — never as a box outline. **WHY:** borders are weight; light is depth. The screen should read as paper under a lamp, not a flat digital fill. Strokes are reserved to outline *relation and motion* (wires, connectors), never to box things in. → Recipes in [01-TOKENS.md](./01-TOKENS.md) §depth.

### Law 2 — One ink at an alpha ladder does ALL text and line work.
Pick one warm near-black (`#262323`, never `#000`). Every text tone, hairline, and divider is that ink at a different alpha. No `#888`, no `#ccc`, no second gray. Importance is a step in alpha, never a new color. **WHY:** the discipline is the look — gray-on-gray everywhere makes the rationed color *mean* something.

### Law 3 — Exactly one accent, reserved for the single live/active thing.
In the original product, violet `#6e2bff` appears ONLY on the currently-executing node. Color is information, not decoration. Never as a large fill. **WHY:** "if everything is colored, nothing is alive." The one accent is the eye's anchor — it says *this is happening right now*.

### Law 4 — In-between font weights; never the loud stops.
Body is `430` (not 400), emphasis is `480` (not 600), big numerals are `340`. The default 400/600 stops are banned — they are what makes type look like a default webpage. Headings rely on **SIZE, not weight**. **WHY:** the half-steps make type feel *set by a hand*, not styled by a stylesheet. Emphasis is one quiet step (430→480), not a jump.

### Law 5 — Thin-line ≤1px law.
Every line, ring, and stroke is ≤1px. Presence and emphasis come from a soft blurred glow, never a thicker ring (a 3px ring reads ~1.5px at zoom and looks clumsy). **WHY:** restraint reads as precision; a thin confident line is the craft signal.

### Law 6 — Hover lifts in light, never in size.
Interactive surfaces change shadow/background on hover. The only geometric move in the whole system is a `1px translateY` press-down on `:active`. **WHY:** light answers the cursor — physicality without a jarring size jump.

### Law 7 — Earn-white.
`#fff` is reserved. The page is warm gray (`#f5f5f2`/`#fbfbf8`); pure white is what an element *becomes* on hover/active/selected/live. White = attention/aliveness, not default. "If everything is white, nothing is." **WHY:** the brightest pixel must be meaningful. Default to raised off-white; promote to white only at peak elevation/active state.

### Law 8 — The mono is the system's voice.
Anything the machine says about itself — labels, counts, timers, statuses, breadcrumbs, paths, masked values, provenance — is IBM Plex Mono at 8–13px, tabular-nums, letter-spaced, often lowercase or uppercase kickers. Humans and content speak the grotesque (Onest); the system speaks mono. **WHY:** this split is the single biggest "feels designed" signal. The two voices never cross.

### Law 9 — Motion depicts something true.
A motion is allowed only when it shows a real datum moving — data flowing, time passing, a result landing, work executing. The instant a motion is about itself, it is decoration and gets cut. **WHY:** "the moment a mechanic is about itself, it's cut." The surface is still; only the *work* moves.

### Law 10 — ≤1 whimsy per surface, and never on money/gate moments.
The taste IS the restraint. One delight per screen, and it always serves a real datum. The embarrassing version is all eleven mechanics firing on one screen. Masked money is a flat mono chip (`$ ••••`); irreversible actions are serious dark keys with their gate glyph. **WHY:** the difference between him and a games-skinned dashboard is that he ships *one* delight and it always carries meaning.

### Law 11 — The page IS the onboarding; primitives repeat until fluent.
Build websites like they are tutorials on how to read themselves. First encounter = curiosity, second = pattern, third = fluency. A primitive earns repetition only if it needs **zero explanation by the third encounter**. "If it needs a tooltip, it is not a primitive." **WHY:** repetition trains the user — every shape means the same thing it meant the first time, so by the second screen they can already read it.

### (companion law) — Less text, always.
"Show less words always" is a hard rule. With no copy to lean on, the design *has* to be the explanation — the button/diagram/visual/number speaks for itself. Prefer a chip over a sentence, a stat over a paragraph, a chart over a list. **WHY:** it is a forcing function that makes the design do the work.

### (companion law) — The world-model is the consistency engine.
Each product gets a *world metaphor* (reading room / organism / study / conversation). The world decides which shapes exist AND which to refuse. **WHY:** the metaphor tells you what to build and what to cut; it's how the work "stands out from the crowd consistently."

---

## THE SOUL, IN JOHNNY'S OWN WORDS (the WHY, verbatim — raw spelling preserved)

These are the load-bearing quotes. A new project must be able to trace its choices back to one of these.

**On the core feeling:**
> "i just love the human like natural feelign and clean ui with innovatrive simplicity combined with teh tech of ai and bring an ew medium into life using clean thing lines nad strokes and using keeping things very simple with complimentary greys or just full contracst."

**On what only he can build:**
> "what element do i LOOOOVE to intentiaonlly make things feel the same. ITs about looking outside tro find the real sementaic feeling. what shoudl it feel and ecapsulate but in its own way."

**On distinction — games translated into information:**
> "ui and interations that are very native to the feeling but are built upon from games and ui from games. Its being able to trasnltetio that delightful experience you play from games into soemthign tasteful that works as a way to presenting infromatio nadn knowledge. The one thing htat makes me stand out with my style is tlicherlyt my ability to create smlall interactions that are extremely delightful without overdoing it with any basic effects adn reference clean princples."

**On consistency and the world-model:**
> "I love haveing the uniqueness of shapes as aw ay of not beign too freaky but still capusulating what hte information is asking for. its about going deeper into really looking into the UX of each independ piece of information. what does it server how shoudl it feel how abstract should it be in tis communcaiton. The content is like a world and the worlds is osemthign only i cna build and its recognnizable becuase it cna stand out form the corwed CONSISTENTlyy"

**On repetition as teaching:**
> "its building websites like trhey are desinged to be tutorials on how to interact and view the information. eveyrthing must be kepty SIMPLE. abstraction of what it is about and letitng the action or diagram or visual or button speak for itself becuase it builtds on top of whats familar. i watn a fingerbprint that is unique but once its applied as primitive to many things it becomes something recongizable as a feature of hte site and htei teractions."

**The two-mode rule (when the paper world bends):**
*Complementary greys* = the **working mode** (neutrals carry ~95%, color = meaning, one accent on the live thing — any surface where information is read/acted/monitored). *Full contrast* = the **statement mode** (brand/film moments: editorial black/white, glitch frames, a dark hero). A page may hold **one** full-contrast hero moment, but the modes **never blend mid-surface** — "greys are for working, contrast is for declaring."

---

## THE BANS — what he NEVER does (the negative space of the identity)

A new design **fails** if it does ANY of these. (✗ = automatic fail if present.)

### Surface / depth bans
- ✗ Borders doing a shadow's job. No visible borders anywhere; any border > 1px is banned.
- ✗ Pure black text (max ink is `rgba(38,35,35,.9)` — warm `#262323`, never `#000`).
- ✗ Pure white as the default ground (`#f5f5f2` paper; white is *earned* — Law 7).
- ✗ Saturated or dark fills on working surfaces (one flat saturated ground allowed per *page* as a hero moment only).
- ✗ Dark mode by default — "this language is a lit paper world."
- ✗ Drop shadows on recessed elements (recessed = inner shadow + white under-light, never a drop shadow).
- ✗ Shadows darker than 8% rings / 6% blurs (floats may reach ~30% only in the far throw, e.g. `0 24px 40px -20px`).
- ✗ Skeuomorphism beyond the sanctioned bevels/emboss (no leather, no glass-blur as decoration).

### Color bans
- ✗ More than one accent. Exactly one, only on the one live thing, never a large fill.
- ✗ Color used decoratively. Color = meaning only (status, the one active thing).
- ✗ More than one extra gray. One ink at alphas — no other grays exist.

### Type bans
- ✗ More than two font families in-frame (a serif may appear ONCE per product as brand garnish, never as UI).
- ✗ System text (labels/counts/statuses) set in the display face — the machine always speaks mono.
- ✗ UI text above ~13px (the one big stat numeral is the exception).
- ✗ Weight 400 or 500/600 as body/emphasis — "400 reads thin-anonymous and 500/600 read loud." Use 430/450/480.
- ✗ Headings that rely on weight — headings rely on **size**.

### Motion bans (the strictest lane)
- ✗ Hover that scales/zooms. Hover changes *light*, never size.
- ✗ Bounce / elastic / spring-overshoot easing. "Nothing bounces."
- ✗ Motion that depicts nothing. If it doesn't show real work, cut it.
- ✗ UI motion > 700ms (the one ~2600ms earned stat beat is the sole exception).
- ✗ Confetti on anything but a human's yes — never on system events, page loads, or passive completions.
- ✗ "Basic effects": no screen shake, no floating particles, no glow auras, no parallax, no scroll-jacking, no autoplaying carousels.
- ✗ Spinners for instant data (use blur-up swap). ✗ Skeleton screens (use ghost cards).

### Spacing / composition bans
- ✗ Mid-scale (20–40px) padding inside components — "the single biggest tell of generic UI." Go huge outside (≥64px) OR tight inside (2–14px), nothing between.
- ✗ Uniform padding everywhere.
- ✗ Full-bleed cards — cards hug content (`w-fit` thinking).
- ✗ Decorative gradients. (Legal gradients only: white→board tile fill, button-modeling overlays, bar fills, bottom fade-outs on truncated text.)
- ✗ A new shape with no datum behind it — "a shape with no datum behind it is decoration and gets cut" ("not too freaky").
- ✗ Whimsy on money or gate moments.

---

## INTERACTION GEMS — named gestures + the datum each serves

Each is a game-mechanic → translation → real datum. The WHY guards it from becoming decoration. (Full keyframes in [02-MOTION.md](./02-MOTION.md); component homes in [03-COMPONENTS.md](./03-COMPONENTS.md).)

| Gesture | What it does | The datum it serves |
|---|---|---|
| **Packet dots** | 3.2px SMIL rects travel dashed wires, `dur=5.6s`, `begin=i×0.7s` stagger, alternating directions, opacity ramp `0;1;1;0` | the organism is alive; information is *flowing* — flow witnessed, not implied |
| **Blur-up swap** | `blur(7px)→0`, `opacity .25→1`, 420ms on every in-place content change | new content *develops* like a photo — never a hard cut, never a spinner for instant data |
| **Count-up + bar fill** | numeral 0→target via rAF over 2600ms easeOutQuint on scroll-into-view, once per page-life | the result has *weight* — earned, not pasted (the long 2600ms beat is legal ONLY here) |
| **Live mono timer** | `setInterval` 1s, `2m 47s`, ~9.5px tabular | the system isn't pretending — work is measurably happening now |
| **Pulsing pill / breathing grid spinner** | run-pill tint pulses `1→.55→1` at 1.6–2s; 3×3 ink cells pulse opacity at `i×0.12s` stagger | a calm heartbeat — live things pulse; they never bounce, spin large, or flash |
| **Shimmer** | quarter-width light band `-120%→220%` over 2.4s, on ONLY the row executing *this second* | distinguishes "executing now" from merely "running" |
| **Gate stamp** | pressed-ink chop, ~200–500ms settle, resolves in place to a mono chip (`sent ✓`) | human judgment leaves a durable, physical, *audited* mark |
| **Key-bevel + 1px press** | 2px white top-lip; `:active translateY(1px)` — the only size change | everything clickable is a physical, consequential key |
| **Confetti — human approval only** | one localized burst *from the button itself*; `particleCount 26` (64 batch); never under reduced-motion | *your* click mattered; scarcity is the whole point |
| **Optimistic / reversible-feel** | ✕ never deletes (fades + leaves a restore micro-key); rows resolve in place to a faint mono chip | nothing destructive, nothing laggy — safe to play with |
| **Hover = lift in light** | swap to deeper ring or step bg one notch (`#fbfbf8→#fff`), `.14s ease-out`; never scale | light answers the cursor |

---

## RESTRAINT, DENSITY & CALM (the governing temperament)

- **The surface is still; the *work* moves.** Calm is the default; motion is an event.
- **Density is earned by purpose labels.** Any dense panel is preceded by a lowercase mono kicker stating what it's for in plain words (`reply rate · linkedin dm`) at ~0.64rem, ink .5. Density without a purpose label is just noise.
- **Conversation as data-density.** A chat card holds more legible information than a wall of text — every shape encodes a datum (directly relevant to the conversation-first brands; see [04-FLOW.md](./04-FLOW.md)).
- **One hero element per view.** One big numeral, OR one canvas, OR one report — everything else is 8–11px supporting cast. Ghost placeholder cards (`#ecece9`, faint ring, no content) sketch "more exists" without competing.
- **The per-piece interrogation (the method).** For every datum, ask three questions: *what does it serve? how should it feel? how abstract should its communication be?* (Proof: masked money → serious/still/maximally-abstract flat chip; reply rate → earned/minimal-abstraction one big counting numeral; running agent → heartbeat/medium-abstraction pulse-pill + timer.)

---

## THE IDENTITY CHECKLIST — score a new design

A judge scores 0/1 on each. A genuinely-his design hits **≥90% with zero ban violations.** (✗ = automatic fail if present.)

### A. Surface & depth
- [ ] Ground is warm paper (or the brand's clean near-white), NOT pure white and NOT dark by default
- [ ] Pure white appears only on the single most-important object (earning-white)
- [ ] Not one visible border > 1px anywhere; depth comes from light
- [ ] Cards use the ring formula (white inset ring + ~8% outer ring + ≤6% blur stack)
- [ ] Recessed panels get inner shadow + **white** under-light (never a drop shadow)
- [ ] Radii follow the 16→12→8→6→4→pill ladder

### B. Color
- [ ] One ink at alphas does all text; no second gray
- [ ] Ink is a warm/cool near-black (≤ `.9` alpha), never pure black
- [ ] Exactly ONE accent, only on the one live/active thing, never a large fill
- [ ] Color carries meaning only — zero decorative color
- [ ] (If a saturated/dark ground appears) it's a single hero moment per page, not blended mid-surface

### C. Type
- [ ] A mono is the system's voice — every label/count/timer/status/path is mono, 8–13px, tabular-nums
- [ ] Humans/content speak a soft variable grotesque; the two voices never cross
- [ ] Body/emphasis use in-between weights (430/450/480), never 400 or 600
- [ ] Headings rely on size, not weight
- [ ] Two-tone text (strong subject / faint context) is present
- [ ] No more than 2 families in-frame (a serif, if any, appears once as brand garnish, never UI)
- [ ] "Show less words" — the screen is visual-first; copy is minimal

### D. Buttons & interaction physics
- [ ] Buttons read as physical keys (2px white top-lip)
- [ ] `:active` presses exactly 1px down — the only size change anywhere
- [ ] Hover lifts in light (deeper ring / one bg step), NEVER scales

### E. Motion
- [ ] Every motion depicts something true (flow, time, running, landing) — none is decorative
- [ ] House ease is `cubic-bezier(.16,1,.3,1)` family; nothing bounces/springs
- [ ] No UI motion > 700ms except the single earned ~2600ms stat beat
- [ ] Content swaps blur-up (no hard cut, no spinner for instant data)
- [ ] `prefers-reduced-motion` is honored
- [ ] Confetti (if present) fires ONLY on a human's approval, from the button itself

### F. Composition & density
- [ ] Huge air outside (≥64px) / tight precision inside (2–14px); NO 20–40px mid-scale inside components
- [ ] Cards hug their content (no full-bleed cards)
- [ ] One hero element per view; the rest is 8–11px supporting cast
- [ ] Every dense panel earns itself with a lowercase mono purpose label
- [ ] Dashed wires = relation; dotted grounds = work-canvas; ringed endpoints used consistently

### G. Soul / restraint
- [ ] ≤1 whimsy element per surface, and never on money/gate moments
- [ ] Whimsy (if any) is small, pixel-grained, flat-honest-color, drawn fresh — where a logo would be
- [ ] Every shape encodes a real datum (no shape exists for decoration)
- [ ] The product has a coherent world-metaphor that dictates which shapes exist AND which are refused
- [ ] By the second screen the user can already read it (primitives repeat, zero tooltips needed)
- [ ] The surface is calm at rest; only the *work* moves

**The single fastest blind test:** "In a grid of 20 SaaS screenshots, can you find this one in 3 seconds?" The four givens that make it findable — warm paper ground (everyone else is white/dark) · mono whispering at 9px · dashed wires with dots actually moving · not one visible border · exactly one accent thing.

---

## THE SEMANTIC NORTH STARS (inherit the feeling, not the content)

The outside artifacts that seeded the lens — useful for any new brand to inherit the *feeling*:
- **Oku** → warm literary calm, content as a place to read.
- **Attio** → density done calmly, storytelling-as-wiring.
- **COACH × The Fashion Post** → serif restraint, "show less words always."
- **Cofounder** → THE surface model (the paper-light world entire). *Its content/identity — name, fonts, pixel-art, narrative — is never-ship; only the physics are portable.*
- **The spiral-scroll portfolio** → viewing as choreography (iterations orbiting a top-down 3D spiral, motion-blurred entering/leaving, sharp at focus).
- **LLABS glitch flower** → the texture of the AI medium (CRT scanlines, RGB channel-split, terminal mono caption) — "the tech of ai as a new medium, not a chatbot skin."

What they all share: **every one shows *less*** — fewer words, fewer colors, fewer strokes — and lets one precise, human-feeling gesture carry the meaning.

→ Continue to [01-TOKENS.md](./01-TOKENS.md) for the exact values these laws produce.
