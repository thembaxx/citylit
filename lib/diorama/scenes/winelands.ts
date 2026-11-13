import * as THREE from "three/webgpu";
import { DIORAMA_BY_SLUG } from "../content";
import type { SceneBuild, SceneContext } from "../types";
import { createRibbonMesh } from "../geometry";
import { setMaterialUniforms } from "../materials";
import { createPeople, createRocks, createTrees, type Instance } from "../props";
import { createCapeDutchHouse, createScrub, createVineyards } from "../structures";
import { createCloudLayer, createBlock, createWaterSurface } from "../scene-kit";
import { clamp, fbm2D, gaussian, smoothstep } from "../utils";

const SIZE = 12;
const WATER_LEVEL = 0.26;
const noise = fbm2D(727, 4);

function rawHeight(x: number, z: number) {
  const n = noise(x * 0.62 + 2, z * 0.62 + 5);
  let h = 0.36 + n * 0.075;

  const range =
    gaussian(x, z, -2.9, -3.7, 2.3) * 2.2 +
    gaussian(x, z, 0.5, -4.0, 1.9) * 2.5 +
    gaussian(x, z, 3.3, -3.3, 1.7) * 1.8;
  h += Math.pow(clamp(range, 0, 8), 0.86);
  h += gaussian(x, z, -4.5, -2.1, 1.5) * 1.05;
  h += (noise(x * 1.7 + 8, z * 1.7 + 4) - 0.5) * 0.42 * smoothstep(0.9, 2.2, h);

  // Farm dam, dug below the valley floor.
  h -= gaussian(x, z, 1.6, -0.75, 0.98) * 0.46;
  return h;
}

function height(x: number, z: number) {
  return rawHeight(x, z);
}

const vineGreen = new THREE.Color("#5e7d43");
const pasture = new THREE.Color("#8aa45e");
const pastureB = new THREE.Color("#a3b574");
const fynbos = new THREE.Color("#6d7d55");
const rockA = new THREE.Color("#9a9384");
const rockB = new THREE.Color("#7b7466");
const earth = new THREE.Color("#bda87f");

function terrainColor(x: number, z: number, h: number, slope: number) {
  const n = noise(x * 1.4 + 7, z * 1.4 + 13);
  const c = pasture.clone().lerp(pastureB, n);
  if (h > 1.2) c.lerp(fynbos, smoothstep(1.2, 2.2, h) * 0.5);
  if (slope > 0.6) {
    const rocky = rockA.clone().lerp(rockB, n);
    c.lerp(rocky, smoothstep(0.6, 1.7, slope) * 0.92);
  }
  if (h < 0.34) {
    c.lerp(earth, smoothstep(0.34, 0.2, h) * 0.5);
    c.lerp(vineGreen, smoothstep(0.34, 0.28, h) * 0.2);
  }
  return c;
}

function roadPath(points: [number, number][]) {
  return points.map(([x, z]) => new THREE.Vector3(x, height(x, z) + 0.03, z));
}

export function buildWinelands(context: SceneContext): SceneBuild {
  const content = DIORAMA_BY_SLUG.winelands;
  const block = createBlock({
    context,
    size: SIZE,
    height,
    color: terrainColor,
    strata: [
      {
        top: "#a68d68",
        upper: "#8f7653",
        middle: "#bda27a",
        lower: "#7d6546",
        seam: "#4f3f2d",
      },
      {
        top: "#c2ab84",
        upper: "#a89168",
        middle: "#cbb68f",
        lower: "#8e7a58",
        seam: "#5f4e37",
      },
      {
        top: "#77705f",
        upper: "#686153",
        middle: "#857c69",
        lower: "#4e483d",
        seam: "#332f28",
      },
    ],
  });

  const water = createWaterSurface({
    size: SIZE,
    level: WATER_LEVEL,
    segments: context.quality.waterSegments,
    height,
    depth: rawHeight,
    deep: "#2c7a86",
    shallow: "#7fc9c0",
    foam: "#f1fbf6",
    speed: 0.55,
  });
  block.terrain.add(water.mesh);

  const house = createCapeDutchHouse({
    x: -2.4,
    z: -0.4,
    y: height(-2.4, -0.4),
    rotation: 0.5,
    scale: 1.15,
  });
  block.terrain.add(house.group);

  const outbuilding = createCapeDutchHouse({
    x: -3.55,
    z: 0.42,
    y: height(-3.55, 0.42),
    rotation: 0.75,
    scale: 0.62,
  });
  block.terrain.add(outbuilding.group);

  const vineBlocks = [
    {
      origin: [1.7, 1.6] as [number, number],
      rows: 9,
      rowLength: 4.2,
      spacing: 0.36,
      rotation: -0.18,
    },
    {
      origin: [-1.5, 2.5] as [number, number],
      rows: 6,
      rowLength: 3.3,
      spacing: 0.34,
      rotation: 0.12,
    },
    {
      origin: [3.3, -1.6] as [number, number],
      rows: 6,
      rowLength: 2.6,
      spacing: 0.32,
      rotation: -0.65,
    },
    {
      origin: [-0.6, -2.0] as [number, number],
      rows: 5,
      rowLength: 2.4,
      spacing: 0.33,
      rotation: 0.3,
    },
  ];
  for (const vine of vineBlocks) {
    block.terrain.add(
      createVineyards({
        origin: vine.origin,
        rows: vine.rows,
        rowLength: vine.rowLength,
        spacing: vine.spacing,
        rotation: vine.rotation,
        height,
        vineColor: ["#4f6f3c", "#5f7f45", "#45633a"],
      }),
    );
  }

  const driveMaterial = new THREE.MeshStandardMaterial({ color: "#c9b48c", roughness: 0.98 });
  const drive = roadPath([
    [-5.7, 3.3],
    [-4.4, 2.5],
    [-3.4, 1.6],
    [-2.9, 0.6],
    [-2.6, 0.1],
  ]);
  block.terrain.add(
    createRibbonMesh({
      points: drive,
      width: 0.4,
      material: driveMaterial,
      segments: 60,
      yOffset: 0.035,
    }),
  );
  const damRoad = roadPath([
    [-1.7, 0.2],
    [-0.6, -0.2],
    [0.5, -0.5],
    [1.4, -0.35],
    [2.5, -0.1],
    [3.6, 0.5],
  ]);
  block.terrain.add(
    createRibbonMesh({
      points: damRoad,
      width: 0.32,
      material: driveMaterial,
      segments: 60,
      yOffset: 0.035,
    }),
  );

  const rand = context.rng;
  const oaks: Instance[] = [];
  for (let i = 0; i < 26; i++) {
    const angle = rand() * Math.PI * 2;
    const radius = 1.2 + rand() * 2.6;
    const x = -2.5 + Math.cos(angle) * radius;
    const z = -0.6 + Math.sin(angle) * radius * 0.8;
    const h = height(x, z);
    if (h < 0.3 || h > 1.4) continue;
    if (Math.abs(x + 2.4) < 0.85 && Math.abs(z + 0.4) < 0.55) continue;
    oaks.push({
      x,
      z,
      y: h + 0.02,
      scale: 0.7 + rand() * 0.55,
      color: ["#3f6136", "#4c6f3d", "#375631"][i % 3],
    });
  }
  block.terrain.add(createTrees({ trees: oaks }));

  const mountainTrees: Instance[] = [];
  for (let i = 0; i < 110; i++) {
    const x = -5.5 + rand() * 11;
    const z = -5.6 + rand() * 3.4;
    const h = height(x, z);
    if (h < 1.0) continue;
    const slope =
      Math.abs(height(x + 0.25, z) - height(x - 0.25, z)) +
      Math.abs(height(x, z + 0.25) - height(x, z - 0.25));
    if (slope > 0.95) continue;
    mountainTrees.push({
      x,
      z,
      y: h + 0.01,
      scale: 0.3 + rand() * 0.42,
      color: ["#5a6f45", "#6a7f4c", "#4a5f3d"][i % 3],
    });
  }
  block.terrain.add(createTrees({ trees: mountainTrees }));

  const shrubs: Instance[] = [];
  for (let i = 0; i < 140; i++) {
    const x = -5.6 + rand() * 11.2;
    const z = -5.7 + rand() * 5.2;
    const h = height(x, z);
    if (h < 0.5) continue;
    shrubs.push({
      x,
      z,
      y: h + 0.01,
      scale: [0.6 + rand() * 1.1, 0.5 + rand(), 0.6 + rand() * 1.1],
      rotation: rand() * Math.PI,
    });
  }
  block.terrain.add(createScrub({ shrubs, colors: ["#6f8250", "#849455", "#5c7046"] }));

  const rocks: Instance[] = [];
  for (let i = 0; i < 70; i++) {
    const x = -5.4 + rand() * 10.8;
    const z = -5.7 + rand() * 3.4;
    const h = height(x, z);
    if (h < 1.4) continue;
    const slope =
      Math.abs(height(x + 0.25, z) - height(x - 0.25, z)) +
      Math.abs(height(x, z + 0.25) - height(x, z - 0.25));
    if (slope < 0.7) continue;
    rocks.push({
      x,
      z,
      y: h + 0.02,
      scale: [0.3 + rand() * 0.6, 0.3 + rand() * 0.8, 0.3 + rand() * 0.6],
      rotation: rand() * Math.PI * 2,
      color: ["#9b9485", "#877f70", "#ada596"][i % 3],
    });
  }
  block.terrain.add(createRocks({ rocks }));

  const people: Instance[] = [];
  for (let i = 0; i < 4; i++) {
    const x = -2.2 + rand() * 1.4;
    const z = 0.4 + rand() * 0.7;
    people.push({ x, z, y: height(x, z) + 0.01, scale: 0.9 });
  }
  block.terrain.add(createPeople({ people, colors: ["#c8b27a", "#5d6f8c", "#a65b48"] }));

  const clouds = createCloudLayer({ seed: 163, count: 4, y: 5.9, spread: 6.4, scale: 0.55 });
  block.root.add(clouds.group);

  const tick = (time: number, _dt: number, atmosphere: { night: number; golden: number }) => {
    setMaterialUniforms(water.material, {
      time,
      night: atmosphere.night,
      golden: atmosphere.golden,
    });
    house.glass.emissiveIntensity = atmosphere.night * 1.5;
    outbuilding.glass.emissiveIntensity = atmosphere.night * 1.2;
    clouds.tick(time, atmosphere);
  };

  return {
    root: block.root,
    terrain: block.terrain,
    base: block.base,
    landmarks: content.landmarks,
    tick,
    camera: {
      position: [15.8, 13.4, 16.8],
      target: [0, 0.5, 0],
    },
  };
}
