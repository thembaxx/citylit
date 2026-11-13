import * as THREE from "three/webgpu";
import { DIORAMA_BY_SLUG } from "../content";
import type { SceneBuild, SceneContext } from "../types";
import { createRibbonMesh } from "../geometry";
import { createRiverMaterial, createWaterfallMaterial, setMaterialUniforms } from "../materials";
import { createRocks, type Instance } from "../props";
import { createBoardwalk, createQuiverTrees, createScrub } from "../structures";
import { createCloudLayer, createBlock, createFallPlane, createWaterSurface } from "../scene-kit";
import { createRadialTexture } from "../textures";
import { clamp, fbm2D, gaussian, lerp, smoothstep } from "../utils";

const SIZE = 12;
const WATER_LEVEL = 0.2;
const noise = fbm2D(911, 4);
const PLATEAU = 2.05;

function gorgeCenter(z: number) {
  return 0.75 + Math.sin(z * 0.66) * 0.34;
}

function rawHeight(x: number, z: number) {
  const n = noise(x * 0.8 + 2, z * 0.8 + 7);
  let h = PLATEAU + n * 0.24;

  // Shallow upstream channel cut into the plateau.
  const upCenter = 0.8 + Math.sin(z * 0.45 + 1.1) * 0.42;
  const upWidth = 0.62 + Math.sin(z * 0.7) * 0.08;
  const upCarve =
    smoothstep(upWidth + 0.45, upWidth - 0.05, Math.abs(x - upCenter)) * smoothstep(1.3, -1.5, z);
  h -= upCarve * 0.32;

  // The gorge below the falls.
  const lip = 0.28 + Math.sin(x * 0.7 + 0.6) * 0.12;
  const half = 1.18 - smoothstep(1, 5.4, z) * 0.22;
  const inGorge =
    smoothstep(half + 0.55, half - 0.25, Math.abs(x - gorgeCenter(z))) *
    smoothstep(lip - 0.15, lip + 0.45, z);
  h = lerp(h, 0.24 + n * 0.12, inGorge * 0.98);

  // Plunge pool at the foot of the falls.
  h -= gaussian(x, z, 0.8, 1.05, 0.9) * 0.12;
  h += gaussian(x, z, -3.4, -2.6, 1.6) * 0.22;
  h += gaussian(x, z, 3.8, 2.6, 1.4) * 0.16;
  return h;
}

function height(x: number, z: number) {
  return rawHeight(x, z);
}

const graniteA = new THREE.Color("#b57c4f");
const graniteB = new THREE.Color("#95633f");
const graniteLight = new THREE.Color("#c99a6b");
const plateauSand = new THREE.Color("#c3a071");
const dryGrass = new THREE.Color("#a89a6a");
const riverBed = new THREE.Color("#8d6a48");
const poolBed = new THREE.Color("#4f7f74");

function terrainColor(x: number, z: number, h: number, slope: number) {
  const n = noise(x * 1.5 + 4, z * 1.5 + 27);
  const c = dryGrass.clone().lerp(plateauSand, n * 0.7);
  if (h > 1.9) c.lerp(graniteLight, smoothstep(1.9, 2.3, h) * 0.3);
  if (slope > 0.55) {
    const rock = graniteA.clone().lerp(graniteB, n);
    c.lerp(rock, smoothstep(0.55, 1.6, slope) * 0.96);
  }
  if (h < 1.9) c.lerp(riverBed, smoothstep(1.9, 1.6, h) * 0.45);
  if (h < WATER_LEVEL + 0.1) {
    const depth = clamp((WATER_LEVEL - h) / 0.6, 0, 1);
    c.lerp(poolBed, smoothstep(0, 0.6, depth) * 0.7);
  }
  return c;
}

/** The upstream river runs above the falls on the plateau. */
function upstreamCenter(z: number) {
  return 0.8 + Math.sin(z * 0.45 + 1.1) * 0.42;
}

export function buildAugrabies(context: SceneContext): SceneBuild {
  const content = DIORAMA_BY_SLUG.augrabies;
  const block = createBlock({
    context,
    size: SIZE,
    height,
    color: terrainColor,
    strata: [
      {
        top: "#b98d63",
        upper: "#a2764f",
        middle: "#c8a077",
        lower: "#8f6544",
        seam: "#5c3f2a",
      },
      {
        top: "#caa67e",
        upper: "#b28c64",
        middle: "#d3b28c",
        lower: "#997650",
        seam: "#6a4a31",
      },
      {
        top: "#7c6a56",
        upper: "#6a5947",
        middle: "#8a7660",
        lower: "#514436",
        seam: "#332b23",
      },
    ],
  });

  const water = createWaterSurface({
    size: SIZE,
    level: WATER_LEVEL,
    segments: context.quality.waterSegments,
    height,
    depth: rawHeight,
    deep: "#1f6a6d",
    shallow: "#7dcab4",
    foam: "#f4fffb",
    speed: 1.35,
  });
  block.terrain.add(water.mesh);

  const waterfallMaterial = createWaterfallMaterial();
  const fall = createFallPlane({
    width: 1.05,
    height: 1.95,
    material: waterfallMaterial,
    position: [0.78, 1.2, 0.42],
    tilt: 0.12,
  });
  block.terrain.add(fall);

  const fallRight = createFallPlane({
    width: 0.42,
    height: 1.6,
    material: waterfallMaterial,
    position: [1.55, 1.32, 0.55],
    tilt: 0.16,
    rotationY: 0.18,
  });
  block.terrain.add(fallRight);

  const riverMaterial = createRiverMaterial({ color: "#5fa8a6", opacity: 0.85 });
  const river = createRibbonMesh({
    points: Array.from({ length: 30 }, (_, i) => {
      const z = lerp(-5.8, 0.42, i / 29);
      const x = upstreamCenter(z);
      return new THREE.Vector3(x, height(x, z) + 0.11, z);
    }),
    width: 0.76,
    material: riverMaterial,
    segments: 80,
    yOffset: 0.01,
  });
  block.terrain.add(river);

  const mistTexture = createRadialTexture("rgba(255,255,255,0.9)", "rgba(255,255,255,0)");
  const mistMaterial = new THREE.MeshBasicMaterial({
    map: mistTexture,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    color: "#eaf7f2",
    toneMapped: false,
  });
  const mists: THREE.Mesh[] = [];
  const mistSpecs: [number, number, number, number][] = [
    [0.78, 0.55, 1.0, 1.9],
    [1.5, 0.8, 0.9, 1.3],
    [0.5, 0.35, 1.2, 1.2],
  ];
  for (const [x, y, z, scale] of mistSpecs) {
    const mist = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mistMaterial);
    mist.position.set(x, y, z);
    mist.scale.setScalar(scale);
    mist.renderOrder = 4;
    block.terrain.add(mist);
    mists.push(mist);
  }

  // Viewpoint deck and shade structure on the northern bank.
  block.terrain.add(
    createBoardwalk({
      points: [
        [-3.3, -1.5],
        [-2.4, -0.9],
        [-1.7, -0.35],
        [-1.45, 0.2],
      ],
      width: 0.32,
      height,
    }),
  );
  const deckY = height(-1.5, 0.3);
  const shade = new THREE.Group();
  const postMaterial = new THREE.MeshStandardMaterial({ color: "#6d5137", roughness: 0.95 });
  for (const sx of [-0.24, 0.24]) {
    for (const sz of [-0.2, 0.2]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.44, 5), postMaterial);
      post.position.set(sx, 0.22, sz);
      shade.add(post);
    }
  }
  const thatch = new THREE.Mesh(
    new THREE.ConeGeometry(0.42, 0.22, 8),
    new THREE.MeshStandardMaterial({ color: "#b6955f", roughness: 0.98, flatShading: true }),
  );
  thatch.position.y = 0.55;
  thatch.castShadow = true;
  shade.add(thatch);
  shade.position.set(-1.5, deckY + 0.16, 0.32);
  block.terrain.add(shade);

  const rand = context.rng;
  const rocks: Instance[] = [];
  for (let i = 0; i < 110; i++) {
    const x = -5.6 + rand() * 11.2;
    const z = -5.4 + rand() * 11.2;
    const h = rawHeight(x, z);
    if (h < 0.2) continue;
    const slope =
      Math.abs(height(x + 0.22, z) - height(x - 0.22, z)) +
      Math.abs(height(x, z + 0.22) - height(x, z - 0.22));
    if (slope < 0.6) continue;
    rocks.push({
      x,
      z,
      y: h + 0.02,
      scale: [0.3 + rand() * 0.7, 0.28 + rand() * 0.8, 0.3 + rand() * 0.7],
      rotation: rand() * Math.PI * 2,
      color: ["#b57c4f", "#98653f", "#c48c5b"][i % 3],
    });
  }
  block.terrain.add(createRocks({ rocks }));

  const quivers: Instance[] = [];
  for (let i = 0; i < 22; i++) {
    const x = -5.4 + rand() * 10.8;
    const z = -5.4 + rand() * 8.8;
    const h = height(x, z);
    if (h < 1.8) continue;
    if (Math.abs(x - 0.8) < 1.4 && z < 0.5) continue;
    quivers.push({
      x,
      z,
      y: h + 0.01,
      scale: 0.7 + rand() * 0.8,
      rotation: rand() * Math.PI * 2,
    });
  }
  block.terrain.add(createQuiverTrees({ trees: quivers }));

  const shrubs: Instance[] = [];
  for (let i = 0; i < 170; i++) {
    const x = -5.6 + rand() * 11.2;
    const z = -5.6 + rand() * 11.2;
    const h = height(x, z);
    if (h < 1.9) continue;
    shrubs.push({
      x,
      z,
      y: h + 0.01,
      scale: [0.6 + rand() * 1.2, 0.4 + rand() * 0.8, 0.6 + rand() * 1.2],
      rotation: rand() * Math.PI,
    });
  }
  block.terrain.add(createScrub({ shrubs, colors: ["#9c9763", "#b0a672", "#7f8552"] }));

  const clouds = createCloudLayer({ seed: 199, count: 4, y: 6.6, spread: 6.4, scale: 0.52 });
  block.root.add(clouds.group);

  const tick = (time: number, _dt: number, atmosphere: { night: number; golden: number }) => {
    setMaterialUniforms(water.material, {
      time,
      night: atmosphere.night,
      golden: atmosphere.golden,
    });
    setMaterialUniforms(waterfallMaterial, { time });
    riverMaterial.emissiveIntensity = 0.16 + atmosphere.night * 0.1;
    mistMaterial.opacity = 0.18 + Math.sin(time * 0.9) * 0.04;
    mists.forEach((mist, index) => {
      const base = mistSpecs[index][3];
      mist.scale.setScalar(base * (1 + Math.sin(time * 0.55 + index * 1.4) * 0.08));
    });
    clouds.tick(time, atmosphere);
  };

  return {
    root: block.root,
    terrain: block.terrain,
    base: block.base,
    landmarks: content.landmarks,
    tick,
    camera: {
      position: [16.6, 14.8, 17.4],
      target: [0, 0.9, 0],
    },
  };
}
