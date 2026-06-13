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

export default function Page() {
  const [phase, setPhase] = useState<Phase>('enter');
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
          {phase === 'enter' && <EnterPhase onNext={() => go('practice')} />}
          {phase === 'practice' && <PracticePhase onNext={() => go('checkins')} />}
          {phase === 'checkins' && <CheckinsPhase onNext={() => go('logs')} />}
          {phase === 'logs' && <LogsPhase onNext={() => go('summary')} />}
          {phase === 'summary' && <SummaryPhase onRestart={() => go('enter')} />}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
