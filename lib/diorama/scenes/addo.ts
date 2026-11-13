import * as THREE from "three/webgpu";
import { DIORAMA_BY_SLUG } from "../content";
import type { SceneBuild, SceneContext } from "../types";
import { createRibbonMesh } from "../geometry";
import { setMaterialUniforms } from "../materials";
import { createRocks, createTrees, type Instance } from "../props";
import { createAcacias, createSafariVehicle, createScrub } from "../structures";
import { createElephants, type FaunaInstance } from "../fauna";
import { createCloudLayer, createBlock, createWaterSurface } from "../scene-kit";

import { clamp, fbm2D, gaussian, smoothstep } from "../utils";

const SIZE = 12;
const WATER_LEVEL = 0.3;
const noise = fbm2D(1301, 4);

function rawHeight(x: number, z: number) {
  const n = noise(x * 0.7 + 5, z * 0.7 + 3);
  let h = 0.95 + n * 0.42;
  h += gaussian(x, z, 0.4, -3.5, 2.7) * 1.55;
  h += gaussian(x, z, -4.5, -1.6, 1.9) * 0.95;
  h += gaussian(x, z, 4.6, 0.4, 1.8) * 0.75;
  h += gaussian(x, z, 2.6, 3.2, 1.6) * 0.4;
  // Waterhole, sunk below the surrounding thicket.
  h -= gaussian(x, z, 0.4, 1.15, 1.3) * 1.12;
  h += (noise(x * 2.2 + 2, z * 2.2 + 8) - 0.5) * 0.14;
  return h;
}

function height(x: number, z: number) {
  return rawHeight(x, z);
}

const thicketA = new THREE.Color("#4f6b3c");
const thicketB = new THREE.Color("#67804a");
const grass = new THREE.Color("#8c9a5b");
const mud = new THREE.Color("#6c6a4a");
const rockA = new THREE.Color("#8d7f66");

function terrainColor(x: number, z: number, h: number, slope: number) {
  const n = noise(x * 1.6 + 7, z * 1.6 + 11);
  const c = thicketA.clone().lerp(thicketB, n);
  if (h > 1.9) c.lerp(grass, smoothstep(1.9, 2.6, h) * 0.4);
  if (h < 0.55) {
    c.lerp(mud, smoothstep(0.55, 0.32, h) * 0.75);
  }
  if (slope > 0.55) c.lerp(rockA, smoothstep(0.55, 1.5, slope) * 0.4);
  if (h < WATER_LEVEL - 0.02) {
    const depth = clamp((WATER_LEVEL - h) / 0.35, 0, 1);
    c.lerp(mud, smoothstep(0, 0.7, depth) * 0.5);
  }
  return c;
}

const ROAD: [number, number][] = [
  [-5.2, 3.2],
  [-3.6, 2.9],
  [-2.4, 2.2],
  [-1.6, 1.0],
  [-1.1, -0.2],
  [-0.3, -1.4],
  [1.2, -1.9],
  [2.6, -1.4],
  [3.4, -0.3],
  [4.0, 1.0],
  [4.9, 2.0],
  [5.5, 3.0],
];

export function buildAddo(context: SceneContext): SceneBuild {
  const content = DIORAMA_BY_SLUG.addo;
  const block = createBlock({
    context,
    size: SIZE,
    height,
    color: terrainColor,
    strata: [
      {
        top: "#a67b54",
        upper: "#8d6443",
        middle: "#b78e66",
        lower: "#7a5539",
        seam: "#4d3524",
      },
      {
        top: "#bf9a72",
        upper: "#a67f58",
        middle: "#cbaa84",
        lower: "#8f6c49",
        seam: "#5e442d",
      },
      {
        top: "#77695a",
        upper: "#665a4c",
        middle: "#857661",
        lower: "#4b4239",
        seam: "#302a24",
      },
    ],
  });

  const water = createWaterSurface({
    size: SIZE,
    level: WATER_LEVEL,
    segments: context.quality.waterSegments,
    height,
    depth: rawHeight,
    deep: "#5b6a4e",
    shallow: "#8f9d78",
    foam: "#e6ead8",
    speed: 0.45,
  });
  block.terrain.add(water.mesh);

  const roadCurve = new THREE.CatmullRomCurve3(
    ROAD.map(([x, z]) => new THREE.Vector3(x, 0, z)),
    false,
    "catmullrom",
    0.2,
  );
  const roadPoints: THREE.Vector3[] = [];
  for (let i = 0; i <= 120; i++) {
    const p = roadCurve.getPoint(i / 120);
    roadPoints.push(new THREE.Vector3(p.x, height(p.x, p.z) + 0.03, p.z));
  }
  const roadMaterial = new THREE.MeshStandardMaterial({
    color: "#a9603d",
    roughness: 0.98,
  });
  block.terrain.add(
    createRibbonMesh({
      points: roadPoints,
      width: 0.5,
      material: roadMaterial,
      segments: 140,
      yOffset: 0.02,
    }),
  );

  const rand = context.rng;
  const waterhole = { x: 0.4, z: 1.15 };
  const elephants: FaunaInstance[] = [];
  const herdOffsets: [number, number, number, number][] = [
    [-1.5, -1.2, 1.02, 0.6],
    [-2.6, -0.4, 0.9, 1.4],
    [-0.6, -2.2, 0.95, 2.2],
    [1.9, -1.6, 0.9, 0.9],
    [3.0, -0.2, 0.82, 2.8],
    [1.4, -2.9, 0.92, 1.9],
    [-3.5, -1.9, 0.86, 0.2],
    [0.3, -0.7, 1.12, 2.4],
    [3.1, 1.7, 0.88, 1.1],
    [-3.1, 2.4, 0.84, 3.4],
    [2.2, 3.0, 0.8, 0.4],
  ];
  for (const [ox, oz, scale, rotation] of herdOffsets) {
    const x = waterhole.x + ox;
    const z = waterhole.z + oz;
    const ground = height(x, z);
    elephants.push({
      x,
      z,
      y: ground + 0.01,
      rotation,
      scale,
    });
  }
  const herd = createElephants({ elephants });
  block.terrain.add(herd.group);

  const vehicleCurve = new THREE.CatmullRomCurve3(
    roadPoints.map((p) => new THREE.Vector3(p.x, p.y, p.z)),
    true,
    "catmullrom",
    0.25,
  );
  const start = vehicleCurve.getPoint(0.12);
  const vehicle = createSafariVehicle({
    x: start.x,
    z: start.z,
    y: start.y,
    rotation: 0,
    scale: 1.05,
    color: "#b6a679",
  });
  block.terrain.add(vehicle.group);

  const acacias: Instance[] = [];
  for (let i = 0; i < 34; i++) {
    const x = -5.4 + rand() * 10.8;
    const z = -5.5 + rand() * 9.6;
    const h = height(x, z);
    if (h < 0.6) continue;
    if (Math.hypot(x - waterhole.x, z - waterhole.z) < 1.9) continue;
    acacias.push({
      x,
      z,
      y: h + 0.01,
      scale: 0.5 + rand() * 0.6,
      rotation: rand() * Math.PI * 2,
      color: ["#5a7040", "#68804a", "#4c6238"][i % 3],
    });
  }
  block.terrain.add(createAcacias({ trees: acacias }));

  const trees: Instance[] = [];
  for (let i = 0; i < 100; i++) {
    const x = -5.4 + rand() * 10.8;
    const z = -5.4 + rand() * 10.2;
    const h = height(x, z);
    if (h < 0.55) continue;
    if (Math.hypot(x - waterhole.x, z - waterhole.z) < 1.75) continue;
    trees.push({
      x,
      z,
      y: h + 0.01,
      scale: 0.24 + rand() * 0.34,
      color: ["#47613a", "#547043", "#3d5634"][i % 3],
    });
  }
  block.terrain.add(createTrees({ trees }));

  const shrubs: Instance[] = [];
  for (let i = 0; i < 220; i++) {
    const x = -5.5 + rand() * 11;
    const z = -5.5 + rand() * 11;
    const h = height(x, z);
    if (h < 0.5) continue;
    shrubs.push({
      x,
      z,
      y: h + 0.005,
      scale: [0.7 + rand() * 1.4, 0.5 + rand() * 1.0, 0.7 + rand() * 1.4],
      rotation: rand() * Math.PI,
    });
  }
  block.terrain.add(createScrub({ shrubs, colors: ["#5f7643", "#70864a", "#4f663c"] }));

  const rocks: Instance[] = [];
  for (let i = 0; i < 26; i++) {
    const x = -5.2 + rand() * 10.4;
    const z = -5.2 + rand() * 10.4;
    const h = height(x, z);
    if (h < 1.4) continue;
    rocks.push({
      x,
      z,
      y: h + 0.02,
      scale: [0.2 + rand() * 0.35, 0.16 + rand() * 0.3, 0.2 + rand() * 0.35],
      rotation: rand() * Math.PI,
      color: ["#8d7f66", "#7a6d56"][i % 2],
    });
  }
  block.terrain.add(createRocks({ rocks }));

  const clouds = createCloudLayer({ seed: 269, count: 4, y: 6.0, spread: 6.4, scale: 0.5 });
  block.root.add(clouds.group);

  const tick = (time: number, _dt: number, atmosphere: { night: number; golden: number }) => {
    setMaterialUniforms(water.material, {
      time,
      night: atmosphere.night,
      golden: atmosphere.golden,
    });
    herd.tick(time);
    const t = (time * 0.012) % 1;
    const point = vehicleCurve.getPoint(t);
    const ahead = vehicleCurve.getPoint((t + 0.004) % 1);
    vehicle.group.position.set(point.x, point.y + 0.02, point.z);
    vehicle.group.rotation.y = Math.atan2(ahead.x - point.x, ahead.z - point.z) - Math.PI / 2;
    vehicle.tick(time);
    clouds.tick(time, atmosphere);
  };

  return {
    root: block.root,
    terrain: block.terrain,
    base: block.base,
    landmarks: content.landmarks,
    tick,
    camera: {
      position: [16.0, 13.6, 16.8],
      target: [0, 0.6, 0],
    },
  };
}
