'use client';
import { useMemo } from 'react';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { PALETTE } from '../palette';

// The studio that makes glass read as WET CHROME (ported from
// packages/lab/src/glass/scene/Studio.tsx, source untouched). Long thin strip
// lights become the streak highlights along every curved silhouette; a cool light
// room with a soft vertical gradient backdrop gives the clear glass something to
// refract. No fog, no vignette, no grain.
export function Studio() {
  // a vertical cool gradient the glass bends — the classic glass-reads-on-light trick
  const grad = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 4;
    c.height = 256;
    const ctx = c.getContext('2d')!;
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0.0, '#f6f9fc');
    g.addColorStop(0.52, '#e7edf3');
    g.addColorStop(1.0, '#d2dae3');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  return (
    <>
      <color attach="background" args={[PALETTE.page]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 6, 6]} intensity={1.0} />
      {/* gradient backdrop — basic (unlit) so it stays a clean gradient to refract */}
      <mesh position={[0, 0, -1.8]}>
        <planeGeometry args={[44, 26]} />
        <meshBasicMaterial map={grad} toneMapped={false} />
      </mesh>
      <Environment resolution={256}>
        {/* key streak — the long top highlight every blob wears */}
        <Lightformer form="rect" intensity={5} position={[0, 4, 4]} scale={[10, 1, 1]} target={[0, 0, 0]} />
        {/* broad soft front sheen */}
        <Lightformer form="rect" intensity={1.2} position={[0, 2, 7]} scale={[14, 4, 1]} target={[0, 0, 0]} />
        {/* cool side streak — a second crisp edge on the chrome */}
        <Lightformer form="rect" intensity={3} position={[-5, -1, 3]} rotation-z={Math.PI / 2} scale={[6, 0.7, 1]} target={[0, 0, 0]} />
        {/* faint cool underlight — wet underside, kept blue not warm */}
        <Lightformer form="rect" intensity={1.1} color="#bcd6ff" position={[4, -3, 2]} scale={[5, 0.6, 1]} target={[0, 0, 0]} />
      </Environment>
    </>
  );
}
