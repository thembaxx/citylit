import * as THREE from "three/webgpu";
import { DIORAMA_BY_SLUG } from "../content";
import type { SceneBuild, SceneContext } from "../types";
import { setMaterialUniforms } from "../materials";
import { createBoat, createRocks, createTrees, type Instance } from "../props";
import { createMangroves, createPalms, createScrub } from "../structures";
import { createGulls } from "../fauna";
import { createCloudLayer, createBlock, createWaterSurface } from "../scene-kit";
import { clamp, fbm2D, gaussian, lerp, smoothstep } from "../utils";

const SIZE = 12;
const WATER_LEVEL = 0.05;
const noise = fbm2D(1231, 4);

function channelCenter(z: number) {
  return 1.05 + Math.sin(z * 0.55 + 0.4) * 0.8 + Math.max(0, z) * 0.26;
}

function channelWidth(z: number) {
  return 0.62 + Math.sin(z * 0.9 + 1.2) * 0.12 + smoothstep(3.4, 6, z) * 0.5;
}

function rawHeight(x: number, z: number) {
  const n = noise(x * 0.8 + 7, z * 0.8 + 2);
  let h = 0.34 + n * 0.13;

  // Raffia-palm dunes, high in the back-left corner.
  const dunes =
    gaussian(x, z, -3.5, -2.4, 2.1) * 2.15 +
    gaussian(x, z, -4.6, 0.3, 1.6) * 1.35 +
    gaussian(x, z, -1.4, -4.6, 1.8) * 1.15;
  h += dunes;
  h += (noise(x * 2 + 3, z * 2 + 5) - 0.5) * 0.3 * smoothstep(0.9, 2.0, h);

  // Open surf along the seaward edge.
  h = lerp(-0.52 + n * 0.08, h, smoothstep(4.5, 3.3, x));

  // Tidal channel winding from the lakes to the mouth.
  const carve =
    smoothstep(channelWidth(z) + 0.55, channelWidth(z) - 0.1, Math.abs(x - channelCenter(z))) *
    smoothstep(-4.4, -2.8, z);
  h = lerp(h, -0.2 + n * 0.06, carve * 0.96);
  return h;
}

function height(x: number, z: number) {
  return rawHeight(x, z);
}

const sandA = new THREE.Color("#e3d6b2");
const sandB = new THREE.Color("#efe3c1");
const duneSand = new THREE.Color("#f3e7c4");
const mangrove = new THREE.Color("#4f6f42");
const thicket = new THREE.Color("#67804a");
const seabed = new THREE.Color("#cdbf9c");
const deepBed = new THREE.Color("#3f7a6b");

function terrainColor(x: number, z: number, h: number, slope: number) {
  const n = noise(x * 1.5 + 8, z * 1.5 + 16);
  const c = sandA.clone().lerp(sandB, n);
  if (h > 1.1) c.lerp(duneSand, smoothstep(1.1, 2.1, h) * 0.5);
  if (h > 0.28 && h < 0.75) {
    const green = mangrove.clone().lerp(thicket, n);
    c.lerp(green, smoothstep(0.36, 0.5, h) * 0.55);
  }
  if (h < 0.16) {
    const depth = clamp((WATER_LEVEL - h) / 0.7, 0, 1);
    c.lerp(seabed, smoothstep(0, 0.4, depth) * 0.55);
    c.lerp(deepBed, smoothstep(0.4, 1, depth) * 0.6);
  }
  if (slope > 0.65) c.lerp(duneSand, smoothstep(0.65, 1.5, slope) * 0.4);
  return c;
}

export function buildKosiBay(context: SceneContext): SceneBuild {
  const content = DIORAMA_BY_SLUG["kosi-bay"];
  const block = createBlock({
    context,
    size: SIZE,
    height,
    color: terrainColor,
    strata: [
      {
        top: "#d3c19c",
        upper: "#bda98a",
        middle: "#ddcbaa",
        lower: "#a3906f",
        seam: "#726248",
      },
      {
        top: "#e0d0ad",
        upper: "#cbb894",
        middle: "#e8d9ba",
        lower: "#b09b78",
        seam: "#7d6b50",
      },
      {
        top: "#7f7561",
        upper: "#6d6453",
        middle: "#8c816c",
        lower: "#514a3e",
        seam: "#35312a",
      },
    ],
  });

  const water = createWaterSurface({
    size: SIZE,
    level: WATER_LEVEL,
    segments: context.quality.waterSegments,
    height,
    depth: rawHeight,
    deep: "#1c7d78",
    shallow: "#72dcc8",
    foam: "#f2fffa",
    speed: 0.85,
  });
  block.terrain.add(water.mesh);

  const rand = context.rng;
  const mangroves: Instance[] = [];
  for (let i = 0; i < 90; i++) {
    const z = -4.0 + rand() * 8.2;
    const side = rand() < 0.5 ? -1 : 1;
    const offset = channelWidth(z) + 0.12 + rand() * 0.55;
    const x = channelCenter(z) + side * offset;
    const h = height(x, z);
    if (h < 0.12 || h > 1.1) continue;
    mangroves.push({
      x,
      z,
      y: h + 0.01,
      scale: 0.7 + rand() * 0.7,
      rotation: rand() * Math.PI * 2,
      color: ["#3f6b45", "#4c7a4c", "#355c3d"][i % 3],
    });
  }
  block.terrain.add(createMangroves({ trees: mangroves }));

  const palms: Instance[] = [];
  for (let i = 0; i < 40; i++) {
    const x = -5.3 + rand() * 8.4;
    const z = -5.2 + rand() * 5.4;
    const h = height(x, z);
    if (h < 0.7) continue;
    const slope =
      Math.abs(height(x + 0.3, z) - height(x - 0.3, z)) +
      Math.abs(height(x, z + 0.3) - height(x, z - 0.3));
    if (slope > 1.1) continue;
    palms.push({
      x,
      z,
      y: h + 0.01,
      scale: 0.75 + rand() * 0.55,
      rotation: rand() * Math.PI * 2,
    });
  }
  block.terrain.add(createPalms({ palms }));

  const trees: Instance[] = [];
  for (let i = 0; i < 70; i++) {
    const x = -5.4 + rand() * 9.6;
    const z = -5.3 + rand() * 7.4;
    const h = height(x, z);
    if (h < 0.45 || h > 1.6) continue;
    trees.push({
      x,
      z,
      y: h + 0.01,
      scale: 0.3 + rand() * 0.4,
      color: ["#52714a", "#5f804e", "#466341"][i % 3],
    });
  }
  block.terrain.add(createTrees({ trees }));

  const shrubs: Instance[] = [];
  for (let i = 0; i < 150; i++) {
    const x = -5.5 + rand() * 11;
    const z = -5.5 + rand() * 9.8;
    const h = height(x, z);
    if (h < 0.4) continue;
    shrubs.push({
      x,
      z,
      y: h + 0.005,
      scale: [0.6 + rand() * 1.1, 0.4 + rand() * 0.7, 0.6 + rand() * 1.1],
      rotation: rand() * Math.PI,
    });
  }
  block.terrain.add(createScrub({ shrubs, colors: ["#6d8250", "#7f9257", "#5b7046"] }));

  const rocks: Instance[] = [];
  for (let i = 0; i < 34; i++) {
    const x = 3.6 + rand() * 2.2;
    const z = -1.8 + rand() * 6.4;
    rocks.push({
      x,
      z,
      y: height(x, z) + 0.02,
      scale: [0.18 + rand() * 0.3, 0.14 + rand() * 0.25, 0.18 + rand() * 0.3],
      rotation: rand() * Math.PI,
      color: ["#94876b", "#7d7057", "#a89b7d"][i % 3],
    });
  }
  block.terrain.add(createRocks({ rocks }));

  // Fish traps: reed poles staked in a funnel across the channel.
  const trapMaterial = new THREE.MeshStandardMaterial({ color: "#8b7346", roughness: 0.95 });
  for (let i = 0; i < 26; i++) {
    const t = i / 25;
    const z = 2.4 + t * 1.3;
    const side = t < 0.5 ? -1 : 1;
    const reach = 0.28 + Math.abs(t - 0.5) * 0.7;
    const x = channelCenter(z) + side * reach;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.32, 4), trapMaterial);
    pole.position.set(x, height(x, z) + 0.16, z);
    pole.rotation.z = (rand() - 0.5) * 0.2;
    block.terrain.add(pole);
  }
  const trapRope = new THREE.Mesh(
    new THREE.TorusGeometry(0.3, 0.008, 4, 20, Math.PI),
    trapMaterial,
  );
  trapRope.rotation.x = -Math.PI / 2;
  trapRope.position.set(channelCenter(3.0), 0.2, 3.0);
  block.terrain.add(trapRope);

  const boats: { group: THREE.Group; y: number; phase: number }[] = [];
  const boatSpecs: [number, number, number][] = [
    [channelCenter(-0.4) + 0.15, -0.4, 0.5],
    [channelCenter(2.1) - 0.2, 2.1, -0.4],
  ];
  for (const [x, z, rotation] of boatSpecs) {
    const boat = createBoat({
      x,
      z,
      y: WATER_LEVEL - 0.01,
      rotation,
      scale: 0.55,
      sail: false,
      color: "#e2d6bb",
    });
    block.terrain.add(boat);
    boats.push({ group: boat, y: boat.position.y, phase: z });
  }

  const clouds = createCloudLayer({ seed: 251, count: 4, y: 5.7, spread: 6.4, scale: 0.5 });
  block.root.add(clouds.group);
  const gulls = createGulls({ count: 8, center: [1.8, 4.2, 2.6], radius: 4.4, seed: 23 });
  block.root.add(gulls.group);

  const surf = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 0.24),
    new THREE.MeshBasicMaterial({
      color: "#f4fffb",
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  surf.rotation.x = -Math.PI / 2;
  surf.rotation.z = -0.35;
  surf.position.set(4.4, WATER_LEVEL + 0.012, 3.0);
  block.terrain.add(surf);

  const tick = (time: number, _dt: number, atmosphere: { night: number; golden: number }) => {
    setMaterialUniforms(water.material, {
      time,
      night: atmosphere.night,
      golden: atmosphere.golden,
    });
    boats.forEach((boat, index) => {
      boat.group.position.y = boat.y + Math.sin(time * 0.8 + boat.phase) * 0.012;
      boat.group.rotation.x = Math.cos(time * 0.5 + index) * 0.02;
    });
    (surf.material as THREE.MeshBasicMaterial).opacity = 0.24 + Math.sin(time * 1.4) * 0.08;
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
      position: [16.2, 13.8, 17.0],
      target: [0, 0.5, 0],
    },
  };
}
