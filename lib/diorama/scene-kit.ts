import * as THREE from "three/webgpu";
import { createBase } from "./base";
import {
  createTerrainMesh,
  createTerrainSkirt,
  createWaterMesh,
  type TerrainColor,
} from "./geometry";
import {
  createCloudMaterial,
  createStrataMaterial,
  createWaterMaterial,
  type StrataPalette,
} from "./materials";
import { createClouds } from "./props";
import type { Atmosphere, SceneContext } from "./types";

export type BlockBuild = {
  root: THREE.Group;
  /** Everything that lifts away in the exploded view. */
  terrain: THREE.Group;
  base: THREE.Group;
  strataMaterial: THREE.Material;
};

/** The shared cutaway shell: three strata slabs plus the sculpted top surface. */
export function createBlock({
  context,
  size = 12,
  height,
  color,
  strata,
  depth = 2.4,
  slabs = 3,
}: {
  context: SceneContext;
  size?: number;
  height: (x: number, z: number) => number;
  color: TerrainColor;
  strata: [StrataPalette, StrataPalette, StrataPalette];
  depth?: number;
  slabs?: number;
}): BlockBuild {
  const root = new THREE.Group();
  const terrain = new THREE.Group();
  const base = new THREE.Group();
  root.add(terrain, base);

  const materials = strata.map((palette) => createStrataMaterial(palette));
  const shell = createBase({ size, depth, slabs, material: materials[0], materials });
  base.add(shell.group);

  terrain.add(
    createTerrainMesh({
      size,
      segments: context.quality.terrainSegments,
      height,
      color,
    }),
  );
  const skirt = createTerrainSkirt({
    size,
    segments: context.quality.terrainSegments,
    height,
    material: materials[0],
  });
  if (skirt) terrain.add(skirt);

  return { root, terrain, base, strataMaterial: materials[0] };
}

export type WaterSurface = {
  mesh: THREE.Mesh;
  material: ReturnType<typeof createWaterMaterial>;
};

export function createWaterSurface({
  size = 12,
  level = 0.05,
  segments,
  height,
  depth,
  deep = "#176d7d",
  shallow = "#69d5cd",
  foam = "#f2fffb",
  speed = 1,
}: {
  size?: number;
  level?: number;
  segments: number;
  height: (x: number, z: number) => number;
  depth?: (x: number, z: number) => number;
  deep?: string;
  shallow?: string;
  foam?: string;
  speed?: number;
}): WaterSurface {
  const material = createWaterMaterial({ deep, shallow, foam, speed });
  const mesh = createWaterMesh({ size, segments, level, height, depth, material });
  return { mesh, material };
}

export type CloudLayer = {
  group: THREE.Group;
  tick: (time: number, atmosphere: Atmosphere) => void;
};

/** Drifting puffs that tint with the light. */
export function createCloudLayer({
  seed,
  count = 4,
  y = 6,
  spread = 6.6,
  scale = 0.54,
}: {
  seed: number;
  count?: number;
  y?: number;
  spread?: number;
  scale?: number;
}): CloudLayer {
  const material = createCloudMaterial();
  const clouds = createClouds({ count, seed, y, spread, scale, material });
  const day = new THREE.Color("#ffffff");
  const night = new THREE.Color("#9aa9c4");
  const golden = new THREE.Color("#ffe2bd");
  const tick = (time: number, atmosphere: Atmosphere) => {
    material.color
      .copy(day)
      .lerp(golden, atmosphere.golden * 0.42)
      .lerp(night, atmosphere.night);
    for (const cloud of clouds.clouds) {
      cloud.group.position.x = cloud.baseX + Math.sin(time * 0.05 + cloud.phase) * 1.25;
      cloud.group.position.z = cloud.baseZ + Math.cos(time * 0.07 + cloud.phase) * 0.6;
      cloud.group.position.y = cloud.baseY + Math.sin(time * 0.3 + cloud.phase) * 0.08;
    }
  };
  return { group: clouds.group, tick };
}

/** A falling sheet of water for waterfalls and weirs. */
export function createFallPlane({
  width,
  height: fallHeight,
  material,
  position,
  rotationY = 0,
  tilt = 0,
}: {
  width: number;
  height: number;
  material: THREE.Material;
  position: [number, number, number];
  rotationY?: number;
  tilt?: number;
}): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(width, fallHeight, 6, 12);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.rotation.set(tilt, rotationY, 0);
  mesh.renderOrder = 3;
  return mesh;
}

/** Deterministic scatter helper: random points that pass a terrain filter. */
export function scatterPoints({
  rand,
  count,
  min,
  max,
  accept,
}: {
  rand: () => number;
  count: number;
  min: [number, number];
  max: [number, number];
  accept?: (x: number, z: number) => boolean;
}) {
  const points: { x: number; z: number }[] = [];
  const [minX, minZ] = min;
  const [maxX, maxZ] = max;
  for (let i = 0; i < count; i++) {
    const x = minX + rand() * (maxX - minX);
    const z = minZ + rand() * (maxZ - minZ);
    if (!accept || accept(x, z)) points.push({ x, z });
  }
  return points;
}
