import * as THREE from "three/webgpu";
import { DIORAMA_BY_SLUG } from "../content";
import type { SceneBuild, SceneContext } from "../types";
import { createRibbonMesh } from "../geometry";
import { createRocks, createTrees, type Instance } from "../props";
import {
  createBoardwalk,
  createDoleritePillars,
  createQuiverTrees,
  createScrub,
} from "../structures";
import { createGulls } from "../fauna";
import { createCloudLayer, createBlock } from "../scene-kit";
import { fbm2D, gaussian, lerp, smoothstep } from "../utils";

const SIZE = 12;
const noise = fbm2D(1409, 4);

function cliffLine(x: number) {
  return 0.45 + x * 0.2 + Math.sin(x * 0.55) * 0.32;
}

function rawHeight(x: number, z: number) {
  const n = noise(x * 0.75 + 6, z * 0.75 + 1);
  const edge = cliffLine(x);
  const plateau = Math.pow(smoothstep(edge + 0.55, edge - 0.5, z), 0.82);
  let h = lerp(0.62 + n * 0.24, 2.2 + n * 0.18, plateau);

  // Gullies cutting back into the cliff.
  h -= Math.exp(-Math.pow((x - 0.4) / 0.45, 2)) * smoothstep(edge - 0.6, edge + 0.5, z) * 0.22;
  h -= Math.exp(-Math.pow((x + 1.9) / 0.5, 2)) * smoothstep(edge - 0.6, edge + 0.5, z) * 0.16;

  // The mound the pillars stand on, plus low Karoo hills.
  h += gaussian(x, z, -0.9, -1.3, 1.5) * 0.4;
  h += gaussian(x, z, 3.7, 2.5, 2.2) * 0.38;
  h += gaussian(x, z, -4.4, -3.6, 2.0) * 0.5;
  h += (noise(x * 2 + 9, z * 2 + 2) - 0.5) * 0.12;
  return h;
}

function height(x: number, z: number) {
  return rawHeight(x, z);
}

const plainA = new THREE.Color("#c0a475");
const plainB = new THREE.Color("#d3b788");
const scrubGreen = new THREE.Color("#9a9a63");
const rockA = new THREE.Color("#9c7248");
const rockB = new THREE.Color("#7d5936");
const cliffShade = new THREE.Color("#6c5037");
const dust = new THREE.Color("#b79a6d");

function terrainColor(x: number, z: number, h: number, slope: number) {
  const n = noise(x * 1.5 + 3, z * 1.5 + 14);
  const c = plainA.clone().lerp(plainB, n);
  if (h > 1.4) c.lerp(scrubGreen, smoothstep(1.4, 2.2, h) * 0.35);
  if (slope > 0.5) {
    const rocky = rockA.clone().lerp(rockB, n);
    c.lerp(rocky, smoothstep(0.5, 1.5, slope) * 0.95);
    c.lerp(cliffShade, smoothstep(1.5, 2.6, slope) * 0.4);
  }
  if (h < 0.7) c.lerp(dust, smoothstep(0.7, 0.5, h) * 0.3);
  return c;
}

export function buildValleyOfDesolation(context: SceneContext): SceneBuild {
  const content = DIORAMA_BY_SLUG["valley-of-desolation"];
  const block = createBlock({
    context,
    size: SIZE,
    height,
    color: terrainColor,
    strata: [
      {
        top: "#b98f60",
        upper: "#a17a4f",
        middle: "#c9a276",
        lower: "#8c6742",
        seam: "#5b422a",
      },
      {
        top: "#cbaa7d",
        upper: "#b28f63",
        middle: "#d6b78d",
        lower: "#98764e",
        seam: "#6a4d31",
      },
      {
        top: "#7d6b54",
        upper: "#6b5a45",
        middle: "#8b7660",
        lower: "#504335",
        seam: "#332a22",
      },
    ],
  });

  const rand = context.rng;
  const pillars: Instance[] = [];
  const clusters: [number, number, number][] = [
    [-0.9, -1.1, 7],
    [0.4, -1.9, 6],
    [1.5, -0.9, 4],
    [-2.4, -2.2, 3],
  ];
  for (const [cx, cz, count] of clusters) {
    for (let i = 0; i < count; i++) {
      const angle = rand() * Math.PI * 2;
      const radius = rand() * 0.85;
      const x = cx + Math.cos(angle) * radius;
      const z = cz + Math.sin(angle) * radius;
      const h = height(x, z);
      pillars.push({
        x,
        z,
        y: h + 0.02,
        scale: [0.28 + rand() * 0.35, 0.6 + rand() * 1.5, 0.28 + rand() * 0.35],
        rotation: rand() * Math.PI,
        color: ["#8d6a4a", "#a37c56", "#77573d", "#b0855c"][i % 4],
      });
    }
  }
  block.terrain.add(createDoleritePillars({ pillars }));

  const rocks: Instance[] = [];
  for (let i = 0; i < 90; i++) {
    const x = -5.5 + rand() * 11;
    const z = -5.5 + rand() * 11;
    const h = height(x, z);
    const slope =
      Math.abs(height(x + 0.22, z) - height(x - 0.22, z)) +
      Math.abs(height(x, z + 0.22) - height(x, z - 0.22));
    if (slope < 0.35 && rand() < 0.6) continue;
    rocks.push({
      x,
      z,
      y: h + 0.02,
      scale: [0.2 + rand() * 0.5, 0.18 + rand() * 0.55, 0.2 + rand() * 0.5],
      rotation: rand() * Math.PI * 2,
      color: ["#9c7248", "#87603c", "#b0855c"][i % 3],
    });
  }
  block.terrain.add(createRocks({ rocks }));

  const quivers: Instance[] = [];
  for (let i = 0; i < 16; i++) {
    const x = -5.2 + rand() * 8.4;
    const z = -4.2 + rand() * 7.2;
    const h = height(x, z);
    if (h < 0.7) continue;
    quivers.push({
      x,
      z,
      y: h + 0.01,
      scale: 0.6 + rand() * 0.7,
      rotation: rand() * Math.PI * 2,
    });
  }
  block.terrain.add(createQuiverTrees({ trees: quivers }));

  const shrubs: Instance[] = [];
  for (let i = 0; i < 240; i++) {
    const x = -5.6 + rand() * 11.2;
    const z = -5.6 + rand() * 11.2;
    const h = height(x, z);
    if (h < 0.5) continue;
    shrubs.push({
      x,
      z,
      y: h + 0.005,
      scale: [0.5 + rand() * 1.2, 0.35 + rand() * 0.8, 0.5 + rand() * 1.2],
      rotation: rand() * Math.PI,
    });
  }
  block.terrain.add(createScrub({ shrubs, colors: ["#9c9a66", "#b0a56f", "#7f8452"] }));

  const trees: Instance[] = [];
  for (let i = 0; i < 20; i++) {
    const x = -5.2 + rand() * 10.4;
    const z = -5.2 + rand() * 5.4;
    const h = height(x, z);
    if (h < 1.6) continue;
    trees.push({
      x,
      z,
      y: h + 0.01,
      scale: 0.2 + rand() * 0.24,
      color: ["#6d7a4c", "#7d8a54"][i % 2],
    });
  }
  block.terrain.add(createTrees({ trees }));

  block.terrain.add(
    createBoardwalk({
      points: [
        [-3.6, 1.6],
        [-2.9, 1.05],
        [-2.3, 0.55],
        [-1.9, 0.1],
      ],
      width: 0.34,
      height,
    }),
  );

  const trackMaterial = new THREE.MeshStandardMaterial({
    color: "#b98d5f",
    roughness: 0.98,
  });
  const track = createRibbonMesh({
    points: Array.from({ length: 26 }, (_, i) => {
      const t = i / 25;
      const x = lerp(-4.8, 5.2, t);
      const z = 3.4 + Math.sin(t * 2.8) * 1.1;
      return new THREE.Vector3(x, height(x, z) + 0.03, z);
    }),
    width: 0.34,
    material: trackMaterial,
    segments: 70,
    yOffset: 0.01,
  });
  block.terrain.add(track);

  const clouds = createCloudLayer({ seed: 287, count: 3, y: 6.4, spread: 6.6, scale: 0.5 });
  block.root.add(clouds.group);
  const birds = createGulls({ count: 5, center: [0, 5.4, 0.6], radius: 5.2, seed: 31 });
  block.root.add(birds.group);

  // Parapet and railing at the cliff viewpoint.
  const deckY = height(-1.85, 0.05);
  const railMaterial = new THREE.MeshStandardMaterial({ color: "#7b5b3c", roughness: 0.92 });
  for (let i = 0; i < 4; i++) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.34, 0.05), railMaterial);
    post.position.set(-1.75 + i * 0.18, deckY + 0.5, 0.02 + i * 0.02);
    block.terrain.add(post);
  }
  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.04, 0.04), railMaterial);
  rail.position.set(-1.46, deckY + 0.66, 0.06);
  block.terrain.add(rail);

  const tick = (time: number, _dt: number, atmosphere: { night: number; golden: number }) => {
    birds.tick(time);
    clouds.tick(time, atmosphere);
  };

  return {
    root: block.root,
    terrain: block.terrain,
    base: block.base,
    landmarks: content.landmarks,
    tick,
    camera: {
      position: [16.2, 14.0, 17.0],
      target: [0, 0.6, 0],
    },
  };
}
