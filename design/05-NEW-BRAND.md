# 05 — NEW BRAND: clean-blue (healthcare that refuses to look like healthcare)

The application of the whole library to a consumer/AI healthcare brand that deliberately reads as a **clean AI product, not a clinic**: white + trust-blue, iMessage blue-bubble warmth, Grok-style minimalism, conversation-as-data-density, the least text possible, visual-first.

**The bridge in one sentence:** keep Johnny's depth-from-light + mono-system-voice + one-accent discipline (from [00-PRINCIPLES.md](./00-PRINCIPLES.md)); swap warm-paper → clinical-clean-white, swap violet → trust-blue, and promote the conversation bubble from a component to the **primary surface**.

---

## 0. THE ONE-LINE NORTH STAR

> A calm white room where a **single warm blue conversation** does all the talking. The thread is the product — it carries cards, chips, and visual answers, not paragraphs. It feels like texting someone who already knows you, not filling out a clinic form. One blue, one ink, no borders, almost no words.

The activation: wrap the app in `class="brand-clean-blue"` (the override block in [tokens.css](./tokens.css)) and every recipe class ports unchanged — only the values change.

---

## 1. THE FULL NEW PALETTE

### Core neutrals (cooler + whiter than warm paper — "clinical clean" not "literary warm")
```css
--page:     #ffffff;   /* clinical-clean-white — now the DEFAULT ground (the room) */
--raised:   #fbfcfd;   /* barely-cool raised surface */
--canvas:   #f6f8fa;   /* recessed work canvas (Vercel/GitHub cool-grey family) */
--recessed: #eef1f4;   /* deepest recess — input wells; received-bubble grey lives here */
--hairline: #e6eaee;   /* the ONLY near-border tone; 1px max, used sparingly */
```
> The key inversion from paper-light: **white is no longer "earned" — it's the room.** Warmth moves into the blue bubble, not the paper.

### Ink — ONE cool-charcoal at alphas (replaces warm `#262323`)
**Carry the canonical 6-rung token NAMES unchanged** (`--ink-90 / -70 / -50 / -35 / -10 / -6` — same names as paper-light in [tokens.css](./tokens.css)); only the hue + alphas move. The token name is a *role*, never a literal alpha — so every component recipe (and every class in [03-COMPONENTS.md](./03-COMPONENTS.md)) ports unchanged. Do NOT invent `--ink-80/-65/-45/-30` names here — that breaks the bridge.
```css
--ink:    #0b1620;             /* near-black, slight blue-cool, NEVER pure #000   */
--ink-90: rgba(11,22,32,.92);  /* primary text                                   */
--ink-70: rgba(11,22,32,.80);  /* strong context / body / card titles            */
--ink-50: rgba(11,22,32,.65);  /* secondary                                      */
--ink-35: rgba(11,22,32,.45);  /* mono system voice, captions, placeholders      */
--ink-10: rgba(11,22,32,.10);  /* hairlines (the standard 1px "border")          */
--ink-6:  rgba(11,22,32,.055); /* softest hairline / quiet separators            */
```
The cool ink is what reads "clinical clean" instead of "literary warm." One ink, alpha-only — Law 2 unchanged. (Note: the cool ladder runs *slightly stronger* than paper-light at each rung — `.92/.80/.65/.45` vs `.90/.70/.50/.35` — because cool ink on near-white needs a touch more weight to hold the same perceived contrast.)

### The accent — trust-blue (one hue, the conversation channel)
```css
--blue:        #007AFF;  /* iOS systemBlue LIGHT — brand blue, sent/AI bubble, primary key */
--blue-dark:   #0A84FF;  /* iOS systemBlue DARK — any dark surface / dark mode */
--blue-press:  #0069e0;  /* :active / pressed key */
--blue-tint:   #e8f1ff;  /* 8% wash — selected chips, focus halos, AI thinking states */
--blue-tint-2: #d6e8ff;  /* 14% — hover on tinted elements */
--blue-ink:    #0b3a78;  /* blue text on white when blue must carry meaning in copy */
```
`#007AFF` / `#0A84FF` are the canonical iOS systemBlue pair — the most-recognized "trust + tappable" blue on earth. **The one-accent law is preserved**: blue is the only hue. It's used more freely than violet was (violet = only the live node; blue = the whole "you/AI" conversation channel), but it is still the *only* color in the system.

> **Token-naming bridge:** the `--blue*` names above are the brand-readable spelling; in [tokens.css](./tokens.css) they are defined as **aliases of the canonical `--live*` role** (`--blue: var(--live)`, etc.), so every recipe class that reads `--live` AND every bubble recipe here that reads `--blue` both resolve. Pick `--blue*` in conversation-channel CSS for legibility; the role (`--live`) is what actually carries the one-accent law.

### Semantic (near-zero frequency — health context demands restraint, not alarm)
```css
--ok:   #28a745;  /* success ONLY; never as a brand/decoration color (the green trap, §4) */
--warn: #e8a317;  /* amber, soft */
--bad:  #e5484d;  /* clear but desaturated red; NEVER for routine notifications */
```
**Rule: never red for routine state.** Red = genuine danger only. Routine "needs attention" = amber or blue.

**Palette discipline (inherited, unchanged):** neutrals carry ~95% of every screen; blue = meaning + the conversation, never decoration; one cool ink does *all* text; no second gray beyond the recess ladder.

---

## 2. THE BUBBLE SYSTEM — the primary surface (this is the product)

The conversation is the main canvas, not a feature. Two bubble identities, mirrored iMessage mechanics, reskinned to brand blue and made into a **data carrier** (§3).

### 2.1 Bubble geometry — exact recipe
```css
.bubble {
  position: relative;
  max-width: 255px;          /* readability cap; raise to 320px for data-card bubbles */
  padding: 10px 16px;        /* iOS uses 10px 20px; 16px reads tighter/modern */
  border-radius: 20px;       /* iOS canonical pill = 25px; 18-20px = the modern/Grok read */
  font-size: 16px;
  line-height: 22px;         /* iOS = 24px; 22 tightens for a denser, calmer feel */
  word-wrap: break-word;
  margin-bottom: 2px;        /* GROUPED (same sender, consecutive) */
}
.bubble.is-last  { margin-bottom: 12px; }            /* last in group → bigger gap + tail */
.bubble + .bubble.new-sender { margin-top: 12px; }   /* sender switch → breathing room */

/* AI / brand / "sent" — TRUST BLUE, right-aligned (the product speaks here) */
.bubble--ai   { align-self: flex-end;   background: var(--blue);     color: #fff; }
/* User / "received" — cool grey, left-aligned (the human) */
.bubble--user { align-self: flex-start; background: var(--recessed); color: var(--ink-90); }
```
> **Decision (hold system-wide, never mix):** for a health AI brand, map **AI/brand = blue (the helpful voice you trust), user = grey.** This deliberately inverts the iMessage "self = blue" instinct so the *brand's* warmth is the blue. Alternative (keep user = blue) is valid too — but pick ONE.

### 2.2 The tail — exact two-pseudo-element recipe
The tail is the warmth mechanic. **Only the last bubble in a group gets a tail** — this grouping rhythm is what makes a thread read as iMessage.
```css
.bubble.is-last:before, .bubble.is-last:after { position:absolute; bottom:0; height:25px; content:''; }
/* AI bubble (blue, right) */
.bubble--ai.is-last:before  { right:-8px;  width:20px; background:var(--blue); border-bottom-left-radius:16px 14px; }
.bubble--ai.is-last:after   { right:-26px; width:26px; background:var(--page); border-bottom-left-radius:10px; }
/* User bubble (grey, left) — mirror */
.bubble--user.is-last:before{ left:-8px;   width:20px; background:var(--recessed); border-bottom-right-radius:16px 14px; }
.bubble--user.is-last:after { left:-26px;  width:26px; background:var(--page);     border-bottom-right-radius:10px; }
```
**Critical:** the `:after` background MUST equal the thread's ground color or the cut-out shows. If bubbles sit on `--canvas`, the `:after` is `--canvas`.

### 2.3 Grouping rhythm (the warmth is in the spacing)
| State | margin | tail? | label? |
|---|---|---|---|
| Mid-group (same sender, more coming) | `2px` bottom | no | no |
| Last in group | `12px` bottom | **yes** | optional, once per group |
| New sender | `12px` top | (its own last gets tail) | label once |

The 2px-vs-12px contrast is the single biggest "this is iMessage, this feels human" signal.

### 2.4 Presence micro-interactions (≤1 whimsy per surface, Law 10)
These map 1:1 onto Johnny's "live things breathe, never flash."

**Typing indicator** (three dots — "AI is thinking"; maps to the 0.12s-stagger grid spinner):
```css
.typing { display:flex; gap:4px; padding:14px 16px; background:var(--recessed); border-radius:20px; }
/* NOTE: a NEW keyframe name (`typing-dot`) — do NOT reuse `blink`. The canonical
   `blink` (02-MOTION §3a/§3h) is opacity-only and drives the "ready" dot; this one
   adds a translateY hop, so naming it `blink` would silently redefine + break that. */
.typing span { width:7px; height:7px; border-radius:50%; background:var(--ink-35); animation:typing-dot 1.4s infinite both; }
.typing span:nth-child(2){ animation-delay:.2s; }
.typing span:nth-child(3){ animation-delay:.4s; }
@keyframes typing-dot { 0%,60%,100%{ opacity:.3; transform:translateY(0); } 30%{ opacity:1; transform:translateY(-3px); } }
```
This 3-dot hop is the ONE deliberate exception to "live things breathe, never bounce" — it is the universally-read "someone is typing" idiom and the hop is ≤3px (a breath, not a bounce); the canonical opacity `blink`/`pulse` stay the default for every other live dot.
Tint the dots `--blue` when the AI is composing a data-rich answer (signals "fetching your data" vs "casual reply").

**Read receipt / delivered** — a tiny mono line under the last sent bubble (`delivered` → `read 9:41`), `--ink-35`, mono, 11px. Maps to Law 8 (mono = system voice). Don't animate — `blur-up` swap the text.

**Tapback / reaction** — long-press surfaces 5–6 reactions in a floating pill bar above the bubble. For health, repurpose tapbacks as **lightweight structured feedback** (👍 helpful / ❓ confused / ‼️ urgent) so a reaction logs *data*, not just emotion — keeping Johnny's "delight must present information" rule. Keep the iMessage gesture (long-press → arc → one lands as a small badge overlapping the bubble corner).

**Streaming text** — AI replies stream token-by-token with a blinking caret; batch tokens in 30–60ms windows to avoid DOM thrash. Maps to `blur-up`: content *develops* rather than hard-cutting.

---

## 3. CONVERSATION AS A DATA SURFACE — the rich-bubble family

A bubble thread that carries **structured, visual data** so it out-densities a wall of text while reading as a calm chat. Each is a "rich bubble" — it lives inside or replaces a bubble. (This is [03-COMPONENTS.md](./03-COMPONENTS.md) §C8 / §C7 / §C5 / §C6 re-housed inside a bubble.)

| Component | Carries | Recipe |
|---|---|---|
| **Plain bubble** | a sentence | §2 |
| **Stat bubble** | one number that matters | the bubble's whole content is a 40px count-up numeral (`--font-num`, weight 340, counts up once over 2600ms) + an 11px mono label below. One datum, maximal abstraction. (= [C7](./03-COMPONENTS.md#c7--animated-metric--report-card-count-up)) |
| **Card-in-bubble** | a structured object | a `--raised` `.ring-card` *inside* a wider bubble (max-width → 320px); ring-shadow depth, no border; title (Onest 450) + 2–3 mono key-value rows ([C10 HeaderRow](./03-COMPONENTS.md#c10--email--document-preview-card-cropped-by-light)). |
| **Chip row** | quick replies / scoped choices | a horizontal row of pill chips below the AI bubble; tap = sends that reply, replacing a free-text turn ([D3](./03-COMPONENTS.md#d3--metadata-chip)). |
| **Visual-answer bubble** | a chart / ring / trend | an inline mini-chart in a card-bubble (a progress ring or 7-day sparkline — a *visual answer* instead of prose) ([C6](./03-COMPONENTS.md#c6--trajectory--proof-chart-thin-line-inline-svg-with-a-threshold-hairline)). |
| **Inline form-bubble** | structured input in-thread | a compact card with 1–2 fields ([A6 input-well](./03-COMPONENTS.md#a6--input-well)) + a blue key; submit stays in the conversation. **This is how we kill the healthcare form** — the form becomes one bubble. |
| **Selector / slider bubble** | refine by direct manipulation | a slider or segmented control ([D2](./03-COMPONENTS.md#d2--segmented-control--mode-chips)) inside a bubble — state intent in conversation, refine by direct manipulation. |

**Prop shapes (for the engineer):**
```ts
type Bubble =
  | { kind:'text';   sender:'ai'|'user'; text:string; group?:'mid'|'last' }
  | { kind:'stat';   sender:'ai'; value:number; unit?:string; label:string; countUp?:boolean }
  | { kind:'card';   sender:'ai'; title:string; rows:{k:string;v:string}[]; accent?:boolean }
  | { kind:'chips';  sender:'ai'; options:{label:string;payload:string}[] }   // quick replies
  | { kind:'chart';  sender:'ai'; chartType:'ring'|'spark'|'bar'; data:number[]; caption?:string }
  | { kind:'form';   sender:'ai'; fields:{id:string;label:string;type:string}[]; submit:string }
  | { kind:'typing'; sender:'ai'; tone?:'casual'|'fetching' };                // tinted blue if fetching
```

**Minimal-text law (the brand's hardest rule):** "show less words always" × "text-first but minimal-chrome" → prefer a chip over a sentence, a stat over a paragraph, a chart over a list. If a turn can be a tap or a number, it must not be a paragraph.

---

## 4. THE TRAP — banning the healthcare cliché ("do NOT look like healthcare")

Healthcare UIs default to soft teal/green, the medical cross, sterile blue-green gradients, heavy forms, stock doctor photography, alarm-red everywhere. To read as a consumer AI product, ban all of it.

### BAN LIST (hard rules)
- ❌ **Teal / mint / medical-green** as a brand or accent. Green appears ONLY as `--ok` success state, never as identity. (Green = the #1 "this is a clinic" tell.)
- ❌ **The medical cross, caduceus, heartbeat-EKG line, stethoscope, pill icons** as decoration or logo. Zero medical iconography.
- ❌ **Teal→green gradients, "calming" blue-green washes.** No gradients at all (also Johnny's ban — see [00-PRINCIPLES.md](./00-PRINCIPLES.md) bans).
- ❌ **Multi-field forms / form-first screens.** Replace with conversational inline-form bubbles (§3). The form is the enemy of the consumer-AI read.
- ❌ **Stock doctor/patient photography, clipboards, clinical-blue-scrubs imagery.**
- ❌ **Red for routine notifications** — false alarm; routine = amber/blue.
- ❌ **Dropdowns-in-dropdowns, cute icons hiding key actions, dark patterns** (healthcare UX sins).
- ❌ **Cold sterile pure-white + pure-black.** Use clinical-clean-*near*-white and cool-*near*-black ink (Johnny: never #000/#fff for text).
- ❌ **Dense dashboards as the home screen.** Home is the conversation.

### What replaces each cliché
| Cliché | Replace with |
|---|---|
| Teal/green | trust-blue `#007AFF` only |
| Medical cross logo | one geometric Grok-style monochrome mark |
| Form screens | inline conversational form-bubbles |
| EKG/heartbeat motif | the typing-dots "presence" pulse (real, not decorative) |
| Clinical photography | white space + one blue conversation |
| Alarm red everywhere | amber/blue; red reserved for true danger |
| Dashboard home | thread home; data arrives as rich bubbles |

---

## 5. GROK / LINEAR / VERCEL MINIMALISM (what makes it feel clean)

The distilled rules — note how each *already matches* a Johnny law:
1. **Monochrome + exactly one accent** → identical to the one-accent law. White + cool-ink + one blue.
2. **Whitespace is air, not emptiness** → matches "huge air outside (≥64px), tight inside (2–14px), nothing between." Keep the bimodal spacing exactly.
3. **Aggressive contrast for hierarchy** → softened to cool-ink-on-white (never pure black), high-contrast intent kept.
4. **Tight, confident, slightly-cold geometric type — no rounded friendly faces** → Onest's in-between weights, leaning its tighter cuts; mono stays the system voice.
5. **Restraint over density in the conversation** → text-first, minimal chrome; thread column caps ~640–720px (65–72 chars/line).
6. **Geometric forms, no cliché ornament** → zero medical iconography (§4).

**The Grok feeling, operationalized:** one bold geometric mark, a single forward-confident accent, vast negative space, near-zero decorative elements, type doing the hierarchy work. Subtract until only meaning remains.

---

## 6. TYPE, DEPTH, MOTION, RADII (Johnny's mechanics, reskinned cool)

**Type** — inherit the split wholesale ([01-TOKENS.md](./01-TOKENS.md) §3): Onest at **340/430/450/480** (never 400/600), headings by size; IBM Plex Mono = the system voice (timestamps, `read`/`delivered`, units, labels — 11–13px, lowercase, tabular-nums); Departure Mono for big numerals. Bubble body = 16px / 22px line-height, Onest 430. Stat numerals = 40px / 340, count-up once. Thread column 640–720px max.

**Depth from light, no borders** — `.ring-card` cool-tuned (the only change is the outer ring goes from warm-black-8% to cool `rgba(11,22,32,.06)`):
```css
.card {
  background: var(--raised); border-radius: 12px;
  box-shadow:
    inset 0 0 0 1px rgba(255,255,255,.9),
    0 0 0 1px rgba(11,22,32,.06),
    0 1px 2px rgba(11,22,32,.04),
    0 4px 12px rgba(11,22,32,.05);
}
```
On a pure-white ground the rings get *slightly* more visible than on warm paper — acceptable; that's the clean-clinical read.

**Radii ladder** — `20px bubble → 16 frame → 12 panel → 8 card → 6 key → 4 chip → full pill`. The bubble sits at the top (softest) because it's the warm primary surface.

**Motion** — one ease, nothing bounces, unchanged. `:active { translateY(1px) }` is the only size change. `blur-up` (`blur(7px)→0`, 420ms) on every content change. ≤1 whimsy per surface — in a thread the whimsy budget is spent on *one* of: the typing-pulse, a single confetti burst, or a stat count-up. **Confetti ONLY on a human's meaningful action** (user completes a care plan, taps confirm) — never on system events or load. Confetti colors: `["#007AFF","#28a745","#0b1620","#0A84FF"]`.

**Buttons = keys** — the composer's send button is a blue key (`--blue`, white top-lip inset, 1px press, `--blue-press` on active). Chips are flat pills (`--blue-tint` selected, `--recessed` idle). One primary key per view.

---

## 7. THE KEEP / ADAPT / BAN TABLE — Johnny's fingerprint → new brand

| Johnny's element | Verdict | New-brand form |
|---|---|---|
| One-accent law | **KEEP** | exactly one hue: trust-blue |
| Depth from light, no borders (ring-shadow) | **KEEP** | same stack, cool-tuned (6% cool outer ring) |
| Mono = system voice | **KEEP** | timestamps, `read`/`delivered`, units, labels in IBM Plex Mono 11–13px |
| In-between weights 340/430/450/480, never 400/600 | **KEEP** | Onest, same weights, size-led hierarchy |
| One ink at alphas, no second gray | **KEEP** | one *cool* ink `#0b1620` at alphas |
| Signature ease `cubic-bezier(.16,1,.3,1)`, nothing bounces | **KEEP** | identical |
| ≤1 whimsy per surface | **KEEP** | one of: typing-pulse / confetti / count-up |
| Confetti only on human approval | **KEEP** | only on user's meaningful confirm |
| Blur-up swap, count-up stat beat, key-press 1px | **KEEP** | reused verbatim |
| Radii ladder, bimodal spacing (≥64 out / 2–14 in) | **KEEP** | + 20px bubble at top of ladder |
| "Shape encapsulates what info asks for" | **KEEP → EXTEND** | becomes the rich-bubble family (each turn a different shape) |
| Conversation-as-data-density / least-text | **KEEP → PROMOTE** | the conversation goes from a component to the primary surface |
| Earning-white discipline | **KEEP → REPURPOSE** | the "active object earns white + glows accent" gesture = the AI bubble lighting up blue |
| Game-mechanic delight (packets, stamps, shimmer) | **ADAPT** | retire wires/packets (no node-graph); keep stamp for consent/confirm; count-up for stats; shimmer optional on the "AI is answering" bubble |
| Warm-paper ground `#f5f5f2`, earning-white `#fff` | **ADAPT** | clinical-clean-white `#fff` is now the *default* ground; warmth moves into the blue bubble, not the paper |
| Warm ink `#262323` | **ADAPT** | cool ink `#0b1620` |
| Violet accent `#6e2bff` (only on live node) | **ADAPT** | trust-blue `#007AFF`; used more freely (the whole AI channel), still the only hue |
| Brand-blue `--ocean` (separate from accent) | **ADAPT** | brand + accent collapse into one trust-blue family; discipline preserved by reserving `--blue-press`/bubble-warmth for the channel |
| Node-graph / loop-canvas / dashed wires / dotted ground | **ADAPT/CUT** | primary surface is the conversation; reserve the canvas vocabulary for an optional "behind-the-scenes" view only |
| Serif brand garnish (once per product) | **OPTIONAL** | likely cut — Grok minimalism prefers one clean geometric mark |
| Borders-as-shadow, gradients, hover-scale, bounce, >1 accent, pure black/white, dark-by-default, motion-that-depicts-nothing | **BAN (inherited)** | unchanged |
| **NEW healthcare bans** | **BAN** | teal/green-as-brand, medical cross/EKG/stethoscope iconography, form-first screens, clinical photography, red-for-routine, dashboard-home, dropdown-in-dropdown |

---

## 8. HOW EACH EXTRACTED COMPONENT RE-SKINS

Every component in [03-COMPONENTS.md](./03-COMPONENTS.md) ports by wrapping in `brand-clean-blue` and applying these swaps:

| Component | Re-skin |
|---|---|
| [A1 raised card/panel](./03-COMPONENTS.md#a1--raised-card--panel--float) | cool-tuned ring (§6); white ground instead of warm paper |
| [A3 crunch key](./03-COMPONENTS.md#a3--the-crunch-key-button) | primary = blue key (`--blue` fill, `--blue-press` active); label still mono lowercase + `→` |
| [B1 conversation rail](./03-COMPONENTS.md#b1--conversation-rail--the-core-conversation-as-data-pattern) | **becomes the home screen, full-width**; user bubble → §2 grey, AI bubble → §2 blue with tail |
| [B2 two-bubble identity](./03-COMPONENTS.md#b2--the-two-bubble-identity-the-warmth-slot) | the warmth slot is now realized: blue AI bubble + open-or-grey user — the iMessage system §2 |
| [C5 score bars](./03-COMPONENTS.md#c5--score-bars-n-axis--verdict) | self-tint via `currentColor`; set `text-[--ok]`/`text-[--blue]`; never red for routine |
| [C6 trajectory chart](./03-COMPONENTS.md#c6--trajectory--proof-chart-thin-line-inline-svg-with-a-threshold-hairline) | inside a visual-answer bubble; blue polyline, dashed threshold hairline, mono numerals |
| [C7 metric card](./03-COMPONENTS.md#c7--animated-metric--report-card-count-up) | becomes the **stat bubble** — count-up numeral fades blue→ink instead of green→ink |
| [C8 beat-cards](./03-COMPONENTS.md#c8--beat-cards--story-as-components--the-conversation--wall-of-text-engine) | becomes **card-in-bubble**; evidence chips → `--blue-tint` pills; reasoning rows in mono |
| [C12 fail-LOUD badge](./03-COMPONENTS.md#c12--fail-loud-badge) | `--bad` (`#e5484d`) ring + band — reserved for true danger only, never routine |
| [D1 step rail](./03-COMPONENTS.md#d1--step-rail--auto-advancing-single-focus-stage--the-flow-engine--the-crown-jewel) | optional, for a guided care-plan flow; "live" dot = `text-[--blue] dash-pulse` |
| [D2 segmented control](./03-COMPONENTS.md#d2--segmented-control--mode-chips) | the **selector/slider bubble**; selected pill = `--blue-tint`, blur-swap dependent copy |
| [D4 autofill bar](./03-COMPONENTS.md#d4--autofill-bar--search-as-launcher--signature) | the composer / onboarding input; mode-ring tinted `--blue` |
| [E4 self-shaping visual](./03-COMPONENTS.md#e4--self-shaping-companion-visual--a-living-illustration-whose-state--your-datas-state) | a calm `data-phase` health motif (a ring filling, a quiet bloom) — NOT an EKG; CSS-morph only |
| [E8 masked backdrop](./03-COMPONENTS.md#e8--fixed-faint-masked-brand-backdrop) | swap the pixel ocean for a soft blue gradient/quiet motif at 0.15 opacity + downward mask |
| [E9 mascot](./03-COMPONENTS.md#e9--the-mascot-the-agent-at-work) | optional quiet motif keyed to "working vs ready"; geometric, not medical |
| [E11 generative-UI receipt](./03-COMPONENTS.md#e11--generative-ui-receipt-renderer-render-a-typed-tree-into-the-design-system) | render structured AI output as rich bubbles, not a chat-card dump — the Grok-minimal generative-UI pattern |

---

## 9. THE PRINCIPLE STACK (the brand's operating laws, ordered)

1. **The conversation is the product.** Home is a thread, not a dashboard or a form.
2. **One blue, one ink, one room.** White ground, cool ink at alphas, trust-blue as the only hue.
3. **Every turn is the right shape.** Number → stat bubble; choice → chips; object → card; input → inline form. Never a paragraph where a shape will do.
4. **Less text, always.** Prefer a tap, a number, a chart. The thread out-densities prose by *changing shape*, not by adding words.
5. **Depth from light, never lines.** No borders; ring-shadows; nothing over 1px.
6. **Mono whispers, Onest speaks.** System facts in mono; human/content in in-between-weight Onest.
7. **Calm presence, not alarm.** Typing-pulse and read-receipts create presence; red is reserved for true danger; ≤1 whimsy per surface; nothing bounces.
8. **It must not look like a clinic.** Every medical cliché is banned (§4); warmth comes from the blue conversation, not from medical-soft palettes.

← Back to the [README](./README.md) · the constitution is [00-PRINCIPLES.md](./00-PRINCIPLES.md) · the bedrock is [tokens.css](./tokens.css).
