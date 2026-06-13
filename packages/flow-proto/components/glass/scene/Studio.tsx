import { useMemo } from 'react'
import { Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import { PALETTE } from '../palette'

// The studio that makes glass read as WET CHROME: long thin strip lights become the
// streak highlights along every curved silhouette (the reel's gloss signature). For
// the app, `transparentBg` swaps the full studio for a compact radial backdrop that
// fades to transparent — so the dot floats in the welcome room (the page shows
// through) while the glass still has a soft disc to refract.
export function Studio({ transparentBg = false }: { transparentBg?: boolean }) {
  const grad = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 4
    c.height = 256
    const ctx = c.getContext('2d')!
    const g = ctx.createLinearGradient(0, 0, 0, 256)
    g.addColorStop(0.0, '#f6f9fc')
    g.addColorStop(0.52, '#e7edf3')
    g.addColorStop(1.0, '#d2dae3')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 4, 256)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])

  // a soft cool disc fading to transparent — gives the glass something to refract
  // without painting the whole canvas (composites onto the page)
  const radial = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 256
    c.height = 256
    const ctx = c.getContext('2d')!
    const g = ctx.createRadialGradient(128, 128, 8, 128, 128, 128)
    g.addColorStop(0.0, 'rgba(236,243,250,1)')
    g.addColorStop(0.55, 'rgba(223,232,242,0.8)')
    g.addColorStop(1.0, 'rgba(223,232,242,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 256, 256)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])

  return (
    <>
      {!transparentBg && <color attach="background" args={[PALETTE.page]} />}
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 6, 6]} intensity={1.0} />
      {transparentBg ? (
        <mesh position={[0, 0, -1.1]}>
          <planeGeometry args={[6.2, 6.2]} />
          <meshBasicMaterial map={radial} transparent toneMapped={false} depthWrite={false} />
        </mesh>
      ) : (
        <mesh position={[0, 0, -1.8]}>
          <planeGeometry args={[44, 26]} />
          <meshBasicMaterial map={grad} toneMapped={false} />
        </mesh>
      )}
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={5} position={[0, 4, 4]} scale={[10, 1, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.2} position={[0, 2, 7]} scale={[14, 4, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={3} position={[-5, -1, 3]} rotation-z={Math.PI / 2} scale={[6, 0.7, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.1} color="#bcd6ff" position={[4, -3, 2]} scale={[5, 0.6, 1]} target={[0, 0, 0]} />
      </Environment>
    </>
  )
}
