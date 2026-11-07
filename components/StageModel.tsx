"use client";

import ProceduralStageModel from "./ProceduralStageModel";
import MuseumGroundShadow from "./MuseumGroundShadow";

const labels: Record<string, string> = {
  "table-mountain": "Table Mountain",
  "union-buildings": "Union Buildings",
  stadium: "Moses Mabhida Stadium",
  bridge: "Nelson Mandela Bridge",
  hole: "The Big Hole",
  ponte: "Ponte City",
};

/**
 * Backwards-compatible stage model entry point.
 * All models are now built at runtime with Three.js; no GLTF/Draco loader or
 * external model file is required, including for legacy callers of this API.
 */
export default function StageModel({
  model,
  active = true,
  onReady,
}: {
  model: string;
  active?: boolean;
  onReady?: () => void;
}) {
  const name = labels[model] ?? model.replace(/[-_]/g, " ");

  return (
    <>
      {active && (
        <MuseumGroundShadow
          name="stage-contact-shadow"
          positionY={-0.18}
          dimensions={[4.2, 3.6]}
        />
      )}
      <ProceduralStageModel
        name={name}
        model={model}
        active={active}
        onReady={onReady}
      />
    </>
  );
}
