'use client';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import EnterPhase from '@/components/phases/EnterPhase';
import ConversePhase from '@/components/phases/ConversePhase';
import PanelsPhase from '@/components/phases/PanelsPhase';

// ─────────────────────────────────────────────────────────────────────────────
// THE LIVE FLOW. Three phases now, each backed by REAL endpoints (no invented data):
//   enter    — meet DOT (poke + voice), then "tell me your story →"
//   converse — the live conversation: every turn hits POST /api/turn; DOT's reply +
//              her growing read on the story (coverage / missing / risk / graphShape)
//              arrive as rich bubbles. When she's ready she closes via POST /api/close.
//   panels   — the payoff: the graph (GET /api/graph), the two-truths report
//              (GET /api/report), and the forward check-in plan (GET /api/plan +
//              GET /api/scheduler/tick to drive the real timer).
//
// Every demo run is a CLEAN slate: a fresh per-session userId means a fresh
// conversation + graph + report on the server. "run it again" re-rolls the id and
// returns to enter, so the next run never sees the last run's story.
// ─────────────────────────────────────────────────────────────────────────────

export type Phase = 'enter' | 'converse' | 'panels';
const ORDER: Phase[] = ['enter', 'converse', 'panels'];
const EASE = [0.16, 1, 0.3, 1] as const;

// a fresh per-session userId (client-only; Math.random is fine in a 'use client'
// component). Returns 'u-xxxxxxx'.
const freshUserId = () => 'u-' + Math.random().toString(36).slice(2, 9);

// The phase components are widened by their own lanes; bind each to its frozen
// call-site contract so page.tsx is the single source of truth for the props.
type EnterProps = { onNext: () => void };
type ConverseProps = { userId: string; onDone: () => void };
type PanelsProps = { userId: string; onRestart: () => void };

const Enter = EnterPhase as unknown as (p: EnterProps) => JSX.Element;
const Converse = ConversePhase as unknown as (p: ConverseProps) => JSX.Element;
const Panels = PanelsPhase as unknown as (p: PanelsProps) => JSX.Element;

export default function Page() {
  const [phase, setPhase] = useState<Phase>('enter');
  // Per-session userId in state so "run it again" can re-roll it for a clean run.
  const [userId, setUserId] = useState<string>(freshUserId);
  const go = (p: Phase) => setPhase(p);

  // new session: fresh userId (clean conversation + graph on the server) → enter.
  const restart = () => {
    setUserId(freshUserId());
    go('enter');
  };

  return (
    <main className="relative min-h-[100dvh] overflow-hidden">
      {/* phase jump-nav (demo convenience) — now three dots */}
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
          {phase === 'enter' && <Enter onNext={() => go('converse')} />}
          {phase === 'converse' && <Converse userId={userId} onDone={() => go('panels')} />}
          {phase === 'panels' && <Panels userId={userId} onRestart={restart} />}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
