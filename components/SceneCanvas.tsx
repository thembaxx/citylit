"use client";
import { Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";
import { Component, useRef, type ReactNode } from "react";
class WebGLBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="webgl-fallback" role="status">
        3D is unavailable on this device. Explore using the city shortcuts below.
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
          fallback={<div className="webgl-fallback">Explore using the city shortcuts below.</div>}
        >
          <View.Port />
        </Canvas>
      </WebGLBoundary>
    </div>
  );
}
