import * as THREE from 'three'

// lerp-damping (KG primitive). expDamp = frame-rate-independent lagged follow.
// The jelly-slider node is explicit: the drag is a LAGGED LERP, never a spring —
// no overshoot while following.
export const expDamp = (current: number, target: number, rate: number, dt: number) =>
  THREE.MathUtils.lerp(current, target, 1 - Math.exp(-rate * dt))

const acc = new THREE.Vector3()

// Underdamped vector spring — the release settle: every RELEASE overshoots and
// settles wet. Used only for snapping home, not for drag-follow.
export class VSpring {
  vel = new THREE.Vector3()
  constructor(public stiffness = 100, public damping = 7) {}
  step(pos: THREE.Vector3, target: THREE.Vector3, dt: number) {
    acc.copy(target).sub(pos).multiplyScalar(this.stiffness)
    acc.addScaledVector(this.vel, -this.damping)
    this.vel.addScaledVector(acc, dt)
    pos.addScaledVector(this.vel, dt)
  }
}
