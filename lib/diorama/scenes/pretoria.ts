import * as THREE from "three/webgpu";
import { DIORAMA_BY_SLUG } from "../content";
import type { SceneBuild, SceneContext } from "../types";
import { createBase } from "../base";
import { createRibbonMesh, createTerrainMesh, createTerrainSkirt } from "../geometry";
import { createCloudMaterial, createStrataMaterial } from "../materials";
import { createClouds, createRoad, createTraffic, createTrees, type Instance } from "../props";
import { createUnionBuildings } from "../landmarks";
import { createRoadTexture, createUnionFacade } from "../textures";
import { fbm2D, gaussian, lerp, smoothstep } from "../utils";

const SIZE = 12;
const noise = fbm2D(503, 4);

function height(x: number, z: number) {
  const n = noise(x * 0.45 + 2, z * 0.45 + 8);
  const hill = smoothstep(1.8, -3.8, z);
  let h = 0.045 + n * 0.1 + Math.pow(hill, 1.45) * 1.28;
  const plateau = gaussian(x, z, 0, -2.6, 3.15);
  h = lerp(h, 1.32, smoothstep(0.15, 0.72, plateau) * 0.94);
  const gx = 1 - smoothstep(2.6, 3.5, Math.abs(x));
  const gz = smoothstep(-1.6, -0.6, z) * (1 - smoothstep(1.5, 2.7, z));
  const garden = gx * gz;
  if (garden > 0.001) {
    const target = 1.16 - Math.max(0, z + 1) * 0.24;
    const stepped = Math.round(target * 7) / 7;
    h = lerp(h, stepped, garden * 0.92);
  }
  return h;
}

const lawnA = new THREE.Color("#7e9859");
const lawnB = new THREE.Color("#9caf6c");
const stone = new THREE.Color("#c1a77e");
const path = new THREE.Color("#cbb68e");
const soil = new THREE.Color("#8d7150");

function terrainColor(x: number, z: number, h: number, slope: number) {
  const n = noise(x * 1.5 + 21, z * 1.5 + 5);
  const c = lawnA.clone().lerp(lawnB, n);
  if (h > 1.1) c.lerp(lawnB, smoothstep(1.1, 1.4, h) * 0.3);
  if (slope > 0.35) c.lerp(stone, smoothstep(0.35, 1.1, slope) * 0.8);
  if (h < 0.16) c.lerp(path, smoothstep(0.16, 0.02, h) * 0.35);
  if (Math.abs(x) < 0.32 && z > 2.7) c.lerp(soil, 0.18);
  return c;
}

function createCity(rand: () => number) {
  const group = new THREE.Group();
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  geometry.translate(0, 0.5, 0);
  const material = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    roughness: 0.82,
    metalness: 0.04,
    emissive: new THREE.Color("#ffce86"),
    emissiveIntensity: 0,
  });
  const palette = ["#e9dfcb", "#d8cbb3", "#cfd6d4", "#e3d3b7", "#c7b9a1", "#dfe3df", "#b9c2bd"];
  const items: { x: number; z: number; w: number; d: number; h: number; color: string }[] = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 15; col++) {
      const x = -5.35 + col * 0.77 + (row % 2) * 0.18;
      const z = 3.15 + row * 0.82;
      if (Math.abs(x) < 0.62 || Math.abs(x - 3.9) < 0.3 || Math.abs(x + 3.9) < 0.3) continue;
      if (rand() < 0.16) continue;
      items.push({
        x,
        z,
        w: 0.42 + rand() * 0.22,
        d: 0.38 + rand() * 0.24,
        h: 0.24 + rand() * 0.62,
        color: palette[Math.floor(rand() * palette.length)],
      });
    }
  }
  for (let i = 0; i < 12; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const x = side * (4.5 + rand() * 0.8);
    const z = 0.4 + rand() * 2.3;
    items.push({
      x,
      z,
      w: 0.44 + rand() * 0.22,
      d: 0.4 + rand() * 0.2,
      h: 0.26 + rand() * 0.5,
      color: palette[Math.floor(rand() * palette.length)],
    });
  }
  const mesh = new THREE.InstancedMesh(geometry, material, items.length);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  items.forEach((item, index) => {
    dummy.position.set(item.x, height(item.x, item.z) - 0.02, item.z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(item.w, item.h, item.d);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
    color.set(item.color);
    mesh.setColorAt(index, color);
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.computeBoundingSphere();
  group.add(mesh);
  return { group, material };
}

function createAmphitheatre(x: number, z: number, y: number) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  const sandstone = new THREE.MeshStandardMaterial({ color: "#bda47e", roughness: 0.94 });
  const grass = new THREE.MeshStandardMaterial({ color: "#79945a", roughness: 0.96 });
  for (let i = 0; i < 5; i++) {
    const inner = 0.5 + i * 0.19;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(inner, inner + 0.17, 30, 1, Math.PI, Math.PI).rotateX(-Math.PI / 2),
      i % 2 === 0 ? grass : sandstone,
    );
    ring.position.y = 0.02 + i * 0.04;
    ring.receiveShadow = true;
    group.add(ring);
  }
  const stage = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.42, 0.05, 28), sandstone);
  stage.position.y = 0.03;
  stage.receiveShadow = true;
  group.add(stage);
  const backdrop = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.28, 0.09), sandstone);
  backdrop.position.set(0, 0.15, -0.28);
  backdrop.castShadow = true;
  group.add(backdrop);
  return group;
}

export function buildPretoria(context: SceneContext): SceneBuild {
  const content = DIORAMA_BY_SLUG.pretoria;
  const root = new THREE.Group();
  const terrainGroup = new THREE.Group();
  const baseGroup = new THREE.Group();
  root.add(terrainGroup, baseGroup);

  const soil = createStrataMaterial({
    top: "#8d8a5e",
    upper: "#7a7550",
    middle: "#a39a6e",
    lower: "#6d6448",
    seam: "#4a4334",
  });
  const clay = createStrataMaterial({
    top: "#c7ac80",
    upper: "#b39a70",
    middle: "#d6bc92",
    lower: "#9c825e",
    seam: "#6b5740",
  });
  const rock = createStrataMaterial({
    top: "#6d5a44",
    upper: "#5f4e3b",
    middle: "#7c674f",
    lower: "#4f4232",
    seam: "#372d24",
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

  const roadTexture = createRoadTexture();
  const roadPointsZ = (x: number, z0: number, z1: number, count = 30) =>
    Array.from({ length: count }, (_, i) => {
      const z = lerp(z0, z1, i / (count - 1));
      return new THREE.Vector3(x, height(x, z) + 0.04, z);
    });
  const roadPointsX = (x0: number, x1: number, z: number, count = 30) =>
    Array.from({ length: count }, (_, i) => {
      const x = lerp(x0, x1, i / (count - 1));
      return new THREE.Vector3(x, height(x, z) + 0.04, z);
    });

  const avenue = roadPointsZ(0, 2.75, 5.98);
  terrainGroup.add(createRoad({ points: avenue, width: 0.62, texture: roadTexture }));
  const crossStreet = roadPointsX(-5.8, 5.8, 4.35);
  terrainGroup.add(createRoad({ points: crossStreet, width: 0.5, texture: roadTexture }));
  for (const x of [-3.9, 3.9]) {
    terrainGroup.add(
      createRoad({
        points: roadPointsZ(x, 2.5, 5.98),
        width: 0.4,
        texture: roadTexture,
      }),
    );
  }

  const union = createUnionBuildings({
    x: 0,
    z: -2.6,
    y: 1.32,
    scale: 0.78,
    facade: createUnionFacade(),
  });
  union.userData.landmark = "union-buildings";
  terrainGroup.add(union);
  const windowMaterials = union.userData.windowMaterials as THREE.MeshStandardMaterial[];

  const axisPoints = Array.from({ length: 24 }, (_, i) => {
    const z = lerp(0.05, 2.65, i / 23);
    return new THREE.Vector3(0, height(0, z) + 0.02, z);
  });
  const axis = createRibbonMesh({
    points: axisPoints,
    width: 0.92,
    material: new THREE.MeshStandardMaterial({
      color: "#c9b48d",
      roughness: 0.96,
      metalness: 0,
    }),
    yOffset: 0.02,
  });
  axis.receiveShadow = true;
  terrainGroup.add(axis);

  const amphitheatre = createAmphitheatre(-1.1, 1.85, height(-1.1, 1.85) + 0.02);
  amphitheatre.userData.landmark = "amphitheatre";
  terrainGroup.add(amphitheatre);

  const city = createCity(context.rng);
  terrainGroup.add(city.group);

  const trees: Instance[] = [];
  const rand = context.rng;
  const jacaranda = ["#8c6fc2", "#9c7fd0", "#7a5eb2", "#a98ade"];
  const green = ["#4f7f4b", "#5e8d50", "#467348"];
  for (let i = 0; i < 54; i++) {
    const x = -5.5 + rand() * 11;
    const z = 2.4 + rand() * 3.5;
    if (Math.abs(x) < 0.6 || Math.abs(x - 3.9) < 0.34 || Math.abs(x + 3.9) < 0.34) continue;
    if (Math.abs(z - 4.35) < 0.32) continue;
    const isPurple = rand() < 0.62;
    trees.push({
      x,
      z,
      y: height(x, z) + 0.01,
      scale: 0.46 + rand() * 0.42,
      color: isPurple ? jacaranda[i % jacaranda.length] : green[i % green.length],
    });
  }
  for (let i = 0; i < 18; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const x = side * (2.15 + rand() * 0.25);
    const z = 2.6 + rand() * 3.1;
    trees.push({
      x,
      z,
      y: height(x, z) + 0.01,
      scale: 0.5 + rand() * 0.35,
      color: jacaranda[i % jacaranda.length],
    });
  }
  for (let i = 0; i < 14; i++) {
    const angle = (i / 14) * Math.PI;
    const radius = 3.9 + rand() * 0.3;
    const x = Math.cos(angle) * radius;
    const z = -0.9 + Math.sin(angle) * radius * 0.55;
    trees.push({
      x,
      z,
      y: height(x, z) + 0.01,
      scale: 0.42 + rand() * 0.3,
      color: i % 3 === 0 ? green[i % green.length] : jacaranda[i % jacaranda.length],
    });
  }
  const cluster = [
    [3.7, 1.45],
    [3.35, 1.95],
    [4.05, 2.1],
    [3.9, 0.9],
    [-3.6, 1.9],
    [-3.95, 1.45],
  ];
  cluster.forEach(([x, z], index) => {
    trees.push({
      x,
      z,
      y: height(x, z) + 0.01,
      scale: 0.62 + (index % 3) * 0.08,
      color: jacaranda[index % jacaranda.length],
    });
  });
  terrainGroup.add(createTrees({ trees }));

  const shrubs: Instance[] = [];
  for (let ring = 0; ring < 3; ring++) {
    const radius = 1.9 + ring * 0.78;
    for (let i = 0; i < 13; i++) {
      const angle = 0.18 + (i / 12) * (Math.PI - 0.36);
      const x = Math.cos(angle) * radius;
      const z = -1.05 + Math.sin(angle) * radius;
      if (height(x, z) < 0.5) continue;
      shrubs.push({
        x,
        z,
        y: height(x, z) + 0.01,
        scale: 0.2 + rand() * 0.1,
        color: "#5d7f4a",
      });
    }
  }
  terrainGroup.add(createTrees({ trees: shrubs }));

  const traffic = createTraffic({
    paths: [avenue, crossStreet],
    count: 9,
    colors: ["#f2efe7", "#2e6f8e", "#c9473d", "#e8c04a", "#5c5c5c"],
    speed: 0.016,
    scale: 0.95,
  });
  terrainGroup.add(traffic.group);

  const cloudMaterial = createCloudMaterial();
  const clouds = createClouds({
    count: 4,
    seed: 73,
    y: 6.8,
    spread: 7.0,
    scale: 0.52,
    material: cloudMaterial,
  });
  root.add(clouds.group);

  const dayCloud = new THREE.Color("#ffffff");
  const nightCloud = new THREE.Color("#9aa9c4");
  const tick = (time: number, _dt: number, atmosphere: { night: number; golden: number }) => {
    traffic.tick(time);
    for (const material of windowMaterials) {
      material.emissiveIntensity = atmosphere.night * 1.25;
    }
    city.material.emissiveIntensity = atmosphere.night * 0.16;
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
      position: [15.4, 13.0, 16.8],
      target: [0, 0.3, 0],
    },
  };
}
