'use client';
import { useEffect, useState } from 'react';
import type { Reflection } from '@dot/backend';
import { TextBubble, StatBubble, ChipRow, DeltaBubble } from './RichBubbles';
import { ProviderReport } from './ProviderReport';
import { GlassDotStage } from './GlassDotStage';

// The spiral, split into the bubbles the user "sent" (the iMessage thread). EDITABLE
// demo COPY — matches the backend DEMO_SPIRAL / DEMO-SCRIPT [1:00].
const SPIRAL_BUBBLES = [
  'Today was awful.',
  'My friends barely replied, I\'m always the one reaching out — they\'re probably tired of me.',
  'My chest was tight all afternoon.',
  'I feel like I\'m falling apart and everyone can see it.',
];

type Status = 'idle' | 'running' | 'done' | 'failed';

// Which stat kinds to surface as count-up bubbles (the real 19-vs-12 / 48-texts
// counter-evidence). Order = the demo reveal order; each maps to a real events.kind.
const HERO_STAT_KINDS = ['message_received', 'conversation_initiated', 'call'];

export function ThreadSurface() {
  const [status, setStatus] = useState<Status>('idle');
  const [reflection, setReflection] = useState<Reflection | null>(null);
  const [error, setError] = useState<string | null>(null);

  // beat is the staged reveal index — each tick unblurs the next group of bubbles.
  const [beat, setBeat] = useState(0);

  async function run() {
    setStatus('running');
    setError(null);
    setReflection(null);
    setBeat(0);
    try {
      const res = await fetch('/api/run', { method: 'GET' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `run failed (${res.status})`);
      setReflection(data as Reflection);
      setStatus('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus('failed');
    }
  }

  // Auto-run once on mount (the demo path fires immediately).
  useEffect(() => {
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stage the reveal beat by beat once the reflection lands (blur-up between each).
  useEffect(() => {
    if (status !== 'done') return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    // 7 beats: validate · subjective · objective-label · stats · delta · report.
    for (let i = 1; i <= 7; i++) {
      timers.push(setTimeout(() => setBeat(i), 700 * i));
    }
    return () => timers.forEach(clearTimeout);
  }, [status]);

  const heroStats =
    reflection?.stats.filter((s) => HERO_STAT_KINDS.includes(s.kind)) ?? [];

  // Find the friend-vs-you split for the spoken objective line (the 19-vs-12 catch).
  const friendInitiated = reflection?.stats.find((s) => s.kind === 'conversation_initiated');

  return (
    <div className="surface">
      <header className="surface-head">
        <span className="dot-mark" aria-hidden="true" />
        <span className="surface-title">dot</span>
        <span className="surface-sub">the objective mirror</span>
        <span className={`mode-badge mode-${status}`}>
          {status === 'running' && 'reflecting · live grok'}
          {status === 'done' && `real · ${reflection?.model ?? 'grok'}`}
          {status === 'failed' && 'failed'}
          {status === 'idle' && 'idle'}
        </span>
      </header>

      <div className="thread">
        {/* the user's spiral — grey bubbles, left (the human speaks) */}
        {SPIRAL_BUBBLES.map((b, i) => (
          <TextBubble key={i} sender="user" tail={i === SPIRAL_BUBBLES.length - 1}>
            {b}
          </TextBubble>
        ))}

        {/* the glass dot reveals — DOT's hero, thinking */}
        <div className="glass-stage ring-showcase">
          <div className="glass-host">
            <GlassDotStage />
          </div>
          <div className="glass-caption">
            {status === 'running' ? 'dot is reflecting…' : 'press to ignite'}
          </div>
        </div>

        {status === 'failed' && (
          <div className="fail-badge">
            <span className="fail-dot" /> FAILED · {error}
            <button className="retry-key" onClick={() => void run()}>
              retry →
            </button>
          </div>
        )}

        {status === 'done' && reflection && (
          <>
            {/* beat 1 — validate first ("the chest tightness is real") */}
            {beat >= 1 && (
              <TextBubble sender="ai">{reflection.feelingValidation}</TextBubble>
            )}

            {/* beat 2 — subjective: the story the anxiety told (felt claims) */}
            {beat >= 2 && (
              <>
                <TextBubble sender="ai" tail={false}>
                  here&apos;s the story you told yourself:
                </TextBubble>
                <ChipRow chips={reflection.story.subjective} tone="felt" />
              </>
            )}

            {/* beat 3 — objective: the facts (label + the real counts) */}
            {beat >= 3 && (
              <TextBubble sender="ai" tail={false}>
                and here&apos;s what the record actually shows:
              </TextBubble>
            )}

            {/* beat 4 — the stat aggregates count up (the 48 texts / 19-vs-12 / 7 calls) */}
            {beat >= 4 && (
              <div className="stat-strip">
                {heroStats.map((s) => (
                  <StatBubble key={s.kind} value={s.count} label={`${s.label} · ${s.window}`} />
                ))}
              </div>
            )}

            {/* beat 5 — the objective facts as chips (extracted from the story) */}
            {beat >= 5 && <ChipRow chips={reflection.story.objective} tone="fact" />}

            {/* beat 6 — THE DELTA: the catch line (the demo moment) */}
            {beat >= 6 && (
              <DeltaBubble>
                {reflection.story.delta}
                {friendInitiated ? (
                  <div className="delta-foot">it doesn&apos;t tell you you&apos;re fine — it shows you the gap. you mean.</div>
                ) : null}
              </DeltaBubble>
            )}

            {/* beat 7 — the provider report (SOAP S/O only) */}
            {beat >= 7 && <ProviderReport report={reflection.report} />}
          </>
        )}
      </div>
    </div>
  );
}
