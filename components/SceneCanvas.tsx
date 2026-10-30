"use client";
import { Canvas, useFrame, invalidate } from "@react-three/fiber";
import { View } from "@react-three/drei";
import { Component, useRef, useSyncExternalStore, type ReactNode } from "react";

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
  return (
    // Demand rendering must also track Views inside the guide's scroll container.
    <div ref={ref} className="canvas-root" onScrollCapture={() => invalidate()}>
      {children}
      <WebGLBoundary>
        <Canvas
          eventSource={ref as React.RefObject<HTMLDivElement>}
          eventPrefix="client"
          className="persistent-canvas"
          style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 2 }}
          frameloop="demand"
          dpr={lowPower ? [1, 1] : [1, 1.5]}
          gl={{
            antialias: !lowPower,
            alpha: true,
            powerPreference: lowPower ? "low-power" : "high-performance",
          }}
          fallback={
            <div className="webgl-fallback">
              Explore using the province links in the map legend.
            </div>
          }
        >
          <FrameClear />
          <View.Port />
        </Canvas>
      </WebGLBoundary>
    </div>
  );
}
