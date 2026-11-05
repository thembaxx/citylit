import { expect, test } from "@playwright/test";
import * as THREE from "three";
import { createProceduralLandmark, disposeProceduralLandmark } from "../lib/procedural-landmarks";

test("Table Mountain has a broad flat plateau and steep differentiated slopes", () => {
  const scene = createProceduralLandmark("Table Mountain", "table-mountain");
  try {
    const summit = scene.getObjectByName("table-mountain-flat-summit");
    expect(summit).toBeInstanceOf(THREE.Mesh);
    const geometry = (summit as THREE.Mesh).geometry as THREE.BufferGeometry;
    expect(geometry.name).toBe("TableMountainMassif");
    const vertices = geometry.getAttribute("position") as THREE.BufferAttribute;
    expect(vertices.count).toBeGreaterThan(7000);

    const heights: number[] = [];
    let baseCount = 0;
    for (let i = 0; i < vertices.count; i++) {
      const x = vertices.getX(i);
      const y = vertices.getY(i);
      const z = vertices.getZ(i);
      if (Math.abs(x) < 2.6 && Math.abs(z) < 1.1) heights.push(y);
      if (Math.abs(x) > 5.7 && y < 0.35) baseCount++;
    }
    expect(heights.length).toBeGreaterThan(300);
    expect(Math.max(...heights) - Math.min(...heights)).toBeLessThan(0.14);
    expect(baseCount).toBeGreaterThan(20);

    const foliage = scene.getObjectByName("table-mountain-instanced-fynbos");
    const rocks = scene.getObjectByName("table-mountain-instanced-rocks");
    expect(foliage).toBeInstanceOf(THREE.InstancedMesh);
    expect(rocks).toBeInstanceOf(THREE.InstancedMesh);
    expect((foliage as THREE.InstancedMesh).count).toBe(80);
    expect((rocks as THREE.InstancedMesh).count).toBe(30);
    expect(() => scene.userData.tick?.(3.4, 0)).not.toThrow();
  } finally {
    disposeProceduralLandmark(scene);
  }
});

test("Moses Mabhida has an oval stadium roof under its signature arch", () => {
  const scene = createProceduralLandmark("Moses Mabhida", "stadium");
  try {
    const bowled: THREE.Mesh[] = [];
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry instanceof THREE.LatheGeometry)
        bowled.push(child);
    });
    expect(bowled.length).toBeGreaterThanOrEqual(2);
    const outer = bowled[0];
    expect(outer.scale.x / outer.scale.z).toBeGreaterThan(1.3);
    expect(() => scene.userData.tick?.(2, 0)).not.toThrow();
  } finally {
    disposeProceduralLandmark(scene);
  }
});
