'use client';
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import GlassDot from '@/components/GlassDotClient';
import { LOG_NODES } from '@/lib/script';

// ─────────────────────────────────────────────────────────────────────────────
// SCENE 4 (a) — "view my story" → connect-the-dots.
//
// The subjective STORY nodes thread together into ONE blue line (the version told
// out loud); the objective FACTS pop off and float free (the record that goes to a
// provider). LOG_NODES (lib/script.ts) is the curated story↔facts content; the
// FACT counts are grounded in the REAL persisted record (GET /api/record — no
// invented data). A "see report →" key calls onNext() into SummaryPhase.
//
// FROZEN props: { onNext, reflection }. `reflection` is the CACHED live onboarding
// result (NOT a re-run) — passed straight through to SummaryPhase via the page.
// ─────────────────────────────────────────────────────────────────────────────

const EASE = [0.16, 1, 0.3, 1] as const;
const CENTER = { x: 50, y: 47 };

// ── open-morph motion (the same "bloom open + staggered settle" as the report) ──
// A clicked node blooms into a panel: the SHAPE morphs in (blur-up + scale), then
// the verbatim rows reveal as it settles, ~55ms apart. Locked design ease, nothing
// bounces, blur-up on content change.
const PANEL_MORPH = {
  hidden: { opacity: 0, y: 18, scale: 0.94, filter: 'blur(8px)' },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.42, ease: EASE, delayChildren: 0.24, staggerChildren: 0.055 },
  },
  exit: { opacity: 0, y: 12, scale: 0.97, filter: 'blur(4px)', transition: { duration: 0.26, ease: EASE } },
} as const;
const ROW_REVEAL = {
  hidden: { opacity: 0, y: 9, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: EASE } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
} as const;

// Reflection-ish shape — structural match to the page's cache (no @dot/backend dep).
type StatAggregate = { kind: string; label: string; count: number; window: string };
type RecordPayload = { stories?: unknown[]; events?: unknown[]; stats?: StatAggregate[] };

// radial positions (%): story on the cardinals (the blue line threads these),
// facts in the corners (these pop off + float). LOG_NODES order is s,s,s,f,f,f,f —
// 3 story + 4 fact. We place story on a left/centre arc, facts on a right/outer arc.
const POS = [
  { x: 25, y: 20 }, // s1 'a very nervous person' — top-left (the threaded story arc)
  { x: 18, y: 49 }, // s2 'chest hurts a bit' — left
  { x: 26, y: 78 }, // s3 the minimized version — bottom-left
  { x: 75, y: 17 }, // f1 panic every day — top-right (the facts that pop free)
  { x: 83, y: 41 }, // f2 chest pain / blurred vision — right-upper
  { x: 81, y: 64 }, // f3 scratching arms — right-lower
  { x: 72, y: 85 }, // f4 exhaustion / 'sleep forever' — bottom-right
];

// the continuous thread through the STORY nodes (indices 0,1,2), top→bottom on the left.
const STORY_PATH = (() => {
  const order = [0, 1, 2];
  return 'M ' + order.map((i) => `${POS[i].x} ${POS[i].y}`).join(' L ');
})();

// FACT index (in LOG_NODES) → the live record stat that grounds its count. The
// floating fact shows "· N this week" pulled from GET /api/record (real), so the
// payoff is the verified pattern, not a label.
const FACT_STAT: Record<string, { kind: string; noun: string }> = {
  f1: { kind: 'panic_attack', noun: 'logged this week' },
  f2: { kind: 'panic_attack', noun: 'with chest pain / blurred vision' },
  f3: { kind: 'self_harm', noun: 'arm-scratching events' },
  f4: { kind: 'ideation', noun: 'ideation signal' },
};

export default function LogsPhase({
  onNext,
  reflection: _reflection, // cached live result — threaded to SummaryPhase by the page; not used here
}: {
  onNext: () => void;
  reflection?: unknown;
}) {
  const [connected, setConnected] = useState(false);
  const [stats, setStats] = useState<StatAggregate[] | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null); // the node read in detail

  // Read the REAL persisted record (pure read, no model call). The fact counts
  // shown when the nodes float free come from here — nothing invented.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/record?userId=demo');
        if (!res.ok) throw new Error(`record ${res.status}`);
        const data: RecordPayload = await res.json();
        if (alive) setStats(data.stats ?? []);
      } catch (e) {
        if (alive) setFailed(e instanceof Error ? e.message : 'record read failed');
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const countFor = (kind: string): number | null => {
    if (!stats) return null;
    const hit = stats.find((s) => s.kind === kind);
    return hit ? hit.count : null;
  };

  // per-fact outward drift direction (px), for the pop-off float
  const drift = useMemo(
    () =>
      POS.map((p) => {
        const dx = p.x - 50;
        const dy = p.y - 50;
        const len = Math.hypot(dx, dy) || 1;
        return { x: (dx / len) * 44, y: (dy / len) * 44, r: (dx / len) * 3 };
      }),
    [],
  );

  // the node opened for a verbatim read + its live count (facts only)
  const openNode = openId ? (LOG_NODES.find((n) => n.id === openId) ?? null) : null;
  const openStat = openNode ? FACT_STAT[openNode.id] : undefined;
  const openCount = openStat ? countFor(openStat.kind) : null;

  return (
    <div className="ugraph">
      <div className="ugraph-bg" />
      <div className="ugraph-veil" />
      <div className="ugraph-logo">
        <span className="m" />
        <span className="n">dot</span>
      </div>

      {/* the continuous line — drawn THROUGH the story nodes (the told version, threaded) */}
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
          animate={{ pathLength: connected ? 1 : 0, opacity: connected ? 0.55 : 0 }}
          transition={{ duration: 1.6, ease: EASE }}
        />
      </svg>

      {/* the unload — the restored glass orb at centre */}
      <div
        style={{
          position: 'absolute',
          left: `${CENTER.x}%`,
          top: `${CENTER.y}%`,
          transform: 'translate(-50%,-50%)',
          width: 180,
          height: 180,
          zIndex: 5,
        }}
      >
        <GlassDot height={180} />
        <div
          style={{ position: 'absolute', left: '50%', bottom: 26, transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}
          className="font-mono text-[11px] lowercase tracking-wide"
        >
          <span style={{ color: 'var(--blue)' }}>your week</span>
        </div>
      </div>

      {/* the thought pills — story stays threaded (left), facts pop off + float (right) */}
      {LOG_NODES.map((n, i) => {
        const isFact = n.kind === 'fact';
        const floated = connected && isFact;
        const stat = FACT_STAT[n.id];
        const count = floated && stat ? countFor(stat.kind) : null;
        return (
          <motion.div
            key={n.id}
            style={{ position: 'absolute', left: `${POS[i].x}%`, top: `${POS[i].y}%`, x: '-50%', y: '-50%', zIndex: 4 }}
            animate={{
              x: floated ? `calc(-50% + ${drift[i].x}px)` : '-50%',
              y: floated ? `calc(-50% + ${drift[i].y}px)` : '-50%',
              scale: floated ? [1, 1.12, 1] : 1,
            }}
            transition={{ duration: 0.7, ease: EASE, delay: floated ? 0.15 + (i - 3) * 0.08 : 0 }}
          >
            <div
              className={`upill upill--tap ${isFact ? 'upill--fact' : ''} ${floated ? 'is-free upill--dim upill-bob' : ''}`}
              style={{ cursor: 'pointer', ...(floated ? ({ '--r': `${drift[i].r}deg` } as React.CSSProperties) : {}) }}
              onClick={(e) => {
                e.stopPropagation();
                setOpenId(n.id);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setOpenId(n.id);
                }
              }}
              aria-label={`read: ${n.label}`}
            >
              {n.label}
              {floated && (
                <span className="ud">
                  {count !== null ? `${count} ${stat?.noun ?? ''}` : 'objective'}
                </span>
              )}
              <span className="upill-open" aria-hidden>
                ↗
              </span>
            </div>
          </motion.div>
        );
      })}

      {/* FAILED state — no silent stub (CONSTRAINTS). The animation still works on
          LOG_NODES; only the live counts are missing, so we say so, loud but calm. */}
      {failed && (
        <div
          className="absolute left-1/2 top-[14px] z-20 -translate-x-1/2 rounded-full px-3 py-1 font-mono text-[10px] lowercase"
          style={{ background: 'var(--warn-bg)', color: 'var(--warn-text)' }}
        >
          record read failed — counts unavailable ({failed})
        </div>
      )}

      {/* proceed key — first press connects the dots; second press → the report */}
      <button
        className="ukey"
        onClick={() => (connected ? onNext() : setConnected(true))}
        aria-label={connected ? 'see report' : 'connect the dots'}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 12h14M13 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div
        className="absolute bottom-[122px] left-1/2 z-10 -translate-x-1/2 text-center font-mono text-[11px] lowercase tracking-wide"
        style={{ color: '#7c89a0' }}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={connected ? 'c' : 'i'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {connected
              ? 'blue thread = what you said · floating = what the record shows · tap any node · see report →'
              : 'connect the dots · or tap any node to read it'}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* a clicked node BLOOMS OPEN to its verbatim source — the journal words (fact)
          vs the minimized version said out loud (story) + the counted record. Same
          open-morph feel as the report. Scrim-click or × closes. */}
      <AnimatePresence>
        {openNode && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center p-5"
            style={{ background: 'rgba(11,22,32,0.34)', backdropFilter: 'blur(7px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpenId(null)}
          >
            <motion.div
              key={openNode.id}
              className="w-full max-w-[440px] rounded-[22px] bg-page p-7 shadow-ring-lg"
              variants={PANEL_MORPH}
              initial="hidden"
              animate="show"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              {/* the tag (which truth) + close */}
              <motion.div variants={ROW_REVEAL} className="flex items-center justify-between gap-4">
                <span
                  className="rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.08em]"
                  style={
                    openNode.kind === 'fact'
                      ? { background: 'var(--blue-tint)', color: 'var(--blue-ink)' }
                      : { background: 'rgba(11,22,32,0.05)', color: 'var(--ink-50)' }
                  }
                >
                  {openNode.kind === 'fact' ? 'what the record shows' : 'what you said out loud'}
                </span>
                <button
                  onClick={() => setOpenId(null)}
                  className="shrink-0 font-mono text-[18px] leading-none text-ink-35"
                  aria-label="close"
                >
                  ×
                </button>
              </motion.div>

              {/* the verbatim — the actual words */}
              <motion.blockquote
                variants={ROW_REVEAL}
                className="mt-4 text-[17px] leading-[26px]"
                style={{ fontWeight: 450, color: openNode.kind === 'fact' ? 'var(--ink-90)' : 'var(--ink-70)' }}
              >
                &ldquo;{openNode.quote}&rdquo;
              </motion.blockquote>

              {/* fact → the counted record + live count; story → what it minimizes */}
              {openNode.kind === 'fact' ? (
                <>
                  {openNode.record && (
                    <motion.div variants={ROW_REVEAL} className="mt-4 rounded-[14px] bg-raised p-4 shadow-ring">
                      <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-35">
                        objective record
                      </div>
                      <p className="text-[13.5px] leading-relaxed text-ink-70">{openNode.record}</p>
                    </motion.div>
                  )}
                  <motion.div variants={ROW_REVEAL} className="mt-3 flex flex-wrap items-center gap-2">
                    {openCount !== null && (
                      <span className="rounded-full bg-blue-tint px-3 py-1.5 font-mono text-[11px] tracking-wide text-blue-ink">
                        {openCount} {openStat?.noun ?? 'logged this week'}
                      </span>
                    )}
                    <span className="font-mono text-[10px] lowercase tracking-wide text-blue-ink">
                      objective · → provider
                    </span>
                  </motion.div>
                </>
              ) : (
                <motion.div variants={ROW_REVEAL} className="mt-4 rounded-[14px] bg-raised p-4 shadow-ring">
                  <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-35">
                    what it leaves out
                  </div>
                  <p className="text-[13.5px] leading-relaxed text-ink-70">{openNode.detail}</p>
                </motion.div>
              )}

              <motion.div variants={ROW_REVEAL} className="mt-5 font-mono text-[10px] lowercase text-ink-35">
                {openNode.kind === 'fact'
                  ? 'the words you actually wrote — counted, not interpreted.'
                  : 'the version told out loud — lighter than the record.'}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
