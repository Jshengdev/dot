# 03 — COMPONENTS (the catalog)

Every reusable pattern from both the lab study and the shipped product, named generically. Each entry: **structure (DOM) + exact styling recipe + motion + when-to-use**. Grouped by family. This is the bulk of the library — built to compose into any product in the identity.

All entries assume the tokens + recipe classes from [01-TOKENS.md](./01-TOKENS.md) / [tokens.css](./tokens.css) and the keyframes from [02-MOTION.md](./02-MOTION.md). The clean-blue re-skin of each is in [05-NEW-BRAND.md](./05-NEW-BRAND.md).

**The four shells everything composes from** (learn these first):
- **PANEL** — `section.ring-panel.rounded-2xl.bg-raised.p-5` with an `items-baseline justify-between` header row (mono eyebrow left, count/verdict chip right).
- **CHIP** — `pill-emboss rounded-full bg-page px-2 py-[2px] font-mono text-[9px] text-ink-2`; status-colored by swapping the text class. The universal metadata atom.
- **ROW card** — `ring-card flex items-start gap-2.5 rounded-xl bg-white px-3 py-2.5`; a leading dot/chip + a 2-line body (`[12px]` title, `font-mono [9px] text-faint` meta).
- **SEGMENTED CONTROL** — `key-bevel flex items-center rounded-lg bg-page p-0.5 font-mono text-[11px]`; selected = `bg-raised text-ink pill-emboss`, unselected = `text-faint`. `role="group"` + `aria-pressed`.

---

# FAMILY A — SURFACES (cards / panels / rings / keys)

## A1 · Raised card / panel / float
The depth grammar from [01-TOKENS.md](./01-TOKENS.md) §2a. Use `.ring-card` for a content card, `.ring-panel` for a container, `.ring-float` for overlays/dropdowns, `.ring-showcase` for a hero object floating off the page, `.ring-mat` for a big card with a 7px white passe-partout. **When:** any surface that lifts off the page. **Motion:** `.ring-hover:hover` to lift in light (never scale).

## A2 · Recessed board
`.board-recess` — pressed into the page: inner shadow + white light cast *below*. **When:** a sunken staging surface, a track, an empty-state. Pair with `.dotted-canvas` for a recessed pegboard the live content floats on. **Never** give a recessed element a drop shadow.

## A3 · The crunch key (button)
`.btn-crunch` (light) / `.btn-crunch.crunch-dark` (dark fill). 2px white top-lip; `:active translateY(1px)` is the only size change in the system. Primary button = `btn-crunch crunch-dark bg-ink text-page font-mono text-[12px] font-medium`, `rounded-xl`/`rounded-lg`, label **always mono, lowercase, with a `→`** ("say hello →"). Disabled = `opacity-50`, no other change. **Geometry:** micro = 6px radius / 10×4px pad / 0.72rem-480; standard = 41px h / 12px pad / 8px radius.

## A4 · Micro button / pager key
`rounded-[6px] bg-#fbfbf8` + `box-shadow: 0 1px 1px rgba(0,0,0,0.24), inset 0 2px 0 #fff, 0 0 0 1px #e7e7e3`; `transition: background-color 0.14s ease-out`; `:hover { background:#fff }` (hover = earn white). **When:** "View details", prev/next pagers, restore chips.

## A5 · Icon tile / app-icon
23×23px `.ring-card rounded-[6px] bg-white` holding a tiny hand-drawn SVG. The one place a literal brand color may appear (e.g. an envelope's `#d44638` stroke). Use `.key-bevel` for sub-pixel bevel. **When:** mail tiles, app icons, the leading glyph on a card.

## A6 · Input well
`.input-well` recessed text-input look. The ad-hoc inline ring variant lets the ring color vary — middle ring becomes `color-mix(in srgb, var(--bad) 38%, transparent)` on error, or `color-mix(in srgb, var(--ocean) 45%, transparent)` to signal a mode. **When:** any text field; the mode-ring is the "same input physically signals mode" trick.

## A7 · Device frame / app-in-a-window
`.frame` chrome (the lab `.lab-frame` 4px translucent halo), e.g. `rounded-[16px] bg-#f1f1ee p-2`, ~470px tall, holding [canvas + rail] with workspace chrome (a dropdown chip, folder/search icons, a mono breadcrumb with a leaf glyph). All chrome hand-drawn SVG at 0.36–0.95 stroke widths, ink 0.3–0.5α. **When:** the "product-in-a-window" hero shell on a marketing page.

---

# FAMILY B — CONVERSATION (rails / bubbles / chat frames)

## B1 · Conversation rail ★ (the core "conversation-as-data" pattern)
A vertical chat column — tab nav → scrolling conversation → live task rows → ask-input that *spawns new rows*. The gesture: typing a message materializes a new "Queued" task in the stream — conversation and work-state are the same surface.

**DOM:**
```
div.flex.h-full.w-[324px].flex-col  bg-page  p-1 pt-0
├ tab nav   (flex gap-[8.5px] px-2 py-[12px])
└ .ring-panel  (flex-1 flex-col, rounded-[7px], bg-raised, overflow-hidden)
  ├ scrollRef div  (flex-1 overflow-y-auto px-3 pb-2 pt-[10px], scrollbarWidth:none)
  │  ├ UserBubble (right-aligned)
  │  ├ AgentGlyph + paragraph (left-aligned, two ink alphas in one <p>)
  │  ├ TaskRowItem[]  (the live work)
  │  └ extraBubbles[]
  └ form > input-well + dark send key
```
**Data:** `TaskRow = { agent: string; desc: string; state: "running" | "queued" }`. State: `tab`, `extraBubbles: string[]`, `tasks: TaskRow[]`, `draft`.

**Key recipes:**
- **Tabs:** `h-[17px] rounded-[4px] px-[5.7px] text-[10px] font-[450]`. Active = `border border-black/5 bg-black/5 text-ink`; inactive = ghost → darker on hover. `transition-colors duration-150`.
- **User bubble:** right-justified `max-w-[82%] rounded-[8px] px-3 py-[9px] text-[11px] font-[450] leading-[1.5]`, `background: rgba(32,32,32,0.04)`, `border: 0.73px solid rgba(0,0,0,0.06)`. A barely-tinted gray — **this is the slot to inject a saturated bubble color** (see clean-blue).
- **Agent message:** NO bubble — bare paragraph at `text-[11px] leading-[1.6]`, preceded by the 12px AgentGlyph. **Asymmetry is the signature: user = pill, agent = open text.** Emphasis inside via one `<span className="font-[480] text-ink-90">` — one weight + one alpha step up.
- **AgentGlyph:** a "∴" mark — five 2×2px `<rect>`s in a 12×12 SVG at `rgba(38,35,35,0.6)`, center one at `0.2`. The recurring "agent identity" mark.
- **Auto-scroll:** `useEffect` on `[extraBubbles, tasks]` → `el.scrollTo({ top: scrollHeight, behavior: "smooth" })`.
- **Motion:** new rows/bubbles use `.msg-in` (350ms).
**When:** any chat/agent surface where conversation and work-state share a column.

## B2 · The two-bubble identity (the warmth slot)
User = a pill, agent = open ink text. **The user bubble is the one place to inject saturated color** — in paper-light it's a near-invisible `rgba(32,32,32,0.04)`; promoting it to a real fill + white text gives the iMessage warmth while preserving the user-pill/agent-text asymmetry. The full iMessage bubble system (tail recipe, grouping rhythm, rich bubbles) is specified in [05-NEW-BRAND.md](./05-NEW-BRAND.md) §bubbles.

## B3 · Chat frame (the hero composition)
The `.frame` shell (A7) holding a canvas + a conversation rail (B1), with workspace chrome. **When:** the marketing hero that shows the whole product in a window.

---

# FAMILY C — DATA-DISPLAY (status, scores, trajectory, evidence, beats)

## C1 · Task / status row + heartbeat
A horizontal row = `[state indicator] [agent name] [description] [state badge]`. Running rows get a spinner + pulsing badge; queued get a static dot + outlined badge. The gesture: *work has a visible heartbeat.*

`.task-row .msg-in flex items-center gap-2 rounded-[8px] px-[10px] py-2`.
- Running indicator = 8px arc spinner: `<circle r=3.5 stroke=#5d86ee strokeDasharray="12 10">` + `.spin`.
- Queued indicator = `h-[6px] w-[6px] rounded-full bg-#bfbfbf` with `boxShadow: 0 0.58px 0 #fff` (embossed dot).
- Badges: Running = `bg-#dae9fb text-#1d70d9 text-[8px] rounded-[3px] px-[5px]` + `animation: pulse 1.6s`; Queued = outlined `border: 0.6px solid rgba(32,32,32,0.15)`.
- Text steps DOWN by role: agent name 10px/0.85α, description 9px/0.5α, badge 8px.

## C2 · Status group list ("kanban-as-list" — the density pattern)
Tasks grouped by status pill (Ready→Running→Completed→Blocked), each group a labeled pill over a tight list, groups separated by the dashed striped divider. A whole project board in 268px — the literal "a conversation holds more than a wall of text" proof.

**Reusable atoms:**
- `RunSpinner({size=8})` — the universal running arc (stroke `#5d86ee`, `strokeDasharray="12 10"`, `.spin`). *Every* "running" state uses this one component.
- `StatusDot({color, size=6})` — embossed bead: `boxShadow: inset 0 0.83px 0.83px rgba(0,0,0,0.28)` (inner dark = ball depth) + `filter: drop-shadow(0 0.58px 0 #fff)` (white seat). This two-part recipe makes a 5–6px dot read as a physical bead.
- `StatusPill({kind, pulse})` — `rounded-full px-[6.3px] py-[4.2px]`, bg/text from `STATUS_META`, mono label `text-[10px]`. Indicator = RunSpinner if running, else StatusDot.
- `STATUS_META` — the portable taxonomy: `{ ready, running, done, blocked }` each → `{ label, bg, text, dot }`.

## C3 · Floating-card-over-a-row (the visible-wire control)
A 268px card sits over a row of buttons, connected by a **3-segment dashed elbow** (down-stub → horizontal run → down-stub) drawn with positioned divs using `borderLeft/borderTop: 1.2px dashed rgba(38,35,35,0.3)` + `min()/max()` calc to route the elbow to the active column. Clicking a column re-keys the card → `.blur-up` reveal + the elbow re-routes. The big card's signature shadow uses `.ring-mat` (7px white mat + navy-tinted drop). **When:** "this control drives that readout, and you can see the wire." A reusable bound-pair pattern.

## C4 · Agent work card w/ live timer ★
A self-contained chat card (337×447px) showing an agent delegating to subagents, each subagent a row with a **live mono `Xm SSs` timer** and the **active one carrying the shimmer**. Gesture: *delegation is visible and timed; exactly one thing is "live."*

**DOM:** `.ring-panel` → breadcrumb header (`Engineer / Landing Page Updates`, ink 0.5 then 0.9 for the leaf) → `.board-recess` interior → [user pill, agent paragraphs, delegation rows] → input bar.
- `SubagentRow` = `.ring-card ml-[26px]` (indented for hierarchy) holding Glyph + name + GridSpinner + live timer. Timer = `useState(startAt)` + `setInterval(+1,1000)`, `fmt(t)=`${m}m ${ss}s``. `active` prop adds the shimmer band.
- `GridSpinner` = 3×3 grid of 1.5px squares, each `animation: grid-cell 1.4s ease-in-out ${i*0.12}s infinite`.
- User pill here uses a `.user-pill`: gradient floor + `0 0 0 2.94px rgba(232,231,230,0.32)` mat ring.

## C5 · Score bars (n-axis) + verdict
N axes as `.bar-track`/`.bar-fill` rows in a `grid grid-cols-[110px_1fr_38px]` (label · bar · value); `ok = value >= threshold` flips good/bad coloring (set `text-good`/`text-bad` on the wrapper, the bar self-tints via `currentColor`). A verdict pill (`✓ emit` / `↺ regen`). **When:** any multi-axis evaluation readout. Bar width animates `transition-[width] duration-700 ease-signature`.

## C6 · Trajectory / proof chart (thin-line inline SVG with a threshold hairline)
A tiny inline SVG line chart (e.g. 240×56 or 260×92) plotting a metric per step: a dashed threshold line (`.70`), a 1px polyline through real values (`vectorEffect="non-scaling-stroke"`), red/green points, label badges (`g{n} ⊘{flags}`), all numerals in `--font-numeral`. Re-renders `.blur-up` keyed on count. **When:** a trajectory/history readout under a primary visual. The dashed-threshold-hairline + numerals-over-points is the canonical "is it above the bar?" chart.

## C7 · Animated metric / report card (count-up)
A ~270px KPI card whose hero number **counts up** and whose bar **grows** when scrolled into view. Gesture: *the number earns itself on entry.*
- Count-up: `IntersectionObserver({threshold:0.4})` → rAF over `2600ms` with `easeOutQuint(t)=1-(1-t)^5`, `setRate(round(ease*target))`.
- Hero number `text-[40px] font-[430]` painted with gradient text-clip: `backgroundImage: radial-gradient(... rgba(111,167,81,.8) 0%, rgba(38,35,35,.8) 100%)` + `WebkitBackgroundClip:text; color:transparent` — fades from green (good) into ink.
- Glowing bar: track `h-[33px] rounded-[4px] bg-page`; fill insets 3px, animates `width` over `2600ms cubic-bezier(0.22,1,0.36,1)`. Fill = `linear-gradient(269deg,#b5e999,#99e99d)` + `boxShadow: 0 1px 1px rgba(115,163,89,0.7), 0 0 0 1.3px #aae48b, inset 0 1px 0 #fff` (a candy/gel bar).
- `DeltaPill({value, dir})` — up=`#dff0d5`/`#6fa751`, down=`#f0ddd5`/`#a76451`, arrow SVG rotated 180° for down.
- Hatched "unopened/remaining" legend swatch: `repeating-linear-gradient(-45deg, rgba(108,103,96,.4) 0 .4px, transparent .4px 1.4px)` over `#e7e7e3`.

## C8 · Beat-cards ★ (story-as-components — the "conversation > wall of text" engine)
Parses a headed story into a **vertical stack of titled beat-cards**; falls back to plain text if headers absent. **The most valuable least-text component.**
- Each card: `.ring-card rounded-xl bg-white` with a numbered mono header chip (`.pill-emboss` + numeral + lowercase header), then `text-[12.5px] leading-[1.75]` body.
- Motion: `.beat-rise` staggered by `animationDelay: i*130ms`.
- **Inline enrichment:** `[signal_type]` tokens → small `.pill-emboss` evidence chips (brackets stripped, `data-testid="evidence-chip"`); `⟶ what this means:` segments → indented quiet reasoning rows (`pl-4 font-mono text-[10.5px]` ink@60%); flagged claims wrapped red via a `highlightClaims(text, claims)` helper that wraps exact-substring matches in `<mark className="claim-bad">`.
- Props: `{ story, claims?, maxHeight?, dense? }`; scrolls with `.quiet-scroll`.
**When:** any time model/long text should become a stack of cards with inline data chips. Port the parse → beat-card → inline-chip pipeline; swap the header set.

## C9 · Evidence chips + provenance row
Source rows (`.ring-card bg-white`), each: a `classify()`-derived source chip (a `person` chip gets `text-live`), detail text, and a meta line (`signal_type` + truncated URL + numeral strength + an honesty flag like "cached · degraded-safe"). **When:** any "here's where this came from" list. The source-chip + provenance-honesty row is reusable for any grounded/cited UI.

## C10 · Email / document preview card (cropped by light)
A faux-artifact card — app-icon tile, hairline key-value rows, body copy that **fades to nothing at the bottom**. Gesture: *a real artifact, cropped by light.*
- `HeaderRow({label, name, addr})` — a 2-col baseline grid `gridTemplateColumns: "112px 1fr"`, `py-[14px]`, `borderBottom: 1px solid rgba(0,0,0,0.07)`. Label 10px/0.5α, name 480/0.85α, address `ml-3`/0.5α. The canonical key-value row.
- Bottom fade: an absolute `h-[50px]` div, `background: linear-gradient(to top, var(--raised), transparent)` matched to the card ground — the reusable "content continues" crop.
- Body copy uses **ink alpha to encode importance**: hook at 0.7α, the pitch paragraph drops to 0.45α.

## C11 · Status-annotated list (generic rows-panel)
A list where each row's `right` is a ReactNode — so a row can hold a RunSpinner + "sending · 34", a StatusDot + "sent · 81", or plain text. **When:** any list that needs per-row live status without a new component per state.

## C12 · Fail-LOUD badge
A visible failure band: `.dash-pop`, `--bad@7%` bg, `--bad@55%` ring, `role="alert"`, mono uppercase "FAILED · {stage}" + the error. **No silent stubs — failures are visible + logged.** **When:** any error/degraded state. The instant-red-on-catch gesture (a flagged claim landing) uses the same red ring + a red band the moment the flag set is non-empty.

## C12b · Inline flagged-claim mark ★ (the grounded-claim primitive — "render the instant a flag lands")
An **exact-substring `<mark>`** wrapped around any claim with no source — the inline, in-prose version of the fail-loud gesture. The reusable pattern for any grounded/cited/verified UI (a health AI flagging an unsupported statement in its own answer reuses this verbatim). Paired with the `highlightClaims(text, claims)` helper (C8) that wraps exact matches; the mark animates in with `dash-pop` the moment the flag set is non-empty. **The recipe (verbatim from the shipped product — the inline counterpart to a colored hairline, not a box):**
```css
.claim-bad {
  color: var(--bad);
  background: color-mix(in srgb, var(--bad) 7%, transparent);   /* faint red wash */
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--bad) 35%, transparent);  /* 1px red ring, not a border */
  border-radius: 3px;
  padding: 0 3px;
  text-decoration: none;
  animation: dash-pop 0.45s var(--ease-signature) both;          /* pops in on the catch */
}
```
**When:** any inline "this token is unsupported / unverified / out-of-policy" mark inside running prose. Note the discipline: the flag is a 7% wash + a 1px `color-mix` ring (Law 1 — the "outline" is light/color, never a real border), and it `dash-pop`s in (Law 9 — the motion depicts the verdict *landing*). Clean-blue: keep `--bad` (`#e5484d`) for true-danger flags only; for routine "needs your confirmation" use a `--warn` or `--live`(blue)-tinted variant of the same recipe.

## C13 · Event ticker (system-voice log)
Last N ws/events newest-first in `font-mono text-[10px]`, `▸` on the newest, red on failures. **When:** "make the seam visible" — a quiet log proving the system is doing real work.

---

# FAMILY D — NAVIGATION (step rail, chips, toggles, autofill bar)

## D1 · Step rail + auto-advancing single-focus stage ★ (the flow engine — the crown jewel)
The run rendered as N discrete steps as a **step rail + one focused stage at a time**, auto-advancing as real events land. Full flow semantics in [04-FLOW.md](./04-FLOW.md); the component shape:
- **Step rail:** `nav.ring-panel` → `ol.flex.flex-wrap` of pill buttons. States: `active` (white pill + `dot-glow text-live dash-pulse`), `done` (`text-good` dot), `live` (`text-ocean dash-pulse`), `todo` (25%-opacity dot), `skipped` (`line-through`). A force-colored "catch"/error tab is `text-bad`. Separators are `→` glyphs.
- **Layout:** `grid lg:grid-cols-[1.7fr_1fr]` — the **stage panel** (`key={shownId}` + `.stage-enter`, `min-h-[320px]`) on the left, a **persistent companion visual** on the right. The `key` re-mount triggers `stage-enter` on every step change.
- **The DWELL map** (ms a step holds before auto-advance, so each completes *visibly*): e.g. `{ gather:7200, person:3400, draft:3800, catch:5400, fix:3800, approve:1100, report:0 }`.
- **Monotonic `furthest`** computed purely from real run data; `shown` auto-walks toward it via a `setTimeout` honoring elapsed dwell; `pinned` lets a user click back without the walk fighting them; the human-decision step **always un-pins** so it surfaces; clean-path steps can be `skipCatch`-skipped (shown `line-through`).
**When:** any multi-stage async process you want narrated calmly. This is the transferable IP.

## D2 · Segmented control / mode chips
The SEGMENTED CONTROL shell (top of file). Tab chip active = `.ring-card bg-white` (or `pill-emboss bg-raised`), inactive = ghost text `hover:bg-black/[0.04]`, `font-[440/450]`. The dependent copy below uses `key={mode}` + `.blur-up` so it **blur-swaps on toggle**. **When:** any 2–4 way mode/lens pick.

## D3 · Metadata chip
The CHIP shell. `.pill-emboss rounded-full bg-page px-2 py-[2px] font-mono text-[9px]`; status via swapping the text class (`text-good`/`text-bad`/`text-warn`). **When:** any inline tag/count/category.

## D4 · Autofill bar / search-as-launcher ★ (signature)
ONE input that autocompletes against a curated catalog, plus a segmented mode control. Gesture: typing *feels* like open input but routes to hand-picked states; selecting an entry invisibly sets everything (no tabs, no advanced fields visible).
- **DOM:** `div.ring-card.flex.items-stretch.gap-2.rounded-2xl.bg-raised.p-2` wrapping `[input.rounded-xl.bg-white.px-4.py-3] + [button.btn-crunch.crunch-dark.bg-ink]`. Below: absolutely-positioned `ul.ring-float.bg-white.rounded-xl.p-1.5` at `top-[calc(100%+6px)] z-30`; each suggestion `flex items-baseline justify-between` with a label (`text-[13px] text-ink`) + mono domain sub (`text-[9.5px] text-faint`) + a category `.pill-emboss` chip; highlighted row = `bg-page`.
- **Input ring** is inline; mode-signal via the middle ring becoming ocean-tinted (`0 0 0 1px color-mix(in srgb, var(--ocean) 45%, transparent)`).
- **Keyboard:** full ↑/↓/Enter/Escape nav (`hi` highlight index); Enter picks highlighted or fires; click-away closes via a document `mousedown` listener.
- **Props:** `{ busy, research, onRun(RunRequest), onPick(entry|null) }`.
**When:** an entry page that should feel like one open input but route to curated demo/real states.

## D5 · Floating pager
A `.ring-panel absolute bottom-0 left-1/2 -translate-x-1/2` docked at a card's bottom edge: icon tile + label + a `h-[16px] w-px` hairline separator + prev/`page+1/N` (mono)/next micro-buttons (A4). **When:** cycling items inside a tabbed artifact card.

## D6 · Corner mode-light
A fixed tiny always-present toggle (`left:16px bottom:14px z-40`), mono `10px tracking-0.1em`. A 7px dot: OFF = `--ink-10` flat with a faint inner highlight; ON = `--ocean` with a **two-ring halo** (`0 0 6px ocean@70%, 0 0 14px ocean@40%`). Color transitions on the signature ease. **When:** a persistent state indicator that glows the brand color when armed.

---

# FAMILY E — HERO / VISUAL (spiral, birds, ocean backdrop, find-cards, canvas)

## E1 · Iterative spiral ★ (time/iteration as a navigable reel)
A scroll-driven 3D helix of cards. Page scroll → continuous focus index → cards arc through focus (sharp, scaled-up) and blur/dim as they recede. Each card is an iteration, so scrolling walks the evolution.
- **Scroll→focus:** `progress = clamp(-rect.top / (offsetHeight - innerHeight))`, `target = progress*(n-1)`. Wrapper height = `100 + n*55vh` (`VH_PER_ITEM=55`).
- **Frame-rate-independent lerp:** `k = 1 - (1-smoothing)^(dt*60)`; `focus += (target-focus)*k`. Identical scrub at 60/120Hz.
- **Per-card transform:** helix — `rotateY(angle) translateZ(radius)`, `translateY(rel*stepY)`, **billboards the focus card** (`counterTilt = -cameraTilt*0.85*focusT`), scales by `focusScale`, blurs by `entryBlur*norm²` (capped 14px), dims by `entryDim`, opacity-fades the far side by `depthFade`. `PERSPECTIVE_PX=1200`.
- **Perf discipline (the taste signature):** params read from a `ref` each frame (zero React re-renders during scroll); writes diffed against `prev*` strings (DOM touched only on change); rAF paused via IntersectionObserver + `visibilitychange`; `will-change: transform, filter, opacity`.
- Card: `.sp-card { border-radius:14px; box-shadow: 0 0 0 1px var(--sp-card-ring), 0 30px 60px -30px rgba(0,0,0,0.55); }`. Caption gradient overlay `linear-gradient(transparent, rgba(5,5,8,0.72))` revealed near focus (`opacity = focusT*2-1`).
- **Params schema** `SpiralParams` (15 knobs: radius, pitch, itemsPerTurn, cameraTilt, cameraDist, focusScale, entryBlur, entryDim, depthFade, smoothing, card w/h, …) + `SpiralItem = { id, title, meta, src? | (tone? + caption?) }`. The **params-table-drives-both-render-and-control-panel** pattern (E6) is highly reusable.
- Keyboard `←/→` steps to neighbor; click a card → smooth-scrolls focus to it. **Reduced-motion or ≤768px → a clean indexed `<ol>` fallback.**
- **Note:** the spiral study runs on its OWN dark palette with a violet accent — themeable via `[data-theme="paper"]` swapping every `--sp-*` var. A flat 2D trajectory chart (C6) is the lighter reference when you don't need 3D.

## E2 · Radial org canvas (a living system diagram)
N node-cards on a dashed ring with radial spokes; **packet dots travel the wires** (SMIL `animateMotion`, staggered, alternating direction); center = a serif anchor word under a pixel-mark; ghost placeholder slots float at the edges. Gesture: *a living system — data is moving.*
- Geometry (portable): `pt(deg,r)={x:C+r·cos, y:C+r·sin}`, `C=260`, ring `r=204`, spokes `r 35→183`, `520×520` viewBox.
- Dashed ring `stroke rgba(0,0,0,0.10) strokeWidth=1`; spokes `strokeDasharray="4.5 4.5"`; endpoint nodes = 2.5px circles `fill=#f5f5f2`.
- Packet dots: see [02-MOTION.md](./02-MOTION.md) §3n.
- Node card = `.ring-card w-[70px] rounded-[6.6px] bg-raised`, positioned by `left:(p.x/520)*100%`.
- `CanvasCluster` — a count chip anchored `-top-[24px]` above a node showing ready/running/done tallies; the "ready" dot blinks (`blink 2s`).

## E3 · Loop / pipeline canvas (the watchable typed-node graph)
N node chips on an SVG (e.g. 1000×214), a dashed main wire + a curved regen back-edge + a parallel fork, packet dots animated along bezier paths via rAF (`easeInOut`, 600ms forward / 850ms regen); only the live node gets white+accent+shimmer (`.node-chip[data-live]`). Reusable diagram primitives: `wire-march` marching-dashes (§3m) and packet-along-bezier (§3n). **When:** visualizing a pipeline/state-machine as a watchable graph.

## E4 · Self-shaping companion visual ★ (a living illustration whose state = your data's state)
An SVG figure that *grows/prunes/blooms* to mirror a run, driven entirely by a `data-phase` attr; all morphs are **CSS transitions on `--ease-signature`** (no JS animation). A `PRUNE_BEAT_MS=1700` holds a transitional state before a change lands. Underneath: real verdict chips (one per step, click to open an explorer), a phase-colored caption, and a thin-line proof chart (C6). **When:** a persistent right-rail visual that narrates the same state as the focused stage (pairs with D1). The metaphor (plant, organism, etc.) is product-specific — the *declarative `data-phase` + CSS-morph* mechanism is portable.

## E5 · Find-cards popping ★ (makes "gathering" feel like the internet)
Find-cards pop in on a timed cadence (`POP_MS=620`), staged decoration first, then real signals appended.
- Cards `find-pop` in one-by-one on an **elapsed-since-run-start** clock (`Math.floor((now-startedAt)/620)+1`) so collapsing/re-expanding never loses cards. A trailing "still looking…" tile (`dotted-canvas board-recess` + `dash-pulse` ocean dot) sits at the end while more are due.
- DOM: header eyebrow + count, then `grid sm:grid-cols-2 gap-2` of `find-pop ring-card bg-white rounded-xl` rows: a **favicon-ish dot** whose color hashes deterministically from the URL (a 5-color palette + `charCodeAt` hash) + a `text-[12px]` line + a meta row (`.pill-emboss` source chip + truncated URL + `kept ✓`).
**When:** any "discovery/scraping/searching" moment. The timed-staggered-cards-on-an-absolute-clock + deterministic-color-from-string are both directly portable.

## E6 · Live designer control panel (the knob rail)
Johnny's controls always look identical: a ~252px right-docked, `backdrop-blur(14px)`, hairline-bordered rail rendered from a **knob table** (number+range per knob, toggles), ending in a **"copy params · json"** button (`JSON.stringify(params)` → clipboard, making any tuned look portable). Same grammar for the spiral (`SpiralControls`) and texture passes (`tx-panel ≈ sp-panel`). **When:** any tunable visual — make tuning a first-class, portable act.

## E7 · Reusable canvas treatment (the "pass" architecture)
A treatment = a **class with `resize()` / `apply(src,dst,time,dpr,params,frozen)`** decoupled from any subject (subjects draw into an offscreen canvas; the pass composites). Prove it's reusable by running the same params on 2+ subjects (a hero + a proof-strip). Perf: dpr capped at 2, rAF paused offscreen/hidden, params via ref, deterministic `mulberry32` PRNG so scrubbing is stable, reduced-motion renders one frozen frame. **When:** a procedural texture/effect as the "AI-medium" texture (e.g. a CRT/glitch pass). Less relevant to a clean brand, but the architecture lesson (treatment decoupled from subject + the same knob-rail) is portable.

## E8 · Fixed faint masked brand backdrop
A fixed, faint, downward-masked brand image band content floats over at z-10:
```css
.ocean-band { position:fixed; top:0; left:0; right:0; height:240px; z-index:0; pointer-events:none;
  background-image:url("/brand/ocean.png"); background-size:cover; background-position:center top; opacity:.15;
  mask-image: linear-gradient(to bottom, #000 0%, #000 45%, transparent 100%); }
.sky-layer  { position:fixed; top:0; left:0; right:0; height:240px; z-index:0; pointer-events:none; overflow:hidden; }
```
**When:** warmth/texture without competing with the UI. Swap the image for a soft brand gradient or quiet motif at the same 0.15 opacity + downward mask.

## E9 · The mascot (the agent at work)
A tiny `aria-hidden` motif whose two states **mean** something (running vs idle). Frame-flips a wing cycle (3 SVG frames toggled every `FRAME_MS=280` while active; idle pins the coasting frame). Keyframes `bird-fly` (crosses while active) / `bird-bob` (bobs when idle) — see [02-MOTION.md](./02-MOTION.md) §3p. **When:** a characterful "working vs ready" indicator. Frame-flipping is a cheap, charming animation technique.

## E10 · Section wrapper + provenance caption
`LabSection({index,name,source,ground,children})` — a study section with a mono caption `{index} · {name} — {source}` over its true ground. The "label every artifact with its provenance in mono" convention. Pure-CSS blocky decor (e.g. `PixelClouds`: 9px white blocks in run-length rows + tiny white waveform bars) appears only on a saturated hero ground — the "draw it fresh in divs, no assets" ethos. **When:** documenting iterations, or a marketing page that captions its own components.

## E11 · Generative-UI receipt renderer (render a typed tree into the design system)
Fetch a model-emitted layout string, parse to an AST, render through a **paper-light component library** (not a chat card) via a `switch(node._component)` mapping AST nodes → components (a shell, verdict-row ledgers, expandable evidence accordions, vertical bar charts, tabbed slides with `.blur-up` on switch). Falls back to building the same components from real run data if the render node hasn't produced one — failures shown, never silent. **When:** Grok-style minimal generative UI — render structured model output into real components, not a chat bubble.

## E12 · Ghost placeholder card
`#ecece9` fill, a faint ring, no content — sketches "more exists" without competing. **When:** empty slots / "fog-of-war" that should blur-up into real content rather than show literal darkness.

---

# COMPOSITION RULES (how these assemble)

- **One hero element per view.** One big numeral OR one canvas OR one report; everything else is 8–11px supporting cast (use ghost cards E12 for "more exists").
- **Every dense panel earns a lowercase mono purpose label** (the eyebrow on the PANEL shell).
- **Dashed wires = relation; dotted grounds = work-canvas; ringed endpoints used consistently** across E2/E3.
- **Cards hug content** (no full-bleed); **radii ladder** 16→12→8→6→4→pill always.
- **Exactly one live thing** per surface (the shimmer/spinner/pulse/focus is on precisely one element).

→ Next: [04-FLOW.md](./04-FLOW.md) for how these compose into the three-act experience.
