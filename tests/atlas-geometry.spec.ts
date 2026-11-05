import { expect, test } from "@playwright/test";
import * as THREE from "three";
import { stageModel } from "../lib/stage-models";
import { createProceduralLandmark, disposeProceduralLandmark } from "../lib/procedural-landmarks";
import { createProceduralCategory } from "../lib/procedural-atlas-categories";

// One landmark from each city's catalogue; the interactive atlas now resolves
// the actual selected name instead of repeating its first three toy shapes.
const cities = [
  "Ponte City",
  "Table Mountain",
  "Moses Mabhida",
  "Union Buildings",
  "Village Museum",
  "City Hall",
  "Donkin Reserve",
  "Oliewenhuis",
  "Lowveld Botanical Garden",
  "Bakone Malapa",
  "The Big Hole",
  "Mahikeng Museum",
];

test("twelve atlas city models produce real geometry and animation controllers", () => {
  test.slow();
  for (const name of cities) {
    const scene = createProceduralLandmark(name);
    let meshes = 0;
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) meshes++;
    });
    expect(meshes, name).toBeGreaterThan(2);
    expect(scene.userData.placeName).toBe(name);
    expect(() => scene.userData.tick?.(1, 0)).not.toThrow();
    disposeProceduralLandmark(scene);
  }
});

test("five atlas categories are distinct, animated and dispose cleanly", () => {
  const signatures = new Set<string>();
  for (let index = 0; index < 5; index++) {
    const scene = createProceduralCategory(index);
    signatures.add(scene.name);
    let geometryCount = 0;
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) geometryCount++;
    });
    expect(geometryCount, scene.name).toBeGreaterThan(10);
    expect(() => scene.userData.tick?.(2.5)).not.toThrow();
    if (index === 3) {
      let movingWater = false;
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.ShaderMaterial) {
          movingWater = child.material.uniforms.uTime.value === 2.5;
        }
      });
      expect(movingWater).toBe(true);
    }
    disposeProceduralLandmark(scene);
  }
  expect(signatures.size).toBe(5);
});

test("venue categories resolve to location-appropriate geometry families", () => {
  const archetypes: [string, string, string][] = [
    ["Howick Falls", "", "waterfall"],
    ["Sudwala Caves", "", "cave"],
    ["Village Museum", "", "museum"],
    ["Bakone Malapa", "", "village"],
    ["Sand du Plessis Theatre", "", "theatre"],
    ["The Boardwalk", "", "entertainment"],
    ["Boutique Hotel", "Lodging", "hotel"],
  ];
  for (const [name, category, kind] of archetypes) {
    expect(stageModel(name, category)).toBe(kind);
    const scene = createProceduralLandmark(name, kind);
    expect(() => scene.userData.tick?.(1.3, 0)).not.toThrow();
    let meshes = 0;
    scene.traverse((node) => {
      if (node instanceof THREE.Mesh) meshes++;
    });
    expect(meshes, name).toBeGreaterThan(6);
    disposeProceduralLandmark(scene);
  }
});
