'use client';
import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js';
import * as THREE from 'three';

export type Ball = { x: number; y: number; z: number; s: number };

// The metaball engine. One isosurface per liquid body; ball positions are LOCAL
// [-1,1]^3. The field's smooth falloff buys the merge, the stretching neck and the
// pinch-off for free — you author balls, the field authors the liquid. Driven
// imperatively per frame.
export function LiquidBody({
  resolution = 52,
  maxPoly = 50000,
  isolation = 80,
  subtract = 11,
  balls,
  children,
  ...props
}: {
  resolution?: number;
  maxPoly?: number;
  isolation?: number;
  subtract?: number;
  balls: (time: number, dt: number, out: Ball[]) => Ball[];
  children?: React.ReactNode;
  [k: string]: any;
}) {
  const mc = useMemo(() => {
    const m = new MarchingCubes(resolution, new THREE.MeshBasicMaterial(), false, false, maxPoly);
    m.isolation = isolation;
    m.frustumCulled = false;
    return m;
  }, [resolution, maxPoly, isolation]);
  const pool = useMemo<Ball[]>(() => [], []);

  useFrame(({ clock }, dt) => {
    mc.reset();
    pool.length = 0;
    const list = balls(clock.elapsedTime, Math.min(dt, 0.05), pool);
    for (const b of list) {
      mc.addBall(
        0.5 + THREE.MathUtils.clamp(b.x, -0.95, 0.95) * 0.5,
        0.5 + THREE.MathUtils.clamp(b.y, -0.95, 0.95) * 0.5,
        0.5 + THREE.MathUtils.clamp(b.z, -0.95, 0.95) * 0.5,
        b.s,
        subtract,
      );
    }
    mc.update();
  });

  return (
    <primitive object={mc} {...props}>
      {children}
    </primitive>
  );
}
