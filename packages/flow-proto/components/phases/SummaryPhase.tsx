'use client';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PillButton, Eyebrow } from '@/components/ui/atoms';
import { SUMMARY } from '@/lib/script';

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 4 (b/c) — the payoff. Three views, in order:
//   (a) at-a-glance OBJECTIVE vs SUBJECTIVE — the two truths side by side, with the
//       `delta` as the NEUTRAL bridge (never a verdict). The validate-first line
//       comes from the CACHED onboarding `reflection` (NOT a re-run).
//   (b) the provider report — SUMMARY.provider_report rendered most-important-first
//       with the safety banner ON TOP. S/O only, never A/P.
//   (c) the timeline — Mon 6/8 → Sat 6/13, "what happened" vs "what was felt".
//
// FROZEN props: { onRestart, reflection }. The split (subjective/objective/delta)
// is read from the cached live `reflection.story`; if the page was reached via the
// jump-nav (reflection null), we fall back to the REAL persisted story from
// GET /api/record — still no invented data, no re-run.
// ─────────────────────────────────────────────────────────────────────────────

const EASE = [0.16, 1, 0.3, 1] as const;
const PR = SUMMARY.provider_report;

// Reflection-ish shape — structural match to the page cache (no @dot/backend dep).
type StorySplit = { subjective: string[]; objective: string[]; delta: string };
type ReflectionLike = {
  feelingValidation?: string;
  story?: StorySplit;
};

// Build the copy-to-share plaintext from the provider report (S/O only).
function reportText(): string {
  return [
    PR.header,
    '',
    PR.safety_banner,
    '',
    `CHIEF CONCERN: ${PR.chief_concern}`,
    '',
    "WHAT'S BEEN HAPPENING",
    `  ${PR.whats_been_happening}`,
    '',
    'OBJECTIVE RECORD',
    ...PR.objective_record.map((l) => `  • ${l}`),
    '',
    'NOTICED / TRIED',
    ...PR.noticed_or_tried.map((l) => `  • ${l}`),
    '',
    'WOULD LIKE TO DISCUSS',
    ...PR.would_like_to_discuss.map((l) => `  • ${l}`),
    '',
    `MOST WORRIED ABOUT: ${PR.most_worried_about}`,
    '',
    PR.mapping_note,
  ].join('\n');
}

export default function SummaryPhase({
  onRestart,
  reflection,
}: {
  onRestart: () => void;
  reflection?: ReflectionLike | null;
}) {
  const [report, setReport] = useState(false);
  const [detailed, setDetailed] = useState(false);
  const [copied, setCopied] = useState(false);

  // The two-truths split: prefer the CACHED live onboarding reflection; fall back to
  // the REAL persisted story (jump-nav safety). Never invented.
  const [split, setSplit] = useState<StorySplit | null>(reflection?.story ?? null);
  const validateLine = reflection?.feelingValidation ?? null;

  useEffect(() => {
    if (split) return; // already have the live split
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/record?userId=demo');
        if (!res.ok) return;
        const data = await res.json();
        const story = data?.stories?.[0];
        if (alive && story?.subjective && story?.objective) {
          setSplit({ subjective: story.subjective, objective: story.objective, delta: story.delta });
        }
      } catch {
        /* the report + timeline still render from the locked script consts */
      }
    })();
    return () => {
      alive = false;
    };
  }, [split]);

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
    <div className="mx-auto flex min-h-[100dvh] max-w-[640px] flex-col px-6 pb-16 pt-20">
      <div className="mb-5 flex items-center gap-3">
        <span className="dot-mark" />
        <Eyebrow>your story · two truths</Eyebrow>
      </div>

      <motion.h1
        className="text-[26px] leading-snug"
        style={{ fontWeight: 450, letterSpacing: '-0.02em' }}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        the one you felt, and the one that happened.
      </motion.h1>

      {/* validate-first beat — from the CACHED live reflection (never re-run) */}
      {validateLine && (
        <motion.p
          className="mt-4 rounded-[14px] bg-blue-tint p-4 text-[15px] leading-relaxed"
          style={{ color: 'var(--blue-ink)' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.1 }}
        >
          {validateLine}
        </motion.p>
      )}

      {/* (a) AT-A-GLANCE — subjective vs objective, delta as the neutral bridge */}
      <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Panel
          title="what you said out loud"
          tone="subjective"
          items={split?.subjective}
          delay={0.15}
        />
        <Panel
          title="what the record shows"
          tone="objective"
          items={split?.objective}
          delay={0.22}
        />
      </div>

      {/* the delta — the neutral bridge, never a verdict */}
      {split?.delta && (
        <motion.div
          className="mt-3 rounded-[14px] bg-raised p-4 shadow-ring"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.3 }}
        >
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-35">
            the gap · not a verdict
          </div>
          <p className="text-[14.5px] leading-relaxed text-ink-70">{split.delta}</p>
        </motion.div>
      )}

      {/* the actions */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <PillButton onClick={() => setReport(true)}>see report →</PillButton>
        <button
          onClick={onRestart}
          className="font-mono text-[12px] lowercase tracking-wide text-ink-35"
        >
          ↺ run it again
        </button>
      </div>

      {/* ── (b)+(c) the shareable provider report + timeline ── */}
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
              className="w-full max-w-[600px] rounded-[20px] bg-page p-7 shadow-ring-lg"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.4, ease: EASE }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* provenance header — states the guardrail plainly */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[17px]" style={{ fontWeight: 480 }}>
                    DOT summary
                  </div>
                  <div className="mt-1 font-mono text-[10.5px] leading-relaxed text-ink-35">
                    {PR.header}
                  </div>
                </div>
                <button
                  onClick={() => setReport(false)}
                  className="shrink-0 font-mono text-[18px] text-ink-35"
                  aria-label="close"
                >
                  ×
                </button>
              </div>

              {/* SAFETY BANNER — most-important-first, on TOP, never buried */}
              <div
                className="mt-4 flex items-start gap-3 rounded-[14px] p-4"
                style={{ background: 'var(--warn-bg)', color: 'var(--warn-text)' }}
              >
                <span aria-hidden className="mt-[1px] text-[15px] leading-none">
                  ⚠
                </span>
                <p className="text-[13px] leading-relaxed">
                  {PR.safety_banner.replace(/^⚠\s*/, '')}
                </p>
              </div>

              {/* chief concern — the patient's voice */}
              <Section title="chief concern">
                <p className="text-[15px] leading-relaxed text-ink-90" style={{ fontWeight: 450 }}>
                  {PR.chief_concern}
                </p>
              </Section>

              {/* what's been happening — the OLDCARTS narrative */}
              <Section title="what's been happening">
                <p className="text-[13.5px] leading-relaxed text-ink-70">{PR.whats_been_happening}</p>
              </Section>

              {/* objective record — the counted facts */}
              <Section title="objective record">
                <ul className="flex flex-col gap-1.5">
                  {PR.objective_record.map((l, i) => (
                    <li key={i} className="flex gap-2.5 text-[13.5px] leading-relaxed text-ink-70">
                      <span style={{ color: 'var(--blue)' }}>·</span>
                      {l}
                    </li>
                  ))}
                </ul>
              </Section>

              {/* noticed / tried */}
              <Section title="noticed · tried">
                <ul className="flex flex-col gap-1.5">
                  {PR.noticed_or_tried.map((l, i) => (
                    <li key={i} className="flex gap-2.5 text-[13.5px] leading-relaxed text-ink-70">
                      <span style={{ color: 'var(--blue)' }}>·</span>
                      {l}
                    </li>
                  ))}
                </ul>
              </Section>

              {/* would like to discuss */}
              <Section title="would like to discuss">
                <ul className="flex flex-col gap-1.5">
                  {PR.would_like_to_discuss.map((l, i) => (
                    <li key={i} className="flex gap-2.5 text-[13.5px] leading-relaxed text-ink-70">
                      <span style={{ color: 'var(--blue)' }}>·</span>
                      {l}
                    </li>
                  ))}
                </ul>
              </Section>

              {/* most worried about */}
              <Section title="most worried about">
                <p
                  className="rounded-[12px] bg-blue-tint p-3.5 text-[13.5px] leading-relaxed"
                  style={{ color: 'var(--blue-ink)' }}
                >
                  {PR.most_worried_about}
                </p>
              </Section>

              {/* (c) see detailed — the Mon→Sat timeline, "what happened" vs "what was felt" */}
              <div className="mt-6">
                <button
                  onClick={() => setDetailed((d) => !d)}
                  className="font-mono text-[12px] lowercase tracking-wide text-ink-50"
                >
                  {detailed ? 'hide timeline ↑' : 'see detailed timeline ↓'}
                </button>
                <AnimatePresence>
                  {detailed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.4, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 flex flex-col gap-2">
                        {SUMMARY.timeline.map((row, i) => (
                          <motion.div
                            key={row.day}
                            className="grid grid-cols-[64px_1fr] gap-3 rounded-[12px] bg-raised p-3 shadow-ring"
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.35, ease: EASE, delay: i * 0.05 }}
                          >
                            <div className="font-mono text-[11px] leading-snug text-ink-50">{row.day}</div>
                            <div>
                              <div className="text-[13px] leading-relaxed text-ink-90">{row.what}</div>
                              <div className="mt-0.5 text-[12px] italic leading-relaxed text-ink-35">
                                felt: {row.felt}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* the guardrail footnote — S/O only, never A/P */}
              <p className="mt-5 font-mono text-[10px] leading-relaxed text-ink-35">{PR.mapping_note}</p>

              <div className="mt-6 flex items-center gap-3">
                <PillButton onClick={copy}>{copied ? 'copied ✓' : 'copy to share'}</PillButton>
                <button
                  onClick={() => setReport(false)}
                  className="font-mono text-[12px] lowercase tracking-wide text-ink-35"
                >
                  done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// One at-a-glance panel — the told version vs the recorded version. Equal weight,
// no winner: subjective is muted ink, objective is blue-inked (the channel that
// carries the record). The delta below is the bridge.
function Panel({
  title,
  tone,
  items,
  delay,
}: {
  title: string;
  tone: 'subjective' | 'objective';
  items?: string[];
  delay: number;
}) {
  const isObjective = tone === 'objective';
  return (
    <motion.div
      className="rounded-[14px] bg-raised p-4 shadow-ring"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE, delay }}
    >
      <div className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-35">{title}</div>
      {items && items.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {items.map((it, i) => (
            <li
              key={i}
              className="flex gap-2 text-[13px] leading-relaxed"
              style={{ color: isObjective ? 'var(--blue-ink)' : 'var(--ink-70)' }}
            >
              <span style={{ color: isObjective ? 'var(--blue)' : 'var(--ink-35)' }}>·</span>
              {it}
            </li>
          ))}
        </ul>
      ) : (
        <p className="font-mono text-[11px] lowercase text-ink-35">captured live in onboarding</p>
      )}
    </motion.div>
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
