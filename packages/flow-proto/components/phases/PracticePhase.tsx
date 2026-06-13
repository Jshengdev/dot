'use client';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bubble, TypingBubble, PillButton, Eyebrow } from '@/components/ui/atoms';
import { useDotVoice, prewarm } from '@/lib/voice';
import { PRACTICE, DOT, PRACTICE_TRANSCRIPT_PLACEHOLDER, SAMPLE_TRANSCRIPT } from '@/lib/script';

export default function PracticePhase({ onNext }: { onNext: () => void }) {
  const { speak } = useDotVoice();
  const [shown, setShown] = useState(0);
  const [typing, setTyping] = useState(false);
  const [done, setDone] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [ending, setEnding] = useState(false);
  const scRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    PRACTICE.forEach((t) => t.from === 'dot' && prewarm(t.text));
    prewarm(DOT.practiceClose);
    let i = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const play = () => {
      if (i >= PRACTICE.length) {
        setDone(true);
        return;
      }
      const turn = PRACTICE[i];
      if (turn.from === 'dot') {
        setTyping(true);
        timers.push(
          setTimeout(() => {
            setTyping(false);
            setShown((s) => Math.max(s, i + 1));
            speak(turn.text);
            i += 1;
            timers.push(setTimeout(play, 2600));
          }, 1100),
        );
      } else {
        setShown((s) => Math.max(s, i + 1));
        i += 1;
        timers.push(setTimeout(play, 1600));
      }
    };
    timers.push(setTimeout(play, 800));
    return () => timers.forEach(clearTimeout);
  }, [speak]);

  useEffect(() => {
    scRef.current?.scrollTo({ top: scRef.current.scrollHeight, behavior: 'smooth' });
  }, [shown, typing, done]);

  const end = async () => {
    setEnding(true);
    await speak(DOT.practiceClose);
    onNext();
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-[560px] flex-col px-6 pb-10 pt-16">
      <div className="mb-2 flex items-center gap-3">
        <span className="dot-mark dot-mark--breathe" />
        <div>
          <Eyebrow>practice · he&apos;s getting you</Eyebrow>
          <div className="text-[15px] font-medium">a couple of turns, then the real thing</div>
        </div>
      </div>

      <div ref={scRef} className="no-scrollbar flex flex-1 flex-col gap-1 overflow-y-auto py-4">
        {PRACTICE.slice(0, shown).map((t, idx) => (
          <Bubble key={idx} from={t.from}>
            {t.text}
          </Bubble>
        ))}
        <AnimatePresence>{typing && <TypingBubble />}</AnimatePresence>
      </div>

      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-3"
          >
            <Eyebrow>end the 15-min session — paste your transcript</Eyebrow>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={PRACTICE_TRANSCRIPT_PLACEHOLDER}
              className="no-scrollbar h-28 w-full resize-none rounded-2xl bg-recessed p-4 text-[14px] leading-snug outline-none placeholder:text-ink-35"
              style={{ color: 'var(--ink-90)' }}
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setTranscript(SAMPLE_TRANSCRIPT)}
                className="font-mono text-[11px] lowercase tracking-wide text-blue-ink"
              >
                use sample ↘
              </button>
              <div className="flex-1" />
              <PillButton onClick={end} disabled={ending}>
                {ending ? 'one sec…' : "i'm done →"}
              </PillButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
