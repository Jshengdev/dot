'use client';
// ─────────────────────────────────────────────────────────────────────────────
// CONVERSE — the LIVE intake chat (the heart of the demo).
//
// DOT opens with ONE warm, generic invitation (the only line we author; everything
// she says after that comes from the model). Every user message hits POST /api/turn
// { userId, text } → her live reply lands as a bubble + is spoken, and her growing
// READ on the story (coverage / what's still missing / risk / the graph filling in)
// arrives as quiet shapes around the thread — never a paragraph where a meter, a
// chip, or a count will do.
//
// When the route returns risk:true, the calm 988 care card raises inline (the same
// CARE-not-alarm card as the check-ins). DOT does not argue the feeling.
//
// When shouldClose:true comes back, DOT is ready to wrap. A gentle "let her close →"
// affordance calls POST /api/close { userId }; her two-truths reflection ({ closing })
// is read back as staggered DOT bubbles (spoken), then "see what dot caught →" → onDone.
//
// No silent stubs (CONSTRAINTS): a failed /api/turn or /api/close renders a visible
// FAILED bubble and lets the demo retry. Clean-blue only, no borders (depth from the
// ring-shadow), the locked ease, nothing bounces, blur-up on content change.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bubble, TypingBubble, PillButton, Eyebrow } from '@/components/ui/atoms';
import { useDotVoice, prewarm } from '@/lib/voice';

const EASE = [0.16, 1, 0.3, 1] as const;

// The ONLY copy DOT speaks that we author — a generic invitation, not a scripted
// story. Everything else she says is the live model reply / her live close.
const OPENING =
  "hey. i'm dot. tell me what's been going on — however it comes out, no shape needed. just talk to me.";

// ── The live /api/turn shape (structural — flow-proto talks JSON) ──────────────
type GraphShape = { nodes: number; edges: number };
type TurnResponse = {
  reply: string;
  coverage: number; // 0..1 — DOT's read on how full the picture is
  missing: string[]; // what she's still listening for
  shouldClose: boolean; // she's ready to wrap
  risk: boolean; // a crisis cue tripped → raise the calm 988 card
  graphShape: GraphShape; // how much of the record has formed
};
type CloseResponse = { closing: string };

// The transcript items rendered in the thread, in order.
type Item =
  | { kind: 'dot'; text: string } // DOT — the opening, a live reply, or a close line
  | { kind: 'user'; text: string } // the person talking
  | { kind: 'risk' } // the 988 care card (raised once)
  | { kind: 'failed'; where: string; message: string }; // a visible FAILED state

// idle/talking → a turn is in flight → DOT wants to close → closing in flight → closed.
type Stage = 'talking' | 'thinking' | 'ready-to-close' | 'closing' | 'closed';

export default function ConversePhase({ userId, onDone }: { userId: string; onDone: () => void }) {
  const { speak } = useDotVoice();
  const [items, setItems] = useState<Item[]>([]);
  const [stage, setStage] = useState<Stage>('talking');
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState('');

  // DOT's live read on the story (the shapes around the thread). null until her first reply.
  const [coverage, setCoverage] = useState(0);
  const [captured, setCaptured] = useState<GraphShape | null>(null);
  const [riskRaised, setRiskRaised] = useState(false); // raise the 988 card at most once

  const scRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // ── On mount: DOT opens with the one warm invitation (spoken). ───────────────
  useEffect(() => {
    prewarm(OPENING);
    setItems([{ kind: 'dot', text: OPENING }]);
    const t = setTimeout(() => speak(OPENING), 450);
    return () => clearTimeout(t);
  }, [speak]);

  // Keep the newest bubble in view as the thread / typing / shapes change.
  useEffect(() => {
    scRef.current?.scrollTo({ top: scRef.current.scrollHeight, behavior: 'smooth' });
  }, [items, typing, stage, coverage]);

  // DOT decides she's done: once she signals ready-to-close, she wraps up HERSELF
  // after a short beat — no button required (that's the "dot decides you're done"
  // moment). The "let her close" pill stays as a manual override; close() guards a
  // double-fire (it no-ops unless stage is still 'ready-to-close').
  useEffect(() => {
    if (stage !== 'ready-to-close') return;
    const t = setTimeout(() => close(), 1700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  const composerOpen = stage === 'talking';

  // ── Send a user message through the LIVE pipeline (one real /api/turn). ───────
  async function send() {
    const text = draft.trim();
    if (!text || !composerOpen) return;

    setItems((it) => [...it, { kind: 'user', text }]);
    setDraft('');
    setStage('thinking');
    setTyping(true);

    try {
      const res = await fetch('/api/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, text }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}) as { error?: string });
        throw new Error(body?.error || `turn ${res.status}`);
      }
      const data = (await res.json()) as TurnResponse;
      setTyping(false);

      // her growing read on the story (the shapes, not a paragraph)
      setCoverage(typeof data.coverage === 'number' ? data.coverage : 0);
      setCaptured(data.graphShape ?? null);

      // her live reply
      const reply = (data.reply || '').trim();
      if (reply) {
        setItems((it) => [...it, { kind: 'dot', text: reply }]);
        speak(reply);
      }

      // the calm 988 card — raised once, the moment a crisis cue trips. CARE, not
      // alarm; DOT's reply above already met the feeling without arguing it.
      if (data.risk && !riskRaised) {
        setRiskRaised(true);
        setItems((it) => [...it, { kind: 'risk' }]);
      }

      // she's ready to wrap → surface the gentle close affordance (don't auto-yank
      // the composer; let the moment breathe, then she closes on the tap).
      setStage(data.shouldClose ? 'ready-to-close' : 'talking');
    } catch (err) {
      setTyping(false);
      const message = err instanceof Error ? err.message : String(err);
      setItems((it) => [...it, { kind: 'failed', where: '/api/turn', message }]);
      setStage('talking'); // composer reopens → the demo can retry
    }
  }

  // ── DOT closes: POST /api/close → her two-truths reflection read back, staggered
  // (and spoken), then the payoff key. The closing copy is LIVE (never authored). ──
  async function close() {
    if (stage !== 'ready-to-close') return;
    setStage('closing');
    setTyping(true);

    try {
      const res = await fetch('/api/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}) as { error?: string });
        throw new Error(body?.error || `close ${res.status}`);
      }
      const data = (await res.json()) as CloseResponse;
      setTyping(false);

      // split her reflection on newlines → DOT bubbles, staggered, each spoken in turn
      const lines = (data.closing || '')
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

      if (lines.length === 0) {
        // the call ran but came back empty — fail loud, don't fake a reflection
        setItems((it) => [
          ...it,
          { kind: 'failed', where: '/api/close', message: 'close returned no reflection' },
        ]);
        setStage('ready-to-close');
        return;
      }

      lines.forEach((line, i) => {
        setTimeout(() => {
          setItems((it) => [...it, { kind: 'dot', text: line }]);
          speak(line);
          if (i === lines.length - 1) setStage('closed');
        }, i * 1300);
      });
    } catch (err) {
      setTyping(false);
      const message = err instanceof Error ? err.message : String(err);
      setItems((it) => [...it, { kind: 'failed', where: '/api/close', message }]);
      setStage('ready-to-close'); // can retry the close
    }
  }

  const coveragePct = Math.round(Math.min(1, Math.max(0, coverage)) * 100);
  const nodeCount = captured?.nodes ?? 0;

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-[560px] flex-col px-6 pb-6 pt-16">
      {/* header — a breathing dot-mark + her live read on the story (a shape, not prose) */}
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="dot-mark dot-mark--breathe" />
          <Eyebrow>dot · listening</Eyebrow>
        </div>
        <AnimatePresence>
          {nodeCount > 0 && (
            <motion.span
              key="captured"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="rounded-full bg-blue-tint px-2.5 py-1 font-mono text-[10px] lowercase tracking-wide text-blue-ink"
              title="pieces of your story dot has caught so far"
            >
              {nodeCount} caught
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* COVERAGE — the story so far, as a thin blue line filling in. blur-up on change,
          nothing bounces. Appears once she's read her first turn. */}
      <AnimatePresence>
        {coverage > 0 && (
          <motion.div
            key="coverage"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="mb-3 flex items-center gap-3"
          >
            <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-recessed">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'var(--blue)' }}
                initial={false}
                animate={{ width: `${coveragePct}%` }}
                transition={{ duration: 0.8, ease: EASE }}
              />
            </div>
            <span className="shrink-0 font-mono text-[10px] lowercase tracking-wide text-ink-35">
              the story so far · {coveragePct}%
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* the thread */}
      <div ref={scRef} className="no-scrollbar flex flex-1 flex-col gap-1 overflow-y-auto py-3">
        {items.map((it, idx) => {
          if (it.kind === 'dot' || it.kind === 'user') {
            return (
              <Bubble key={idx} from={it.kind}>
                {it.text}
              </Bubble>
            );
          }
          if (it.kind === 'risk') {
            return <RiskCard key={idx} />;
          }
          // No silent stubs — a failed live call renders a visible FAILED bubble.
          return (
            <motion.div
              key={idx}
              role="alert"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="my-1 self-start rounded-2xl px-4 py-3 text-[12px] leading-snug"
              style={{
                background: 'color-mix(in srgb, var(--bad) 7%, transparent)',
                boxShadow: '0 0 0 1px color-mix(in srgb, var(--bad) 45%, transparent)',
                color: 'var(--bad)',
              }}
            >
              <span className="font-mono uppercase tracking-wide">failed · {it.where}</span>
              <div className="mt-1 opacity-80">{it.message}</div>
            </motion.div>
          );
        })}

        <AnimatePresence>{typing && <TypingBubble />}</AnimatePresence>
      </div>

      {/* the composer — open while she's still listening (talking). ⌘↵ to send. */}
      <AnimatePresence mode="wait">
        {composerOpen && (
          <motion.div
            key="composer"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="flex flex-col gap-2 pt-2"
          >
            <div className="flex items-center justify-between">
              <Eyebrow>say it however it comes out</Eyebrow>
              <span className="font-mono text-[10px] lowercase text-ink-35">live · /api/turn</span>
            </div>
            <textarea
              ref={taRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="type what's been going on… (⌘↵ to send)"
              rows={2}
              className="no-scrollbar w-full resize-none rounded-2xl bg-recessed p-4 text-[15px] leading-snug outline-none placeholder:text-ink-35"
              style={{ color: 'var(--ink-90)' }}
            />
            <div className="flex items-center gap-3">
              <div className="flex-1" />
              <PillButton onClick={send} disabled={!draft.trim()}>
                send →
              </PillButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* the close / payoff lane — status while thinking; the gentle close affordance
          when she's ready; the payoff key once she's reflected back. */}
      <div className="flex min-h-[52px] items-center justify-end pt-2">
        {stage === 'thinking' && (
          <span className="font-mono text-[11px] lowercase text-ink-35">dot is taking it in…</span>
        )}

        {stage === 'ready-to-close' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="flex w-full items-center justify-between gap-3"
          >
            <span className="font-mono text-[11px] lowercase tracking-wide text-ink-35">
              she has the picture — when you&apos;re ready
            </span>
            <PillButton onClick={close}>let her close →</PillButton>
          </motion.div>
        )}

        {stage === 'closing' && (
          <span className="font-mono text-[11px] lowercase text-ink-35">dot is reflecting it back…</span>
        )}

        {stage === 'closed' && (
          <PillButton onClick={onDone}>see what dot caught →</PillButton>
        )}
      </div>
    </div>
  );
}

// ── The 988 CARE card — calm blue, supportive, never alarming red, never clinical.
// Care, not alarm: a raised blue card with the crisis lines as embossed chips. Pulses
// in once (blur-up), then sits quietly — no pressure. (Mirrors the check-ins RiskCard;
// the inline-form copy is the standard 988 / 741741 resources, not invented content.)
function RiskCard() {
  return (
    <motion.div
      role="note"
      aria-label="crisis support"
      initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.55, ease: EASE }}
      className="my-2 self-stretch rounded-[22px] p-5"
      style={{
        background: 'var(--blue-tint)',
        boxShadow:
          'inset 0 0 0 1px rgba(255,255,255,0.9), 0 0 0 1px color-mix(in srgb, var(--blue) 22%, transparent), 0 8px 26px rgba(0,122,255,0.14)',
        color: 'var(--blue-ink)',
      }}
    >
      <div className="flex items-center gap-2">
        <span className="dot-mark dot-mark--breathe" />
        <span className="font-mono text-[10px] uppercase tracking-wide" style={{ color: 'var(--blue-ink)' }}>
          you don&apos;t have to carry this alone
        </span>
      </div>
      <p className="mt-3 text-[15px] leading-[22px]" style={{ color: 'var(--ink-90)' }}>
        i hear you, and i&apos;m glad you said it out loud. if it gets heavy, people are there
        right now — you can reach them any time.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-page px-3 py-1.5 font-mono text-[12px] tracking-wide text-blue-ink shadow-[inset_0_0_0_1px_rgba(11,22,32,0.06),0_1px_2px_rgba(11,22,32,0.06)]">
          988 · call or text
        </span>
        <span className="rounded-full bg-page px-3 py-1.5 font-mono text-[12px] tracking-wide text-blue-ink shadow-[inset_0_0_0_1px_rgba(11,22,32,0.06),0_1px_2px_rgba(11,22,32,0.06)]">
          text HOME → 741741
        </span>
        <span className="rounded-full bg-page px-3 py-1.5 font-mono text-[12px] tracking-wide text-blue-ink shadow-[inset_0_0_0_1px_rgba(11,22,32,0.06),0_1px_2px_rgba(11,22,32,0.06)]">
          available 24/7
        </span>
      </div>
    </motion.div>
  );
}
