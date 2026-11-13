"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  createProceduralLandmark,
  disposeProceduralLandmark,
  setProceduralNight,
} from "../lib/procedural-landmarks";
import {
  prepareLandmarkExplodedView,
  setLandmarkExplodedView,
} from "../lib/landmark-exploded-view.js";
import { addArchitecturalTrim, applyLandmarkCraft, applyLandmarkLod } from "../lib/landmark-craft.js";
import {
  applyLandmarkRig,
  clearLandmarkJoint,
  landmarkJointState,
  setLandmarkJoint,
} from "../lib/landmark-rig.js";

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
  explodedProgress = 0,
  jointValues,
}: {
  name: string;
  model: string;
  active?: boolean;
  night?: boolean;
  reduced?: boolean;
  onReady?: () => void;
  /** 0 keeps the landmark assembled; 1 separates its authored top-level layers. */
  explodedProgress?: number;
  /** Manual joint overrides; an absent id keeps the authored animation. */
  jointValues?: Record<string, number>;
}) {
  const { gl, invalidate } = useThree();
  const subject = useMemo(() => {
    const landmark = createProceduralLandmark(name, model);
    applyLandmarkCraft(landmark);
    addArchitecturalTrim(landmark);
    return landmark;
  }, [name, model]);
  const explodedTarget = useRef(explodedProgress);
  const explodedCurrent = useRef(explodedProgress);

  useEffect(() => {
    prepareLandmarkExplodedView(subject);
    setLandmarkExplodedView(subject, explodedCurrent.current);
    setProceduralNight(subject, night);
    invalidate();
  }, [subject, night, invalidate]);

  useEffect(() => {
    explodedTarget.current = explodedProgress;
    if (reduced) {
      explodedCurrent.current = explodedProgress;
      setLandmarkExplodedView(subject, explodedProgress);
    }
    if (active) {
      gl.domElement.dataset.explodedProgress = explodedCurrent.current.toFixed(3);
    }
    invalidate();
  }, [subject, explodedProgress, reduced, active, gl, invalidate]);

  useEffect(() => {
    onReady?.();
  }, [onReady, subject]);

  useEffect(() => {
    const tier = window.__citylitRendererDiagnostics?.tier;
    applyLandmarkLod(subject, tier === "saver" ? 0 : tier === "balanced" ? 1 : 2);
  }, [subject]);

  useEffect(() => {
    for (const joint of landmarkJointState(subject)) {
      const value = jointValues?.[joint.id];
      if (typeof value === "number") setLandmarkJoint(subject, joint.id, value);
      else clearLandmarkJoint(subject, joint.id);
    }
    if (reduced) applyLandmarkRig(subject, jointValues ?? {});
    invalidate();
  }, [subject, jointValues, reduced, invalidate]);

  useEffect(() => {
    if (reduced || !active) return;
    // The ambient scene is never rendered in hidden tabs or reduced-motion mode.
    const timer = window.setInterval(() => {
      if (!document.hidden) invalidate();
    }, 1000 / 30);
    return () => window.clearInterval(timer);
  }, [active, reduced, invalidate]);

  useFrame(({ clock }, delta) => {
    if (!active || document.hidden) return;
    if (reduced) {
      if (explodedCurrent.current !== explodedTarget.current) {
        explodedCurrent.current = explodedTarget.current;
        setLandmarkExplodedView(subject, explodedCurrent.current);
        gl.domElement.dataset.explodedProgress = explodedCurrent.current.toFixed(3);
      }
      return;
    }
    const next = THREE.MathUtils.damp(
      explodedCurrent.current,
      explodedTarget.current,
      8.5,
      Math.min(delta, 0.05),
    );
    const settled = Math.abs(next - explodedTarget.current) < 0.001;
    const previous = explodedCurrent.current;
    explodedCurrent.current = settled ? explodedTarget.current : next;
    if (explodedCurrent.current !== previous) {
      setLandmarkExplodedView(subject, explodedCurrent.current);
      gl.domElement.dataset.explodedProgress = explodedCurrent.current.toFixed(3);
    }
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
