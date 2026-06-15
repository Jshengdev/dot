// ─────────────────────────────────────────────────────────────────────────────
// UI COPY — DOT's voice for the Enter scene (the poke intro / greeting).
//
// This is EDITABLE COPY, not story data: it's the words DOT says while she wakes
// up and introduces herself, before any real conversation begins. Johnny tunes
// the words; the phase components never change. The live flow (Enter → Converse →
// Panels) runs every user turn through the LIVE pipeline — there is no scripted
// story here.
// ─────────────────────────────────────────────────────────────────────────────

// ── The poke intro. DOT's blurbs (Johnny's voice — 🔒 LOCKED order). ─
// `pokes` play SEQUENTIALLY on the first pokes (she wakes → greets → the idea →
// the invite). After those, `pokesFun` rotate on further pokes. `hi` is her first
// word; `beginPrompt` is the begin / tell-me-your-story affordance.
export const DOT = {
  hi: 'hi, this is dot.',

  // sequential, in order — wakes up, greets, the two-truths idea, the invite
  pokes: [
    'okay okayyy. im awake now.', // 1 — wakes on first poke
    'say. hello. im dot.', // 2 — who she is
    "i turn your story into something a doctor can actually understand.", // 3 — what she does
    "there are always two truths. the one you feel, and the one that happened.", // 4 — the idea
    "and the report? it's yours. tell it how you feel.", // 5 — you own it / the invite
  ],

  // rotate after the sequential set — short, one idea each
  pokesFun: [
    'no white coats. no waiting room.',
    "i'll never tell you you're fine.",
    'messy is okay. just talk.',
    'tell it how you feel. the report stays yours.',
  ],

  // the begin / tell-me-your-story affordance
  beginPrompt: 'tell it how you feel.',
};
