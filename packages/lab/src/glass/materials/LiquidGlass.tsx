import { MeshTransmissionMaterial } from '@react-three/drei'
import { useControls } from 'leva'

// transmission-glass — the liquid-chrome skin. `distortion` is the domain-warp
// primitive living INSIDE the material: the refraction field wobbles like a melting
// surface. One leva folder, shared by every liquid body, so the whole scene stays
// ONE material idea (the reel's unifying trick). Tint stays clear/neutral — the
// accent is carried by the emissive ignite inside, never by the glass.
export function LiquidGlass({ tint = '#ffffff', ...over }: { tint?: string; [k: string]: any }) {
  const g = useControls('glass', {
    roughness: { value: 0.06, min: 0, max: 0.5 },
    thickness: { value: 0.45, min: 0, max: 3 },
    ior: { value: 1.34, min: 1, max: 2 },
    chromaticAberration: { value: 0.1, min: 0, max: 1.5 },
    anisotropicBlur: { value: 0.2, min: 0, max: 1 },
    distortion: { value: 0.3, min: 0, max: 1 },
    distortionScale: { value: 0.5, min: 0, max: 2 },
    temporalDistortion: { value: 0.18, min: 0, max: 1 },
    envMapIntensity: { value: 1.6, min: 0, max: 4 },
  })
  return (
    <MeshTransmissionMaterial
      attach="material"
      transmission={1}
      samples={6}
      resolution={384}
      color={tint}
      {...g}
      {...over}
    />
  )
}
