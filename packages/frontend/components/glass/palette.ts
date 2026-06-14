// palette.ts — clean-blue retint of the glass-reel palette. Studio neutrals + one
// accent that fires on the ACTIVATE beat only. Glass stays clear; the accent is
// the only hue. Matches design/tokens.css brand-clean-blue (#007AFF).
export const PALETTE = {
  page: '#eef2f6', // the cool studio room (canvas bg — NOT pure white, so glass reads)
  backdrop: '#dde4ec', // the soft backdrop plane behind the glass
  card: '#ffffff', // a raised UI surface
  cardText: '#5b6671', // ink-50-ish on light
  slot: '#e6eaee', // recessed slot
  slotDeep: '#d7dde4', // deepest recess
  ink: '#0b1620', // the one cool ink
  accent: '#007AFF', // trust-blue — fires on the activate beat (the ignite)
  accentDeep: '#0069e0',
  accentGlow: '#2a93ff',
} as const;
