import * as THREE from "three/webgpu";
import { DIORAMA_BY_SLUG } from "../content";
import type { SceneBuild, SceneContext } from "../types";
import {
  createRoad,
  createBoat,
  createHouses,
  createJetty,
  createRocks,
  createTrees,
  type Instance,
} from "../props";
import { createFort, createLighthouse, createScrub } from "../structures";
import { createGulls } from "../fauna";
import { createCloudLayer, createBlock, createWaterSurface } from "../scene-kit";
import { setMaterialUniforms } from "../materials";
import { createHouseFacade, createRoadTexture } from "../textures";
import { clamp, fbm2D, gaussian, lerp, smoothstep } from "../utils";

const SIZE = 12;
const WATER_LEVEL = 0.05;
const noise = fbm2D(1123, 4);
const ISLAND = { x: -0.2, z: -0.3, radius: 3.35 };

function rawHeight(x: number, z: number) {
  const n = noise(x * 0.9 + 4, z * 0.9 + 8);
  const r = Math.hypot(x - ISLAND.x, z - ISLAND.z);
  const island = 0.44 + n * 0.075;
  let h = lerp(-0.58 + n * 0.08, island, smoothstep(ISLAND.radius + 0.4, ISLAND.radius - 0.5, r));

  // Old quarry, scraped down to pale limestone.
  h -= gaussian(x, z, 1.5, -2.15, 0.85) * 0.2;
  // Harbour basin, dredged below the tide.
  h = lerp(h, -0.24, gaussian(x, z, 2.5, 0.85, 0.6) * 0.85);
  // A low ridge behind the prison.
  h += gaussian(x, z, -0.8, -1.9, 1.6) * 0.12;
  return h;
}

function height(x: number, z: number) {
  return rawHeight(x, z);
}

const grassA = new THREE.Color("#9a9d68");
const grassB = new THREE.Color("#b2b07c");
const shoreRock = new THREE.Color("#b7af9a");
const quarry = new THREE.Color("#ddd3bd");
const sandBed = new THREE.Color("#d2c6a6");
const deepBed = new THREE.Color("#3f7370");

function terrainColor(x: number, z: number, h: number, slope: number) {
  const n = noise(x * 1.5 + 6, z * 1.5 + 12);
  const c = grassA.clone().lerp(grassB, n);
  if (h > 0.3) c.lerp(quarry, smoothstep(0.3, 0.18, h) * 0.55);
  if (h < 0.12) {
    const depth = clamp((WATER_LEVEL - h) / 0.8, 0, 1);
    c.lerp(sandBed, smoothstep(0, 0.45, depth) * 0.6);
    c.lerp(deepBed, smoothstep(0.45, 1, depth) * 0.55);
  }
  if (slope > 0.75) c.lerp(shoreRock, smoothstep(0.75, 1.7, slope) * 0.85);
  return c;
}

export function buildRobbenIsland(context: SceneContext): SceneBuild {
  const content = DIORAMA_BY_SLUG["robben-island"];
  const block = createBlock({
    context,
    size: SIZE,
    height,
    color: terrainColor,
    strata: [
      {
        top: "#b9a98d",
        upper: "#a39074",
        middle: "#c6b697",
        lower: "#8d7a5e",
        seam: "#5f4f3a",
      },
      {
        top: "#cdbfa2",
        upper: "#b6a487",
        middle: "#d8cbae",
        lower: "#9d8a6c",
        seam: "#6f5d44",
      },
      {
        top: "#77705f",
        upper: "#665f51",
        middle: "#857c69",
        lower: "#4c463c",
        seam: "#312e28",
      },
    ],
  });

  const water = createWaterSurface({
    size: SIZE,
    level: WATER_LEVEL,
    segments: context.quality.waterSegments,
    height,
    depth: rawHeight,
    deep: "#0d6e8a",
    shallow: "#5fd8d0",
    foam: "#f3fffc",
    speed: 1.15,
  });
  block.terrain.add(water.mesh);

  const fort = createFort({ x: 0.05, z: 0.05, y: height(0.05, 0.05), size: 1.75, scale: 1.1 });
  block.terrain.add(fort);

  const lighthouse = createLighthouse({
    x: -2.05,
    z: -1.45,
    y: height(-2.05, -1.45),
    height: 1.05,
    scale: 1,
    bands: 2,
  });
  block.terrain.add(lighthouse.group);

  const lightHouse = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.22, 0.3),
    new THREE.MeshStandardMaterial({ color: "#e7e1d2", roughness: 0.9 }),
  );
  lightHouse.position.set(-2.04, height(-2.04, -1.2) + 0.11, -1.2);
  block.terrain.add(lightHouse);

  // Harbour works on the east side.
  const stone = new THREE.MeshStandardMaterial({
    color: "#9c9686",
    roughness: 0.95,
    flatShading: true,
  });
  const harbour = { x: 2.5, z: 0.85 };
  for (let i = 0; i < 9; i++) {
    const angle = Math.PI * 1.05 + (i / 8) * Math.PI * 0.72;
    const radius = 0.82;
    const blockMesh = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.17, 0.15), stone);
    blockMesh.position.set(
      harbour.x + Math.cos(angle) * radius,
      WATER_LEVEL + 0.06,
      harbour.z + Math.sin(angle) * radius,
    );
    blockMesh.rotation.y = -angle + Math.PI / 2;
    blockMesh.castShadow = true;
    block.terrain.add(blockMesh);
  }
  block.terrain.add(
    createJetty({
      start: new THREE.Vector3(2.35, 0, 0.75),
      end: new THREE.Vector3(1.72, 0, 0.62),
      width: 0.26,
      y: WATER_LEVEL,
    }),
  );

  const ferry = createBoat({
    x: 3.0,
    z: 1.35,
    y: WATER_LEVEL - 0.01,
    rotation: -1.1,
    scale: 1.15,
    sail: false,
    color: "#e9e6dc",
  });
  block.terrain.add(ferry);
  const workBoat = createBoat({
    x: 2.55,
    z: 0.35,
    y: WATER_LEVEL - 0.01,
    rotation: 0.6,
    scale: 0.6,
    sail: false,
    color: "#7f9aa4",
  });
  block.terrain.add(workBoat);

  // A loop of pale gravel road around the prison.
  const loop: THREE.Vector3[] = [];
  for (let i = 0; i <= 40; i++) {
    const angle = (i / 40) * Math.PI * 2;
    const x = 0.1 + Math.cos(angle) * 1.55;
    const z = -0.15 + Math.sin(angle) * 1.4;
    loop.push(new THREE.Vector3(x, height(x, z) + 0.03, z));
  }
  block.terrain.add(
    createRoad({ points: loop, width: 0.26, texture: createRoadTexture(), yOffset: 0.03 }),
  );

  const houses: Instance[] = [
    { x: 1.15, z: -0.85, rotation: 0.4 },
    { x: 1.5, z: -0.42, rotation: 0.2 },
    { x: -1.25, z: 0.95, rotation: -0.5 },
    { x: -1.65, z: 1.3, rotation: 0.15 },
    { x: 0.6, z: 1.55, rotation: -0.9 },
  ].map((house) => ({
    ...house,
    y: height(house.x, house.z) + 0.01,
    scale: [0.42, 0.42, 0.42] as [number, number, number],
  }));
  const houseSet = createHouses({
    houses,
    facade: createHouseFacade(),
    wallColors: ["#e6dccb", "#d8cebb", "#eee7d8"],
    roofColors: ["#7d5c47", "#6d6a5e", "#8a6a51"],
  });
  block.terrain.add(houseSet.group);

  const rand = context.rng;
  const garage = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.16, 0.34),
    new THREE.MeshStandardMaterial({ color: "#b9b3a1", roughness: 0.95 }),
  );
  garage.position.set(-1.9, height(-1.9, 0.65) + 0.08, 0.65);
  garage.castShadow = true;
  block.terrain.add(garage);

  const rocks: Instance[] = [];
  for (let i = 0; i < 60; i++) {
    const r = 2.2 + rand() * 1.5;
    const angle = rand() * Math.PI * 2;
    const x = ISLAND.x + Math.cos(angle) * r;
    const z = ISLAND.z + Math.sin(angle) * r;
    const h = rawHeight(x, z);
    if (h < -0.1) continue;
    rocks.push({
      x,
      z,
      y: h + 0.02,
      scale: [0.2 + rand() * 0.36, 0.16 + rand() * 0.3, 0.2 + rand() * 0.36],
      rotation: rand() * Math.PI * 2,
      color: ["#b7af9a", "#a49c87", "#c9c2ae"][i % 3],
    });
  }
  // Quarry spoil: pale chips of limestone.
  for (let i = 0; i < 24; i++) {
    const x = 1.1 + rand() * 0.9;
    const z = -2.5 + rand() * 0.8;
    rocks.push({
      x,
      z,
      y: height(x, z) + 0.02,
      scale: [0.12 + rand() * 0.22, 0.1 + rand() * 0.18, 0.12 + rand() * 0.22],
      rotation: rand() * Math.PI,
      color: ["#ded5c2", "#cfc5ae"][i % 2],
    });
  }
  block.terrain.add(createRocks({ rocks }));

  const trees: Instance[] = [];
  for (let i = 0; i < 46; i++) {
    const x = ISLAND.x - 2.6 + rand() * 5.2;
    const z = ISLAND.z - 2.4 + rand() * 4.8;
    const h = height(x, z);
    if (h < 0.26) continue;
    if (Math.hypot(x - 0.05, z - 0.05) < 1.35) continue;
    if (Math.hypot(x - 2.5, z - 0.85) < 0.9) continue;
    trees.push({
      x,
      z,
      y: h + 0.01,
      scale: 0.22 + rand() * 0.26,
      color: ["#5d7345", "#6c814c", "#4d633d"][i % 3],
    });
  }
  block.terrain.add(createTrees({ trees }));

  const shrubs: Instance[] = [];
  for (let i = 0; i < 150; i++) {
    const x = ISLAND.x - 2.9 + rand() * 5.8;
    const z = ISLAND.z - 2.7 + rand() * 5.4;
    const h = height(x, z);
    if (h < 0.18) continue;
    if (Math.hypot(x - 0.05, z - 0.05) < 1.1) continue;
    shrubs.push({
      x,
      z,
      y: h + 0.005,
      scale: [0.5 + rand() * 1.0, 0.35 + rand() * 0.6, 0.5 + rand() * 1.0],
      rotation: rand() * Math.PI,
    });
  }
  block.terrain.add(createScrub({ shrubs, colors: ["#8a9360", "#9ca56b", "#76804f"] }));

  const clouds = createCloudLayer({ seed: 233, count: 4, y: 5.8, spread: 6.6, scale: 0.52 });
  block.root.add(clouds.group);
  const gulls = createGulls({ count: 10, center: [0.6, 4.4, 1.2], radius: 4.6, seed: 11 });
  block.root.add(gulls.group);

  const tick = (time: number, _dt: number, atmosphere: { night: number; golden: number }) => {
    setMaterialUniforms(water.material, {
      time,
      night: atmosphere.night,
      golden: atmosphere.golden,
    });
    lighthouse.beam.rotation.y = time * 0.45;
    const beam = lighthouse.beam.children[0] as THREE.Mesh | undefined;
    if (beam) (beam.material as THREE.MeshBasicMaterial).opacity = atmosphere.night * 0.14;
    houseSet.bodyMaterial.emissiveIntensity = atmosphere.night * 1.2;
    ferry.position.y = WATER_LEVEL - 0.01 + Math.sin(time * 0.8) * 0.01;
    ferry.rotation.z = Math.sin(time * 0.6) * 0.02;
    workBoat.position.y = WATER_LEVEL - 0.01 + Math.sin(time * 0.9 + 1.2) * 0.008;
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
      position: [16.4, 14.2, 17.0],
      target: [0, 0.4, 0],
    },
  };
}
