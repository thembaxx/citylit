import * as THREE from "three/webgpu";
import { DIORAMA_BY_SLUG } from "../content";
import type { SceneBuild, SceneContext } from "../types";
import { createRibbonMesh } from "../geometry";
import { createRiverMaterial, setMaterialUniforms } from "../materials";
import { createPeople, createRocks, createTrees, type Instance } from "../props";
import { createRondavels } from "../structures";
import { createGulls } from "../fauna";
import { createCloudLayer, createBlock, createWaterSurface } from "../scene-kit";
import { createSeaArch } from "../landmarks";
import { clamp, fbm2D, gaussian, lerp, smoothstep } from "../utils";

const SIZE = 12;
const WATER_LEVEL = 0.05;
const noise = fbm2D(501, 4);

function rawHeight(x: number, z: number) {
  const n = noise(x * 0.8 + 3, z * 0.8 + 9);
  const headland =
    gaussian(x, z, -3.1, -1.4, 2.5) * 2.5 +
    gaussian(x, z, -0.9, -2.9, 2.3) * 1.5 +
    gaussian(x, z, -4.2, -3.4, 2.0) * 1.2;
  const point = gaussian(x, z, 2.1, -1.0, 1.85) * 1.05;
  let h = -0.62 + n * 0.2 + headland + point;

  // Sandy bay tucked between the headland and the huts.
  const bay =
    smoothstep(2.5, 1.0, z) *
    smoothstep(-1.5, -0.5, x) *
    smoothstep(3.6, 2.3, x) *
    smoothstep(0.4, 1.2, z);
  h = lerp(h, 0.085 + n * 0.05, bay * 0.88);

  // Flattened green shelf where the homesteads sit.
  const shelf = gaussian(x, z, 2.0, -1.1, 1.6);
  h = lerp(h, 0.94 + n * 0.09, shelf * 0.55);

  // Shallow rock platform in front of the arch.
  const platform = gaussian(x, z, -3.0, 1.6, 1.5);
  h = lerp(h, -0.12, platform * 0.4);
  return h;
}

function height(x: number, z: number) {
  return rawHeight(x, z);
}

const grassA = new THREE.Color("#6f8f52");
const grassB = new THREE.Color("#96ac6b");
const grassDry = new THREE.Color("#b6ad72");
const sand = new THREE.Color("#ddc9a0");
const rockA = new THREE.Color("#9c8158");
const rockB = new THREE.Color("#7c6646");
const seabed = new THREE.Color("#b09f7e");
const deepBed = new THREE.Color("#3f6159");

function terrainColor(x: number, z: number, h: number, slope: number) {
  const n = noise(x * 1.6 + 11, z * 1.6 + 23);
  const c = grassA.clone().lerp(grassB, n);
  c.lerp(grassDry, smoothstep(1.6, 2.5, h) * 0.25);

  if (h < 0.16 && h > -0.05) {
    c.lerp(sand, smoothstep(0.16, 0.02, h) * 0.82);
  }
  if (h <= 0.0) {
    const depth = clamp((WATER_LEVEL - h) / 1.1, 0, 1);
    c.lerp(seabed, smoothstep(0, 0.35, depth) * 0.6);
    c.lerp(deepBed, smoothstep(0.4, 1, depth) * 0.55);
  }
  if (slope > 0.68) {
    const rocky = rockA.clone().lerp(rockB, n);
    c.lerp(rocky, smoothstep(0.68, 1.9, slope) * 0.94);
  }
  return c;
}

export function buildHoleInTheWall(context: SceneContext): SceneBuild {
  const content = DIORAMA_BY_SLUG["hole-in-the-wall"];
  const block = createBlock({
    context,
    size: SIZE,
    height,
    color: terrainColor,
    strata: [
      {
        top: "#b09a72",
        upper: "#99815c",
        middle: "#c0a67c",
        lower: "#8a6f4f",
        seam: "#54432f",
      },
      {
        top: "#c6b189",
        upper: "#ad9770",
        middle: "#cdb994",
        lower: "#957d5c",
        seam: "#63513a",
      },
      {
        top: "#6f6454",
        upper: "#5f5648",
        middle: "#7a6d5b",
        lower: "#4c453a",
        seam: "#332e26",
      },
    ],
  });

  const water = createWaterSurface({
    size: SIZE,
    level: WATER_LEVEL,
    segments: context.quality.waterSegments,
    height,
    depth: rawHeight,
    deep: "#0e6472",
    shallow: "#63d6c3",
    foam: "#eefff8",
    speed: 0.9,
  });
  block.terrain.add(water.mesh);

  const arch = createSeaArch({
    x: -3.0,
    z: 1.35,
    y: 0.02,
    rotation: 0.9,
    scale: 1.5,
  });
  block.terrain.add(arch);

  const rand = context.rng;
  const rocks: Instance[] = [];
  for (let i = 0; i < 54; i++) {
    const x = -5.7 + rand() * 11.4;
    const z = -5.4 + rand() * 6.4;
    const h = rawHeight(x, z);
    if (h < -0.05 || h > 2.2) continue;
    const slope =
      Math.abs(rawHeight(x + 0.2, z) - rawHeight(x - 0.2, z)) +
      Math.abs(rawHeight(x, z + 0.2) - rawHeight(x, z - 0.2));
    if (slope < 0.35) continue;
    rocks.push({
      x,
      z,
      y: h + 0.02,
      scale: [0.3 + rand() * 0.55, 0.25 + rand() * 0.5, 0.3 + rand() * 0.55],
      rotation: rand() * Math.PI * 2,
      color: ["#9c8158", "#846b49", "#b09268"][i % 3],
    });
  }
  block.terrain.add(createRocks({ rocks }));

  const huts = [
    { x: 1.65, z: -1.05 },
    { x: 2.05, z: -0.62 },
    { x: 1.35, z: -0.5 },
    { x: 2.45, z: -1.35 },
    { x: 0.95, z: -1.15 },
    { x: 2.2, z: -1.8 },
  ].map((hut) => ({
    ...hut,
    y: height(hut.x, hut.z) + 0.02,
    scale: 0.9 + rand() * 0.45,
    rotation: rand() * Math.PI,
  }));
  block.terrain.add(createRondavels({ huts }));

  const trees: Instance[] = [];
  for (let i = 0; i < 120; i++) {
    const x = -5.4 + rand() * 10.8;
    const z = -5.4 + rand() * 8.4;
    const h = height(x, z);
    if (h < 0.28) continue;
    const slope =
      Math.abs(height(x + 0.2, z) - height(x - 0.2, z)) +
      Math.abs(height(x, z + 0.2) - height(x, z - 0.2));
    if (slope > 0.8) continue;
    if (gaussian(x, z, 2.0, -1.1, 0.95) > 0.5) continue;
    trees.push({
      x,
      z,
      y: h + 0.01,
      scale: 0.34 + rand() * 0.5,
      color: ["#416a42", "#4f7a49", "#375c3c", "#5b8750"][i % 4],
    });
  }
  block.terrain.add(createTrees({ trees }));

  const people: Instance[] = [];
  for (let i = 0; i < 7; i++) {
    const x = 0.2 + rand() * 2.2;
    const z = 1.0 + rand() * 0.9;
    if (height(x, z) < 0.05) continue;
    people.push({
      x,
      z,
      y: height(x, z) + 0.01,
      scale: 0.9 + rand() * 0.4,
    });
  }
  block.terrain.add(createPeople({ people, colors: ["#c2543f", "#e3c14c", "#2f6f8f"] }));

  // A thin path from the beach up to the huts.
  const pathPoints: THREE.Vector3[] = [];
  for (let i = 0; i <= 18; i++) {
    const t = i / 18;
    const x = lerp(0.4, 1.8, t) + Math.sin(t * 3.2) * 0.25;
    const z = lerp(1.7, -0.35, t);
    pathPoints.push(new THREE.Vector3(x, height(x, z) + 0.03, z));
  }
  const pathMaterial = new THREE.MeshStandardMaterial({ color: "#c3a778", roughness: 1 });
  const path = createRibbonMesh({
    points: pathPoints,
    width: 0.14,
    material: pathMaterial,
    segments: 32,
    yOffset: 0.01,
  });
  block.terrain.add(path);

  const clouds = createCloudLayer({ seed: 127, y: 5.4, spread: 6.4, scale: 0.5 });
  block.root.add(clouds.group);
  const gulls = createGulls({ count: 7, center: [0, 4.6, 1.6], radius: 4.4, seed: 9 });
  block.root.add(gulls.group);

  const shoreFoam = new THREE.Mesh(
    new THREE.RingGeometry(0.9, 1.16, 32),
    new THREE.MeshBasicMaterial({
      color: "#f2fffa",
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    }),
  );
  shoreFoam.rotation.x = -Math.PI / 2;
  shoreFoam.position.set(1.2, WATER_LEVEL + 0.01, 2.1);
  block.terrain.add(shoreFoam);

  const streamMaterial = createRiverMaterial({ color: "#7fd6c2", opacity: 0.55 });
  const stream = createRibbonMesh({
    points: Array.from({ length: 14 }, (_, i) => {
      const t = i / 13;
      const x = lerp(-1.7, -0.4, t);
      const z = lerp(1.9, 0.9, t);
      return new THREE.Vector3(x, height(x, z) + 0.05, z);
    }),
    width: 0.18,
    material: streamMaterial,
    segments: 26,
    yOffset: 0.01,
  });
  block.terrain.add(stream);

  const tick = (time: number, _dt: number, atmosphere: { night: number; golden: number }) => {
    setMaterialUniforms(water.material, {
      time,
      night: atmosphere.night,
      golden: atmosphere.golden,
    });
    streamMaterial.emissiveIntensity = 0.16 + atmosphere.night * 0.12;
    (shoreFoam.material as THREE.MeshBasicMaterial).opacity = 0.22 + Math.sin(time * 1.3) * 0.06;
    gulls.tick(time);
    clouds.tick(time, atmosphere);
  };

  return {
    root: block.root,
    terrain: block.terrain,
    base: block.base,
    landmarks: content.landmarks,
    tick,
    camera: {
      position: [15.8, 13.2, 16.6],
      target: [0, 0.4, 0],
    },
  };
}
