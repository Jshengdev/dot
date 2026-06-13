/* =====================================================================
 * BEAT 07 — "Afraid"  (scenes/07-afraid.js)
 * ---------------------------------------------------------------------
 * Spoken: "But they were all afraid. And they all wanted the same thing."
 *
 * CARRY-IN: world.peopleDots — the SAME crowd field of strangers seeded
 *   back in beat 03 (cold-call). They are not re-created; we read each
 *   dot's rest position (whatever shape it carries — polar {ang,rFrac},
 *   fractional {xFrac,yFrac}, or home {hxFrac,hyFrac}) ONCE and remember
 *   it as a stable fractional anchor, then morph from there.
 *
 * THE ONE GESTURE: the crowd CONTRACTS inward toward its own centroid and
 *   TREMBLES — a single held breath of fear — its ink drifting toward
 *   warm-red. Same people, drawn tight, leaning at one shared point.
 *
 * Movements (budget = 2):
 *   1. CONTRACT — each dot eases from its rest anchor toward the centroid
 *      by the shared `world.crowdFear` handle (0 = spread, ~0.42 = held in).
 *   2. TREMBLE — a fine, fear-coupled jitter (ambient, off world.clock) so
 *      the field shivers rather than slides; ink → warm-red as fear rises.
 *
 * Dots go through DOT.aliveDot (baked light + breath) per the law; the
 * warm-red tint carries the "caution / fear" meaning.
 *
 * CARRY-OUT: world.peopleDots left in world (contracted) + the crowdFear
 *   handle, for the next beat to inherit and move.
 * ===================================================================== */
(function () {
  "use strict";
  var DOT = window.DOT;

  window.SCENES.push({
    id: "afraid",
    note:
      "But they were all afraid. And they all wanted the same thing. The " +
      "crowd pulls in on itself — a held breath. Same people, drawn tight, " +
      "trembling, leaning toward one warm point. Fear, shared.",

    onEnter: function (world) {
      // INHERIT the carried-in crowd. If missing (deep-link), seed a calm
      // scattered field so we never blank out.
      var pd = world.peopleDots;
      if (!pd || !pd.length) {
        pd = world.peopleDots = seedCrowd();
      }

      // Record each dot's REST (spread) anchor ONCE as a stable fractional
      // point, resolved from whatever shape this dot carried in (polar from
      // beat 03, or fractional/home from elsewhere). Measured against the
      // centroid so contraction is consistent even if revisited or resized.
      var sumX = 0, sumY = 0;
      for (var i = 0; i < pd.length; i++) {
        var d = pd[i];
        if (d.restXFrac == null || d.restYFrac == null) {
          var rf = restFracOf(d);
          d.restXFrac = rf.x;
          d.restYFrac = rf.y;
        }
        sumX += d.restXFrac;
        sumY += d.restYFrac;
      }
      var n = pd.length || 1;
      world.crowdCenterXFrac = sumX / n;
      world.crowdCenterYFrac = sumY / n;

      // The fear handle: one tweenable that drives BOTH movements.
      if (!world.crowdFear) world.crowdFear = { value: 0, target: 0 };
      world.crowdFear.target = 0.42; // pull in + tremble + warm tint
    },

    onExit: function (world) {
      // Carry out the (contracted) crowd + crowdFear handle so a later beat
      // can keep, release, or move these same strangers. Rest anchors stay
      // private on the dots.
    },

    draw: function (p, t, world) {
      var pd = world.peopleDots;
      var W = world.w;
      var H = world.h;
      var e = DOT.ease(t);
      var clock = world.clock || 0;

      if (!pd || !pd.length) return; // degrade silently if truly empty

      // Drive the single fear handle; couple its rate to the beat so the
      // contraction reads as one deliberate inhale, then holds when settled.
      var rate = DOT.lerp(0.05, 0.16, e);
      DOT.tween(world.crowdFear, rate);
      var fear = world.crowdFear.value;     // 0..0.42
      var fearN = DOT.clamp(fear / 0.42, 0, 1); // normalized 0..1

      // centroid in px — the one warm point they all lean toward.
      var ccx = world.crowdCenterXFrac * W;
      var ccy = world.crowdCenterYFrac * H;

      // tremble amplitude (px) — a held breath, strongest at full fear.
      var trAmp = 3.4 * fearN;

      for (var i = 0; i < pd.length; i++) {
        var d = pd[i];

        // rest (spread) position in px
        var rx = d.restXFrac * W;
        var ry = d.restYFrac * H;

        // MOVEMENT 1 — contract toward the centroid by `fear`.
        var x = DOT.lerp(rx, ccx, fear);
        var y = DOT.lerp(ry, ccy, fear);

        // MOVEMENT 2 — tremble: fine per-dot jitter, phase-offset so the
        // field shivers rather than slides. Ambient (off world.clock).
        var ph = (d.phase != null ? d.phase : i * 1.7);
        x += Math.sin(clock * 0.013 + ph) * trAmp;
        y += Math.cos(clock * 0.011 + ph * 1.3) * trAmp;

        // ink at rest, drifting toward warm-red (fear) as the crowd pulls in.
        var hex = fearN > 0.5 ? DOT.palette.warmRed : DOT.palette.ink;
        var r = d.r != null ? d.r : 7;
        DOT.aliveDot(p, x, y, r * 0.5, {
          hex: hex,
          alpha: 0.62 * Math.min(1, e * 1.4),
          glow: 0.3 + 0.3 * fearN, // underglow warms as it draws in
          breath: clock,
          phase: ph
        });
      }
    }
  });

  // Resolve a dot's rest position as a fractional anchor from whatever
  // shape it carried in. Polar dots (beat 03: {ang, rFrac}) are placed
  // around frame-center; fractional/home dots use their own anchors.
  function restFracOf(d) {
    if (d.dxFrac != null && d.dyFrac != null) {
      // beat-03 cold-call scatter: fractional OFFSETS from the character
      // anchor (which sat at canvas center 0.5,0.5). Resolve to an absolute
      // fractional point so the crowd contracts from its real spread.
      return {
        x: DOT.clamp(0.5 + d.dxFrac, 0.04, 0.96),
        y: DOT.clamp(0.5 + d.dyFrac, 0.04, 0.96)
      };
    }
    if (d.ang != null && d.rFrac != null) {
      // polar scatter, placed around the canvas center (0.5,0.5)
      // using min-dimension radius; approximate to a 16:9 frame so the
      // fractional anchor is stable and sensible across resizes.
      var aspect = 9 / 16; // unit = min(w,h) ≈ h; x uses h/w to keep ratio
      return {
        x: DOT.clamp(0.5 + Math.cos(d.ang) * d.rFrac * aspect, 0.04, 0.96),
        y: DOT.clamp(0.5 + Math.sin(d.ang) * d.rFrac, 0.04, 0.96)
      };
    }
    if (d.xFrac != null && d.yFrac != null) return { x: d.xFrac, y: d.yFrac };
    if (d.hxFrac != null && d.hyFrac != null) return { x: d.hxFrac, y: d.hyFrac };
    return { x: 0.5, y: 0.5 };
  }

  // Fallback crowd: a soft scattered field, used only on deep-link.
  function seedCrowd() {
    var dots = [];
    var cols = 7, rows = 5;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var jx = Math.sin((r * 13 + c * 7) * 1.1) * 0.5;
        var jy = Math.cos((r * 5 + c * 11) * 1.3) * 0.5;
        dots.push({
          xFrac: 0.30 + (c / (cols - 1)) * 0.40 + jx * 0.018,
          yFrac: 0.30 + (r / (rows - 1)) * 0.40 + jy * 0.018,
          r: 7,
          phase: (r * cols + c) * 1.7
        });
      }
    }
    return dots;
  }
})();
