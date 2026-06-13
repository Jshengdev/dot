/* =====================================================================
 * BEAT 08 — "Normal"  (scenes/08-normal.js)
 * ---------------------------------------------------------------------
 * Speaker note (spoken, NOT drawn): "To feel normal again."
 *
 * THE ONE GESTURE: the carried-in character arrives with a fine tremble
 * (the unwell shake) and SETTLES. The tremble decays to nothing as the
 * dot glides to dead-center, its warm-red caution releasing into a calm,
 * blue, breathing glow. From shaking to still. The feeling of normal.
 *
 * CARRY-AND-MORPH: inherits `world.character` (never re-creates it) and
 * retargets it to calm + centered + steady. The calm character is left
 * in `world` for the next beat to inherit.
 *
 * Movement budget: ONE movement (the tremble decays as the dot centers
 * and its glow steadies). Hairline + alive helpers only. One accent
 * (blue — the live calm glow). No on-screen sentences.
 * ===================================================================== */
(function () {
  "use strict";
  var DOT = window.DOT;

  window.SCENES.push({
    id: "normal",
    note:
      "To feel normal again. The dot was trembling; now it lets go. It " +
      "settles to center, the shake decays to nothing, and the glow " +
      "steadies into a calm, even breath. Not better-than — just normal. " +
      "The calm character carries forward from here.",

    onEnter: function (world) {
      // INHERIT the carried-in character; seed a sane fallback only on a
      // deep-link so we never blank.
      var c = world.character;
      if (!c) {
        c = world.character = {
          xFrac: 0.5,
          yFrac: 0.5,
          scale: { value: 0.94, target: 1 },
          mood: "tense",
          glow: { value: 0.3, target: 0.5 },
          _drawX: null
        };
      }
      // The MORPH: ride it home to center, calm, steady.
      c.xFrac = 0.5;
      c.yFrac = 0.5;
      c.mood = "tense"; // arrives shaken; resolves to calm during draw
      c.scale.target = 1;
      c.glow.target = 0.5; // steady, even glow — "normal"

      // Scene-private tremble amplitude (px). A tweenable {value,target}
      // so the decay survives a hold/revisit instead of riding `t`.
      // Nulled in onExit so later beats inherit a calm dot, not a shake.
      world.tremble = world.tremble || { value: 0, target: 0 };
      world.tremble.value = 6; // arrives shaking
      world.tremble.target = 0; // settles to still
    },

    onExit: function (world) {
      // Carry out the calm character; clear the scene-private tremble.
      var c = world.character;
      if (c) c.mood = "calm";
      world.tremble = null;
    },

    draw: function (p, t, world) {
      var c = world.character;
      var W = world.w;
      var H = world.h;
      var e = DOT.ease(t); // house ease — fast out, long settle

      // Resolve the home anchor from the live viewport (survives resize).
      var homeX = c.xFrac * W;
      var homeY = c.yFrac * H;

      // ---- THE MOVEMENT: the tremble quiets as the dot centers --------
      // Couple the decay rate to `e` so settling reads as one deliberate
      // movement, not an idle drift.
      var tr = world.tremble || { value: 0, target: 0 };
      DOT.tween(tr, DOT.lerp(0.05, 0.2, e));

      // A fine, organic shake from the ambient clock (not flashing) whose
      // amplitude is the decaying tremble. Two coprime frequencies so it
      // never reads as a clean sine — it reads as unsteady.
      var ck = world.clock || 0;
      var shakeX = tr.value * (Math.sin(ck * 0.041) * 0.6 + Math.sin(ck * 0.071 + 1.3) * 0.4);
      var shakeY = tr.value * (Math.sin(ck * 0.053 + 0.7) * 0.6 + Math.sin(ck * 0.029) * 0.4);

      // Glide to center; layer the (decaying) shake on top.
      c._drawX = c._drawX == null ? homeX : DOT.lerp(c._drawX, homeX, DOT.lerp(0.06, 0.14, e));
      var chX = c._drawX + shakeX;
      var chY = homeY + shakeY;

      // Past the midpoint the warm-red tension releases into calm blue.
      if (tr.value < 2) c.mood = "calm";
      DOT.tween(c.scale, 0.1);
      DOT.tween(c.glow, 0.1);

      // ---- a single faint "home" tick beneath the dot -----------------
      // The mark it settles onto — one small hairline, modeled by light,
      // earning its place only once the dot is nearly still.
      var settled = 1 - DOT.clamp(tr.value / 6, 0, 1); // 0 shaking -> 1 still
      if (settled > 0.02) {
        DOT.hairline(p, homeX - 14, homeY + 52, homeX + 14, homeY + 52, {
          alpha: 0.22 * settled,
          lip: 0.9
        });
      }

      // ---- the CHARACTER, settling into calm at center ----------------
      DOT.drawCharacter(p, chX, chY, {
        scale: c.scale.value,
        mood: c.mood,
        glow: c.glow.value,
        alpha: 1,
        breath: world.clock,
        phase: 0.6
      });
    }
  });
})();
