'use client';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

const EASE = [0.16, 1, 0.3, 1] as const;

export function PillButton({
  children,
  onClick,
  variant = 'primary',
  className = '',
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost';
  className?: string;
  disabled?: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`pill ${variant === 'ghost' ? 'pill--ghost' : ''} ${className}`}
      style={disabled ? { opacity: 0.5, pointerEvents: 'none' } : undefined}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      whileTap={{ y: 1 }}
    >
      {children}
    </motion.button>
  );
}

export function Bubble({ from, children, delay = 0 }: { from: 'dot' | 'user'; children: ReactNode; delay?: number }) {
  return (
    <motion.div
      className={`bubble bubble--${from === 'dot' ? 'ai' : 'user'}`}
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.42, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

export function TypingBubble() {
  return (
    <motion.div className="typing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
      <span /><span /><span />
    </motion.div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="font-mono text-[11px] lowercase tracking-wide text-ink-35">{children}</div>;
}
