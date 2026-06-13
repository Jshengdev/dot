import type { Config } from 'tailwindcss'

// Tailwind for layout + motion utilities; COLOR comes from the locked tokens
// (design/tokens.css via CSS vars) so there is one source of truth and zero drift.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        page: 'var(--page)',
        raised: 'var(--raised)',
        canvas: 'var(--canvas)',
        recessed: 'var(--recessed)',
        blue: 'var(--blue)',
        'blue-tint': 'var(--blue-tint)',
        'blue-ink': 'var(--blue-ink)',
        ink: {
          DEFAULT: 'var(--ink)',
          90: 'var(--ink-90)',
          70: 'var(--ink-70)',
          50: 'var(--ink-50)',
          35: 'var(--ink-35)',
          10: 'var(--ink-10)',
          6: 'var(--ink-6)',
        },
        good: 'var(--good)',
        warn: 'var(--warn)',
        bad: 'var(--bad)',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
        num: ['var(--font-numeral)'],
      },
      fontWeight: {
        light: '340',
        normal: '430',
        medium: '450',
        semibold: '480',
        bold: '520',
      },
      borderRadius: { bubble: '20px' },
      transitionTimingFunction: { signature: 'cubic-bezier(0.16, 1, 0.3, 1)' },
      boxShadow: {
        ring: 'inset 0 0 0 1px rgba(255,255,255,.9), 0 0 0 1px rgba(11,22,32,.06), 0 1px 2px rgba(11,22,32,.04), 0 4px 12px rgba(11,22,32,.05)',
        'ring-lg': 'inset 0 0 0 1px rgba(255,255,255,.9), 0 0 0 1px rgba(11,22,32,.06), 0 8px 30px rgba(11,22,32,.08)',
      },
    },
  },
  plugins: [],
}
export default config
