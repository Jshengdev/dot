'use client';
// ─────────────────────────────────────────────────────────────────────────────
// SCENE 3 — Staggered check-ins over simulated time ("truth built over time").
//
// A frontend FAKE CLOCK ("simulate 3 hours" / "simulate next day") surfaces the 3
// scripted check-ins in order as iMessage-style bubbles (DOT's `text`). Johnny
// REPLIES LIVE on check-in 1 (typed); PASTES check_ins[1].user_reply /
// check_ins[2].user_reply on 2 & 3. Every user reply → POST /api/turn
// { userId:"demo", text, now:<simulated ts> } → a LIVE Grok follow-up grounded in
// the now-accumulating record (DOT's check-in PROMPTS are scripted; the user side
// runs live — the "halfsies" rule). On check-in 3 (the "sleep forever" risk catch)
// the 988 card renders from RISK_MESSAGE VERBATIM (scripted — GOAL §1.5 #2; gated
// on the route's `risk` boolean when it trips). DOT never dismisses the walk-back.
//
// DESIGN: clean-blue, iMessage bubbles, no borders (depth from light), trust-blue
// the only accent. The 988 card is CARE, not an error — a calm blue safety card,
// never alarming red, never clinical. No silent stubs: a failed /api/turn renders a
// visible FAILED state and the demo can retry.
//
// EDITABLE COPY lives in lib/script.ts (CHECKINS, RISK_MESSAGE). This file is the
// rendering lane — content there, behaviour here. Do NOT edit script.ts from here.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bubble, TypingBubble, PillButton, Eyebrow } from '@/components/ui/atoms';
import { useDotVoice, prewarm } from '@/lib/voice';
import { CHECKINS, RISK_MESSAGE, type Checkin } from '@/lib/script';

const EASE = [0.16, 1, 0.3, 1] as const;

// The transcript items rendered in the thread, in order.
type Item =
  | { kind: 'meta'; after: string; trigger: string } // the fake-clock tick + why it fired
  | { kind: 'dot'; text: string } // DOT's scripted check-in OR live follow-up
  | { kind: 'user'; text: string } // Johnny's reply (live-typed on 1, pasted on 2/3)
  | { kind: 'failed'; message: string } // a visible FAILED state (no silent stubs)
  | { kind: 'risk'; message: string }; // the 988 care card (RISK_MESSAGE verbatim)

// Per-check-in interaction state: idle → prompt shown, awaiting the reply → the
// live /api/turn is in flight → DOT's follow-up landed (this check-in is done).
type Stage = 'await-clock' | 'prompt' | 'awaiting-reply' | 'thinking' | 'done';

export default function CheckinsPhase({ onNext }: { onNext: () => void }) {
  const { speak } = useDotVoice();
  const [ci, setCi] = useState(-1); // index of the check-in currently in play
  const [items, setItems] = useState<Item[]>([]);
  const [stage, setStage] = useState<Stage>('await-clock');
  const [typing, setTyping] = useState(false); // DOT typing indicator (scripted prompt land)
  const [draft, setDraft] = useState(''); // the reply composer (typed live on 1, pasted on 2/3)
  const scRef = useRef<HTMLDivElement>(null);

  // ── Presenter control: fire the REAL staggered check-in texts to Johnny's phone.
  // The iMessage agent exposes GET http://localhost:8790/checkin/<n> (n=0,1,2 →
  // first / second / the safety+988 one). Each click sends the next, then advances.
  const SMS_TOTAL = 3;
  const [smsSent, setSmsSent] = useState(0); // how many real texts LANDED (0..3)
  const [smsBusy, setSmsBusy] = useState(false); // a send is in flight
  const [smsError, setSmsError] = useState<string | null>(null); // why nothing landed
  async function sendNextCheckinSms() {
    if (smsSent >= SMS_TOTAL || smsBusy) return;
    const idx = smsSent;
    setSmsBusy(true);
    setSmsError(null);
    try {
      // The trigger now AWAITS the real Photon send: 200 means it actually landed.
      const res = await fetch(`http://localhost:8790/checkin/${idx}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}) as { error?: string });
        throw new Error(body?.error || `trigger ${res.status}`);
      }
      setSmsSent((n) => n + 1); // count ONLY a confirmed delivery (no silent stub)
    } catch (e) {
      // Surface it — the usual stage cause is opening the https Vercel build, where
      // the browser blocks https→http://localhost. Run the local page (:5175) and
      // make sure the iMessage agent is up.
      setSmsError(e instanceof Error ? e.message : String(e));
    } finally {
      setSmsBusy(false);
    }
  }

  // Prewarm DOT's scripted check-in lines so the TTS is instant on the clock tick.
  useEffect(() => {
    CHECKINS.forEach((c) => prewarm(c.text));
  }, []);

  // ── The fake clock: advance to the next check-in, surface DOT's scripted prompt.
  useEffect(() => {
    if (ci < 0) return;
    const c = CHECKINS[ci];
    setStage('prompt');
    setDraft('');
    // the simulated-time tick (what the clock shows) + why this check-in fired
    setItems((it) => [...it, { kind: 'meta', after: c.after, trigger: c.trigger }]);
    setTyping(true);
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(
      setTimeout(() => {
        setTyping(false);
        setItems((it) => [...it, { kind: 'dot', text: c.text }]);
        speak(c.text);
        setStage('awaiting-reply');
      }, 1100),
    );
    return () => timers.forEach(clearTimeout);
  }, [ci, speak]);

  // Keep the newest bubble in view.
  useEffect(() => {
    scRef.current?.scrollTo({ top: scRef.current.scrollHeight, behavior: 'smooth' });
  }, [items, typing, stage]);

  const current: Checkin | undefined = ci >= 0 ? CHECKINS[ci] : undefined;
  const isLast = ci >= CHECKINS.length - 1;
  const nextAfter = CHECKINS[ci + 1]?.after ?? CHECKINS[0]?.after;

  // ── Send the user's reply through the LIVE pipeline (one real Grok call).
  // text = whatever's in the composer (typed live on check-in 1; pasted on 2/3).
  // now = the check-in's simulated timestamp, so DOT grounds in the right window.
  async function sendReply() {
    const text = draft.trim();
    if (!text || !current || stage !== 'awaiting-reply') return;

    setItems((it) => [...it, { kind: 'user', text }]);
    setDraft('');
    setStage('thinking');
    setTyping(true);

    try {
      const res = await fetch('/api/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'demo', text, now: current.sent_at }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `turn ${res.status}`);
      }
      const data: { reply?: string; risk?: boolean } = await res.json();
      setTyping(false);

      // DOT's grounded follow-up (the LIVE reply — references the real accumulating
      // record). Fall back to the scripted follow-up only if the model returns empty
      // (still not a silent stub — the live call ran; this just guards an empty body).
      const followup = (data.reply || '').trim() || current.dot_followup;
      setItems((it) => [...it, { kind: 'dot', text: followup }]);
      speak(followup);

      // ── The 988 catch. On the risk check-in (check-in 3, the "sleep forever"
      // reply), render the 988 care card VERBATIM from RISK_MESSAGE. Scripted per
      // §1.5 #2; we also honour the route's deterministic `risk` flag if it trips on
      // an unscripted reply. DOT does NOT dismiss the walk-back — the follow-up above
      // already validated; the resources stay up, no pressure.
      if (current.risk || data.risk) {
        setItems((it) => [...it, { kind: 'risk', message: RISK_MESSAGE }]);
      }

      setStage('done');
    } catch (err) {
      // No silent stubs — a failed live call renders a visible FAILED state; the
      // demo can retry (the composer reopens).
      setTyping(false);
      const message = err instanceof Error ? err.message : String(err);
      setItems((it) => [...it, { kind: 'failed', message }]);
      setStage('awaiting-reply');
    }
  }

  // Paste the scripted reply into the composer (check-ins 2 & 3 — "paste for time").
  function useScriptedReply() {
    if (current) setDraft(current.user_reply);
  }

  // ── The reply hint differs by check-in: 1 is LIVE-typed; 2 & 3 are pasted.
  const isLive = ci === 0;
  const composerOpen = stage === 'awaiting-reply';

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-[560px] flex-col px-6 pb-8 pt-16">
      {/* header */}
      <div className="mb-2 flex items-center gap-3">
        <span className="dot-mark dot-mark--breathe" />
        <div>
          <Eyebrow>check-ins · the same record, days later</Eyebrow>
          <div className="text-[15px] font-medium">good reminders — never &ldquo;are you ok&rdquo;</div>
        </div>
      </div>

      {/* presenter control — fire the REAL staggered check-in texts to my phone.
          n=0 first · n=1 second · n=2 the safety check-in (988). Clean white card,
          trust-blue accent; relabels + disables after the 3rd. */}
      <button
        type="button"
        onClick={sendNextCheckinSms}
        disabled={smsSent >= SMS_TOTAL || smsBusy}
        className="mb-2 flex w-full items-center justify-between gap-3 rounded-2xl bg-page px-4 py-3 text-left transition-[box-shadow,transform] active:scale-[0.99]"
        style={{
          boxShadow:
            'inset 0 0 0 1px rgba(255,255,255,0.9), 0 0 0 1px color-mix(in srgb, var(--blue) 22%, transparent), 0 6px 22px rgba(0,122,255,0.12)',
          color: 'var(--blue-ink)',
          opacity: smsSent >= SMS_TOTAL ? 0.65 : 1,
          cursor: smsSent >= SMS_TOTAL || smsBusy ? 'default' : 'pointer',
        }}
      >
        <span className="flex flex-col gap-0.5">
          <span className="text-[14px] font-medium leading-tight" style={{ color: 'var(--ink-90)' }}>
            {smsBusy
              ? '📲 texting your phone…'
              : smsSent >= SMS_TOTAL
                ? '✓ all 3 check-ins sent to my phone'
                : smsSent === SMS_TOTAL - 1
                  ? '📲 simulate next day — text me the safety check-in →'
                  : '📲 simulate next day — text me the check-in →'}
          </span>
          <span className="font-mono text-[10px] lowercase tracking-wide text-blue-ink">
            {smsSent >= SMS_TOTAL
              ? 'sent 3/3 · #3 was the safety check-in (988)'
              : `sent ${smsSent}/${SMS_TOTAL} · real sms to my phone${
                  smsSent === SMS_TOTAL - 1 ? ' · next is the 988 safety check-in' : ''
                }`}
          </span>
        </span>
        <span
          className="shrink-0 rounded-full px-3 py-1.5 font-mono text-[12px] tracking-wide"
          style={{
            background: 'var(--blue-tint)',
            color: 'var(--blue-ink)',
          }}
        >
          {smsSent >= SMS_TOTAL ? '3/3' : `${smsSent}/${SMS_TOTAL}`}
        </span>
      </button>

      {/* No silent stubs — if the trigger didn't land, say why (right where it failed). */}
      {smsError && (
        <div
          role="alert"
          className="mb-2 rounded-xl px-3 py-2 font-mono text-[10px] leading-snug"
          style={{
            background: 'color-mix(in srgb, var(--bad) 7%, transparent)',
            boxShadow: '0 0 0 1px color-mix(in srgb, var(--bad) 40%, transparent)',
            color: 'var(--bad)',
          }}
        >
          didn&apos;t send · {smsError} — open the local page (localhost:5175, not the https url) and make sure the
          imessage agent is running.
        </div>
      )}

      {/* the thread */}
      <div ref={scRef} className="no-scrollbar flex flex-1 flex-col gap-1 overflow-y-auto py-4">
        {ci < 0 && (
          <div className="my-auto flex flex-col items-center gap-2 text-center">
            <span className="font-mono text-[12px] lowercase text-ink-35">
              he said he&apos;d keep in touch. wind the clock forward →
            </span>
          </div>
        )}

        {items.map((it, idx) => {
          if (it.kind === 'meta') {
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, ease: EASE }}
                className="my-3 flex flex-col items-center gap-1.5"
              >
                <span className="font-mono text-[11px] lowercase tracking-wide text-ink-35">
                  ⏳ {it.after}
                </span>
                <span className="max-w-[300px] rounded-full bg-blue-tint px-3 py-1 text-center font-mono text-[10px] lowercase leading-snug text-blue-ink">
                  why now · {it.trigger}
                </span>
              </motion.div>
            );
          }
          if (it.kind === 'dot' || it.kind === 'user') {
            return (
              <Bubble key={idx} from={it.kind}>
                {it.text}
              </Bubble>
            );
          }
          if (it.kind === 'failed') {
            return (
              <motion.div
                key={idx}
                role="alert"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="self-start rounded-2xl px-4 py-3 text-[12px] leading-snug"
                style={{
                  background: 'color-mix(in srgb, var(--bad) 7%, transparent)',
                  boxShadow: '0 0 0 1px color-mix(in srgb, var(--bad) 45%, transparent)',
                  color: 'var(--bad)',
                }}
              >
                <span className="font-mono uppercase tracking-wide">failed · /api/turn</span>
                <div className="mt-1 opacity-80">{it.message}</div>
              </motion.div>
            );
          }
          // the 988 CARE card — RISK_MESSAGE verbatim. Calm blue, supportive; never
          // alarming red, never clinical. The resources read as embossed chips.
          return <RiskCard key={idx} message={it.message} />;
        })}

        <AnimatePresence>{typing && <TypingBubble />}</AnimatePresence>
      </div>

      {/* the composer — the live reply box (open while awaiting a reply) */}
      <AnimatePresence mode="wait">
        {composerOpen && current && (
          <motion.div
            key={`composer-${ci}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="flex flex-col gap-2 pt-2"
          >
            <div className="flex items-center justify-between">
              <Eyebrow>
                {isLive ? 'reply live — type how it landed' : 'paste your reply (for time)'}
              </Eyebrow>
              <span className="font-mono text-[10px] lowercase text-ink-35">live · /api/turn</span>
            </div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  sendReply();
                }
              }}
              placeholder={
                isLive ? 'type your reply… (⌘↵ to send)' : 'paste the reply, or use the scripted one ↘'
              }
              rows={isLive ? 2 : 3}
              className="no-scrollbar w-full resize-none rounded-2xl bg-recessed p-4 text-[15px] leading-snug outline-none placeholder:text-ink-35"
              style={{ color: 'var(--ink-90)' }}
            />
            <div className="flex items-center gap-3">
              {!isLive && (
                <button
                  type="button"
                  onClick={useScriptedReply}
                  className="font-mono text-[11px] lowercase tracking-wide text-blue-ink"
                >
                  use sample reply ↘
                </button>
              )}
              <div className="flex-1" />
              <PillButton onClick={sendReply} disabled={!draft.trim()}>
                send →
              </PillButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* the clock controls — advance simulated time / advance the scene */}
      <div className="flex min-h-[52px] items-center justify-end pt-2">
        {stage === 'thinking' && (
          <span className="font-mono text-[11px] lowercase text-ink-35">dot is reading your week…</span>
        )}
        {(stage === 'await-clock' || stage === 'done') &&
          (isLast && stage === 'done' ? (
            <PillButton onClick={onNext}>see your story →</PillButton>
          ) : (
            <PillButton variant="ghost" onClick={() => setCi((c) => c + 1)}>
              ⏩ {nextAfter}
            </PillButton>
          ))}
      </div>
    </div>
  );
}

// ── The 988 care card — RISK_MESSAGE rendered VERBATIM. Care, not alarm: a calm
// raised blue card on the page, the crisis lines as embossed chips. Pulses in once
// (blur-up), then sits quietly — no pressure.
function RiskCard({ message }: { message: string }) {
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
        {/* VERBATIM — sample-story.json risk.message */}
        {message}
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
