"use client";

import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  createProceduralLandmark,
  disposeProceduralLandmark,
  setProceduralNight,
} from "../lib/procedural-landmarks";

/**
 * One genuine Three.js scene per place, with no downloaded GLB or image textures.
 * The shared Canvas stays demand-rendered: only the selected place ticks at 30fps.
 */
export default function ProceduralStageModel({
  name,
  model,
  active = true,
  night = false,
  reduced = false,
  onReady,
}: {
  name: string;
  model: string;
  active?: boolean;
  night?: boolean;
  reduced?: boolean;
  onReady?: () => void;
}) {
  const { invalidate } = useThree();
  const subject = useMemo(() => createProceduralLandmark(name, model), [name, model]);

  useEffect(() => {
    setProceduralNight(subject, night);
    invalidate();
  }, [subject, night, invalidate]);

  useEffect(() => {
    onReady?.();
  }, [onReady, subject]);

  useEffect(() => {
    if (reduced || !active) return;
    // The ambient scene is never rendered in hidden tabs or reduced-motion mode.
    const timer = window.setInterval(() => {
      if (!document.hidden) invalidate();
    }, 1000 / 30);
    return () => window.clearInterval(timer);
  }, [active, reduced, invalidate]);

  useFrame(({ clock }) => {
    if (!active || reduced || document.hidden) return;
    const tick = subject.userData.tick as ((time: number, night: number) => void) | undefined;
    tick?.(clock.elapsedTime, night ? 1 : 0);
  });

  useEffect(
    () => () => {
      disposeProceduralLandmark(subject);
    },
    [subject],
  );

  return (
    <group name="citylit-procedural-landmark">
      <primitive object={subject as THREE.Group} dispose={null} />
    </group>
  );
}
