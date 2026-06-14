/* =====================================================================
 * DOT DECK — the headliner words  (captions.js)
 * ---------------------------------------------------------------------
 * Loaded AFTER the scenes, BEFORE the shell. Maps each scene `id` to a
 * SHORT on-screen anchor (2–4 words) — you SPEAK the full idea live; the
 * screen just holds the header so it never competes with your narration.
 *
 * EDIT THE WORDS HERE. One file, no scene code touched.
 *   text : the short header ("\n" = a line break)
 *   pos  : "bottom" (default) | "top" | "center"
 *   size : "lg" for the hero beats, omit for normal
 *
 * The TIGHT CUT (~half) is what's loaded in index.html. Captions for the
 * parked scenes stay here so re-adding a scene keeps its word. "close"
 * is omitted — that scene draws its own quiet wordmark.
 * ===================================================================== */
window.CAPTIONS = {
  // ---- THE LIVE CUT (loaded) -------------------------------------------
  "cold-call":   { text: "i cold-called strangers" },
  "afraid":      { text: "they were all afraid" },
  "normal":      { text: "to feel normal again", size: "lg" },
  "everywhere":  { text: "then — everywhere" },
  "two-truths":  { text: "two truths", size: "lg" },
  "chatgpt":     { text: "so you turn to AI" },
  "youre-right": { text: "it just agrees with you" },
  "dot-appears": { text: "so i built DOT", size: "lg" },
  "both-truths": { text: "it holds both" },
  "checkins":    { text: "it checks in, over time" },
  "to-a-human":  { text: "a bridge — not a replacement", size: "lg" },

  // ---- PARKED (not loaded; words kept for if you re-add the scene) ------
  "age-20":           { text: "as young as 20" },
  "age-50":           { text: "as old as 50" },
  "expected":         { text: "i expected the obvious" },
  "a-story":          { text: "a story, unheard" },
  "unexplained":      { text: "symptoms with no name" },
  "mask":             { text: "looking normal enough" },
  "story-matters":    { text: "your story matters" },
  "happened-matters": { text: "what happened matters too" },
  "courage":          { text: "you find the courage" },
  "mislabeled":       { text: "afraid to be mislabeled" },
  "own-it":           { text: "something you own" },
  "for-who":          { text: "for anyone unheard" },
  "right-one":        { text: "you belong here" }
};
