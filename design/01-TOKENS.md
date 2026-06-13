# 01 — TOKENS (the complete value system)

The exact palette, depth recipes, type, spacing, and radii. Every value is reimplementation-grade. The compiling sheet is [tokens.css](./tokens.css); the *why* is in [00-PRINCIPLES.md](./00-PRINCIPLES.md); the components that consume these are in [03-COMPONENTS.md](./03-COMPONENTS.md).

**Two skins, one structure.** This doc leads with the **paper-light original** (warm gray, violet accent, ocean brand-blue — the proven `sayhello` grammar). The **clean-blue adaptation path** is noted inline at each token group and built out fully in [05-NEW-BRAND.md](./05-NEW-BRAND.md). The *structure* (grounds ladder, ink alpha ladder, one-accent, depth recipes, radii rhythm) never changes; only the values do.

> **Naming convention note.** The proven canon used namespaced vars (`--ui-*`, `--vx-*`, `--lab-*`). The shipped product collapsed these to clean unprefixed product names (`--page`, `--ink-90`, `--live`) bridged to Tailwind via `extend.colors`. **Carry the unprefixed naming forward** — never let a component author pick a raw hex; they pick a *role*.

---

## 1. COLOR PALETTE

### 1a. The neutral ground ladder (5 paper levels — the most reusable token group)

A warm paper-gray world judged by distance from the page. White is *earned* (Law 7), reserved for the single live/focal object.

| Token | Value | Role |
|---|---|---|
| `--page` | `#f5f5f2` | the page + most component fills (the default ground) |
| `--raised` | `#fbfbf8` | cards that sit "up" one level (off-white, warmer than page) |
| `--white` | `#ffffff` | **earning-white** — the highest surface, the ONE live/focal element only |
| `--canvas` | `#f1f1ee` | node-canvas ground (the dotted backdrop) |
| `--recessed` | `#e7e7e3` | recessed grounds — boards, bar tracks, pressed-in zones |
| `--dot-ground` | `#f2f2ef` | dotted-canvas fill (one step lighter than the recess it floats in) |
| `--dot` | `#dbdbd8` | the ~1px dots themselves |

**The elevation rule:** the brightest pixel is meaningful, not default. Everything lives in the off-white-to-recessed range; white is promoted only at peak elevation/active state.

> **Clean-blue path:** cool the warmth toward true white — `--page #ffffff`, `--raised #fbfcfd`, `--canvas #f6f8fa`, `--recessed #eef1f4`. Keep the 5-level elevation logic exactly. Note the inversion: in clean-blue, white becomes the *default* room and warmth moves into the blue conversation bubble, not the paper.

### 1b. The ink alpha ladder (ONE color, six alphas — does ALL text + hairlines)

Base ink: **`#262323`** = `rgb(38, 35, 35)` — a warm near-black with a red bias, NOT pure `#000`. It appears ONLY through opacity.

| Token | Value | Role |
|---|---|---|
| `--ink` | `#262323` | the base (rarely solid; icons + dark-key fill use `#202020`) |
| `--ink-90` | `rgba(38,35,35,0.9)` | primary text |
| `--ink-70` | `rgba(38,35,35,0.7)` | secondary text / body / card titles |
| `--ink-50` | `rgba(38,35,35,0.5)` | muted text + mono meta labels |
| `--ink-35` | `rgba(38,35,35,0.35)` | faint labels, disabled, ghost |
| `--ink-10` | `rgba(38,35,35,0.1)` | hairlines (the standard 1px "border") |
| `--ink-6` | `rgba(38,35,35,0.055)` | softest hairlines / quiet row separators |

> **Evolution note:** the lab/vortex era had a 5-stop ink ramp (`.9/.85/.7/.5` + solid `#202020`) with `--hair`/`--line` as separate tokens. The shipped product formalized a clean **6-alpha ladder** (`.9/.7/.5/.35/.1/.055`) and made it the single source for both text AND lines. Carry the 6-alpha ladder forward — it's cleaner.

> **Clean-blue path:** swap to a cool near-black `--ink #0b1620` = `rgb(11,22,32)` and re-derive the ladder (`.92/.80/.65/.45/.30` + hairlines). The cool ink is what reads "clinical clean" instead of "literary warm."

### 1c. The accent rule (how many, when)

- **ONE primary accent**, used ONLY on the active/executing element.
  - Paper-light: `--live: #6e2bff` (violet) → `--live-soft: color-mix(in srgb, #6e2bff 10%, transparent)`.
- Applied as: the focus ring on the live element, the `::selection` background (at the soft 10% mix), and the `:focus-visible` outline. **Never as a large fill.**

> **Clean-blue path:** `--live: #007AFF` (iOS systemBlue light) / `--live-dark: #0A84FF` (for any dark surface). In clean-blue the accent is used more freely (it carries the whole AI conversation channel) but is still the only hue in the system.

### 1d. The brand-blue layer (the precedent for a separate brand color)

The shipped product **added a second blue** distinct from the accent. This is the precedent for keeping "brand identity color" separate from "active-state accent" so the live cue never gets lost in brand chrome.

| Token | Value | Role |
|---|---|---|
| `--ocean` | `#1970d1` | THE brand blue. Wire pulses, the bird/mascot, the research-light glow ride this. **Violet stays only on the executing node; ocean carries the brand identity.** |

Sibling blues from the lab/vortex variants (the "active/connector" role color):
`--lab-sky #1a6fd1`, `--lab-blue #29bcff`, `--gate-auto #2f6df0`.

> **Reusable insight:** the system supports a **two-blue split** — a saturated brand-blue for ambient moments, and a separate single accent for *active state*. Keep them distinct. In clean-blue, the brand-blue and the accent collapse into one trust-blue family, but the *discipline* (brand color ≠ live cue) is preserved by reserving a deeper press-tone and the iMessage-bubble warmth for the conversation channel specifically.

### 1e. Status colors (low-chroma, readable on paper)

| Token | Value | Role |
|---|---|---|
| `--good` | `#1f7a4d` | success / grounded / approved |
| `--warn` | `#b5751a` | caution |
| `--bad` | `#c8241a` | error / the loud-fail state |

Tinted-pill palette (status fills with mono text inside — bg + text pairs):
```
good:  bg #dff0d5  text #5d9342
bad:   bg #f0ddd5  text #a76451
warn:  bg #f0e7d0  text #9a7a3f
run:   bg #dce6f6  text #4a6bc8
```
Lab-era status pairs (each = {bg tint, text}): `run #d5e7f7/#4b4a8b · ready #efe3cd/#8b614a · done #d7edd0/#3f8743 · blocked #f2dede/#b0473c`.

> **Clean-blue path:** desaturate further. `--good #28a745`, `--warn #e8a317`, `--bad #e5484d`. **Rule for any health/consumer brand: never red for routine state** — red is true-danger only; routine "needs attention" = amber or blue.

### 1f. The gate vocabulary (optional, domain-specific)

A 4-color semantic system for "who acts" (carry only if the product has a human/automation distinction):
```
--gate-human:  #d0421b   /* kept human */
--gate-auto:   #2f6df0   /* system runs it */
--gate-hybrid: #6e2bff   /* prep + confirm */
--gate-master: #b58900   /* master-only */
```

### 1g. Confetti palette (the celebration colors)
```
["#6e2bff", "#1f7a4d", "#131c2e", "#b58900"]   /* accent, good, deep-ink, master-gold */
```
(Clean-blue: `["#007AFF", "#28a745", "#0b1620", "#0A84FF"]`.)

---

## 2. THE DEPTH SYSTEM (box-shadow recipes, verbatim)

**The universal formula:** `1px white inset ring` (top-lip highlight) + `1px ~8% black outer ring` (the "border" that isn't) + a stack of 1–6% blurs (the cast shadow). Memorize this; everything is a variation. Zero `border:` declarations for structure (Law 1).

The recipe pattern: elevation = `inset 0 0 0 1px #fff` + `0 0 0 1px rgba(0,0,0,0.08)` + N soft drops where blur grows and the higher the float the bigger the throw (chip 12px → showcase 36px). To make something *recessed*, flip it: inner dark shadow + white drops appearing *below* the element. Sub-pixel values (0.357px, 0.56px, 1.47px) are deliberate hairlines that survive retina downscaling.

### 2a. Raised surfaces (cards lifting OFF the page)

```css
/* CARD — the workhorse raised card (lab: .lab-chip / product: .ring-card) */
.ring-card {
  box-shadow:
    inset 0 0 0 1px #fff,              /* white top-lip */
    0 0 0 1px rgba(0, 0, 0, 0.08),     /* the "border" that's actually light */
    0 4px 12px rgba(0, 0, 0, 0.06);    /* the cast shadow */
}

/* PANEL — larger surfaces, a deeper layered blur stack (lab: .lab-panel / product: .ring-panel) */
.ring-panel {
  box-shadow:
    inset 0 0 0 1px #fff,
    0 0 0 1px rgba(0, 0, 0, 0.08),
    0 0 14px rgba(0, 0, 0, 0.04),      /* ambient halo */
    0 16px 20px rgba(0, 0, 0, 0.01),   /* layered drops: blur grows, distance shrinks */
    0 7px 14px rgba(0, 0, 0, 0.02),
    0 2px 8px rgba(0, 0, 0, 0.03);
}

/* FLOAT — floating overlays (dialogs, popovers, dropdowns): same grammar, deeper drop */
.ring-float {
  box-shadow:
    inset 0 0 0 1px #fff,
    0 0 0 1px rgba(0, 0, 0, 0.08),
    0 0 14px rgba(0, 0, 0, 0.05),
    0 24px 40px -20px rgba(32, 32, 32, 0.3);
}

/* HOVER — lift in LIGHT, never size (note the outer ring 0.08 → 0.10) */
.ring-hover:hover {
  box-shadow:
    inset 0 0 0 1px #fff,
    0 0 0 1px rgba(0, 0, 0, 0.1),
    0 14px 26px -14px rgba(32, 32, 32, 0.28);
}

/* SHOWCASE — a hero object floating off the page (lab: .lab-showcase), 36px throw */
.ring-showcase {
  box-shadow:
    0 0 0 1px rgba(0,0,0,0.08),
    0 0 20px rgba(0,0,0,0.03),
    0 36px 28px rgba(0,0,0,0.02),      /* the big lift */
    0 25px 25px rgba(0,0,0,0.02),
    0 15px 15px rgba(0,0,0,0.02),
    inset 0 0 0 1px #fff;              /* white ring LAST so it stays crisp */
}
```

**The big-card "passe-partout" variant** (a 7px translucent-white mat + a navy-tinted drop — warmth/coolness baked into shadows):
```css
.ring-mat {
  box-shadow:
    inset 0 0 0 1px #fff, 0 0 0 1px rgba(0,0,0,0.10),
    0 0 0 7px rgba(255,255,255,0.22),   /* the 7px white mat */
    0 24px 40px rgba(0,16,64,0.18);     /* drop tinted navy, not black */
}
```

### 2b. Recessed surfaces (pressed INTO the page)

The signature inversion: faint inner ring/shadow + **white light cast BELOW** (light comes from above, so a recessed thing throws white light out its bottom edge):

```css
/* product: .board-recess */
.board-recess {
  box-shadow:
    inset 0 0 0 1px rgba(17, 17, 17, 0.05),
    inset 0 1px 2px rgba(17, 17, 17, 0.05),
    1px 2px 2px #fff,                   /* ← the white under-light (the signature) */
    1px 4px 5px #fff;
}

/* lab: .lab-board — sub-px hairline allowed here; inverted white drops below */
.lab-board {
  border: 0.56px solid rgba(32,32,32,0.2);
  box-shadow:
    0 36px 18px rgba(255,255,255,0.03),
    0 20px 16px rgba(255,255,255,0.02),
    inset 0 1.12px 0 rgba(255,255,255,0.25),
    inset 0 1.47px 8.8px rgba(0,0,0,0.03);   /* inner shadow = sunken */
}
```

### 2c. The live/focal element (white + accent ring + accent glow)

"This is executing" reads per the thin-line law — ONE 1px accent ring, presence from a soft blurred accent glow (a 3px ring read ~1.5px at zoom and looked clumsy):

```css
.node-chip { background: var(--page);
  box-shadow: inset 0 0 0 1px #fff, 0 0 0 1px rgba(0,0,0,.08), 0 2px 6px rgba(0,0,0,.05);
  transition: box-shadow .3s var(--ease-signature), background-color .3s var(--ease-signature); }

.node-chip[data-live="true"] {
  background: var(--white);
  box-shadow:
    inset 0 0 0 1px #fff,
    0 0 0 1px var(--live),                       /* the 1px accent ring */
    0 2px 8px rgba(110, 43, 255, 0.18),          /* accent glow (swap RGB for the brand) */
    0 6px 16px rgba(0, 0, 0, 0.08);
}
```

### 2d. Tiny beveled key (icon tiles, keycaps — sub-pixel light modeling)

```css
.key-bevel {
  box-shadow:
    inset 0 0.5px 0.5px rgba(255, 255, 255, 0.45),
    0 0.5px 0.7px rgba(32, 32, 32, 0.24),
    0 0 1.5px rgba(32, 32, 32, 0.2);
}
/* pair with a one-step vertical falloff fill: */
--ui-tile-fill: linear-gradient(180deg, #fff, var(--page));
```

### 2e. Mono pill chrome (4-layer micro-emboss instead of a border)

```css
.pill-emboss {
  box-shadow:
    0 0.5px 0 rgba(32, 32, 32, 0.2),
    0 0 1px rgba(32, 32, 32, 0.25),
    inset 0 0.5px 0.5px rgba(255, 255, 255, 0.6),
    inset 0 -0.5px 0.5px rgba(32, 32, 32, 0.05);
}
```

### 2f. The crunchy button (the "physical key" grammar)

Every button reads as a physical key. **Light key:** paper fill + 1px hairline; hover darkens one step to `--recessed`. **Dark key:** a gradient overlay OVER the semantic fill (so accent/ink/red keep their color); bevel + crease do the modeling. `1px` press on `:active` — the only size change in the system.

```css
.btn-crunch {
  box-shadow:
    inset 0 2px 0 #fff,                          /* the 2px white top-lip */
    inset 0 0 1px 1.5px rgba(255, 255, 255, 0.35),
    0 2px 3px rgba(32, 32, 32, 0.07);
  transition:
    transform 0.15s var(--ease-signature),
    box-shadow 0.15s var(--ease-signature),
    background-color 0.15s var(--ease-signature),
    opacity 0.15s var(--ease-signature);
}
.btn-crunch:active:not(:disabled) {
  transform: translateY(1px);                    /* the ONLY size change anywhere */
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7), 0 1px 2px rgba(32, 32, 32, 0.1);
}
.crunch-dark {
  background-image: linear-gradient(rgba(255,255,255,0.17), rgba(16,14,12,0.22) 92%);
  box-shadow:
    0 0 0 1px rgba(32, 32, 32, 0.12),
    inset 0 2px 0 rgba(255, 255, 255, 0.24),      /* keycap bevel */
    inset 0 -0.5px 2px rgba(0, 0, 0, 0.25),       /* bottom crease */
    0 2px 8px rgba(0, 0, 0, 0.03),
    0 3px 4px rgba(0, 0, 0, 0.16);
}
.crunch-dark:active:not(:disabled) {
  box-shadow:
    0 0 0 1px rgba(32,32,32,0.12),
    inset 0 1px 0 rgba(255,255,255,0.18),
    inset 0 1px 2px rgba(0,0,0,0.2),
    0 1px 2px rgba(0,0,0,0.12);
}
```
**Button geometry (vortex canon):** micro = `6px` radius · `10×4px` padding · `0.72rem/480`. Standard = `41px` height · `12px` padding · `8px` radius · `16px/400`.

### 2g. Chunky progress bar (recessed track + currentColor-tinted fill)

The fill tints itself from `currentColor` — set a status text color on the wrapper and the bar self-colors. **This `currentColor` + `color-mix` pattern is a key reusable trick:** one `color:` declaration drives the whole element's palette (bars, dots, glows).

```css
.bar-track {
  border-radius: 9999px;
  background: var(--recessed);
  box-shadow: inset 0 1px 2px rgba(32, 32, 32, 0.08), inset 0 0 0 1px rgba(32, 32, 32, 0.04);
}
.bar-fill {
  height: 100%; border-radius: 9999px;
  background: linear-gradient(180deg,
    color-mix(in srgb, currentColor 26%, #fff) 0%,
    color-mix(in srgb, currentColor 48%, #fff) 100%);
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, currentColor 55%, #fff),
    inset 0 1px 0 rgba(255, 255, 255, 0.65),
    0 0 6px color-mix(in srgb, currentColor 18%, transparent);
}
/* usage: <span class="bar-track h-[5px] text-good"><span class="bar-fill" style="width:72%"/></span>
   width animates: transition-[width] duration-700 ease-signature */
```

### 2h. Status dot with underglow (8px, rides currentColor)

```css
.dot-glow {
  box-shadow:
    0 1px 1.5px color-mix(in srgb, currentColor 60%, transparent),
    inset 0 0.5px 0.5px rgba(255, 255, 255, 0.5);
}
/* lab embossed-bead variant (5–6px reads as a physical bead):
   box-shadow: inset 0 0.83px 0.83px rgba(0,0,0,0.28);     ← inner dark = ball depth
   filter: drop-shadow(0 0.58px 0 #fff);                   ← white seat under it */
```

### 2i. The dark key / send button (a physical keycap, two stacked gradients — lab)
```css
.key-dark {
  background:
    linear-gradient(rgba(32,32,32,0.1), rgba(32,32,32,0.1)),
    linear-gradient(#4f4f4f 0%, rgba(32,32,32,0.85) 100%);
  border: 1px solid #383838;
  box-shadow:
    0 0 0 1px rgba(64,64,64,0.12),
    inset 0 2px 0 rgba(255,255,255,0.24),
    inset 0 -0.5px 2px rgba(0,0,0,0.25),
    0 2px 8px rgba(0,0,0,0.03),
    0 3px 4px rgba(0,0,0,0.16);
}
```

### 2j. Input well (the recessed text-input look) + ad-hoc inline ring
```css
.input-well {
  box-shadow: inset 0 0 0 1px rgba(0,0,0,0.07), inset 0 1.5px 0 #fff, 0 1px 2px rgba(0,0,0,0.04);
}
/* ad-hoc inline ring (written inline so the ring color can vary): */
/* inset 0 0 0 1px #fff, 0 0 0 1px rgba(0,0,0,0.08), inset 0 1px 2px rgba(32,32,32,0.04) */
/* error/active variant swaps the middle ring to a color-mix of the status color: */
/* 0 0 0 1px color-mix(in srgb, var(--bad) 38%, transparent) */
/* mode-signal variant (the input echoes a mode via ring color): */
/* 0 0 0 1px color-mix(in srgb, var(--ocean) 45%, transparent) */
```

### 2k. Device frame chrome (lab .lab-frame) + task row gradient floor
```css
.frame {
  box-shadow:
    inset 0 0.357px 1.5px rgba(255,255,255,0.35),    /* fat soft inner highlight */
    inset 0 2px 0 #fff,                                /* hard top edge light */
    0 0 2px rgba(0,0,0,0.25),
    0 0 0 4px rgba(232,231,230,0.32);                 /* 4px translucent gray halo */
}
.task-row {
  background: linear-gradient(#f5f5f2 0%, rgba(245,245,242,0.5) 100%);  /* fades down */
  box-shadow: 0 0 0 1px rgba(0,0,0,0.04), inset 0 1.47px 0 #fff, 0 0 1.47px rgba(0,0,0,0.05);
}
```

---

## 3. TYPOGRAPHY

### 3a. Font families + roles

| Role | Font | Token | Notes |
|---|---|---|---|
| **UI / product** | **Onest** (variable) | `--font-sans` | the grotesque, run at in-between weights via the wght axis |
| **System-voice / labels** | **IBM Plex Mono** | `--font-mono` | all system labeling at 9–12px, lowercase mono kickers |
| **Numerals** | **Departure Mono** | `--font-numeral` | big stats, counts (a dedicated numeral face) |
| **Serif (one accent only)** | Newsreader/Georgia | — | exactly ONE word per product (a brand anchor), never UI |

All three self-hosted woff2 via `next/font/local` (network-proof). Stacks (hardened — every var carries a fallback):
```css
--font-sans:    var(--font-onest, system-ui), system-ui, sans-serif;
--font-mono:    var(--font-plex-mono, ui-monospace), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
--font-numeral: var(--font-departure, ui-monospace), var(--font-plex-mono, ui-monospace), ui-monospace, monospace;
```

**Font-hardening lesson (carry verbatim):** font `variable`s must live on `<html>` (where `:root` composes them), NOT `<body>` — on `<body>` they're invisible to `:root`, `--font-sans` goes invalid-at-computed-value-time, and the page collapses to UA-default **serif/Times**. Always: self-host woff2, put the `.variable` classes on `<html>`, give every `var(--font-x)` an inline fallback.

### 3b. The weight ladder (the wght-axis grammar — 340/430/450/480, NEVER 400/600)

| Token | Weight | Use |
|---|---|---|
| `--wt-num` | **340** | big stat numerals (`.font-light`) |
| `--wt-body` | **430** | default body text (set on `body`) |
| `--wt-medium` | **450** | quiet emphasis (`.font-medium`) |
| `--wt-emph` | **480** | b / strong / semibold (`.font-semibold`) |
| `--wt-strong` | **520** | the loudest the system gets (`.font-bold`) |

```css
body { font-weight: 430; font-variant-numeric: tabular-nums; font-synthesis: style; }
:is(b, strong, .font-semibold) { font-weight: 480; }
.font-medium { font-weight: 450; }
.font-bold   { font-weight: 520; }
.font-light  { font-weight: 340; }
```
**Headings rely on SIZE, not weight.** `font-synthesis: style` is set because Onest ships no true italics — it lets quiet asides slant without faux-bolding.

### 3c. Size ladder (rem, from vortex canon — note how small mono labels run)

| Token | rem | Use |
|---|---|---|
| `--text-nano` | `0.56rem` | small-caps attributions (track `0.1em`) |
| `--text-micro` | `0.6rem` | pills, chips, counts, stage headers |
| `--text-label` | `0.64rem` | purpose kickers, board headers (mono, lowercase) |
| `--text-meta` | `0.68rem` | mono values, logged/promised rows |
| `--text-btn` | `0.72rem` | mini buttons, footnotes |
| `--text-body` | `0.8rem` | task rows, default copy |
| `--text-title` | `1.02rem` | pane titles (weight 480, tracking `-0.01em`) |
| `--text-stat` | `2.1rem` | big numerals (weight 340, tracking `-0.02em`) |

**The observed px scale (the actual product rhythm):**
- Eyebrow / section label (the dominant UI label): `font-mono text-[10.5px] uppercase tracking-[0.14em] text-mute`. Smaller: `[10px]/0.12em`, `[9px]/0.12em text-faint`.
- Body / beat text: `[12.5px]–[13px] leading-[1.75]` (loose). Dense: `[12px] leading-[1.7]`.
- Hero name: `[15px] font-medium` (450). Headline-in-card: `[14px]`.
- Chips: `font-mono [9px]–[9.5px]`, often `uppercase tracking-[0.04em–0.12em]`.
- Numbers: `font-numeral [11px]/[12px]`, colored by status.
- Micro-caption: `font-mono [8.5px]–[9.5px] text-faint`.
- The ONE big stat: `[40px] font-[430/340]`.

### 3d. Letter-spacing / tracking rules
- Big titles/stats: **negative** tracking (`-0.01em` titles, `-0.02em` stats).
- Mono system labels / small-caps: **positive** tracking (`0.1em–0.16em`).
- Always `font-variant-numeric: tabular-nums` inside product frames.

---

## 4. SPACING + RADII RHYTHM

### 4a. Radii ladder
```css
--r-chip:  4px;     /* micro chips */
--r-key:   6px;     /* small buttons, mini icon tiles */
--r-card:  8px;     /* cards, standard buttons */
--r-panel: 12px;    /* panels, boards */
--r-frame: 16px;    /* outer mockup/device chrome, the spiral stage */
--r-pill:  9999px;
```
(Clean-blue adds `--r-bubble: 20px` at the top of the ladder — the chat bubble is the softest, warmest surface.)

### 4b. Spacing rhythm (the "huge air outside, tight inside" law)
```css
--pad-board:  8px;    /* recessed board interior */
--pad-card:   10px;   /* card interior */
--col-gutter: 6px;    /* column gap */
--gap-dot:    3px;    /* dot → count inside a pill */
--gap-group:  8px;    /* between pill groups */
/* sections breathe at ≥80px; vortex section space: clamp(3rem, 6vw, 7rem) */
```
**The rule that matters:** component interiors use **2–14px** micro-gaps; sections use **≥64–80px**. **Avoid the 20–40px mid-scale inside components** — that's the generic-UI tell. Product spacing observed: panel `p-5`, card `px-3/px-4 py-2.5/py-3.5`, gaps `gap-2`/`gap-2.5`/`gap-4`, section stacks `space-y-2.5`/`gap-4`.

### 4c. The dotted canvas (the signature ground)
```css
.dotted-canvas {
  background-color: #f2f2ef;
  background-image: radial-gradient(circle, #dbdbd8 0.8px, transparent 0.85px);
  background-size: 12.5px 12.5px;   /* ~0.8px dots every 12.5px, both axes */
}
```
Pattern: `dotted-canvas board-recess` together = a recessed pegboard the live content "floats" on. Used as every empty-state / staging surface.

---

## 5. THE THIN-LINE ≤1px LAW (and the connector grammar)

- Every ring/line is ≤1px. The "border" is always a `0 0 0 1px rgba(0,0,0,0.08)` shadow ring, not a `border`.
- The live element gets **ONE 1px accent ring** + a soft blurred glow for presence — never a thicker ring.
- Wire stub (dotted connector hanging below a card): `width: 1px` + a `repeating-linear-gradient` of `rgba(32,32,32,0.35) 0 2px / transparent 2px 6px`.
- Dashed dividers: `border-top: 1px dashed rgba(32,32,32,0.18)`.
- Dashed striped divider (lab — NOT a border; a striped gradient):
  `background: repeating-linear-gradient(to right, rgba(38,35,35,0.12) 0 3px, transparent 3px 6px); height: 1px;`
- Dashed SVG connectors: `stroke-dasharray 4 4`, `stroke-width 1.2`, round caps; idle `#b7b7b7` at 22% opacity, active = accent. Ringed endpoints: `circle r=2.4, fill var(--page), stroke state-color width 1`.
- Engraved divider (column separator): a `2px` line lit BOTH sides — `background:#e8e7e6; box-shadow: -1px 0 #fff, 1px 0 #fff;` (depth from light, again — reads thinner than it is).
- Entry-overlay arcs / sub-pixel strokes: `stroke-width: 0.75` with `vector-effect: non-scaling-stroke`.

---

## 6. WHAT EVOLVED (canon notes — carry the right version)

| Dimension | Earlier (lab/vortex) | Shipped product | Takeaway |
|---|---|---|---|
| Ink ramp | 5 stops + separate `--hair`/`--line` | clean 6-alpha ladder, text AND lines from same ink | collapse lines into the ink family |
| Brand blue | none in neutral layer | added `--ocean #1970d1` as a true brand layer, distinct from the violet accent | brand-blue ≠ active-accent |
| Accent scope | violet = "active states, connectors, rings" (broad) | violet = ONLY the executing node; ocean took connectors/brand | accent got MORE reserved |
| Numerals | mono did numerals | added dedicated Departure Mono numeral face | a third type role |
| House curves | two (`.23,1,.32,1` / `.22,1,.36,1`) | collapsed to one expo-out `cubic-bezier(0.16,1,0.3,1)` | one curve, canon (see [02-MOTION.md](./02-MOTION.md)) |
| Font loading | Google Fonts / theme vars | all 3 self-hosted woff2, every `var()` with a fallback | hardening |
| Token naming | namespaced (`--ui-*`, `--vx-*`, `--lab-*`) | clean unprefixed names + Tailwind `extend.colors` | per-app unprefixed tokens |

→ Next: [02-MOTION.md](./02-MOTION.md) for every curve and keyframe. The compiling sheet is [tokens.css](./tokens.css).
