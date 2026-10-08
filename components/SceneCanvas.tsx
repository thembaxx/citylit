"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { View } from "@react-three/drei";
import { Component, useRef, type ReactNode } from "react";
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
        3D is unavailable on this device. Explore using the province links in the map legend.
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function SceneCanvas({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref} className="canvas-root">
      {children}
      <WebGLBoundary>
        <Canvas
          eventSource={ref as React.RefObject<HTMLDivElement>}
          eventPrefix="client"
          className="persistent-canvas"
          style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 2 }}
          frameloop="demand"
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
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
