/* =====================================================================
 * BEAT 02 — "Age 50"  (scenes/02-age-50.js)
 * ---------------------------------------------------------------------
 * REFERENCE continuity scene #2 of 2 — this PROVES the model.
 *
 * It INHERITS `world.slider` from beat 01 (the SAME bar) and LENGTHENS it
 * rightward. "20" + its blue marker let go at the left; "50" arrives in
 * warm-red at the new right end with its own ALIVE marker. The character
 * rides to the new right end, still calm, still the same someone.
 *
 * THE LAW THIS DEMONSTRATES:
 *   Nothing is re-created. The bar persists in `world.slider` and its
 *   `value`s glide to new `target`s set here in onEnter. Combined with
 *   the shell's blur-up develop, the line visibly EXTENDS across the cut.
 *   Every other beat follows this exact carry-and-morph pattern: inherit
 *   a motif, retarget its tweens — never spawn a fresh copy.
 *
 * Movement budget: ONE movement (the bar extends + the label swaps).
 * Hairline strokes only. Alive dots. One accent fades out, one warm-red
 * caution-marker (the ending) fades in — color = meaning.
 * ===================================================================== */
(function () {
  "use strict";
  var DOT = window.DOT;

  window.SCENES.push({
    id: "age-50",
    note:
      "Thirty years later. SAME line — it just grew. We didn't draw a new " +
      "life; we extended the one we had. '20' lets go on the left; '50' " +
      "arrives in warm-red at the far end. That carry-and-morph is the " +
      "whole deck: every beat inherits a motif and moves it, never restarts.",

    onEnter: function (world) {
      // INHERIT the carried-in slider. If somehow missing (deep-link), seed
      // a sane post-beat-01 version so we never blank — but the intended
      // path carries it forward from beat 01.
      var s = world.slider;
      if (!s) {
        s = world.slider = {
          xFrac: 0.2,
          yFrac: 0.54,
          len: { value: 0.3, target: 0.3 },
          leftLabel: "20",
          rightLabel: { text: "50", alpha: { value: 0, target: 0 } },
          leftAlpha: { value: 1, target: 1 }
        };
      }

      // The MORPH: retarget the carried tweens. The shell's blur-up plus
      // these targets produce the visible extension + label swap.
      s.len.target = 0.6; // extend rightward (was 0.30)
      s.leftAlpha.target = 0.0; // "20" + blue marker let go
      s.rightLabel.alpha.target = 1.0; // "50" + warm-red marker arrive

      // Character rides to the new right end, mood stays calm.
      var c = world.character;
      if (c) {
        c.mood = "calm";
        c.glow.target = 0.42;
        c.scale.target = 1;
      }
    },

    onExit: function (world) {
      // Carry out the extended slider + character for whatever comes next.
    },

    draw: function (p, t, world) {
      var s = world.slider;
      var W = world.w;
      var H = world.h;
      var e = DOT.ease(t);

      var x0 = s.xFrac * W;
      var y0 = s.yFrac * H;

      // drive the morph: couple the tween rate to `e` so the extension
      // reads as a deliberate single movement, not an idle glide.
      var rate = DOT.lerp(0.04, 0.16, e);
      DOT.tween(s.len, rate);
      DOT.tween(s.leftAlpha, rate);
      DOT.tween(s.rightLabel.alpha, rate);

      var lenPx = s.len.value * W;
      var xEnd = x0 + lenPx;

      // ---- the SAME bar, now longer — one hairline modeled by light ---
      DOT.hairline(p, x0, y0, xEnd, y0, { alpha: 0.85, lip: 0.9 });

      // ---- left marker: ALIVE dot, fading out with "20" ---------------
      if (s.leftAlpha.value > 0.01) {
        DOT.aliveDot(p, x0, y0, 5.5, {
          hex: DOT.palette.accent,
          alpha: s.leftAlpha.value,
          glow: 0.5,
          breath: world.clock,
          phase: 0
        });
      }

      // ---- right marker: the ENDING — warm-red ALIVE dot, fading in ---
      DOT.aliveDot(p, xEnd, y0, 6, {
        hex: DOT.palette.warmRed,
        alpha: s.rightLabel.alpha.value,
        glow: 0.6,
        breath: world.clock,
        phase: 1.1
      });

      // ---- labels: "20" lets go (left), "50" arrives (right, warm-red)-
      DOT.label(p, s.leftLabel, x0, y0 + 30, {
        size: 12,
        alpha: 0.5 * s.leftAlpha.value,
        hex: DOT.palette.ink,
        align: p.CENTER
      });
      DOT.label(p, s.rightLabel.text, xEnd, y0 + 30, {
        size: 12,
        alpha: 0.7 * s.rightLabel.alpha.value,
        hex: DOT.palette.warmRed,
        align: p.CENTER
      });

      // ---- the character rides to the new right end -------------------
      var c = world.character;
      if (c) {
        DOT.tween(c.scale, 0.1);
        DOT.tween(c.glow, 0.1);
        var targetX = xEnd;
        c._drawX = c._drawX == null ? x0 + 0.3 * W : DOT.lerp(c._drawX, targetX, rate);
        var chY = y0 - 78;
        DOT.drawCharacter(p, c._drawX, chY, {
          scale: c.scale.value,
          mood: c.mood,
          glow: c.glow.value,
          alpha: 1,
          breath: world.clock,
          phase: 0.6
        });
      }
    }
  });
})();
