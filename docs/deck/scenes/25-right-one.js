/* =====================================================================
 * BEAT 25 — "Right one"  (scenes/25-right-one.js)
 * ---------------------------------------------------------------------
 * Spoken (note only — NOT drawn): "Because care only matters if you can
 * get to the right one."
 *
 * THE ONE GESTURE: several faint diverging hairline PATHS fan out from the
 * carried CHARACTER (the origin of the choice) toward a column of quiet
 * door markers on the right. Then ONE path — the one reaching the RIGHT
 * door — LIGHTS UP in accent-blue and develops to its end, its destination
 * waking to an alive blue dot while the other routes/doors stay quiet ink.
 * The selection IS the meaning: out of many routes, the right one.
 *
 * CARRY IN:  world.character (the protagonist dot — origin of the choice).
 * CARRY OUT: world.character only. world.paths is scene-private (nulled).
 *
 * Movement budget: TWO coupled movements —
 *   (1) the fan of routes develops out (organic stagger);
 *   (2) the chosen rightmost route lights blue + its door wakes.
 * Every line via DOT.hairline (≤1px). Every dot via DOT.aliveDot. One
 * accent on the LIVE (chosen) route + door only; all else is quiet ink.
 * ===================================================================== */
(function () {
  "use strict";
  var DOT = window.DOT;

  // Deterministic fan of routes (no Math.random drift). Fractional offsets
  // from the origin so it survives resize. Each ends at a door marker laid
  // down the right field. The entry with chosen:true is the RIGHT one — it
  // reaches the door dead-ahead and is the only route that lights.
  var SEED = [
    { dxFrac: 0.150, dyFrac: -0.205, chosen: false },
    { dxFrac: 0.235, dyFrac: -0.082, chosen: false },
    { dxFrac: 0.215, dyFrac: 0.090, chosen: false },
    { dxFrac: 0.160, dyFrac: 0.220, chosen: false },
    { dxFrac: 0.320, dyFrac: -0.012, chosen: true } // the RIGHT one
  ];

  function seedPaths() {
    return SEED.map(function (d, i) {
      return {
        dxFrac: d.dxFrac,
        dyFrac: d.dyFrac,
        chosen: d.chosen,
        draw: { value: 0, target: 1 }, // route develop progress 0..1
        light: { value: 0, target: d.chosen ? 1 : 0 }, // accent on chosen
        phase: (i * 1.41) % (Math.PI * 2)
      };
    });
  }

  window.SCENES.push({
    id: "right-one",
    note:
      "Because care only matters if you can get to the right one. Many " +
      "routes fan out — most stay grey. One lights up: the path to the " +
      "right door. Care that can't reach the right person isn't care yet.",

    onEnter: function (world) {
      // INHERIT the character; it is the origin the routes diverge from.
      var c = world.character;
      if (!c) {
        // deep-link fallback: a sane left-of-center origin, never blank.
        c = world.character = {
          xFrac: 0.26,
          yFrac: 0.5,
          scale: { value: 0.86, target: 1 },
          mood: "calm",
          glow: { value: 0.5, target: 0.5 },
          _drawX: null
        };
      } else {
        c.xFrac = 0.26; // sit left so routes have room to fan right
        c.yFrac = 0.5;
        c.mood = "calm";
        c.scale.target = 1;
        c.glow.target = 0.5;
      }

      // INHERIT or seed the fan of routes (idempotent). On revisit,
      // retarget so the develop + the chosen light re-arm from carry-in.
      if (!world.paths || !world.paths.length) {
        world.paths = seedPaths();
      } else {
        world.paths.forEach(function (q) {
          if (q.draw) q.draw.target = 1;
          if (q.light) q.light.target = q.chosen ? 1 : 0;
        });
      }
    },

    onExit: function (world) {
      // Carry out the character. Null the fan — the next beat shouldn't
      // inherit this routing motif unless it re-seeds it.
      world.paths = null;
    },

    draw: function (p, t, world) {
      var W = world.w;
      var H = world.h;
      var e = DOT.ease(t); // house ease — fast out, long settle

      var c = world.character;
      var paths = world.paths;

      // ---- the CHARACTER settles at the origin, breathing -------------
      DOT.tween(c.scale, 0.1);
      DOT.tween(c.glow, 0.1);
      var cxTarget = c.xFrac * W;
      var cyTarget = c.yFrac * H;
      c._drawX = c._drawX == null ? cxTarget : DOT.lerp(c._drawX, cxTarget, 0.12);
      var chX = c._drawX;
      var chY = cyTarget;

      // ---- THE FAN: routes develop out, then the right one lights -----
      for (var i = 0; i < paths.length; i++) {
        var q = paths[i];

        // (1) each route develops on an organic stagger so the fan
        // breathes outward rather than ticking as one.
        var local = DOT.stagger(i, paths.length, t, { spread: 0.6 });
        q.draw.target = 1;
        DOT.tween(q.draw, DOT.lerp(0.04, 0.14, local));
        var grow = q.draw.value * local; // 0..1 along this route

        // (2) the chosen route lights blue only after it has fully drawn —
        // a single deliberate selection, never a flicker.
        if (q.chosen) {
          q.light.target = DOT.clamp(DOT.map(grow, 0.7, 1, 0, 1), 0, 1);
        }
        DOT.tween(q.light, 0.12);
        var lit = q.light.value;

        var doorX = chX + q.dxFrac * W;
        var doorY = chY + q.dyFrac * H;

        // start the route just outside the character so it doesn't gore
        // through its face; end just shy of the door marker.
        var dx = doorX - chX;
        var dy = doorY - chY;
        var d = Math.sqrt(dx * dx + dy * dy) || 1;
        var ux = dx / d;
        var uy = dy / d;
        var x1 = chX + ux * 34;
        var y1 = chY + uy * 34;
        var tipX = x1 + (doorX - x1) * grow;
        var tipY = y1 + (doorY - y1) * grow;

        // the route hairline. Quiet ink for the unchosen; the chosen route
        // crossfades ink -> accent-blue as light rises (color = meaning).
        if (grow > 0.02) {
          DOT.hairline(p, x1, y1, tipX, tipY, {
            alpha: (q.chosen ? 0.24 * (1 - lit) : 0.2) * grow,
            lip: 0.0
          });
          if (q.chosen && lit > 0.01) {
            DOT.hairline(p, x1, y1, tipX, tipY, {
              hex: DOT.palette.accent,
              alpha: 0.85 * lit * grow,
              lip: 0.0
            });
          }
        }

        // the DOOR marker: a short upright hairline jamb (a doorway),
        // modeled by light. Quiet ink, except the chosen one which wakes
        // to an alive blue dot in its opening.
        var arrive = DOT.clamp(DOT.map(grow, 0.6, 1, 0, 1), 0, 1);
        if (arrive > 0.01) {
          var doorH = 22 * arrive;
          var jambHex =
            q.chosen && lit > 0.5 ? DOT.palette.accent : DOT.palette.ink;
          DOT.hairline(p, doorX, doorY - doorH, doorX, doorY + doorH, {
            hex: jambHex,
            alpha: (q.chosen ? 0.3 + 0.55 * lit : 0.3) * arrive,
            lip: 0.9
          });
          // the destination dot: chosen wakes ALIVE blue; others quiet ink
          DOT.aliveDot(p, doorX, doorY, q.chosen ? 6 : 4.2, {
            hex: q.chosen ? DOT.palette.accent : DOT.palette.ink,
            alpha: (q.chosen ? 0.4 + 0.6 * lit : 0.34) * arrive,
            glow: q.chosen ? 0.6 : 0.18,
            breath: world.clock,
            phase: q.phase
          });
        }
      }

      // ---- the CHARACTER on top — the one choosing, looking right -----
      DOT.drawCharacter(p, chX, chY, {
        scale: c.scale.value,
        mood: c.mood,
        glow: c.glow.value,
        alpha: Math.min(1, e * 1.5),
        look: 0.5, // gaze toward the routes / the right door
        breath: world.clock,
        phase: 0.6
      });
    }
  });
})();
