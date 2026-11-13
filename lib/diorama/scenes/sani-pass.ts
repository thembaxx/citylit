import * as THREE from "three/webgpu";
import { DIORAMA_BY_SLUG } from "../content";
import type { SceneBuild, SceneContext } from "../types";
import { createRibbonMesh } from "../geometry";
import { createRiverMaterial, createWaterfallMaterial, setMaterialUniforms } from "../materials";
import { createRocks, createRoad, createTrees, createTraffic, type Instance } from "../props";
import { createScrub } from "../structures";
import { createCloudLayer, createBlock, createFallPlane } from "../scene-kit";
import { createRoadTexture } from "../textures";
import { fbm2D, gaussian, lerp, smoothstep } from "../utils";

const SIZE = 12;
const noise = fbm2D(613, 4);

/** Road waypoints: a stacked set of hairpins climbing the face. */
const ROAD: [number, number][] = [
  [-1.4, 3.15],
  [1.5, 2.9],
  [2.15, 2.35],
  [-0.4, 2.05],
  [-2.2, 1.75],
  [-2.45, 1.2],
  [-0.6, 0.95],
  [1.9, 0.75],
  [2.3, 0.15],
  [0.2, -0.1],
  [-1.9, -0.35],
  [-2.2, -0.95],
  [0.4, -1.2],
  [1.9, -1.5],
  [2.25, -2.0],
  [2.4, -2.55],
];

function rawHeight(x: number, z: number) {
  const rise = smoothstep(3.6, -1.5, z);
  let h = 0.22 + Math.pow(rise, 1.18) * 2.45;
  h += smoothstep(-1.8, -2.9, z) * 0.8;
  h += (noise(x * 0.85 + 4, z * 0.85 + 6) - 0.5) * 0.42 * smoothstep(3.2, 0.2, z);
  h += gaussian(x, z, -3.6, -2.2, 1.7) * 0.8;
  h += gaussian(x, z, 3.6, -2.9, 1.5) * 0.45;
  const notch = Math.exp(-Math.pow((x + 2.1) / 0.5, 2)) * smoothstep(-1.4, 0.7, z);
  h -= notch * 0.26;
  return h;
}

function height(x: number, z: number) {
  return rawHeight(x, z);
}

const grassA = new THREE.Color("#6f8a4f");
const grassB = new THREE.Color("#93a566");
const grassHigh = new THREE.Color("#a3a878");
const rockA = new THREE.Color("#7a7364");
const rockB = new THREE.Color("#5f5a4e");
const scree = new THREE.Color("#a99a7f");

function terrainColor(x: number, z: number, h: number, slope: number) {
  const n = noise(x * 1.5 + 9, z * 1.5 + 21);
  const c = grassA.clone().lerp(grassB, n);
  c.lerp(grassHigh, smoothstep(2.4, 3.2, h) * 0.55);
  if (slope > 0.62) {
    const rocky = rockA.clone().lerp(rockB, n);
    c.lerp(rocky, smoothstep(0.62, 1.8, slope) * 0.95);
  }
  if (h < 0.5) c.lerp(scree, smoothstep(0.5, 0.2, h) * 0.4);
  return c;
}

function roadPoints() {
  const curve = new THREE.CatmullRomCurve3(
    ROAD.map(([x, z]) => new THREE.Vector3(x, 0, z)),
    false,
    "catmullrom",
    0.25,
  );
  const points: THREE.Vector3[] = [];
  const samples = 190;
  for (let i = 0; i <= samples; i++) {
    const p = curve.getPoint(i / samples);
    points.push(new THREE.Vector3(p.x, height(p.x, p.z) + 0.035, p.z));
  }
  return points;
}

export function buildSaniPass(context: SceneContext): SceneBuild {
  const content = DIORAMA_BY_SLUG["sani-pass"];
  const block = createBlock({
    context,
    size: SIZE,
    height,
    color: terrainColor,
    strata: [
      {
        top: "#8a7d5f",
        upper: "#756a51",
        middle: "#a08f6c",
        lower: "#655a45",
        seam: "#443c2f",
      },
      {
        top: "#a99674",
        upper: "#917e5f",
        middle: "#bda98a",
        lower: "#7d6a4f",
        seam: "#574733",
      },
      {
        top: "#655e52",
        upper: "#565045",
        middle: "#736b5d",
        lower: "#423d34",
        seam: "#2c2924",
      },
    ],
  });

  const points = roadPoints();
  const roadTexture = createRoadTexture();
  const road = createRoad({ points, width: 0.42, texture: roadTexture, yOffset: 0.04 });
  block.terrain.add(road);

  const upward = createTraffic({
    paths: [points],
    count: 5,
    colors: ["#b8433a", "#e6e2d8", "#9aa5ab", "#c9c2b2", "#a63b34"],
    speed: 0.026,
    scale: 0.95,
  });
  const downward = createTraffic({
    paths: [[...points].reverse()],
    count: 3,
    colors: ["#f0eee6", "#4c5257", "#c8c0ae"],
    speed: 0.031,
    scale: 0.95,
  });
  block.terrain.add(upward.group, downward.group);

  const waterfallMaterial = createWaterfallMaterial();
  const fall = createFallPlane({
    width: 0.62,
    height: 2.0,
    material: waterfallMaterial,
    position: [-2.14, 1.55, -0.28],
    tilt: 0.06,
  });
  block.terrain.add(fall);

  const streamMaterial = createRiverMaterial({ color: "#7cc7cf", opacity: 0.8 });
  const stream = createRibbonMesh({
    points: Array.from({ length: 18 }, (_, i) => {
      const t = i / 17;
      const x = lerp(-2.1, -0.6, t) + Math.sin(t * 4) * 0.12;
      const z = lerp(0.6, 3.4, t);
      return new THREE.Vector3(x, height(x, z) + 0.05, z);
    }),
    width: 0.24,
    material: streamMaterial,
    segments: 40,
    yOffset: 0.01,
  });
  block.terrain.add(stream);

  // Stone lodge at the summit, beside the border post.
  const lodge = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({
    color: "#8f8778",
    roughness: 0.96,
    flatShading: true,
  });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.42, 0.62), stone);
  body.position.y = 0.21;
  body.castShadow = true;
  lodge.add(body);
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(0.72, 0.3, 4),
    new THREE.MeshStandardMaterial({ color: "#5c5a4f", roughness: 0.9, flatShading: true }),
  );
  roof.position.y = 0.56;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  lodge.add(roof);
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.26, 0.04),
    new THREE.MeshStandardMaterial({ color: "#3f3a30", roughness: 0.9 }),
  );
  door.position.set(0, 0.13, 0.32);
  lodge.add(door);
  const summitY = height(2.4, -2.55);
  lodge.position.set(2.4, summitY, -2.55);
  lodge.rotation.y = -0.4;
  block.terrain.add(lodge);

  const post = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.05, 0.05),
    new THREE.MeshStandardMaterial({ color: "#e8e4d6", roughness: 0.7 }),
  );
  post.position.set(2.55, summitY + 0.5, -2.15);
  block.terrain.add(post);
  const postLeg = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.5, 5),
    new THREE.MeshStandardMaterial({ color: "#6e6a5c" }),
  );
  postLeg.position.set(2.55, summitY + 0.25, -2.15);
  block.terrain.add(postLeg);

  const rand = context.rng;
  const rocks: Instance[] = [];
  for (let i = 0; i < 90; i++) {
    const x = -5.6 + rand() * 11.2;
    const z = -5.6 + rand() * 9.2;
    const h = height(x, z);
    const slope =
      Math.abs(height(x + 0.22, z) - height(x - 0.22, z)) +
      Math.abs(height(x, z + 0.22) - height(x, z - 0.22));
    if (slope < 0.55) continue;
    rocks.push({
      x,
      z,
      y: h + 0.02,
      scale: [0.22 + rand() * 0.5, 0.2 + rand() * 0.45, 0.22 + rand() * 0.5],
      rotation: rand() * Math.PI * 2,
      color: ["#847b6b", "#6f6759", "#968b78"][i % 3],
    });
  }
  block.terrain.add(createRocks({ rocks }));

  const trees: Instance[] = [];
  for (let i = 0; i < 70; i++) {
    const x = -5.5 + rand() * 11;
    const z = -0.4 + rand() * 5.8;
    const h = height(x, z);
    if (h < 0.35) continue;
    const slope =
      Math.abs(height(x + 0.2, z) - height(x - 0.2, z)) +
      Math.abs(height(x, z + 0.2) - height(x, z - 0.2));
    if (slope > 0.7) continue;
    if (Math.hypot(x - 0.9, z - 1.9) < 1.1) continue;
    trees.push({
      x,
      z,
      y: h + 0.01,
      scale: 0.32 + rand() * 0.4,
      color: ["#4b6b41", "#5b7a48", "#3f5f3b"][i % 3],
    });
  }
  block.terrain.add(createTrees({ trees }));

  const shrubs: Instance[] = [];
  for (let i = 0; i < 130; i++) {
    const x = -5.6 + rand() * 11.2;
    const z = -3.2 + rand() * 8.6;
    const h = height(x, z);
    if (h < 0.4) continue;
    shrubs.push({
      x,
      z,
      y: h + 0.01,
      scale: [0.7 + rand() * 1.2, 0.5 + rand() * 0.8, 0.7 + rand() * 1.2],
      rotation: rand() * Math.PI,
    });
  }
  block.terrain.add(createScrub({ shrubs, colors: ["#8d9a5c", "#a3a768", "#76874f"] }));

  const clouds = createCloudLayer({ seed: 149, count: 4, y: 6.8, spread: 6.2, scale: 0.52 });
  block.root.add(clouds.group);

  const tick = (time: number, _dt: number, atmosphere: { night: number; golden: number }) => {
    setMaterialUniforms(waterfallMaterial, { time });
    setMaterialUniforms(streamMaterial, { time });
    streamMaterial.emissiveIntensity = 0.16 + atmosphere.night * 0.1;
    upward.tick(time);
    downward.tick(time);
    clouds.tick(time, atmosphere);
  };

  return {
    root: block.root,
    terrain: block.terrain,
    base: block.base,
    landmarks: content.landmarks,
    tick,
    camera: {
      position: [16.4, 14.6, 17.2],
      target: [0, 0.7, 0],
    },
  };
}
