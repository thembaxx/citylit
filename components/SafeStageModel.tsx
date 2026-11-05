"use client";
import { Component, useCallback, type ReactNode } from "react";
import ProceduralStageModel from "./ProceduralStageModel";

/** An original, low-poly marker when a landmark asset is unavailable. */
function LandmarkPlaceholder() {
  return (
    <group name="landmark-asset-fallback">
      <mesh position={[0, -0.11, 0]}>
        <cylinderGeometry args={[0.86, 0.95, 0.22, 12]} />
        <meshStandardMaterial color="#e6c98a" roughness={0.86} />
      </mesh>
      <mesh position={[0, 0.47, 0]}>
        <dodecahedronGeometry args={[0.63, 0]} />
        <meshStandardMaterial color="#d9660b" roughness={0.75} />
      </mesh>
      <mesh position={[0, 1.05, 0]}>
        <icosahedronGeometry args={[0.19, 0]} />
        <meshStandardMaterial color="#fff0d1" roughness={0.8} />
      </mesh>
    </group>
  );
}

class LandmarkAssetBoundary extends Component<
  { children: ReactNode; onFailure?: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  componentDidCatch() {
    this.props.onFailure?.();
  }

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  render() {
    return this.state.failed ? <LandmarkPlaceholder /> : this.props.children;
  }
}

/**
 * Fail one model independently without removing the ring, itinerary controls,
 * or researched written guide. Changing the model remounts this boundary.
 */
export default function SafeStageModel({
  model,
  name = model,
  night = false,
  reduced = false,
  active = true,
  onStatus,
}: {
  model: string;
  name?: string;
  night?: boolean;
  reduced?: boolean;
  active?: boolean;
  onStatus?: (model: string, status: "ready" | "error") => void;
}) {
  const onReady = useCallback(() => onStatus?.(name, "ready"), [name, onStatus]);
  const onFailure = useCallback(() => onStatus?.(name, "error"), [model, onStatus]);
  return (
    <LandmarkAssetBoundary key={`${model}:${name}`} onFailure={onFailure}>
      <ProceduralStageModel
        name={name}
        model={model}
        night={night}
        reduced={reduced}
        active={active}
        onReady={onReady}
      />
    </LandmarkAssetBoundary>
  );
}
