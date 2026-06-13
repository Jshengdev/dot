/* =====================================================================
 * BEAT 09 — "Everywhere"  (scenes/09-everywhere.js)
 * ---------------------------------------------------------------------
 * "Then I started seeing it everywhere."
 *
 * THE ONE GESTURE: the carried-in dot MULTIPLIES. From the single
 * protagonist at center, a soft field of alive dots blooms outward and
 * spreads across the whole white room — it is everywhere. Each dot starts
 * on the protagonist and glides out to its own resting anchor on an
 * organic stagger (the field wakes in waves, never in lockstep), fading
 * up as it travels. The protagonist stays put, calm: the same someone,
 * now one of many.
 *
 * CARRY IN: `world.character` (the protagonist — anchored to center).
 * CARRY OUT: `world.peopleDots` (the crowd field) + the character, so a
 * later beat can inherit the field and move it. The bloom amount lives in
 * `world.spread = {value,target}` so it survives a hold / revisit.
 *
 * Movement budget: ONE movement (one dot blooms into a field everywhere).
 * Every dot via DOT.aliveDot (baked light + breath + per-dot phase). One
 * accent (blue) on the live, multiplying field — it is the thing alive now.
 *
 * NEW MOTIF SLOT introduced here:
 *   world.spread : { value, target }  — 0..1 bloom-out handle (carried).
 * ===================================================================== */
(function () {
  "use strict";
  var DOT = window.DOT;

  // Deterministic scatter so the field is identical every render (no RNG
  // drift between frames or revisits). A cheap hash -> 0..1.
  function rnd(seed) {
    var x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  // Seed the crowd field as fractional anchors (survives resize). Each dot
  // carries its own birth order + breath phase so the bloom and the rest
  // motion both stagger organically.
  function seedField(n) {
    var dots = [];
    for (var i = 0; i < n; i++) {
      var a = rnd(i + 1);
      var b = rnd(i + 7.3);
      var c = rnd(i + 13.1);
      dots.push({
        // home anchored across the FULL canvas (soft margins off the edges)
        xFrac: 0.08 + a * 0.84,
        yFrac: 0.12 + b * 0.76,
        r: 3 + c * 2.4, // small, alive
        order: rnd(i + 19.7), // birth order for the staggered bloom
        phase: c * Math.PI * 2, // own breath phase — field never pulses as one
        alpha: { value: 0, target: 1 }
      });
    }
    return dots;
  }

  window.SCENES.push({
    id: "everywhere",
    note:
      "Then I started seeing it everywhere. The single dot multiplies — a " +
      "soft field blooms out and fills the whole room. It isn't one story " +
      "anymore; it's all of them. The protagonist stays put, calm, now one " +
      "of many. The field carries forward.",

    onEnter: function (world) {
      // Bloom amount: 0 = just the one dot, 1 = the field fully spread.
      if (!world.spread) world.spread = { value: 0, target: 1 };
      else world.spread.target = 1;

      // Inherit the carried character; anchor it to center, calm. Seed if
      // deep-linked straight here so we never blank out.
      var c = world.character;
      if (!c) {
        c = world.character = {
          xFrac: 0.5,
          yFrac: 0.5,
          scale: { value: 1, target: 1 },
          mood: "calm",
          glow: { value: 0.45, target: 0.45 },
          _drawX: null
        };
      } else {
        c.xFrac = 0.5;
        c.yFrac = 0.5;
        c.mood = "calm";
        c.glow.target = 0.42;
        c.scale.target = 1;
      }

      // Seed THIS beat's bloom field. The protagonist multiplying is a NEW
      // field (54 dots in this beat's own {xFrac,yFrac,order,phase,alpha}
      // shape) — NOT the 9-dot cold-call crowd that may be carried in (that
      // motif has an incompatible shape: reading dd.xFrac/order off it gives
      // NaN). So we (re)seed whenever the carried field isn't already OUR
      // shape, and remain idempotent on a true revisit of THIS beat.
      var ours = world.peopleDots;
      var isOurField =
        ours && ours.length === 54 && ours[0] && ours[0].order != null;
      if (!isOurField) {
        world.peopleDots = seedField(54);
      }
      for (var i = 0; i < world.peopleDots.length; i++) {
        var d = world.peopleDots[i];
        if (!d.alpha) d.alpha = { value: 0, target: 1 };
        d.alpha.target = 1;
      }
    },

    onExit: function (world) {
      // Carry out the field + character + spread handle for the next beat
      // to inherit. Nothing scene-private to null.
    },

    draw: function (p, t, world) {
      var W = world.w;
      var H = world.h;
      var e = DOT.ease(t); // house ease — fast out, long settle

      // drive the bloom: couple the tween to `e` so the spread reads as one
      // deliberate movement, not an idle drift.
      world.spread.target = 1;
      DOT.tween(world.spread, DOT.lerp(0.04, 0.14, e));
      var spread = world.spread.value;

      // protagonist center — the origin the field blooms from
      var c = world.character;
      var cx = c.xFrac * W;
      var cy = c.yFrac * H;
      c._drawX = c._drawX == null ? cx : DOT.lerp(c._drawX, cx, 0.12);

      // ---- the FIELD: the one dot multiplied, blooming outward ---------
      var dots = world.peopleDots;
      var n = dots.length;
      for (var i = 0; i < n; i++) {
        var dd = dots[i];

        // per-dot local progress: organic stagger keyed off its birth order
        // so the field wakes in waves, never in lockstep.
        var local = DOT.stagger(i, n, e, { spread: 0.62, seed: i + dd.order * 50 });

        // each dot starts AT the protagonist and glides out to its anchor —
        // the visual of "one became many." `spread` gates the whole bloom.
        var tx = dd.xFrac * W;
        var ty = dd.yFrac * H;
        var k = local * spread; // 0 = on the protagonist, 1 = at rest anchor
        var x = DOT.lerp(c._drawX, tx, k);
        var y = DOT.lerp(cy, ty, k);

        DOT.tween(dd.alpha, 0.1);
        var a = dd.alpha.value * local; // fade in as it travels out
        if (a < 0.01) continue;

        DOT.aliveDot(p, x, y, dd.r, {
          hex: DOT.palette.accent,
          alpha: a * 0.92,
          glow: 0.4,
          breath: world.clock,
          phase: dd.phase
        });
      }

      // ---- a faint mono count — "everywhere" as a quiet number ---------
      DOT.label(p, String(n), W * 0.5, H - 56, {
        size: 11,
        alpha: 0.22 * e,
        hex: DOT.palette.ink,
        align: p.CENTER
      });

      // ---- the PROTAGONIST, calm at center — the same someone ----------
      DOT.tween(c.scale, 0.1);
      DOT.tween(c.glow, 0.1);
      DOT.drawCharacter(p, c._drawX, cy, {
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
