'use client';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PillButton, Eyebrow } from '@/components/ui/atoms';
import { SUMMARY } from '@/lib/script';

const EASE = [0.16, 1, 0.3, 1] as const;
const R = SUMMARY.report;

function reportText() {
  return [
    R.title.toUpperCase(),
    R.window,
    '',
    R.oneLine,
    '',
    'OBJECTIVE LOGS — WHAT HAPPENED',
    ...R.objectiveLogs.map((l) => `  ${l.date} — ${l.note}`),
    '',
    'WHAT THEY TOLD THEMSELVES',
    ...R.subjectiveClaims.map((c) => `  ${c}`),
    '',
    'IMPRESSION',
    `  ${R.impression}`,
    '',
    `SCREEN FOR: ${R.screenFor.join(', ')}`,
    '',
    R.note,
  ].join('\n');
}

export default function SummaryPhase({ onRestart }: { onRestart: () => void }) {
  const [details, setDetails] = useState(false);
  const [report, setReport] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(reportText());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — no-op */
    }
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-[600px] flex-col px-6 pb-16 pt-20">
      {/* the SIMPLEST top: one line + the numbers that matter */}
      <div className="mb-5 flex items-center gap-3">
        <span className="dot-mark" />
        <Eyebrow>your story · the short version</Eyebrow>
      </div>

      <motion.h1
        className="text-[26px] leading-snug"
        style={{ fontWeight: 450, letterSpacing: '-0.02em' }}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        {SUMMARY.headline}
      </motion.h1>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {SUMMARY.stats.map((s, i) => (
          <motion.div
            key={s.metric}
            className="rounded-[14px] bg-raised p-4 shadow-ring"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE, delay: 0.1 + i * 0.07 }}
          >
            <div className="font-num text-[30px] leading-none" style={{ fontWeight: 340, color: 'var(--ink)' }}>{s.value}</div>
            <div className="mt-2 font-mono text-[10px] lowercase leading-tight text-ink-35">{s.metric}<br />{s.unit}</div>
          </motion.div>
        ))}
      </div>

      {/* see more details — inline expand */}
      <div className="mt-5">
        <button onClick={() => setDetails((d) => !d)} className="font-mono text-[12px] lowercase tracking-wide text-ink-50">
          {details ? 'less ↑' : 'see more details ↓'}
        </button>
        <AnimatePresence>
          {details && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="overflow-hidden"
            >
              <p className="mt-4 text-[14.5px] leading-relaxed text-ink-70">{SUMMARY.timeline}</p>
              <ul className="mt-3 flex flex-col gap-2">
                {SUMMARY.detailed.map((d, i) => (
                  <li key={i} className="flex gap-2 text-[13.5px] leading-relaxed text-ink-70">
                    <span style={{ color: 'var(--blue)' }}>·</span>
                    {d}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-9 flex flex-wrap items-center gap-3">
        <PillButton onClick={() => setReport(true)}>generate provider report →</PillButton>
        <button onClick={onRestart} className="font-mono text-[12px] lowercase tracking-wide text-ink-35">↺ run it again</button>
      </div>

      {/* ── the shareable provider report ── */}
      <AnimatePresence>
        {report && (
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8"
            style={{ background: 'rgba(11,22,32,0.32)', backdropFilter: 'blur(6px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setReport(false)}
          >
            <motion.div
              className="w-full max-w-[560px] rounded-[20px] bg-page p-7 shadow-ring-lg"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.4, ease: EASE }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[17px] font-medium">{R.title}</div>
                  <div className="mt-0.5 font-mono text-[11px] lowercase text-ink-35">{R.window}</div>
                </div>
                <button onClick={() => setReport(false)} className="font-mono text-[18px] text-ink-35" aria-label="close">×</button>
              </div>

              <div className="mt-4 rounded-[12px] p-4 text-[14px] leading-relaxed" style={{ background: 'var(--blue-tint)', color: 'var(--blue-ink)' }}>
                {R.oneLine}
              </div>

              <Section title="objective logs · what happened">
                <ul className="flex flex-col gap-2">
                  {R.objectiveLogs.map((l, i) => (
                    <li key={i} className="flex gap-3 text-[13.5px]">
                      <span className="w-[88px] shrink-0 font-mono text-[11px] text-ink-35">{l.date}</span>
                      <span className="text-ink-70">{l.note}</span>
                    </li>
                  ))}
                </ul>
              </Section>

              <Section title="what they told themselves">
                <div className="flex flex-col gap-1.5 text-[14px] italic text-ink-50">
                  {R.subjectiveClaims.map((c, i) => <div key={i}>{c}</div>)}
                </div>
              </Section>

              <Section title="impression">
                <p className="text-[13.5px] leading-relaxed text-ink-70">{R.impression}</p>
              </Section>

              <Section title="screen for">
                <div className="flex flex-wrap gap-2">
                  {R.screenFor.map((s) => (
                    <span key={s} className="rounded-full bg-recessed px-3 py-1 font-mono text-[11px] lowercase text-ink-70">{s}</span>
                  ))}
                </div>
              </Section>

              <p className="mt-4 font-mono text-[10px] leading-relaxed text-ink-35">{R.note}</p>

              <div className="mt-6 flex items-center gap-3">
                <PillButton onClick={copy}>{copied ? 'copied ✓' : 'copy to share'}</PillButton>
                <button onClick={() => setReport(false)} className="font-mono text-[12px] lowercase tracking-wide text-ink-35">done</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-35">{title}</div>
      {children}
    </div>
  );
}
