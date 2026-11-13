import * as THREE from "three/webgpu";
import {
  createArchGeometry,
  createBeam,
  createHyperboloidGeometry,
  createRoofPrism,
} from "./geometry";

export function createCoolingTower({
  x,
  z,
  y = 0,
  height,
  baseRadius,
  topRadius,
  waistRadius,
  mural,
  rotation = 0,
}: {
  x: number;
  z: number;
  y?: number;
  height: number;
  baseRadius: number;
  topRadius: number;
  waistRadius: number;
  mural: THREE.Texture;
  rotation?: number;
}) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotation;
  const geometry = createHyperboloidGeometry(height, baseRadius, topRadius, waistRadius, 64);
  const muralMaterial = new THREE.MeshStandardMaterial({
    map: mural,
    roughness: 0.76,
    metalness: 0.04,
  });
  const outer = new THREE.Mesh(geometry, muralMaterial);
  outer.castShadow = true;
  outer.receiveShadow = true;
  const innerMaterial = new THREE.MeshStandardMaterial({
    color: "#141b1d",
    roughness: 0.95,
    side: THREE.BackSide,
  });
  const inner = new THREE.Mesh(geometry, innerMaterial);
  inner.scale.setScalar(0.996);
  const concrete = new THREE.MeshStandardMaterial({
    color: "#b9b3a7",
    roughness: 0.9,
    metalness: 0,
  });
  const darkSteel = new THREE.MeshStandardMaterial({
    color: "#4a5053",
    roughness: 0.62,
    metalness: 0.4,
  });
  const baseRing = new THREE.Mesh(
    new THREE.CylinderGeometry(baseRadius * 1.04, baseRadius * 1.09, 0.12, 48),
    concrete,
  );
  baseRing.position.y = 0.06;
  baseRing.castShadow = true;
  baseRing.receiveShadow = true;
  const topRim = new THREE.Mesh(new THREE.TorusGeometry(topRadius, 0.026, 6, 48), concrete);
  topRim.rotation.x = Math.PI / 2;
  topRim.position.y = height;
  const topDisk = new THREE.Mesh(
    new THREE.CircleGeometry(topRadius * 0.975, 48),
    new THREE.MeshStandardMaterial({
      color: "#0e1416",
      roughness: 1,
      side: THREE.DoubleSide,
    }),
  );
  topDisk.rotation.x = -Math.PI / 2;
  topDisk.position.y = height - 0.015;
  group.add(outer, inner, baseRing, topRim, topDisk);
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const from = new THREE.Vector3(
      Math.cos(angle) * baseRadius * 1.08,
      0.1,
      Math.sin(angle) * baseRadius * 1.08,
    );
    const to = new THREE.Vector3(
      Math.cos(angle) * baseRadius * 0.98,
      0.34,
      Math.sin(angle) * baseRadius * 0.98,
    );
    group.add(createBeam(from, to, 0.018, darkSteel, 4));
  }
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.32, 0.04), darkSteel);
  door.position.set(0, 0.2, baseRadius * 1.02);
  group.add(door);
  return group;
}

export function createMineHeadframe({
  x,
  z,
  y = 0,
  scale = 1,
}: {
  x: number;
  z: number;
  y?: number;
  scale?: number;
}) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.scale.setScalar(scale);
  const steel = new THREE.MeshStandardMaterial({
    color: "#5b4c3d",
    roughness: 0.8,
    metalness: 0.25,
  });
  const dark = new THREE.MeshStandardMaterial({ color: "#3e3329", roughness: 0.9 });
  const base = 0.38;
  const top = new THREE.Vector3(0, 1.05, 0);
  for (const [sx, sz] of [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ]) {
    group.add(createBeam(new THREE.Vector3(sx * base, 0, sz * base), top, 0.025, steel, 4));
  }
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.022, 6, 20), dark);
  wheel.position.set(0, 1.08, 0);
  wheel.rotation.y = Math.PI / 2;
  group.add(wheel);
  const hut = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.3, 0.4), dark);
  hut.position.set(0.5, 0.15, 0.1);
  hut.castShadow = true;
  group.add(hut);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.2, 4), steel);
  roof.position.set(0.5, 0.4, 0.1);
  roof.rotation.y = Math.PI / 4;
  group.add(roof);
  return group;
}

export function createSoccerField({
  x,
  z,
  y,
  width = 2.5,
  depth = 1.55,
  texture,
}: {
  x: number;
  z: number;
  y: number;
  width?: number;
  depth?: number;
  texture: THREE.Texture;
}) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  const pitch = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    new THREE.MeshStandardMaterial({ map: texture, roughness: 0.92 }),
  );
  pitch.rotation.x = -Math.PI / 2;
  pitch.receiveShadow = true;
  group.add(pitch);
  const white = new THREE.MeshStandardMaterial({ color: "#f6f3e8", roughness: 0.8 });
  const postGeometry = new THREE.CylinderGeometry(0.018, 0.018, 0.24, 5);
  for (const side of [-1, 1]) {
    for (const across of [-1, 1]) {
      const post = new THREE.Mesh(postGeometry, white);
      post.position.set(side * (width / 2 - 0.03), 0.12, across * 0.28);
      group.add(post);
    }
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 0.58), white);
    bar.position.set(side * (width / 2 - 0.03), 0.24, 0);
    group.add(bar);
  }
  const teamA = new THREE.MeshStandardMaterial({ color: "#c9473d", roughness: 0.8 });
  const teamB = new THREE.MeshStandardMaterial({ color: "#2d5f8a", roughness: 0.8 });
  const playerGeometry = new THREE.CapsuleGeometry(0.018, 0.07, 2, 4);
  for (let i = 0; i < 10; i++) {
    const player = new THREE.Mesh(playerGeometry, i % 2 === 0 ? teamA : teamB);
    player.position.set((i % 5) * 0.32 - 0.64 + (i > 4 ? 0.16 : 0), 0.06, i < 5 ? -0.28 : 0.28);
    group.add(player);
  }
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.035, 8, 6),
    new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.6 }),
  );
  ball.position.set(0.12, 0.035, 0.02);
  group.add(ball);
  return group;
}

function createArcBand(
  inner: number,
  outer: number,
  y: number,
  start: number,
  length: number,
  segments = 28,
) {
  const positions: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = start + (i / segments) * length;
    const c = Math.cos(a);
    const s = Math.sin(a);
    positions.push(c * inner, y, s * inner, c * outer, y, s * outer);
    if (i < segments) {
      const k = i * 2;
      indices.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createArcWall(
  radius: number,
  y0: number,
  y1: number,
  start: number,
  length: number,
  segments = 28,
) {
  const positions: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = start + (i / segments) * length;
    const c = Math.cos(a);
    const s = Math.sin(a);
    positions.push(c * radius, y0, s * radius, c * radius, y1, s * radius);
    if (i < segments) {
      const k = i * 2;
      indices.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function createUnionBuildings({
  x,
  z,
  y,
  scale = 1,
  facade,
}: {
  x: number;
  z: number;
  y: number;
  scale?: number;
  facade: { map: THREE.Texture; emissive: THREE.Texture };
}) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.scale.setScalar(scale);
  const sandstone = new THREE.MeshStandardMaterial({
    color: "#c9a97a",
    roughness: 0.88,
    metalness: 0,
  });
  const sandstoneLight = new THREE.MeshStandardMaterial({
    color: "#d8bd93",
    roughness: 0.86,
  });
  const terracotta = new THREE.MeshStandardMaterial({
    color: "#a85437",
    roughness: 0.82,
  });
  const stone = new THREE.MeshStandardMaterial({
    color: "#b9a181",
    roughness: 0.92,
  });
  const copper = new THREE.MeshStandardMaterial({
    color: "#6f806a",
    roughness: 0.55,
    metalness: 0.25,
  });
  const facadeMaterial = new THREE.MeshStandardMaterial({
    map: facade.map,
    emissiveMap: facade.emissive,
    emissive: new THREE.Color("#ffce86"),
    emissiveIntensity: 0,
    roughness: 0.86,
  });

  const platform = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.22, 2.2), stone);
  platform.position.set(0, -0.02, -0.2);
  platform.receiveShadow = true;
  group.add(platform);
  // Retaining terrace so the building is bedded into Meintjieskop instead of
  // floating where the plateau falls away.
  const terrace = new THREE.Mesh(new THREE.BoxGeometry(9.6, 1.5, 2.5), stone);
  terrace.position.set(0, -0.78, -0.2);
  terrace.castShadow = true;
  terrace.receiveShadow = true;
  group.add(terrace);
  const forecourt = new THREE.Mesh(createArcBand(0.02, 1.9, 0.015, 0, Math.PI), stone);
  forecourt.position.z = 0.18;
  forecourt.receiveShadow = true;
  group.add(forecourt);

  for (const side of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.62, 0.8), sandstone);
    wing.position.set(side * 3.05, 0.4, -0.15);
    wing.castShadow = true;
    wing.receiveShadow = true;
    group.add(wing);
    const roof = new THREE.Mesh(createRoofPrism(3.02, 0.92, 0.3), terracotta);
    roof.position.set(side * 3.05, 0.71, -0.15);
    roof.castShadow = true;
    group.add(roof);
    const front = new THREE.Mesh(new THREE.PlaneGeometry(2.72, 0.5), facadeMaterial);
    front.position.set(side * 3.05, 0.39, 0.255);
    group.add(front);
    const cornice = new THREE.Mesh(new THREE.BoxGeometry(3.05, 0.06, 0.9), sandstoneLight);
    cornice.position.set(side * 3.05, 0.73, -0.15);
    group.add(cornice);
  }

  const central = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.68, 0.72), sandstone);
  central.position.set(0, 0.43, -0.28);
  central.castShadow = true;
  central.receiveShadow = true;
  group.add(central);

  const wall = new THREE.Mesh(createArcWall(1.28, 0.18, 0.7, 0, Math.PI), sandstone);
  wall.position.z = 0.18;
  wall.castShadow = true;
  group.add(wall);

  const colonnade = new THREE.Mesh(createArcBand(1.24, 1.72, 0.78, 0, Math.PI), sandstoneLight);
  colonnade.position.z = 0.18;
  colonnade.castShadow = true;
  group.add(colonnade);
  const roofBand = new THREE.Mesh(createArcBand(1.32, 1.79, 0.84, 0, Math.PI), terracotta);
  roofBand.position.z = 0.18;
  roofBand.castShadow = true;
  group.add(roofBand);

  const columnGeometry = new THREE.CylinderGeometry(0.055, 0.06, 0.62, 8);
  for (let i = 0; i <= 18; i++) {
    const angle = (i / 18) * Math.PI;
    const column = new THREE.Mesh(columnGeometry, sandstoneLight);
    column.position.set(Math.cos(angle) * 1.5, 0.46, 0.18 + Math.sin(angle) * 1.5);
    column.castShadow = true;
    group.add(column);
    const capital = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.14), sandstone);
    capital.position.copy(column.position);
    capital.position.y = 0.8;
    group.add(capital);
  }

  for (const side of [-1, 1]) {
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.26, 20), sandstoneLight);
    drum.position.set(side * 1.72, 0.92, -0.08);
    drum.castShadow = true;
    group.add(drum);
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      copper,
    );
    dome.position.set(side * 1.72, 1.04, -0.08);
    dome.scale.y = 1.15;
    dome.castShadow = true;
    group.add(dome);
    const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.16, 8), sandstoneLight);
    lantern.position.set(side * 1.72, 1.38, -0.08);
    group.add(lantern);
    const finial = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), copper);
    finial.position.set(side * 1.72, 1.5, -0.08);
    group.add(finial);
  }

  const windowMaterial = new THREE.MeshStandardMaterial({
    color: "#3d4f5a",
    roughness: 0.3,
    metalness: 0.1,
    emissive: new THREE.Color("#ffce86"),
    emissiveIntensity: 0,
  });
  for (let i = 0; i < 6; i++) {
    for (const side of [-1, 1]) {
      const window = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.16), windowMaterial);
      window.position.set(side * (2.15 + i * 0.4), 0.42, 0.24);
      group.add(window);
    }
  }
  group.userData.windowMaterials = [facadeMaterial, windowMaterial];
  return group;
}

export function createSeaArch({
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
}) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotation;
  group.scale.setScalar(scale);
  const rock = new THREE.MeshStandardMaterial({
    color: "#a0805c",
    roughness: 0.96,
    flatShading: true,
  });
  const darkRock = new THREE.MeshStandardMaterial({
    color: "#4c3b2c",
    roughness: 1,
    side: THREE.DoubleSide,
  });
  const arch = new THREE.Mesh(createArchGeometry(0.82, 0.19), rock);
  arch.castShadow = true;
  arch.receiveShadow = true;
  group.add(arch);
  const platform = new THREE.Mesh(new THREE.CylinderGeometry(1.22, 1.38, 0.16, 10), rock);
  platform.position.y = -0.07;
  platform.castShadow = true;
  platform.receiveShadow = true;
  group.add(platform);
  const cave = new THREE.Mesh(new THREE.CircleGeometry(0.62, 24), darkRock);
  cave.position.z = -0.18;
  group.add(cave);
  for (let i = 0; i < 4; i++) {
    const rockMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.15 + (i % 2) * 0.05, 0), rock);
    const angle = Math.PI * 0.25 + (i / 4) * Math.PI * 1.5;
    rockMesh.position.set(Math.cos(angle) * 1.12, 0.01, Math.sin(angle) * 0.76);
    rockMesh.rotation.set(i, i * 1.7, 0);
    rockMesh.castShadow = true;
    group.add(rockMesh);
  }
  return group;
}
