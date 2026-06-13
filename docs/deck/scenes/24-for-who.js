/* =====================================================================
 * BEAT 24 — "For who"  (scenes/24-for-who.js)
 * ---------------------------------------------------------------------
 * "For anyone who felt something was wrong but couldn't make it make
 *  sense — anxiety, depression, pain, the symptoms you can't name."
 *
 * Four soft entry-dots flow gently INTO the one glass dot. Four
 * doorways, one engine.
 *
 * CARRY-IN:
 *   world.glass  — the brand glass sphere (THE engine). Inherited if
 *                  present; seeded centered + lit if deep-linked. Its
 *                  radius is a FRACTION of min-dim (matches beat 20), so
 *                  the engine never jumps when we inherit it.
 *
 * CARRY-OUT (left in world):
 *   world.glass  — centered, core lit, as the single engine.
 *
 * Scene-private (nulled on exit so the next beat doesn't inherit it):
 *   world.entryDots — the four inbound doorway dots.
 *
 * Movement budget: ONE movement — the four entry-dots ease inward from
 * their orbit into the glass core (t:0->1), the core lighting up as they
 * arrive. (Whimsy: an organic per-dot stagger so they don't land as one.)
 * Hairline threads only (1px, via DOT.hairline). Alive dots. One accent
 * (blue) on the inflow + the engine core. Faint mono doorway labels.
 * ===================================================================== */
(function () {
  "use strict";
  var DOT = window.DOT;

  // The four doorways, by angle (radians) around the engine, with a
  // faint mono label each. Distances resolve from world.w/h each frame.
  var ENTRIES = [
    { label: "anxiety", ang: -2.35 }, // upper-left
    { label: "depression", ang: -0.79 }, // upper-right
    { label: "pain", ang: 0.79 }, // lower-right
    { label: "unnamed", ang: 2.35 } // lower-left
  ];

  window.SCENES.push({
    id: "for-who",
    note:
      "For anyone who felt something was wrong but couldn't make it make " +
      "sense — anxiety, depression, pain, the symptoms you can't name.",

    onEnter: function (world) {
      // INHERIT the glass engine; seed centered + dormant if missing
      // (deep-link safety). Radius is a FRACTION of min-dim to match the
      // carried-in motif from beat 20 (never px). Retarget to center +
      // light the core as the four entries feed in.
      var g = world.glass;
      if (!g) {
        g = world.glass = {
          xFrac: 0.5,
          yFrac: 0.5,
          r: { value: 0.16, target: 0.16 },
          core: { value: 0, target: 1 }
        };
      } else {
        g.xFrac = 0.5;
        g.yFrac = 0.5;
        g.r.target = 0.16;
        g.core.target = 1; // the engine lights as the entries arrive
      }

      // Seed the four entry-dots (scene-private). Each starts at its orbit
      // (flow 1 = far) and eases to the core (flow 0) — the single
      // movement. A small per-dot delay staggers their arrival.
      world.entryDots = ENTRIES.map(function (en, i) {
        return {
          label: en.label,
          ang: en.ang,
          delay: i * 0.07, // gentle organic stagger
          flow: { value: 1, target: 0 } // 1 = at doorway, 0 = merged in
        };
      });
    },

    onExit: function (world) {
      // Carry out the lit glass engine. Drop the scene-private entries.
      world.entryDots = null;
    },

    draw: function (p, t, world) {
      var W = world.w;
      var H = world.h;
      var M = Math.min(W, H);
      var e = DOT.ease(t);

      // resolve the engine geometry from the live viewport (survives resize)
      var g = world.glass;
      var cx = g.xFrac * W;
      var cy = g.yFrac * H;

      // engine settles in: radius + core light glide toward target
      DOT.tween(g.r, 0.1);
      DOT.tween(g.core, 0.08);
      var rPx = g.r.value * M;

      // the orbit the entries start from (just outside the engine rim)
      var orbit = M * 0.32;

      // ---- the four ENTRY-DOTS flowing inward (the ONE movement) -------
      var dots = world.entryDots || [];
      for (var i = 0; i < dots.length; i++) {
        var ed = dots[i];

        // per-dot staggered, eased progress home — drives the persistent
        // tween's target so the inbound flow holds when the beat rests.
        var local = DOT.clamp((t - ed.delay) / (1 - ed.delay), 0, 1);
        ed.flow.target = 1 - DOT.ease(local); // 1 (far) -> 0 (merged)
        DOT.tween(ed.flow, 0.12);
        var f = ed.flow.value; // 1 far ... 0 at the core
        var merge = 1 - f; // 0 far ... 1 merged

        // doorway anchor (orbit edge) + the dot's current inbound position
        var lx = cx + Math.cos(ed.ang) * orbit;
        var ly = cy + Math.sin(ed.ang) * orbit;
        var dx = cx + Math.cos(ed.ang) * (rPx + (orbit - rPx) * f);
        var dy = cy + Math.sin(ed.ang) * (rPx + (orbit - rPx) * f);

        // faint thread from doorway to the core — a line modeled by light,
        // fading as the dot merges in
        DOT.hairline(p, lx, ly, cx, cy, {
          alpha: 0.22 * e * f,
          lip: 0
        });

        // the entry-dot itself — an ALIVE accent dot, shrinking + dimming
        // as it dissolves into the engine
        var dr = DOT.lerp(7, 2.5, merge);
        DOT.aliveDot(p, dx, dy, dr, {
          hex: DOT.palette.accent,
          alpha: e * (1 - 0.85 * merge),
          glow: 0.55,
          breath: world.clock,
          phase: ed.ang // each doorway breathes on its own phase
        });

        // faint mono label parked at the doorway, softening as it feeds in
        DOT.label(p, ed.label, lx, ly + (Math.sin(ed.ang) > 0 ? 16 : -24), {
          size: 11,
          alpha: 0.5 * e * (0.4 + 0.6 * f),
          hex: DOT.palette.ink,
          align: p.CENTER
        });
      }

      // ---- the ONE glass engine (drawn over the inflow) ----------------
      DOT.glassDot(p, cx, cy, rPx, g.core.value * Math.max(e, 0.001));
    }
  });
})();
