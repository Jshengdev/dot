import { EffectComposer, Bloom } from '@react-three/postprocessing'

// Selective bloom by luminance: only emissives pushed past 1.0 ignite (the blue
// activate beat). Bloom on the accent beat only — no vignette, no grain. The glass
// itself must NOT bloom.
export function PostFX() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom mipmapBlur intensity={0.85} luminanceThreshold={1.0} luminanceSmoothing={0.25} />
    </EffectComposer>
  )
}
