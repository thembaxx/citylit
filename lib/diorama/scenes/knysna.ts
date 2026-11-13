import * as THREE from "three/webgpu";
import { DIORAMA_BY_SLUG } from "../content";
import type { SceneBuild, SceneContext } from "../types";
import { createBase } from "../base";
import { createTerrainMesh, createTerrainSkirt, createWaterMesh } from "../geometry";
import {
  createCloudMaterial,
  createStrataMaterial,
  createWaterMaterial,
  setMaterialUniforms,
} from "../materials";
import {
  createBoat,
  createClouds,
  createHouses,
  createJetty,
  createRocks,
  createRoad,
  createTrees,
  type Instance,
} from "../props";
import { createSeaArch } from "../landmarks";
import { createHouseFacade, createRoadTexture } from "../textures";
import { clamp, fbm2D, lerp, smoothstep } from "../utils";

const SIZE = 12;
const noise = fbm2D(733, 4);
const WATER_LEVEL = 0.05;

function ridge(
  x: number,
  z: number,
  ax: number,
  az: number,
  bx: number,
  bz: number,
  radius: number,
  height: number,
) {
  const vx = bx - ax;
  const vz = bz - az;
  const t = clamp(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz), 0, 1);
  const px = ax + vx * t;
  const pz = az + vz * t;
  const d = Math.hypot(x - px, z - pz) / radius;
  return height * Math.exp(-Math.pow(d, 3.2));
}

function leftHead(x: number, z: number) {
  return (
    ridge(x, z, -5.3, -1.6, -3.0, 4.0, 1.3, 2.6) + ridge(x, z, -4.4, 1.8, -3.4, 2.9, 0.9, 0.45)
  );
}

function rightHead(x: number, z: number) {
  return ridge(x, z, 5.2, -1.4, 3.7, 4.4, 1.4, 2.85) + ridge(x, z, 4.0, 1.4, 4.7, 2.8, 0.95, 0.4);
}

function rawHeight(x: number, z: number) {
  const n = noise(x * 0.5 + 4, z * 0.5 + 9);
  const heads = leftHead(x, z) + rightHead(x, z);
  let h = -0.72 + n * 0.24 + heads * (0.92 + noise(x * 1.3 + 2, z * 1.3 + 6) * 0.22);
  h += heads * 0.12;
  if (h > 0.1) h += (noise(x * 2.2, z * 2.2) - 0.5) * 0.16;
  const town = smoothstep(-2.3, -3.2, x) * smoothstep(1.0, -1.0, z) * smoothstep(-6.0, -5.2, z);
  h = lerp(h, 0.2, town * 0.9);
  const forest = smoothstep(2.1, 3.1, x) * smoothstep(0.4, -1.0, z) * smoothstep(-6.0, -5.2, z);
  h = lerp(h, 0.24, forest * 0.84);
  return h;
}

function height(x: number, z: number) {
  const raw = rawHeight(x, z);
  if (raw < 0.06) {
    return 0.004 + noise(x * 1.2 + 9, z * 1.2 + 3) * 0.018 + Math.max(0, raw) * 0.35;
  }
  return raw;
}

const fynbosA = new THREE.Color("#6f8a52");
const fynbosB = new THREE.Color("#93a86a");
const sand = new THREE.Color("#d6c393");
const cliffA = new THREE.Color("#b08a62");
const cliffB = new THREE.Color("#8a6a4a");
const cliffTop = new THREE.Color("#8f8f62");
const seaBed = new THREE.Color("#3f5748");
const seaDeep = new THREE.Color("#263c34");

function terrainColor(x: number, z: number, h: number, slope: number) {
  const n = noise(x * 1.5 + 13, z * 1.5 + 27);
  const c = fynbosA.clone().lerp(fynbosB, n);
  if (h < 0.07) {
    const depth = clamp((WATER_LEVEL - rawHeight(x, z)) / 0.7, 0, 1);
    c.lerp(seaBed, 0.45 + depth * 0.35);
    c.lerp(seaDeep, smoothstep(0.35, 1, depth) * 0.5);
  }
  if (h > 0.015 && h < 0.22) {
    c.lerp(sand, smoothstep(0.22, 0.03, h) * 0.78);
  }
  if (slope > 0.72) {
    const rocky = cliffA.clone().lerp(cliffB, n);
    c.lerp(rocky, smoothstep(0.72, 1.8, slope) * 0.92);
  }
  if (h > 2.1) c.lerp(cliffTop, smoothstep(2.1, 2.9, h) * 0.22);
  return c;
}

export function buildKnysna(context: SceneContext): SceneBuild {
  const content = DIORAMA_BY_SLUG.knysna;
  const root = new THREE.Group();
  const terrainGroup = new THREE.Group();
  const baseGroup = new THREE.Group();
  root.add(terrainGroup, baseGroup);

  const soil = createStrataMaterial({
    top: "#b09366",
    upper: "#9a7d55",
    middle: "#c2a679",
    lower: "#8a6f50",
    seam: "#584634",
  });
  const clay = createStrataMaterial({
    top: "#c1a273",
    upper: "#ad8f63",
    middle: "#cfb286",
    lower: "#957a56",
    seam: "#665039",
  });
  const rock = createStrataMaterial({
    top: "#5f5646",
    upper: "#534a3d",
    middle: "#6d6250",
    lower: "#463f34",
    seam: "#302b24",
  });
  const base = createBase({
    size: SIZE,
    depth: 2.4,
    slabs: 3,
    material: soil,
    materials: [soil, clay, rock],
  });
  baseGroup.add(base.group);

  const terrain = createTerrainMesh({
    size: SIZE,
    segments: context.quality.terrainSegments,
    height,
    color: terrainColor,
  });
  terrainGroup.add(terrain);
  const skirt = createTerrainSkirt({
    size: SIZE,
    segments: context.quality.terrainSegments,
    height,
    material: soil,
  });
  if (skirt) terrainGroup.add(skirt);

  const waterMaterial = createWaterMaterial({
    deep: "#0d5a68",
    shallow: "#5cc6bd",
    foam: "#eafaf5",
    speed: 0.85,
  });
  const water = createWaterMesh({
    size: SIZE,
    segments: context.quality.waterSegments,
    level: WATER_LEVEL,
    height,
    depth: rawHeight,
    material: waterMaterial,
  });
  terrainGroup.add(water);

  const arch = createSeaArch({ x: 0.9, z: 4.5, y: 0.12, rotation: 0.7, scale: 1.45 });
  arch.userData.landmark = "sea-arch";
  terrainGroup.add(arch);

  const headlandRocks: Instance[] = [];
  const rand = context.rng;
  for (let i = 0; i < 46; i++) {
    const x = -5.5 + rand() * 11;
    const z = -5.2 + rand() * 10.8;
    const h = rawHeight(x, z);
    if (h < -0.1 || h > 2.3) continue;
    const slope =
      Math.abs(rawHeight(x + 0.2, z) - rawHeight(x - 0.2, z)) +
      Math.abs(rawHeight(x, z + 0.2) - rawHeight(x, z - 0.2));
    if (slope < 0.45) continue;
    headlandRocks.push({
      x,
      z,
      y: height(x, z) + 0.02,
      scale: [0.35 + rand() * 0.65, 0.3 + rand() * 0.55, 0.35 + rand() * 0.65],
      rotation: rand() * Math.PI * 2,
      color: ["#9a7d5c", "#7f674d", "#ad906a"][i % 3],
    });
  }
  terrainGroup.add(createRocks({ rocks: headlandRocks }));

  const trees: Instance[] = [];
  for (let i = 0; i < 100; i++) {
    const x = -5.4 + rand() * 10.8;
    const z = -5.4 + rand() * 10.6;
    const h = rawHeight(x, z);
    if (h < 0.18 || h > 2.6) continue;
    const slope =
      Math.abs(rawHeight(x + 0.2, z) - rawHeight(x - 0.2, z)) +
      Math.abs(rawHeight(x, z + 0.2) - rawHeight(x, z - 0.2));
    if (slope > 0.75) continue;
    const coastal = x > 2 && z < -0.8;
    trees.push({
      x,
      z,
      y: height(x, z) + 0.01,
      scale: 0.4 + rand() * 0.55,
      color: coastal
        ? ["#2f5c43", "#3b6b4b", "#28513c"][i % 3]
        : ["#4d7449", "#5d8551", "#416a45"][i % 3],
    });
  }
  for (let i = 0; i < 22; i++) {
    const x = -2.4 + rand() * 3.4;
    const z = -4.9 + rand() * 1.1;
    trees.push({
      x,
      z,
      y: height(x, z) + 0.01,
      scale: 0.36 + rand() * 0.4,
      color: ["#517a4d", "#638a55"][i % 2],
    });
  }
  terrainGroup.add(createTrees({ trees }));

  const houses: Instance[] = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 5; col++) {
      const x = -4.85 + col * 0.55 + (row % 2) * 0.1;
      const z = -4.55 + row * 0.72;
      if (rand() < 0.18) continue;
      const scale = 0.46 + rand() * 0.14;
      houses.push({
        x,
        z,
        y: height(x, z) + 0.01,
        rotation: Math.PI / 2 + (rand() - 0.5) * 0.35,
        scale: [scale, scale * (0.9 + rand() * 0.2), scale],
      });
    }
  }
  const houseSet = createHouses({
    houses,
    facade: createHouseFacade(),
    wallColors: ["#e7ddc8", "#d9cdb5", "#cfd8d3", "#e3c9a6", "#d7d2c6"],
    roofColors: ["#5f6e6a", "#7c5b49", "#4e6c6b", "#a34f3f", "#6e6e6e"],
  });
  terrainGroup.add(houseSet.group);

  const townRoad = createRoad({
    points: Array.from({ length: 20 }, (_, i) => {
      const z = lerp(-4.9, -1.9, i / 19);
      const x = -3.2 + Math.sin((i / 19) * 2.4) * 0.12;
      return new THREE.Vector3(x, height(x, z) + 0.03, z);
    }),
    width: 0.34,
    texture: createRoadTexture(),
  });
  terrainGroup.add(townRoad);

  const jetty = createJetty({
    start: new THREE.Vector3(-3.05, 0, -2.55),
    end: new THREE.Vector3(-1.55, 0, -3.1),
    width: 0.28,
    y: WATER_LEVEL,
  });
  terrainGroup.add(jetty);

  const boatSpecs: [number, number, number, number, boolean][] = [
    [-1.65, -3.6, 0.7, 0.9, true],
    [0.35, -2.15, -0.4, 0.8, true],
    [1.15, -4.0, 2.1, 0.7, false],
    [-0.45, -1.1, 1.2, 0.65, true],
    [0.9, 1.8, -1.4, 0.55, false],
  ];
  const boats: THREE.Group[] = [];
  const boatBase: number[] = [];
  for (const [x, z, rotation, scale, sail] of boatSpecs) {
    const boat = createBoat({
      x,
      z,
      y: 0.055,
      rotation,
      scale,
      sail,
      color: sail ? "#f4f0e6" : "#e2d5bd",
      sailColor: "#fffdf6",
    });
    terrainGroup.add(boat);
    boats.push(boat);
    boatBase.push(boat.position.y);
  }

  const cloudMaterial = createCloudMaterial();
  const clouds = createClouds({
    count: 4,
    seed: 91,
    y: 6.3,
    spread: 6.6,
    scale: 0.54,
    material: cloudMaterial,
  });
  root.add(clouds.group);

  const dayCloud = new THREE.Color("#ffffff");
  const nightCloud = new THREE.Color("#9aa9c4");
  const tick = (time: number, _dt: number, atmosphere: { night: number; golden: number }) => {
    setMaterialUniforms(waterMaterial, {
      time,
      night: atmosphere.night,
      golden: atmosphere.golden,
    });
    houseSet.bodyMaterial.emissiveIntensity = atmosphere.night * 1.3;
    boats.forEach((boat, index) => {
      boat.position.y = boatBase[index] + Math.sin(time * 0.7 + index * 1.4) * 0.012;
      boat.rotation.z = Math.sin(time * 0.55 + index * 0.9) * 0.03;
      boat.rotation.x = Math.cos(time * 0.5 + index) * 0.015;
    });
    cloudMaterial.color.lerpColors(dayCloud, nightCloud, atmosphere.night);
    for (const cloud of clouds.clouds) {
      cloud.group.position.x = cloud.baseX + Math.sin(time * 0.05 + cloud.phase) * 1.25;
      cloud.group.position.z = cloud.baseZ + Math.cos(time * 0.07 + cloud.phase) * 0.6;
      cloud.group.position.y = cloud.baseY + Math.sin(time * 0.3 + cloud.phase) * 0.08;
    }
  };

  return {
    root,
    terrain: terrainGroup,
    base: baseGroup,
    landmarks: content.landmarks,
    tick,
    camera: {
      position: [15.8, 13.6, 16.8],
      target: [0, 0.3, 0],
    },
  };
}
