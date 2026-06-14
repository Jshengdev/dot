import { useMemo, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Text, RoundedBox } from '@react-three/drei'
import { useControls } from 'leva'
import * as THREE from 'three'
import { GlassScene } from '../glass/scene/GlassScene'
import { usePointer } from '../glass/interaction/pointer'
import { LiquidBody, Ball } from '../glass/components/LiquidBody'
import { LiquidGlass } from '../glass/materials/LiquidGlass'
import { expDamp } from '../glass/sim/damp'
import { PALETTE } from '../glass/palette'

// The jelly slider, retinted clean-blue. The fill is a liquid
// mass whose head follows the drag with a LAGGED LERP (lag, not spring) while the
// trailing body balls follow at slower rates — fast drags stretch the mass into a
// neck that pinches off, all emergent from the metaball field. A BLUE strip light
// inside the slot is what the glass refracts; it ignites on drag (the activate beat).

const SLOT = { cx: -0.2, cy: 0.02, hw: 1.25, hh: 0.27 }
const BLOB = new THREE.Vector3(SLOT.cx, SLOT.cy, 0.22)
const VOL = new THREE.Vector3(1.85, 0.6, 0.45)
const K = 5
const RATES = [2.2, 3.4, 4.8, 6.8, 10] // tail slow → the smear

function Slider() {
  const ptr = usePointer()
  const v = useRef(0.48)
  const vs = useRef(0.48)
  const xs = useRef<number[]>(Array.from({ length: K }, (_, i) => SLOT.cx - SLOT.hw + ((i + 1) / K) * 0.48 * 2 * SLOT.hw))
  const dragging = useRef(false)
  const labelRef = useRef<any>(null)
  const glowRef = useRef<THREE.Mesh>(null!)
  const glowMat = useRef<THREE.MeshStandardMaterial>(null!)
  const glowI = useRef(0.35)
  const tmp = useMemo(() => ({ a: new THREE.Vector3() }), [])

  const exp = useControls('slider', {
    headSize: { value: 0.66, min: 0.2, max: 1.2 },
    bodySize: { value: 0.48, min: 0.1, max: 1 },
    followRate: { value: 7, min: 1, max: 16 },
    idleWobble: { value: 0.05, min: 0, max: 0.2 },
  })

  const push = (out: Ball[], x: number, y: number, z: number, s: number) =>
    out.push({ x: (x - BLOB.x) / VOL.x, y: (y - BLOB.y) / VOL.y, z: (z - BLOB.z) / VOL.z, s })

  const balls = (t: number, dt: number, out: Ball[]) => {
    const lp = tmp.a.copy(ptr.pos) // slider sits at group origin
    const x0 = SLOT.cx - SLOT.hw
    const inSlot = Math.abs(lp.x - SLOT.cx) < SLOT.hw + 0.35 && Math.abs(lp.y - SLOT.cy) < SLOT.hh + 0.35

    if (ptr.down && inSlot) dragging.current = true
    if (!ptr.down) dragging.current = false
    if (dragging.current) v.current = THREE.MathUtils.clamp((lp.x - x0) / (2 * SLOT.hw), 0, 1)

    vs.current = expDamp(vs.current, v.current, exp.followRate, dt)
    const headX = x0 + vs.current * 2 * SLOT.hw

    const xMin = x0 + 0.18
    const xMax = x0 + 2 * SLOT.hw - 0.18
    const mass = 0.45 + 0.55 * vs.current
    push(out, xMin, SLOT.cy, BLOB.z, 0.5 * mass)
    for (let i = 0; i < K; i++) {
      const fx = x0 + ((i + 1) / K) * (headX - x0)
      xs.current[i] = expDamp(xs.current[i], fx, RATES[i], dt)
      const wob = Math.sin(t * 2.1 + i * 1.35) * exp.idleWobble
      const s = i === K - 1 ? exp.headSize : THREE.MathUtils.lerp(0.42, 0.3, i / K) * (exp.bodySize / 0.34)
      push(out, THREE.MathUtils.clamp(xs.current[i], xMin, xMax), SLOT.cy + wob, BLOB.z, s * mass)
    }

    if (!dragging.current && ptr.has && inSlot) {
      const d = Math.abs(lp.y - SLOT.cy) + Math.max(0, Math.abs(lp.x - SLOT.cx) - SLOT.hw)
      const f = Math.max(0, 1 - d / 0.7)
      if (f > 0.05) push(out, lp.x, lp.y, BLOB.z, 0.34 * f * f)
    }

    const w = Math.max(0.05, headX - x0)
    glowRef.current.scale.x = w
    glowRef.current.position.x = x0 + w / 2
    glowI.current = expDamp(glowI.current, dragging.current ? 1.25 : 0.4, 6, dt)
    glowMat.current.emissiveIntensity = glowI.current

    if (labelRef.current) {
      const txt = `${Math.round(vs.current * 100)}%`
      if (labelRef.current.text !== txt) {
        labelRef.current.text = txt
        labelRef.current.sync?.()
      }
    }
    return out
  }

  return (
    <group>
      <RoundedBox args={[3.7, 1.55, 0.14]} radius={0.1} smoothness={4}>
        <meshStandardMaterial color={PALETTE.card} roughness={0.5} metalness={0.04} />
      </RoundedBox>
      <RoundedBox args={[2.66, 0.58, 0.05]} radius={0.16} smoothness={4} position={[SLOT.cx, SLOT.cy, 0.075]}>
        <meshStandardMaterial color={PALETTE.slotDeep} roughness={0.7} metalness={0.1} />
      </RoundedBox>
      <mesh ref={glowRef} position={[SLOT.cx, SLOT.cy, 0.115]}>
        <boxGeometry args={[1, 0.18, 0.015]} />
        <meshStandardMaterial ref={glowMat} color="#06204a" emissive={PALETTE.accent} emissiveIntensity={0.4} toneMapped={false} />
      </mesh>
      <Text ref={labelRef} position={[SLOT.cx + SLOT.hw + 0.62, SLOT.cy, 0.09]} fontSize={0.26} color={PALETTE.cardText} anchorX="center" anchorY="middle">
        48%
      </Text>
      <LiquidBody resolution={48} subtract={9} balls={balls} position={BLOB.toArray()} scale={VOL.toArray()}>
        <LiquidGlass tint="#ffffff" envMapIntensity={2.4} thickness={0.35} />
      </LiquidBody>
    </group>
  )
}

export default function GlassSlider() {
  return (
    <div className="stage ring glass-stage">
      <div className="glass-host glass-host--short">
        <Canvas
          flat
          dpr={[1, 2]}
          gl={{ antialias: true, preserveDrawingBuffer: true }}
          camera={{ position: [0, 0, 7], fov: 32 }}
          onCreated={({ gl }) => (gl.toneMapping = THREE.NoToneMapping)}
        >
          <GlassScene>
            <Slider />
          </GlassScene>
        </Canvas>
      </div>
      <div className="glass-caption">drag the fill — fast drags stretch a neck that pinches off</div>
    </div>
  )
}
