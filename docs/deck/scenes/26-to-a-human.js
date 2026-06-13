/* =====================================================================
 * BEAT 26 — "To a Human"  (scenes/26-to-a-human.js)
 * ---------------------------------------------------------------------
 * THE ONE GESTURE: the handoff. The carried CHARACTER (you) rests at the
 * left, the brand GLASS dot sits between, a second calm HUMAN figure
 * resolves at the right. A single hairline develops left -> right THROUGH
 * the glass; as it lands on the human the glass CORE lights accent-blue
 * (the live connection) and the human resolves in. DOT gives you back the
 * agency to be understood, and walks you to a human who can finally help.
 *
 * CARRY-IN  (inherit if present, else seed a sane fallback):
 *   world.character — the protagonist dot (settles calm, left)
 *   world.glass     — the brand glass sphere (its core lights here)
 * CARRY-OUT (left in world): world.character + world.glass persist.
 *   world._human is scene-private and is nulled in onExit.
 *
 * Movement budget: TWO coupled movements —
 *   (1) the connecting HAIRLINE develops left->right through the glass;
 *   (2) the glass CORE lights + the HUMAN resolves as the line lands.
 * Strokes: HAIRLINE only (<=1px). Dots: ALIVE. ONE accent (blue) on the
 * live connection / glass core. The human is the ONE ink, calmly present
 * — warm-red stays reserved for caution, never decorative here.
 * ===================================================================== */
(function () {
  "use strict";
  var DOT = window.DOT;

  // Fractional layout anchors (resolved from world.w/h each frame).
  var CH_X = 0.27; // character (you), left
  var GL_X = 0.5; // glass dot, center
  var HU_X = 0.73; // human helper, right
  var ROW_Y = 0.52; // shared baseline for the handoff row

  window.SCENES.push({
    id: "to-a-human",
    note:
      "DOT gives you back the agency to be understood — and walks you to a " +
      "human who can finally help.",

    onEnter: function (world) {
      // --- CHARACTER: inherit if carried, else seed calm. Settle left. ---
      var c = world.character;
      if (!c) {
        c = world.character = {
          xFrac: CH_X,
          yFrac: ROW_Y,
          scale: { value: 0.92, target: 1 },
          mood: "calm",
          glow: { value: 0.3, target: 0.48 },
          _drawX: null
        };
      } else {
        c.xFrac = CH_X;
        c.yFrac = ROW_Y;
        c.mood = "calm";
        c.scale.target = 1;
        c.glow.target = 0.48;
      }

      // --- GLASS: inherit if carried, else seed. Its core lights ON as
      //     the handoff connects (the ONE live thing this beat). Radius is a
      //     FRACTION of min-dim (the SAME unit beats 20/21/24/27 use) so the
      //     sphere never jumps when inherited. Settles a touch smaller here:
      //     it sits BETWEEN you + the human, not as the lone hero. ---------
      var g = world.glass;
      if (!g) {
        g = world.glass = {
          xFrac: GL_X,
          yFrac: ROW_Y,
          r: { value: 0.1, target: 0.085 },
          core: { value: 0, target: 1 }
        };
      } else {
        g.xFrac = GL_X;
        g.yFrac = ROW_Y;
        g.r.target = 0.085;
        g.core.target = 1;
      }

      // --- HUMAN: scene-private calm figure that resolves in at the end
      //     of the handoff. Tweenable presence so it develops, not snaps.
      world._human = {
        xFrac: HU_X,
        yFrac: ROW_Y,
        presence: { value: 0, target: 1 },
        glow: { value: 0.2, target: 0.5 }
      };
    },

    onExit: function (world) {
      // Carry out the shared motifs; drop the private helper figure.
      world._human = null;
    },

    draw: function (p, t, world) {
      var W = world.w;
      var H = world.h;
      var M = Math.min(W, H);
      var e = DOT.ease(t); // house ease — fast out, long settle

      var c = world.character;
      var g = world.glass;
      var hu = world._human;

      // resolve geometry from the live viewport (survives resize)
      var chX = c.xFrac * W;
      var glX = g.xFrac * W;
      var huX = hu.xFrac * W;
      var rowY = ROW_Y * H;
      var gRpx = g.r.value * M; // glass radius (fraction -> px)

      // glide the character's live px
      c._drawX = c._drawX == null ? chX : DOT.lerp(c._drawX, chX, 0.12);

      // step the carried/private tweens
      DOT.tween(c.scale, 0.1);
      DOT.tween(c.glow, 0.1);
      DOT.tween(g.r, 0.1);
      DOT.tween(hu.presence, 0.1);
      DOT.tween(hu.glow, 0.1);

      // -------------------------------------------------------------
      // MOVEMENT 1 — the connecting HAIRLINE develops left -> right,
      // through the glass, reaching toward the human. One drawn-in line.
      // -------------------------------------------------------------
      var startX = c._drawX + 32; // leave the character's body
      var endX = huX - 32; // stop shy of the human's body
      var reach = startX + (endX - startX) * e;

      // segment 1: you -> glass (gap the glass so the line passes through it)
      var leftStop = Math.min(reach, glX - gRpx - 4);
      if (leftStop > startX + 0.5) {
        DOT.hairline(p, startX, rowY, leftStop, rowY, {
          alpha: 0.32 + 0.4 * e,
          lip: 0.9
        });
      }
      // segment 2: glass -> human (resumes past the sphere's right edge)
      var rightStart = glX + gRpx + 4;
      if (reach > rightStart + 0.5) {
        DOT.hairline(p, rightStart, rowY, reach, rowY, {
          alpha: 0.32 + 0.4 * e,
          lip: 0.9
        });
      }

      // -------------------------------------------------------------
      // MOVEMENT 2 — couple the glass CORE + the HUMAN resolving to how
      // far the line has reached the human. The connection only truly
      // lights once it has crossed the glass and is landing on the human.
      // -------------------------------------------------------------
      var landed = DOT.clamp(DOT.map(reach, rightStart, endX, 0, 1), 0, 1);
      g.core.target = landed; // live-connection brightness follows the line
      DOT.tween(g.core, 0.12);
      hu.presence.target = Math.max(hu.presence.target, landed);

      // ---- the GLASS sphere (brand), core lit by the live connection ----
      DOT.glassDot(p, glX, rowY, gRpx, g.core.value);

      // ---- the HUMAN: the same identical figure, calm, gazing back -------
      // Slightly larger so it reads as "someone who can help"; presence
      // resolves it in. Warmth = an open calm face + soft underglow, NOT
      // warm-red (which is reserved for caution).
      var huA = hu.presence.value;
      if (huA > 0.01) {
        DOT.drawCharacter(p, huX, rowY, {
          scale: 1.14,
          mood: "calm",
          glow: hu.glow.value * huA,
          alpha: huA,
          look: -0.4, // gazes back toward you — receiving the handoff
          breath: world.clock,
          phase: 1.3
        });
      }

      // ---- the CHARACTER (you), calm, handed over -----------------------
      DOT.drawCharacter(p, c._drawX, rowY, {
        scale: c.scale.value,
        mood: c.mood,
        glow: c.glow.value,
        alpha: Math.min(1, e * 1.4),
        look: 0.4, // looks toward the glass + the human
        breath: world.clock,
        phase: 0.6
      });

      // ---- two faint mono anchors (almost no words) ---------------------
      DOT.label(p, "you", c._drawX, rowY + 56, {
        size: 11,
        alpha: 0.4 * Math.min(1, e * 1.4),
        hex: DOT.palette.ink,
        align: p.CENTER
      });
      DOT.label(p, "a human", huX, rowY + 62, {
        size: 11,
        alpha: 0.4 * huA,
        hex: DOT.palette.ink,
        align: p.CENTER
      });
    }
  });
})();
