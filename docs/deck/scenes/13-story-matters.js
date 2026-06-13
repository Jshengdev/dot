/* =====================================================================
 * BEAT 13 — "Story Matters"  (scenes/13-story-matters.js)
 * ---------------------------------------------------------------------
 * Spoken: "Their story matters. It's how they live their life."
 *
 * CARRY IN: world.storyRibbon — the flowing path of a life. Here it comes
 * ALIVE: the cold faint-ink thread WARMS into the one accent-blue (the
 * thing alive/active now) and a single soft heartbeat travels along it —
 * the SUBJECTIVE truth, no longer a measured line but a life being lived.
 *
 * Movement budget: 2 movements —
 *   (1) the ribbon eases to its full flowing shape and WARMS alive (faint
 *       ink -> accent blue) as t:0->1.
 *   (2) a single soft accent heartbeat glides along the path, continuous
 *       and calm (ambient, driven by world.clock — never bounces).
 *
 * TASTE: every line is a 1px DOT.hairline modeled by light (no thick
 * stroke); the "alive" is carried by DOT.aliveDot heartbeats, not by a
 * fat glowing stroke. ONE accent (blue) on the now-living thread. No
 * warm-red here — warm-red is reserved for an ending, and this is a life
 * being lived, not closed.
 *
 * CARRY-IN (inherited; seeded as a sane fallback if deep-linked):
 *   world.storyRibbon — flowing path { pts:[{xFrac,yFrac}], flow, alpha }
 *   world.character   — the protagonist dot (kept calm, present)
 *
 * CARRY-OUT (left in world for the next beat, which reads pts/flow/alpha):
 *   world.storyRibbon — same path, now warmed alive (+ alive tween)
 *   world.character   — the protagonist dot
 * ===================================================================== */
(function () {
  "use strict";
  var DOT = window.DOT;

  var POINTS = 7; // control anchors along the ribbon (fractional, resize-safe)

  window.SCENES.push({
    id: "story-matters",
    note:
      "Their story matters. It's how they live their life. The ribbon — " +
      "their life — is no longer a cold measured line. It warms, comes " +
      "alive, and a single heartbeat travels along it. This is the " +
      "subjective truth: not a number, a life being lived.",

    onEnter: function (world) {
      // INHERIT the carried-in ribbon. Normalize it to the shared shape
      // (pts/flow/alpha) the later beats read; only seed if deep-linked.
      var r = world.storyRibbon;
      if (!r) {
        r = world.storyRibbon = {
          pts: seedPath(),
          flow: { value: 0.0, target: 1.0 }, // path completeness 0..1
          alpha: { value: 1, target: 1 },
          alive: { value: 0.0, target: 1.0 } // warmth: faint ink -> accent
        };
      } else {
        // carried in — bring it to life (the morph), preserving the path.
        if (!r.pts || !r.pts.length) r.pts = seedPath();
        if (!r.flow) r.flow = { value: 1, target: 1 };
        if (!r.alpha) r.alpha = { value: 1, target: 1 };
        if (!r.alive) r.alive = { value: 0, target: 1 };
        r.flow.target = 1.0;
        r.alpha.target = 1.0;
        r.alive.target = 1.0; // THE MORPH: warm the thread alive
      }

      // The character is calm and present, brightening beside the life.
      var c = world.character;
      if (!c) {
        world.character = {
          xFrac: 0.12,
          yFrac: 0.5,
          scale: { value: 0.9, target: 0.95 },
          mood: "calm",
          glow: { value: 0.4, target: 0.55 }
        };
      } else {
        c.mood = "calm";
        c.glow.target = 0.55;
      }
    },

    onExit: function (world) {
      // Carry out the now-alive ribbon + character. Nothing scene-private.
    },

    draw: function (p, t, world) {
      var r = world.storyRibbon;
      var W = world.w;
      var H = world.h;
      var e = DOT.ease(t);

      // --- movement 1: ease the ribbon to full + WARM it alive ---
      DOT.tween(r.flow, 0.08);
      DOT.tween(r.alpha, 0.12);
      DOT.tween(r.alive, 0.06);
      var draw01 = Math.min(r.flow.value, e); // intro draw-in on first arrival
      var alive = r.alive.value;
      var fade = Math.min(1, e * 1.3);

      // resolve absolute control points from fractional anchors each frame
      var ctrl = [];
      for (var i = 0; i < r.pts.length; i++) {
        ctrl.push({ x: r.pts[i].xFrac * W, y: r.pts[i].yFrac * H });
      }
      if (ctrl.length < 2) return;

      // soft ambient breathing on the wave (alive feel, never bounces)
      var breathe = Math.sin(world.clock * 0.0009) * 6 * alive;

      // sample a smooth curve so we can both draw it and ride a heart along it
      var samples = sampleCurve(p, ctrl, breathe, 150);
      var cut = Math.max(2, Math.floor(samples.length * draw01));

      // ---- the RIBBON, modeled by LIGHT (1px hairlines that come ----
      // together into one warm thread). Color eases faint-ink -> accent
      // as `alive` rises; every segment is a clamped <=1px hairline.
      var threadHex = alive > 0.5 ? DOT.palette.accent : DOT.palette.ink;
      var threadAlpha = (0.34 + 0.5 * alive) * fade;
      for (var s = 1; s < cut && s < samples.length; s++) {
        var a = samples[s - 1];
        var b = samples[s];
        DOT.hairline(p, a.x, a.y, b.x, b.y, {
          hex: threadHex,
          alpha: threadAlpha,
          lip: 0.5 + 0.4 * alive // catches more light as it comes alive
        });
      }

      // ---- movement 2: a single soft HEARTBEAT glides along the path ----
      // one alive accent dot tracing the drawn portion — a life being
      // lived, continuous and calm.
      if (alive > 0.02 && cut > 4) {
        var period = 5200; // ms per traverse — slow, calm
        var head = (world.clock % period) / period; // 0..1 along the path
        var idxF = head * (cut - 1);
        var idx = DOT.clamp(Math.floor(idxF), 1, cut - 1);
        var hp = samples[idx];
        DOT.aliveDot(p, hp.x, hp.y, 5.5, {
          hex: DOT.palette.accent,
          alpha: alive * fade,
          glow: 0.65,
          breath: world.clock,
          phase: 0.0
        });
      }

      // ---- the character, calm + present beside the life ----
      var c = world.character;
      if (c) {
        DOT.tween(c.scale, 0.1);
        DOT.tween(c.glow, 0.1);
        var startX = ctrl[0].x;
        var startY = ctrl[0].y;
        DOT.drawCharacter(p, startX, startY - 78, {
          scale: c.scale.value,
          mood: c.mood,
          glow: c.glow.value,
          alpha: Math.min(1, e * 1.4),
          breath: world.clock,
          look: 0.15 // a soft gaze toward the living story
        });
      }
    }
  });

  // ---- local helpers (scene-private) ----------------------------------

  // a gentle flowing wave across the canvas, as resize-safe fractional anchors
  function seedPath() {
    var ys = [0.5, 0.42, 0.56, 0.46, 0.58, 0.48, 0.52];
    var pts = [];
    for (var i = 0; i < POINTS; i++) {
      pts.push({
        xFrac: 0.16 + (0.68 * i) / (POINTS - 1),
        yFrac: ys[i % ys.length]
      });
    }
    return pts;
  }

  // smooth Catmull-Rom-ish curve through control points via p5.curvePoint,
  // returning evenly spaced screen points (with gentle alive breathing).
  function sampleCurve(p, ctrl, breathe, n) {
    if (ctrl.length < 2) return ctrl.slice();
    var pts = ctrl.map(function (pt, i) {
      var b = i === 0 || i === ctrl.length - 1 ? 0 : breathe;
      return { x: pt.x, y: pt.y + b * (i % 2 === 0 ? 1 : -1) };
    });
    var out = [];
    var segs = pts.length - 1;
    var perSeg = Math.max(2, Math.floor(n / segs));
    for (var sIdx = 0; sIdx < segs; sIdx++) {
      var p0 = pts[Math.max(0, sIdx - 1)];
      var p1 = pts[sIdx];
      var p2 = pts[sIdx + 1];
      var p3 = pts[Math.min(pts.length - 1, sIdx + 2)];
      for (var j = 0; j < perSeg; j++) {
        var u = j / perSeg;
        out.push({
          x: p.curvePoint(p0.x, p1.x, p2.x, p3.x, u),
          y: p.curvePoint(p0.y, p1.y, p2.y, p3.y, u)
        });
      }
    }
    out.push({ x: pts[pts.length - 1].x, y: pts[pts.length - 1].y });
    return out;
  }
})();
