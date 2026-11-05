"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  DPR_CAPS,
  RendererQualityPolicy,
  type RendererDiagnostics,
  type RendererTier,
} from "../lib/renderer-quality";

type FrameWindow = {
  previous: number;
  frames: number;
  totalMs: number;
  slow: number;
};

function saveDataEnabled() {
  if (typeof navigator === "undefined") return false;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return connection?.saveData === true;
}

/**
 * One renderer-wide quality controller, not a separate controller in every
 * Drei View. gl.info reports actual WebGL draw counts and allocated objects.
 * FPS is measured from visible, actively rendered frames and is never called
 * GPU execution time (which requires extension-specific timer queries).
 */
export default function RendererTelemetry({
  mobile,
  onContextState,
}: {
  mobile: boolean;
  onContextState: (lost: boolean) => void;
}) {
  const { gl, setDpr, invalidate } = useThree();
  const policy = useMemo(() => new RendererQualityPolicy(mobile, saveDataEnabled()), [mobile]);
  const frame = useRef<FrameWindow>({ previous: 0, frames: 0, totalMs: 0, slow: 0 });

  useEffect(() => {
    const canvas = gl.domElement;
    const root = canvas.closest<HTMLElement>(".canvas-root");
    const cap = Math.min(window.devicePixelRatio || 1, DPR_CAPS[policy.tier]);
    setDpr(cap);
    if (root) {
      root.dataset.rendererQuality = policy.tier;
      root.dataset.webglStatus = "ready";
    }

    const publish = (context: "ready" | "lost") => {
      const info = gl.info;
      const snapshot: RendererDiagnostics = {
        tier: policy.tier,
        dpr: gl.getPixelRatio(),
        fps: null,
        frameMs: null,
        drawCalls: info.render.calls,
        triangles: info.render.triangles,
        points: info.render.points,
        geometries: info.memory.geometries,
        textures: info.memory.textures,
        context,
        gpuMs: null,
      };
      window.__citylitRendererDiagnostics = snapshot;
    };

    publish("ready");
    const lost = (event: Event) => {
      event.preventDefault();
      onContextState(true);
      if (root) root.dataset.webglStatus = "lost";
      publish("lost");
    };
    const restored = () => {
      frame.current = { previous: 0, frames: 0, totalMs: 0, slow: 0 };
      onContextState(false);
      if (root) root.dataset.webglStatus = "ready";
      publish("ready");
      invalidate();
    };
    canvas.addEventListener("webglcontextlost", lost, false);
    canvas.addEventListener("webglcontextrestored", restored, false);
    return () => {
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("webglcontextrestored", restored);
      if (root) {
        delete root.dataset.rendererQuality;
        delete root.dataset.webglStatus;
      }
      delete window.__citylitRendererDiagnostics;
    };
  }, [gl, policy, setDpr, invalidate, onContextState]);

  useFrame(() => {
    const current = frame.current;
    const now = performance.now();
    const elapsed = now - current.previous;
    current.previous = now;
    // Demand rendering intentionally pauses when idle. Never interpret those
    // long gaps as slow GPU frames or penalize a background tab.
    if (document.hidden || elapsed < 8 || elapsed > 140) return;

    current.frames++;
    current.totalMs += elapsed;
    if (elapsed > 55) current.slow++;
    if (current.frames < 70) return;

    const averageFrameMs = current.totalMs / current.frames;
    const previousTier: RendererTier = policy.tier;
    const nextTier = policy.sample({
      frames: current.frames,
      averageFrameMs,
      slowFrameRatio: current.slow / current.frames,
    });
    if (nextTier !== previousTier) {
      setDpr(Math.min(window.devicePixelRatio || 1, DPR_CAPS[nextTier]));
    }

    const snapshot: RendererDiagnostics = {
      tier: nextTier,
      dpr: gl.getPixelRatio(),
      fps: Math.round(1000 / averageFrameMs),
      frameMs: Math.round(averageFrameMs * 10) / 10,
      drawCalls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
      points: gl.info.render.points,
      geometries: gl.info.memory.geometries,
      textures: gl.info.memory.textures,
      context: "ready",
      gpuMs: null,
    };
    window.__citylitRendererDiagnostics = snapshot;
    const root = gl.domElement.closest<HTMLElement>(".canvas-root");
    if (root) {
      root.dataset.rendererQuality = nextTier;
      root.dataset.frameFps = String(snapshot.fps);
      root.dataset.drawCalls = String(snapshot.drawCalls);
    }
    current.frames = 0;
    current.totalMs = 0;
    current.slow = 0;
  });

  return null;
}
