/* =====================================================================
 * BEAT 19 — "You're right"  (scenes/19-youre-right.js)
 * ---------------------------------------------------------------------
 * "I don't really need help, I'm just being dramatic, right? —
 *  You're absolutely right."
 *
 * INHERITS the carried `world.character` (the protagonist dot). Two chat
 * bubbles surface in a quiet column: first a USER bubble (the doubt) in
 * calm ink, then — beneath it — an AI bubble that AGREES, blooming in
 * WARM-RED. It agreed with the exact thing that should have been
 * challenged. No words are drawn; the bubbles speak by shape, order, and
 * color. As the agreement lands, the character's glow fades toward quiet
 * — the chaos dissolving (carry-out into the DOT reveal).
 *
 * CARRY-IN:  world.character (mood/glow softens; never re-created if present)
 * CARRY-OUT: world.character (left quieter — glow near-off, chaos dissolving)
 *
 * NEW MOTIF (scene-private, nulled on exit):
 *   world.bubbles — {
 *     user : { rise:{value,target} }   the doubt bubble (calm ink)
 *     ai   : { rise:{value,target} }   the agreement bubble (warm-red)
 *   }
 *
 * Movement budget: 2 movements —
 *   (1) the USER doubt bubble rises in (calm ink, faint, modeled by light);
 *   (2) the AI bubble blooms in beneath it in WARM-RED — agreeing with the
 *       doubt instead of challenging it — as the character's glow quietly
 *       fades (the chaos dissolving).
 *
 * LAW conformance: every line via DOT.hairline (≤1px); bubbles modeled by
 * a 1px white lip + faint shadow, never a flat border; one ink at alphas;
 * warm-red ONLY on the wrong agreement; almost no text.
 * ===================================================================== */
(function () {
  "use strict";
  var DOT = window.DOT;

  // A bubble modeled by LIGHT (faint fill + 1px white inset lip on the top
  // edge + faint shadow lip beneath), never a flat border. `tail` = 'left'
  // (person speaking) or 'right' (AI replying). `hex` colors the fill; on a
  // warm-red bubble we also pass an `inkHex` for the inner "text" hairline.
  function bubble(p, cx, cy, w, h, r, hex, a, tail, inkHex, inkA) {
    p.push();
    p.rectMode(p.CENTER);
    p.noStroke();

    // soft baked underglow when warm (the reassuring — but wrong — bloom)
    if (hex === DOT.palette.warmRed) {
      var halo = DOT.col(p, DOT.palette.warmRed, 0.12 * a);
      p.fill(halo);
      p.rect(cx, cy, w * 1.14, h * 1.5, r * 1.3);
    }

    // faint shadow lip beneath (depth from light, never a border)
    var shade = DOT.col(p, DOT.palette.ink, 0.05 * a);
    p.fill(shade);
    p.rect(cx, cy + 1.2, w, h, r);

    // the bubble body — faint fill
    var body = DOT.col(p, hex, a);
    p.fill(body);
    p.rect(cx, cy, w, h, r);

    // 1px white inset lip catching the page light on the upper edge
    var lip = p.color(255, 255, 255);
    lip.setAlpha(255 * 0.42 * Math.min(1, a * 2));
    p.noFill();
    p.stroke(lip);
    p.strokeWeight(1);
    p.rect(cx - 0.5, cy - 0.6, w, h, r);
    p.noStroke();

    // the speaking tail — a small soft triangle off one side
    p.fill(body);
    if (tail === "left") {
      p.triangle(
        cx - w * 0.5 + 2, cy - h * 0.14,
        cx - w * 0.5 + 2, cy + h * 0.14,
        cx - w * 0.5 - h * 0.24, cy + h * 0.34
      );
    } else {
      p.triangle(
        cx + w * 0.5 - 2, cy - h * 0.14,
        cx + w * 0.5 - 2, cy + h * 0.14,
        cx + w * 0.5 + h * 0.24, cy + h * 0.34
      );
    }
    p.pop();

    // a single faint "text" hairline inside (no real words) — via hairline
    if (inkA > 0.001) {
      DOT.hairline(p, cx - w * 0.3, cy, cx + w * 0.22, cy, {
        alpha: inkA,
        hex: inkHex,
        lip: 0
      });
    }
  }

  window.SCENES.push({
    id: "youre-right",
    note:
      "I don't really need help, I'm just being dramatic, right? — You're " +
      "absolutely right.",

    onEnter: function (world) {
      // INHERIT the carried character. If deep-linked straight here, seed a
      // sane default so we never blank out — but the path carries it in.
      var c = world.character;
      if (!c) {
        c = world.character = {
          xFrac: 0.2,
          yFrac: 0.56,
          scale: { value: 1, target: 0.92 },
          mood: "calm",
          glow: { value: 0.4, target: 0.18 },
          _drawX: null
        };
      } else {
        // re-anchor low-left; the bubbles take the stage on the right
        c.xFrac = 0.2;
        c.yFrac = 0.56;
        c.mood = "calm";
        c.scale.target = 0.92;
        // glow fades quiet — the chaos begins to dissolve (carry-out)
        c.glow.target = 0.18;
      }

      // The two chat bubbles — seed if absent, else retarget their rise.
      var b = world.bubbles;
      if (!b) {
        b = world.bubbles = {
          user: { rise: { value: 0, target: 1 } },
          ai: { rise: { value: 0, target: 1 } }
        };
      } else {
        b.user.rise.target = 1;
        b.ai.rise.target = 1;
      }
    },

    onExit: function (world) {
      // Carry out the (now-quieter) character. Null the scene-private
      // bubbles so the next beat doesn't inherit the chat — the chaos
      // dissolves away with this cut.
      world.bubbles = null;
    },

    draw: function (p, t, world) {
      var W = world.w;
      var H = world.h;
      var M = Math.min(W, H);
      var e = DOT.ease(t);

      var c = world.character;
      var b = world.bubbles;

      // tween the persistent handles
      DOT.tween(c.glow, 0.1);
      DOT.tween(c.scale, 0.1);
      // user bubble rises first; AI bubble follows (its rate trails e*e)
      DOT.tween(b.user.rise, DOT.lerp(0.05, 0.18, e));
      DOT.tween(b.ai.rise, DOT.lerp(0.02, 0.14, e * e));

      var u = b.user.rise.value;
      var ai = b.ai.rise.value;

      // bubble geometry, resolved from the live viewport (survives resize)
      var bw = M * 0.26; // bubble width
      var bh = bw * 0.34; // bubble height
      var r = bh * 0.5; // pill radius
      var gap = bh * 0.62;
      var colX = W * 0.6; // chat column center x
      var userY = H * 0.42;
      var aiY = userY + bh + gap;

      // ---- Movement 1: the USER bubble (the doubt) rises in ------------
      // calm ink, faint; a gentle upward settle as it fades in. Tail LEFT
      // toward the character (the person speaking the doubt).
      var uo = userY - 16 * (1 - DOT.ease(u));
      bubble(
        p, colX, uo, bw, bh, r,
        DOT.palette.ink, 0.085 * u, "left",
        DOT.palette.ink, 0.5 * u
      );

      // ---- Movement 2: the AI bubble blooms in WARM-RED ---------------
      // beneath the doubt, tail RIGHT (the AI replying). Warm-red because
      // it agreed with the exact thing it should have challenged — caution,
      // not comfort. The inner hairline is bright white (the confident
      // "you're absolutely right").
      var aio = aiY - 12 * (1 - DOT.ease(ai));
      bubble(
        p, colX, aio, bw, bh, r,
        DOT.palette.warmRed, 0.6 * ai, "right",
        "#ffffff", 0.82 * ai
      );

      // ---- the CHARACTER, quieting at the left ------------------------
      // glow has faded toward near-off — reassured into silence, the chaos
      // dissolving. Calm face, gaze settling inward toward its own doubt.
      var chX = c.xFrac * W;
      var chY = c.yFrac * H;
      c._drawX = c._drawX == null ? chX : DOT.lerp(c._drawX, chX, 0.12);
      DOT.drawCharacter(p, c._drawX, chY, {
        scale: c.scale.value,
        mood: "calm",
        glow: c.glow.value,
        look: DOT.lerp(0.2, -0.15, e), // settles its gaze inward
        alpha: DOT.lerp(0.9, 0.78, e), // softening (carry-out: dissolving)
        breath: world.clock,
        phase: 0.6
      });
    }
  });
})();
