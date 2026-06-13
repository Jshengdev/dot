/* =====================================================================
 * BEAT 16 — "Courage"  (scenes/16-courage.js)
 * ---------------------------------------------------------------------
 * "So you find the courage to see a doctor."
 *
 * The carried-in CHARACTER steps forward — gliding rightward toward a
 * simple DOORWAY: two hairlines that come together into an upright
 * threshold, with a calm PROVIDER figure (the same identical character,
 * smaller) waiting just inside, gazing back. TWO movements only:
 *   1. the character takes one deliberate step toward the threshold (t).
 *   2. the doorway develops in (its two thin uprights converge) and the
 *      provider warms into presence.
 *
 * Built ENTIRELY from DOT helpers — every line via DOT.hairline (≤1px,
 * modeled by light), every dot via DOT.aliveDot / DOT.drawCharacter. No
 * raw rects, no washes, no gradients, no stroke >1px.
 *
 * CARRY-IN  (inherited, never re-created):
 *   world.character — the protagonist dot.
 * CARRY-OUT (left in world for the next beat):
 *   world.character — handed forward at a calm, centered geometry
 *                     (scale.target = 1) so beat 17 can squeeze it.
 * SCENE-PRIVATE (nulled on exit):
 *   world.doorway — { xFrac, yFrac, hFrac, open:{value,target},
 *                     provider:{value,target} }
 *
 * Movement budget: 2 movements — step-forward + threshold develops open.
 * ===================================================================== */
(function () {
  "use strict";
  var DOT = window.DOT;

  window.SCENES.push({
    id: "courage",
    note:
      "So you find the courage to see a doctor. The dot steps forward — " +
      "toward a simple doorway, a calm figure waiting on the other side. " +
      "No alarm, no rush. Just one quiet step across the threshold.",

    onEnter: function (world) {
      // INHERIT the carried character. Seed a sane left-of-center default
      // if deep-linked straight here, so we never blank out.
      var c = world.character;
      if (!c) {
        c = world.character = {
          xFrac: 0.34,
          yFrac: 0.5,
          scale: { value: 1, target: 1 },
          mood: "calm",
          glow: { value: 0.45, target: 0.5 },
          _drawX: null
        };
      }
      // The step-forward morph: retarget the character toward the threshold.
      // (Horizontal glide is driven in draw via c._drawX.)
      c.xFrac = 0.6; // one step toward the doorway on the right
      c.yFrac = 0.5;
      c.mood = "calm";
      c.glow.target = 0.55;
      c.scale.target = 1; // handed forward un-squeezed for beat 17

      // Seed the scene-private DOORWAY motif (idempotent on re-entry).
      var d = world.doorway;
      if (!d) {
        d = world.doorway = {
          xFrac: 0.76, // threshold sits to the right
          yFrac: 0.5,
          hFrac: 0.32, // threshold height as a fraction of min(w,h)
          open: { value: 0.0, target: 1.0 }, // threshold lines converge in
          provider: { value: 0.0, target: 1.0 } // provider figure warms up
        };
      } else {
        d.open.target = 1.0;
        d.provider.target = 1.0;
      }
    },

    onExit: function (world) {
      // Carry out the character at the threshold, calm and un-squeezed.
      // Drop the scene-private doorway so later beats don't inherit it.
      world.doorway = null;
    },

    draw: function (p, t, world) {
      var W = world.w;
      var H = world.h;
      var e = DOT.ease(t);
      var c = world.character;
      var d = world.doorway;

      // resolve geometry from the live viewport each frame (survives resize)
      var doorX = d.xFrac * W;
      var floorY = d.yFrac * H + Math.min(W, H) * 0.06; // threshold floor
      var doorH = Math.min(W, H) * d.hFrac;
      var halfW = Math.min(W, H) * 0.07; // half the doorway's width

      // ---- MOVEMENT 2: the doorway develops open ---------------------
      DOT.tween(d.open, DOT.lerp(0.04, 0.14, e));
      DOT.tween(d.provider, DOT.lerp(0.03, 0.12, e));
      var openA = d.open.value;

      // the two uprights begin slightly splayed (two thin lines) and
      // converge to vertical as the threshold "comes together" — same
      // come-together gesture as the reference bar.
      var converge = DOT.clamp(DOT.map(e, 0.0, 0.6, 1, 0), 0, 1); // 1 -> 0
      var splay = 10 * converge; // px lean at the top, settles to 0
      var topY = floorY - doorH * openA;

      // left & right uprights — hairlines, modeled by light
      DOT.hairline(
        p,
        doorX - halfW - splay, topY,
        doorX - halfW, floorY,
        { alpha: 0.7 * openA, lip: 0.6 }
      );
      DOT.hairline(
        p,
        doorX + halfW + splay, topY,
        doorX + halfW, floorY,
        { alpha: 0.7 * openA, lip: 0.6 }
      );
      // the lintel across the top — fades in as the threshold resolves
      DOT.hairline(
        p,
        doorX - halfW - splay, topY,
        doorX + halfW + splay, topY,
        { alpha: 0.55 * openA * (1 - converge), lip: 0.6 }
      );
      // a quiet threshold hairline at the floor — where the step lands
      DOT.hairline(
        p,
        doorX - halfW * 1.35, floorY,
        doorX + halfW * 1.35, floorY,
        { alpha: 0.4 * openA, lip: 0.9 }
      );

      // ---- the PROVIDER waiting inside the threshold -----------------
      // the same identical character helper, small + calm, gazing back
      // toward the approaching dot (look = -1, toward the left).
      var provA = d.provider.value;
      if (provA > 0.001) {
        DOT.drawCharacter(p, doorX, floorY - doorH * 0.55, {
          scale: 0.6,
          mood: "calm",
          glow: 0.4 * provA,
          alpha: provA,
          look: -1, // looks toward the arriving character
          breath: world.clock,
          phase: 2.1
        });
      }

      // ---- MOVEMENT 1: the CHARACTER steps forward -------------------
      DOT.tween(c.scale, 0.1);
      DOT.tween(c.glow, 0.1);
      var targetX = c.xFrac * W;
      // glide horizontally from a left start so it reads as one deliberate
      // step toward the door (not a teleport).
      if (c._drawX == null) c._drawX = 0.36 * W;
      c._drawX = DOT.lerp(c._drawX, targetX, DOT.lerp(0.05, 0.14, e));
      var chY = floorY - doorH * 0.55; // float at the doorway's eye level

      DOT.drawCharacter(p, c._drawX, chY, {
        scale: c.scale.value,
        mood: c.mood,
        glow: c.glow.value,
        alpha: 1,
        look: 1, // gazes ahead, toward the door
        breath: world.clock,
        phase: 0.6
      });
    }
  });
})();
