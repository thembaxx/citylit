"use client";

import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { createProceduralCategory } from "../lib/procedural-atlas-categories";
import { createProceduralLandmark, disposeProceduralLandmark } from "../lib/procedural-landmarks";

/**
 * Share the same high-detail Three.js assets between the atlas and the city
 * gallery. Keep one animated scene mounted, and only invalidate the viewport
 * when motion is permitted by the app and operating system.
 */
export default function AtlasProceduralModel({
  name,
  model = "dome",
  category,
  reduced = false,
}: {
  name?: string;
  model?: string;
  category?: number;
  reduced?: boolean;
}) {
  const { invalidate } = useThree();
  const subject = useMemo(
    () =>
      category === undefined
        ? createProceduralLandmark(name ?? "City landmark", model)
        : createProceduralCategory(category),
    [name, model, category],
  );

  useEffect(() => {
    invalidate();
    return () => {
      disposeProceduralLandmark(subject);
    };
  }, [subject, invalidate]);

  useEffect(() => {
    if (reduced) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) invalidate();
    }, 1000 / 30);
    return () => window.clearInterval(timer);
  }, [reduced, invalidate]);

  useFrame(({ clock }) => {
    if (reduced || document.hidden) return;
    const tick = subject.userData.tick as ((time: number, night?: number) => void) | undefined;
    tick?.(clock.elapsedTime, 0);
  });

  return (
    <group name="citylit-procedural-atlas-model">
      <primitive object={subject as THREE.Group} dispose={null} />
    </group>
  );
}
