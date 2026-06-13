/* =====================================================================
 * BEAT 15 — "Two truths"  (scenes/15-two-truths.js)
 * ---------------------------------------------------------------------
 * "There are always two truths." The flowing story-ribbon (SUBJECTIVE,
 * soft ink) and the discrete blue fact-dots (OBJECTIVE, precise) — held
 * clearly SIDE BY SIDE. Up to beat 14 they were laid over the same line;
 * the one gesture here PULLS THEM APART: the felt ribbon drifts up into
 * its own register, the objective facts settle into a clean row below.
 * Same life, two truths, both true.
 *
 * CARRY-IN (inherited; seeded as a sane fallback only if deep-linked):
 *   world.storyRibbon  — the flowing path (the felt life): { pts, flow, alpha }
 *   world.factDots     — the precise blue evidence points: [ { t, rise } ]
 *   world.character    — the protagonist dot (kept calm)
 *
 * CARRY-OUT (left in world — they RETURN inside DOT downstream):
 *   world.storyRibbon  — now drifted into its own upper register
 *   world.factDots     — now resolved into their own lower row
 *
 * Movement budget: ONE gesture — the two registers SEPARATE: the ribbon
 * eases up, the fact-dots ease down into a precise row. Driven by a
 * shared continuity split tween so it survives a hold/revisit.
 * ===================================================================== */
(function () {
  "use strict";
  var DOT = window.DOT;

  // fractional t's along the felt ribbon where the facts were anchored (beat 14)
  var FACT_TS = [0.16, 0.34, 0.5, 0.66, 0.83];

  window.SCENES.push({
    id: "two-truths",
    note:
      "There are always two truths. The flowing story is how a life was " +
      "felt — subjective, continuous. The blue points are what actually " +
      "happened — objective, discrete. We hold them side by side; neither " +
      "replaces the other. Both motifs carry forward, inside DOT.",

    onEnter: function (world) {
      // ---- INHERIT the felt ribbon; seed a sane fallback if deep-linked ----
      var rb = world.storyRibbon;
      if (!rb || !rb.pts || !rb.pts.length) {
        var pts = [];
        var n = 48;
        for (var i = 0; i <= n; i++) {
          var f = i / n;
          pts.push({
            xFrac: 0.12 + 0.76 * f,
            yFrac: 0.5 + 0.12 * Math.sin(f * Math.PI * 2.0)
          });
        }
        rb = world.storyRibbon = {
          pts: pts,
          flow: { value: 1, target: 1 },
          alpha: { value: 1, target: 1 }
        };
      } else {
        if (!rb.flow) rb.flow = { value: 1, target: 1 };
        if (!rb.alpha) rb.alpha = { value: 1, target: 1 };
        rb.flow.target = 1.0;
        rb.alpha.target = 1.0;
      }

      // The SPLIT: a shared continuity tween that survives hold/revisit.
      // 0 = the two registers sit on one line (as they arrived from beat 14);
      // 1 = fully separated. Namespaced on the ribbon so it carries forward.
      if (!rb.split) rb.split = { value: 0, target: 0 };
      rb.split.target = 1;

      // ---- INHERIT the objective fact-dots; seed fallback if missing ----
      if (!world.factDots || !world.factDots.length) {
        world.factDots = FACT_TS.map(function (ft) {
          return { t: ft, rise: { value: 1, target: 1 } };
        });
      } else {
        world.factDots.forEach(function (d) {
          if (!d.rise) d.rise = { value: 1, target: 1 };
          d.rise.target = 1;
        });
      }

      // ---- keep the character calm + present (don't re-create) ----
      var c = world.character;
      if (!c) {
        world.character = {
          xFrac: 0.12,
          yFrac: 0.5,
          scale: { value: 0.88, target: 0.9 },
          mood: "calm",
          glow: { value: 0.4, target: 0.45 }
        };
      } else {
        c.mood = "calm";
        c.glow.target = 0.45;
      }
    },

    onExit: function (world) {
      // Carry out BOTH truths — they return inside DOT downstream.
      // Nothing scene-private to clear.
    },

    draw: function (p, t, world) {
      var W = world.w;
      var H = world.h;
      var e = DOT.ease(t);
      var rb = world.storyRibbon;

      // settle the carried numbers
      DOT.tween(rb.flow, 0.1);
      DOT.tween(rb.alpha, 0.12);
      // couple the split tween to `e` so the separation reads as one
      // deliberate movement, not an idle drift.
      DOT.tween(rb.split, DOT.lerp(0.04, 0.14, e));
      var split = rb.split.value;

      // vertical separation (px) the two registers pull apart by, scaled
      // off the viewport so it survives resize. Ribbon up, facts down.
      var sep = 0.13 * H * split;

      // resolve ribbon points from live viewport; lift the whole flow UP.
      var pts = rb.pts.map(function (q) {
        return { x: q.xFrac * W, y: q.yFrac * H - sep };
      });

      // ambient breath for the ribbon (rest motion — clock, not t)
      var breathe = Math.sin(world.clock * 0.0008) * 2.5;

      // ---- TRUTH ONE — the SUBJECTIVE ribbon (soft, secondary ink) ----
      // The felt line is one continuous HAIRLINE (LAW: ≤1px) — modeled by
      // light, not weight; the warmth/aliveness is carried by the dots, not
      // a fat stroke. A faint white lip beneath catches the page's light.
      p.push();
      p.noFill();
      p.strokeCap(p.ROUND);
      p.strokeJoin(p.ROUND);
      // white lower lip (depth from light, never a border)
      var rlip = p.color(255, 255, 255);
      rlip.setAlpha(255 * 0.4 * rb.alpha.value);
      p.stroke(rlip);
      p.strokeWeight(1);
      p.beginShape();
      for (var li = 0; li < pts.length; li++) {
        p.curveVertex(pts[li].x, pts[li].y + breathe + 1);
      }
      p.endShape();
      // the ink hairline
      var rc = p.color(DOT.palette.ink);
      rc.setAlpha(255 * 0.5 * rb.alpha.value);
      p.stroke(rc);
      p.strokeWeight(1);
      p.beginShape();
      for (var i = 0; i < pts.length; i++) {
        p.curveVertex(pts[i].x, pts[i].y + breathe);
      }
      p.endShape();
      p.pop();

      // faint mono register tag for the felt truth (only once separated)
      DOT.label(p, "felt", 0.12 * W, pts[0].y + breathe - 24, {
        size: 11,
        alpha: 0.4 * split,
        hex: DOT.palette.ink,
        align: p.LEFT
      });

      // sample a point on the FELT ribbon at parameter ft (where a fact began)
      function sampleAt(ft) {
        var f = DOT.clamp(ft, 0, 1) * (pts.length - 1);
        var i0 = Math.floor(f);
        var i1 = Math.min(pts.length - 1, i0 + 1);
        var fr = f - i0;
        return {
          x: DOT.lerp(pts[i0].x, pts[i1].x, fr),
          y: DOT.lerp(pts[i0].y, pts[i1].y, fr) + breathe
        };
      }

      // ---- TRUTH TWO — the OBJECTIVE fact-dots, settling into a row ----
      // Each dot eases DOWN from its point on the felt ribbon to a clean,
      // precise baseline row — the objective register, held below.
      var rowY = 0.5 * H + sep; // the clean fact row, pushed down as we split
      var dots = world.factDots || [];
      dots.forEach(function (d, di) {
        DOT.tween(d.rise, 0.12);
        var a = d.rise.value;
        var srcPt = sampleAt(d.t);
        var dx = srcPt.x;
        // glide from the felt-ribbon point down to the precise row
        var dy = DOT.lerp(srcPt.y, rowY, split);

        // hairline connector: the same fact, two registers (drawn while split)
        if (split > 0.02) {
          DOT.hairline(p, srcPt.x, srcPt.y, dx, dy, {
            alpha: 0.16 * split * a,
            hex: DOT.palette.accent,
            lip: 0
          });
        }

        // the precise OBJECTIVE point — an ALIVE accent dot (baked light +
        // underglow + breath), per the law. These are the SAME fact-dots
        // that gather into the glass at beat 21 — they must read alive here.
        DOT.aliveDot(p, dx, dy, 4.5, {
          hex: DOT.palette.accent,
          alpha: a,
          glow: 0.55,
          breath: world.clock,
          phase: di * 1.1
        });
      });

      // faint hairline baseline under the fact row — the objective register
      if (split > 0.04 && dots.length) {
        var xs = dots.map(function (d) { return sampleAt(d.t).x; });
        var minX = Math.min.apply(null, xs);
        var maxX = Math.max.apply(null, xs);
        DOT.hairline(p, minX - 18, rowY, maxX + 18, rowY, {
          alpha: 0.18 * split,
          lip: 0.6
        });
      }

      // faint mono register tag for the objective truth
      DOT.label(p, "happened", 0.12 * W, rowY + 30, {
        size: 11,
        alpha: 0.4 * split,
        hex: DOT.palette.accent,
        align: p.LEFT
      });

      // ---- the CHARACTER, calm + present, riding above the felt line ----
      var c = world.character;
      if (c) {
        DOT.tween(c.scale, 0.1);
        DOT.tween(c.glow, 0.1);
        DOT.drawCharacter(p, pts[0].x, pts[0].y + breathe - 78, {
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
