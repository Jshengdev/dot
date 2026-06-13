/* =====================================================================
 * BEAT 14 — "What happened matters"  (scenes/14-happened-matters.js)
 * ---------------------------------------------------------------------
 * Spoken: "But what actually happened matters just as much — it's the
 * part a doctor can help with."
 *
 * The flowing RIBBON carried in from beat 13 is the SUBJECTIVE life-as-
 * felt. Here we add the OBJECTIVE record alongside it: discrete, precise
 * factual points (blue ALIVE dots) that rise in and snap exactly onto
 * the path. Same life, two registers — the part a doctor can hold onto.
 *
 * CARRY-IN (inherited; seeded as a sane fallback only if deep-linked):
 *   world.storyRibbon  — the flowing path of the life-as-experienced
 *                        ({ pts:[{xFrac,yFrac}], flow:{value,target}, ... })
 *   world.character    — the protagonist dot (kept calm, present)
 *
 * CARRY-OUT (left in world for the next beat — they return inside DOT):
 *   world.storyRibbon  — unchanged flow
 *   world.factDots     — the precise blue evidence points (NEW motif)
 *
 * Movement budget: 2 movements —
 *   (1) the carried ribbon eases to its full, settled flow;
 *   (2) discrete blue fact-dots rise in + snap precisely onto the path.
 * ===================================================================== */
(function () {
  "use strict";
  var DOT = window.DOT;

  // Fractional parameters (0..1) along the ribbon where objective facts land.
  var FACT_TS = [0.16, 0.34, 0.5, 0.66, 0.83];

  window.SCENES.push({
    id: "happened-matters",
    note:
      "But what actually happened matters just as much — it's the part a " +
      "doctor can help with. The same life, now with discrete, precise " +
      "facts marked alongside the felt experience.",

    onEnter: function (world) {
      // ---- INHERIT the ribbon; seed a sane fallback only if missing ----
      var rb = world.storyRibbon;
      if (!rb || !rb.pts || !rb.pts.length) {
        // fallback flow: a gentle left-to-right wave across the canvas,
        // stored as fractional control points so it survives resize.
        var pts = [];
        var n = 48;
        for (var i = 0; i <= n; i++) {
          var f = i / n;
          pts.push({
            xFrac: 0.16 + 0.68 * f,
            yFrac: 0.52 + 0.06 * Math.sin(f * Math.PI * 2.4)
          });
        }
        rb = world.storyRibbon = {
          pts: pts,
          flow: { value: 0.6, target: 1.0 }, // how much of the path is drawn
          alive: { value: 0.8, target: 1.0 } // warmth / glow of the felt line
        };
      } else {
        // carried in — just settle it to its full, calm flow.
        if (!rb.flow) rb.flow = { value: 1, target: 1 };
        rb.flow.target = 1.0;
        if (!rb.alive) rb.alive = { value: rb.alive ? rb.alive.value : 0.8, target: 1.0 };
        rb.alive.target = 1.0;
      }

      // ---- SEED the objective fact-dots (this beat introduces them) ----
      // Each is a tweenable rise: rise.value 0 -> 1 brings it precisely
      // onto the path. The per-dot stagger delay lives in draw() so the
      // arrival reads as a crisp, ordered settling — never lockstep.
      if (!world.factDots || !world.factDots.length) {
        world.factDots = FACT_TS.map(function (ft) {
          return { t: ft, rise: { value: 0, target: 1 } };
        });
      } else {
        world.factDots.forEach(function (d) {
          if (!d.rise) d.rise = { value: 0, target: 1 };
          d.rise.target = 1;
        });
      }

      // ---- keep the character calm + present (don't re-create) ----
      var c = world.character;
      if (!c) {
        world.character = {
          xFrac: 0.16,
          yFrac: 0.52,
          scale: { value: 0.85, target: 0.9 },
          mood: "calm",
          glow: { value: 0.4, target: 0.45 },
          _drawX: null
        };
      } else {
        c.mood = "calm";
        c.glow.target = 0.45;
      }
    },

    onExit: function (world) {
      // Carry out the ribbon + the new fact-dots for the next beat.
      // Nothing scene-private to clear.
    },

    draw: function (p, t, world) {
      var W = world.w;
      var H = world.h;
      var e = DOT.ease(t);
      var rb = world.storyRibbon;

      // --- resolve ribbon points from live viewport every frame ---
      var pts = rb.pts.map(function (q) {
        return { x: q.xFrac * W, y: q.yFrac * H };
      });

      // Movement 1: the carried ribbon eases to its full, settled flow.
      DOT.tween(rb.flow, 0.08);
      if (rb.alive) DOT.tween(rb.alive, 0.06);
      var drawFrac = Math.min(rb.flow.value, e * 1.2); // intro draw-in
      var lastIdx = Math.max(1, Math.floor(drawFrac * (pts.length - 1)));

      // gentle ambient breath on the whole ribbon (rest motion, world.clock)
      var breath = Math.sin(world.clock * 0.0008) * 2.5;

      // ---- the SUBJECTIVE ribbon: a soft, secondary ink line ----
      // It stays quiet ink here — the BLUE (alive/active) belongs to the
      // new objective facts, the one thing arriving this beat.
      p.push();
      p.noFill();
      p.stroke(DOT.col(p, DOT.palette.ink, 0.42));
      p.strokeWeight(1); // LAW: hairline only
      p.strokeCap(p.ROUND);
      p.strokeJoin(p.ROUND);
      p.beginShape();
      p.curveVertex(pts[0].x, pts[0].y + breath);
      for (var i = 0; i <= lastIdx; i++) {
        p.curveVertex(pts[i].x, pts[i].y + breath);
      }
      p.curveVertex(pts[lastIdx].x, pts[lastIdx].y + breath);
      p.endShape();
      p.pop();

      // helper: sample point + unit normal at parameter ft along the path
      function sampleAt(ft) {
        var f = DOT.clamp(ft, 0, 1) * (pts.length - 1);
        var i0 = Math.floor(f);
        var i1 = Math.min(pts.length - 1, i0 + 1);
        var fr = f - i0;
        var x = DOT.lerp(pts[i0].x, pts[i1].x, fr);
        var y = DOT.lerp(pts[i0].y, pts[i1].y, fr) + breath;
        var tx = pts[i1].x - pts[i0].x;
        var ty = pts[i1].y - pts[i0].y;
        var mag = Math.hypot(tx, ty) || 1;
        // unit normal (perpendicular), pointing "up" off the path
        return { x: x, y: y, nx: -ty / mag, ny: tx / mag };
      }

      // Movement 2: discrete BLUE fact-dots rise + snap onto the path.
      // Per-dot stagger derived from index so they settle in order, never
      // in lockstep. Once held/revisited, the rise tween carries them.
      var dots = world.factDots || [];
      dots.forEach(function (d, idx) {
        var le = DOT.stagger(idx, dots.length, e, { spread: 0.5 });
        DOT.tween(d.rise, 0.12);
        // follow the staggered intro curve while introducing; once the
        // tween outpaces it (held / revisited), use the tween instead.
        var rise = le < d.rise.value ? le : d.rise.value;
        if (rise <= 0.001) return;

        var s = sampleAt(d.t);
        // each dot descends a short way DOWN onto the path as it arrives
        var drop = (1 - rise) * 30;
        var dx = s.x;
        var dy = s.y - drop; // come down from slightly above the line

        // faint connector tick from the path to the precise point
        // (objective rigor — the fact is anchored to the lived moment)
        DOT.hairline(p, s.x, s.y, dx, dy, {
          alpha: 0.22 * rise,
          hex: DOT.palette.accent,
          lip: 0
        });

        // the precise blue fact point — an ALIVE dot (baked light + breath)
        DOT.aliveDot(p, dx, dy, 5, {
          hex: DOT.palette.accent,
          alpha: rise,
          glow: 0.55,
          breath: world.clock,
          phase: idx * 1.3
        });
      });

      // ---- the CHARACTER, calm + present at the ribbon's start ----
      var c = world.character;
      if (c) {
        DOT.tween(c.scale, 0.1);
        DOT.tween(c.glow, 0.1);
        var startX = pts[0].x;
        var startY = pts[0].y + breath;
        c._drawX = c._drawX == null ? startX : DOT.lerp(c._drawX, startX, 0.12);
        DOT.drawCharacter(p, c._drawX, startY - 78, {
          scale: c.scale.value,
          mood: "calm",
          glow: c.glow.value,
          alpha: Math.min(1, e * 1.4),
          breath: world.clock,
          phase: 0.6
        });
      }
    }
  });
})();
