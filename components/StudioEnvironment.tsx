"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

/**
 * Locally generated studio environment for physically plausible reflections.
 * No runtime CDN dependency: works with offline PWA and the shared R3F canvas.
 * Intentionally does not replace the transparent app background.
 */
export default function StudioEnvironment({ intensity = 0.85 }: { intensity?: number }) {
  const { gl, scene, invalidate } = useThree();

  useEffect(() => {
    const previousEnvironment = scene.environment;
    const previousIntensity = scene.environmentIntensity;
    const room = new RoomEnvironment();
    const generator = new THREE.PMREMGenerator(gl);
    const target = generator.fromScene(room, 0.04);
    scene.environment = target.texture;
    scene.environmentIntensity = intensity;
    room.dispose();
    generator.dispose();
    invalidate();

    return () => {
      scene.environment = previousEnvironment;
      scene.environmentIntensity = previousIntensity;
      target.dispose();
      invalidate();
    };
  }, [gl, scene, intensity, invalidate]);

  return null;
}
