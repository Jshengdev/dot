'use client';
import { useEffect, useRef, useState } from 'react';

// hooks.ts — the two reveal hooks the rich bubbles use. The lab had none, so these
// are built in the locked clean-blue motion language (design/02-MOTION): the
// signature ease, count-up ONCE over --dur-stat (2600ms), reduced-motion honored.

const SIGNATURE = (t: number) => {
  // cubic-bezier(.16,1,.3,1) approximated as an ease-out cubic — fast-out, long
  // settle, nothing bounces (design/tokens.css --ease-signature).
  return 1 - Math.pow(1 - t, 3);
};

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * useInView — true once the element has scrolled into view (one-shot). Drives the
 * blur-up reveal of each bubble as the thread fills.
 */
export function useInView<T extends Element>(options?: IntersectionObserverInit): {
  ref: React.RefObject<T>;
  inView: boolean;
} {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setInView(true);
            io.disconnect();
          }
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.2, ...options },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, inView };
}

/**
 * useCountUp — count from 0 → target once when `active` flips true, over `duration`
 * ms on the signature ease. The ONE earned count-up beat (design/05-NEW-BRAND §6:
 * the stat numeral). Honors reduced-motion (snaps to target).
 */
export function useCountUp(target: number, active: boolean, duration = 2600): number {
  const [value, setValue] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (!active || started.current) return;
    started.current = true;
    if (prefersReducedMotion()) {
      setValue(target);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      setValue(Math.round(SIGNATURE(p) * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);
  return value;
}
