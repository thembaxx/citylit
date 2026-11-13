import * as THREE from "three/webgpu";
import { DIORAMA_BY_SLUG } from "../content";
import type { SceneBuild, SceneContext } from "../types";
import { setMaterialUniforms } from "../materials";
import { createPeople, createRocks, createTrees, type Instance } from "../props";
import { createBoardwalk, createScrub, createSmoothRocks } from "../structures";
import { createGulls, createPenguins, type FaunaInstance } from "../fauna";
import { createCloudLayer, createBlock, createWaterSurface } from "../scene-kit";
import { clamp, fbm2D, gaussian, lerp, smoothstep } from "../utils";

const SIZE = 12;
const WATER_LEVEL = 0.05;
const noise = fbm2D(1013, 4);
const COVE_GAP = { x: 0.2, z: 1.5 };

function shoreline(x: number) {
  return 1.85 + Math.sin(x * 0.55 + 0.7) * 0.5 + smoothstep(2, 4.2, x) * 0.9;
}

function rawHeight(x: number, z: number) {
  const n = noise(x * 0.85 + 3, z * 0.85 + 6);
  const d = z - shoreline(x);
  const landMask = smoothstep(0.85, -0.95, d) * smoothstep(4.5, 3.3, x);
  let h = lerp(-0.62 + n * 0.1, 0.075 + n * 0.03, landMask);

  // Low vegetated dunes behind the beach.
  const thicket = gaussian(x, z, -2.4, -1.0, 2.3) * 0.42 + gaussian(x, z, -4.2, 0.9, 1.7) * 0.3;
  h += thicket * landMask;
  h += gaussian(x, z, 0.6, -4.4, 2.4) * 0.2;

  // Sandy runnels and wet patches at the tide line.
  const wet = smoothstep(0.9, 0.1, d) * smoothstep(4.4, 3.4, x);
  h = lerp(h, 0.03, wet * 0.4);
  return h;
}

function height(x: number, z: number) {
  return rawHeight(x, z);
}

const sandA = new THREE.Color("#e6d7b6");
const sandB = new THREE.Color("#f0e6cd");
const wetSand = new THREE.Color("#c9b896");
const thicketA = new THREE.Color("#6c8150");
const thicketB = new THREE.Color("#87995d");
const graniteA = new THREE.Color("#d3c8b1");
const graniteB = new THREE.Color("#b9ad95");
const seabed = new THREE.Color("#c0b08d");
const deepBed = new THREE.Color("#3f6b6b");

function terrainColor(x: number, z: number, h: number, slope: number) {
  const n = noise(x * 1.5 + 9, z * 1.5 + 4);
  const c = sandA.clone().lerp(sandB, n);
  if (h > 0.2) {
    const green = thicketA.clone().lerp(thicketB, n);
    c.lerp(green, smoothstep(0.2, 0.42, h) * 0.9);
  }
  if (h < 0.1) c.lerp(wetSand, smoothstep(0.1, 0.02, h) * 0.65);
  if (h < 0.0) {
    const depth = clamp((WATER_LEVEL - h) / 0.9, 0, 1);
    c.lerp(seabed, smoothstep(0, 0.4, depth) * 0.5);
    c.lerp(deepBed, smoothstep(0.4, 1, depth) * 0.6);
  }
  if (slope > 0.7) {
    c.lerp(graniteA.clone().lerp(graniteB, n), smoothstep(0.7, 1.6, slope) * 0.5);
  }
  return c;
}

export function buildBoulders(context: SceneContext): SceneBuild {
  const content = DIORAMA_BY_SLUG.boulders;
  const block = createBlock({
    context,
    size: SIZE,
    height,
    color: terrainColor,
    strata: [
      {
        top: "#c8b795",
        upper: "#b3a07d",
        middle: "#d2c3a4",
        lower: "#9a8663",
        seam: "#6a5941",
      },
      {
        top: "#d8c9a9",
        upper: "#c2b08d",
        middle: "#e0d2b3",
        lower: "#a8946f",
        seam: "#78644a",
      },
      {
        top: "#7b7161",
        upper: "#6a6154",
        middle: "#887c6a",
        lower: "#4f483e",
        seam: "#34302a",
      },
    ],
  });

  const water = createWaterSurface({
    size: SIZE,
    level: WATER_LEVEL,
    segments: context.quality.waterSegments,
    height,
    depth: rawHeight,
    deep: "#0f6b85",
    shallow: "#5fd6cf",
    foam: "#f4fffb",
    speed: 0.95,
  });
  block.terrain.add(water.mesh);

  const rand = context.rng;
  const boulders: Instance[] = [];
  const boulderSpecs: [number, number, number, number][] = [
    [2.6, 1.5, 2.1, 0.5],
    [3.5, 0.4, 2.5, 1.1],
    [2.1, 0.6, 1.35, 0.4],
    [3.9, 1.9, 1.7, 0.2],
    [1.4, 2.2, 1.1, 0.9],
    [4.4, -0.6, 1.9, 1.4],
    [3.1, -1.4, 1.4, 0.6],
    [2.7, 2.6, 1.25, 1.9],
    [4.6, 1.0, 1.3, 0.8],
    [1.9, -1.6, 0.8, 1.2],
    [-0.4, 2.3, 0.75, 0.3],
  ];
  for (const [x, z, scale, rotation] of boulderSpecs) {
    boulders.push({
      x,
      z,
      y: height(x, z) + scale * 0.16,
      scale: [scale * 0.72, scale * 0.52, scale * 0.64],
      rotation: rotation * Math.PI,
      color: ["#b9ae97", "#a79c85", "#c9bda6"][boulders.length % 3],
    });
  }
  for (let i = 0; i < 22; i++) {
    const x = -1.4 + rand() * 5.8;
    const z = -0.6 + rand() * 3.6;
    if (Math.hypot(x - COVE_GAP.x, z - COVE_GAP.z) < 1.1) continue;
    const scale = 0.3 + rand() * 0.55;
    boulders.push({
      x,
      z,
      y: height(x, z) + scale * 0.22,
      scale: [scale * 0.9, scale * 0.68, scale * 0.85],
      rotation: rand() * Math.PI * 2,
      color: ["#b0a58c", "#9f9480", "#c2b6a0"][i % 3],
    });
  }
  block.terrain.add(createSmoothRocks({ rocks: boulders }));

  const thicketTrees: Instance[] = [];
  for (let i = 0; i < 90; i++) {
    const x = -5.3 + rand() * 8.4;
    const z = -5.4 + rand() * 4.6;
    const h = height(x, z);
    if (h < 0.2) continue;
    thicketTrees.push({
      x,
      z,
      y: h + 0.01,
      scale: 0.26 + rand() * 0.34,
      color: ["#4c6a44", "#5b7a4c", "#3f5c3c"][i % 3],
    });
  }
  block.terrain.add(createTrees({ trees: thicketTrees }));

  const shrubs: Instance[] = [];
  for (let i = 0; i < 150; i++) {
    const x = -5.4 + rand() * 9.2;
    const z = -5.5 + rand() * 6.6;
    const h = height(x, z);
    if (h < 0.16) continue;
    if (h > 0.6 && rand() < 0.4) continue;
    shrubs.push({
      x,
      z,
      y: h + 0.005,
      scale: [0.6 + rand() * 1.2, 0.4 + rand() * 0.7, 0.6 + rand() * 1.2],
      rotation: rand() * Math.PI,
    });
  }
  block.terrain.add(createScrub({ shrubs, colors: ["#6c8250", "#7f9257", "#586d45"] }));

  block.terrain.add(
    createBoardwalk({
      points: [
        [-4.6, -2.6],
        [-3.7, -1.4],
        [-2.9, -0.3],
        [-2.3, 0.7],
        [-1.8, 1.6],
      ],
      width: 0.34,
      height,
    }),
  );

  const penguins: FaunaInstance[] = [];
  for (let i = 0; i < 46; i++) {
    const x = -1.2 + rand() * 3.2;
    const z = 0.1 + rand() * 2.0;
    const h = height(x, z);
    if (h < 0.055) continue;
    penguins.push({
      x,
      z,
      y: h + 0.01,
      rotation: rand() * Math.PI * 2,
      scale: 0.85 + rand() * 0.4,
    });
  }
  for (let i = 0; i < 9; i++) {
    const x = 2.2 + rand() * 3.0;
    const z = 1.6 + rand() * 2.4;
    penguins.push({
      x,
      z,
      y: WATER_LEVEL + 0.005,
      rotation: rand() * Math.PI * 2,
      scale: 0.8 + rand() * 0.3,
    });
  }
  const colony = createPenguins({ penguins });
  block.terrain.add(colony.group);

  const visitors: Instance[] = [
    { x: -3.6, z: -1.2 },
    { x: -3.1, z: -0.5 },
    { x: -2.6, z: 0.2 },
  ].map((person) => ({ ...person, y: height(person.x, person.z) + 0.32, scale: 0.85 }));
  block.terrain.add(createPeople({ people: visitors, colors: ["#c2543f", "#3f6f8f", "#d9c05a"] }));

  const scatterRocks: Instance[] = [];
  for (let i = 0; i < 26; i++) {
    const x = -5.4 + rand() * 10.8;
    const z = 0.4 + rand() * 5.2;
    if (rand() < 0.5) continue;
    scatterRocks.push({
      x,
      z,
      y: height(x, z) + 0.02,
      scale: [0.18 + rand() * 0.3, 0.14 + rand() * 0.26, 0.18 + rand() * 0.3],
      rotation: rand() * Math.PI,
      color: ["#cfc4ad", "#b9ad95"][i % 2],
    });
  }
  block.terrain.add(createRocks({ rocks: scatterRocks }));

  const clouds = createCloudLayer({ seed: 211, count: 4, y: 5.6, spread: 6.2, scale: 0.48 });
  block.root.add(clouds.group);
  const gulls = createGulls({ count: 7, center: [1.2, 4.2, 2.0], radius: 4.2, seed: 17 });
  block.root.add(gulls.group);

  const surf = new THREE.Mesh(
    new THREE.RingGeometry(1.1, 1.5, 40),
    new THREE.MeshBasicMaterial({
      color: "#f6fffd",
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    }),
  );
  surf.rotation.x = -Math.PI / 2;
  surf.position.set(3.2, WATER_LEVEL + 0.012, 2.9);
  block.terrain.add(surf);

  const tick = (time: number, _dt: number, atmosphere: { night: number; golden: number }) => {
    setMaterialUniforms(water.material, {
      time,
      night: atmosphere.night,
      golden: atmosphere.golden,
    });
    colony.tick(time);
    gulls.tick(time);
    clouds.tick(time, atmosphere);
    (surf.material as THREE.MeshBasicMaterial).opacity = 0.22 + Math.sin(time * 1.15) * 0.07;
  };

  return {
    root: block.root,
    terrain: block.terrain,
    base: block.base,
    landmarks: content.landmarks,
    tick,
    camera: {
      position: [16.0, 13.6, 16.8],
      target: [0, 0.4, 0],
    },
  };
}
