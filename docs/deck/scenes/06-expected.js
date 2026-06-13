/* =====================================================================
 * BEAT 06 — "Expected"  (scenes/06-expected.js)
 * ---------------------------------------------------------------------
 * Spoken: "I expected: easier medication reminders. Fewer missed
 * appointments. Translators on demand."
 *
 * THE ONE GESTURE: three tiny glyphs of what was EXPECTED pop in, one per
 * spoken phrase, on an organic stagger above the carried character — a
 * pill+clock (medication reminders), a calendar (fewer missed
 * appointments), a speech mark (translators on demand). They settle for a
 * held breath, then a single warm-red sweep crosses the row and strikes
 * each away in its wake: that is NOT what they got. The row ends clean,
 * the character tightening calm -> tense as the wipe lands.
 *
 * Movement budget: TWO movements — (1) the three glyphs develop in on an
 * organic stagger; (2) one warm-red sweep wipes them out (each glyph's
 * alpha tweens to 0 as the line passes its x). Hairline strokes only
 * (≤1px, modeled by light). One alive accent dot per glyph (the
 * expectation, alive for a moment). warm-red ONLY on the sweep + the
 * character's caution.
 *
 * CARRY IN : world.character (rides beneath the row, calm -> tense).
 *            world.slider if present (left faint, the life it sits on).
 * CARRY OUT: character (left clean). Scene-private world._expected nulled
 *            in onExit so the next beat never inherits the wiped glyphs.
 * ===================================================================== */
(function () {
  "use strict";
  var DOT = window.DOT;

  // glyph kinds, left -> right, one per spoken phrase.
  var KINDS = ["pill", "calendar", "speech"];

  window.SCENES.push({
    id: "expected",
    note:
      "I expected: easier medication reminders. Fewer missed appointments. " +
      "Translators on demand.",

    onEnter: function (world) {
      // Scene-private glyph row — seed only if absent (idempotent for
      // deep-link / jump-back). Three glyphs + one sweep, all tweenable.
      var ex = world._expected;
      if (!ex) {
        ex = world._expected = {
          yFrac: 0.36, // the expectation row sits above the character
          glyphs: KINDS.map(function (kind, i) {
            return {
              kind: kind,
              xFrac: 0.34 + i * 0.16, // evenly spaced across the middle
              alpha: { value: 0, target: 1 }, // develop in, then wiped to 0
              struck: false
            };
          }),
          sweep: { value: 0, target: 0 } // 0..1 across the row, warm-red wipe
        };
      } else {
        // retarget for a clean replay if revisited
        ex.glyphs.forEach(function (g) {
          g.alpha.target = 1;
          g.struck = false;
        });
        ex.sweep.value = 0;
        ex.sweep.target = 0;
      }

      // Carried character: calm through the arrival; tightens on the wipe.
      var c = world.character;
      if (!c) {
        world.character = {
          xFrac: 0.5,
          yFrac: 0.62,
          scale: { value: 1, target: 1 },
          mood: "calm",
          glow: { value: 0.45, target: 0.5 },
          _drawX: null
        };
      } else {
        c.mood = "calm";
        c.glow.target = 0.5;
        c.scale.target = 1;
      }
    },

    onExit: function (world) {
      // The glyph row is scene-private — do not let the next beat inherit
      // the wiped-out expectations. Carry out the character (clean).
      world._expected = null;
    },

    draw: function (p, t, world) {
      var W = world.w;
      var H = world.h;
      var e = DOT.ease(t);

      // ----- carried slider: present but quiet, the life it sits on ------
      var s = world.slider;
      if (s) {
        var sx = (s.xFrac == null ? 0.2 : s.xFrac) * W;
        var sy = (s.yFrac == null ? 0.54 : s.yFrac) * H;
        var slen = (s.len ? s.len.value : 0.6) * W;
        DOT.hairline(p, sx, sy, sx + slen, sy, { alpha: 0.16, lip: 0.35 });
      }

      // ----- the expectation row ----------------------------------------
      var ex = world._expected;
      var rowY = ex.yFrac * H;
      var n = ex.glyphs.length;

      // movement 1: glyphs develop in over the first ~70% of the beat.
      var arrive = DOT.clamp(DOT.map(e, 0, 0.7, 0, 1), 0, 1);

      // movement 2: the warm-red sweep crosses in the last stretch, after
      // the three have been read. Drive its target by t so a HOLD keeps it
      // complete (the expectations stay gone). tween glides the value.
      ex.sweep.target = DOT.clamp(DOT.map(t, 0.72, 1, 0, 1), 0, 1);
      DOT.tween(ex.sweep, 0.16);
      var sweep = ex.sweep.value;

      // sweep geometry: a warm-red hairline travelling left -> right across
      // the row, padded just past the glyph band.
      var gx0 = ex.glyphs[0].xFrac * W;
      var gx1 = ex.glyphs[n - 1].xFrac * W;
      var pad = 0.07 * W;
      var sweepX = DOT.lerp(gx0 - pad, gx1 + pad, DOT.ease(sweep));

      for (var i = 0; i < n; i++) {
        var g = ex.glyphs[i];
        var gx = g.xFrac * W;

        // per-glyph arrival on an organic stagger (never lockstep)
        var local = DOT.stagger(i, n, arrive, { spread: 0.5, seed: i + 3 });
        var riseNow = DOT.lerp(14, 0, local); // small lift in, no overshoot
        var alphaNow = local; // 0..1 develop-in

        // the sweep strikes each glyph as it passes: once the wipe line
        // crosses the glyph's x, retarget its alpha to 0 (gone in the wake)
        if (sweepX >= gx && !g.struck) {
          g.struck = true;
          g.alpha.target = 0;
        }
        if (g.struck) {
          DOT.tween(g.alpha, 0.22);
          alphaNow = g.alpha.value;
          riseNow = DOT.lerp(0, 6, 1 - g.alpha.value); // sinks slightly as it goes
        }

        if (alphaNow > 0.01) {
          drawGlyph(p, g.kind, gx, rowY + riseNow, alphaNow, world.clock, i);
        }
      }

      // ----- the warm-red sweep line (the "not what they wanted") --------
      if (sweep > 0.001 && sweep < 0.999) {
        var half = 30;
        DOT.hairline(p, sweepX, rowY - half, sweepX, rowY + half, {
          alpha: 0.85,
          hex: DOT.palette.warmRed,
          lip: 0.3
        });
        // a faint warm-red leading dot rides the tip — alive, caution
        DOT.aliveDot(p, sweepX, rowY, 3.4, {
          hex: DOT.palette.warmRed,
          alpha: 0.9,
          glow: 0.5
        });
      }

      // ----- the carried character, beneath the row ---------------------
      var c = world.character;
      if (c) {
        DOT.tween(c.scale, 0.1);
        DOT.tween(c.glow, 0.1);
        // tighten to tense once the sweep has done its work
        if (sweep > 0.5 && c.mood !== "tense") {
          c.mood = "tense";
          c.glow.target = 0.4;
        }
        var chTargetX = (c.xFrac == null ? 0.5 : c.xFrac) * W;
        c._drawX = c._drawX == null ? chTargetX : DOT.lerp(c._drawX, chTargetX, 0.1);
        var chY = (c.yFrac == null ? 0.62 : c.yFrac) * H;
        DOT.drawCharacter(p, c._drawX, chY, {
          scale: c.scale.value,
          mood: c.mood,
          glow: c.glow.value,
          alpha: Math.min(1, e * 1.4),
          look: DOT.lerp(0, -0.3, sweep), // glances away as it's wiped
          breath: world.clock,
          phase: 0.6
        });
      }
    }
  });

  // ---- glyph drawings: tiny, hairline, modeled by light ---------------
  // Each glyph is a small sign in the white room, built ONLY from
  // hairlines (≤1px, white lip beneath) + one alive accent dot — the
  // expectation, alive for a moment. ~22px tall. `a` is overall alpha;
  // `clock`+`seed` give a quiet breath so they don't sit dead pre-wipe.
  function drawGlyph(p, kind, x, y, a, clock, seed) {
    var br = DOT.breathe(clock, { amp: 0.02, period: 3600, phase: seed * 1.3 });
    var u = 11 * br; // half-extent unit
    var ink = DOT.palette.ink;
    var accent = DOT.palette.accent;

    if (kind === "pill") {
      // a pill (rounded capsule) tilted, with a small alive "time" dot
      var pw = u * 1.4, ph = u * 0.62;
      p.push();
      p.translate(x - u * 0.3, y);
      p.rotate(-0.5);
      // white lip beneath, then the ink outline — depth from light
      strokeCapsule(p, pw, ph, 1.2, p.color(255, 255, 255), 0.7 * a);
      strokeCapsule(p, pw, ph, 0, null, 0.85 * a, ink);
      // dividing seam of the capsule
      DOT.hairline(p, 0, -ph, 0, ph, { alpha: 0.5 * a, lip: 0 });
      p.pop();
      // the "on time" accent dot — alive (the reminder)
      DOT.aliveDot(p, x + u * 0.92, y - u * 0.6, 3, {
        hex: accent,
        alpha: a,
        glow: 0.5,
        breath: clock,
        phase: seed
      });
    } else if (kind === "calendar") {
      // a calendar: square frame, header rule, two binding ticks, one
      // alive accent day-dot (the kept appointment)
      var sq = u * 1.1;
      // top white lip (light catching the upper edge)
      DOT.hairline(p, x - sq, y - sq, x + sq, y - sq, { alpha: 0.85 * a, lip: 0.7 });
      DOT.hairline(p, x - sq, y + sq, x + sq, y + sq, { alpha: 0.85 * a, lip: 0.6 });
      DOT.hairline(p, x - sq, y - sq, x - sq, y + sq, { alpha: 0.85 * a, lip: 0 });
      DOT.hairline(p, x + sq, y - sq, x + sq, y + sq, { alpha: 0.85 * a, lip: 0 });
      // header divider
      DOT.hairline(p, x - sq, y - sq * 0.38, x + sq, y - sq * 0.38, { alpha: 0.5 * a, lip: 0 });
      // binding ticks
      DOT.hairline(p, x - sq * 0.5, y - sq - 4, x - sq * 0.5, y - sq, { alpha: 0.7 * a, lip: 0 });
      DOT.hairline(p, x + sq * 0.5, y - sq - 4, x + sq * 0.5, y - sq, { alpha: 0.7 * a, lip: 0 });
      // the marked day — alive accent dot
      DOT.aliveDot(p, x + sq * 0.32, y + sq * 0.3, 2.8, {
        hex: accent,
        alpha: a,
        glow: 0.5,
        breath: clock,
        phase: seed
      });
    } else {
      // speech mark: a rounded bubble with a small tail + alive accent dot
      var bw = u * 1.3, bh = u * 0.92;
      strokeBubble(p, x, y, bw, bh, p.color(255, 255, 255), 0.7 * a, 1.2); // white lip
      strokeBubble(p, x, y, bw, bh, null, 0.85 * a, 0, ink); // ink outline
      // the "on demand" accent dot inside (the translator, alive)
      DOT.aliveDot(p, x, y - bh * 0.06, 2.8, {
        hex: accent,
        alpha: a,
        glow: 0.5,
        breath: clock,
        phase: seed
      });
    }
  }

  // a capsule outline (origin-centered), hairline (1px) only.
  function strokeCapsule(p, w, h, dy, whiteCol, alpha, inkHex) {
    p.push();
    p.translate(0, dy);
    p.noFill();
    var c;
    if (whiteCol) {
      c = whiteCol;
      c.setAlpha(255 * alpha);
    } else {
      c = DOT.col(p, inkHex, alpha);
    }
    p.stroke(c);
    p.strokeWeight(1);
    p.strokeCap(p.ROUND);
    var x0 = -w + h, x1 = w - h;
    p.beginShape();
    p.vertex(x0, -h);
    p.vertex(x1, -h);
    p.quadraticVertex(w, -h, w, 0);
    p.quadraticVertex(w, h, x1, h);
    p.vertex(x0, h);
    p.quadraticVertex(-w, h, -w, 0);
    p.quadraticVertex(-w, -h, x0, -h);
    p.endShape();
    p.pop();
  }

  // a rounded speech bubble (origin = body center) with a small tail,
  // hairline (1px) only.
  function strokeBubble(p, cx, cy, w, h, whiteCol, alpha, dy, inkHex) {
    p.push();
    p.translate(cx, cy + dy);
    p.noFill();
    var c;
    if (whiteCol) {
      c = whiteCol;
      c.setAlpha(255 * alpha);
    } else {
      c = DOT.col(p, inkHex, alpha);
    }
    p.stroke(c);
    p.strokeWeight(1);
    p.strokeCap(p.ROUND);
    p.strokeJoin(p.ROUND);
    var rad = h * 0.5;
    p.beginShape();
    p.vertex(-w + rad, -h);
    p.vertex(w - rad, -h);
    p.quadraticVertex(w, -h, w, -h + rad);
    p.vertex(w, h - rad);
    p.quadraticVertex(w, h, w - rad, h);
    p.vertex(-w * 0.02, h); // leave room for the tail
    p.vertex(-w * 0.2, h + h * 0.55); // tail tip
    p.vertex(-w * 0.4, h);
    p.vertex(-w + rad, h);
    p.quadraticVertex(-w, h, -w, h - rad);
    p.vertex(-w, -h + rad);
    p.quadraticVertex(-w, -h, -w + rad, -h);
    p.endShape();
    p.pop();
  }
})();
