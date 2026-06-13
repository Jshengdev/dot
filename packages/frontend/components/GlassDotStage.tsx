'use client';
import { Component, type ReactNode } from 'react';
import dynamic from 'next/dynamic';

// The glass dot is the HERO — a live R3F WebGL shader (touches window). It MUST be
// client-only: next/dynamic { ssr:false } or the page crashes on server render
// (the Next SSR gotcha). p5 is NOT used; the lab hero is R3F.
const GlassDot = dynamic(() => import('./glass/GlassDot'), {
  ssr: false,
  loading: () => <div className="glass-fallback" aria-hidden="true" />,
});

// GlassDotStage — wraps the WebGL hero in an error boundary so a missing/blocked
// WebGL context (headless CI, an old GPU) degrades to a calm in-brand placeholder
// instead of taking down the whole reflection surface. The catch line, the stat
// aggregates, and the provider report MUST survive even if the dot can't paint.
// (Fail soft for the decorative hero; the grounded CONTENT is what carries the demo.)
class DotBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err: unknown) {
    // Log structurally (no silent swallow) — but keep the surface alive.
    console.error('[glass-dot] WebGL render failed, showing placeholder:', err);
  }
  render() {
    if (this.state.failed) {
      return <div className="glass-fallback glass-fallback--breathe" aria-hidden="true" />;
    }
    return this.props.children;
  }
}

export function GlassDotStage() {
  return (
    <DotBoundary>
      <GlassDot />
    </DotBoundary>
  );
}
