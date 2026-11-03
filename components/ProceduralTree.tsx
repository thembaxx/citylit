"use client";

import { useLayoutEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

type TreeDetail = "hero" | "compact";

/**
 * Deterministic, texture-free foliage. One instanced draw for all leaf clusters
 * per tree, instead of a separate mesh/material for every leaf.
 */
export default function ProceduralTree({
  position = [0, 0, 0],
  scale = 1,
  color = "#6caa65",
  detail = "hero",
  seed = 0,
}: {
  position?: [number, number, number];
  scale?: number;
  color?: string;
  detail?: TreeDetail;
  seed?: number;
}) {
  const leaves = useRef<THREE.InstancedMesh>(null);
  const { invalidate } = useThree();
  const count = detail === "hero" ? 108 : 48;

  useLayoutEffect(() => {
    const mesh = leaves.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const base = new THREE.Color(color);
    const sunlit = new THREE.Color("#d6cd80");
    const shadow = new THREE.Color("#31583e");
    for (let i = 0; i < count; i++) {
      const t = (i + 0.5) / count;
      const theta = i * 2.399963229728653 + seed * 0.83;
      const spread = Math.sqrt(t) * (0.32 + 0.12 * Math.sin(i * 1.7 + seed));
      const height = 0.71 + 0.6 * (1 - Math.abs(2 * t - 1)) + 0.15 * Math.sin(i * 1.13 + seed);
      dummy.position.set(Math.cos(theta) * spread, height, Math.sin(theta) * spread);
      dummy.rotation.set(i * 1.23, theta, i * 0.57);
      const variation = 0.8 + 0.3 * (0.5 + 0.5 * Math.sin(i * 2.91 + seed));
      dummy.scale.set(variation * 0.68, variation * 0.39, variation * 0.94);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      const tint = base.clone();
      if (i % 4 === 0) tint.lerp(sunlit, 0.28);
      if (i % 5 === 0) tint.lerp(shadow, 0.17);
      mesh.setColorAt(i, tint);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
    invalidate();
  }, [color, count, seed, invalidate]);

  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.07, 0.8, 6]} />
        <meshStandardMaterial color="#7f6045" roughness={1} flatShading />
      </mesh>
      {[-0.65, 0.18, 0.92].map((angle, index) => (
        <mesh
          key={index}
          position={[Math.sin(angle) * 0.12, 0.7 + index * 0.09, Math.cos(angle) * 0.12]}
          rotation={[Math.cos(angle) * 0.5, 0, -Math.sin(angle) * 0.55]}
          castShadow
        >
          <cylinderGeometry args={[0.014, 0.032, 0.4, 5]} />
          <meshStandardMaterial color="#846446" roughness={1} />
        </mesh>
      ))}
      <instancedMesh ref={leaves} args={[undefined, undefined, count]} castShadow frustumCulled>
        <icosahedronGeometry args={[0.12, 1]} />
        <meshStandardMaterial color="#ffffff" roughness={0.94} />
      </instancedMesh>
    </group>
  );
}
