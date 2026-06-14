'use client';
// ── SCENE 2 — LIVE ONBOARDING (the heart of "halfsies") ───────────────────────
// The dot grows larger; a conversation surface opens with an optional "paste
// transcript" box. DOT asks DOT.onboardingQuestion. Johnny answers 1–2 turns live
// (typed) AND/OR pastes SAMPLE_TRANSCRIPT. EVERY submission → POST /api/turn
// { userId:"demo", text } → ONE live Grok call → render DOT's reply (validate-first
// beat, then the delta) WITH a small visible reasoning trace (the real engine name
// + the grounded counts from the response, so it's clearly LIVE, not canned).
//
// The reflection is CACHED up via onReflection(result) for Scene 4 (§1.5 #3:
// feeling_validation is NOT persisted on Story, so the page caches the live turn).
// After the user's submission lands, DOT plays the scripted closing beats
// (practiceClose → general → checkinPlan). A CTA advances to Scene 3.
//
// HALFSIES: there is NO fake-reflection branch. DOT's side + the paste-ready text
// are scripted (lib/script.ts); the split/reflection is always the live call.
// Fail LOUD: a 500 renders a visible FAILED state — no silent stub.
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bubble, TypingBubble, PillButton, Eyebrow } from '@/components/ui/atoms';
import { useDotVoice, prewarm } from '@/lib/voice';
import {
  DOT,
  PRACTICE,
  PRACTICE_TRANSCRIPT_PLACEHOLDER,
  SAMPLE_TRANSCRIPT,
} from '@/lib/script';

const EASE = [0.16, 1, 0.3, 1] as const;

// The real reasoning engine (named on screen so the trace is clearly live, not
// faked provenance). The /api/turn route does not echo a `model` field, so this is
// the one place the engine name is authored — it matches grok.ts / ADVISEMENT-2 §2.
const ENGINE = 'grok-4.20-0309-reasoning';

// What POST /api/turn returns (the frozen contract). `context` = the grounded
// counts the live call reflected against (proof a real, grounded call ran).
type TurnContext = {
  windowDays: number;
  panicAttacks: number;
  selfHarm: number;
  ideation: number;
};
type TurnResult = {
  reply: string;
  story: { subjective: string[]; objective: string[]; delta: string };
  feelingValidation: string;
  stats: { kind: string; label: string; count: number; window: string }[];
  report: unknown;
  risk: boolean;
  context: TurnContext;
};

// A rendered conversation turn on the surface.
type Msg =
  | { id: string; from: 'dot'; kind: 'say'; text: string }
  | { id: string; from: 'user'; kind: 'say'; text: string }
  | { id: string; from: 'dot'; kind: 'reflection'; result: TurnResult }
  | { id: string; from: 'dot'; kind: 'failed'; error: string };

let _seq = 0;
const nextId = () => `m${_seq++}`;

export default function PracticePhase({
  onNext,
  onReflection,
}: {
  onNext: () => void;
  onReflection: (r: any) => void;
}) {
  const { speak } = useDotVoice();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState('');
  const [pasteOpen, setPasteOpen] = useState(false);
  const [paste, setPaste] = useState('');
  const [busy, setBusy] = useState(false); // a live /api/turn call is in flight
  const [opened, setOpened] = useState(false); // the onboarding question has landed
  const [submissions, setSubmissions] = useState(0); // # of live turns that succeeded
  const [closing, setClosing] = useState(0); // how many scripted closing beats shown
  const scRef = useRef<HTMLDivElement>(null);

  // ── DOT opens with the onboarding question (scripted) ──────────────────────
  useEffect(() => {
    prewarm(DOT.onboardingQuestion);
    prewarm(DOT.practiceClose);
    prewarm(DOT.general);
    prewarm(DOT.checkinPlan);
    const t = setTimeout(() => {
      setMsgs([{ id: nextId(), from: 'dot', kind: 'say', text: DOT.onboardingQuestion }]);
      speak(DOT.onboardingQuestion);
      setOpened(true);
    }, 900);
    return () => clearTimeout(t);
  }, [speak]);

  // keep the surface pinned to the newest turn
  useEffect(() => {
    scRef.current?.scrollTo({ top: scRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, busy, closing]);

  // ── THE LIVE SEAM — every submission goes through POST /api/turn ───────────
  const submit = async (raw: string) => {
    const text = raw.trim();
    if (!text || busy) return;
    setBusy(true);
    setMsgs((m) => [...m, { id: nextId(), from: 'user', kind: 'say', text }]);
    try {
      const res = await fetch('/api/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'demo', text }),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail?.error || `turn ${res.status}`);
      }
      const result = (await res.json()) as TurnResult;
      setMsgs((m) => [...m, { id: nextId(), from: 'dot', kind: 'reflection', result }]);
      setSubmissions((n) => n + 1);
      // cache the LIVE reflection for Scene 4 (§1.5 #3). Shape mirrors the page's
      // Reflection; `model` is named here (the route doesn't echo it).
      onReflection({
        story: result.story,
        feelingValidation: result.feelingValidation,
        stats: result.stats,
        report: result.report,
        model: ENGINE,
        reply: result.reply,
        risk: result.risk,
      });
      speak(result.feelingValidation);
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      setMsgs((m) => [...m, { id: nextId(), from: 'dot', kind: 'failed', error }]);
    } finally {
      setBusy(false);
    }
  };

  const submitDraft = () => {
    const t = draft;
    setDraft('');
    submit(t);
  };
  const submitPaste = () => {
    const t = paste;
    setPaste('');
    setPasteOpen(false);
    submit(t);
  };

  // ── The scripted closing beats — play once a live reflection has landed ────
  const CLOSERS = [DOT.practiceClose, DOT.general, DOT.checkinPlan];
  const startClose = () => {
    if (closing > 0) return;
    let i = 0;
    const step = () => {
      i += 1;
      setClosing(i);
      speak(CLOSERS[i - 1]);
      if (i < CLOSERS.length) setTimeout(step, 2600);
    };
    setTimeout(step, 400);
  };

  const canClose = submissions > 0 && closing === 0 && !busy;
  const closingDone = closing >= CLOSERS.length;

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-[560px] flex-col px-6 pb-10 pt-12">
      {/* the dot GROWS larger entering Scene 2 (the onboarding presence) */}
      <div className="mb-3 flex items-center gap-3">
        <motion.span
          className="dot-mark dot-mark--breathe"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1.7, opacity: 1 }}
          transition={{ duration: 0.9, ease: EASE }}
          style={{ transformOrigin: 'center' }}
        />
        <div className="ml-2">
          <Eyebrow>onboarding · tell it how you feel</Eyebrow>
          <div className="text-[15px] font-medium">dot reads your story, live</div>
        </div>
      </div>

      {/* the conversation surface */}
      <div ref={scRef} className="no-scrollbar flex flex-1 flex-col gap-1.5 overflow-y-auto py-3">
        {msgs.map((m) => {
          if (m.kind === 'say') {
            return (
              <Bubble key={m.id} from={m.from}>
                {m.text}
              </Bubble>
            );
          }
          if (m.kind === 'failed') return <FailedBubble key={m.id} error={m.error} />;
          return <ReflectionTurn key={m.id} result={m.result} />;
        })}

        {/* scripted closing beats (after a live reflection) */}
        {CLOSERS.slice(0, closing).map((line, i) => (
          <Bubble key={`close-${i}`} from="dot" delay={0}>
            {line}
          </Bubble>
        ))}

        <AnimatePresence>{busy && <TypingBubble />}</AnimatePresence>
      </div>

      {/* the composer — typed input + an optional paste box */}
      {!closing && (
        <div className="mt-2 flex flex-col gap-2.5">
          <AnimatePresence>
            {pasteOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4, ease: EASE }}
                className="overflow-hidden"
              >
                <textarea
                  value={paste}
                  onChange={(e) => setPaste(e.target.value)}
                  placeholder={PRACTICE_TRANSCRIPT_PLACEHOLDER}
                  className="no-scrollbar h-32 w-full resize-none rounded-2xl bg-recessed p-4 text-[14px] leading-snug outline-none placeholder:text-ink-35"
                  style={{ color: 'var(--ink-90)' }}
                />
                <div className="mt-1.5 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPaste(SAMPLE_TRANSCRIPT)}
                    className="font-mono text-[11px] lowercase tracking-wide text-blue-ink"
                  >
                    use the journal ↘
                  </button>
                  <div className="flex-1" />
                  <PillButton onClick={submitPaste} disabled={busy || !paste.trim()}>
                    {busy ? 'reading…' : 'send entry →'}
                  </PillButton>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-end gap-2.5">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submitDraft();
                }
              }}
              disabled={!opened || busy}
              placeholder={opened ? 'answer dot…' : ''}
              className="h-12 flex-1 rounded-full bg-recessed px-5 text-[15px] outline-none placeholder:text-ink-35 disabled:opacity-60"
              style={{ color: 'var(--ink-90)' }}
            />
            <button
              type="button"
              onClick={() => setPasteOpen((v) => !v)}
              className="grid h-12 shrink-0 place-items-center rounded-full bg-recessed px-4 font-mono text-[11px] lowercase tracking-wide text-ink-50 transition-colors"
              aria-label="paste a journal entry"
            >
              {pasteOpen ? 'close' : 'paste'}
            </button>
            <PillButton onClick={submitDraft} disabled={!opened || busy || !draft.trim()}>
              send
            </PillButton>
          </div>

          {/* offer the closing beats once a real reflection has landed */}
          <AnimatePresence>
            {canClose && (
              <motion.button
                type="button"
                onClick={startClose}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: EASE }}
                className="self-center font-mono text-[11px] lowercase tracking-wide text-ink-35"
              >
                that's everything for now ↘
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* the CTA → Scene 3, after the closing beats have played */}
      <AnimatePresence>
        {closingDone && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="mt-4 flex items-center justify-end"
          >
            <PillButton onClick={onNext}>see how she keeps in touch →</PillButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── The live reflection bubble — DOT's validate-first beat, then the neutral delta,
// each with a small visible reasoning trace proving a real grounded call ran. ────
function ReflectionTurn({ result }: { result: TurnResult }) {
  const { feelingValidation, story, context, stats } = result;
  // The reply is shaped "validation\n\ndelta"; feelingValidation is the first beat.
  // Show the delta (story.delta is the persisted, authoritative neutral gap).
  const delta = story.delta?.trim();
  const objCount = story.objective?.length ?? 0;
  const subjCount = story.subjective?.length ?? 0;
  const eventsGrounded = stats?.reduce((n, s) => n + (s.count || 0), 0) ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="flex flex-col gap-1.5"
    >
      {/* validate the feeling FIRST */}
      <Bubble from="dot">{feelingValidation}</Bubble>

      {/* the neutral delta — the two-truths gap, never a verdict */}
      {delta && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.5 }}
          className="self-end"
        >
          <div className="max-w-[300px] rounded-[20px] bg-blue-tint px-4 py-3">
            <div className="mb-1 font-mono text-[10px] lowercase tracking-wide text-blue-ink">
              the two truths
            </div>
            <div className="text-[15px] leading-[21px]" style={{ color: 'var(--ink-90)' }}>
              {delta}
            </div>
          </div>
        </motion.div>
      )}

      {/* the reasoning trace — REAL engine name + the grounded counts (proof live) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.9 }}
        className="mt-0.5 self-end"
      >
        <div className="flex max-w-[320px] flex-wrap items-center justify-end gap-1.5 font-mono text-[10px] lowercase tracking-wide text-ink-35">
          <span className="inline-flex items-center gap-1 text-blue-ink">
            <span className="h-1.5 w-1.5 rounded-full bg-blue" />
            {ENGINE}
          </span>
          <span className="text-ink-10">·</span>
          <span>{objCount} objective</span>
          <span className="text-ink-10">·</span>
          <span>{subjCount} subjective</span>
          <span className="text-ink-10">·</span>
          <span>
            grounded in {eventsGrounded} events / {context.windowDays}d
          </span>
        </div>
        {(context.panicAttacks > 0 || context.selfHarm > 0 || context.ideation > 0) && (
          <div className="mt-1 flex flex-wrap items-center justify-end gap-1.5 font-mono text-[10px] lowercase tracking-wide text-ink-35">
            {context.panicAttacks > 0 && <Trace label={`${context.panicAttacks} panic`} />}
            {context.selfHarm > 0 && <Trace label={`${context.selfHarm} self-harm`} />}
            {context.ideation > 0 && <Trace label={`${context.ideation} ideation`} />}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function Trace({ label }: { label: string }) {
  return <span className="rounded-full bg-recessed px-2 py-0.5">{label}</span>;
}

// ── Fail LOUD — a structured 500 renders a visible FAILED badge, never a stub ──
function FailedBubble({ error }: { error: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="self-end"
    >
      <div
        className="max-w-[320px] rounded-[20px] px-4 py-3"
        style={{ background: 'var(--bad-bg)' }}
      >
        <div
          className="mb-1 font-mono text-[10px] uppercase tracking-wider"
          style={{ color: 'var(--bad)' }}
        >
          ⚠ turn failed
        </div>
        <div className="text-[13px] leading-snug" style={{ color: 'var(--bad-text)' }}>
          the live reflection didn&apos;t come back. {error}
        </div>
      </div>
    </motion.div>
  );
}
