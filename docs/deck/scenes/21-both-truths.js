/* =====================================================================
 * BEAT 21 — "Both Truths"  (scenes/21-both-truths.js)
 * ---------------------------------------------------------------------
 * Spoken: "You tell your story — and DOT holds both truths."
 *
 * The two registers of a life are finally HELD together. The carried
 * SUBJECTIVE flow (world.storyRibbon — one ink line) and the carried
 * OBJECTIVE evidence (world.factDots — discrete blue points) gather
 * inward and organize INSIDE the brand glass dot: the felt story coils
 * within; the precise facts settle into an orderly ring around it.
 * Two truths, one calm vessel.
 *
 * The glass dot is INHERITED from beat 20 (it already arrived + lit) —
 * we do NOT re-form it. The ONE new gesture here is the gather: the two
 * carried truths draw inward and come to rest inside the lens.
 *
 * CARRY-IN (inherited; sane fallback if deep-linked):
 *   world.glass       — the brand glass sphere (already lit from beat 20)
 *   world.storyRibbon — the flowing subjective path of the life
 *   world.factDots    — the precise blue objective points
 *   world.character   — the protagonist dot
 *
 * CARRY-OUT (left in world):
 *   world.glass, world.character — persist for following beats
 *   world.storyRibbon / world.factDots — carried (now gathered inside)
 *
 * Movement budget: ONE movement —
 *   the carried ribbon + fact-dots GATHER inward and organize inside the
 *   glass (ribbon coils within; facts settle into an even ring). The
 *   `gather` handle lives on the carried motifs so it survives a revisit.
 * ===================================================================== */
(function () {
  "use strict";
  var DOT = window.DOT;

  // Resolution of the carried ribbon when we have to seed a fallback.
  var RIBBON_N = 56;

  window.SCENES.push({
    id: "both-truths",
    note:
      "You tell your story — and DOT holds both truths. The felt story and " +
      "the precise facts finally come together — gathered and organized " +
      "inside one calm vessel.",

    onEnter: function (world) {
      // ---- INHERIT the glass dot; it arrived + lit in beat 20. Only seed
      // a sane, already-formed vessel if deep-linked straight here. ----
      var g = world.glass;
      if (!g) {
        g = world.glass = {
          xFrac: 0.5,
          yFrac: 0.5,
          r: { value: 0.16, target: 0.18 }, // already a vessel; settles a touch
          core: { value: 1, target: 1 } // already lit (holds both truths)
        };
      } else {
        g.xFrac = 0.5;
        g.yFrac = 0.5;
        g.r.target = 0.18; // open just enough to hold the two truths
        g.core.target = 1;
      }

      // ---- INHERIT the subjective ribbon; backfill the BAND-shape fields
      // this beat coils from. The carried ribbon from beat 15 is a points[]
      // curve ({ pts, flow, alpha, split }); this beat reads a parametric
      // spread band ({ xFrac, wFrac, yFrac, ampFrac, phase }). Always ensure
      // those band fields exist (without clobbering carried pts/alpha) so the
      // coil never reads `undefined * W` = NaN. Idempotent on revisit.
      var rb = world.storyRibbon;
      if (!rb) rb = world.storyRibbon = {};
      if (rb.xFrac == null) rb.xFrac = 0.1;
      if (rb.wFrac == null) rb.wFrac = 0.34;
      if (rb.yFrac == null) rb.yFrac = 0.5;
      if (rb.ampFrac == null) rb.ampFrac = 0.09;
      if (rb.phase == null) rb.phase = 1.6;
      if (!rb.alpha) rb.alpha = { value: 1, target: 1 };
      else rb.alpha.target = 1;
      // The gather handle: 0 = spread across canvas, 1 = coiled in the glass.
      // It lives on the ribbon so a revisit re-coils cleanly.
      if (!rb.gather) rb.gather = { value: 0, target: 1 };
      else rb.gather.target = 1;

      // ---- INHERIT the objective fact-dots (beat-15 shape); fallback seed -
      var fd = world.factDots;
      if (!fd || !fd.length) {
        fd = world.factDots = [];
        for (var i = 0; i < 16; i++) {
          fd.push({ alpha: { value: 1, target: 1 } });
        }
      }
      // re-assert them present + give each a stable ring index for the slot.
      for (var k = 0; k < fd.length; k++) {
        if (!fd[k].alpha) fd[k].alpha = { value: 1, target: 1 };
        fd[k].alpha.target = 1;
        fd[k]._k = k; // its place on the ring (stable per dot)
      }

      // ---- keep the protagonist calm + present beside the vessel ----
      var c = world.character;
      if (!c) {
        world.character = {
          xFrac: 0.22,
          yFrac: 0.52,
          scale: { value: 0.85, target: 0.85 },
          mood: "calm",
          glow: { value: 0.4, target: 0.45 },
          _drawX: null
        };
      } else {
        c.xFrac = 0.22; // step aside so the vessel takes center
        c.yFrac = 0.52;
        c.mood = "calm";
        c.scale.target = 0.85;
        c.glow.target = 0.45;
      }
    },

    onExit: function (world) {
      // Carry out glass + character + the now-gathered truths. The gather
      // handles ride on the carried motifs, so nothing scene-private to null.
    },

    draw: function (p, t, world) {
      var W = world.w;
      var H = world.h;
      var M = Math.min(W, H);
      var e = DOT.ease(t); // house ease — fast out, long settle

      var g = world.glass;
      var rb = world.storyRibbon;
      var fd = world.factDots || [];

      // --- glass settles to its holding size; core stays lit ---
      DOT.tween(g.r, 0.1);
      DOT.tween(g.core, 0.1);
      var gx = g.xFrac * W;
      var gy = g.yFrac * H;
      var gR = g.r.value * M;

      // --- THE ONE MOVEMENT: gather. Couple the rate to `e` so the inward
      // draw reads as one deliberate move, then settles when held. ---
      DOT.tween(rb.gather, DOT.lerp(0.04, 0.14, e));
      var gather = DOT.ease(DOT.clamp(rb.gather.value, 0, 1));

      // calm ambient breath of the held contents (never bounces)
      var breathe = DOT.breathe(world.clock, { period: 4200, amp: 0.04 });

      // ---- the SUBJECTIVE ribbon: gathers + coils inside the glass ------
      // It lives spread along its old left-side band; each sample lerps
      // toward an inward spiral seated inside the lens. One continuous ink
      // HAIRLINE (≤1px, modeled by light — a felt line, never a border),
      // faint so the glass reads as enclosing.
      var x0 = rb.xFrac * W;
      var span = rb.wFrac * W;
      var yc = rb.yFrac * H;
      var amp = rb.ampFrac * H;
      var ribAlpha = (rb.alpha ? rb.alpha.value : 1);

      var inkCol = p.color(DOT.palette.ink);
      inkCol.setAlpha(255 * 0.45 * ribAlpha);
      p.push();
      p.noFill();
      p.stroke(inkCol);
      p.strokeWeight(1); // LAW: hairline — the felt line is modeled by light
      p.strokeCap(p.ROUND);
      p.strokeJoin(p.ROUND);
      p.beginShape();
      for (var s = 0; s <= RIBBON_N; s++) {
        var u = s / RIBBON_N; // 0..1 along the ribbon
        // spread position: where the felt line lived across the canvas
        var sx = x0 + u * span;
        var sy =
          yc +
          Math.sin(u * Math.PI * 1.7 + rb.phase) * amp +
          Math.sin(u * Math.PI * 3.3 + rb.phase * 1.7) * amp * 0.28;
        // coiled target: an inward spiral seated in the glass interior
        var ang = u * Math.PI * 3.2;
        var rad = gR * 0.6 * (1 - u) * breathe;
        var tx = gx + Math.cos(ang) * rad;
        var ty = gy + Math.sin(ang) * rad;
        var px = DOT.lerp(sx, tx, gather);
        var py = DOT.lerp(sy, ty, gather);
        p.curveVertex(px, py);
        if (s === 0) p.curveVertex(px, py); // anchor first control point
      }
      p.endShape();
      p.pop();

      // ---- the GLASS DOT vessel — drawn over the ribbon so it ENCLOSES --
      DOT.glassDot(p, gx, gy, gR, g.core.value);

      // ---- the OBJECTIVE facts: organize from the spread band into a ring
      // inside the glass. Each carried fact-dot lerps from a slot along the
      // old ribbon band toward an evenly-spaced position on the ring. They
      // are ALIVE blue points (baked light + breath). ---------------------
      var nDots = fd.length;
      for (var i2 = 0; i2 < nDots; i2++) {
        var d = fd[i2];
        DOT.tween(d.alpha, 0.12);
        var a = d.alpha.value;
        if (a <= 0.003) continue;

        // origin: an even slot along the old spread band (the facts' field)
        var uf = nDots > 1 ? i2 / (nDots - 1) : 0.5;
        var ox = (0.6 + 0.26 * uf) * W; // mirrors beat-15 fact field, right
        var oy = (yc - amp * 0.7) + uf * amp * 1.4;

        // organized slot: an even position on a ring inside the glass
        var slot = nDots > 0 ? (d._k / nDots) * Math.PI * 2 - Math.PI / 2 : 0;
        var ringR = gR * 0.78 * breathe;
        var rx = gx + Math.cos(slot) * ringR;
        var ry = gy + Math.sin(slot) * ringR;

        var dx = DOT.lerp(ox, rx, gather);
        var dy = DOT.lerp(oy, ry, gather);

        DOT.aliveDot(p, dx, dy, 5, {
          hex: DOT.palette.accent,
          alpha: a,
          glow: 0.55,
          breath: world.clock,
          phase: (d._k % 7) * 0.9 // each fact breathes on its own phase
        });
      }

      // ---- the CHARACTER, calm + present beside the vessel -------------
      var c = world.character;
      if (c) {
        DOT.tween(c.scale, 0.1);
        DOT.tween(c.glow, 0.1);
        var chTargetX = c.xFrac * W;
        c._drawX = c._drawX == null ? chTargetX : DOT.lerp(c._drawX, chTargetX, 0.12);
        DOT.drawCharacter(p, c._drawX, c.yFrac * H, {
          scale: c.scale.value,
          mood: "calm",
          glow: c.glow.value,
          alpha: Math.min(1, e * 1.5),
          look: 0.4, // soft gaze toward the vessel holding both truths
          breath: world.clock,
          phase: 0.6
        });
      }
    }
  });
})();
