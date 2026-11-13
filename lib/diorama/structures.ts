import * as THREE from "three/webgpu";
import { createRoofPrism } from "./geometry";

const dummy = new THREE.Object3D();

type Instance = {
  x: number;
  z: number;
  y?: number;
  rotation?: number;
  scale?: number | [number, number, number];
  color?: string | THREE.Color;
};

/** Collapse a tuple or scalar instance scale to a single multiplier. */
function scalarScale(scale: Instance["scale"]) {
  return Array.isArray(scale) ? scale[1] : (scale ?? 1);
}

function place(mesh: THREE.InstancedMesh, index: number, item: Instance) {
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

function finish(mesh: THREE.InstancedMesh) {
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere();
  mesh.castShadow = true;
  mesh.receiveShadow = true;
}

const standard = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0, ...extra });

/** Cluster of thatched rondavels, the rural Wild Coast homestead pattern. */
export function createRondavels({ huts }: { huts: Instance[] }) {
  const group = new THREE.Group();
  const wallGeometry = new THREE.CylinderGeometry(0.15, 0.16, 0.18, 12);
  wallGeometry.translate(0, 0.09, 0);
  const roofGeometry = new THREE.ConeGeometry(0.21, 0.2, 12);
  roofGeometry.translate(0, 0.28, 0);
  const wallMaterial = standard("#e6dcc7", { roughness: 0.95 });
  const roofMaterial = standard("#ffffff", { roughness: 0.98, flatShading: true });
  const walls = new THREE.InstancedMesh(wallGeometry, wallMaterial, huts.length);
  const roofs = new THREE.InstancedMesh(roofGeometry, roofMaterial, huts.length);
  huts.forEach((hut, index) => {
    place(walls, index, { ...hut, color: hut.color ?? "#e8dfcb" });
    place(roofs, index, {
      ...hut,
      color: ["#c2a172", "#b3905f", "#cbb184"][index % 3],
    });
  });
  finish(walls);
  finish(roofs);
  group.add(walls, roofs);
  return group;
}

export type LighthouseBuild = {
  group: THREE.Group;
  /** Rotating night beam; rotate the beam group from the scene tick. */
  beam: THREE.Group;
  lamp: THREE.Mesh;
};

export function createLighthouse({
  x,
  z,
  y = 0,
  height = 1.5,
  scale = 1,
  body = "#f3efe4",
  band = "#b2483d",
  bands = 3,
}: {
  x: number;
  z: number;
  y?: number;
  height?: number;
  scale?: number;
  body?: string;
  band?: string;
  bands?: number;
}): LighthouseBuild {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.scale.setScalar(scale);

  const tower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.115, 0.2, height, 14, 1, true),
    standard(body, { roughness: 0.7 }),
  );
  tower.position.y = height / 2;
  tower.castShadow = true;
  tower.receiveShadow = true;
  group.add(tower);

  const bandMaterial = standard(band, { roughness: 0.65 });
  for (let i = 0; i < bands; i++) {
    const ring = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.2 - (0.085 * (i + 0.5)) / bands + 0.004,
        0.2 - (0.085 * (i + 0.5)) / bands + 0.004,
        height / (bands * 2.4),
        14,
        1,
        true,
      ),
      bandMaterial,
    );
    ring.position.y = height * ((i + 0.5) / bands);
    ring.castShadow = true;
    group.add(ring);
  }

  const gallery = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.15, 0.03, 14),
    standard("#2f3638", { roughness: 0.6 }),
  );
  gallery.position.y = height + 0.014;
  group.add(gallery);

  const rail = new THREE.Mesh(
    new THREE.TorusGeometry(0.145, 0.006, 4, 18),
    standard("#2f3638", { roughness: 0.5, metalness: 0.3 }),
  );
  rail.rotation.x = Math.PI / 2;
  rail.position.y = height + 0.06;
  group.add(rail);

  const lantern = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 0.13, 12),
    new THREE.MeshStandardMaterial({
      color: "#fff4cf",
      emissive: new THREE.Color("#ffd479"),
      emissiveIntensity: 0.6,
      roughness: 0.25,
      transparent: true,
      opacity: 0.92,
    }),
  );
  lantern.position.y = height + 0.085;
  group.add(lantern);

  const lamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 10, 8),
    new THREE.MeshBasicMaterial({ color: "#ffe6a8", toneMapped: false }),
  );
  lamp.position.y = height + 0.085;
  group.add(lamp);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(0.13, 0.11, 12),
    standard("#8a3f34", { roughness: 0.7 }),
  );
  roof.position.y = height + 0.2;
  group.add(roof);

  const beam = new THREE.Group();
  beam.position.y = height + 0.085;
  const beamGeometry = new THREE.ConeGeometry(0.16, 1.9, 10, 1, true);
  beamGeometry.translate(0, -0.95, 0);
  beamGeometry.rotateZ(Math.PI / 2);
  const beamMesh = new THREE.Mesh(
    beamGeometry,
    new THREE.MeshBasicMaterial({
      color: "#ffe9a8",
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    }),
  );
  beamMesh.position.x = 0.2;
  beam.add(beamMesh);
  group.add(beam);

  return { group, beam, lamp };
}

/** Square-walled fort with corner towers and an open courtyard. */
export function createFort({
  x,
  z,
  y = 0,
  size = 1.7,
  wallHeight = 0.34,
  scale = 1,
}: {
  x: number;
  z: number;
  y?: number;
  size?: number;
  wallHeight?: number;
  scale?: number;
}) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.scale.setScalar(scale);
  const stone = standard("#9a927f", { roughness: 0.96, flatShading: true });
  const trim = standard("#b0a894", { roughness: 0.95, flatShading: true });
  const half = size / 2;
  const thickness = size * 0.09;

  const wall = (w: number, d: number, px: number, pz: number) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, wallHeight, d), stone);
    mesh.position.set(px, wallHeight / 2, pz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(w * 1.04, 0.03, d * 1.2), trim);
    cap.position.set(px, wallHeight, pz);
    group.add(cap);
  };
  wall(size, thickness, 0, -half);
  wall(size, thickness, 0, half);
  wall(thickness, size, -half, 0);
  wall(thickness, size, half, 0);

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const tower = new THREE.Mesh(
        new THREE.CylinderGeometry(size * 0.11, size * 0.12, wallHeight * 1.2, 8),
        stone,
      );
      tower.position.set(sx * half, (wallHeight * 1.2) / 2, sz * half);
      tower.castShadow = true;
      group.add(tower);
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(size * 0.13, size * 0.1, 8),
        standard("#6d6455", { roughness: 0.9, flatShading: true }),
      );
      cone.position.set(sx * half, wallHeight * 1.2 + size * 0.05, sz * half);
      group.add(cone);
    }
  }

  const courtyard = new THREE.Mesh(
    new THREE.PlaneGeometry(size * 0.78, size * 0.78),
    standard("#c8b99a", { roughness: 1 }),
  );
  courtyard.rotation.x = -Math.PI / 2;
  courtyard.position.y = 0.012;
  courtyard.receiveShadow = true;
  group.add(courtyard);

  // Simple cell blocks along the inner walls.
  for (const side of [-1, 1]) {
    const block = new THREE.Mesh(
      new THREE.BoxGeometry(size * 0.62, 0.14, size * 0.12),
      standard("#a9a08b", { roughness: 0.95 }),
    );
    block.position.set(0, 0.07, side * (half - thickness - size * 0.07));
    block.castShadow = true;
    group.add(block);
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(size * 0.64, 0.02, size * 0.14),
      standard("#7c7466", { roughness: 0.9 }),
    );
    roof.position.set(0, 0.145, side * (half - thickness - size * 0.07));
    group.add(roof);
  }

  return group;
}

export type CapeDutchBuild = {
  group: THREE.Group;
  /** Window material, lifted at night. */
  glass: THREE.MeshStandardMaterial;
};

export function createCapeDutchHouse({
  x,
  z,
  y = 0,
  rotation = 0,
  scale = 1,
}: {
  x: number;
  z: number;
  y?: number;
  rotation?: number;
  scale?: number;
}): CapeDutchBuild {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotation;
  group.scale.setScalar(scale);

  const whitewash = standard("#f6f2e6", { roughness: 0.88 });
  const thatch = standard("#6a5744", { roughness: 0.96, flatShading: true });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.46, 0.66), whitewash);
  body.position.y = 0.23;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const roof = new THREE.Mesh(createRoofPrism(1.3, 0.82, 0.4), thatch);
  roof.position.y = 0.46;
  roof.castShadow = true;
  group.add(roof);

  // Decorative Cape Dutch gable, built from a shallow extruded shape.
  const shape = new THREE.Shape();
  shape.moveTo(-0.3, 0);
  shape.lineTo(0.3, 0);
  shape.lineTo(0.26, 0.2);
  shape.quadraticCurveTo(0.13, 0.24, 0.11, 0.42);
  shape.quadraticCurveTo(0, 0.56, -0.11, 0.42);
  shape.quadraticCurveTo(-0.13, 0.24, -0.26, 0.2);
  shape.closePath();
  const gable = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: false }),
    whitewash,
  );
  gable.position.set(0, 0.46, 0.3);
  gable.castShadow = true;
  group.add(gable);

  const glass = standard("#2c3b3a", {
    roughness: 0.3,
    metalness: 0.1,
    emissive: new THREE.Color("#ffbe66"),
    emissiveIntensity: 0,
  });
  const windowGeometry = new THREE.BoxGeometry(0.13, 0.2, 0.03);
  const shutterGeometry = new THREE.BoxGeometry(0.18, 0.26, 0.02);
  const shutterMaterial = standard("#4a5f52", { roughness: 0.85 });
  const offsets: [number, number][] = [
    [-0.34, 0.34],
    [0.34, 0.34],
    [-0.34, -0.34],
    [0.34, -0.34],
    [0, 0.34],
  ];
  for (const [wx, wz] of offsets) {
    const pane = new THREE.Mesh(windowGeometry, glass);
    pane.position.set(wx, 0.26, wz > 0 ? 0.335 : -0.335);
    group.add(pane);
    const shutter = new THREE.Mesh(shutterGeometry, shutterMaterial);
    shutter.position.set(wx - 0.1, 0.26, wz > 0 ? 0.34 : -0.34);
    group.add(shutter);
    const shutter2 = shutter.clone();
    shutter2.position.x = wx + 0.1;
    group.add(shutter2);
  }

  const door = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.3, 0.04),
    standard("#4c3a2d", { roughness: 0.8 }),
  );
  door.position.set(0, 0.15, 0.34);
  group.add(door);

  const stoep = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.04, 0.22), standard("#cfc4ad"));
  stoep.position.set(0, 0.05, 0.45);
  stoep.receiveShadow = true;
  group.add(stoep);

  // Low whitewashed werf wall on the approach side.
  const wallMaterial = standard("#eee8d8", { roughness: 0.95 });
  for (const side of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.5), wallMaterial);
    wall.position.set(side * 0.92, 0.08, 0.42);
    wall.castShadow = true;
    group.add(wall);
  }
  const wallFront = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.16, 0.06), wallMaterial);
  wallFront.position.set(0, 0.08, 0.66);
  wallFront.castShadow = true;
  group.add(wallFront);

  return { group, glass };
}

/** Long trellised vine rows, planted across a slope. */
export function createVineyards({
  origin,
  rows,
  rowLength,
  spacing,
  rotation = 0,
  height,
  vineColor = ["#4c6b3c", "#5d7d43", "#43603a"],
  postColor = "#8a6b4b",
}: {
  origin: [number, number];
  rows: number;
  rowLength: number;
  spacing: number;
  rotation?: number;
  height: (x: number, z: number) => number;
  vineColor?: string[];
  postColor?: string;
}) {
  const group = new THREE.Group();
  const step = 0.19;
  const perRow = Math.max(2, Math.round(rowLength / step));
  const total = rows * perRow;
  const bushGeometry = new THREE.IcosahedronGeometry(0.085, 0);
  bushGeometry.scale(0.9, 0.78, 1.15);
  bushGeometry.translate(0, 0.1, 0);
  const bushMaterial = standard("#ffffff", { roughness: 0.92, flatShading: true });
  const bushes = new THREE.InstancedMesh(bushGeometry, bushMaterial, total);
  const postGeometry = new THREE.CylinderGeometry(0.012, 0.012, 0.34, 4);
  postGeometry.translate(0, 0.17, 0);
  const posts = new THREE.InstancedMesh(postGeometry, standard(postColor), rows * 2);
  const wireMaterial = new THREE.MeshStandardMaterial({
    color: "#7d8a72",
    roughness: 0.8,
    metalness: 0.1,
  });

  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  let index = 0;
  for (let row = 0; row < rows; row++) {
    const rowOffset = (row - (rows - 1) / 2) * spacing;
    for (let i = 0; i < perRow; i++) {
      const along = (i / (perRow - 1) - 0.5) * rowLength;
      const lx = along;
      const lz = rowOffset;
      const x = origin[0] + lx * cos + lz * sin;
      const z = origin[1] - lx * sin + lz * cos;
      place(bushes, index++, {
        x,
        z,
        y: height(x, z) + 0.01,
        rotation: rotation + (i % 2) * 0.06,
        scale: [1, 0.9 + ((i * 7 + row * 3) % 5) * 0.05, 1],
        color: vineColor[(i + row) % vineColor.length],
      });
    }
    for (const end of [-0.5, 0.5]) {
      const lx = end * rowLength;
      const lz = rowOffset;
      const x = origin[0] + lx * cos + lz * sin;
      const z = origin[1] - lx * sin + lz * cos;
      place(posts, row * 2 + (end > 0 ? 1 : 0), {
        x,
        z,
        y: height(x, z) + 0.01,
      });
    }
    for (const lift of [0.15, 0.3]) {
      const a = new THREE.Vector3(
        origin[0] - (rowLength / 2) * cos + rowOffset * sin,
        height(origin[0] - (rowLength / 2) * cos, origin[1] - (rowLength / 2) * sin) + lift,
        origin[1] + (rowLength / 2) * sin + rowOffset * cos,
      );
      const b = new THREE.Vector3(
        origin[0] + (rowLength / 2) * cos + rowOffset * sin,
        height(origin[0] + (rowLength / 2) * cos, origin[1] - (rowLength / 2) * sin) + lift,
        origin[1] + (rowLength / 2) * sin + rowOffset * cos,
      );
      const wire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.004, 0.004, a.distanceTo(b), 3),
        wireMaterial,
      );
      wire.position.copy(a).add(b).multiplyScalar(0.5);
      wire.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3().subVectors(b, a).normalize(),
      );
      group.add(wire);
    }
  }
  finish(bushes);
  finish(posts);
  group.add(bushes, posts);
  return group;
}

/** Timber boardwalk that follows a height function. */
export function createBoardwalk({
  points,
  width = 0.34,
  height,
}: {
  points: [number, number][];
  width?: number;
  height: (x: number, z: number) => number;
}) {
  const group = new THREE.Group();
  const deckMaterial = standard("#a8835a", { roughness: 0.92 });
  const postMaterial = standard("#6d5137", { roughness: 0.95 });
  const railMaterial = standard("#8a6a48", { roughness: 0.9 });
  const samples = 40;
  const curve = new THREE.CatmullRomCurve3(
    points.map(([x, z]) => new THREE.Vector3(x, height(x, z), z)),
  );
  for (let i = 0; i < samples; i++) {
    const a = curve.getPoint(i / samples);
    const b = curve.getPoint((i + 1) / samples);
    const length = a.distanceTo(b) + 0.01;
    const plank = new THREE.Mesh(new THREE.BoxGeometry(width, 0.045, length * 1.06), deckMaterial);
    plank.position.copy(a).add(b).multiplyScalar(0.5);
    plank.position.y += 0.2;
    plank.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
    plank.rotation.x = -Math.atan2(b.y - a.y, Math.hypot(b.x - a.x, b.z - a.z));
    plank.castShadow = true;
    plank.receiveShadow = true;
    group.add(plank);
    if (i % 3 === 0) {
      for (const side of [-1, 1]) {
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.022, 0.022, 0.42, 5),
          postMaterial,
        );
        post.position.set(
          a.x + Math.cos(plank.rotation.y) * side * width * 0.48,
          a.y + 0.02,
          a.z - Math.sin(plank.rotation.y) * side * width * 0.48,
        );
        group.add(post);
        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(0.024, 0.024, length * 3.1),
          railMaterial,
        );
        rail.position.set(
          a.x + Math.cos(plank.rotation.y) * side * width * 0.48,
          a.y + 0.33,
          a.z - Math.sin(plank.rotation.y) * side * width * 0.48,
        );
        rail.rotation.y = plank.rotation.y;
        group.add(rail);
      }
    }
  }
  return group;
}

export type SafariVehicleBuild = {
  group: THREE.Group;
  tick: (time: number) => void;
};

/** Open-sided 4x4 game viewer with a canvas roof. */
export function createSafariVehicle({
  x,
  z,
  y = 0,
  rotation = 0,
  scale = 1,
  color = "#b3a578",
}: {
  x: number;
  z: number;
  y?: number;
  rotation?: number;
  scale?: number;
  color?: string;
}): SafariVehicleBuild {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotation;
  group.scale.setScalar(scale);
  const bodyMaterial = standard(color, { roughness: 0.6, metalness: 0.15 });
  const dark = standard("#3d3b32", { roughness: 0.8 });
  const wheelMaterial = standard("#25241f", { roughness: 0.95 });

  const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.16, 0.3), bodyMaterial);
  chassis.position.y = 0.16;
  chassis.castShadow = true;
  group.add(chassis);
  const bonnet = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.28), bodyMaterial);
  bonnet.position.set(0.3, 0.24, 0);
  group.add(bonnet);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.18, 0.28), bodyMaterial);
  cabin.position.set(-0.02, 0.32, 0);
  group.add(cabin);
  const windscreen = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.13, 0.26), dark);
  windscreen.position.set(0.17, 0.34, 0);
  group.add(windscreen);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.02, 0.32), standard("#e7ddc2"));
  roof.position.y = 0.47;
  group.add(roof);
  for (const sx of [-0.26, 0.26]) {
    for (const sz of [-0.14, 0.14]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.22, 4), dark);
      post.position.set(sx, 0.36, sz);
      group.add(post);
    }
  }

  const wheelGeometry = new THREE.CylinderGeometry(0.09, 0.09, 0.06, 10);
  wheelGeometry.rotateX(Math.PI / 2);
  for (const sx of [-0.2, 0.22]) {
    for (const sz of [-0.16, 0.16]) {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.position.set(sx, 0.09, sz);
      group.add(wheel);
    }
  }
  const spare = new THREE.Mesh(wheelGeometry, wheelMaterial);
  spare.position.set(-0.33, 0.22, 0);
  spare.rotation.y = Math.PI / 2;
  group.add(spare);

  const tick = (time: number) => {
    group.position.y = y + Math.sin(time * 6) * 0.004;
  };
  return { group, tick };
}

/** Mangrove clumps with stilt roots. */
export function createMangroves({ trees }: { trees: Instance[] }) {
  const group = new THREE.Group();
  const trunkGeometry = new THREE.CylinderGeometry(0.014, 0.026, 0.34, 5);
  trunkGeometry.translate(0, 0.17, 0);
  const trunkMaterial = standard("#7c6a52", { roughness: 0.95 });
  const trunks = new THREE.InstancedMesh(trunkGeometry, trunkMaterial, trees.length);
  const foliageGeometry = new THREE.IcosahedronGeometry(0.26, 1);
  foliageGeometry.scale(1.1, 0.72, 1);
  foliageGeometry.translate(0, 0.4, 0);
  const foliage = new THREE.InstancedMesh(
    foliageGeometry,
    standard("#ffffff", { roughness: 0.94, flatShading: true }),
    trees.length,
  );
  const rootGeometry = new THREE.CylinderGeometry(0.007, 0.01, 0.2, 4);
  rootGeometry.translate(0, 0.1, 0);
  const roots = new THREE.InstancedMesh(rootGeometry, trunkMaterial, trees.length * 5);

  trees.forEach((tree, index) => {
    place(trunks, index, tree);
    place(foliage, index, {
      ...tree,
      color: tree.color ?? "#3f6b45",
      scale: scalarScale(tree.scale) * (1 + (index % 3) * 0.12),
    });
    for (let r = 0; r < 5; r++) {
      const angle = (r / 5) * Math.PI * 2 + index;
      place(roots, index * 5 + r, {
        x: tree.x + Math.cos(angle) * 0.09,
        z: tree.z + Math.sin(angle) * 0.09,
        y: (tree.y ?? 0) - 0.02,
        rotation: angle,
        scale: [1, 0.8 + (index % 4) * 0.08, 1],
      });
    }
  });
  finish(trunks);
  finish(foliage);
  finish(roots);
  group.add(trunks, foliage, roots);
  return group;
}

/** Weathered dolerite columns, the Valley of Desolation signature. */
export function createDoleritePillars({ pillars }: { pillars: Instance[] }) {
  const geometry = new THREE.CylinderGeometry(0.3, 0.42, 1, 6, 1, false);
  geometry.translate(0, 0.5, 0);
  const material = standard("#ffffff", { roughness: 0.97, flatShading: true });
  const mesh = new THREE.InstancedMesh(geometry, material, pillars.length);
  pillars.forEach((pillar, index) => {
    place(mesh, index, {
      ...pillar,
      rotation: pillar.rotation ?? index * 0.7,
      color: pillar.color ?? ["#8d6a4a", "#a37c56", "#7b5c41"][index % 3],
    });
  });
  finish(mesh);
  return mesh;
}

/** Larger, smoother granite forms for Boulders Beach. */
export function createSmoothRocks({ rocks }: { rocks: Instance[] }) {
  const geometry = new THREE.IcosahedronGeometry(0.5, 2);
  const material = standard("#ffffff", { roughness: 0.88, flatShading: false });
  const mesh = new THREE.InstancedMesh(geometry, material, rocks.length);
  rocks.forEach((rock, index) => {
    place(mesh, index, {
      ...rock,
      rotation: rock.rotation ?? index * 1.1,
      color: rock.color ?? ["#cdc2ac", "#b8ad96", "#ded4bf"][index % 3],
    });
  });
  finish(mesh);
  return mesh;
}

/** Umbrella-thorn acacias for the Addo thicket. */
export function createAcacias({ trees }: { trees: Instance[] }) {
  const group = new THREE.Group();
  const trunkGeometry = new THREE.CylinderGeometry(0.015, 0.03, 0.4, 5);
  trunkGeometry.translate(0, 0.2, 0);
  const trunks = new THREE.InstancedMesh(trunkGeometry, standard("#57402e"), trees.length);
  const canopyGeometry = new THREE.IcosahedronGeometry(0.36, 0);
  canopyGeometry.scale(1.15, 0.42, 1.05);
  canopyGeometry.translate(0, 0.46, 0);
  const canopies = new THREE.InstancedMesh(
    canopyGeometry,
    standard("#ffffff", { roughness: 0.96, flatShading: true }),
    trees.length,
  );
  trees.forEach((tree, index) => {
    place(trunks, index, tree);
    place(canopies, index, {
      ...tree,
      color: tree.color ?? ["#5d7440", "#6c8248", "#51683a"][index % 3],
    });
  });
  finish(trunks);
  finish(canopies);
  group.add(trunks, canopies);
  return group;
}

/** Quiver trees: bare trunks with a crown of upward branches. */
export function createQuiverTrees({ trees }: { trees: Instance[] }) {
  const group = new THREE.Group();
  const barkMaterial = standard("#9a7c4f", { roughness: 0.96, flatShading: true });
  trees.forEach((tree, index) => {
    const scale = scalarScale(tree.scale);
    const holder = new THREE.Group();
    holder.position.set(tree.x, tree.y ?? 0, tree.z);
    holder.rotation.y = tree.rotation ?? index;
    holder.scale.setScalar(scale);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.6, 5), barkMaterial);
    trunk.position.y = 0.3;
    trunk.castShadow = true;
    holder.add(trunk);
    for (let b = 0; b < 4; b++) {
      const angle = (b / 4) * Math.PI * 2 + index * 0.6;
      const branch = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.022, 0.34, 4),
        barkMaterial,
      );
      branch.position.set(Math.cos(angle) * 0.07, 0.66, Math.sin(angle) * 0.07);
      branch.rotation.set(Math.sin(angle) * 0.28, 0, -Math.cos(angle) * 0.28);
      holder.add(branch);
      const crown = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.09, 0),
        standard("#7d8a54", { roughness: 0.95 }),
      );
      crown.position.set(Math.cos(angle) * 0.11, 0.84, Math.sin(angle) * 0.11);
      holder.add(crown);
    }
    group.add(holder);
  });
  return group;
}

/** Raffia palms for the Kosi Bay dunes. */
export function createPalms({ palms }: { palms: Instance[] }) {
  const group = new THREE.Group();
  const trunkGeometry = new THREE.CylinderGeometry(0.022, 0.034, 0.7, 6);
  trunkGeometry.translate(0, 0.35, 0);
  const trunks = new THREE.InstancedMesh(trunkGeometry, standard("#8a7150"), palms.length);
  const frondGeometry = new THREE.ConeGeometry(0.09, 0.6, 4, 1, true);
  frondGeometry.rotateZ(Math.PI / 2);
  frondGeometry.translate(0.3, 0, 0);
  frondGeometry.scale(1, 0.35, 1);
  const fronds = new THREE.InstancedMesh(
    frondGeometry,
    standard("#ffffff", { roughness: 0.92, flatShading: true, side: THREE.DoubleSide }),
    palms.length * 6,
  );
  palms.forEach((palm, index) => {
    place(trunks, index, palm);
    for (let f = 0; f < 6; f++) {
      const angle = (f / 6) * Math.PI * 2;
      place(fronds, index * 6 + f, {
        x: palm.x,
        z: palm.z,
        y: (palm.y ?? 0) + 0.68,
        rotation: (palm.rotation ?? 0) + angle,
        scale: scalarScale(palm.scale) * 1.05,
        color: ["#4f7a45", "#5f8a4c", "#426b3c"][f % 3],
      });
    }
  });
  finish(trunks);
  finish(fronds);
  group.add(trunks, fronds);
  return group;
}

/** Dry Karoo scrub, scattered as low ochre and olive mounds. */
export function createScrub({
  shrubs,
  colors = ["#8c8a5a", "#a39865", "#6f7a4c"],
}: {
  shrubs: Instance[];
  colors?: string[];
}) {
  const geometry = new THREE.IcosahedronGeometry(0.12, 0);
  geometry.scale(1, 0.6, 1);
  geometry.translate(0, 0.06, 0);
  const material = standard("#ffffff", { roughness: 0.98, flatShading: true });
  const mesh = new THREE.InstancedMesh(geometry, material, shrubs.length);
  shrubs.forEach((shrub, index) => {
    place(mesh, index, { ...shrub, color: shrub.color ?? colors[index % colors.length] });
  });
  finish(mesh);
  return mesh;
}
