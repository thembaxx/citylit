"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";

/**
 * Small baked-style elliptical contact shadow below the museum's stone plinth.
 * One 128px transparent texture and one plane; works on mobile where dynamic
 * shadow maps are disabled. The app background remains transparent.
 */
export default function MuseumGroundShadow({
  positionY = -0.337,
  dimensions = [5.7, 4.4],
  name = "museum-contact-shadow",
}: {
  positionY?: number;
  dimensions?: [number, number];
  name?: string;
}) {
  const texture = useMemo(() => {
    const size = 128;
    const pixels = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = (x + 0.5 - size * 0.5) / (size * 0.5);
        const v = (y + 0.5 - size * 0.5) / (size * 0.5);
        const ellipse = Math.sqrt(u * u * 0.94 + v * v * 1.05);
        const falloff = THREE.MathUtils.clamp((1 - ellipse) / 0.42, 0, 1);
        const alpha = Math.round(110 * falloff * falloff * (3 - 2 * falloff));
        const i = (y * size + x) * 4;
        pixels[i] = 49;
        pixels[i + 1] = 39;
        pixels[i + 2] = 31;
        pixels[i + 3] = alpha;
      }
    }
    const result = new THREE.DataTexture(pixels, size, size, THREE.RGBAFormat);
    result.colorSpace = THREE.SRGBColorSpace;
    result.magFilter = THREE.LinearFilter;
    result.minFilter = THREE.LinearFilter;
    result.needsUpdate = true;
    return result;
  }, []);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh name={name} position={[0, positionY, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-2}>
      <planeGeometry args={dimensions} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.85}
        depthWrite={false}
        toneMapped={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
