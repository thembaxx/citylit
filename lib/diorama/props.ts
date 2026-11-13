import * as THREE from "three/webgpu";
import { createBeam, createRibbonMesh, createRoofPrism, createTubeCurve } from "./geometry";
import { createRadialTexture } from "./textures";
import { mulberry32 } from "./utils";

export type Instance = {
  x: number;
  z: number;
  y?: number;
  rotation?: number;
  scale?: number | [number, number, number];
  color?: string | THREE.Color;
};

const dummy = new THREE.Object3D();

function applyInstance(mesh: THREE.InstancedMesh, index: number, item: Instance) {
  const scale = item.scale ?? 1;
  const sx = Array.isArray(scale) ? scale[0] : scale;
  const sy = Array.isArray(scale) ? scale[1] : scale;
  const sz = Array.isArray(scale) ? scale[2] : scale;
  dummy.position.set(item.x, item.y ?? 0, item.z);
  dummy.rotation.set(0, item.rotation ?? 0, 0);
  dummy.scale.set(sx, sy, sz);
  dummy.updateMatrix();
  mesh.setMatrixAt(index, dummy.matrix);
  if (item.color) {
    mesh.setColorAt(
      index,
      item.color instanceof THREE.Color ? item.color : new THREE.Color(item.color),
    );
  }
}

function finishInstances(mesh: THREE.InstancedMesh) {
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere();
  mesh.castShadow = true;
  mesh.receiveShadow = true;
}

export function createHouses({
  houses,
  facade,
  wallColors,
  roofColors,
}: {
  houses: Instance[];
  facade: { map: THREE.Texture; emissive: THREE.Texture };
  wallColors: string[];
  roofColors: string[];
}) {
  const group = new THREE.Group();
  const bodyGeometry = new THREE.BoxGeometry(1, 0.52, 0.78);
  bodyGeometry.translate(0, 0.26, 0);
  const roofGeometry = createRoofPrism(1.08, 0.88, 0.32);
  roofGeometry.translate(0, 0.52, 0);
  const bodyMaterial = new THREE.MeshStandardMaterial({
    map: facade.map,
    emissiveMap: facade.emissive,
    emissive: new THREE.Color("#ffc06a"),
    emissiveIntensity: 0,
    roughness: 0.86,
    metalness: 0,
  });
  const roofMaterial = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    roughness: 0.84,
    metalness: 0,
  });
  const bodies = new THREE.InstancedMesh(bodyGeometry, bodyMaterial, houses.length);
  const roofs = new THREE.InstancedMesh(roofGeometry, roofMaterial, houses.length);
  houses.forEach((house, index) => {
    applyInstance(bodies, index, {
      ...house,
      color: house.color ?? wallColors[index % wallColors.length],
    });
    applyInstance(roofs, index, {
      ...house,
      color: roofColors[index % roofColors.length],
    });
  });
  finishInstances(bodies);
  finishInstances(roofs);
  group.add(bodies, roofs);
  return { group, bodyMaterial, roofMaterial };
}

export function createTrees({
  trees,
  conifer = false,
  trunkColor = "#5b3d29",
}: {
  trees: Instance[];
  conifer?: boolean;
  trunkColor?: string;
}) {
  const group = new THREE.Group();
  const trunkGeometry = new THREE.CylinderGeometry(0.026, 0.046, 0.42, 5);
  trunkGeometry.translate(0, 0.21, 0);
  const trunkMaterial = new THREE.MeshStandardMaterial({
    color: trunkColor,
    roughness: 0.95,
  });
  const trunks = new THREE.InstancedMesh(trunkGeometry, trunkMaterial, trees.length);

  const foliageGeometry = conifer
    ? new THREE.ConeGeometry(0.27, 0.78, 7)
    : new THREE.IcosahedronGeometry(0.34, 0);
  if (conifer) foliageGeometry.translate(0, 0.56, 0);
  else foliageGeometry.translate(0, 0.62, 0);
  const foliageMaterial = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    roughness: 0.9,
    flatShading: true,
  });
  const foliageCount = trees.length * (conifer ? 2 : 2);
  const foliage = new THREE.InstancedMesh(foliageGeometry, foliageMaterial, foliageCount);

  let foliageIndex = 0;
  trees.forEach((tree, index) => {
    applyInstance(trunks, index, { ...tree, color: trunkColor });
    const baseColor = tree.color ?? "#4f7f4b";
    const colorA = new THREE.Color(baseColor);
    const colorB = colorA.clone().offsetHSL(0.01, 0.02, 0.08);
    applyInstance(foliage, foliageIndex++, {
      ...tree,
      y: (tree.y ?? 0) + (conifer ? 0.02 : 0),
      scale: Array.isArray(tree.scale)
        ? [tree.scale[0] * 1.05, tree.scale[1], tree.scale[2] * 1.05]
        : (tree.scale ?? 1) * 1.05,
      color: colorA,
    });
    applyInstance(foliage, foliageIndex++, {
      ...tree,
      x: tree.x + (index % 2 === 0 ? 0.1 : -0.09),
      y: (tree.y ?? 0) + (conifer ? 0.22 : 0.18),
      z: tree.z + (index % 3 === 0 ? 0.08 : -0.07),
      rotation: (tree.rotation ?? 0) + 0.8,
      scale: Array.isArray(tree.scale)
        ? [tree.scale[0] * 0.62, tree.scale[1] * 0.78, tree.scale[2] * 0.62]
        : (tree.scale ?? 1) * 0.64,
      color: colorB,
    });
  });
  finishInstances(trunks);
  finishInstances(foliage);
  group.add(trunks, foliage);
  return group;
}

export function createRocks({ rocks, color = "#8a8278" }: { rocks: Instance[]; color?: string }) {
  const geometry = new THREE.DodecahedronGeometry(0.5, 0);
  const material = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    roughness: 0.95,
    flatShading: true,
  });
  const mesh = new THREE.InstancedMesh(geometry, material, rocks.length);
  rocks.forEach((rock, index) => {
    applyInstance(mesh, index, {
      ...rock,
      rotation: rock.rotation ?? index * 1.7,
      color: rock.color ?? color,
    });
  });
  finishInstances(mesh);
  return mesh;
}

export function createClouds({
  count,
  seed,
  y = 5.4,
  spread = 8,
  scale = 1,
  material,
}: {
  count: number;
  seed: number;
  y?: number;
  spread?: number;
  scale?: number;
  material: THREE.Material;
}) {
  const rand = mulberry32(seed);
  const geometry = new THREE.IcosahedronGeometry(1, 1);
  const group = new THREE.Group();
  const clouds: {
    group: THREE.Group;
    baseX: number;
    baseY: number;
    baseZ: number;
    speed: number;
    phase: number;
  }[] = [];
  for (let i = 0; i < count; i++) {
    const cloud = new THREE.Group();
    const puffCount = 4 + Math.floor(rand() * 4);
    for (let p = 0; p < puffCount; p++) {
      const puff = new THREE.Mesh(geometry, material);
      const s = (0.45 + rand() * 0.55) * scale;
      puff.position.set(
        (rand() - 0.5) * 1.8 * scale,
        (rand() - 0.3) * 0.32 * scale,
        (rand() - 0.5) * 1.1 * scale,
      );
      puff.scale.set(s * 1.25, s * 0.72, s);
      puff.rotation.set(rand() * 0.4, rand() * Math.PI, rand() * 0.2);
      cloud.add(puff);
    }
    const angle = (i / count) * Math.PI * 2 + rand() * 0.9;
    const radius = spread * (0.55 + rand() * 0.45);
    const baseX = Math.cos(angle) * radius;
    const baseZ = Math.sin(angle) * radius * 0.78;
    cloud.position.set(baseX, y + rand() * 1.1, baseZ);
    cloud.userData.cloud = true;
    group.add(cloud);
    clouds.push({
      group: cloud,
      baseX,
      baseY: cloud.position.y,
      baseZ,
      speed: 0.035 + rand() * 0.035,
      phase: rand() * Math.PI * 2,
    });
  }
  return { group, clouds, material };
}

export function createTraffic({
  paths,
  count,
  colors,
  speed = 0.018,
  scale = 1,
}: {
  paths: THREE.Vector3[][];
  count: number;
  colors: string[];
  speed?: number;
  scale?: number;
}) {
  const group = new THREE.Group();
  const bodyGeometry = new THREE.BoxGeometry(0.34, 0.12, 0.18);
  const cabinGeometry = new THREE.BoxGeometry(0.16, 0.1, 0.15);
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    roughness: 0.55,
    metalness: 0.12,
  });
  const cabinMaterial = new THREE.MeshStandardMaterial({
    color: "#cfe3ea",
    roughness: 0.3,
    metalness: 0.1,
  });
  const bodies = new THREE.InstancedMesh(bodyGeometry, bodyMaterial, count);
  const cabins = new THREE.InstancedMesh(cabinGeometry, cabinMaterial, count);
  bodies.castShadow = true;
  cabins.castShadow = true;
  const phases = Array.from({ length: count }, (_, i) => (i / count + 0.07) % 1);
  const lanes = Array.from({ length: count }, (_, i) => i % paths.length);
  const paint = colors.map((value) => new THREE.Color(value));
  const tangent = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const sample = (path: THREE.Vector3[], t: number) => {
    const u = ((t % 1) + 1) % 1;
    const f = u * (path.length - 1);
    const i = Math.min(path.length - 2, Math.floor(f));
    const a = path[i];
    const b = path[i + 1];
    const k = f - i;
    return {
      x: a.x + (b.x - a.x) * k,
      y: a.y + (b.y - a.y) * k,
      z: a.z + (b.z - a.z) * k,
      tx: b.x - a.x,
      tz: b.z - a.z,
    };
  };
  const tick = (time: number) => {
    for (let i = 0; i < count; i++) {
      const path = paths[lanes[i]];
      const p = sample(path, phases[i] + time * speed * (0.8 + (i % 4) * 0.1));
      tangent.set(p.tx, 0, p.tz);
      if (tangent.lengthSq() < 1e-6) tangent.set(1, 0, 0);
      tangent.normalize();
      quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), tangent);
      dummy.position.set(p.x, p.y + 0.06 * scale, p.z);
      dummy.quaternion.copy(quaternion);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      bodies.setMatrixAt(i, dummy.matrix);
      bodies.setColorAt(i, paint[i % paint.length]);
      dummy.position.y = p.y + 0.15 * scale;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      cabins.setMatrixAt(i, dummy.matrix);
    }
    bodies.instanceMatrix.needsUpdate = true;
    cabins.instanceMatrix.needsUpdate = true;
    if (bodies.instanceColor) bodies.instanceColor.needsUpdate = true;
  };
  tick(0);
  bodies.computeBoundingSphere();
  cabins.computeBoundingSphere();
  group.add(bodies, cabins);
  return { group, tick };
}

export function createPeople({ people, colors }: { people: Instance[]; colors: string[] }) {
  const group = new THREE.Group();
  const bodyGeometry = new THREE.CapsuleGeometry(0.026, 0.1, 2, 5);
  bodyGeometry.translate(0, 0.08, 0);
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    roughness: 0.8,
  });
  const bodies = new THREE.InstancedMesh(bodyGeometry, bodyMaterial, people.length);
  const headGeometry = new THREE.SphereGeometry(0.034, 5, 4);
  const headMaterial = new THREE.MeshStandardMaterial({
    color: "#7b5438",
    roughness: 0.9,
  });
  const heads = new THREE.InstancedMesh(headGeometry, headMaterial, people.length);
  people.forEach((person, index) => {
    applyInstance(bodies, index, {
      ...person,
      color: person.color ?? colors[index % colors.length],
    });
    applyInstance(heads, index, {
      ...person,
      y: (person.y ?? 0) + 0.17,
    });
  });
  finishInstances(bodies);
  finishInstances(heads);
  group.add(bodies, heads);
  return group;
}

export function createRoad({
  points,
  width,
  texture,
  yOffset = 0.025,
}: {
  points: THREE.Vector3[];
  width: number;
  texture: THREE.Texture;
  yOffset?: number;
}) {
  const map = texture.clone();
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(1, Math.max(1, points.length / 4));
  map.needsUpdate = true;
  const material = new THREE.MeshStandardMaterial({
    map,
    roughness: 0.94,
    metalness: 0,
  });
  return createRibbonMesh({
    points,
    width,
    material,
    segments: 80,
    yOffset,
  });
}

export function createPylon({
  x,
  z,
  y = 0,
  height = 1.6,
  color = "#5e6469",
}: {
  x: number;
  z: number;
  y?: number;
  height?: number;
  color?: string;
}) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.3 });
  const base = 0.34;
  const top = 0.11;
  const legs = [
    [-base, 0, -base],
    [base, 0, -base],
    [base, 0, base],
    [-base, 0, base],
  ];
  const tops = [
    [-top, height, -top],
    [top, height, -top],
    [top, height, top],
    [-top, height, top],
  ];
  legs.forEach((leg, index) => {
    group.add(
      createBeam(
        new THREE.Vector3(...(leg as [number, number, number])),
        new THREE.Vector3(...(tops[index] as [number, number, number])),
        0.022,
        material,
        4,
      ),
    );
  });
  for (let level = 0.35; level < height; level += 0.42) {
    const t = level / height;
    const half = base + (top - base) * t;
    const corners = [
      new THREE.Vector3(-half, level, -half),
      new THREE.Vector3(half, level, -half),
      new THREE.Vector3(half, level, half),
      new THREE.Vector3(-half, level, half),
    ];
    for (let i = 0; i < 4; i++) {
      group.add(createBeam(corners[i], corners[(i + 1) % 4], 0.012, material, 4));
    }
  }
  for (const side of [-1, 1]) {
    group.add(
      createBeam(
        new THREE.Vector3(side * 0.55, height * 0.74, 0),
        new THREE.Vector3(side * 0.55, height * 0.74, 0.6),
        0.016,
        material,
        4,
      ),
    );
  }
  return group;
}

export function createCableway({
  from,
  to,
  sag = 0.5,
  color = "#4f555a",
  gondolaColor = "#e0a54a",
}: {
  from: THREE.Vector3;
  to: THREE.Vector3;
  sag?: number;
  color?: string;
  gondolaColor?: string;
}) {
  const group = new THREE.Group();
  const mid = from.clone().add(to).multiplyScalar(0.5);
  mid.y -= sag;
  const curve = new THREE.CatmullRomCurve3([from, mid, to]);
  const cableMaterial = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.55,
    metalness: 0.5,
  });
  const cable = createTubeCurve([from, mid, to], 0.014, cableMaterial);
  const cable2 = cable.clone();
  cable2.position.z += 0.18;
  group.add(cable, cable2);
  const gondola = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.14, 0.14),
    new THREE.MeshStandardMaterial({ color: gondolaColor, roughness: 0.5, metalness: 0.2 }),
  );
  body.castShadow = true;
  const hanger = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.16, 4), cableMaterial);
  hanger.position.y = 0.14;
  gondola.add(body, hanger);
  group.add(gondola);
  const tick = (time: number) => {
    const t = (time * 0.05) % 1;
    const point = curve.getPoint(t);
    gondola.position.copy(point);
    gondola.position.y -= 0.1;
    gondola.rotation.y = Math.sin(time * 0.8) * 0.12;
  };
  tick(0);
  return { group, tick };
}

export function createBoat({
  x,
  z,
  y = 0,
  rotation = 0,
  scale = 1,
  sail = true,
  color = "#f2efe7",
  sailColor = "#fffdf7",
}: {
  x: number;
  z: number;
  y?: number;
  rotation?: number;
  scale?: number;
  sail?: boolean;
  color?: string;
  sailColor?: string;
}) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotation;
  group.scale.setScalar(scale);
  const hullMaterial = new THREE.MeshStandardMaterial({ color, roughness: 0.55 });
  const trimMaterial = new THREE.MeshStandardMaterial({ color: "#244b5c", roughness: 0.6 });
  const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 0.52, 6), hullMaterial);
  hull.rotation.z = Math.PI / 2;
  hull.scale.y = 1;
  hull.scale.z = 0.62;
  hull.castShadow = true;
  group.add(hull);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.03, 0.12), trimMaterial);
  deck.position.y = 0.06;
  group.add(deck);
  if (sail) {
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.48, 4), trimMaterial);
    mast.position.y = 0.28;
    group.add(mast);
    const sailGeometry = new THREE.BufferGeometry();
    sailGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        [0, 0, 0, 0, 0.42, 0, 0.24, 0.08, 0, 0, 0, 0, 0.24, 0.08, 0, 0, 0.42, 0],
        3,
      ),
    );
    sailGeometry.computeVertexNormals();
    const sailMesh = new THREE.Mesh(
      sailGeometry,
      new THREE.MeshStandardMaterial({
        color: sailColor,
        roughness: 0.7,
        side: THREE.DoubleSide,
      }),
    );
    sailMesh.position.set(0.02, 0.1, 0);
    group.add(sailMesh);
  }
  const wakeTexture = createRadialTexture("rgba(255,255,255,0.75)", "rgba(255,255,255,0)");
  const wake = new THREE.Mesh(
    new THREE.PlaneGeometry(0.75, 0.32),
    new THREE.MeshBasicMaterial({
      map: wakeTexture,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    }),
  );
  wake.rotation.x = -Math.PI / 2;
  wake.position.set(-0.2, -0.02, 0);
  group.add(wake);
  return group;
}

export function createJetty({
  start,
  end,
  width = 0.3,
  y = 0,
}: {
  start: THREE.Vector3;
  end: THREE.Vector3;
  width?: number;
  y?: number;
}) {
  const group = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: "#8b6747", roughness: 0.9 });
  const darkWood = new THREE.MeshStandardMaterial({ color: "#5d4531", roughness: 0.95 });
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  const deck = new THREE.Mesh(new THREE.BoxGeometry(width, 0.05, length), wood);
  deck.position.copy(start).add(end).multiplyScalar(0.5);
  deck.position.y = y + 0.1;
  deck.rotation.y = Math.atan2(direction.x, direction.z);
  deck.castShadow = true;
  deck.receiveShadow = true;
  group.add(deck);
  const count = Math.max(3, Math.floor(length / 0.35));
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const point = start.clone().lerp(end, t);
    for (const side of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.34, 5), darkWood);
      const offset = new THREE.Vector3(
        Math.cos(deck.rotation.y) * side * width * 0.45,
        0,
        -Math.sin(deck.rotation.y) * side * width * 0.45,
      );
      post.position.copy(point).add(offset);
      post.position.y = y - 0.04;
      group.add(post);
    }
  }
  return group;
}
