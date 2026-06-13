/* =====================================================================
 * DOT DECK — the shell  (shared/shell.js)
 * ---------------------------------------------------------------------
 * Boots LAST. Reads window.SCENES (array of scene objects) and drives a
 * single full-window p5 canvas in instance mode.
 *
 * Responsibilities:
 *   - own the persistent `world` object (continuity bus across scenes)
 *   - advance(active scene) with a BLUR-UP develop (~420ms, blur 7px->0)
 *     while shared `world` motifs morph through — content develops like a
 *     photo, NEVER a hard cut.
 *   - feed each scene its `t` (0..1 progress through that beat)
 *   - keyboard + click navigation
 *   - speaker-notes overlay ('n') + faint mono beat counter
 *
 * Scenes never touch p5.createCanvas / windowResized / the loop. They only
 * implement { id, note, draw(p,t,world), onEnter(world), onExit(world) }.
 *
 * THE TRANSITION MODEL (the taste):
 *   Advancing does TWO things at once —
 *   (1) the OUTGOING beat is exited and the INCOMING beat is entered, so
 *       any carried `world` motif keeps its `value` and only its `target`
 *       changes — it glides (tweens) from old to new ACROSS the cut.
 *   (2) the incoming frame is rendered to an off-screen buffer and drawn
 *       back BLURRED, the blur easing 7px -> 0 over ~420ms (the house
 *       ease) — so the whole composition "develops" up to sharp.
 *   Result: shared motifs morph continuously; everything else focuses in.
 * ===================================================================== */
(function () {
  "use strict";

  var SCENES = window.SCENES || [];
  var DOT = window.DOT;

  // ---- Timing -------------------------------------------------------
  // Each beat auto-advances its internal progress `t` from 0->1 over
  // BEAT_MS once entered (so single-movement scenes animate in), then
  // holds at 1 until the presenter advances. Advancing fires a blur-up.
  var BEAT_MS = 2600; // time for t to travel 0 -> 1 within a beat (one earned stat-beat)
  var BLUR_MS = 420; // blur-up develop duration on advance
  var BLUR_MAX = 7; // starting blur radius (px) — "blur(7px)->0"

  // ---- Persistent world (CONTINUITY BUS) ---------------------------
  // Shared, mutable. Scenes read/write/tween named motif objects here so
  // elements CARRY and MORPH across beats. The shell never clears it;
  // scenes manage their own carry-in/carry-out via onEnter/onExit.
  var world = {
    // viewport (kept fresh by the shell every frame)
    w: 0,
    h: 0,
    cx: 0,
    cy: 0,
    // global clock (ms) for ambient motion (breathing, etc.)
    clock: 0,
    // true only during a blur-up develop (scenes may read, e.g. to hush)
    transitioning: false,
    // ---- named shared motifs (the continuity vocabulary) ----
    // Scenes that use a motif read it if present, else seed it in onEnter.
    // See scenes/_contract.md for the full motif registry.
    slider: null, // age/timeline bar {xFrac,yFrac,len{value,target}, leftLabel, rightLabel{text,alpha{}}, leftAlpha{}, ...}
    character: null, // the protagonist dot {xFrac,yFrac,scale{},mood,glow{}, ...}
    glass: null, // brand glass sphere {xFrac,yFrac,r{},core{}}
    peopleDots: null, // crowd field [{x,y,...}]
    storyRibbon: null, // flowing path of a life
    factDots: null // scattered evidence points
  };

  // ---- Shell state --------------------------------------------------
  var idx = 0; // active scene index
  var beatEnterMs = 0; // performance.now() when active beat was entered
  var develop = null; // {start} during a blur-up develop, else null
  var buf = null; // off-screen p5.Graphics for the blur-up

  // ---- DOM refs -----------------------------------------------------
  var counterEl = document.getElementById("counter");
  var notesEl = document.getElementById("notes");
  var notesBody = document.getElementById("notes-body");
  var notesOpen = false;

  // ---- Helpers ------------------------------------------------------
  function now() {
    return performance.now();
  }
  function scene(i) {
    return SCENES[i];
  }
  function beatT(enterMs) {
    var dt = (now() - enterMs) / BEAT_MS;
    return DOT.clamp(dt, 0, 1);
  }

  function enter(i) {
    var s = scene(i);
    if (s && typeof s.onEnter === "function") s.onEnter(world);
    beatEnterMs = now();
  }
  function exit(i) {
    var s = scene(i);
    if (s && typeof s.onExit === "function") s.onExit(world);
  }

  function go(nextIdx) {
    nextIdx = DOT.clamp(Math.round(nextIdx), 0, SCENES.length - 1);
    if (nextIdx === idx) return;
    // exit outgoing, enter incoming: carried motifs keep value, retarget,
    // and glide through the develop. Then kick the blur-up.
    exit(idx);
    idx = nextIdx;
    enter(idx);
    develop = { start: now() };
    updateNotes();
    updateCounter();
  }
  function next() {
    go(idx + 1);
  }
  function prev() {
    go(idx - 1);
  }

  function updateCounter() {
    var n = SCENES.length;
    var a = String(idx + 1).padStart(2, "0");
    var b = String(n).padStart(2, "0");
    counterEl.textContent = a + " / " + b;
  }
  function updateNotes() {
    var s = scene(idx);
    notesBody.textContent = s && s.note ? s.note : "(no note)";
  }
  function toggleNotes() {
    notesOpen = !notesOpen;
    notesEl.classList.toggle("show", notesOpen);
  }

  // ---- p5 instance --------------------------------------------------
  var sketch = function (p) {
    p.setup = function () {
      var c = p.createCanvas(window.innerWidth, window.innerHeight);
      c.parent("stage");
      p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
      p.frameRate(60);
      buf = p.createGraphics(window.innerWidth, window.innerHeight);
      buf.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
      syncViewport(p);
      enter(idx);
      updateNotes();
      updateCounter();
    };

    p.windowResized = function () {
      p.resizeCanvas(window.innerWidth, window.innerHeight);
      if (buf) buf.resizeCanvas(window.innerWidth, window.innerHeight);
      syncViewport(p);
    };

    p.draw = function () {
      world.clock = now();
      syncViewport(p);

      var active = scene(idx);
      var tActive = beatT(beatEnterMs);

      // ---- blur-up develop -----------------------------------------
      if (develop) {
        var k = DOT.clamp((now() - develop.start) / BLUR_MS, 0, 1);
        var e = DOT.ease(k); // house ease — fast out, long settle
        var radius = (1 - e) * BLUR_MAX; // 7px -> 0
        world.transitioning = k < 1;

        // render the (already-morphing) active scene into the buffer
        buf.clear();
        buf.background(DOT.palette.page);
        if (active) active.draw(buf, tActive, world);

        // develop it up to sharp: blur the buffer, then stamp to canvas
        p.background(DOT.palette.page);
        if (radius > 0.15) buf.filter(p.BLUR, radius);
        p.image(buf, 0, 0, world.w, world.h);

        if (k >= 1) {
          develop = null;
          world.transitioning = false;
        }
        return;
      }

      // ---- steady state --------------------------------------------
      p.background(DOT.palette.page);
      if (active) active.draw(p, tActive, world);
    };

    // ---- input ------------------------------------------------------
    p.keyPressed = function () {
      if (p.keyCode === p.RIGHT_ARROW || p.key === " ") {
        next();
        return false;
      }
      if (p.keyCode === p.LEFT_ARROW) {
        prev();
        return false;
      }
      if (p.keyCode === p.HOME) {
        go(0);
        return false;
      }
      if (p.keyCode === p.END) {
        go(SCENES.length - 1);
        return false;
      }
      if (p.key === "n" || p.key === "N") {
        toggleNotes();
        return false;
      }
      if (p.key === "f" || p.key === "F") {
        toggleFullscreen(p);
        return false;
      }
    };

    p.mousePressed = function () {
      // ignore clicks on the notes overlay region
      if (notesOpen && p.mouseY > window.innerHeight - 120) return;
      if (p.mouseX > window.innerWidth / 2) next();
      else prev();
    };
  };

  function syncViewport(p) {
    world.w = p.width;
    world.h = p.height;
    world.cx = p.width / 2;
    world.cy = p.height / 2;
  }

  function toggleFullscreen(p) {
    var fs = p.fullscreen();
    p.fullscreen(!fs);
  }

  // ---- boot ---------------------------------------------------------
  if (!SCENES.length) {
    // No scenes registered — fail loudly, never silently blank.
    var stage = document.getElementById("stage");
    if (stage) {
      stage.style.display = "flex";
      stage.style.alignItems = "center";
      stage.style.justifyContent = "center";
      stage.innerHTML =
        '<div style="font-family:IBM Plex Mono,monospace;color:#fc7981;font-size:14px;">' +
        "window.SCENES is empty — no scene files loaded.</div>";
    }
    return;
  }
  // expose for debugging / external control
  window.DOT_SHELL = { go: go, next: next, prev: prev, world: world };
  // eslint-disable-next-line no-new
  new p5(sketch);
})();
