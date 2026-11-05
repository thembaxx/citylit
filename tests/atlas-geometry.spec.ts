import { expect, test } from "@playwright/test";
import {
  createProceduralLandmark,
  disposeProceduralLandmark,
} from "../lib/procedural-landmarks";
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
      if (child.type === "Mesh" || child.type === "InstancedMesh") meshes++;
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
      if ("geometry" in child && child.geometry) geometryCount++;
    });
    expect(geometryCount, scene.name).toBeGreaterThan(10);
    expect(() => scene.userData.tick?.(2.5)).not.toThrow();
    if (index === 3) {
      let movingWater = false;
      scene.traverse((child) => {
        const surface = "material" in child && child.material;
        if (surface && !Array.isArray(surface) && surface.isShaderMaterial) {
          movingWater = surface.uniforms.uTime.value === 2.5;
        }
      });
      expect(movingWater).toBe(true);
    }
    disposeProceduralLandmark(scene);
  }
  expect(signatures.size).toBe(5);
});
