/* =====================================================================
 * BEAT 22 — "Check-ins"  (scenes/22-checkins.js)
 * ---------------------------------------------------------------------
 * "It checks in over time — so the truth isn't one exaggerated moment."
 *
 * THE ONE GESTURE: across the SAME carried timeline bar, a small row of
 * check-in pings lights up one after another — now, +3h, +6h — in a calm,
 * staggered rhythm. Truth isn't one loud moment; it's gathered over time.
 * Each ping is an alive blue dot rising on the line, breathing at rest.
 *
 * CARRY-IN  : world.slider (the timeline bar) — INHERITED, never re-made.
 *             world.character (the dot) — rests above, calm, present.
 * NEW MOTIF : world.checkins — the row of pings on the bar (scene-private,
 *             cleared on exit so the next beat doesn't inherit it).
 *
 * Movement budget: ONE movement (the pings light up across the line in a
 * staggered rhythm). Hairline bar. Alive dots. One accent (blue) on the
 * pings as they come alive. Nothing flashes; nothing bounces.
 * ===================================================================== */
(function () {
  "use strict";
  var DOT = window.DOT;

  // Fractional positions of each ping along the bar (now, +3h, +6h, ...).
  var TICKS = [0.16, 0.42, 0.68, 0.92];

  window.SCENES.push({
    id: "checkins",
    note:
      "It checks in over time — so the truth isn't one exaggerated moment.",

    onEnter: function (world) {
      // INHERIT the carried timeline bar. Seed a sane version only if we
      // were deep-linked straight here (never blank out).
      var s = world.slider;
      if (!s) {
        s = world.slider = {
          xFrac: 0.2,
          yFrac: 0.54,
          len: { value: 0.6, target: 0.6 },
          leftLabel: "20",
          rightLabel: { text: "50", alpha: { value: 0, target: 0 } },
          leftAlpha: { value: 0, target: 0 }
        };
      }
      // This beat reads the bar purely as a quiet timeline: hush the old
      // age endpoints so the pings — not the numbers — carry the meaning.
      s.len.target = 0.6;
      s.leftAlpha.target = 0.0;
      s.rightLabel.alpha.target = 0.0;

      // Seed (or retarget) the row of check-in pings on the bar.
      var ck = world.checkins;
      if (!ck) {
        ck = world.checkins = {
          ticks: TICKS.map(function (f, i) {
            return {
              f: f,
              rise: { value: 0, target: 1 }, // 0 = dormant on line, 1 = lit
              phase: i * 1.3 // own breath phase so they don't pulse as one
            };
          })
        };
      } else {
        ck.ticks.forEach(function (tk) {
          tk.rise.target = 1;
        });
      }

      // Character rests centered above the line, calm and present —
      // watching the rhythm, not riding to an endpoint.
      var c = world.character;
      if (c) {
        c.mood = "calm";
        c.glow.target = 0.45;
        c.scale.target = 1;
      }
    },

    onExit: function (world) {
      // Carry out the bar + character. Clear the scene-private pings so the
      // next beat doesn't inherit this row.
      world.checkins = null;
    },

    draw: function (p, t, world) {
      var s = world.slider;
      var W = world.w;
      var H = world.h;
      var e = DOT.ease(t); // house ease — fast out, long settle

      // resolve timeline geometry from the live viewport every frame
      var x0 = s.xFrac * W;
      var y0 = s.yFrac * H;

      // glide the carried bar toward its calm targets
      DOT.tween(s.len, 0.1);
      DOT.tween(s.leftAlpha, 0.12);
      DOT.tween(s.rightLabel.alpha, 0.12);

      var lenPx = s.len.value * W;
      var xEnd = x0 + lenPx;

      // ---- the SAME timeline bar — one hairline modeled by light ------
      DOT.hairline(p, x0, y0, xEnd, y0, { alpha: 0.85, lip: 0.9 });

      // ---- the single movement: check-in pings light up, staggered ----
      // Each ping's local progress is offset by index, so they come alive
      // one after another (now, +3h, +6h) — a calm rhythm, never lockstep,
      // never flashing.
      var ck = world.checkins;
      if (ck) {
        for (var i = 0; i < ck.ticks.length; i++) {
          var tk = ck.ticks[i];
          DOT.tween(tk.rise, 0.12);

          // staggered arrival of THIS ping along the intro window
          var local = DOT.stagger(i, ck.ticks.length, e, { spread: 0.62 });
          var lit = tk.rise.value * local;

          var px = x0 + tk.f * lenPx;

          // a quiet hairline tether up from the bar marks where the
          // check-in lands as it rises — modeled by light, no flat border
          var stemH = 16 * lit;
          if (stemH > 0.5) {
            DOT.hairline(p, px, y0, px, y0 - stemH, {
              alpha: 0.22 * lit,
              lip: 0
            });
          }

          // the ping: an alive blue dot rising just above the line,
          // breathing at rest (own phase so the row breathes organically)
          var pingY = y0 - stemH;
          DOT.aliveDot(p, px, pingY, 4.5, {
            hex: DOT.palette.accent,
            alpha: lit,
            glow: 0.55,
            breath: world.clock,
            phase: tk.phase
          });
        }
      }

      // ---- the character, resting above the line, calm and present ----
      var c = world.character;
      if (c) {
        DOT.tween(c.scale, 0.1);
        DOT.tween(c.glow, 0.1);
        var targetX = x0 + 0.5 * lenPx; // centered over the run of check-ins
        c._drawX = c._drawX == null ? targetX : DOT.lerp(c._drawX, targetX, 0.1);
        var chY = y0 - 86;
        DOT.drawCharacter(p, c._drawX, chY, {
          scale: c.scale.value,
          mood: c.mood,
          glow: c.glow.value,
          alpha: Math.min(1, e * 1.4),
          breath: world.clock,
          phase: 0.6
        });
      }
    }
  });
})();
