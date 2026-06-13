/* =====================================================================
 * BEAT 20 — "DOT appears"  (scenes/20-dot-appears.js)
 * ---------------------------------------------------------------------
 * THE HERO REVEAL. Spoken: "That's why I built DOT."
 *
 * THE ONE GESTURE: out of the dissolving chaos, the brand GLASS DOT
 * gathers itself together at center and its soft accent CORE TURNS ON.
 * Whatever scattered field came before (the crowd / evidence dots) is
 * pulled inward and let go — it converges into, and is replaced by, the
 * single glass sphere. The protagonist, if carried, quiets to 'off' and
 * dissolves so the brand object is the lone hero on the white room.
 *
 * Seeds the SHARED motif `world.glass` (the brand sphere) and leaves it
 * in `world` for later beats to INHERIT and MORPH — the glass persists
 * past this beat (CARRY OUT). Every dot routes through DOT.aliveDot.
 *
 * Movements (≤2): (1) the chaos field converges to center + fades;
 * (2) the glass sphere develops in (r grows from 0) and its core lights.
 * One accent — the core that comes alive. ≤1 whimsy: the gather.
 * ===================================================================== */
(function () {
  "use strict";
  var DOT = window.DOT;

  window.SCENES.push({
    id: "dot-appears",
    note:
      "That's why I built DOT. The chaos gathers itself into one clear " +
      "thing — the glass sphere assembles at center and its core comes " +
      "alive. This is the hero reveal: out of everything scattered, one " +
      "calm, lit object. The glass carries forward from here.",

    onEnter: function (world) {
      // Seed the brand GLASS motif ONLY if not already carried (idempotent).
      // It develops in from nothing and lights its core — then persists.
      // CONTRACT: world.glass.r is a FRACTION of min-dim (resize-safe) — the
      // SAME unit every downstream glass beat (21/24/26/27) reads. Do not
      // store px here, or the sphere will jump when those beats inherit it.
      var g = world.glass;
      if (!g) {
        g = world.glass = {
          xFrac: 0.5,
          yFrac: 0.5,
          r: { value: 0.0, target: 0.12 }, // gather to 0.12 of min dim
          core: { value: 0.0, target: 1 } // the core TURNS ON
        };
      } else {
        // already carried in — recenter and (re)light it, don't re-create
        g.xFrac = 0.5;
        g.yFrac = 0.5;
        if (!g.r) g.r = { value: 0.0, target: 0.12 };
        g.r.target = 0.12;
        g.core.target = 1;
      }

      // Snapshot a converge-anchor for any scattered field carried in (the
      // crowd / evidence dots), in fractional offsets from center so it
      // survives resize. If none carried in (deep-link), seed a sane
      // scatter so the gather always reads. Scene-private.
      var src = [];
      var fields = [world.peopleDots, world.factDots];
      for (var f = 0; f < fields.length; f++) {
        var arr = fields[f];
        if (arr && arr.length) {
          for (var i = 0; i < arr.length; i++) {
            var d = arr[i];
            if (d && typeof d.x === "number" && typeof d.y === "number") {
              src.push({
                fx: (d.x - world.cx) / Math.min(world.w, world.h),
                fy: (d.y - world.cy) / Math.min(world.w, world.h),
                r: d.r || 3.5,
                phase: d.phase || i * 0.7
              });
            }
          }
        }
      }
      if (!src.length) {
        for (var k = 0; k < 26; k++) {
          var ang = (k / 26) * Math.PI * 2 + (k % 3) * 0.7;
          var rad = 0.2 + (k % 5) * 0.045;
          src.push({
            fx: Math.cos(ang) * rad,
            fy: Math.sin(ang) * rad,
            r: 3.5 + (k % 4) * 1.5,
            phase: k * 0.7
          });
        }
      }
      world._gatherFrom = src;

      // The protagonist quiets and lets go — DOT is now the hero, not them.
      var c = world.character;
      if (c) {
        c.mood = "off";
        c.glow.target = 0.0;
        c.scale.target = 0.9;
      }
    },

    onExit: function (world) {
      // CARRY OUT the lit glass sphere for later beats to inherit.
      // The dissolving CROWD has been consumed — null the scene-private
      // gather snapshot and let go of the spent crowd field. But the two
      // TRUTHS (storyRibbon + factDots) must SURVIVE: beat 21 (both-truths)
      // gathers those very motifs INSIDE the glass — they carry, not die.
      world._gatherFrom = null;
      world.peopleDots = null;
    },

    draw: function (p, t, world) {
      var W = world.w;
      var H = world.h;
      var M = Math.min(W, H);
      var e = DOT.ease(t); // house ease — fast out, long settle
      var g = world.glass;

      var cx = g.xFrac * W;
      var cy = g.yFrac * H;

      // ---- MOVEMENT 1: the chaos gathers to center + lets go ----------
      // Each carried scatter-dot is pulled from its origin toward the
      // glass center on an organic stagger and fades as it arrives —
      // "from the dissolving chaos." It is consumed into the hero.
      var from = world._gatherFrom;
      if (from && from.length) {
        for (var i = 0; i < from.length; i++) {
          var d = from[i];
          var s = DOT.stagger(i, from.length, t, { spread: 0.6, seed: d.phase });
          var pull = DOT.ease(s);
          var dx = DOT.lerp(cx + d.fx * M, cx, pull);
          var dy = DOT.lerp(cy + d.fy * M, cy, pull);
          var a = (1 - pull) * 0.5; // dissolves as it arrives
          if (a > 0.012) {
            DOT.aliveDot(p, dx, dy, d.r, {
              hex: DOT.palette.ink,
              alpha: a,
              glow: 0.0,
              breath: world.clock,
              phase: d.phase
            });
          }
        }
      }

      // ---- the protagonist (if carried) dissolves away as DOT arrives -
      var c = world.character;
      if (c) {
        DOT.tween(c.scale, 0.1);
        DOT.tween(c.glow, 0.1);
        var fade = 1 - DOT.clamp(e * 1.4, 0, 1); // gone by the time DOT lands
        if (fade > 0.01) {
          var chX = c._drawX == null ? c.xFrac * W : c._drawX;
          DOT.drawCharacter(p, chX, cy, {
            scale: c.scale.value,
            mood: "off",
            glow: c.glow.value,
            alpha: fade,
            breath: world.clock,
            phase: 0.6
          });
        }
      }

      // ---- MOVEMENT 2: the GLASS DOT develops in + the core lights ----
      // rFrac grows from 0 (the gather), then the accent core turns on
      // with a gentle breath. Couple the tween rate to `e` so it reads as
      // one deliberate assembly, not an idle glide.
      DOT.tween(g.r, DOT.lerp(0.05, 0.18, e));
      DOT.tween(g.core, DOT.lerp(0.03, 0.12, e)); // core lags the body a touch

      var breath = DOT.breathe(world.clock, { period: 3800, amp: 0.02 });
      var rNow = g.r.value * M * breath * e; // develop-in scales with e
      if (rNow > 0.5) {
        DOT.glassDot(p, cx, cy, rNow, g.core.value);
      }
    }
  });
})();
