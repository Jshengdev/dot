/* =====================================================================
 * BEAT 11 — "Unexplained"  (scenes/11-unexplained.js)
 * ---------------------------------------------------------------------
 * Speaker note (spoken, NOT drawn): "The white hairs they couldn't
 * explain. Was it that they barely slept? They didn't know."
 *
 * THE ONE GESTURE: small disconnected symptom-marks and faint question
 * marks fade in around the character and drift, UNLINKED — never touching
 * each other, never reaching the character, never resolving. The
 * non-connection IS the meaning.
 *
 * Inherits the carried `world.character` (the same someone) and brings it
 * to `tense` — quietly unsettled, searching, not alarmed. Adds the
 * scene-private motif `world.symptoms` (a scattered evidence field of
 * faint ink marks + question marks modeled in hairlines).
 *
 * Movement budget: ONE movement (the scattered field develops in via
 * organic stagger). Ambient: each mark drifts on world.clock; the
 * character breathes. Nothing links, nothing snaps, nothing bounces.
 *
 * | motif | shape | meaning |
 * | world.symptoms | { marks:[{xFrac,yFrac,r,kind,phase,drift}], alpha:{value,target} } | unexplained scattered evidence (dots + question hairlines) |
 * ===================================================================== */
(function () {
  "use strict";
  var DOT = window.DOT;

  // Fixed, deliberately irregular scatter around the centered character —
  // anchors are fractional so the field survives resize. `kind` 0 = a
  // symptom dot, 1 = a faint question mark. Nothing sits on a grid; nothing
  // aligns; nothing orbits — these are unrelated, unlinked things.
  var SEED = [
    { xFrac: 0.355, yFrac: 0.30, r: 3.4, kind: 1 },
    { xFrac: 0.63, yFrac: 0.275, r: 2.6, kind: 0 },
    { xFrac: 0.705, yFrac: 0.47, r: 3.0, kind: 1 },
    { xFrac: 0.30, yFrac: 0.52, r: 2.4, kind: 0 },
    { xFrac: 0.415, yFrac: 0.70, r: 2.9, kind: 0 },
    { xFrac: 0.665, yFrac: 0.685, r: 3.2, kind: 1 },
    { xFrac: 0.525, yFrac: 0.215, r: 2.3, kind: 0 },
    { xFrac: 0.25, yFrac: 0.395, r: 2.7, kind: 1 }
  ];

  window.SCENES.push({
    id: "unexplained",
    note:
      "The white hairs they couldn't explain. Was it that they barely " +
      "slept? They didn't know. Symptom-marks and faint question marks " +
      "float around them — disconnected, unlinked, unresolved. Nothing " +
      "points to anything.",

    onEnter: function (world) {
      // INHERIT the carried-in character. If deep-linked straight here,
      // seed a sane centered version so we never blank out.
      var c = world.character;
      if (!c) {
        c = world.character = {
          xFrac: 0.5,
          yFrac: 0.46,
          scale: { value: 1, target: 1 },
          mood: "tense",
          glow: { value: 0.4, target: 0.42 },
          _drawX: null
        };
      } else {
        // The morph: unease settles in. Mood goes tense; re-center so the
        // marks have room to scatter around the someone.
        c.xFrac = 0.5;
        c.mood = "tense";
        c.glow.target = 0.42;
        c.scale.target = 1;
      }

      // Seed the scene-private symptom field ONLY if absent (idempotent on
      // revisit). NOT carried forward — nulled on exit.
      var sy = world.symptoms;
      if (!sy) {
        var marks = SEED.map(function (m, i) {
          return {
            xFrac: m.xFrac,
            yFrac: m.yFrac,
            r: m.r,
            kind: m.kind,
            phase: i * 0.9, // own breath/drift phase — never pulse as one
            drift: 0.6 + (i % 3) * 0.22 // slightly different drift speeds
          };
        });
        world.symptoms = { marks: marks, alpha: { value: 0, target: 1 } };
      } else {
        sy.alpha.target = 1; // replay the fade-in cleanly on revisit
      }
    },

    onExit: function (world) {
      // Carry out the character (mood/glow persist for the next beat to
      // morph). Drop the scene-private marks — they belong only to this
      // unresolved moment.
      world.symptoms = null;
    },

    draw: function (p, t, world) {
      var W = world.w;
      var H = world.h;
      var e = DOT.ease(t);

      var c = world.character;
      var sy = world.symptoms;
      if (!sy) return; // never blank — onEnter always seeds it

      // ---- the CHARACTER, centered, tense, breathing, searching --------
      DOT.tween(c.scale, 0.1);
      DOT.tween(c.glow, 0.1);
      var cx = c.xFrac * W;
      var cy = c.yFrac * H;
      c._drawX = c._drawX == null ? cx : DOT.lerp(c._drawX, cx, 0.12);
      DOT.drawCharacter(p, c._drawX, cy, {
        scale: c.scale.value,
        mood: "tense",
        glow: c.glow.value,
        alpha: 1,
        look: 0.16, // a slightly searching, off-center gaze
        breath: world.clock,
        phase: 0.6
      });

      // ---- the SCATTERED unexplained marks (the one movement) ----------
      // The field develops in via organic stagger so it doesn't tick in as
      // one wall. Each mark drifts on its own phase — unmoored, never
      // reaching the character, never linking to a neighbor.
      DOT.tween(sy.alpha, 0.1);
      var marks = sy.marks;
      var n = marks.length;
      for (var i = 0; i < n; i++) {
        var m = marks[i];
        var local = DOT.stagger(i, n, e, { spread: 0.6, seed: i + 3 });
        var a = sy.alpha.value * local * 0.5; // faint — they're uncertain
        if (a <= 0.01) continue;

        var mx = m.xFrac * W;
        var my = m.yFrac * H;
        // slow, faint, untethered drift (ambient — clock, not t)
        var dr = m.drift;
        mx += Math.sin(world.clock / 2600 + m.phase) * 5 * dr;
        my += Math.cos(world.clock / 3100 + m.phase * 1.4) * 4 * dr;

        if (m.kind === 0) {
          // a symptom-mark — a small alive ink dot, faint, breathing.
          // Ink at alpha (never accent): it isn't alive/active, it's a clue.
          DOT.aliveDot(p, mx, my, m.r, {
            hex: DOT.palette.ink,
            alpha: a,
            glow: 0.18,
            breath: world.clock,
            phase: m.phase
          });
        } else {
          // a faint question mark — the "they didn't know". The ≤1 whimsy.
          drawQuestion(p, mx, my, m.r, a);
        }
      }
    }
  });

  // A small "?" modeled in HAIRLINES (no glyph text, no stroke > 1px): a
  // short open hook curve traced by a few hairline segments, plus a
  // disconnected alive ink dot beneath — itself a tiny unanswered question.
  // The gap between hook and dot keeps it reading as unresolved.
  function drawQuestion(p, x, y, r, alpha) {
    if (alpha <= 0.01) return;
    var s = r * 1.45; // glyph scale, tied to the mark radius
    var ink = DOT.palette.ink;
    var pts = [
      { x: x - s * 0.55, y: y - s * 1.0 },
      { x: x + s * 0.12, y: y - s * 1.3 },
      { x: x + s * 0.64, y: y - s * 0.72 },
      { x: x + s * 0.04, y: y - s * 0.28 },
      { x: x, y: y + s * 0.2 }
    ];
    for (var i = 0; i < pts.length - 1; i++) {
      DOT.hairline(p, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y, {
        alpha: alpha,
        hex: ink,
        lip: 0.35
      });
    }
    // the dot of the "?" — disconnected (a gap above it), faint, still
    DOT.aliveDot(p, x, y + s * 0.95, r * 0.62, {
      hex: ink,
      alpha: alpha,
      glow: 0.12
    });
  }
})();
