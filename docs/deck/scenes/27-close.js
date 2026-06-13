/* =====================================================================
 * BEAT 27 — "Close"  (scenes/27-close.js)
 * ---------------------------------------------------------------------
 * THE END. Silence.
 *
 * The brand glass sphere settles at center, its core softly ON (the
 * "focus / on" state — the product, finally alive), breathing. The
 * wordmark "DOT" and the faint tagline develop up beneath it. Then
 * nothing moves but the breath. No bar, no crowd — one object.
 *
 * CARRY-IN (inherited, never re-created):
 *   world.glass     — the brand glass sphere. We center it + light its core.
 *   world.character — if carried, it lets go (fades to a ghost, gone).
 *
 * Movement budget: TWO movements —
 *   (1) the glass glides to dead center and its core lights on (0 -> on),
 *   (2) the wordmark + tagline develop up beneath as t:0->1.
 * Hairline + alive only. ONE accent: the lit core. ≤1 whimsy: the warm-on.
 * Text is faint mono only (DOT.label) — no on-screen sentence weight.
 * ===================================================================== */
(function () {
  "use strict";
  var DOT = window.DOT;

  window.SCENES.push({
    id: "close",
    note: "DOT. Tell it how you feel.",

    onEnter: function (world) {
      // INHERIT the carried-in glass sphere. If missing (deep-link straight
      // to the close), seed a sane dormant glass so we never blank out.
      // Radius is a FRACTION of min-dim (the SAME unit beats 20/21/24/26
      // use) so the glass NEVER jumps when inherited. It is the lone hero
      // here, so it grows to the deck's largest sphere.
      var g = world.glass;
      if (!g) {
        g = world.glass = {
          xFrac: 0.5,
          yFrac: 0.45,
          r: { value: 0.1, target: 0.14 },
          core: { value: 0, target: 1 }
        };
      } else {
        // the MORPH: ride it to dead center and light the core fully on.
        g.xFrac = 0.5;
        g.yFrac = 0.45;
        g.r.target = 0.14;
        g.core.target = 1; // focus / "on" — the closing state
      }

      // The character, if carried, lets go — fade it to a ghost and gone so
      // only the glass + wordmark remain. (Scene-private handle on the motif.)
      var c = world.character;
      if (c) {
        c.mood = "off";
        c.glow.target = 0.0;
        if (!c._closeAlpha) c._closeAlpha = { value: 1, target: 0 };
        else c._closeAlpha.target = 0;
      }

      // Scene-private reveal for the wordmark + tagline (re-develops on revisit).
      world.closeReveal = { value: 0, target: 1 };
    },

    onExit: function (world) {
      // Carry out the lit glass (it is the brand). Clear scene-private state
      // so re-entering earlier beats restores the character cleanly.
      var c = world.character;
      if (c) c._closeAlpha = null;
      world.closeReveal = null;
    },

    draw: function (p, t, world) {
      var g = world.glass;
      var W = world.w;
      var H = world.h;
      var M = Math.min(W, H);
      var e = DOT.ease(t); // house ease — fast out, long settle

      var gx = g.xFrac * W;
      var gy = g.yFrac * H;

      // ---- movement 1: glass to center, core lights on ----------------
      var rate = DOT.lerp(0.05, 0.14, e);
      DOT.tween(g.r, rate);
      DOT.tween(g.core, rate); // calm warm-up of the core ("on")
      var breath = DOT.breathe(world.clock, { period: 4200, amp: 0.025 });
      var r = g.r.value * M * breath; // fraction -> px
      // the core only commits as the beat develops in (no flash on entry)
      var coreLit = g.core.value * e;

      // the character lets go — a fading ghost behind the glass, then gone
      var c = world.character;
      if (c && c._closeAlpha) {
        DOT.tween(c._closeAlpha, 0.1);
        DOT.tween(c.glow, 0.1);
        if (c._closeAlpha.value > 0.01) {
          DOT.drawCharacter(p, gx, gy, {
            scale: c.scale ? c.scale.value : 1,
            mood: "off",
            glow: c.glow.value,
            alpha: c._closeAlpha.value * 0.5,
            breath: world.clock
          });
        }
      }

      // the brand glass sphere, modeled by light, core softly on
      DOT.glassDot(p, gx, gy, r, coreLit);

      // ---- movement 2: wordmark + tagline develop up beneath ----------
      var rev = world.closeReveal || { value: 1, target: 1 };
      DOT.tween(rev, 0.08);
      var reveal = rev.value * e;

      // a single quiet hairline tick under the glass — the last line of the
      // deck, modeled by light, very faint (the close's baseline)
      var tickHalf = 26 * DOT.ease(DOT.clamp(t * 1.2, 0, 1));
      DOT.hairline(p, gx - tickHalf, gy + r + 34, gx + tickHalf, gy + r + 34, {
        alpha: 0.16 * reveal,
        lip: 0.4
      });

      // wordmark "DOT" — faint mono, centered beneath the glass (the brand)
      DOT.label(p, "DOT", gx, gy + r + 76, {
        size: 13,
        alpha: 0.82 * reveal,
        hex: DOT.palette.ink,
        align: p.CENTER,
        track: 0
      });

      // tagline — the spoken line, smaller + fainter, the last whisper
      DOT.label(p, "TELL IT HOW YOU FEEL.", gx, gy + r + 104, {
        size: 10,
        alpha: 0.4 * reveal,
        hex: DOT.palette.ink,
        align: p.CENTER,
        track: 0
      });
    }
  });
})();
