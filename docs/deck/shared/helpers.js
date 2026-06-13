/* =====================================================================
 * DOT DECK — shared helpers + palette  (shared/helpers.js)
 * ---------------------------------------------------------------------
 * Loaded BEFORE any scene file and before the shell.
 * Everything a scene needs lives on `window.DOT`. This file IS the
 * reference for the taste — the "paper-light world": depth from LIGHT,
 * never lines; hairline strokes only; one ink at alphas; one accent;
 * dots that are alive (baked light + breathing); the house ease.
 *
 *   DOT.palette   — locked color tokens
 *   DOT.col(hex,a)— p5 color from a palette hex at alpha 0..1
 *   DOT.lerp / DOT.clamp / DOT.map
 *   DOT.ease      — house ease  cubic-bezier(.16,1,.3,1)  (fast out, long settle)
 *   DOT.easeA     — sibling     cubic-bezier(.23,1,.32,1)
 *   DOT.easeB     — sibling     cubic-bezier(.22,1,.36,1)
 *   DOT.easeInOut — symmetric smootherstep (in-and-out movements)
 *   DOT.stagger(i,n,t,opts)     — organic per-index stagger (breathes, never lockstep)
 *   DOT.breathe(clock, opts)    — calm rest oscillation for alive things
 *   DOT.tween(obj, rate)        — glide {value->target} each frame
 *   DOT.hairline(p, ...)        — a line modeled by light (1px ink + 1px white lip)
 *   DOT.drawCharacter(p,x,y,opts) — THE character (simple, identical, alive)
 *   DOT.glassDot(p,x,y,r,coreOn)  — brand glass sphere (light-modeled)
 *   DOT.aliveDot(p,x,y,r,opts)    — an alive dot (baked light + underglow + breath)
 *   DOT.label(p, text, x, y, opts)— faint IBM Plex Mono micro-label
 *
 * LAW (do not break in any scene):
 *   - NO stroke heavier than 1px anywhere. Favor 0.5–1px hairlines.
 *   - Depth comes from a 1px white inset highlight + a faint shadow,
 *     NEVER a flat border.
 *   - One ink (#0b1620) at alphas only. One accent (#007AFF) on the ONE
 *     thing alive right now. warm-red (#fc7981) ONLY for caution/wrong.
 *   - Almost no words. Any label is mono, 9–12px, faint.
 *   - Nothing bounces. All motion uses the house ease / tween.
 *
 * Scenes must NOT redefine these and must NOT mutate DOT.palette.
 * ===================================================================== */
(function () {
  "use strict";

  // ---- Locked palette (hex strings) ---------------------------------
  var palette = {
    page: "#ffffff", // the white room — canvas background
    ink: "#0b1620", // the ONE ink — NEVER pure black
    accent: "#007AFF", // trust-blue — the ONE thing alive/active right now
    warmRed: "#fc7981" // caution / wrong / an ending — ONLY
  };

  // ---- Color ---------------------------------------------------------
  // p5 color from a palette hex at alpha 0..1. The ONLY sanctioned way to
  // get a faint ink: DOT.col(palette.ink, 0.5) — no second gray, ever.
  var _p5 = null; // captured lazily from first p instance that calls col()
  function col(p, hex, a) {
    var c = p.color(hex);
    if (a != null) c.setAlpha(255 * clamp(a, 0, 1));
    return c;
  }

  // ---- Math ----------------------------------------------------------
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function map(v, a, b, c, d) {
    return c + ((d - c) * (v - a)) / (b - a);
  }

  // ---- The house ease ------------------------------------------------
  // cubic-bezier(x1,y1,x2,y2) solver (Newton + bisection fallback), the
  // SAME math browsers use. The signature curve is (.16,1,.3,1): fast
  // out, long settle, NO overshoot. Two siblings keep groups from moving
  // in lockstep (.23,1,.32,1 / .22,1,.36,1).
  function makeCubicBezier(x1, y1, x2, y2) {
    // sample helpers for the parametric bezier (P0=0,0  P3=1,1)
    function A(a, b) {
      return 1 - 3 * b + 3 * a;
    }
    function B(a, b) {
      return 3 * b - 6 * a;
    }
    function C(a) {
      return 3 * a;
    }
    function calc(tt, a, b) {
      return ((A(a, b) * tt + B(a, b)) * tt + C(a)) * tt;
    }
    function slope(tt, a, b) {
      return 3 * A(a, b) * tt * tt + 2 * B(a, b) * tt + C(a);
    }
    function solveX(x) {
      var tt = x;
      for (var i = 0; i < 5; i++) {
        var s = slope(tt, x1, x2);
        if (s === 0) break;
        var xx = calc(tt, x1, x2) - x;
        tt -= xx / s;
      }
      // bisection fallback to stay in-bounds
      var lo = 0,
        hi = 1;
      tt = x;
      var cur = calc(tt, x1, x2);
      var guard = 0;
      while (Math.abs(cur - x) > 1e-4 && guard < 30) {
        if (cur < x) lo = tt;
        else hi = tt;
        tt = (lo + hi) / 2;
        cur = calc(tt, x1, x2);
        guard++;
      }
      return tt;
    }
    return function (t) {
      t = clamp(t, 0, 1);
      if (t === 0 || t === 1) return t;
      return calc(solveX(t), y1, y2);
    };
  }

  var ease = makeCubicBezier(0.16, 1, 0.3, 1); // THE house ease
  var easeA = makeCubicBezier(0.23, 1, 0.32, 1); // sibling
  var easeB = makeCubicBezier(0.22, 1, 0.36, 1); // sibling

  // Symmetric smootherstep for in-and-out movements / veils.
  function easeInOut(t) {
    t = clamp(t, 0, 1);
    return t * t * t * (t * (t * 6 - 15) + 10); // smootherstep
  }

  // ---- Organic stagger ----------------------------------------------
  // Map a global beat progress t into a per-index local progress, with an
  // organic delay so siblings DON'T fire in lockstep. Alternating sign so
  // the field breathes left/right, not as one wall.
  //   i      index
  //   n      count
  //   t      0..1 global progress
  //   opts.spread  total fraction of the beat spent staggering (def .55)
  //   opts.ease    which ease to apply locally (def DOT.ease)
  //   opts.seed    extra per-index jitter source (def i)
  // returns local eased 0..1 for index i.
  function stagger(i, n, t, opts) {
    opts = opts || {};
    var spread = opts.spread == null ? 0.55 : opts.spread;
    var fn = opts.ease || ease;
    n = Math.max(1, n);
    // base delay walks down the list; alternate a touch so it isn't a sweep
    var base = (i / n) * spread;
    var jitter = (((Math.sin((opts.seed == null ? i : opts.seed) * 12.9898) * 43758.5453) % 1) || 0) * 0.06;
    if (i % 2 === 1) jitter = -jitter; // alternate direction of the wobble
    var d = clamp(base + jitter, 0, spread);
    var span = 1 - spread;
    var local = (t - d) / Math.max(0.0001, span);
    return fn(clamp(local, 0, 1));
  }

  // ---- Breathing -----------------------------------------------------
  // A calm rest oscillation for ALIVE things. Slow, soft, never a flash.
  // Returns a value oscillating in [1-amp, 1+amp] around 1.
  //   clock      world.clock (ms)
  //   opts.period   ms per breath (def 3400 — a calm human breath)
  //   opts.amp      amplitude (def 0.035)
  //   opts.phase    phase offset in radians (def 0) — give each dot its own
  function breathe(clock, opts) {
    opts = opts || {};
    var period = opts.period == null ? 3400 : opts.period;
    var amp = opts.amp == null ? 0.035 : opts.amp;
    var phase = opts.phase == null ? 0 : opts.phase;
    return 1 + amp * Math.sin((clock / period) * Math.PI * 2 + phase);
  }

  // Frame-rate-aware approach. Mutate a shared world object that has
  // {value, target}. Call every draw to glide value -> target. `rate`
  // ~0.12 is calm. Returns the (new) value.
  function tween(obj, rate) {
    if (rate == null) rate = 0.12;
    obj.value = lerp(obj.value, obj.target, rate);
    if (Math.abs(obj.value - obj.target) < 0.0005) obj.value = obj.target;
    return obj.value;
  }

  // ---- HAIRLINE ------------------------------------------------------
  // A line modeled by LIGHT, not weight. One 1px ink stroke (at a soft
  // alpha) with a 1px white "lip" set just beneath it — the page's light
  // catching the lower edge — so it reads as an object, never a border.
  //   p, x1,y1,x2,y2   endpoints
  //   opts.alpha   ink alpha 0..1 (def .8)
  //   opts.hex     stroke color hex (def ink)
  //   opts.lip     white-lip strength 0..1 (def .9)
  //   opts.weight  stroke weight (def 1, LAW: never > 1)
  function hairline(p, x1, y1, x2, y2, opts) {
    opts = opts || {};
    var a = opts.alpha == null ? 0.8 : opts.alpha;
    var hex = opts.hex || palette.ink;
    var lip = opts.lip == null ? 0.9 : opts.lip;
    var w = Math.min(1, opts.weight == null ? 1 : opts.weight); // LAW
    p.push();
    p.strokeCap(p.ROUND);
    // white lower lip (1px, just below) — depth from light
    if (lip > 0) {
      var wlip = p.color(255, 255, 255);
      wlip.setAlpha(255 * 0.9 * lip);
      p.stroke(wlip);
      p.strokeWeight(1);
      p.line(x1, y1 + 1, x2, y2 + 1);
    }
    // the ink line
    var ink = col(p, hex, a);
    p.stroke(ink);
    p.strokeWeight(w);
    p.line(x1, y1, x2, y2);
    p.pop();
  }

  // ---- ALIVE DOT -----------------------------------------------------
  // A dot is a HEARTBEAT: a small filled disc with baked-in light (a soft
  // off-center radial highlight) + a faint colored underglow, breathing
  // at rest. Never flashes. This is the brand atom — the thing that
  // morphs together out of thin lines elsewhere.
  //   p, x, y, r
  //   opts.hex     dot color hex (def accent — "alive")
  //   opts.alpha   overall opacity 0..1 (def 1)
  //   opts.glow    underglow strength 0..1 (def .55)
  //   opts.breath  breathing amount: pass world.clock to enable, or null
  //   opts.phase   breath phase (radians) so a field doesn't pulse as one
  function aliveDot(p, x, y, r, opts) {
    opts = opts || {};
    var hex = opts.hex || palette.accent;
    var alpha = opts.alpha == null ? 1 : opts.alpha;
    var glow = opts.glow == null ? 0.55 : opts.glow;
    var br = 1;
    if (opts.breath != null) {
      br = breathe(opts.breath, { amp: 0.05, period: 3400, phase: opts.phase || 0 });
    }
    var rr = r * br;

    p.push();
    p.translate(x, y);
    p.noStroke();

    // faint colored underglow (soft radial, baked light)
    if (glow > 0) {
      var g = p.color(hex);
      for (var i = 3; i >= 1; i--) {
        g.setAlpha(255 * 0.06 * glow * alpha * (4 - i));
        p.fill(g);
        p.circle(0, 0, rr * 2 * (1.6 + i * 0.55));
      }
    }

    // the disc
    var body = col(p, hex, alpha);
    p.fill(body);
    p.circle(0, 0, rr * 2);

    // baked highlight — off-center soft top-left light (sphere read)
    var lite = p.color(255, 255, 255);
    lite.setAlpha(255 * 0.7 * alpha);
    p.fill(lite);
    p.ellipse(-rr * 0.32, -rr * 0.36, rr * 0.7, rr * 0.55);
    // tiny bright pinpoint
    lite.setAlpha(255 * 0.9 * alpha);
    p.fill(lite);
    p.circle(-rr * 0.34, -rr * 0.38, rr * 0.28);

    p.pop();
  }

  // ---- THE CHARACTER -------------------------------------------------
  // A single, simple, ALWAYS-IDENTICAL character so it reads as the same
  // "someone" across every beat. An alive translucent dot (baked light +
  // breathing) with a minimal calm face: two small eyes + a short mouth
  // line. Hairline strokes only. Drawn purely in p5 — no images.
  //
  // opts:
  //   scale : number  (1 = ~58px diameter)        default 1
  //   mood  : 'calm' | 'tense' | 'off'             default 'calm'
  //   glow  : 0..1    soft underglow strength      default 0.5
  //   alpha : 0..1    overall opacity              default 1
  //   look  : -1..1   eye/gaze horizontal offset   default 0
  //   breath: ms      pass world.clock to breathe  default null (still)
  //   phase : radians breath phase                 default 0
  //
  // mood semantics (keep consistent in every scene):
  //   calm  — eyes open round, soft curved mouth, blue underglow
  //   tense — eyes narrowed, mouth flat, warm-red underglow hint
  //   off   — body fades toward ghost, eyes become short closed lines
  function drawCharacter(p, x, y, opts) {
    opts = opts || {};
    var scale = opts.scale == null ? 1 : opts.scale;
    var mood = opts.mood || "calm";
    var glow = opts.glow == null ? 0.5 : opts.glow;
    var alpha = opts.alpha == null ? 1 : opts.alpha;
    var look = opts.look == null ? 0 : clamp(opts.look, -1, 1);

    var breathScale = 1;
    if (opts.breath != null && mood !== "off") {
      breathScale = breathe(opts.breath, { amp: 0.03, period: 3600, phase: opts.phase || 0 });
    }

    var d = 58 * scale * breathScale; // body diameter
    var r = d / 2;
    var glowHex = mood === "tense" ? palette.warmRed : palette.accent;

    p.push();
    p.translate(x, y);
    p.noStroke();

    // --- faint colored underglow (baked light, never a hard halo) -----
    if (glow > 0 && mood !== "off") {
      var gc = p.color(glowHex);
      for (var i = 4; i >= 1; i--) {
        var rr = r * (1.05 + i * 0.26);
        gc.setAlpha(255 * 0.035 * glow * alpha * (1 - i / 5.5));
        p.fill(gc);
        p.circle(0, 0, rr * 2);
      }
    }

    // --- body (translucent dot) --------------------------------------
    var bodyA = (mood === "off" ? 0.14 : 0.9) * alpha;
    var body = col(p, palette.ink, bodyA);
    p.fill(body);
    p.circle(0, 0, d);

    // baked top-left light (soft sphere read — no hard highlight)
    var lite = p.color(255, 255, 255);
    lite.setAlpha(255 * 0.32 * alpha * (mood === "off" ? 0.3 : 1));
    p.fill(lite);
    p.ellipse(-r * 0.3, -r * 0.36, d * 0.52, d * 0.42);

    // --- face --------------------------------------------------------
    var faceA = (mood === "off" ? 0.35 : 1) * alpha;
    var face = p.color(255, 255, 255);
    face.setAlpha(255 * faceA);

    var eyeY = -r * 0.1;
    var eyeDX = r * 0.34;
    var eyeR = d * 0.066;
    var gaze = look * r * 0.12;

    if (mood === "off") {
      // closed eyes — two short level hairlines
      p.stroke(face);
      p.strokeWeight(1);
      p.strokeCap(p.ROUND);
      p.line(-eyeDX - eyeR + gaze, eyeY, -eyeDX + eyeR + gaze, eyeY);
      p.line(eyeDX - eyeR + gaze, eyeY, eyeDX + eyeR + gaze, eyeY);
      p.noStroke();
    } else {
      p.noStroke();
      p.fill(face);
      var eh = mood === "tense" ? eyeR * 1.25 : eyeR * 2; // narrowed when tense
      p.ellipse(-eyeDX + gaze, eyeY, eyeR * 2, eh);
      p.ellipse(eyeDX + gaze, eyeY, eyeR * 2, eh);
    }

    // mouth — short hairline; calm = gentle soft curve, tense = flat/lower
    if (mood !== "off") {
      var mouthY = r * 0.36 + (mood === "tense" ? r * 0.05 : 0);
      var mouthW = mood === "tense" ? r * 0.32 : r * 0.44;
      p.stroke(face);
      p.strokeWeight(1);
      p.strokeCap(p.ROUND);
      p.noFill();
      if (mood === "calm") {
        p.beginShape();
        p.vertex(-mouthW + gaze, mouthY);
        p.quadraticVertex(gaze, mouthY + r * 0.07, mouthW + gaze, mouthY);
        p.endShape();
      } else {
        p.line(-mouthW + gaze, mouthY, mouthW + gaze, mouthY);
      }
      p.noStroke();
    }

    p.pop();
  }

  // ---- GLASS DOT -----------------------------------------------------
  // The brand object: a translucent glass sphere modeled by light. A
  // faint cool fill, a 1px hairline rim (depth from light, never a
  // border), a top-left specular, and an accent-blue core lit by
  // `coreOn` (0..1) — the "focus / on" state.
  //   p, x, y : center
  //   r       : radius
  //   coreOn  : 0..1   core glow strength (0 = dormant glass)
  function glassDot(p, x, y, r, coreOn) {
    coreOn = coreOn == null ? 0 : clamp(coreOn, 0, 1);

    p.push();
    p.translate(x, y);
    p.noStroke();

    // outer soft underglow when lit (baked light)
    if (coreOn > 0) {
      var halo = p.color(palette.accent);
      for (var i = 3; i >= 1; i--) {
        halo.setAlpha(255 * 0.05 * coreOn * (1 - i / 4));
        p.fill(halo);
        p.circle(0, 0, r * (2 + i * 0.7));
      }
    }

    // glass body — faint cool fill
    var glass = p.color(palette.accent);
    glass.setAlpha(coreOn > 0 ? 24 : 14);
    p.fill(glass);
    p.circle(0, 0, r * 2);

    // 1px hairline rim — depth from light (white lip + soft ink rim)
    var wlip = p.color(255, 255, 255);
    wlip.setAlpha(255 * 0.55);
    p.noFill();
    p.stroke(wlip);
    p.strokeWeight(1);
    p.circle(-0.6, -0.6, r * 2);
    var rim = col(p, palette.ink, 0.12);
    p.stroke(rim);
    p.strokeWeight(1);
    p.circle(0, 0, r * 2);
    p.noStroke();

    // inner core light
    if (coreOn > 0) {
      var core = p.color(palette.accent);
      core.setAlpha(255 * 0.66 * coreOn);
      p.fill(core);
      p.circle(0, 0, r * 0.6);
      var pin = p.color(255, 255, 255);
      pin.setAlpha(255 * 0.85 * coreOn);
      p.fill(pin);
      p.circle(-r * 0.1, -r * 0.12, r * 0.22);
    }

    // top-left specular highlight (glass read)
    var spec = p.color(255, 255, 255);
    spec.setAlpha(255 * 0.45);
    p.fill(spec);
    p.ellipse(-r * 0.34, -r * 0.4, r * 0.5, r * 0.36);

    p.pop();
  }

  // ---- LABEL ---------------------------------------------------------
  // The ONLY sanctioned on-screen text: IBM Plex Mono, 9–12px, faint.
  // "Show less words always." Use sparingly — the visual carries it.
  //   p, text, x, y
  //   opts.size   px (def 11; clamp 9..13)
  //   opts.alpha  0..1 (def .4)
  //   opts.hex    color hex (def ink)
  //   opts.align  p.LEFT | p.CENTER | p.RIGHT (def p.LEFT)
  //   opts.track  letter-spacing px (def 0.6)
  function label(p, text, x, y, opts) {
    opts = opts || {};
    var size = clamp(opts.size == null ? 11 : opts.size, 9, 13);
    var a = opts.alpha == null ? 0.4 : opts.alpha;
    if (a <= 0.001) return;
    var hex = opts.hex || palette.ink;
    var align = opts.align || p.LEFT;
    var track = opts.track == null ? 0.6 : opts.track;
    p.push();
    p.noStroke();
    p.fill(col(p, hex, a));
    p.textFont("IBM Plex Mono");
    p.textSize(size);
    p.textAlign(align, p.BASELINE);
    if (typeof p.textLeading === "function") p.textLeading(size * 1.4);
    // manual tracking so labels read engineered, not default
    var s = String(text);
    if (track && align === p.LEFT) {
      var cx = x;
      for (var i = 0; i < s.length; i++) {
        p.text(s[i], cx, y);
        cx += p.textWidth(s[i]) + track;
      }
    } else {
      // center/right: tracking via per-glyph is fiddly; keep simple+crisp
      p.text(s, x, y);
    }
    p.pop();
  }

  // ---- export --------------------------------------------------------
  window.DOT = {
    palette: palette,
    col: col,
    lerp: lerp,
    clamp: clamp,
    map: map,
    ease: ease,
    easeA: easeA,
    easeB: easeB,
    easeInOut: easeInOut,
    stagger: stagger,
    breathe: breathe,
    tween: tween,
    hairline: hairline,
    aliveDot: aliveDot,
    drawCharacter: drawCharacter,
    glassDot: glassDot,
    label: label
  };
})();
