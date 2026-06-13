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
  const [pokeIdx, setPokeIdx] = useState(0);

  useEffect(() => {
    prewarm(DOT.hi);
    DOT.pokes.forEach(prewarm);
    // after the morph + "turn on", he says hi (autoplay may be blocked → poke talks)
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
    const line = DOT.pokes[pokeIdx % DOT.pokes.length];
    setPokeIdx((i) => i + 1);
    setCaption(line);
    speak(line);
    if (!showUI) setShowUI(true);
  };

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
          animate={{ opacity: showUI ? 1 : 0 }}
          transition={{ duration: 0.6 }}
        >
          poke him
        </motion.p>
      </div>

      <div className="mt-2 h-12">
        {showUI && <PillButton onClick={onNext}>begin →</PillButton>}
      </div>
    </div>
  );
}
