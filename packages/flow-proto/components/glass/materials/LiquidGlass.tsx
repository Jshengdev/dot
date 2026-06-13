import { MeshTransmissionMaterial } from '@react-three/drei'

// transmission-glass — the liquid-chrome skin. `distortion` is the domain-warp
// primitive living INSIDE the material: the refraction field wobbles like a melting
// surface. Fixed params (the lab's tuned values) — no leva panel in the product
// flow. Pass overrides for a lighter / more matte read. Tint stays clear/neutral —
// the accent is carried by the emissive ignite inside, never by the glass.
const GLASS = {
  roughness: 0.06,
  thickness: 0.45,
  ior: 1.34,
  chromaticAberration: 0.1,
  anisotropicBlur: 0.2,
  distortion: 0.3,
  distortionScale: 0.5,
  temporalDistortion: 0.18,
  envMapIntensity: 1.6,
}

export function LiquidGlass({ tint = '#ffffff', ...over }: { tint?: string; [k: string]: any }) {
  return (
    <MeshTransmissionMaterial
      attach="material"
      transmission={1}
      samples={6}
      resolution={384}
      color={tint}
      {...GLASS}
      {...over}
    />
  )
}
