import { useMemo, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { GlassScene } from '../glass/scene/GlassScene'
import { usePointer } from '../glass/interaction/pointer'
import { LiquidBody, Ball } from '../glass/components/LiquidBody'
import { LiquidGlass } from '../glass/materials/LiquidGlass'
import { expDamp } from '../glass/sim/damp'
import { PALETTE } from '../glass/palette'

// The glass dot — DOT's hero, as a LIQUID metaball orb wearing the transmission skin.
// It breathes; a droplet of the same liquid sags toward your cursor and merges
// (stretching a neck); pressing it ignites a blue core that blooms (the activate beat).

const VOL = new THREE.Vector3(1.5, 1.5, 0.95)

function Orb() {
  const ptr = usePointer()
  const coreMat = useRef<THREE.MeshStandardMaterial>(null!)
  const active = useRef(0)
  const tmp = useMemo(() => ({ a: new THREE.Vector3() }), [])

  const push = (out: Ball[], x: number, y: number, z: number, s: number) =>
    out.push({ x: x / VOL.x, y: y / VOL.y, z: z / VOL.z, s })

  const balls = (t: number, dt: number, out: Ball[]) => {
    const lp = tmp.a.copy(ptr.smooth) // orb sits at group origin
    const near = Math.hypot(lp.x, lp.y) < 1.7
    const want = ptr.down && near ? 1 : 0
    active.current = expDamp(active.current, want, 6, dt)
    const a = active.current

    // breathing main mass (+ a small swell when ignited)
    push(out, 0, 0, 0, 0.92 + 0.05 * Math.sin(t * 1.05) + a * 0.1)

    // three slow surface wobble balls — subtle liquid life
    for (let i = 0; i < 3; i++) {
      const ang = t * 0.5 + i * 2.0944
      push(out, Math.cos(ang) * 0.28, Math.sin(ang * 1.1) * 0.24, Math.sin(ang) * 0.12, 0.3)
    }

    // hover-melt: a droplet of the same liquid sags toward the cursor and merges.
    // Quadratic falloff kills the ghost when the cursor is far (no detached sphere).
    if (ptr.has) {
      const d = Math.hypot(lp.x, lp.y)
      const f = Math.max(0, 1 - d / 1.7)
      if (f > 0.05) push(out, lp.x, lp.y, 0, (0.5 + 0.3 * a) * f * f)
    }

    // the core is a TINY living point set back inside the glass — the lens magnifies
    // it, so keep it small + faint (a soft blue heartbeat, below the bloom threshold
    // so the orb reads as CLEAR glass), igniting past 1.0 only on press
    if (coreMat.current) coreMat.current.emissiveIntensity = Math.max(0, 0.07 + 0.08 * Math.sin(t * 1.4)) + a * 3.8
    return out
  }

  return (
    <group>
      {/* a tiny emissive heart, set back so the clear glass refracts (not floods) it */}
      <mesh position={[0, 0, -0.32]}>
        <sphereGeometry args={[0.12, 24, 24]} />
        <meshStandardMaterial
          ref={coreMat}
          color={PALETTE.accent}
          emissive={PALETTE.accent}
          emissiveIntensity={0.1}
          roughness={0.4}
          metalness={0}
          toneMapped={false}
        />
      </mesh>
      <LiquidBody resolution={56} subtract={9} balls={balls} scale={VOL.toArray()}>
        <LiquidGlass />
      </LiquidBody>
    </group>
  )
}

export default function GlassDot() {
  return (
    <div className="stage ring glass-stage">
      <div className="glass-host">
        <Canvas
          flat
          dpr={[1, 2]}
          gl={{ antialias: true, preserveDrawingBuffer: true }}
          camera={{ position: [0, 0, 5.4], fov: 35 }}
          onCreated={({ gl }) => (gl.toneMapping = THREE.NoToneMapping)}
        >
          <GlassScene>
            <Orb />
          </GlassScene>
        </Canvas>
      </div>
      <div className="glass-caption">hover to melt it toward you · press to ignite</div>
    </div>
  )
}
