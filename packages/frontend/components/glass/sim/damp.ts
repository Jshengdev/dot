import * as THREE from 'three';

// lerp-damping. expDamp =
// frame-rate-independent lagged follow — never a spring, no overshoot while
// following. Used by the glass dot to ease the active-ignite value.
export const expDamp = (current: number, target: number, rate: number, dt: number) =>
  THREE.MathUtils.lerp(current, target, 1 - Math.exp(-rate * dt));
