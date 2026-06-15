import { useRef, useState } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { useControls } from 'leva';
import * as THREE from 'three';
import { GlassScene } from '../glass/scene/GlassScene';
import { PALETTE } from '../glass/palette';

// ─────────────────────────────────────────────────────────────────────────────
// THE STORY SPIRAL — bridging the glass-slat torus reference into DOT's language.
//
// The story's pieces (the live knowledge graph's nodes) become flat glass SLATS
// fanned around a central void in a slow spiral. Calm + clean-blue, far fewer
// slats than the reference, lots of air — light, not lines. Each slat is a flat
// 2D card living in 3D space; CLICK one and it transforms out of the spiral to
// face you, flat-on, while a clean 2D card states it (clarity + focus — the
// "2D moving in 3D" beat). Click again / the scrim and it eases back into the ring.
//
// Prototype data: representative DOT graph nodes. In the app these come from
// /api/graph (the live spiral = the live story). Tune the shape live via the
// "spiral" leva folder, then graft into PanelsPhase once the feel is right.
// ─────────────────────────────────────────────────────────────────────────────

type Slat = { label: string; tone: 'symptom' | 'fact' | 'felt' | 'risk' | 'time' };

// the live story, as slats (loud → quiet); the real app feeds these from the graph.
const SLATS: Slat[] = [
  { label: 'panic before study group', tone: 'symptom' },
  { label: "chest so tight i can't breathe", tone: 'symptom' },
  { label: 'hands go numb', tone: 'symptom' },
  { label: 'every morning · 6 days', tone: 'time' },
  { label: 'scratching arms to stay calm', tone: 'risk' },
  { label: 'only ~3 hours of sleep', tone: 'fact' },
  { label: '“i’m probably just dramatic”', tone: 'felt' },
  { label: 'panic logged 6 of 6 days', tone: 'fact' },
  { label: '“the week was fine, lowkey”', tone: 'felt' },
  { label: 'wanting to sleep forever', tone: 'risk' },
  { label: 'two club nights in a row', tone: 'time' },
  { label: 'the gap · said fine, lived heavy', tone: 'fact' },
];

// clean-blue tints by tone — one accent, just lighter/deeper steps of it (never a
// second hue; the prismatic edge comes from the glass itself, not from color).
const TONE_TINT: Record<Slat['tone'], string> = {
  felt: '#eaf1fb', // muted — the told version
  symptom: '#dcebff',
  time: '#e6f0ff',
  fact: '#cfe4ff', // the record, a touch deeper blue
  risk: '#bfdcff',
};

const DAMP = 6; // lerp rate toward a slat's target pose (calm, no bounce)

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function SpiralField({ focused, setFocused }: { focused: number | null; setFocused: (i: number | null) => void }) {
  const slatRefs = useRef<(THREE.Group | null)[]>([]);
  const spin = useRef(0);

  const c = useControls('spiral', {
    radius: { value: 1.95, min: 0.8, max: 3 },
    depth: { value: 1.5, min: 0, max: 4 },
    turns: { value: 1.35, min: 0.5, max: 3 },
    pitch: { value: 0.6, min: 0, max: 1.6 }, // blade tilt (the fan)
    twist: { value: 0.18, min: -0.6, max: 0.6 }, // progressive fan
    spin: { value: 0.1, min: 0, max: 0.8 }, // auto-rotate speed (calm)
    slatW: { value: 0.62, min: 0.2, max: 1.4 },
    slatH: { value: 1.55, min: 0.5, max: 3 },
  });

  const N = SLATS.length;

  useFrame((_, dtRaw) => {
    const dt = Math.min(0.05, dtRaw); // clamp (tab refocus) so nothing jumps
    const k = Math.min(1, dt * DAMP);
    spin.current += dt * c.spin;
    for (let i = 0; i < N; i++) {
      const g = slatRefs.current[i];
      if (!g) continue;
      const t = N === 1 ? 0 : i / (N - 1);
      const a = spin.current + t * c.turns * Math.PI * 2;
      const isF = focused === i;

      // target pose: the spiral seat, OR (focused) center-front, flat, enlarged.
      const tx = isF ? 0 : Math.cos(a) * c.radius;
      const ty = isF ? 0 : Math.sin(a) * c.radius;
      const tz = isF ? 2.3 : (t - 0.5) * c.depth;
      const sTarget = isF ? 1.75 : 1;

      g.position.x = lerp(g.position.x, tx, k);
      g.position.y = lerp(g.position.y, ty, k);
      g.position.z = lerp(g.position.z, tz, k);
      const s = lerp(g.scale.x, sTarget, k);
      g.scale.setScalar(s);

      const rz = isF ? 0 : a + Math.PI / 2; // tangent to the ring
      const rx = isF ? 0 : c.pitch; // the fan tilt
      const ry = isF ? 0 : t * c.twist * Math.PI; // progressive twist
      g.rotation.x = lerp(g.rotation.x, rx, k);
      g.rotation.y = lerp(g.rotation.y, ry, k);
      g.rotation.z = lerp(g.rotation.z, rz, k);
    }
  });

  return (
    <group>
      {SLATS.map((slat, i) => (
        <group
          key={i}
          ref={(el) => {
            slatRefs.current[i] = el;
          }}
        >
          <RoundedBox
            args={[c.slatW, c.slatH, 0.05]}
            radius={0.05}
            smoothness={4}
            onPointerOver={(e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation();
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              document.body.style.cursor = '';
            }}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation();
              setFocused(focused === i ? null : i);
            }}
          >
            {/* glass with a fine prismatic edge — three's built-in transmission
                (one shared pass, light) + iridescence for the chromatic rim. */}
            <meshPhysicalMaterial
              transmission={1}
              thickness={0.55}
              roughness={0.07}
              ior={1.4}
              iridescence={1}
              iridescenceIOR={1.3}
              iridescenceThicknessRange={[120, 440]}
              clearcoat={1}
              clearcoatRoughness={0.12}
              envMapIntensity={1.5}
              color={new THREE.Color(TONE_TINT[slat.tone])}
              transparent
              toneMapped={false}
            />
          </RoundedBox>
        </group>
      ))}
    </group>
  );
}

export default function GlassSpiral() {
  const [focused, setFocused] = useState<number | null>(null);
  const node = focused !== null ? SLATS[focused] : null;

  return (
    <div className="stage ring glass-stage">
      <div className="glass-host" style={{ position: 'relative' }}>
        <Canvas
          flat
          dpr={[1, 2]}
          gl={{ antialias: true, preserveDrawingBuffer: true }}
          camera={{ position: [0, 0, 6.2], fov: 38 }}
          onCreated={({ gl }) => (gl.toneMapping = THREE.NoToneMapping)}
        >
          <GlassScene>
            <SpiralField focused={focused} setFocused={setFocused} />
          </GlassScene>
        </Canvas>

        {/* the FOCUS card — a clean 2D card (real DOM) over the 3D slat that came
            forward. clean-blue, no borders (depth from light), blur-up in. */}
        {node && (
          <div
            onClick={() => setFocused(null)}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              background: 'rgba(11,22,32,0.06)',
              backdropFilter: 'blur(2px)',
              cursor: 'pointer',
              animation: 'spiralFocusIn 0.45s cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                cursor: 'default',
                maxWidth: 300,
                padding: '20px 22px',
                borderRadius: 20,
                background: '#ffffff',
                color: '#0b1620',
                textAlign: 'center',
                boxShadow:
                  'inset 0 0 0 1px rgba(255,255,255,0.9), 0 0 0 1px rgba(0,122,255,0.18), 0 14px 40px rgba(0,122,255,0.16)',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#007AFF',
                  marginBottom: 10,
                }}
              >
                from your story
              </div>
              <div style={{ fontSize: 18, lineHeight: 1.35, fontWeight: 450 }}>{node.label}</div>
              <button
                onClick={() => setFocused(null)}
                style={{
                  marginTop: 16,
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: 11,
                  textTransform: 'lowercase',
                  color: '#6b7a90',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                back to the spiral ↩
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="glass-caption">
        the story, spiralled · click a slat to bring it forward {PALETTE.accent ? '' : ''}
      </div>

      <style>{`@keyframes spiralFocusIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
    </div>
  );
}
