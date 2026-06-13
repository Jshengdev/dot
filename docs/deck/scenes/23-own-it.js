/* =====================================================================
 * BEAT 23 — "Own It"  (scenes/23-own-it.js)
 * ---------------------------------------------------------------------
 * Spoken: "And it gives you something you own — to carry to the people
 * who can help."
 *
 * THE GESTURE: a clean report/card develops OUT of the character — a
 * card built from hairline edges + a few faint ruled lines, with ONE
 * ALIVE accent marker that lights on it (the thing you now OWN). Then
 * the character TURNS (gaze + a small lean) to CARRY it forward to the
 * people who can help.
 *
 * CARRY-IN  : world.character — the protagonist dot (inherited).
 * CARRY-OUT : world.character — left in world, now turned to carry.
 *             world.report    — the card it now owns (NEW motif, below).
 *
 * NEW motif slot: world.report
 *   { xFrac, yFrac, w, h, hold:{value,target}, lit:{value,target}, turn:{value,target} }
 *   hold 0..1 — the card's emergence (0 = inside the dot, 1 = held out).
 *   lit  0..1 — the owned accent marker lighting on the card.
 *   turn 0..1 — the character's turn-to-carry (gaze + lean toward exit).
 *
 * Movement budget: 2 movements —
 *   (1) the card develops out of the dot + its marker lights (ownership);
 *   (2) the character turns to carry it onward.
 * Hairline strokes only. Alive dots only. One accent on the live thing.
 * ===================================================================== */
(function () {
  "use strict";
  var DOT = window.DOT;

  window.SCENES.push({
    id: "own-it",
    note:
      "And it gives you something you own — to carry to the people who can help.",

    onEnter: function (world) {
      // INHERIT the character. Seed a sane fallback if deep-linked here.
      var c = world.character;
      if (!c) {
        c = world.character = {
          xFrac: 0.4,
          yFrac: 0.5,
          scale: { value: 1, target: 1 },
          mood: "calm",
          glow: { value: 0.5, target: 0.5 },
          _drawX: null
        };
      } else {
        c.mood = "calm";
        c.glow.target = 0.55;
        c.scale.target = 1;
      }
      // Sit left-of-center so the card has room to be held out + carried.
      c.xFrac = 0.4;
      c.yFrac = 0.5;

      // The card it now owns. Seed only if absent (idempotent re-entry).
      var rpt = world.report;
      if (!rpt) {
        rpt = world.report = {
          xFrac: 0.4,
          yFrac: 0.5,
          w: 124,
          h: 158,
          hold: { value: 0, target: 1 }, // develop out of the dot, settle held
          lit: { value: 0, target: 1 }, // the owned marker lights on
          turn: { value: 0, target: 1 } // character turns to carry it
        };
      } else {
        rpt.hold.target = 1;
        rpt.lit.target = 1;
        rpt.turn.target = 1;
      }
    },

    onExit: function (world) {
      // Carry out the character (now owning + carrying the report) and the
      // report motif itself. Nothing scene-private to null.
    },

    draw: function (p, t, world) {
      var c = world.character;
      var rpt = world.report;
      var W = world.w;
      var H = world.h;
      var e = DOT.ease(t); // movement 1 — the card develops
      var eTurn = DOT.easeB(t); // movement 2 — the turn lags a touch

      // resolve the dot's live anchor (survives resize)
      var cx = c.xFrac * W;
      var cy = c.yFrac * H;

      // tween persistent handles, biased by `e` so the emergence + turn read
      // as deliberate single movements on first arrival.
      DOT.tween(rpt.hold, DOT.lerp(0.05, 0.16, e));
      DOT.tween(rpt.lit, 0.1);
      DOT.tween(rpt.turn, DOT.lerp(0.04, 0.14, eTurn));
      DOT.tween(c.scale, 0.1);
      DOT.tween(c.glow, 0.1);

      var hold = rpt.hold.value;
      var turn = rpt.turn.value;

      // the character glides to its anchor; everything hangs off this px.
      c._drawX = c._drawX == null ? cx : DOT.lerp(c._drawX, cx, 0.12);
      var chX = c._drawX;
      var chY = cy;
      var chR = 29 * c.scale.value; // ~58px Ø body radius at scale 1

      // ---- card geometry: born AT the dot, develops out to its right ---
      var lean = 10 * c.scale.value * turn; // small lean as it commits to carry
      var restDX = chR + 92 * c.scale.value; // held to the dot's right
      var cardCX = chX + DOT.lerp(0, restDX, hold) + lean * 0.6;
      var cardCY = chY - DOT.lerp(0, 6, hold);
      var cw = rpt.w * c.scale.value * hold;
      var ch = rpt.h * c.scale.value * hold;
      var L = cardCX - cw / 2;
      var R = cardCX + cw / 2;
      var Tp = cardCY - ch / 2;
      var Bt = cardCY + ch / 2;

      // ---- the CARD — four hairline edges, modeled by light ------------
      // It develops together out of thin lines (depth from light only,
      // never a flat border or a filled sheet).
      if (hold > 0.02) {
        var edge = 0.85 * hold;
        DOT.hairline(p, L, Tp, R, Tp, { alpha: edge, lip: 0.9 });
        DOT.hairline(p, L, Bt, R, Bt, { alpha: edge, lip: 0.9 });
        DOT.hairline(p, L, Tp, L, Bt, { alpha: edge, lip: 0 });
        DOT.hairline(p, R, Tp, R, Bt, { alpha: edge, lip: 0 });

        // a few faint ruled lines — "a report", no real words. Staggered so
        // the card fills like a developing photo, never a grid.
        var rows = 5;
        var pad = cw * 0.16;
        var rowGap = ch * 0.135;
        var rowY0 = Tp + ch * 0.27;
        for (var i = 0; i < rows; i++) {
          var ri = DOT.stagger(i, rows, e, { spread: 0.5 });
          if (ri <= 0.001) continue;
          var ry = rowY0 + i * rowGap;
          var full = i === rows - 1 ? 0.46 : 0.7 - (i % 2) * 0.18; // varied widths = content
          var rx2 = L + pad + (cw - pad * 2) * full * ri;
          DOT.hairline(p, L + pad, ry, rx2, ry, { alpha: 0.4 * hold, lip: 0 });
        }
      }

      // ---- the OWNED marker: ONE ALIVE accent dot lit on the card ------
      // top-left of the card — the single thing alive/active right now.
      if (rpt.lit.value > 0.01 && hold > 0.4) {
        DOT.aliveDot(p, L + cw * 0.16, Tp + ch * 0.14, 4.6, {
          hex: DOT.palette.accent,
          alpha: rpt.lit.value * hold,
          glow: 0.6,
          breath: world.clock,
          phase: 0.4
        });
      }

      // ---- the CHARACTER turns to carry it -----------------------------
      // movement 2: the gaze shifts toward the report it now holds and a
      // small lean leans it toward what it carries forward. Stays CALM —
      // this is a good thing to own.
      DOT.drawCharacter(p, chX + lean, chY, {
        scale: c.scale.value,
        mood: c.mood,
        glow: c.glow.value,
        alpha: Math.min(1, e * 1.4),
        look: 0.85 * turn,
        breath: world.clock,
        phase: 0.6
      });
    }
  });
})();
