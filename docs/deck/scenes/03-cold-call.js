/* =====================================================================
 * BEAT 03 — "Cold call"  (scenes/03-cold-call.js)
 * ---------------------------------------------------------------------
 * Spoken: "About six months ago, I cold-called strangers — to find
 * their pain, and pitch a solution."
 *
 * THE ONE GESTURE: the character (carried in) settles to center, and
 * faint hairline outreach lines REACH OUT, one organic-staggered strand
 * at a time, each landing on a small grey stranger-dot in a loose scatter
 * around it. The reach is the whole meaning — one person reaching out to
 * many cold contacts.
 *
 * CARRY IN:  world.character (the protagonist dot).
 * CARRY OUT: world.peopleDots — the scatter of stranger-dots, left in
 *            world for later beats to inherit (never re-created).
 *
 * Movement budget: ONE movement (the lines reach out + the stranger-dots
 * arrive on the same staggered rise). The character only settles +
 * breathes. Hairlines (≤1px) via DOT.hairline; dots via DOT.aliveDot.
 * Strangers are quiet grey ink (NOT accent — they are not "alive/active");
 * the character keeps the lone blue glow.
 * ===================================================================== */
(function () {
  "use strict";
  var DOT = window.DOT;

  // Deterministic scatter so the field is identical every revisit (no
  // Math.random drift). Fractional offsets from the character anchor so
  // it survives resize. Loose ring of strangers, organic radii/jitter,
  // flattened vertically so it reads as a field, not a clock face.
  var SEED = [
    { a: -2.55, rad: 0.255, jx: 0.012, jy: -0.030 },
    { a: -1.92, rad: 0.300, jx: -0.020, jy: 0.015 },
    { a: -1.18, rad: 0.235, jx: 0.018, jy: 0.022 },
    { a: -0.42, rad: 0.300, jx: -0.014, jy: -0.018 },
    { a: 0.18, rad: 0.250, jx: 0.022, jy: 0.012 },
    { a: 0.86, rad: 0.305, jx: -0.010, jy: -0.024 },
    { a: 1.62, rad: 0.240, jx: 0.016, jy: 0.020 },
    { a: 2.34, rad: 0.300, jx: -0.022, jy: -0.012 },
    { a: 3.02, rad: 0.250, jx: 0.014, jy: 0.026 }
  ];

  function seedPeople() {
    return SEED.map(function (d, i) {
      return {
        // fractional offset from the character's anchor (resize-safe)
        dxFrac: Math.cos(d.a) * d.rad + d.jx,
        dyFrac: Math.sin(d.a) * d.rad * 0.74 + d.jy, // flatten vertically
        r: 4.2 + (i % 3) * 0.5,
        alpha: { value: 0, target: 1 },
        reach: { value: 0, target: 1 }, // line-draw + dot-arrive progress
        phase: (i * 1.37) % (Math.PI * 2)
      };
    });
  }

  window.SCENES.push({
    id: "cold-call",
    note:
      "About six months ago, I cold-called strangers — to find their " +
      "pain, and pitch a solution. One person, reaching out to many. " +
      "The thin lines are those calls landing on people I'd never met.",

    onEnter: function (world) {
      // INHERIT the character; bring it to center, keep it calm + alive.
      var c = world.character;
      if (!c) {
        // deep-link fallback: sane centered character, never blank.
        c = world.character = {
          xFrac: 0.5,
          yFrac: 0.5,
          scale: { value: 0.86, target: 1 },
          mood: "calm",
          glow: { value: 0.5, target: 0.5 },
          _drawX: null
        };
      } else {
        c.xFrac = 0.5;
        c.yFrac = 0.5;
        c.mood = "calm";
        c.scale.target = 1;
        c.glow.target = 0.5;
      }

      // INHERIT or seed the stranger scatter (idempotent). On revisit,
      // retarget the reach so it develops in again from carry-in.
      if (!world.peopleDots || !world.peopleDots.length) {
        world.peopleDots = seedPeople();
      } else {
        world.peopleDots.forEach(function (q) {
          if (q.alpha) q.alpha.target = 1;
          if (q.reach) q.reach.target = 1;
        });
      }
    },

    onExit: function (world) {
      // Carry out the character AND the stranger scatter for later beats.
    },

    draw: function (p, t, world) {
      var W = world.w;
      var H = world.h;
      var e = DOT.ease(t); // house ease — fast out, long settle

      var c = world.character;
      var people = world.peopleDots;

      // ---- the CHARACTER glides to center, settles, breathes ----------
      DOT.tween(c.scale, 0.1);
      DOT.tween(c.glow, 0.1);
      var cxTarget = c.xFrac * W;
      var cyTarget = c.yFrac * H;
      c._drawX = c._drawX == null ? cxTarget : DOT.lerp(c._drawX, cxTarget, 0.12);
      var chX = c._drawX;
      var chY = cyTarget;

      // ---- THE REACH: lines develop out to each stranger, staggered ---
      // One movement: each strand's local progress rises on an organic
      // stagger so the field breathes outward rather than ticking as one.
      for (var i = 0; i < people.length; i++) {
        var q = people[i];
        DOT.tween(q.alpha, 0.1);

        // couple the reach tween to the staggered local `t` so the whole
        // beat reads as a single deliberate outward gesture.
        var local = DOT.stagger(i, people.length, t, { spread: 0.6 });
        q.reach.target = 1;
        DOT.tween(q.reach, DOT.lerp(0.04, 0.14, local));
        var reach = q.reach.value * local; // 0..1 along this strand

        var px = chX + q.dxFrac * W;
        var py = chY + q.dyFrac * H;

        // start the line a touch outside the character so it doesn't gore
        // through its face; end it just shy of the stranger-dot.
        var dx = px - chX;
        var dy = py - chY;
        var d = Math.sqrt(dx * dx + dy * dy) || 1;
        var ux = dx / d;
        var uy = dy / d;
        var x1 = chX + ux * 34;
        var y1 = chY + uy * 34;
        var tipX = x1 + (px - x1) * reach;
        var tipY = y1 + (py - y1) * reach;

        // faint hairline outreach line (ink at low alpha — not alive)
        if (reach > 0.02) {
          DOT.hairline(p, x1, y1, tipX, tipY, {
            alpha: 0.22 * reach,
            lip: 0.0
          });
        }

        // the STRANGER: a quiet grey ink dot (still-ish, NOT accent-blue —
        // they are not the live thing). Arrives as the line lands.
        var arrive = DOT.clamp(DOT.map(reach, 0.55, 1, 0, 1), 0, 1);
        if (arrive > 0.01) {
          DOT.aliveDot(p, px, py, q.r, {
            hex: DOT.palette.ink,
            alpha: 0.4 * q.alpha.value * arrive,
            glow: 0.18,
            breath: world.clock,
            phase: q.phase
          });
        }
      }

      // ---- the CHARACTER on top — the one alive thing, reaching out ---
      DOT.drawCharacter(p, chX, chY, {
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
