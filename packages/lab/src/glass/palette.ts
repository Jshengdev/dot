// Clean-blue retint of the reel palette. Same STRUCTURE (studio neutrals +
// one accent that fires on the ACTIVATE beat only), values swapped: dark→white room,
// magenta/amber→trust-blue. Glass stays clear; the accent is the only hue.
export const PALETTE = {
  page: '#eef2f6',      // the cool studio room (canvas bg — NOT pure white, so glass reads)
  backdrop: '#dde4ec',  // the soft backdrop plane behind the glass
  card: '#ffffff',      // a raised UI surface (slider body, toggle track)
  cardText: '#5b6671',  // ink-50-ish on light
  slot: '#e6eaee',      // recessed slot
  slotDeep: '#d7dde4',  // deepest recess
  ink: '#0b1620',       // the one cool ink
  accent: '#007AFF',    // trust-blue — fires on the activate beat (the fill, the ignite)
  accentDeep: '#0069e0',
  accentGlow: '#2a93ff',
}
