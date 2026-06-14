'use client';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import GlassDot from '@/components/GlassDotClient';
import { PillButton } from '@/components/ui/atoms';
import { useDotVoice, prewarm } from '@/lib/voice';
import { DOT } from '@/lib/script';

const EASE = [0.16, 1, 0.3, 1] as const;

export default function EnterPhase({ onNext }: { onNext: () => void }) {
  const { speak } = useDotVoice();
  const [caption, setCaption] = useState('');
  const [showUI, setShowUI] = useState(false);
  // total pokes so far. The first DOT.pokes.length pokes play the SEQUENTIAL
  // blurbs in order (wakes → greets → what she does → the idea → the invite);
  // every poke after that rotates DOT.pokesFun (short one-idea extras). The
  // begin CTA appears once she's introduced herself (poke 2 = "say. hello.").
  const [pokeIdx, setPokeIdx] = useState(0);

  useEffect(() => {
    prewarm(DOT.hi);
    DOT.pokes.forEach(prewarm);
    DOT.pokesFun.forEach(prewarm);
    // after the morph + "turn on", she says hi (autoplay may be blocked → poke talks)
    const t1 = setTimeout(() => {
      setCaption(DOT.hi);
      speak(DOT.hi);
    }, 2300);
    const t2 = setTimeout(() => setShowUI(true), 3100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [speak]);

  const poke = () => {
    const seq = DOT.pokes.length;
    // sequential first, then rotate the "fun" extras (never loop the intro)
    const line =
      pokeIdx < seq
        ? DOT.pokes[pokeIdx]
        : DOT.pokesFun[(pokeIdx - seq) % DOT.pokesFun.length];
    setPokeIdx((i) => i + 1);
    setCaption(line);
    speak(line);
    if (!showUI) setShowUI(true);
  };

  // she's said who she is by poke 2 → offer the begin affordance from then on
  const introduced = pokeIdx >= 2;

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-1 px-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.1, ease: EASE }}
        style={{ width: 'min(460px, 84vw)' }}
      >
        <GlassDot onPoke={poke} height={400} />
      </motion.div>

      <div className="flex min-h-[64px] flex-col items-center gap-1.5">
        <AnimatePresence mode="wait">
          {caption && (
            <motion.p
              key={caption}
              className="text-[22px]"
              style={{ fontWeight: 450, letterSpacing: '-0.02em' }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              {caption}
            </motion.p>
          )}
        </AnimatePresence>
        <motion.p
          className="font-mono text-[12px] lowercase tracking-wide text-ink-35"
          initial={{ opacity: 0 }}
          animate={{ opacity: showUI && !introduced ? 1 : 0 }}
          transition={{ duration: 0.6 }}
        >
          poke her
        </motion.p>
      </div>

      <div className="mt-2 h-12">
        <AnimatePresence>
          {introduced && (
            <PillButton key="begin" onClick={onNext}>
              tell me your story →
            </PillButton>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
