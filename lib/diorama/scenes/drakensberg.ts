import * as THREE from "three/webgpu";
import { DIORAMA_BY_SLUG } from "../content";
import type { SceneBuild, SceneContext } from "../types";
import { createBase } from "../base";
import { createRibbonMesh, createTerrainMesh, createTerrainSkirt } from "../geometry";
import {
  createCloudMaterial,
  createStrataMaterial,
  createWaterfallMaterial,
  setMaterialUniforms,
} from "../materials";
import { createClouds, createRocks, createTrees, type Instance } from "../props";
import { createRadialTexture } from "../textures";
import { clamp, fbm2D, gaussian, lerp, smoothstep } from "../utils";

const SIZE = 12;
const noise = fbm2D(311, 4);

/** The cliff lip curves gently across the block. */
function cliffLip(x: number) {
  return -1.05 - Math.sin(x * 0.42 + 0.6) * 0.42 - Math.cos(x * 1.05) * 0.16;
}

function plateauHeight(x: number) {
  return 2.82 + noise(x * 0.34 + 5, 2.2) * 0.62 + Math.cos(x * 0.62) * 0.14;
}

function riverCenter(z: number) {
  const t = clamp((z + 0.8) / 6.8, 0, 1);
  return 0.15 + Math.sin(t * 3.1) * 0.92 - t * 1.15;
}

function height(x: number, z: number) {
  const base = 0.055 + noise(x * 0.55 + 2, z * 0.55 + 9) * 0.16 + smoothstep(2.5, -5, z) * 0.18;
  const lip = cliffLip(x);
  const behind = Math.max(0, lip - z);
  const rise = Math.pow(smoothstep(0, 1.3, behind), 0.6);
  const notch = gaussian(x, z, 0.15, lip - 0.45, 1.1) * 0.5;
  const ridge = 0.86 + noise(x * 1.35 + 7, 0.4) * 0.34;
  let h = base + rise * (plateauHeight(x) - base) * ridge * (1 - notch);
  const pool = gaussian(x, z, 0.15, -0.5, 0.95);
  h -= pool * 0.28;
  const riverMask = Math.exp(-Math.pow((x - riverCenter(z)) / 0.52, 2)) * smoothstep(-0.9, 0.15, z);
  h -= riverMask * 0.17;
  return h;
}

const grassA = new THREE.Color("#7d9859");
const grassB = new THREE.Color("#a7b878");
const plateauGrass = new THREE.Color("#8b9a62");
const rockA = new THREE.Color("#857a68");
const rockB = new THREE.Color("#6b6152");
const riverBed = new THREE.Color("#6d6247");
const sand = new THREE.Color("#c4b183");

function terrainColor(x: number, z: number, h: number, slope: number) {
  const n = noise(x * 1.4 + 11, z * 1.4 + 17);
  const c = grassA.clone().lerp(grassB, n);
  if (h > 2.1) c.lerp(plateauGrass, smoothstep(2.1, 2.8, h) * 0.55);
  const river = Math.exp(-Math.pow((x - riverCenter(z)) / 0.6, 2));
  if (river > 0.2 && h < 0.3) c.lerp(riverBed, smoothstep(0.2, 0.8, river) * 0.7);
  if (h < 0.2) c.lerp(sand, smoothstep(0.2, 0.02, h) * 0.6);
  if (slope > 0.55) {
    const rocky = rockA.clone().lerp(rockB, n);
    c.lerp(rocky, smoothstep(0.55, 1.7, slope) * 0.9);
  }
  if (h > 2.5) c.lerp(rockA, smoothstep(2.5, 3.2, h) * 0.22);
  return c;
}

function createFallSheet({
  x,
  width,
  zTop,
  zBottom,
  material,
  rows = 26,
}: {
  x: number;
  width: number;
  zTop: number;
  zBottom: number;
  material: THREE.Material;
  rows?: number;
}) {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= rows; i++) {
    const t = i / rows;
    const z = lerp(zTop, zBottom, t);
    const y = height(x, z) + 0.05;
    const drift = Math.sin(t * 3.4) * 0.04;
    positions.push(x - width / 2 + drift, y, z + 0.12, x + width / 2 + drift, y, z + 0.12);
    uvs.push(0, t, 1, t);
    if (i < rows) {
      const k = i * 2;
      indices.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.renderOrder = 3;
  return mesh;
}

export function buildDrakensberg(context: SceneContext): SceneBuild {
  const content = DIORAMA_BY_SLUG.drakensberg;
  const root = new THREE.Group();
  const terrainGroup = new THREE.Group();
  const baseGroup = new THREE.Group();
  root.add(terrainGroup, baseGroup);

  const soil = createStrataMaterial({
    top: "#8a7a58",
    upper: "#7a684c",
    middle: "#a08a64",
    lower: "#6b5a44",
    seam: "#4a3e30",
  });
  const clay = createStrataMaterial({
    top: "#b39a74",
    upper: "#a38860",
    middle: "#c4ad86",
    lower: "#8f7554",
    seam: "#5e4c37",
  });
  const rock = createStrataMaterial({
    top: "#6d6252",
    upper: "#5d5344",
    middle: "#7c705c",
    lower: "#4c4438",
    seam: "#342e27",
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

  const waterfallMaterial = createWaterfallMaterial();
  const fall = createFallSheet({
    x: 0.15,
    width: 0.62,
    zTop: -2.95,
    zBottom: -0.62,
    material: waterfallMaterial,
  });
  terrainGroup.add(fall);

  const upperFall = createFallSheet({
    x: -0.02,
    width: 0.34,
    zTop: -3.5,
    zBottom: -2.9,
    material: waterfallMaterial,
    rows: 10,
  });
  terrainGroup.add(upperFall);

  const riverMaterial = new THREE.MeshStandardMaterial({
    color: "#5aa6b4",
    roughness: 0.16,
    metalness: 0.06,
    transparent: true,
    opacity: 0.9,
    emissive: new THREE.Color("#0f3540"),
    emissiveIntensity: 0.16,
  });
  const riverPoints: THREE.Vector3[] = [];
  for (let i = 0; i <= 28; i++) {
    const z = lerp(-0.55, 5.98, i / 28);
    const x = riverCenter(z);
    riverPoints.push(new THREE.Vector3(x, height(x, z) + 0.075, z));
  }
  const river = createRibbonMesh({
    points: riverPoints,
    width: 0.44,
    material: riverMaterial,
    segments: 90,
    yOffset: 0.01,
  });
  terrainGroup.add(river);

  const pool = new THREE.Mesh(new THREE.CircleGeometry(0.98, 40), riverMaterial);
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(0.15, 0.14, -0.52);
  pool.renderOrder = 2;
  terrainGroup.add(pool);

  const mistTexture = createRadialTexture("rgba(255,255,255,0.92)", "rgba(255,255,255,0)");
  const mistMaterial = new THREE.MeshBasicMaterial({
    map: mistTexture,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
    color: "#eaf7f3",
    toneMapped: false,
  });
  const mists: THREE.Mesh[] = [];
  const mistSpecs: [number, number, number, number, number][] = [
    [0.15, 0.36, -0.45, 1.9, 0],
    [-0.12, 0.75, -0.85, 1.5, 0.8],
    [0.42, 0.5, -0.2, 1.2, 1.7],
  ];
  for (const [x, y, z, scale, rotation] of mistSpecs) {
    const mist = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mistMaterial);
    mist.position.set(x, y, z);
    mist.scale.setScalar(scale);
    mist.rotation.y = rotation;
    mist.renderOrder = 4;
    terrainGroup.add(mist);
    mists.push(mist);
  }
  const groundMist = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.8), mistMaterial);
  groundMist.rotation.x = -Math.PI / 2;
  groundMist.position.set(0.15, 0.2, -0.35);
  groundMist.renderOrder = 4;
  terrainGroup.add(groundMist);

  const trees: Instance[] = [];
  const rand = context.rng;
  for (let i = 0; i < 90; i++) {
    const x = -5.55 + rand() * 11.1;
    const z = -0.1 + rand() * 6;
    const h = height(x, z);
    if (h < 0.08 || h > 2.3) continue;
    if (Math.abs(x - riverCenter(z)) < 0.7) continue;
    if (gaussian(x, z, 0.15, -0.5, 1.25) > 0.4) continue;
    trees.push({
      x,
      z,
      y: h + 0.01,
      scale: 0.42 + rand() * 0.55,
      color: ["#476f45", "#557d4b", "#3f6441", "#638a52"][i % 4],
    });
  }
  for (let i = 0; i < 26; i++) {
    const x = -5.5 + rand() * 11;
    const z = -5.7 + rand() * 3.1;
    const h = height(x, z);
    if (h < 2.2) continue;
    trees.push({
      x,
      z,
      y: h + 0.01,
      scale: 0.4 + rand() * 0.45,
      color: ["#4d6f4a", "#5c7f50", "#44643f"][i % 3],
    });
  }
  terrainGroup.add(createTrees({ trees }));

  const conifers: Instance[] = [];
  for (let i = 0; i < 18; i++) {
    const x = -5.2 + rand() * 10.4;
    const z = -5.8 + rand() * 2.4;
    const h = height(x, z);
    if (h < 2.35) continue;
    conifers.push({
      x,
      z,
      y: h + 0.01,
      scale: 0.38 + rand() * 0.4,
      color: ["#3d6040", "#486b45"][i % 2],
    });
  }
  terrainGroup.add(createTrees({ trees: conifers, conifer: true }));

  const rocks: Instance[] = [];
  for (let i = 0; i < 34; i++) {
    const x = -5.6 + rand() * 11.2;
    const lip = cliffLip(x);
    const z = lip + 0.1 + rand() * 1.5;
    const h = height(x, z);
    if (h < 0.05) continue;
    rocks.push({
      x,
      z,
      y: h + 0.02,
      scale: [0.35 + rand() * 0.5, 0.28 + rand() * 0.5, 0.35 + rand() * 0.5],
      rotation: rand() * Math.PI * 2,
      color: ["#8b7f6d", "#776c5c", "#9a8d77"][i % 3],
    });
  }
  terrainGroup.add(createRocks({ rocks }));

  const cloudMaterial = createCloudMaterial();
  const clouds = createClouds({
    count: 4,
    seed: 57,
    y: 7.0,
    spread: 6.6,
    scale: 0.54,
    material: cloudMaterial,
  });
  root.add(clouds.group);

  const dayCloud = new THREE.Color("#ffffff");
  const nightCloud = new THREE.Color("#9aa9c4");
  const tick = (time: number, _dt: number, atmosphere: { night: number; golden: number }) => {
    setMaterialUniforms(waterfallMaterial, { time });
    const breathe = 0.18 + Math.sin(time * 0.7) * 0.035 + atmosphere.golden * 0.02;
    mistMaterial.opacity = breathe;
    mists.forEach((mist, index) => {
      const base = mistSpecs[index][3];
      mist.scale.setScalar(base * (1 + Math.sin(time * 0.42 + index * 1.7) * 0.07));
      mist.position.y += Math.sin(time * 0.5 + index) * 0.0006;
    });
    groundMist.scale.setScalar(1 + Math.sin(time * 0.33) * 0.05);
    riverMaterial.emissiveIntensity = 0.16 + atmosphere.night * 0.1;
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
      position: [15.8, 13.2, 16.6],
      target: [0, 0.4, 0],
    },
  };
}
