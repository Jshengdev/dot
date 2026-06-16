import * as THREE from 'three'

// lerp-damping (KG primitive). expDamp = frame-rate-independent lagged follow.
// The jelly-slider node is explicit: the drag is a LAGGED LERP, never a spring —
// no overshoot while following.
export const expDamp = (current: number, target: number, rate: number, dt: number) =>
  THREE.MathUtils.lerp(current, target, 1 - Math.exp(-rate * dt))
