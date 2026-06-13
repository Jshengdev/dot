# MOODBOARD — references we're recreating (translated into clean-blue)

> **Purpose.** A living wall of visual references Johnny wants DOT to *feel* like. These are the targets the
> experimental visual window (`packages/lab/`) recreates as real, in-brand assets. **We lift the physics, not
> the skin.** Perplexity turquoise, Headspace orange, and Cofounder pixel-art are NOT our palette — the
> design system is LOCKED to clean white + trust-blue `#007AFF` (`../05-NEW-BRAND.md`). What we extract from
> each is the *light, geometry, calm, and motion* — then render it in our one ink, one blue, no borders.
>
> **The single most important target is the glass dot** (Perplexity orb) — it IS DOT's hero output
> (`SKELETON-SPEC.md` §7c: "render the story as a glass dot"). Everything else is supporting mood.

---

## Cluster 1 — THE GLASS DOT (Perplexity "computer")

| File | What it is |
|---|---|
| `perplexity-glass-orb.png` | A refractive glass sphere levitating over a wildflower meadow, soft gray sky, a hot specular bloom at top, faint chromatic-aberration rainbow at the rim, the world refracted/inverted through the glass. |
| `perplexity-dots-mark.png` | The "computer" mark — four gray rings in a diamond, monochrome, geometric, on near-black. |

**What we extract → DOT's glass dot:**
- **The object is the product.** One luminous glass sphere, centered, floating, doing all the talking — the
  literal physical form of a "told story made into a dot." This is the render target for every `Story`.
- **Light is the material.** Depth comes from a specular hot-spot + soft environment reflection + a thin
  rim of chromatic aberration — *not* from outlines. Maps 1:1 to our depth-from-light / no-borders law.
- **Bloom = aliveness.** The glow around the orb is the "live thing breathes" gesture, made physical.
- **Translate the skin:** swap the gray sky/meadow backdrop for our `--page` white room; tint the refraction
  + bloom toward `--blue` `#007AFF` (the one accent), keep the glass itself neutral/clear. The orb carries
  blue light the way our AI bubble "lights up blue."
- **The 4-dot mark** is a candidate for DOT's own geometric monochrome mark (the brand allows "one geometric
  Grok-style mark" — `05-NEW-BRAND.md` §4). Recreate as four `--ink` dots, our radii, no medical iconography.

**Recreate-as:** a procedural glass sphere (shader / R3F transmission) — *the* hero experiment. Each stored
story → a dot whose internal refraction/tint is seeded by the story (its delta drives the visual).

---

## Cluster 2 — CALM / FRIENDLY (Headspace)

| File | What it is |
|---|---|
| `headspace-logo.png` | Orange circle + lowercase wordmark; the closed-eyes smile face on a full-bleed orange field. |
| `headspace-face.png` | The same closed-eyes smile, cropped off-center — one playful, hand-drawn, reassuring mark. |

**What we extract:**
- **Calm without clinic.** Headspace is mental-health that reads warm and human, never medical — exactly
  DOT's "healthcare that refuses to look like healthcare" mandate. One friendly mark, vast flat field, zero
  UI chrome, lowercase. Reassurance through *simplicity*, not soft-teal gradients.
- **One playful gesture, held system-wide.** A single mark does the emotional work. For DOT that gesture is
  the typing-pulse / the breathing dot — not a face, but the same "one warm sign in a calm field" principle.
- **DO NOT borrow:** the orange (that's their accent; ours is blue), and not a literal smiley (too cute for
  the objective-mirror tone). Borrow the *flat-field calm + single-mark restraint*.

**Recreate-as:** a full-bleed `--page` field holding one breathing blue mark — the "DOT at rest" / idle motif.

---

## Cluster 3 — CLEAN EDITORIAL SAAS (Cofounder / General Intelligence Co)

| File | What it is |
|---|---|
| `cofounder-node-graph.png` | A radial node graph — departments orbiting a center "Cofounder" node (a live sunflower at center), soft white cards, dashed connectors, a chat panel docked right. |
| `cofounder-product-window.png` | The same product framed in a rounded device window over an off-white page, with section captions below. |
| `cofounder-stat-card.png` | An email-report card: a huge `58%` numeral, a slim progress bar, tidy mono-ish key/value rows, a quiet "View details" key. |
| `cofounder-pixel-hero.png` / `cofounder-hero-wide.png` | Pixel-art meadow hero (laptop under a tree), task-completed chips floating over it. |
| `cofounder-footer-card.png` / `cofounder-footer-sunflower.png` | Airy footer: serif wordmark, plain text-link columns, one illustrated card pinned right. |

**What we extract:**
- **The radial node graph** = DOT's "behind-the-scenes" view of the director pipeline
  (extract→classify→reflect→finalize). Soft cards, dashed connectors, depth-from-light, a single live accent
  at the active node — this is our node-graph surface, already half-specified in the taste library
  (dashed wires, the live dot). Cofounder proves the *calm* version of it.
- **The stat card** (`58%`, progress bar, k/v rows, quiet key) is a near-exact match for our **stat bubble /
  card-in-bubble** (`05-NEW-BRAND.md` §3) — big count-up numeral, mono rows, one blue key, no border. Strong
  recreate target for the rich-bubble family.
- **The framed product window** = our A7 device-frame hero shell ("product-in-a-window").
- **Editorial restraint:** off-white ground, generous air, serif wordmark garnish, text-link footers, soft
  rounded cards with no visible borders — confirms our depth-from-light + bimodal-spacing discipline.
- **DO NOT borrow:** the literal pixel-art illustration style (too playful/retro for the objective-mirror
  tone). The chat-panel-docked-beside-the-canvas layout, the calm node graph, and the stat card are the keepers.

**Recreate-as:** (1) the calm radial **node-graph** of the live run; (2) the **stat / report card** bubble;
(3) the **framed conversation window** that houses the thread.

---

## The translation rule (pin this above the window)

Every reference passes through one filter before it becomes a DOT asset:

> **Keep** the light, the geometry, the calm, the single-live-accent, the one-object-does-the-talking.
> **Drop** the reference's color (→ our `--blue`), its medium (pixel-art / photography → our flat clean room),
> and any ornament. If the recreated asset wouldn't survive the `05-NEW-BRAND.md` ban list, it's wrong.

← back to the [taste library](../README.md) · the law is [05-NEW-BRAND.md](../05-NEW-BRAND.md)
