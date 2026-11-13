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
  createCableway,
  createClouds,
  createHouses,
  createPeople,
  createPylon,
  createRoad,
  createTraffic,
  createTrees,
  type Instance,
} from "../props";
import { createCoolingTower, createMineHeadframe, createSoccerField } from "../landmarks";
import {
  createHouseFacade,
  createMuralTexture,
  createRoadTexture,
  createSoccerTexture,
} from "../textures";
import { clamp, fbm2D, gaussian, lerp, smoothstep } from "../utils";

const SIZE = 12;
const noise = fbm2D(101, 4);

function dumpFactor(x: number, z: number) {
  const dx = (x + 2.5) / 2.9;
  const dz = (z + 4.0) / 1.9;
  return clamp(1 - Math.hypot(dx, dz), 0, 1);
}

function pondFactor(x: number, z: number) {
  return gaussian(x, z, 4.35, 3.45, 1.25);
}

function fieldFactor(x: number, z: number) {
  return gaussian(x, z, -1.1, -1.45, 1.35);
}

function plazaFactor(x: number, z: number) {
  return gaussian(x, z, 3.25, -0.05, 2.05);
}

function height(x: number, z: number) {
  const n = noise(x * 0.7 + 3, z * 0.7 + 7);
  let h = 0.1 + n * 0.05;
  h += 0.16 * smoothstep(3, -5, z);
  const dump = dumpFactor(x, z);
  if (dump > 0) {
    let d = 2.65 * Math.pow(dump, 0.6);
    d = d * 0.7 + (Math.round(d * 6) / 6) * 0.3;
    d *= 1 + (noise(x * 2.2, z * 2.2) - 0.5) * 0.12;
    h = Math.max(h, d);
  }
  h -= pondFactor(x, z) * 0.09;
  h = lerp(h, 0.115, smoothstep(0.45, 0.9, fieldFactor(x, z)) * 0.92);
  h = lerp(h, 0.11, smoothstep(0.35, 0.85, plazaFactor(x, z)) * 0.8);
  return Math.max(0.008, h);
}

const grassA = new THREE.Color("#9ca267");
const grassB = new THREE.Color("#c0a970");
const dust = new THREE.Color("#cbb07c");
const red = new THREE.Color("#a86f4d");
const rock = new THREE.Color("#8a7558");
const pondBed = new THREE.Color("#6b5a3e");
const dumpColor = new THREE.Color("#c9a86d");

function terrainColor(x: number, z: number, h: number, slope: number) {
  const n = noise(x * 1.3 + 11, z * 1.3 + 17);
  const c = grassA.clone().lerp(grassB, n);
  c.lerp(dust, smoothstep(0.5, 0.9, n) * 0.35);
  c.lerp(red, smoothstep(0.72, 0.95, n) * 0.18);
  const dump = dumpFactor(x, z);
  if (dump > 0) c.lerp(dumpColor, smoothstep(0.05, 0.7, dump) * 0.85);
  const pond = pondFactor(x, z);
  if (pond > 0.15) c.lerp(pondBed, smoothstep(0.15, 0.75, pond) * 0.75);
  if (slope > 0.55) c.lerp(rock, smoothstep(0.55, 1.4, slope) * 0.55);
  if (h < 0.06) c.multiplyScalar(0.82);
  return c;
}

export function buildSoweto(context: SceneContext): SceneBuild {
  const content = DIORAMA_BY_SLUG.soweto;
  const root = new THREE.Group();
  const terrainGroup = new THREE.Group();
  const baseGroup = new THREE.Group();
  root.add(terrainGroup, baseGroup);

  const soil = createStrataMaterial({
    top: "#b08d5e",
    upper: "#97744d",
    middle: "#c0a171",
    lower: "#8a6d4c",
    seam: "#5a4632",
  });
  const clay = createStrataMaterial({
    top: "#c3a273",
    upper: "#b28f60",
    middle: "#d0b184",
    lower: "#9c7c53",
    seam: "#6a5439",
  });
  const rock = createStrataMaterial({
    top: "#7e6a52",
    upper: "#6b5944",
    middle: "#8b775c",
    lower: "#5a4a38",
    seam: "#3f342a",
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
    deep: "#1c7f86",
    shallow: "#66d8cf",
    foam: "#f4fffb",
  });
  const water = createWaterMesh({
    size: SIZE,
    segments: context.quality.waterSegments,
    level: 0.06,
    height,
    material: waterMaterial,
  });
  terrainGroup.add(water);

  const roadTexture = createRoadTexture();
  const roadPointsX = (x0: number, x1: number, z: number, count = 26) =>
    Array.from({ length: count }, (_, i) => {
      const x = lerp(x0, x1, i / (count - 1));
      return new THREE.Vector3(x, height(x, z) + 0.035, z);
    });
  const roadPointsZ = (x: number, z0: number, z1: number, count = 26) =>
    Array.from({ length: count }, (_, i) => {
      const z = lerp(z0, z1, i / (count - 1));
      return new THREE.Vector3(x, height(x, z) + 0.035, z);
    });

  const mainRoad = roadPointsZ(1.55, -2.4, 5.95);
  terrainGroup.add(createRoad({ points: mainRoad, width: 0.55, texture: roadTexture }));
  for (const z of [0.55, 2.0, 3.45, 4.9, 5.55]) {
    terrainGroup.add(
      createRoad({
        points: roadPointsX(-5.55, 1.55, z),
        width: 0.32,
        texture: roadTexture,
      }),
    );
  }
  for (const x of [-3.55, -0.9]) {
    terrainGroup.add(
      createRoad({
        points: roadPointsZ(x, 0.2, 5.8),
        width: 0.3,
        texture: roadTexture,
      }),
    );
  }

  const houses: Instance[] = [];
  const houseRand = (() => {
    let seed = 17;
    return () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
  })();
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 10; col++) {
      const x = -5.05 + col * 0.66;
      const z = 0.85 + row * 0.76;
      if (Math.abs(x - 1.55) < 0.48) continue;
      if (Math.abs(x + 3.55) < 0.38 || Math.abs(x + 0.9) < 0.38) continue;
      if ([0.55, 2.0, 3.45, 4.9, 5.55].some((street) => Math.abs(z - street) < 0.3)) continue;
      if (dumpFactor(x, z) > 0.05 || fieldFactor(x, z) > 0.25) continue;
      if (plazaFactor(x, z) > 0.22 || pondFactor(x, z) > 0.2) continue;
      if (houseRand() < 0.13) continue;
      const scale = 0.54 + houseRand() * 0.16;
      houses.push({
        x,
        z,
        y: height(x, z) + 0.01,
        rotation: houseRand() < 0.12 ? Math.PI / 2 : 0,
        scale: [scale, scale * (0.9 + houseRand() * 0.25), scale],
      });
    }
  }
  const facade = createHouseFacade();
  const houseSet = createHouses({
    houses,
    facade,
    wallColors: ["#e6d7bd", "#d9c3a4", "#c9d1c1", "#e3c7a6", "#d9d6ca", "#e7cfa8"],
    roofColors: ["#a34f3f", "#7c5b49", "#4e6c6b", "#b56a4d", "#6e6e6e", "#c08a55"],
  });
  terrainGroup.add(houseSet.group);

  const treeRand = (() => {
    let seed = 41;
    return () => {
      seed = (seed * 48271) % 2147483647;
      return (seed - 1) / 2147483646;
    };
  })();
  const trees: Instance[] = [];
  for (let i = 0; i < 55; i++) {
    const x = -5.3 + treeRand() * 6.6;
    const z = 0.25 + treeRand() * 5.45;
    if (dumpFactor(x, z) > 0.2 || fieldFactor(x, z) > 0.4) continue;
    if (pondFactor(x, z) > 0.5 || plazaFactor(x, z) > 0.4) continue;
    trees.push({
      x,
      z,
      y: height(x, z) + 0.01,
      scale: 0.48 + treeRand() * 0.5,
      color: ["#4f7f4b", "#5e8d50", "#467348", "#6a9458"][i % 4],
    });
  }
  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * Math.PI * 2;
    const x = 4.35 + Math.cos(angle) * (1.25 + treeRand() * 0.4);
    const z = 3.45 + Math.sin(angle) * (1.25 + treeRand() * 0.4);
    trees.push({
      x,
      z,
      y: height(x, z) + 0.01,
      scale: 0.5 + treeRand() * 0.45,
      color: ["#4f7f4b", "#5e8d50", "#467348"][i % 3],
    });
  }
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    const x = -2.5 + Math.cos(angle) * (2.2 + treeRand() * 0.9);
    const z = -4.0 + Math.sin(angle) * (1.3 + treeRand() * 0.6);
    if (height(x, z) < 0.1) continue;
    trees.push({
      x,
      z,
      y: height(x, z) + 0.01,
      scale: 0.45 + treeRand() * 0.4,
      color: ["#647c4d", "#718a55", "#536b46"][i % 3],
    });
  }
  terrainGroup.add(createTrees({ trees }));

  const mural = createMuralTexture(7);
  const towers = new THREE.Group();
  towers.userData.landmark = "orlando-towers";
  towers.add(
    createCoolingTower({
      x: 2.45,
      z: -0.7,
      y: 0.12,
      height: 2.9,
      baseRadius: 0.95,
      topRadius: 0.72,
      waistRadius: 0.58,
      mural,
      rotation: 0.35,
    }),
    createCoolingTower({
      x: 4.05,
      z: 0.55,
      y: 0.12,
      height: 2.55,
      baseRadius: 0.8,
      topRadius: 0.62,
      waistRadius: 0.5,
      mural,
      rotation: 1.45,
    }),
  );
  const bridge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 1.95, 5),
    new THREE.MeshStandardMaterial({ color: "#3d4447", roughness: 0.7, metalness: 0.4 }),
  );
  bridge.position.set(3.25, 2.12, -0.08);
  bridge.rotation.z = Math.PI / 2;
  bridge.rotation.y = -0.55;
  towers.add(bridge);
  terrainGroup.add(towers);

  const plaza = new THREE.Mesh(
    new THREE.CircleGeometry(2.35, 48),
    new THREE.MeshStandardMaterial({ color: "#a99f8e", roughness: 0.95 }),
  );
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.set(3.25, 0.128, -0.05);
  plaza.receiveShadow = true;
  terrainGroup.add(plaza);
  const bollardGeometry = new THREE.CylinderGeometry(0.025, 0.03, 0.12, 5);
  const bollardMaterial = new THREE.MeshStandardMaterial({ color: "#6f6a60", roughness: 0.9 });
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const bollard = new THREE.Mesh(bollardGeometry, bollardMaterial);
    bollard.position.set(3.25 + Math.cos(angle) * 2.15, 0.16, -0.05 + Math.sin(angle) * 2.15);
    terrainGroup.add(bollard);
  }

  const field = createSoccerField({
    x: -1.1,
    z: -1.45,
    y: 0.125,
    texture: createSoccerTexture(),
  });
  field.userData.landmark = "soccer-field";
  terrainGroup.add(field);

  const reeds = new THREE.Group();
  const reedMaterial = new THREE.MeshStandardMaterial({ color: "#6e8c4d", roughness: 0.9 });
  for (let i = 0; i < 26; i++) {
    const angle = (i / 26) * Math.PI * 2;
    const radius = 1.1 + (i % 3) * 0.09;
    const x = 4.35 + Math.cos(angle) * radius;
    const z = 3.45 + Math.sin(angle) * radius;
    const reed = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.012, 0.18 + (i % 4) * 0.04, 4),
      reedMaterial,
    );
    reed.position.set(x, height(x, z) + 0.11, z);
    reed.rotation.z = (i % 2 ? 1 : -1) * 0.08;
    reeds.add(reed);
  }
  terrainGroup.add(reeds);

  const dumpY = height(-2.5, -4.0);
  const dump = new THREE.Group();
  dump.userData.landmark = "mine-dump";
  dump.add(createMineHeadframe({ x: -2.5, z: -4.0, y: dumpY - 0.02, scale: 0.72 }));
  const shedMaterial = new THREE.MeshStandardMaterial({ color: "#8d7b62", roughness: 0.9 });
  const shedRoofMaterial = new THREE.MeshStandardMaterial({ color: "#9a5d45", roughness: 0.85 });
  for (const [sx, sz, s] of [
    [-3.35, -3.55, 0.42],
    [-1.8, -4.4, 0.5],
  ]) {
    const shed = new THREE.Mesh(new THREE.BoxGeometry(s, s * 0.55, s * 0.8), shedMaterial);
    shed.position.set(sx, height(sx, sz) + s * 0.25, sz);
    shed.castShadow = true;
    dump.add(shed);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(s * 0.75, s * 0.3, 4), shedRoofMaterial);
    roof.position.set(sx, height(sx, sz) + s * 0.62, sz);
    roof.rotation.y = Math.PI / 4;
    dump.add(roof);
  }
  terrainGroup.add(dump);

  const pylonA = createPylon({ x: 0.9, z: -2.35, y: height(0.9, -2.35), height: 1.65 });
  const pylonB = createPylon({ x: -4.8, z: -2.9, y: height(-4.8, -2.9), height: 1.5 });
  terrainGroup.add(pylonA, pylonB);
  const cable = createCableway({
    from: new THREE.Vector3(-2.5, dumpY + 0.9, -4.0),
    to: new THREE.Vector3(0.9, height(0.9, -2.35) + 1.55, -2.35),
    sag: 0.35,
    color: "#4d5356",
    gondolaColor: "#d98a3d",
  });
  terrainGroup.add(cable.group);
  const powerLine = createCableway({
    from: new THREE.Vector3(-4.8, height(-4.8, -2.9) + 1.5, -2.9),
    to: new THREE.Vector3(-5.7, height(-5.7, 2.0) + 1.4, 2.0),
    sag: 0.45,
    color: "#4d5356",
    gondolaColor: "#d98a3d",
  });
  terrainGroup.add(powerLine.group);

  const traffic = createTraffic({
    paths: [mainRoad, roadPointsX(-5.55, 1.55, 2.0), roadPointsX(-5.55, 1.55, 3.45)],
    count: 8,
    colors: ["#e8c04a", "#f4f2ea", "#2e6f8e", "#c9473d", "#5c5c5c", "#d98a3d"],
    speed: 0.02,
    scale: 0.9,
  });
  terrainGroup.add(traffic.group);

  const people: Instance[] = [];
  const peopleRand = (() => {
    let seed = 71;
    return () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
  })();
  for (let i = 0; i < 30; i++) {
    const x = -5.1 + peopleRand() * 6.2;
    const z = 0.4 + peopleRand() * 5.2;
    if (dumpFactor(x, z) > 0.2 || pondFactor(x, z) > 0.4) continue;
    people.push({
      x,
      z,
      y: height(x, z) + 0.01,
      scale: 0.8 + peopleRand() * 0.5,
      rotation: peopleRand() * Math.PI * 2,
    });
  }
  terrainGroup.add(
    createPeople({
      people,
      colors: ["#c9473d", "#2d5f8a", "#e8c04a", "#f4f2ea", "#4d7a4a", "#d98a3d"],
    }),
  );

  const cloudMaterial = createCloudMaterial();
  const clouds = createClouds({
    count: 4,
    seed: 31,
    y: 6.9,
    spread: 6.8,
    scale: 0.56,
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
    traffic.tick(time);
    cable.tick(time);
    powerLine.tick(time);
    houseSet.bodyMaterial.emissiveIntensity = atmosphere.night * 1.5;
    cloudMaterial.color.lerpColors(dayCloud, nightCloud, atmosphere.night);
    cloudMaterial.emissiveIntensity = 0.06 + atmosphere.night * 0.04;
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
      position: [15.6, 13.6, 16.4],
      target: [0, 0.3, 0],
    },
  };
}
