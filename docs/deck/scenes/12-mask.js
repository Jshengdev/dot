/* =====================================================================
 * BEAT 12 — "Mask"  (scenes/12-mask.js)
 * ---------------------------------------------------------------------
 * THE WORDS: "All their energy went into looking normal enough — to not
 * be labeled 'something wrong.'"
 *
 * THE ONE GESTURE: a single CALM SURFACE hairline settles flat across the
 * frame — a smooth, composed mask — while just beneath it a TURBULENT
 * under-thread churns (read off world.clock, never bouncing, never loud).
 * The carried protagonist rides on the surface wearing the calm face;
 * the whole cost lives below the waterline, hidden. The mask holds.
 *
 * Carry-and-morph: INHERITS world.character (the same someone) and rests
 * it on the surface, mood 'calm' — but the under-layer betrays the cost.
 * Introduces world.mask (the surface + under pair) for any later beat.
 *
 * Movement budget: ONE movement — the surface develops in and goes
 * dead-flat over the agitation (t-driven). Hairline strokes only (≤1px).
 * The surface is ink at alpha (composed); the under-thread is the ONE
 * warm-red caution line — the "something wrong" being held down. Dots
 * alive. ≤1 whimsy: the calm line is perfectly flat while the thread
 * beneath never stops moving.
 * ===================================================================== */
(function () {
  "use strict";
  var DOT = window.DOT;

  window.SCENES.push({
    id: "mask",
    note:
      "All their energy went into looking normal enough — to not be " +
      "labeled 'something wrong.' The surface line is the mask: smooth, " +
      "composed, dead-flat. But just beneath it a thread never stops " +
      "churning. The calm you see is held by everything you don't.",

    onEnter: function (world) {
      // Seed the mask motif ONLY if absent (idempotent / deep-link safe).
      var m = world.mask;
      if (!m) {
        m = world.mask = {
          xFrac: 0.2, // left start (echoes the slider's anchor)
          yFrac: 0.54, // surface baseline
          len: { value: 0.0, target: 0.6 }, // the surface draws across
          calm: { value: 0.0, target: 1.0 }, // 0 = churn shows, 1 = flat mask
          underAlpha: { value: 0.0, target: 0.34 } // the held thread, faint
        };
      } else {
        m.xFrac = 0.2;
        m.yFrac = 0.54;
        m.len.target = 0.6;
        m.calm.target = 1.0;
        m.underAlpha.target = 0.34;
      }

      // Inherit the SAME character; rest it on the surface, mask = calm.
      var c = world.character;
      if (!c) {
        world.character = {
          xFrac: 0.5,
          yFrac: 0.54,
          scale: { value: 0.92, target: 1 },
          mood: "calm",
          glow: { value: 0.4, target: 0.42 },
          _drawX: null
        };
      } else {
        c.mood = "calm"; // the face stays composed — that IS the point
        c.glow.target = 0.42;
        c.scale.target = 1;
      }
    },

    onExit: function (world) {
      // Carry out mask + character. Nothing scene-private to clear.
    },

    draw: function (p, t, world) {
      var m = world.mask;
      var W = world.w;
      var H = world.h;
      var e = DOT.ease(t); // house ease — fast out, long settle

      // fallback seed — never blank on a deep-link
      if (!m) {
        m = world.mask = {
          xFrac: 0.2,
          yFrac: 0.54,
          len: { value: 0.6, target: 0.6 },
          calm: { value: 1, target: 1 },
          underAlpha: { value: 0.34, target: 0.34 }
        };
      }

      var x0 = m.xFrac * W;
      var y0 = m.yFrac * H;

      // continuity glide; couple the calm-settle to `e` so the mask going
      // flat reads as the single deliberate movement of the beat.
      DOT.tween(m.len, 0.1);
      DOT.tween(m.underAlpha, 0.12);
      DOT.tween(m.calm, DOT.lerp(0.04, 0.16, e));

      var lenPx = m.len.value * e * W; // surface develops across from left
      var xEnd = x0 + lenPx;
      var calm = m.calm.value; // 1 = composed, 0 = churn exposed
      var churn = 1 - calm;
      var clk = world.clock / 1000;
      var seg = 26;

      // ---- the UNDER-LAYER: a turbulent thread, the held "something" ----
      // A low-amplitude churn read off the clock (never bounces, never
      // flashes) — the cost of looking fine, sitting just below the
      // surface. Tapered at the ends so it lives UNDER, not past, the mask.
      var amp = 11 * (0.4 + 0.6 * churn); // mostly hidden once the mask sets
      var underY = y0 + 13;
      var px = x0,
        py = underY;
      for (var i = 1; i <= seg; i++) {
        var f = i / seg;
        var x = x0 + f * lenPx;
        // two incommensurate waves so it reads organic, not a clean ripple
        var wob =
          Math.sin(f * 9.0 + clk * 2.1) * amp +
          Math.sin(f * 17.0 - clk * 1.3) * amp * 0.4;
        var taper = Math.sin(f * Math.PI); // sit under the surface, not beyond
        var y = underY + wob * taper;
        DOT.hairline(p, px, py, x, y, {
          alpha: m.underAlpha.value,
          hex: DOT.palette.warmRed,
          lip: 0
        });
        px = x;
        py = y;
      }

      // ---- the SURFACE: the MASK — one dead-flat hairline, modeled by
      // light. Early in the beat it carries a faint residual waver (the
      // composure not yet set); by settle it is perfectly, deliberately
      // flat — the smooth normal-enough face over the churn below.
      var surfWaver = 1.5 * churn;
      if (surfWaver > 0.25) {
        var spx = x0,
          spy = y0;
        for (var j = 1; j <= seg; j++) {
          var sf = j / seg;
          var sx = x0 + sf * lenPx;
          var sy =
            y0 + Math.sin(sf * 9.0 + clk * 2.1) * surfWaver * Math.sin(sf * Math.PI);
          DOT.hairline(p, spx, spy, sx, sy, { alpha: 0.85, lip: 0.9 });
          spx = sx;
          spy = sy;
        }
      } else {
        DOT.hairline(p, x0, y0, xEnd, y0, { alpha: 0.85, lip: 0.9 });
      }

      // a faint mono whisper of what's being maintained — barely there
      DOT.label(p, "normal enough", (x0 + xEnd) / 2, y0 - 116, {
        size: 11,
        alpha: 0.34 * e,
        hex: DOT.palette.ink,
        align: p.CENTER
      });

      // ---- the CHARACTER on the surface — composed, the same someone ----
      var c = world.character;
      if (c) {
        DOT.tween(c.scale, 0.1);
        DOT.tween(c.glow, 0.1);
        var targetX = (x0 + xEnd) / 2;
        c._drawX = c._drawX == null ? targetX : DOT.lerp(c._drawX, targetX, 0.12);
        var chY = y0 - 78;
        DOT.drawCharacter(p, c._drawX, chY, {
          scale: c.scale.value,
          mood: c.mood, // calm — the mask is the whole point
          glow: c.glow.value,
          alpha: Math.min(1, e * 1.5),
          breath: world.clock,
          phase: 0.6
        });
      }
    }
  });
})();
