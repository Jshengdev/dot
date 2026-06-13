/* =====================================================================
 * BEAT 17 — "Mislabeled"  (scenes/17-mislabeled.js)
 * ---------------------------------------------------------------------
 * A new fear: getting mislabeled — shrinking yourself into a box just to
 * be taken seriously. The carried-in CHARACTER is squeezed: a rigid
 * warm-red box closes in around it, the dot shrinks + goes tense inside,
 * then a flat label snaps on. Constriction, made visible.
 *
 * CARRY-IN  (inherited, never re-created):
 *   world.character — the protagonist dot. We shrink it + turn it tense,
 *   remembering its pre-squeeze scale so onExit hands it back un-boxed.
 *
 * CARRY-OUT (left in world for the next beat):
 *   world.character — restored geometry handed forward (un-squeezed).
 *
 * NEW MOTIF SLOT (scene-private — nulled on exit):
 *   world.box — { xFrac, yFrac,
 *                 close:{value,target},   // 1 = open, 0 = clamped tight
 *                 label:{value,target} }  // flat-label snap-on alpha
 *
 * Movement budget: TWO movements —
 *   (1) the four rigid box walls close inward + the dot shrinks/tenses;
 *   (2) near the tail, a flat warm-red label snaps on against the frame.
 * Hairline strokes only (every line via DOT.hairline). One accent retires
 * — warm-red carries the whole beat: caution / the box / the wrong label.
 * ===================================================================== */
(function () {
  "use strict";
  var DOT = window.DOT;

  window.SCENES.push({
    id: "mislabeled",
    note:
      "And hit a new fear: what if you get mislabeled? What if you shrink " +
      "yourself into a box just to be taken seriously?",

    onEnter: function (world) {
      // INHERIT the carried-in character. Seed a sane fallback if a
      // presenter deep-links straight here, so we never blank out.
      var c = world.character;
      if (!c) {
        c = world.character = {
          xFrac: 0.5,
          yFrac: 0.5,
          scale: { value: 1, target: 1 },
          mood: "calm",
          glow: { value: 0.5, target: 0.5 },
          _drawX: null
        };
      }
      // Remember the carried-in scale ONCE so onExit can hand it back.
      if (c._preMislabelScale == null) c._preMislabelScale = c.scale.target;

      // The squeeze: the dot shrinks, tenses, and its glow dims (boxed in).
      c.xFrac = 0.5;
      c.yFrac = 0.5;
      c.scale.target = 0.6;
      c.mood = "tense";
      c.glow.target = 0.16;

      // The constricting box. `close` glides 1 -> 0 (open -> clamped tight)
      // in draw, coupled to the beat's `e`. `label` is the flat-label snap.
      var b = world.box;
      if (!b) {
        b = world.box = {
          xFrac: 0.5,
          yFrac: 0.5,
          close: { value: 1, target: 0 }, // 1 open, 0 walls clamped in
          label: { value: 0, target: 1 } // flat warm-red label alpha
        };
      } else {
        b.xFrac = 0.5;
        b.yFrac = 0.5;
        b.close.value = 1;
        b.close.target = 0;
        b.label.value = 0;
        b.label.target = 1;
      }
    },

    onExit: function (world) {
      // Hand the character back un-squeezed: restore scale + calm so the
      // next beat can release it. Leave it in world (carry-out).
      var c = world.character;
      if (c) {
        c.scale.target = c._preMislabelScale == null ? 1 : c._preMislabelScale;
        c.mood = "calm";
        c.glow.target = 0.5;
        c._preMislabelScale = null;
      }
      // Null the scene-private box so the next beat doesn't inherit it.
      world.box = null;
    },

    draw: function (p, t, world) {
      var W = world.w;
      var H = world.h;
      var e = DOT.ease(t); // house ease — fast out, long settle
      var b = world.box;
      var c = world.character;

      // Deep-link fallback so draw never crashes / blanks.
      if (!b) {
        b = world.box = {
          xFrac: 0.5,
          yFrac: 0.5,
          close: { value: 0, target: 0 },
          label: { value: 1, target: 1 }
        };
      }
      if (!c) {
        c = world.character = {
          xFrac: 0.5,
          yFrac: 0.5,
          scale: { value: 0.6, target: 0.6 },
          mood: "tense",
          glow: { value: 0.16, target: 0.16 },
          _drawX: null
        };
      }

      var cx = b.xFrac * W;
      var cy = b.yFrac * H;

      // ---- MOVEMENT 1: the walls close in -----------------------------
      // Couple the close-tween to `e` so it reads as a single deliberate
      // clamp, not an idle glide. close: 1 (wide/open) -> 0 (tight frame).
      var rate = DOT.lerp(0.05, 0.18, e);
      DOT.tween(b.close, rate);

      // The frame's reach: generous when open, a tight rigid box when
      // clamped. A touch wider than tall — it reads as a label box.
      var span = Math.min(W, H);
      var openHalf = span * 0.34;
      var tightHalf = span * 0.115;
      var half = DOT.lerp(tightHalf, openHalf, b.close.value);
      var hx = half * 1.18;
      var hy = half;

      var L = cx - hx,
        R = cx + hx,
        Tp = cy - hy,
        Bm = cy + hy;

      // Rigidity reads in the alpha: faint while wide, firm once clamped.
      var wallA = DOT.lerp(0.85, 0.3, b.close.value);

      // Four straight hairline walls, modeled by light (≤1px, white lip).
      DOT.hairline(p, L, Tp, R, Tp, { alpha: wallA, lip: 0.9 });
      DOT.hairline(p, L, Bm, R, Bm, { alpha: wallA, lip: 0.9 });
      DOT.hairline(p, L, Tp, L, Bm, { alpha: wallA, lip: 0.5 });
      DOT.hairline(p, R, Tp, R, Bm, { alpha: wallA, lip: 0.5 });

      // warm-red corner ticks — the box "bites" closed. Fade in as it
      // clamps. Hairlines only — rigidity from light + meaning, not weight.
      var tickA = (1 - b.close.value) * 0.85;
      if (tickA > 0.01) {
        var tk = Math.min(hx, hy) * 0.26;
        var corners = [
          [L, Tp, 1, 1],
          [R, Tp, -1, 1],
          [L, Bm, 1, -1],
          [R, Bm, -1, -1]
        ];
        for (var i = 0; i < 4; i++) {
          var k = corners[i];
          DOT.hairline(p, k[0], k[1], k[0] + tk * k[2], k[1], {
            alpha: tickA,
            hex: DOT.palette.warmRed,
            lip: 0
          });
          DOT.hairline(p, k[0], k[1], k[0], k[1] + tk * k[3], {
            alpha: tickA,
            hex: DOT.palette.warmRed,
            lip: 0
          });
        }
      }

      // ---- the CHARACTER, boxed in — shrinks + goes tense -------------
      DOT.tween(c.scale, 0.1);
      DOT.tween(c.glow, 0.1);
      var targetX = cx;
      c._drawX = c._drawX == null ? targetX : DOT.lerp(c._drawX, targetX, 0.14);
      DOT.drawCharacter(p, c._drawX, cy, {
        scale: c.scale.value,
        mood: c.mood,
        glow: c.glow.value,
        alpha: 1,
        breath: world.clock,
        phase: 0.6
      });

      // ---- MOVEMENT 2: the flat label snaps on ------------------------
      // It arrives late and hard (no long settle) — a label slapped on.
      // A short warm-red underline + a faint mono tag against the lower
      // wall: the reductive box you've been filed into.
      var snap = DOT.clamp(DOT.map(e, 0.62, 0.82, 0, 1), 0, 1); // late, abrupt
      b.label.value = snap; // intentionally NOT eased — it snaps
      if (b.label.value > 0.01) {
        var la = b.label.value;
        var ly = Bm - hy * 0.34; // sits just inside the lower wall
        var lw = hx * 0.52;
        // the flat label bar — one warm-red hairline, dead level (rigid)
        DOT.hairline(p, cx - lw, ly, cx + lw, ly, {
          alpha: 0.9 * la,
          hex: DOT.palette.warmRed,
          lip: 0
        });
        // a single faint mono tag above the bar — minimal, reductive
        DOT.label(p, "LABELED", cx, ly - 9, {
          size: 10,
          alpha: 0.7 * la,
          hex: DOT.palette.warmRed,
          align: p.CENTER
        });
      }
    }
  });
})();
