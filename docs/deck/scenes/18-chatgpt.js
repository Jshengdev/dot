/* =====================================================================
 * BEAT 18 — "ChatGPT"  (scenes/18-chatgpt.js)
 * ---------------------------------------------------------------------
 * "So you turn to ChatGPT. And like all medical advice, it can lead you
 *  astray. Because AI is designed to agree with you. To make you feel
 *  better."
 *
 * THE ONE GESTURE: the character turns toward a glowing rectangular
 * SCREEN at the right; the guiding path that should lead it true instead
 * bends WARM-RED the wrong way — agreement that misdirects.
 *
 * CARRY-IN:  world.character (the same someone) — turns its gaze to the
 * screen (look 0 -> +1) and slips calm -> tense (AI's agreement isn't
 * comfort). Never re-created if present.
 * CARRY-OUT: world.character (left for the next beat).
 *
 * NEW MOTIF (scene-private, nulled on exit):
 *   world.screen — { xFrac, yFrac, wFrac, hFrac, lit:{value,target},
 *                    bend:{value,target} }
 *     lit  = accent-blue core lighting up (0 dormant -> 1 alive)
 *     bend = how far the guiding path swings WRONG (0 true -> 1 astray)
 *
 * Movement budget: TWO coupled movements — (1) the character turns to the
 * screen as it lights up; (2) the guiding path bends warm-red the wrong
 * way. Hairlines only (≤1px). Alive dots. One accent (the lit screen);
 * warm-red ONLY on the wrong path (caution).
 * ===================================================================== */
(function () {
  "use strict";
  var DOT = window.DOT;

  window.SCENES.push({
    id: "chatgpt",
    note:
      "So you turn to ChatGPT. And like all medical advice, it can lead you " +
      "astray. Because AI is designed to agree with you. To make you feel better.",

    onEnter: function (world) {
      // INHERIT the carried character. If deep-linked straight here, seed a
      // sane resting protagonist so we never blank — but the path carries it in.
      var c = world.character;
      if (!c) {
        c = world.character = {
          xFrac: 0.34,
          yFrac: 0.56,
          scale: { value: 1, target: 1 },
          mood: "calm",
          glow: { value: 0.45, target: 0.45 },
          _drawX: null
        };
      }
      c.xFrac = 0.34;
      c.yFrac = 0.56;
      c.mood = "tense";        // AI's agreement isn't comfort — it's misdirection
      c.scale.target = 1;
      c.glow.target = 0.4;

      // The glowing advisor SCREEN — seed if absent, else retarget.
      var sc = world.screen;
      if (!sc) {
        sc = world.screen = {
          xFrac: 0.7,
          yFrac: 0.52,
          wFrac: 0.16,
          hFrac: 0.2,
          lit: { value: 0, target: 1 },   // core lights up
          bend: { value: 0, target: 1 }   // guide-path swings astray
        };
      } else {
        sc.xFrac = 0.7;
        sc.yFrac = 0.52;
        sc.lit.target = 1;
        sc.bend.target = 1;
      }
    },

    onExit: function (world) {
      // Carry out the character. Null scene-private screen so the next beat
      // doesn't inherit it.
      world.screen = null;
    },

    draw: function (p, t, world) {
      var W = world.w;
      var H = world.h;
      var e = DOT.ease(t); // house ease — fast out, long settle

      var c = world.character;
      var sc = world.screen;

      // screen geometry (resolved from live viewport — survives resize)
      var scx = sc.xFrac * W;
      var scy = sc.yFrac * H;
      var scw = sc.wFrac * W;
      var sch = sc.hFrac * H;

      // tween rates coupled to the intro `e` so both moves read as ONE
      // deliberate gesture, not idle glides.
      var rate = DOT.lerp(0.05, 0.16, e);
      DOT.tween(sc.lit, rate);
      DOT.tween(sc.bend, rate);
      DOT.tween(c.glow, 0.1);
      DOT.tween(c.scale, 0.1);

      var litA = sc.lit.value;

      // ---- the SCREEN: a rectangle modeled by light -------------------
      // faint cool fill, four hairline edges (lines caught by the page's
      // light), then a lit accent-blue core inside — depth from light, no
      // flat border, no stroke > 1px.
      p.push();
      p.noStroke();
      p.fill(DOT.col(p, DOT.palette.ink, 0.03 + 0.05 * litA));
      p.rect(scx - scw / 2, scy - sch / 2, scw, sch, 6);
      p.pop();

      var L = scx - scw / 2, R = scx + scw / 2;
      var Tp = scy - sch / 2, B = scy + sch / 2;
      var rimA = 0.32 + 0.42 * litA;
      DOT.hairline(p, L, Tp, R, Tp, { alpha: rimA, lip: 0.9 });
      DOT.hairline(p, R, Tp, R, B, { alpha: rimA, lip: 0.9 });
      DOT.hairline(p, R, B, L, B, { alpha: rimA, lip: 0.9 });
      DOT.hairline(p, L, B, L, Tp, { alpha: rimA, lip: 0.9 });

      // the lit core — the ONE thing alive/active now (accent blue),
      // breathing so the screen reads switched-on, never flashing.
      var coreR = Math.min(scw, sch) * 0.22;
      DOT.aliveDot(p, scx, scy, coreR, {
        hex: DOT.palette.accent,
        alpha: litA,
        glow: 0.7,
        breath: world.clock,
        phase: 0.4
      });

      // ---- the CHARACTER turns toward the screen ----------------------
      var chX = c.xFrac * W;
      c._drawX = c._drawX == null ? chX : DOT.lerp(c._drawX, chX, 0.12);
      var chY = c.yFrac * H;
      DOT.drawCharacter(p, c._drawX, chY, {
        scale: c.scale.value,
        mood: c.mood,
        glow: c.glow.value,
        alpha: 1,
        look: e, // gaze swings right toward the screen as t rises
        breath: world.clock,
        phase: 0.6
      });

      // ---- the GUIDING PATH that bends the WRONG way ------------------
      // It should lead the character forward to the screen — a true,
      // straight invitation. Instead it bows WARM-RED downward and away
      // (caution): agreement that misdirects. A short hairline path of
      // staggered alive dots, swung off-true by `bend`.
      var bend = sc.bend.value;
      var startX = c._drawX + 30;
      var startY = chY + 8;
      var endX = L - 14;
      var endY = scy + sch * 0.16;
      var segN = 7;

      var prevX = startX, prevY = startY;
      for (var i = 1; i <= segN; i++) {
        var f = i / segN;
        // base straight interpolation (the TRUE path)
        var bx = DOT.lerp(startX, endX, f);
        var by = DOT.lerp(startY, endY, f);
        // wrong-way bow: pull DOWN and away, peaking mid-path, scaled by
        // bend and by this dot's own staggered arrival so it breathes.
        var local = DOT.stagger(i, segN, e, { spread: 0.5 });
        var bow = Math.sin(f * Math.PI) * (sch * 0.85) * bend * local;
        var px = bx;
        var py = by + bow;

        // the hairline link, going warm-red as it strays
        var segA = 0.5 * local * (0.4 + 0.6 * bend);
        DOT.hairline(p, prevX, prevY, px, py, {
          hex: DOT.palette.warmRed,
          alpha: segA,
          lip: 0
        });

        // a small alive evidence dot at each node, warm-red caution
        if (i < segN) {
          DOT.aliveDot(p, px, py, 3.2, {
            hex: DOT.palette.warmRed,
            alpha: 0.7 * local * bend,
            glow: 0.45,
            breath: world.clock,
            phase: i * 0.7
          });
        }
        prevX = px;
        prevY = py;
      }
    }
  });
})();
