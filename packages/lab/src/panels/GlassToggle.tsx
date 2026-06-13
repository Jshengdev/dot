import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Text, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { GlassScene } from '../glass/scene/GlassScene'
import { usePointer } from '../glass/interaction/pointer'
import { LiquidGlass } from '../glass/materials/LiquidGlass'
import { expDamp } from '../glass/sim/damp'
import { PALETTE } from '../glass/palette'

// A glass toggle. The knob is a round glass ball (the same transmission skin as the
// dot) that SLIDES on a lagged follow and squashes/stretches in the slide direction
// for the liquid feel. Flipping ON ignites the blue fill the glass refracts (the
// activate beat → bloom). Click anywhere on the track to flip.

const TRAVEL = 0.62
const LEFT = -0.98
const KNOB_Z = 0.24

function Toggle() {
  const ptr = usePointer()
  const on = useRef(false)
  const prevDown = useRef(false)
  const kx = useRef(-TRAVEL)
  const knobRef = useRef<THREE.Mesh>(null!)
  const fillI = useRef(0)
  const glowRef = useRef<THREE.Mesh>(null!)
  const glowMat = useRef<THREE.MeshStandardMaterial>(null!)
  const labelRef = useRef<any>(null)

  useFrame(({ clock }, dt) => {
    const lp = ptr.pos
    const inTrack = Math.abs(lp.x) < 1.25 && Math.abs(lp.y) < 0.7

    // click (down edge) inside the track flips the toggle
    if (ptr.down && !prevDown.current && inTrack) on.current = !on.current
    prevDown.current = ptr.down

    // lagged slide + squash-stretch in the direction of travel (the liquid feel)
    const target = on.current ? TRAVEL : -TRAVEL
    const prev = kx.current
    kx.current = expDamp(kx.current, target, 12, dt)
    const speed = THREE.MathUtils.clamp(Math.abs(kx.current - prev) / Math.max(dt, 0.001) / 6, 0, 0.45)
    const breathe = 1 + 0.015 * Math.sin(clock.elapsedTime * 1.3)
    knobRef.current.position.x = kx.current
    knobRef.current.scale.set((1 + speed) * breathe, (1 - speed * 0.6) * breathe, breathe)

    // the blue fill: left edge → knob; invisible off, ignites past 1.0 on (bloom)
    const w = Math.max(0.05, kx.current - LEFT)
    glowRef.current.scale.x = w
    glowRef.current.position.x = LEFT + w / 2
    fillI.current = expDamp(fillI.current, on.current ? 1.25 : 0.0, 7, dt)
    glowMat.current.emissiveIntensity = fillI.current

    if (labelRef.current) {
      const txt = on.current ? 'on' : 'off'
      if (labelRef.current.text !== txt) {
        labelRef.current.text = txt
        labelRef.current.sync?.()
      }
    }
  })

  return (
    <group>
      <RoundedBox args={[2.5, 1.1, 0.14]} radius={0.52} smoothness={5}>
        <meshStandardMaterial color={PALETTE.card} roughness={0.5} metalness={0.04} />
      </RoundedBox>
      <RoundedBox args={[2.18, 0.74, 0.05]} radius={0.36} smoothness={5} position={[0, 0, 0.07]}>
        <meshStandardMaterial color={PALETTE.slotDeep} roughness={0.7} metalness={0.1} />
      </RoundedBox>
      {/* the blue fill the glass refracts — base = slot tone (invisible off) */}
      <mesh ref={glowRef} position={[0, 0, 0.1]}>
        <boxGeometry args={[1, 0.46, 0.015]} />
        <meshStandardMaterial ref={glowMat} color={PALETTE.slotDeep} emissive={PALETTE.accent} emissiveIntensity={0} toneMapped={false} />
      </mesh>
      {/* the round glass knob */}
      <mesh ref={knobRef} position={[-TRAVEL, 0, KNOB_Z]}>
        <sphereGeometry args={[0.34, 48, 48]} />
        <LiquidGlass tint="#ffffff" envMapIntensity={2.2} thickness={0.5} />
      </mesh>
      <Text ref={labelRef} position={[0, -0.95, 0.09]} fontSize={0.2} color={PALETTE.cardText} anchorX="center" anchorY="middle" letterSpacing={0.06}>
        off
      </Text>
    </group>
  )
}

export default function GlassToggle() {
  return (
    <div className="stage ring glass-stage">
      <div className="glass-host glass-host--short">
        <Canvas
          flat
          dpr={[1, 2]}
          gl={{ antialias: true, preserveDrawingBuffer: true }}
          camera={{ position: [0, 0, 4.6], fov: 30 }}
          onCreated={({ gl }) => (gl.toneMapping = THREE.NoToneMapping)}
        >
          <GlassScene>
            <Toggle />
          </GlassScene>
        </Canvas>
      </div>
      <div className="glass-caption">click to flip — the knob squashes as it slides, the fill ignites</div>
    </div>
  )
}
