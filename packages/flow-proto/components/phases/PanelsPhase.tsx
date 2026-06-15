'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PillButton, Eyebrow } from '@/components/ui/atoms';

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 3 — THE PAYOFF. The conversation is over; now the story DOT built shows
// itself back. Every panel renders from the LIVE knowledge graph the intake
// assembled turn-by-turn (GET /api/graph + /api/report + /api/plan) — no invented
// data. Nothing is a paragraph where a card/stat/chip will do.
//
//   SYMPTOMS    — symptom nodes, sized by salience (loud → quiet).
//   TIMELINE    — event / timeframe nodes, ordered cards.
//   TWO TRUTHS  — the centerpiece: what they FELT (subjective) beside what the
//                 record SHOWS (objective), with the gap as the neutral bridge.
//   RISK        — only if present: the calm 988 care card (never alarming red).
//   PLAN        — "what dot is watching": each scheduled check-in as a row with a
//                 status pill. The page POLLS /api/scheduler/tick every ~12s, then
//                 re-reads graph+report+plan, so when a check-in FIRES the panels
//                 visibly update (the "it keeps updating" moment).
//
// Each node/card BLOOMS OPEN (the LogsPhase open-morph) to its summary + a "from
// the conversation" note (evidenceTurnIds count). The "connect the dots → see the
// report" key reveals the full LiveReport (mirrors SummaryPhase's report modal:
// header guardrail, the two columns, the gap, the 988 on top if risk — S/O only).
//
// FROZEN props: { userId, onRestart }. No silent stubs: a failed fetch shows a
// visible FAILED chip; an empty graph shows a calm empty state, never fake content.
// ─────────────────────────────────────────────────────────────────────────────

const EASE = [0.16, 1, 0.3, 1] as const;
const POLL_MS = 12_000;

// ── open-morph motion (the ported "bloom open + staggered settle") ───────────
// The panel is the SHAPE: it morphs in (blur-up), then rows reveal ~55ms apart as
// it settles. Locked design ease, nothing bounces, blur-up on content change.
const PANEL_MORPH = {
  hidden: { opacity: 0, y: 20, scale: 0.96, filter: 'blur(8px)' },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.45, ease: EASE, delayChildren: 0.26, staggerChildren: 0.05 },
  },
  exit: { opacity: 0, y: 14, scale: 0.98, filter: 'blur(4px)', transition: { duration: 0.3, ease: EASE } },
} as const;
const ROW_REVEAL = {
  hidden: { opacity: 0, y: 10, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.42, ease: EASE } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
} as const;
// a whole panel section blooms + cascades its rows (same family, lighter)
const SECTION = {
  hidden: { opacity: 0, y: 16, filter: 'blur(6px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease: EASE, staggerChildren: 0.055 },
  },
} as const;

// ── structural types (flow-proto talks JSON; mirrors @dot/backend) ───────────
type NodeType =
  | 'turn' | 'person' | 'symptom' | 'event' | 'timeframe'
  | 'claim_subjective' | 'fact_objective' | 'trigger' | 'coping' | 'risk_signal';
type Salience = 'low' | 'med' | 'high';
type PanelKey = 'symptoms' | 'timeline' | 'two-truths' | 'risk' | 'context';

type GraphNode = {
  id: string;
  type: NodeType;
  name: string;
  summary: string;
  tags: string[];
  salience: Salience;
  panel: PanelKey;
  evidenceTurnIds: string[];
};
type GraphEdge = {
  source: string;
  target: string;
  type: 'minimizes' | 'contradicts' | 'experiences' | 'caused_by' | 'occurred_on' | 'escalates' | 'relieves' | 'co_occurs' | 'said_in';
  direction: 'forward' | 'bidirectional';
  weight: number;
  evidenceTurnIds: string[];
};
type Graph = { nodes: GraphNode[]; edges: GraphEdge[] };
type ConversationMeta = { status: string; turnCount: number; [k: string]: unknown } | null;

type ReportCard = {
  id: string;
  name: string;
  summary: string;
  salience: Salience;
  evidenceTurnIds: string[];
};
type LiveReport = {
  header: string;
  preparedFor: string;
  date: string;
  subjective: string[];
  objective: string[];
  gap: string[];
  risk: string[];
  symptoms: ReportCard[];
  timeline: ReportCard[];
};

type CheckIn = {
  id: string;
  userId: string;
  prompt: string;
  watching: string;
  reason: string;
  scheduledFor: string; // ISO
  status: 'pending' | 'sent' | 'done' | 'skipped';
  createdAt: string;
  sentAt?: string;
};

// the thing a clicked card opens to — unified so symptoms/timeline/two-truths all
// bloom the same panel. `kind` tints the tag (objective = blue channel).
type Detail = {
  label: string;
  summary: string;
  evidenceCount: number;
  tagText: string;
  kind: 'subjective' | 'objective' | 'symptom' | 'event';
};

const SALIENCE_RANK: Record<Salience, number> = { low: 0, med: 1, high: 2 };

// "from the conversation" note from the evidence count — never invented, just counted.
function evidenceNote(n: number): string {
  if (n <= 0) return 'surfaced across the conversation';
  return `from ${n} ${n === 1 ? 'moment' : 'moments'} in the conversation`;
}

// scheduledFor → a calm relative string off the live wall clock.
function relTime(iso: string, now: number): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '';
  const diff = t - now;
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60_000);
  const hrs = Math.round(abs / 3_600_000);
  const days = Math.round(abs / 86_400_000);
  let span: string;
  if (mins < 1) span = 'now';
  else if (mins < 60) span = `${mins} min`;
  else if (hrs < 24) span = `${hrs} hr`;
  else span = `${days} ${days === 1 ? 'day' : 'days'}`;
  if (span === 'now') return 'due now';
  return diff >= 0 ? `in ${span}` : `${span} ago`;
}

// the copy-to-share plaintext (S/O only — never assessment/plan).
function reportText(r: LiveReport): string {
  const lines: string[] = [r.header, '', `PREPARED FOR: ${r.preparedFor}`, `DATE: ${r.date}`, ''];
  if (r.risk.length) {
    lines.push('SAFETY', ...r.risk.map((l) => `  • ${l}`), '');
  }
  lines.push('SUBJECTIVE — what they felt', ...r.subjective.map((l) => `  • ${l}`), '');
  lines.push('OBJECTIVE — what the record shows', ...r.objective.map((l) => `  • ${l}`), '');
  if (r.gap.length) {
    lines.push('', 'THE GAP — a noticing, not a verdict', ...r.gap.map((l) => `  • ${l}`));
  }
  return lines.join('\n');
}

export default function PanelsPhase({ userId, onRestart }: { userId: string; onRestart: () => void }) {
  const [graph, setGraph] = useState<Graph | null>(null);
  const [conversation, setConversation] = useState<ConversationMeta>(null);
  const [report, setReport] = useState<LiveReport | null>(null);
  const [plan, setPlan] = useState<CheckIn[] | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [detail, setDetail] = useState<Detail | null>(null); // a clicked card, bloomed open
  const [showReport, setShowReport] = useState(false); // the full LiveReport modal
  const [copied, setCopied] = useState(false);

  // track which check-in ids were already 'sent' so we can PULSE the ones that
  // flip on a poll (the live timer landing). Set, no re-render churn.
  const sentSeen = useRef<Set<string>>(new Set());
  const [pulsing, setPulsing] = useState<Set<string>>(new Set());

  // Read the three live surfaces. Used on mount AND on every poll re-fetch.
  const load = useCallback(async () => {
    const [gRes, rRes, pRes] = await Promise.all([
      fetch(`/api/graph?userId=${encodeURIComponent(userId)}`),
      fetch(`/api/report?userId=${encodeURIComponent(userId)}`),
      fetch(`/api/plan?userId=${encodeURIComponent(userId)}`),
    ]);
    if (!gRes.ok) throw new Error(`graph ${gRes.status}`);
    if (!rRes.ok) throw new Error(`report ${rRes.status}`);
    if (!pRes.ok) throw new Error(`plan ${pRes.status}`);
    const gData = await gRes.json();
    const rData = await rRes.json();
    const pData = await pRes.json();

    const nextPlan: CheckIn[] = pData.checkins ?? [];
    // detect newly-sent check-ins → pulse them once (the timer landing)
    const freshlySent: string[] = [];
    for (const c of nextPlan) {
      if (c.status === 'sent' && !sentSeen.current.has(c.id)) {
        sentSeen.current.add(c.id);
        freshlySent.push(c.id);
      }
    }
    if (freshlySent.length) {
      setPulsing((prev) => {
        const next = new Set(prev);
        freshlySent.forEach((id) => next.add(id));
        return next;
      });
      // clear the pulse after the blur-up settles
      setTimeout(() => {
        setPulsing((prev) => {
          const next = new Set(prev);
          freshlySent.forEach((id) => next.delete(id));
          return next;
        });
      }, 1600);
    }

    setGraph(gData.graph ?? { nodes: [], edges: [] });
    setConversation(gData.conversation ?? null);
    setReport(rData.report ?? null);
    setPlan(nextPlan);
  }, [userId]);

  // mount: first read. fail LOUD (visible chip), no silent stub.
  useEffect(() => {
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        await load();
        if (alive) setFailed(null);
      } catch (e) {
        if (alive) setFailed(e instanceof Error ? e.message : 'load failed');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [load]);

  // the REAL timer: poll the scheduler tick, then re-read the three surfaces so a
  // fired check-in visibly lands. Interval cleared on unmount.
  useEffect(() => {
    let alive = true;
    const id = setInterval(async () => {
      try {
        await fetch(`/api/scheduler/tick?userId=${encodeURIComponent(userId)}`); // fire what's due NOW (wall clock)
        if (!alive) return;
        await load(); // re-read → panels update if anything fired
        if (alive) setFailed(null);
      } catch (e) {
        if (alive) setFailed(e instanceof Error ? e.message : 'tick failed');
      }
    }, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [load]);

  // ── derive the panels from the graph (prefer report's pre-sorted slices) ─────
  const symptoms: ReportCard[] = useMemo(() => {
    if (report?.symptoms?.length) return report.symptoms;
    if (!graph) return [];
    return graph.nodes
      .filter((n) => n.type === 'symptom')
      .sort((a, b) => SALIENCE_RANK[b.salience] - SALIENCE_RANK[a.salience])
      .map((n) => ({ id: n.id, name: n.name, summary: n.summary, salience: n.salience, evidenceTurnIds: n.evidenceTurnIds }));
  }, [report, graph]);

  const timeline: ReportCard[] = useMemo(() => {
    if (report?.timeline?.length) return report.timeline;
    if (!graph) return [];
    return graph.nodes
      .filter((n) => n.type === 'event' || n.type === 'timeframe')
      .map((n) => ({ id: n.id, name: n.name, summary: n.summary, salience: n.salience, evidenceTurnIds: n.evidenceTurnIds }));
  }, [report, graph]);

  const subjective = report?.subjective ?? [];
  const objective = report?.objective ?? [];
  const gap = report?.gap ?? [];
  const risk = report?.risk ?? [];

  // is there anything to show? (a graph with concept nodes, or any report content)
  const hasStory =
    (graph?.nodes.some((n) => n.type !== 'turn') ?? false) ||
    subjective.length > 0 ||
    objective.length > 0 ||
    symptoms.length > 0 ||
    timeline.length > 0;

  const copy = async () => {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(reportText(report));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — no-op */
    }
  };

  const turnCount = conversation?.turnCount;

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-[680px] flex-col px-6 pb-20 pt-20">
      {/* header */}
      <div className="mb-5 flex items-center gap-3">
        <span className="dot-mark dot-mark--breathe" />
        <Eyebrow>your story · built live from the conversation</Eyebrow>
      </div>

      <motion.h1
        className="text-[26px] leading-snug"
        style={{ fontWeight: 450, letterSpacing: '-0.02em' }}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        here&rsquo;s what you told me — held in one place.
      </motion.h1>

      {typeof turnCount === 'number' && turnCount > 0 && (
        <motion.div
          className="mt-2 font-mono text-[11px] lowercase tracking-wide text-ink-35"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.1 }}
        >
          {turnCount} {turnCount === 1 ? 'turn' : 'turns'} · {symptoms.length} symptom
          {symptoms.length === 1 ? '' : 's'} · {objective.length} fact{objective.length === 1 ? '' : 's'} on record
        </motion.div>
      )}

      {/* FAILED chip — fail LOUD, never silent (calm, not alarming) */}
      <AnimatePresence>
        {failed && (
          <motion.div
            className="mt-4 inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 font-mono text-[10.5px] lowercase"
            style={{ background: 'var(--warn-bg)', color: 'var(--warn-text)' }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <span aria-hidden>⚠</span> couldn&rsquo;t reach the story ({failed})
          </motion.div>
        )}
      </AnimatePresence>

      {/* loading shimmer (brief) */}
      {loading && !graph && (
        <div className="mt-10 flex items-center gap-2 font-mono text-[12px] lowercase text-ink-35">
          <span className="dot-mark" /> gathering your story…
        </div>
      )}

      {/* EMPTY STATE — no invented content. Calm, points back to the conversation. */}
      {!loading && !hasStory && !failed && (
        <motion.div
          className="mt-10 rounded-[16px] bg-raised p-6 shadow-ring"
          initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-35">no story yet</div>
          <p className="text-[15px] leading-relaxed text-ink-70">
            there&rsquo;s nothing here to hold onto yet. talk to dot first — every turn becomes part of this page.
          </p>
          <div className="mt-5">
            <PillButton onClick={onRestart}>↺ start a conversation</PillButton>
          </div>
        </motion.div>
      )}

      {/* ── THE PANELS ───────────────────────────────────────────────────────── */}
      {hasStory && (
        <div className="mt-8 flex flex-col gap-7">
          {/* TWO TRUTHS — the centerpiece. felt | record, gap as the neutral bridge. */}
          {(subjective.length > 0 || objective.length > 0) && (
            <PanelCard title="two truths" caption="the one you felt · the one the record shows">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <TruthColumn
                  heading="what you said out loud"
                  tone="subjective"
                  items={subjective}
                  onOpen={(label) =>
                    setDetail({
                      label,
                      summary: label,
                      evidenceCount: 0,
                      tagText: 'what you said out loud',
                      kind: 'subjective',
                    })
                  }
                />
                <TruthColumn
                  heading="what the record shows"
                  tone="objective"
                  items={objective}
                  onOpen={(label) =>
                    setDetail({
                      label,
                      summary: label,
                      evidenceCount: 0,
                      tagText: 'what the record shows',
                      kind: 'objective',
                    })
                  }
                />
              </div>
              {gap.length > 0 && (
                <motion.div variants={ROW_REVEAL} className="mt-3 rounded-[14px] bg-blue-tint p-4">
                  <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.08em]" style={{ color: 'var(--blue-ink)' }}>
                    the gap · a noticing, not a verdict
                  </div>
                  <ul className="flex flex-col gap-2">
                    {gap.map((g, i) => (
                      <li key={i} className="flex gap-2 text-[13.5px] leading-relaxed" style={{ color: 'var(--blue-ink)' }}>
                        <span style={{ color: 'var(--blue)' }}>·</span>
                        {g}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </PanelCard>
          )}

          {/* SYMPTOMS — chips/cards sized by salience (loud → quiet). */}
          {symptoms.length > 0 && (
            <PanelCard title="symptoms" caption={`${symptoms.length} surfaced · loudest first`}>
              <div className="flex flex-wrap gap-2.5">
                {symptoms.map((s) => (
                  <SalienceChip
                    key={s.id}
                    card={s}
                    onClick={() =>
                      setDetail({
                        label: s.name,
                        summary: s.summary,
                        evidenceCount: s.evidenceTurnIds.length,
                        tagText: `symptom · ${s.salience}`,
                        kind: 'symptom',
                      })
                    }
                  />
                ))}
              </div>
            </PanelCard>
          )}

          {/* TIMELINE — ordered cards (event / timeframe). */}
          {timeline.length > 0 && (
            <PanelCard title="timeline" caption="what happened · in order">
              <div className="flex flex-col gap-2">
                {timeline.map((t, i) => (
                  <motion.button
                    key={t.id}
                    type="button"
                    variants={ROW_REVEAL}
                    onClick={() =>
                      setDetail({
                        label: t.name,
                        summary: t.summary,
                        evidenceCount: t.evidenceTurnIds.length,
                        tagText: 'on the timeline',
                        kind: 'event',
                      })
                    }
                    className="group grid grid-cols-[22px_1fr_auto] items-start gap-3 rounded-[12px] bg-raised p-3.5 text-left shadow-ring transition-[box-shadow] duration-300 hover:shadow-ring-lg"
                  >
                    <span className="mt-[3px] font-mono text-[11px] text-ink-35">{String(i + 1).padStart(2, '0')}</span>
                    <span>
                      <span className="block text-[14px] leading-snug text-ink-90" style={{ fontWeight: 450 }}>
                        {t.name}
                      </span>
                      <span className="mt-0.5 block text-[12.5px] leading-relaxed text-ink-50">{t.summary}</span>
                    </span>
                    <span className="mt-[3px] font-mono text-[12px] text-blue opacity-0 transition-opacity group-hover:opacity-65" aria-hidden>
                      ↗
                    </span>
                  </motion.button>
                ))}
              </div>
            </PanelCard>
          )}

          {/* RISK — only if present. The calm 988 care card, never alarming red. */}
          {risk.length > 0 && (
            <motion.section
              variants={SECTION}
              initial="hidden"
              animate="show"
              className="rounded-[16px] bg-blue-tint p-5"
            >
              <motion.div variants={ROW_REVEAL} className="mb-2 font-mono text-[10px] uppercase tracking-[0.08em]" style={{ color: 'var(--blue-ink)' }}>
                care · you don&rsquo;t have to hold this alone
              </motion.div>
              <ul className="flex flex-col gap-2">
                {risk.map((r, i) => (
                  <motion.li
                    key={i}
                    variants={ROW_REVEAL}
                    className="flex gap-2 text-[14px] leading-relaxed"
                    style={{ color: 'var(--blue-ink)' }}
                  >
                    <span style={{ color: 'var(--blue)' }}>·</span>
                    {r}
                  </motion.li>
                ))}
              </ul>
              <motion.div
                variants={ROW_REVEAL}
                className="mt-4 flex flex-wrap items-center gap-3 rounded-[12px] bg-page p-3.5 shadow-ring"
              >
                <span className="font-mono text-[13px] tracking-wide" style={{ color: 'var(--blue)' }}>
                  988
                </span>
                <span className="text-[13px] leading-relaxed text-ink-70">
                  call or text the Suicide &amp; Crisis Lifeline — free, 24/7, whenever it helps.
                </span>
              </motion.div>
            </motion.section>
          )}

          {/* PLAN — "what dot is watching". Each check-in a row + a live status pill. */}
          {plan && plan.length > 0 && (
            <PanelCard title="what dot is watching" caption="forward check-ins · the timer she set">
              <div className="flex flex-col gap-2">
                {plan.map((c) => (
                  <CheckInRow key={c.id} checkin={c} pulsing={pulsing.has(c.id)} />
                ))}
              </div>
            </PanelCard>
          )}

          {/* THE PAYOFF — connect the dots → see the full report */}
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <PillButton onClick={() => setShowReport(true)}>connect the dots → see the report</PillButton>
            <button onClick={onRestart} className="font-mono text-[12px] lowercase tracking-wide text-ink-35">
              ↺ new conversation
            </button>
          </div>
        </div>
      )}

      {/* ── a clicked card BLOOMS OPEN → its summary + the "from the conversation" note ── */}
      <AnimatePresence>
        {detail && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center p-5"
            style={{ background: 'rgba(11,22,32,0.34)', backdropFilter: 'blur(7px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDetail(null)}
          >
            <motion.div
              className="w-full max-w-[440px] rounded-[22px] bg-page p-7 shadow-ring-lg"
              variants={PANEL_MORPH}
              initial="hidden"
              animate="show"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div variants={ROW_REVEAL} className="flex items-center justify-between gap-4">
                <span
                  className="rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.08em]"
                  style={
                    detail.kind === 'objective' || detail.kind === 'symptom'
                      ? { background: 'var(--blue-tint)', color: 'var(--blue-ink)' }
                      : { background: 'rgba(11,22,32,0.05)', color: 'var(--ink-50)' }
                  }
                >
                  {detail.tagText}
                </span>
                <button onClick={() => setDetail(null)} className="shrink-0 font-mono text-[18px] leading-none text-ink-35" aria-label="close">
                  ×
                </button>
              </motion.div>

              <motion.div
                variants={ROW_REVEAL}
                className="mt-4 text-[18px] leading-[26px]"
                style={{ fontWeight: 450, color: detail.kind === 'subjective' ? 'var(--ink-70)' : 'var(--ink-90)' }}
              >
                {detail.label}
              </motion.div>

              {detail.summary && detail.summary !== detail.label && (
                <motion.p variants={ROW_REVEAL} className="mt-3 text-[14px] leading-relaxed text-ink-70">
                  {detail.summary}
                </motion.p>
              )}

              <motion.div variants={ROW_REVEAL} className="mt-5 font-mono text-[10px] lowercase tracking-wide text-ink-35">
                {evidenceNote(detail.evidenceCount)}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── THE FULL REPORT — mirrors SummaryPhase's modal: header guardrail, 988 on
            top if risk, the two columns, the gap. S/O only — never assessment/plan. ── */}
      <AnimatePresence>
        {showReport && report && (
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8"
            style={{ background: 'rgba(11,22,32,0.32)', backdropFilter: 'blur(6px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowReport(false)}
          >
            <motion.div
              className="w-full max-w-[600px] rounded-[20px] bg-page p-7 shadow-ring-lg"
              variants={PANEL_MORPH}
              initial="hidden"
              animate="show"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              {/* provenance header — the guardrail, plainly */}
              <motion.div variants={ROW_REVEAL} className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[17px]" style={{ fontWeight: 480 }}>
                    DOT summary
                  </div>
                  <div className="mt-1 font-mono text-[10.5px] leading-relaxed text-ink-35">{report.header}</div>
                  <div className="mt-1.5 font-mono text-[10px] lowercase tracking-wide text-ink-35">
                    for {report.preparedFor} · {report.date}
                  </div>
                </div>
                <button onClick={() => setShowReport(false)} className="shrink-0 font-mono text-[18px] text-ink-35" aria-label="close">
                  ×
                </button>
              </motion.div>

              {/* SAFETY — on TOP if risk present, the calm care framing (never red) */}
              {report.risk.length > 0 && (
                <motion.div variants={ROW_REVEAL} className="mt-4 rounded-[14px] bg-blue-tint p-4">
                  <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.08em]" style={{ color: 'var(--blue-ink)' }}>
                    safety · please read first
                  </div>
                  <ul className="flex flex-col gap-1.5">
                    {report.risk.map((r, i) => (
                      <li key={i} className="flex gap-2 text-[13.5px] leading-relaxed" style={{ color: 'var(--blue-ink)' }}>
                        <span style={{ color: 'var(--blue)' }}>·</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2.5 font-mono text-[11px] tracking-wide" style={{ color: 'var(--blue)' }}>
                    988 · Suicide &amp; Crisis Lifeline — call or text, 24/7
                  </div>
                </motion.div>
              )}

              {/* the two columns — subjective | objective */}
              <motion.div variants={ROW_REVEAL} className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ReportColumn title="subjective · what they felt" tone="subjective" items={report.subjective} />
                <ReportColumn title="objective · what the record shows" tone="objective" items={report.objective} />
              </motion.div>

              {/* the gap — the neutral bridge */}
              {report.gap.length > 0 && (
                <motion.div variants={ROW_REVEAL} className="mt-3 rounded-[14px] bg-raised p-4 shadow-ring">
                  <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-35">the gap · not a verdict</div>
                  <ul className="flex flex-col gap-1.5">
                    {report.gap.map((g, i) => (
                      <li key={i} className="flex gap-2.5 text-[13.5px] leading-relaxed text-ink-70">
                        <span style={{ color: 'var(--blue)' }}>·</span>
                        {g}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* the guardrail footnote — S/O only, never A/P */}
              <motion.p variants={ROW_REVEAL} className="mt-5 font-mono text-[10px] leading-relaxed text-ink-35">
                what you felt and what the record shows — observations only. no assessment, no diagnosis, no plan.
              </motion.p>

              <motion.div variants={ROW_REVEAL} className="mt-6 flex items-center gap-3">
                <PillButton onClick={copy}>{copied ? 'copied ✓' : 'copy to share'}</PillButton>
                <button onClick={onRestart} className="font-mono text-[12px] lowercase tracking-wide text-ink-35">
                  ↺ new conversation
                </button>
                <button onClick={() => setShowReport(false)} className="font-mono text-[12px] lowercase tracking-wide text-ink-35">
                  done
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── a panel section: blooms in, cascades its rows (the SummaryPhase pattern) ──
function PanelCard({ title, caption, children }: { title: string; caption?: string; children: React.ReactNode }) {
  return (
    <motion.section
      variants={SECTION}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      className="rounded-[16px] bg-raised p-5 shadow-ring"
    >
      <motion.div variants={ROW_REVEAL} className="mb-3.5 flex items-baseline justify-between gap-3">
        <span className="text-[15px]" style={{ fontWeight: 480 }}>
          {title}
        </span>
        {caption && <span className="font-mono text-[10px] lowercase tracking-wide text-ink-35">{caption}</span>}
      </motion.div>
      {children}
    </motion.section>
  );
}

// one two-truths column — subjective muted, objective blue-inked (the record channel).
function TruthColumn({
  heading,
  tone,
  items,
  onOpen,
}: {
  heading: string;
  tone: 'subjective' | 'objective';
  items: string[];
  onOpen: (label: string) => void;
}) {
  const isObjective = tone === 'objective';
  return (
    <motion.div variants={ROW_REVEAL} className="rounded-[14px] bg-page p-4 shadow-ring">
      <div className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-35">{heading}</div>
      {items.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {items.map((it, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => onOpen(it)}
                className="flex w-full gap-2 text-left text-[13px] leading-relaxed transition-opacity hover:opacity-70"
                style={{ color: isObjective ? 'var(--blue-ink)' : 'var(--ink-70)' }}
              >
                <span style={{ color: isObjective ? 'var(--blue)' : 'var(--ink-35)' }}>·</span>
                {it}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="font-mono text-[11px] lowercase text-ink-35">nothing surfaced here</p>
      )}
    </motion.div>
  );
}

// a salience-sized symptom chip — louder = bigger + blue-inked. Clickable → bloom.
function SalienceChip({ card, onClick }: { card: ReportCard; onClick: () => void }) {
  const high = card.salience === 'high';
  const med = card.salience === 'med';
  return (
    <motion.button
      type="button"
      variants={ROW_REVEAL}
      onClick={onClick}
      className="rounded-full text-left shadow-ring transition-[box-shadow,opacity] duration-300 hover:shadow-ring-lg"
      style={{
        padding: high ? '10px 18px' : med ? '8px 15px' : '6px 13px',
        fontSize: high ? 14.5 : med ? 13 : 12,
        fontWeight: high ? 480 : 450,
        background: high ? 'var(--blue)' : med ? 'var(--blue-tint)' : 'var(--recessed)',
        color: high ? '#fff' : med ? 'var(--blue-ink)' : 'var(--ink-70)',
      }}
    >
      {card.name}
    </motion.button>
  );
}

// one check-in row — prompt + what it's watching + relative time + status pill.
// PULSES (blur-up) when it flips to 'sent' on a poll: the live timer landing.
function CheckInRow({ checkin, pulsing }: { checkin: CheckIn; pulsing: boolean }) {
  const [now, setNow] = useState(() => Date.now());
  // keep the relative time honest while the row is on screen
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  const sent = checkin.status === 'sent' || checkin.status === 'done';
  return (
    <motion.div
      variants={ROW_REVEAL}
      animate={pulsing ? { scale: [1, 1.015, 1], filter: ['blur(0px)', 'blur(2px)', 'blur(0px)'] } : { scale: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.9, ease: EASE }}
      className="grid grid-cols-[1fr_auto] items-start gap-3 rounded-[12px] bg-page p-3.5 shadow-ring"
    >
      <div>
        <div className="text-[13.5px] leading-snug text-ink-90" style={{ fontWeight: 450 }}>
          {checkin.prompt}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10.5px] lowercase tracking-wide text-ink-35">
          <span>watching · {checkin.watching}</span>
          <span>{relTime(checkin.scheduledFor, now)}</span>
        </div>
      </div>
      <span
        className="shrink-0 rounded-full px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em]"
        style={
          sent
            ? { background: 'var(--blue)', color: '#fff' }
            : { background: 'var(--blue-tint)', color: 'var(--blue-ink)' }
        }
      >
        {sent ? 'sent' : 'pending'}
      </span>
    </motion.div>
  );
}

// one report column (inside the full-report modal). Subjective muted, objective blue.
function ReportColumn({ title, tone, items }: { title: string; tone: 'subjective' | 'objective'; items: string[] }) {
  const isObjective = tone === 'objective';
  return (
    <div className="rounded-[14px] bg-raised p-4 shadow-ring">
      <div className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-35">{title}</div>
      {items.length > 0 ? (
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
        <p className="font-mono text-[11px] lowercase text-ink-35">nothing surfaced here</p>
      )}
    </div>
  );
}
