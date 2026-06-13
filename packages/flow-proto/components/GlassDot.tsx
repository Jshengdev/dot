'use client';
import { useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { GlassScene } from './glass/scene/GlassScene';
import { usePointer } from './glass/interaction/pointer';
import { LiquidBody, Ball } from './glass/components/LiquidBody';
import { LiquidGlass } from './glass/materials/LiquidGlass';
import { expDamp } from './glass/sim/damp';
import { PALETTE } from './glass/palette';

// DOT's avatar — a liquid glass orb that MORPHS into being (droplets converge), then
// a lighter, matte, semi-transparent core "turns on" and BLINKS inside the glass.
// Poke it → it flares + squishes (the parent plays his voice line).

const VOL = new THREE.Vector3(1.5, 1.5, 0.95);
const CORE = '#86bdff'; // lighter, lower-saturation blue (the inner presence)

function Orb({ pokeRef }: { pokeRef: React.MutableRefObject<number> }) {
  const ptr = usePointer();
  const groupRef = useRef<THREE.Group>(null!);
  const coreMat = useRef<THREE.MeshStandardMaterial>(null!);
  const poke = useRef(0);
  const tmp = useMemo(() => ({ a: new THREE.Vector3() }), []);

  const push = (out: Ball[], x: number, y: number, z: number, s: number) =>
    out.push({ x: x / VOL.x, y: y / VOL.y, z: z / VOL.z, s });

  const balls = (t: number, dt: number, out: Ball[]) => {
    // intro: droplets converge + the orb grows in (pops up + morphs together)
    const introRaw = Math.min(1, t / 1.6);
    const intro = 1 - Math.pow(1 - introRaw, 3);

    push(out, 0, 0, 0, 0.2 + intro * 0.72 + poke.current * 0.06);

    // converging seed droplets — visible early, merge away as intro completes
    if (intro < 0.999) {
      const r = (1 - intro) * 0.95;
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + 0.4;
        push(out, Math.cos(a) * r, Math.sin(a) * r, Math.sin(a) * 0.15, 0.34 * (1 - intro));
      }
    }

    // settled surface life — three slow wobble balls (fade in with intro)
    for (let i = 0; i < 3; i++) {
      const ang = t * 0.5 + i * 2.0944;
      push(out, Math.cos(ang) * 0.28, Math.sin(ang * 1.1) * 0.24, Math.sin(ang) * 0.12, 0.3 * intro);
    }

    // hover-melt droplet toward the cursor (after the morph)
    if (intro > 0.85 && ptr.has) {
      const lp = tmp.a.copy(ptr.smooth);
      const d = Math.hypot(lp.x, lp.y);
      const f = Math.max(0, 1 - d / 1.7);
      if (f > 0.05) push(out, lp.x, lp.y, 0, 0.45 * f * f);
    }

    // ── the inner core: turns on, breathes, blinks like an eye, flares on poke ──
    poke.current = expDamp(poke.current, 0, 4, dt);
    const turnOn = THREE.MathUtils.clamp((t - 0.45) / 1.0, 0, 1);
    const breathe = 0.5 + 0.12 * Math.sin(t * 1.1);
    const bp = t % 3.4; // an eye-blink every 3.4s (quick dip, never a flash)
    const blink = bp < 0.16 ? 0.12 + 0.88 * Math.abs(Math.cos((bp / 0.16) * Math.PI)) : 1;
    if (coreMat.current) coreMat.current.emissiveIntensity = turnOn * breathe * blink * 0.95 + poke.current * 2.4;

    // squish on poke (a gentle compress + ease back — nothing bounces)
    if (groupRef.current) {
      const s = 1 - poke.current * 0.12;
      groupRef.current.scale.set(s, 1 - poke.current * 0.04, s);
    }
    return out;
  };

  return (
    <group ref={groupRef}>
      {/* the inner presence — lighter, matte, semi-transparent, refracted by the glass */}
      <mesh position={[0, 0, -0.18]}>
        <sphereGeometry args={[0.26, 32, 32]} />
        <meshStandardMaterial
          ref={coreMat}
          color={CORE}
          emissive={CORE}
          emissiveIntensity={0}
          roughness={0.75}
          metalness={0}
          transparent
          opacity={0.82}
          toneMapped={false}
        />
      </mesh>
      <LiquidBody resolution={56} subtract={9} balls={balls} scale={VOL.toArray()}>
        {/* a touch more matte + less mirror than the lab hero (lighter read) */}
        <LiquidGlass roughness={0.12} envMapIntensity={1.15} thickness={0.5} />
      </LiquidBody>
    </group>
  );
}

export default function GlassDot({
  onPoke,
  className = '',
  height = 360,
}: {
  onPoke?: () => void;
  className?: string;
  height?: number;
}) {
  const pokeRef = useRef(0);
  return (
    <div
      className={className}
      style={{ width: '100%', height, cursor: 'pointer' }}
      onPointerDown={() => {
        pokeRef.current = 1;
        onPoke?.();
      }}
      aria-label="dot"
      role="button"
    >
      <Canvas
        flat
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0, 5.2], fov: 35 }}
        onCreated={({ gl }) => (gl.toneMapping = THREE.NoToneMapping)}
        style={{ background: 'transparent' }}
      >
        <GlassScene transparentBg>
          <Orb pokeRef={pokeRef} />
        </GlassScene>
      </Canvas>
    </div>
  );
}
