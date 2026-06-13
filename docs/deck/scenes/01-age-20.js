/* =====================================================================
 * BEAT 01 — "Age 20"  (scenes/01-age-20.js)
 * ---------------------------------------------------------------------
 * REFERENCE continuity scene #1 of 2. This file is a gold-standard
 * example of the taste — copy its shape, not just its mechanics.
 *
 * THE ONE GESTURE: a single horizontal age BAR draws in from the left as
 * two thin lines that come together into one hairline, with one ALIVE
 * marker dot at the left end and a faint mono "20" beneath it. The
 * character (the protagonist dot) rests above the marker, breathing.
 *
 * Introduces the SHARED motif `world.slider` (the bar) and the carried
 * `world.character`. Both are left in `world` for beat 02 to INHERIT and
 * MORPH — never re-create.
 *
 * Movement budget: ONE movement (the bar develops in from the left).
 * Strokes: HAIRLINE only (1px), modeled by light. Dots: ALIVE (baked
 * light + underglow + breath). One accent (the marker + character glow).
 * ===================================================================== */
(function () {
  "use strict";
  var DOT = window.DOT;

  window.SCENES.push({
    id: "age-20",
    note:
      "We start at twenty. One thin line, one marker, one quiet number. " +
      "This is a life — measured, simple. The dot above is you: calm, " +
      "present, breathing. Watch the line — it carries into the next beat " +
      "and keeps growing. Nothing here restarts.",

    onEnter: function (world) {
      // Seed the slider motif ONLY if not already carried in (idempotent).
      var s = world.slider;
      if (!s) {
        s = world.slider = {
          xFrac: 0.2, // left start (fraction of width)
          yFrac: 0.54, // baseline (fraction of height)
          len: { value: 0.0, target: 0.3 }, // grows in to 0.30w
          leftLabel: "20",
          rightLabel: { text: "50", alpha: { value: 0, target: 0 } },
          leftAlpha: { value: 0, target: 1 } // "20" + left marker fade in
        };
      } else {
        s.xFrac = 0.2;
        s.yFrac = 0.54;
        s.len.target = 0.3;
        s.leftAlpha.target = 1;
        s.rightLabel.alpha.target = 0;
      }

      // Seed the character if absent (carried out to beat 02).
      if (!world.character) {
        world.character = {
          xFrac: 0.2,
          yFrac: 0.54,
          scale: { value: 0.86, target: 1 },
          mood: "calm",
          glow: { value: 0.3, target: 0.5 },
          _drawX: null // live px, glided in draw()
        };
      } else {
        world.character.mood = "calm";
        world.character.glow.target = 0.5;
        world.character.scale.target = 1;
      }
    },

    onExit: function (world) {
      // Carry out slider + character. Nothing scene-private to clear.
    },

    draw: function (p, t, world) {
      var s = world.slider;
      var W = world.w;
      var H = world.h;
      var e = DOT.ease(t); // house ease — fast out, long settle

      // resolve baseline geometry from live viewport (survives resize)
      var x0 = s.xFrac * W;
      var y0 = s.yFrac * H;

      // continuity handles glide toward target; the intro `e` only shapes
      // the FIRST arrival of the draw-in length.
      DOT.tween(s.len, 0.1);
      DOT.tween(s.leftAlpha, 0.12);
      DOT.tween(s.rightLabel.alpha, 0.12);
      var lenPx = s.len.value * e * W; // draw-in from the left

      // ---- the BAR: two thin lines that COME TOGETHER into one --------
      // Early in the beat the line is split into a faint upper + lower
      // hairline that converge into a single line — "the dot morphs
      // together out of thin lines." By settle they are one hairline.
      var converge = DOT.clamp(DOT.map(e, 0.0, 0.55, 1, 0), 0, 1); // 1 -> 0
      var gap = 5 * converge;
      var splitA = 0.7 * (1 - converge) + 0.28 * converge;
      if (gap > 0.4) {
        DOT.hairline(p, x0, y0 - gap, x0 + lenPx, y0 - gap, { alpha: 0.28, lip: 0 });
        DOT.hairline(p, x0, y0 + gap, x0 + lenPx, y0 + gap, { alpha: 0.28, lip: 0 });
      }
      // the resolved single hairline, modeled by light
      DOT.hairline(p, x0, y0, x0 + lenPx, y0, { alpha: 0.85 * (1 - converge) + 0.3, lip: 0.9 });

      // ---- left marker: an ALIVE dot ---------------------------------
      DOT.aliveDot(p, x0, y0, 5.5, {
        hex: DOT.palette.accent,
        alpha: s.leftAlpha.value,
        glow: 0.6,
        breath: world.clock,
        phase: 0
      });

      // ---- "20" — faint mono, beneath the marker ---------------------
      DOT.label(p, s.leftLabel, x0, y0 + 30, {
        size: 12,
        alpha: 0.5 * s.leftAlpha.value,
        hex: DOT.palette.ink,
        align: p.CENTER
      });

      // ---- the CHARACTER, resting above the left marker --------------
      var c = world.character;
      DOT.tween(c.scale, 0.1);
      DOT.tween(c.glow, 0.1);
      var targetX = c.xFrac * W;
      c._drawX = c._drawX == null ? targetX : DOT.lerp(c._drawX, targetX, 0.12);
      var chY = y0 - 78;
      DOT.drawCharacter(p, c._drawX, chY, {
        scale: c.scale.value,
        mood: c.mood,
        glow: c.glow.value,
        alpha: Math.min(1, e * 1.5),
        breath: world.clock,
        phase: 0.6
      });
    }
  });
})();
