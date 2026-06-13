# DESIGN — the in-repo pointer to the FROZEN taste library.

> The design is **LOCKED.** This doc is the 30-second summary + the pointer. The full law lives in `design/`.
> Build to it; don't re-litigate it. (`docs/DECISIONS.md` #2.)

## The world (clean-blue)

A calm white room where a **single warm blue conversation does all the talking.** The thread is the product —
it carries cards, chips, stats, and visual answers, not paragraphs. It feels like texting someone who already
knows you, not filling out a clinic form. **One blue, one ink, no borders, almost no words.**

## The tokens that matter most

- **Ground:** clinical-clean-white `--page:#ffffff` (white is the room, not "earned").
- **Ink:** one cool near-black `--ink:#0b1620` (never pure black) at a 6-rung alpha ladder. No second gray.
- **Accent:** exactly one hue — **trust-blue `--blue:#007AFF`** (`#0A84FF` on dark). The whole AI/you channel.
- **Type:** Onest at 340/430/450/480 (never 400/600), size-led hierarchy; **IBM Plex Mono = the system voice**
  (timestamps, `read`/`delivered`, units, labels, 11–13px lowercase); Departure Mono for big numerals.
- **Depth from light, no borders:** ring-shadow stacks, nothing over 1px. Radii ladder `20 bubble → 16 → 12 →
  8 → 6 → 4 → pill`.
- **Motion:** one ease `cubic-bezier(.16,1,.3,1)`, **nothing bounces**; `:active` gives 1px; `blur-up` on every
  content change; ≤1 whimsy per surface; **confetti only on a human's yes.**

## The bubble system (the primary surface)

Home is a thread. AI/brand = **blue bubble** (right), user = **grey bubble** (left); only the last in a group
gets a tail; 2px mid-group vs 12px between groups is the warmth. Every turn is the **right shape**: number →
stat bubble, choice → chips, object → card-in-bubble, trend → chart bubble, input → inline form-bubble. **Never
a paragraph where a shape will do.**

## The hard BANs (healthcare-cliché trap)

No teal/green-as-brand · no medical cross/EKG/stethoscope/pill icons · no form-first screens · no clinical
stock photography · no red-for-routine (amber/blue instead) · no dashboard-as-home · no gradients · no pure
black/white text · nothing bounces · never more than one accent.

## Activation

Wrap the app in `class="brand-clean-blue"` and import `design/tokens.css`. Every recipe class ports unchanged.

## The files (full law)

| File | What it holds |
|---|---|
| `design/README.md` | the identity statement + the "use it on a new brand" quickstart |
| `design/00-PRINCIPLES.md` | the constitution — the laws, the bans, the identity checklist |
| `design/01-TOKENS.md` + `design/tokens.css` | the complete token system + the compiling `:root` sheet |
| `design/02-MOTION.md` | every curve, duration, and signature keyframe (verbatim) |
| `design/03-COMPONENTS.md` | the component catalog (surfaces, conversation, data-display, hero) |
| `design/04-FLOW.md` | the experience patterns — thread-as-home, least-text, step-through engine |
| `design/05-NEW-BRAND.md` | **the clean-blue skin — read this for DOT** (palette, bubbles, the BAN list) |
