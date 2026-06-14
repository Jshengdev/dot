'use client';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import EnterPhase from '@/components/phases/EnterPhase';
import PracticePhase from '@/components/phases/PracticePhase';
import CheckinsPhase from '@/components/phases/CheckinsPhase';
import LogsPhase from '@/components/phases/LogsPhase';
import SummaryPhase from '@/components/phases/SummaryPhase';

export type Phase = 'enter' | 'practice' | 'checkins' | 'logs' | 'summary';
const ORDER: Phase[] = ['enter', 'practice', 'checkins', 'logs', 'summary'];
const EASE = [0.16, 1, 0.3, 1] as const;

// ── The shared reflection cache (the live onboarding result) ──────────────────
// "Halfsies + §1.5 #3": `feeling_validation` is NOT persisted on the Story, so
// Scene 4 cannot rebuild the full reflection from the store without a second Grok
// call. Instead, Scene 2's live onboarding /api/turn returns the full reflection;
// PracticePhase hands it up via onReflection(), the page caches it here, and
// LogsPhase + SummaryPhase read the validate-first beat from this cache. Everything
// else in Scene 4 (provider report, at-a-glance O/S, timeline) comes from
// GET /api/record — no re-run, no schema change.
//
// Reflection-ish shape — mirrors @dot/backend's Reflection (run.ts). Defined inline
// (not imported) because flow-proto does not depend on @dot/backend at the type
// level yet; the route boundary is JSON, so a structural match is all we need.
export type StatAggregate = { kind: string; label: string; count: number; window: string };
export type ReportSO = {
  header: string;
  preparedFor: string;
  date: string;
  subjective: string[];
  objective: string[];
};
export type Story = {
  id: string;
  userId: string;
  transcript: string;
  subjective: string[];
  objective: string[];
  delta: string;
  timeline?: string[];
  createdAt: string;
};
export type Reflection = {
  story: Story;
  feelingValidation: string;
  stats: StatAggregate[];
  report: ReportSO;
  model: string;
  // /api/turn also surfaces these (POST /api/turn → { reply, story, feelingValidation, stats, report, risk })
  reply?: string;
  risk?: boolean;
};

// Phase-prop contracts (the call-site shapes the scene lanes build their phase
// components to). Declared here so page.tsx typechecks against the FROZEN contract
// regardless of how far each phase component has been widened.
type EnterProps = { onNext: () => void };
type PracticeProps = { onNext: () => void; onReflection: (r: Reflection) => void };
type CheckinsProps = { onNext: () => void };
type LogsProps = { onNext: () => void; reflection: Reflection | null };
type SummaryProps = { onRestart: () => void; reflection: Reflection | null };

// The phase components are widened by their own lanes; bind each to its frozen
// call-site contract so page.tsx is the single source of truth for the props.
const Enter = EnterPhase as unknown as (p: EnterProps) => JSX.Element;
const Practice = PracticePhase as unknown as (p: PracticeProps) => JSX.Element;
const Checkins = CheckinsPhase as unknown as (p: CheckinsProps) => JSX.Element;
const Logs = LogsPhase as unknown as (p: LogsProps) => JSX.Element;
const Summary = SummaryPhase as unknown as (p: SummaryProps) => JSX.Element;

export default function Page() {
  const [phase, setPhase] = useState<Phase>('enter');
  // The cached LIVE onboarding reflection (set by PracticePhase via onReflection).
  const [reflection, setReflection] = useState<Reflection | null>(null);
  const go = (p: Phase) => setPhase(p);

  return (
    <main className="relative min-h-[100dvh] overflow-hidden">
      {/* phase jump-nav (demo convenience) */}
      <nav className="fixed right-5 top-5 z-50 flex items-center gap-2">
        {ORDER.map((p, i) => (
          <button
            key={p}
            onClick={() => go(p)}
            aria-label={p}
            title={p}
            className="grid place-items-center"
            style={{ width: 18, height: 18 }}
          >
            <span
              style={{
                width: phase === p ? 9 : 6,
                height: phase === p ? 9 : 6,
                borderRadius: 999,
                background: phase === p ? 'var(--blue)' : 'var(--ink-10)',
                transition: 'all .2s var(--ease)',
              }}
            />
            <span className="sr-only">{i}</span>
          </button>
        ))}
      </nav>

      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="min-h-[100dvh]"
        >
          {phase === 'enter' && <Enter onNext={() => go('practice')} />}
          {phase === 'practice' && (
            <Practice onNext={() => go('checkins')} onReflection={setReflection} />
          )}
          {phase === 'checkins' && <Checkins onNext={() => go('logs')} />}
          {phase === 'logs' && <Logs onNext={() => go('summary')} reflection={reflection} />}
          {phase === 'summary' && <Summary onRestart={() => go('enter')} reflection={reflection} />}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
