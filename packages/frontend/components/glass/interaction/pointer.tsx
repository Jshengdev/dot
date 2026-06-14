'use client';
import { createContext, useContext, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// A pointer in WORLD space on the interaction plane. One instance
// PER canvas (provided by <GlassScene>) so the cursor never leaks. Components read
// these refs in useFrame via usePointer() — never React state (the reel's hard rule).
export type Pointer = { pos: THREE.Vector3; smooth: THREE.Vector3; down: boolean; has: boolean };

export const makePointer = (): Pointer => ({
  pos: new THREE.Vector3(0, 10, 0.45), // parked off-scene until first move
  smooth: new THREE.Vector3(0, 10, 0.45),
  down: false,
  has: false,
});

export const PointerCtx = createContext<Pointer | null>(null);
export const usePointer = (): Pointer => {
  const p = useContext(PointerCtx);
  if (!p) throw new Error('usePointer must be used within <GlassScene>');
  return p;
};

export function PointerField({ z = 0.45 }: { z?: number }) {
  const p = usePointer();
  useEffect(() => {
    const up = () => (p.down = false);
    window.addEventListener('pointerup', up);
    return () => window.removeEventListener('pointerup', up);
  }, [p]);
  useFrame((_, dt) => {
    p.smooth.lerp(p.pos, 1 - Math.exp(-9 * Math.min(dt, 0.05)));
  });
  return (
    <mesh
      position={[0, 0, z]}
      onPointerMove={(e) => {
        p.pos.set(e.point.x, e.point.y, z);
        p.has = true;
      }}
      onPointerDown={(e) => {
        p.down = true;
        p.pos.set(e.point.x, e.point.y, z);
      }}
      onPointerLeave={() => {
        p.has = false;
        p.down = false;
      }}
    >
      <planeGeometry args={[40, 24]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}
