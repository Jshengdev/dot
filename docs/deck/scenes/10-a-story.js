/* =====================================================================
 * BEAT 10 — "A story"  (scenes/10-a-story.js)
 * ---------------------------------------------------------------------
 * "Friends. People close to me. Each carrying a story they needed
 *  someone to hear."
 *
 * THE ONE GESTURE: the character rests, calm, and a SINGLE flowing
 * thread — their story — develops out behind them: a quiet accent-blue
 * hairline that uncoils to the right, its live tip carrying the one
 * thing alive now (a story reaching for a listener).
 *
 * INTRODUCES the SHARED motif `world.storyRibbon` (a flowing path of a
 * life). It is left in `world` as the CARRY-OUT for the next beat to
 * inherit and morph — never re-create.
 *
 * CARRY-IN  : world.character    — the protagonist dot (re-centered, calm).
 * CARRY-OUT : world.storyRibbon  — the flowing story thread.
 *             world.character    — the protagonist dot.
 *
 * Movement budget: TWO movements —
 *   (1) the ribbon uncoils out from the character (reach 0 -> 1),
 *   (2) the character arrives into calm presence (scale + glow settle).
 * Strokes: HAIRLINE only — the whole thread is ≤1px segments modeled by
 * light. Dots: ALIVE (the live tip + the character, both breathing).
 * One accent (the thread + tip + character glow). No on-screen sentence.
 * ===================================================================== */
(function () {
  "use strict";
  var DOT = window.DOT;

  // The thread's flowing path in normalized space. u: 0 at the character,
  // 1 at the far tip. One calm swell + a gentler late drift — a life that
  // flows, never a chart line. Returns {x:0..1 along, y: signed wave}.
  function ribbonPoint(u) {
    var y = Math.sin(u * Math.PI * 1.15) * 0.5 + Math.sin(u * Math.PI * 2.2 + 0.6) * 0.16;
    return { x: u, y: y };
  }

  window.SCENES.push({
    id: "a-story",
    note:
      "Friends. People close to me. Each carrying a story they needed " +
      "someone to hear. The thread is that story — one quiet line flowing " +
      "out from a single person, waiting to be followed.",

    onEnter: function (world) {
      // INTRODUCE / retarget the story ribbon. `reach` is the unfurl
      // handle (0 = no trail, 1 = fully developed).
      var rb = world.storyRibbon;
      if (!rb) {
        rb = world.storyRibbon = {
          xFrac: 0.34, // origin (at the character)
          yFrac: 0.52, // baseline
          spanFrac: 0.44, // horizontal reach (frac of width)
          ampFrac: 0.1, // wave amplitude (frac of height)
          reach: { value: 0.0, target: 1.0 }
        };
      } else {
        rb.xFrac = 0.34;
        rb.yFrac = 0.52;
        rb.spanFrac = 0.44;
        rb.ampFrac = 0.1;
        rb.reach.target = 1.0;
      }

      // Carry / seed the character — stands left of center, calm, so the
      // story can trail out to the right.
      var c = world.character;
      if (!c) {
        world.character = {
          xFrac: 0.34,
          yFrac: 0.52,
          scale: { value: 0.9, target: 1 },
          mood: "calm",
          glow: { value: 0.3, target: 0.5 },
          _drawX: null
        };
      } else {
        c.xFrac = 0.34;
        c.yFrac = 0.52;
        c.mood = "calm";
        c.glow.target = 0.5;
        c.scale.target = 1;
      }
    },

    onExit: function (world) {
      // Carry out storyRibbon + character for the next beat to morph.
      // Nothing scene-private to clear.
    },

    draw: function (p, t, world) {
      var rb = world.storyRibbon;
      var W = world.w;
      var H = world.h;
      var e = DOT.ease(t); // house ease — fast out, long settle

      // resolve geometry from live viewport (survives resize)
      var ox = rb.xFrac * W; // origin at the character
      var oy = rb.yFrac * H;
      var span = rb.spanFrac * W;
      var amp = rb.ampFrac * H;

      // MOVEMENT 1: the trail's reach glides to target; the intro `e`
      // shapes its FIRST uncoiling so it reads as one deliberate move.
      DOT.tween(rb.reach, 0.1);
      var grown = DOT.clamp(rb.reach.value * e, 0, 1);

      // ---- the STORY THREAD: one flowing hairline, uncoiling L->R -----
      // Many short hairline segments along the calm path so every line
      // obeys the law (≤1px, modeled by light). It starts just past the
      // character's body; the live part runs accent-blue, brightest near
      // the developing tip (the part being heard now), faint toward the
      // origin where it has already been told.
      var N = 110;
      var startU = 0.16; // leave the character's body clear before the trail
      var prev = null;
      var tipU = startU;
      for (var i = 0; i <= N; i++) {
        var u = i / N;
        if (u < startU) continue;
        if (u > grown) break;
        tipU = u;
        var pt = ribbonPoint(u);
        var px = ox + pt.x * span;
        var py = oy + pt.y * amp;
        if (prev) {
          var near = DOT.clamp(DOT.map(u, grown - 0.55, grown, 0.28, 0.85), 0.2, 0.85);
          DOT.hairline(p, prev.x, prev.y, px, py, {
            hex: DOT.palette.accent,
            alpha: near,
            lip: 0.0,
            weight: 1
          });
        }
        prev = { x: px, y: py };
      }

      // ---- the live TIP: an ALIVE accent dot at the head of the thread -
      // the one thing alive right now — a story reaching for a listener.
      if (prev && grown > startU + 0.01) {
        var tipPt = ribbonPoint(tipU);
        DOT.aliveDot(p, ox + tipPt.x * span, oy + tipPt.y * amp, 4.5, {
          hex: DOT.palette.accent,
          alpha: DOT.clamp((grown - startU) * 2, 0, 1),
          glow: 0.6,
          breath: world.clock,
          phase: 1.4
        });
      }

      // MOVEMENT 2: the CHARACTER arrives into calm presence — the someone
      // the story flows from, gazing gently after the thread they carry.
      var c = world.character;
      DOT.tween(c.scale, 0.1);
      DOT.tween(c.glow, 0.1);
      var targetX = c.xFrac * W;
      c._drawX = c._drawX == null ? targetX : DOT.lerp(c._drawX, targetX, 0.12);
      DOT.drawCharacter(p, c._drawX, oy, {
        scale: c.scale.value,
        mood: c.mood,
        glow: c.glow.value,
        alpha: Math.min(1, e * 1.5),
        look: 0.25,
        breath: world.clock,
        phase: 0.6
      });
    }
  });
})();
