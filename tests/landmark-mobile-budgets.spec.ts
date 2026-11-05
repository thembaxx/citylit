import { expect, test } from "@playwright/test";
import * as THREE from "three";
import { createProceduralLandmark, disposeProceduralLandmark } from "../lib/procedural-landmarks";
import { landmarkPbrTextureBytes, pbrSurface } from "../lib/landmark-pbr";
import { MOBILE_LANDMARK_BUDGET, verifyMobileBudget } from "../lib/landmark-budget";

const heroes = [
  ["Table Mountain", "table"],
  ["Moses Mabhida", "stadium"],
  ["Ponte City", "ponte"],
  ["Union Buildings", "union"],
  ["The Big Hole", "hole"],
] as const;

test("five reference landmark models stay within static mobile budgets", () => {
  test.slow();
  for (const [name, kind] of heroes) {
    const scene = createProceduralLandmark(name, kind);
    try {
      const { stats, violations, passed } = verifyMobileBudget(scene);
      expect(violations, `${name}: ${JSON.stringify(stats)}`).toEqual([]);
      expect(passed).toBe(true);
      expect(stats.drawCalls, name).toBeGreaterThan(2);
      expect(stats.triangles, name).toBeGreaterThan(1000);
      expect(stats.drawCalls, name).toBeLessThanOrEqual(MOBILE_LANDMARK_BUDGET.drawCalls);
      expect(() => scene.userData.tick?.(1.3, 0)).not.toThrow();
    } finally {
      disposeProceduralLandmark(scene);
    }
  }
});

test("PBR material maps share deterministic textures under the mobile memory limit", () => {
  for (const kind of ["sandstone", "limestone", "terracotta", "concrete", "cliff", "membrane"]) {
    const a = pbrSurface(kind);
    const b = pbrSurface(kind);
    expect(a).toBe(b);
    expect(a.userData.shared).toBe(true);
    expect(a.map).toBeInstanceOf(THREE.DataTexture);
    expect(a.bumpMap).toBeInstanceOf(THREE.DataTexture);
    expect(a.roughnessMap).toBeInstanceOf(THREE.DataTexture);
    expect(a.map!.colorSpace).toBe(THREE.SRGBColorSpace);
  }
  expect(landmarkPbrTextureBytes()).toBeLessThanOrEqual(MOBILE_LANDMARK_BUDGET.textureBytes);
});

test("real features survive the fidelity pass without thousands of separate meshes", () => {
  const checks = [
    ["Ponte City", "ponte", "ponte-city-54-storey-glazing", 54 * 36],
    ["Union Buildings", "union", "union-buildings-terraced-garden-parterres", 36],
  ] as const;
  for (const [name, kind, id, instances] of checks) {
    const scene = createProceduralLandmark(name, kind);
    try {
      const object = scene.getObjectByName(id);
      expect(object, id).toBeInstanceOf(THREE.InstancedMesh);
      expect((object as THREE.InstancedMesh).count).toBe(instances);
    } finally {
      disposeProceduralLandmark(scene);
    }
  }
  const mine = createProceduralLandmark("The Big Hole", "hole");
  try {
    const pit = mine.getObjectByName("big-hole-stratified-crater");
    const pool = mine.getObjectByName("big-hole-turquoise-pool");
    expect(pit).toBeInstanceOf(THREE.Mesh);
    expect(pool).toBeInstanceOf(THREE.Mesh);
    expect((pool as THREE.Mesh).material).toBeInstanceOf(THREE.ShaderMaterial);
    expect(
      (pool as THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>).material.uniforms.uDayTint,
    ).toBeDefined();
  } finally {
    disposeProceduralLandmark(mine);
  }
});
