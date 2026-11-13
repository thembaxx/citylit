import * as THREE from "three/webgpu";
import { DIORAMA_BY_SLUG } from "../content";
import type { SceneBuild, SceneContext } from "../types";
import { createRibbonMesh } from "../geometry";
import { setMaterialUniforms } from "../materials";
import { createRocks, createTrees, type Instance } from "../props";
import { createBoardwalk, createLighthouse, createScrub } from "../structures";
import { createGulls } from "../fauna";
import { createCloudLayer, createBlock, createWaterSurface } from "../scene-kit";
import { clamp, fbm2D, gaussian, lerp, smoothstep } from "../utils";

const SIZE = 12;
const WATER_LEVEL = 0.05;
const noise = fbm2D(809, 4);

const LIGHTHOUSE = { x: 0.3, z: -2.45 };
const COVE = { x: 0.9, z: 1.25 };

function rawHeight(x: number, z: number) {
  const n = noise(x * 0.75 + 4, z * 0.75 + 8);
  const edge = 0.85 + Math.sin(x * 0.52 + 0.4) * 0.42;
  const land = smoothstep(edge + 1.25, edge - 0.15, z);
  let h = lerp(-0.74, 1.95 + n * 0.16, Math.pow(land, 0.82));

  h += gaussian(x, z, 0.2, -2.6, 1.95) * 1.15;
  h += gaussian(x, z, -1.6, -1.7, 1.3) * 0.45;
  h += gaussian(x, z, 2.6, -1.5, 1.2) * 0.4;
  h += (noise(x * 1.7 + 3, z * 1.7 + 6) - 0.5) * 0.3 * smoothstep(1.0, 2.4, h);

  // Carve Diaz Beach: a sandy bowl opening towards the sea.
  const cove = gaussian(x, z, COVE.x, COVE.z, 1.12);
  const sandLevel = lerp(0.02, 0.16, smoothstep(1.9, 0.55, z));
  h = lerp(h, sandLevel, cove * 0.94);

  // A gap in the cliffs on the seaward side so the cove meets the swell.
  const mouth = gaussian(x, z, COVE.x + 0.3, 2.75, 0.95);
  h = lerp(h, -0.45, mouth * 0.85);
  return h;
}

function height(x: number, z: number) {
  return rawHeight(x, z);
}

const fynbosA = new THREE.Color("#71805a");
const fynbosB = new THREE.Color("#93a271");
const cliffA = new THREE.Color("#bda887");
const cliffB = new THREE.Color("#9c8767");
const cliffShade = new THREE.Color("#857154");
const sand = new THREE.Color("#e3d4ad");
const seabed = new THREE.Color("#937f60");
const deepBed = new THREE.Color("#42594f");

function terrainColor(x: number, z: number, h: number, slope: number) {
  const n = noise(x * 1.5 + 5, z * 1.5 + 19);
  const c = fynbosA.clone().lerp(fynbosB, n);
  if (slope > 0.5) {
    const rock = cliffA.clone().lerp(cliffB, n);
    c.lerp(rock, smoothstep(0.5, 1.6, slope) * 0.95);
    c.lerp(cliffShade, smoothstep(1.6, 2.6, slope) * 0.35);
  }
  if (h < 0.2 && h > -0.05) c.lerp(sand, smoothstep(0.2, 0.02, h) * 0.88);
  if (h <= 0) {
    const depth = clamp((WATER_LEVEL - h) / 1.2, 0, 1);
    c.lerp(seabed, smoothstep(0, 0.4, depth) * 0.55);
    c.lerp(deepBed, smoothstep(0.45, 1, depth) * 0.62);
  }
  if (h > 2.5) c.lerp(cliffA, smoothstep(2.5, 3.2, h) * 0.3);
  return c;
}

export function buildCapePoint(context: SceneContext): SceneBuild {
  const content = DIORAMA_BY_SLUG["cape-point"];
  const block = createBlock({
    context,
    size: SIZE,
    height,
    color: terrainColor,
    strata: [
      {
        top: "#b1a084",
        upper: "#9c8a6d",
        middle: "#c4b193",
        lower: "#8a765a",
        seam: "#5a4a34",
      },
      {
        top: "#c7b696",
        upper: "#ad9a78",
        middle: "#d2c1a2",
        lower: "#95805f",
        seam: "#66543c",
      },
      {
        top: "#756b5c",
        upper: "#655d50",
        middle: "#827868",
        lower: "#4b453b",
        seam: "#312d27",
      },
    ],
  });

  const water = createWaterSurface({
    size: SIZE,
    level: WATER_LEVEL,
    segments: context.quality.waterSegments,
    height,
    depth: rawHeight,
    deep: "#0b4e6b",
    shallow: "#5ec8c2",
    foam: "#f0fffb",
    speed: 1.05,
  });
  block.terrain.add(water.mesh);

  const summitY = height(LIGHTHOUSE.x, LIGHTHOUSE.z);
  const lighthouse = createLighthouse({
    x: LIGHTHOUSE.x,
    z: LIGHTHOUSE.z,
    y: summitY,
    height: 1.15,
    scale: 1.15,
    bands: 1,
  });
  block.terrain.add(lighthouse.group);

  // A short stone wall and outbuilding beside the light.
  const stone = new THREE.MeshStandardMaterial({
    color: "#e6e0d0",
    roughness: 0.9,
  });
  const keeper = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.38), stone);
  keeper.position.set(LIGHTHOUSE.x + 0.62, summitY + 0.15, LIGHTHOUSE.z + 0.1);
  keeper.castShadow = true;
  block.terrain.add(keeper);
  const keeperRoof = new THREE.Mesh(
    new THREE.ConeGeometry(0.42, 0.18, 4),
    new THREE.MeshStandardMaterial({ color: "#8a4a3a", roughness: 0.85, flatShading: true }),
  );
  keeperRoof.position.set(LIGHTHOUSE.x + 0.62, summitY + 0.39, LIGHTHOUSE.z + 0.1);
  keeperRoof.rotation.y = Math.PI / 4;
  block.terrain.add(keeperRoof);

  // Funicular track running from the saddle up to the light.
  const trackBase = [
    new THREE.Vector3(-1.05, 0, 0.15),
    new THREE.Vector3(-0.75, 0, -0.55),
    new THREE.Vector3(-0.5, 0, -1.25),
    new THREE.Vector3(-0.05, 0, -1.95),
    new THREE.Vector3(0.12, 0, -2.3),
  ].map((p) => new THREE.Vector3(p.x, height(p.x, p.z) + 0.05, p.z));
  const trackCurve = new THREE.CatmullRomCurve3(trackBase);
  const railMaterial = new THREE.MeshStandardMaterial({
    color: "#6a6660",
    roughness: 0.6,
    metalness: 0.35,
  });
  const railA = createRibbonMesh({
    points: trackCurve.getPoints(40).map((p) => p.clone().add(new THREE.Vector3(0.11, 0, 0))),
    width: 0.05,
    material: railMaterial,
    segments: 40,
    yOffset: 0.01,
  });
  const railB = createRibbonMesh({
    points: trackCurve.getPoints(40).map((p) => p.clone().add(new THREE.Vector3(-0.11, 0, 0))),
    width: 0.05,
    material: railMaterial,
    segments: 40,
    yOffset: 0.01,
  });
  block.terrain.add(railA, railB);

  const tram = new THREE.Group();
  const tramBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.18, 0.2),
    new THREE.MeshStandardMaterial({ color: "#c9c3b4", roughness: 0.55, metalness: 0.2 }),
  );
  tramBody.castShadow = true;
  tram.add(tramBody);
  const tramGlass = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.1, 0.205),
    new THREE.MeshStandardMaterial({
      color: "#3a4f57",
      roughness: 0.25,
      metalness: 0.3,
      emissive: new THREE.Color("#ffca7a"),
      emissiveIntensity: 0,
    }),
  );
  tramGlass.position.y = 0.04;
  tram.add(tramGlass);
  block.terrain.add(tram);

  const rand = context.rng;
  const rocks: Instance[] = [];
  for (let i = 0; i < 80; i++) {
    const x = -5.5 + rand() * 11;
    const z = -2.4 + rand() * 6.8;
    const h = rawHeight(x, z);
    if (h < -0.15 || h > 2.6) continue;
    const slope =
      Math.abs(height(x + 0.22, z) - height(x - 0.22, z)) +
      Math.abs(height(x, z + 0.22) - height(x, z - 0.22));
    if (slope < 0.5) continue;
    rocks.push({
      x,
      z,
      y: h + 0.02,
      scale: [0.24 + rand() * 0.5, 0.2 + rand() * 0.45, 0.24 + rand() * 0.5],
      rotation: rand() * Math.PI * 2,
      color: ["#bda887", "#a08a6b", "#c9b696"][i % 3],
    });
  }
  block.terrain.add(createRocks({ rocks }));

  const shrubs: Instance[] = [];
  for (let i = 0; i < 150; i++) {
    const x = -5.5 + rand() * 11;
    const z = -5.4 + rand() * 5.4;
    const h = height(x, z);
    if (h < 0.3) continue;
    shrubs.push({
      x,
      z,
      y: h + 0.01,
      scale: [0.6 + rand() * 1.1, 0.5 + rand() * 0.8, 0.6 + rand() * 1.1],
      rotation: rand() * Math.PI,
    });
  }
  block.terrain.add(createScrub({ shrubs, colors: ["#6d7c50", "#85915a", "#566846"] }));

  const trees: Instance[] = [];
  for (let i = 0; i < 40; i++) {
    const x = -4.6 + rand() * 9.2;
    const z = -1.8 + rand() * 3.4;
    const h = height(x, z);
    if (h < 0.5 || h > 2.3) continue;
    const slope =
      Math.abs(height(x + 0.2, z) - height(x - 0.2, z)) +
      Math.abs(height(x, z + 0.2) - height(x, z - 0.2));
    if (slope > 0.85) continue;
    trees.push({
      x,
      z,
      y: h + 0.01,
      scale: 0.3 + rand() * 0.38,
      color: ["#4d6b45", "#5c7a4c", "#3f5c3d"][i % 3],
    });
  }
  block.terrain.add(createTrees({ trees }));

  block.terrain.add(
    createBoardwalk({
      points: [
        [-0.2, 0.35],
        [0.3, 0.7],
        [0.65, 1.15],
      ],
      width: 0.3,
      height,
    }),
  );

  const clouds = createCloudLayer({ seed: 181, count: 4, y: 6.4, spread: 6.2, scale: 0.5 });
  block.root.add(clouds.group);
  const gulls = createGulls({ count: 9, center: [-0.6, 4.4, 1.4], radius: 4.8, seed: 5 });
  block.root.add(gulls.group);

  const foam = new THREE.Mesh(
    new THREE.RingGeometry(0.72, 1.0, 40),
    new THREE.MeshBasicMaterial({
      color: "#f2fffc",
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    }),
  );
  foam.rotation.x = -Math.PI / 2;
  foam.position.set(COVE.x + 0.35, WATER_LEVEL + 0.012, 2.35);
  block.terrain.add(foam);

  const tick = (time: number, _dt: number, atmosphere: { night: number; golden: number }) => {
    setMaterialUniforms(water.material, {
      time,
      night: atmosphere.night,
      golden: atmosphere.golden,
    });
    lighthouse.beam.rotation.y = time * 0.55;
    const beam = lighthouse.beam.children[0] as THREE.Mesh | undefined;
    if (beam) {
      (beam.material as THREE.MeshBasicMaterial).opacity = atmosphere.night * 0.16;
    }
    (lighthouse.lamp.material as THREE.MeshBasicMaterial).color.setRGB(
      1,
      0.9 - atmosphere.night * 0.05,
      0.66 - atmosphere.night * 0.1,
    );
    (tramGlass.material as THREE.MeshStandardMaterial).emissiveIntensity =
      0.15 + atmosphere.night * 1.2;
    tram.position.copy(trackCurve.getPoint(0.5));
    tram.position.y += 0.16;
    const ahead = trackCurve.getPoint(0.53);
    tram.rotation.y = Math.atan2(ahead.x - tram.position.x, ahead.z - tram.position.z);
    (foam.material as THREE.MeshBasicMaterial).opacity = 0.24 + Math.sin(time * 1.2) * 0.07;
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
      position: [16.2, 14.4, 17.2],
      target: [0, 0.7, 0],
    },
  };
}
