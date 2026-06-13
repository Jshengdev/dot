'use client';
import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import GlassDot from '@/components/GlassDotClient';
import { LOG_NODES } from '@/lib/script';

const EASE = [0.16, 1, 0.3, 1] as const;
const CENTER = { x: 50, y: 47 };

// radial positions (%): story on the cardinals (the continuous line threads these),
// facts in the corners (these pop off + float). LOG_NODES order is s,f,s,f,s,f,s,f.
const POS = [
  { x: 50, y: 20 }, // s1 no one would notice — top
  { x: 74, y: 27 }, // f1 50 texts — top-right
  { x: 78, y: 47 }, // s2 everyone's pulling — right
  { x: 74, y: 68 }, // f2 21 panic — bottom-right
  { x: 50, y: 75 }, // s3 i'm a burden — bottom
  { x: 26, y: 68 }, // f3 3 episodes — bottom-left
  { x: 22, y: 47 }, // s4 i'm fine — left
  { x: 26, y: 27 }, // f4 sister called — top-left
];

// the continuous thread through the story nodes, clockwise from top
const STORY_PATH = (() => {
  const order = [0, 2, 4, 6]; // s1 top → s2 right → s3 bottom → s4 left
  return 'M ' + order.map((i) => `${POS[i].x} ${POS[i].y}`).join(' L ');
})();

export default function LogsPhase({ onNext }: { onNext: () => void }) {
  const [connected, setConnected] = useState(false);

  // per-fact outward drift direction (px), for the pop-off float
  const drift = useMemo(
    () =>
      POS.map((p) => {
        const dx = p.x - 50;
        const dy = p.y - 50;
        const len = Math.hypot(dx, dy) || 1;
        return { x: (dx / len) * 58, y: (dy / len) * 58, r: (dx / len) * 4 };
      }),
    [],
  );

  return (
    <div className="ugraph">
      <div className="ugraph-bg" />
      <div className="ugraph-veil" />
      <div className="ugraph-logo">
        <span className="m" />
        <span className="n">dot</span>
      </div>

      {/* the continuous line — drawn THROUGH the story nodes, establishing the thread */}
      <svg className="ugraph-lines" viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%">
        <motion.path
          d={STORY_PATH}
          fill="none"
          stroke="var(--blue)"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: connected ? 1 : 0, opacity: connected ? 0.5 : 0 }}
          transition={{ duration: 1.8, ease: EASE }}
        />
      </svg>

      {/* the unload — the restored glass orb at centre */}
      <div style={{ position: 'absolute', left: `${CENTER.x}%`, top: `${CENTER.y}%`, transform: 'translate(-50%,-50%)', width: 190, height: 190, zIndex: 5 }}>
        <GlassDot height={190} />
        <div style={{ position: 'absolute', left: '50%', bottom: 30, transform: 'translateX(-50%)', whiteSpace: 'nowrap' }} className="font-mono text-[11px] lowercase tracking-wide">
          <span style={{ color: 'var(--blue)' }}>the unload</span>
        </div>
      </div>

      {/* the thought pills — story stays threaded, facts pop off + float */}
      {LOG_NODES.map((n, i) => {
        const isFact = n.kind === 'fact';
        const floated = connected && isFact;
        return (
          <motion.div
            key={n.id}
            style={{ position: 'absolute', left: `${POS[i].x}%`, top: `${POS[i].y}%`, x: '-50%', y: '-50%', zIndex: 4 }}
            animate={{
              x: floated ? `calc(-50% + ${drift[i].x}px)` : '-50%',
              y: floated ? `calc(-50% + ${drift[i].y}px)` : '-50%',
              scale: floated ? [1, 1.13, 1] : 1,
            }}
            transition={{ duration: 0.7, ease: EASE, delay: floated ? 0.2 : 0 }}
          >
            <div
              className={`upill ${isFact ? 'upill--fact' : ''} ${floated ? 'is-free upill--dim upill-bob' : ''}`}
              style={floated ? ({ '--r': `${drift[i].r}deg` } as React.CSSProperties) : undefined}
            >
              {n.label}
              {floated && <span className="ud">objective</span>}
            </div>
          </motion.div>
        );
      })}

      {/* proceed key */}
      <button className="ukey" onClick={() => (connected ? onNext() : setConnected(true))} aria-label={connected ? 'complete' : 'connect the dots'}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className="absolute bottom-[122px] left-1/2 z-10 -translate-x-1/2 text-center font-mono text-[11px] lowercase tracking-wide" style={{ color: '#7c89a0' }}>
        <AnimatePresence mode="wait">
          <motion.span key={connected ? 'c' : 'i'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            {connected ? 'the blue thread is your story · the floating ones are what’s true' : 'connect the dots'}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}
