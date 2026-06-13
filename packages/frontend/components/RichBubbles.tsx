'use client';
import { useInView, useCountUp } from '../lib/hooks';

// RichBubbles — the rich-bubble family (design/05-NEW-BRAND §3). Each turn is the
// RIGHT SHAPE: a sentence is a bubble; a number is a stat bubble; an object is a
// card-in-bubble; choices are chips. Never a paragraph where a shape will do. Every
// bubble maps to a REAL Story/Event/Reflection field — no invented data.
//
// The bubbles reveal with blur-up as they scroll in (design/02-MOTION); the stat
// numeral counts up ONCE (the one earned whimsy). Depth is light, never lines.

// ── TextBubble — one sentence (DOT speaks blue-right; user speaks grey-left) ───
export function TextBubble({
  sender,
  children,
  tail = true,
}: {
  sender: 'ai' | 'user';
  children: React.ReactNode;
  tail?: boolean;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className={`bubble bubble--${sender}${tail ? ' is-last' : ''} reveal${inView ? ' in' : ''}`}>
      {children}
    </div>
  );
}

// ── StatBubble — one number that matters (the count-up beat) ───────────────────
// value counts up once over 2600ms when it scrolls in; label is mono, lowercase.
export function StatBubble({
  value,
  label,
  unit,
}: {
  value: number;
  label: string;
  unit?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const n = useCountUp(value, inView);
  return (
    <div ref={ref} className={`bubble bubble--ai stat-bubble reveal${inView ? ' in' : ''}`}>
      <span className="stat-num">
        {n}
        {unit ? <span className="stat-unit">{unit}</span> : null}
      </span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

// ── CardBubble — a structured object (title + mono key/value rows) ─────────────
export function CardBubble({
  title,
  rows,
  accent = false,
}: {
  title: string;
  rows: { k: string; v: string }[];
  accent?: boolean;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className={`bubble bubble--ai card-bubble reveal${inView ? ' in' : ''}`}>
      <div className={`ring-card card-inner${accent ? ' card-inner--accent' : ''}`}>
        <div className="card-title">{title}</div>
        <div className="card-rows">
          {rows.map((r, i) => (
            <div className="card-row" key={i}>
              <span className="card-k">{r.k}</span>
              <span className="card-v">{r.v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── ChipRow — a horizontal row of facts/claims as pills (subjective/objective) ─
export function ChipRow({
  chips,
  tone = 'neutral',
}: {
  chips: string[];
  tone?: 'felt' | 'fact' | 'neutral';
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className={`chip-row chip-row--${tone} reveal${inView ? ' in' : ''}`}>
      {chips.map((c, i) => (
        <span className={`chip chip--${tone}`} key={i} style={{ transitionDelay: `${i * 70}ms` }}>
          {c}
        </span>
      ))}
    </div>
  );
}

// ── DeltaBubble — THE catch line (the demo moment; the loudest bubble) ─────────
export function DeltaBubble({ children }: { children: React.ReactNode }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className={`bubble bubble--ai is-last delta-bubble reveal${inView ? ' in' : ''}`}>
      {children}
    </div>
  );
}
