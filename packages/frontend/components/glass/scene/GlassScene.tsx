'use client';
import { useMemo } from 'react';
import { Studio } from './Studio';
import { PostFX } from '../post/PostFX';
import { PointerField, PointerCtx, makePointer } from '../interaction/pointer';

// The shared glass scene wrapper: a fresh per-canvas pointer, the studio lighting, the
// interaction plane, and selective bloom. A panel does:
//   <Canvas><GlassScene><MyComponent/></GlassScene></Canvas>.
export function GlassScene({
  children,
  pointerZ = 0.45,
}: {
  children: React.ReactNode;
  pointerZ?: number;
}) {
  const pointer = useMemo(makePointer, []);
  return (
    <PointerCtx.Provider value={pointer}>
      <Studio />
      {children}
      <PointerField z={pointerZ} />
      <PostFX />
    </PointerCtx.Provider>
  );
}
