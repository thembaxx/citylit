"use client";
import { Canvas, useFrame, invalidate } from "@react-three/fiber";
import { View } from "@react-three/drei";
import {
  Component,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { CornersIn, CornersOut } from "@phosphor-icons/react";
import * as THREE from "three";
import RendererTelemetry from "./RendererTelemetry";

const qualityQuery = "(max-width: 760px), (pointer: coarse)";
function subscribeQuality(onChange: () => void) {
  const media = window.matchMedia(qualityQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}
function getLowPower() {
  return window.matchMedia(qualityQuery).matches;
}
// Both views share a renderer. Clear once, then draw atmosphere and hero in order.
function FrameClear() {
  useFrame(({ gl }) => {
    gl.setScissorTest(false);
    gl.setClearColor(0x000000, 0);
    gl.clear(true, true, true);
  }, -100);
  useFrame(({ gl }) => gl.clearDepth(), 1.5);
  return null;
}
class WebGLBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="webgl-fallback" role="status">
        3D is unavailable on this device. Use the city guides or province links to keep exploring.
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function SceneCanvas({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const lowPower = useSyncExternalStore(subscribeQuality, getLowPower, () => false);
  const [canFullscreen, setCanFullscreen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenNotice, setFullscreenNotice] = useState("");
  const [contextLost, setContextLost] = useState(false);
  useEffect(() => {
    const sync = () => {
      setCanFullscreen(document.fullscreenEnabled === true);
      setFullscreen(Boolean(document.fullscreenElement));
    };
    sync();
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  const toggleFullscreen = async () => {
    setFullscreenNotice("");
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setFullscreenNotice("Fullscreen is unavailable. Install Citylit for an app-like view.");
    }
  };
  return (
    // Demand rendering must also track Views inside the guide's scroll container.
    <div
      ref={ref}
      className="canvas-root"
      style={{ background: "var(--citylit-reference-bg)" }}
      onScrollCapture={() => invalidate()}
    >
      {children}
      {canFullscreen && (
        <button
          type="button"
          className="citylit-immersive-toggle"
          onClick={() => void toggleFullscreen()}
          aria-label={fullscreen ? "Exit fullscreen atlas" : "Make atlas fullscreen"}
          aria-pressed={fullscreen}
          title={fullscreen ? "Exit fullscreen" : "Fullscreen atlas"}
        >
          {fullscreen ? <CornersIn size={18} /> : <CornersOut size={18} />}
        </button>
      )}
      {fullscreenNotice && (
        <p className="citylit-immersive-notice" role="status">
          {fullscreenNotice}
        </p>
      )}
      {contextLost && (
        <p className="webgl-context-warning" role="status">
          3D rendering was interrupted. City guides remain available while WebGL recovers.
        </p>
      )}
      <WebGLBoundary>
        <div
          aria-hidden="true"
          style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 2 }}
        >
          <Canvas
            eventSource={ref as React.RefObject<HTMLDivElement>}
            eventPrefix="client"
            className="persistent-canvas"
            style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
            frameloop="demand"
            shadows={!lowPower}
            onCreated={({ gl }) => {
              gl.outputColorSpace = THREE.SRGBColorSpace;
              gl.toneMapping = THREE.AgXToneMapping;
              gl.toneMappingExposure = 1.04;
              if (!lowPower) gl.shadowMap.type = THREE.PCFShadowMap;
            }}
            // Use up to 2x DPR with antialiasing for crisp silhouettes on Retina/mobile screens.
            dpr={[1, 2]}
            gl={{
              antialias: true,
              alpha: true,
              stencil: false,
              powerPreference: lowPower ? "low-power" : "high-performance",
            }}
            fallback={
              <div className="webgl-fallback">
                Explore using the province links in the map legend.
              </div>
            }
          >
            <RendererTelemetry mobile={lowPower} onContextState={setContextLost} />
            <FrameClear />
            <View.Port />
          </Canvas>
        </div>
      </WebGLBoundary>
    </div>
  );
}
