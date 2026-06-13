import { useMemo } from 'react'
import { Studio } from './Studio'
import { PostFX } from '../post/PostFX'
import { PointerField, PointerCtx, makePointer } from '../interaction/pointer'

// The shared glass scene wrapper: a fresh per-canvas pointer (so panels never leak
// into each other), the studio lighting, the interaction plane, and selective bloom.
// `transparentBg` → no opaque clear color + a compact radial backdrop, so the dot
// composites onto the page (the welcome room) instead of a full studio.
export function GlassScene({
  children,
  pointerZ = 0.45,
  transparentBg = false,
}: {
  children: React.ReactNode
  pointerZ?: number
  transparentBg?: boolean
}) {
  const pointer = useMemo(makePointer, [])
  return (
    <PointerCtx.Provider value={pointer}>
      <Studio transparentBg={transparentBg} />
      {children}
      <PointerField z={pointerZ} />
      <PostFX />
    </PointerCtx.Provider>
  )
}
