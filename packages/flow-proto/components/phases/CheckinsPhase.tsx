'use client';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bubble, TypingBubble, PillButton, Eyebrow } from '@/components/ui/atoms';
import { useDotVoice, prewarm } from '@/lib/voice';
import { CHECKINS, type Turn } from '@/lib/script';

type Item = { kind: 'meta'; after: string; objective: string } | { kind: 'turn'; turn: Turn };

export default function CheckinsPhase({ onNext }: { onNext: () => void }) {
  const { speak } = useDotVoice();
  const [ci, setCi] = useState(-1); // current check-in index being played
  const [items, setItems] = useState<Item[]>([]);
  const [typing, setTyping] = useState(false);
  const [ciDone, setCiDone] = useState(false);
  const scRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    CHECKINS.forEach((c) => c.turns.forEach((t) => t.from === 'dot' && prewarm(t.text)));
  }, []);

  useEffect(() => {
    if (ci < 0) return;
    const c = CHECKINS[ci];
    setCiDone(false);
    setItems((it) => [...it, { kind: 'meta', after: c.after, objective: c.objective }]);
    let i = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const play = () => {
      if (i >= c.turns.length) {
        setCiDone(true);
        return;
      }
      const turn = c.turns[i];
      if (turn.from === 'dot') {
        setTyping(true);
        timers.push(
          setTimeout(() => {
            setTyping(false);
            setItems((it) => [...it, { kind: 'turn', turn }]);
            speak(turn.text);
            i += 1;
            timers.push(setTimeout(play, 2400));
          }, 1000),
        );
      } else {
        setItems((it) => [...it, { kind: 'turn', turn }]);
        i += 1;
        timers.push(setTimeout(play, 1500));
      }
    };
    timers.push(setTimeout(play, 700));
    return () => timers.forEach(clearTimeout);
  }, [ci, speak]);

  useEffect(() => {
    scRef.current?.scrollTo({ top: scRef.current.scrollHeight, behavior: 'smooth' });
  }, [items, typing, ciDone]);

  const last = ci >= CHECKINS.length - 1;
  const nextAfter = CHECKINS[ci + 1]?.after;
  const idle = ci < 0 || ciDone;

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-[560px] flex-col px-6 pb-10 pt-16">
      <div className="mb-2 flex items-center gap-3">
        <span className="dot-mark dot-mark--breathe" />
        <div>
          <Eyebrow>check-ins · objective reminders, days later</Eyebrow>
          <div className="text-[15px] font-medium">good reminders — not &ldquo;are you ok&rdquo;</div>
        </div>
      </div>

      <div ref={scRef} className="no-scrollbar flex flex-1 flex-col gap-1 overflow-y-auto py-4">
        {ci < 0 && (
          <div className="my-auto text-center text-ink-35">
            <p className="font-mono text-[12px] lowercase">he said he&apos;d check in. simulate the wait →</p>
          </div>
        )}
        {items.map((it, idx) =>
          it.kind === 'meta' ? (
            <motion.div
              key={idx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="my-3 flex flex-col items-center gap-1"
            >
              <span className="font-mono text-[11px] lowercase tracking-wide text-ink-35">{it.after}</span>
              <span className="rounded-full bg-blue-tint px-3 py-1 font-mono text-[10px] lowercase text-blue-ink">
                objective · {it.objective}
              </span>
            </motion.div>
          ) : (
            <Bubble key={idx} from={it.turn.from}>
              {it.turn.text}
            </Bubble>
          ),
        )}
        <AnimatePresence>{typing && <TypingBubble />}</AnimatePresence>
      </div>

      <div className="flex h-12 items-center justify-end">
        {idle &&
          (last && ciDone ? (
            <PillButton onClick={onNext}>see your logs →</PillButton>
          ) : (
            <PillButton variant="ghost" onClick={() => setCi((c) => c + 1)}>
              ⏩ fast-forward to {nextAfter}
            </PillButton>
          ))}
      </div>
    </div>
  );
}
