// Craft and level-of-detail helpers for procedural landmarks.
//
// Big visual returns with small runtime cost:
// - chamfered boxes catch highlights instead of reading as flat CG primitives
// - human-scale cues make the miniature legible
// - instanced detail is tagged so saver hardware can drop it without a rebuild
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

const figureGeometry = new THREE.CapsuleGeometry(0.16, 0.62, 3, 8);
const headGeometry = new THREE.SphereGeometry(0.15, 8, 6);
const carGeometry = new THREE.BoxGeometry(1.8, 0.5, 0.75);
const bollardGeometry = new THREE.CylinderGeometry(0.06, 0.08, 0.65, 6);
const floraGeometry = new THREE.DodecahedronGeometry(0.22, 0);
const trimGeometry = new THREE.BoxGeometry(1, 1, 1);
for (const geometry of [
  figureGeometry,
  headGeometry,
  carGeometry,
  bollardGeometry,
  floraGeometry,
  trimGeometry,
]) {
  geometry.userData.shared = true;
}
const figureMaterial = new THREE.MeshStandardMaterial({ color: "#4e5a63", roughness: 0.88 });
const accentMaterial = new THREE.MeshStandardMaterial({ color: "#b4552f", roughness: 0.82 });
const carMaterial = new THREE.MeshStandardMaterial({
  color: "#d9c7a5",
  roughness: 0.42,
  metalness: 0.35,
});
const cueMaterial = new THREE.MeshStandardMaterial({ color: "#3d4650", roughness: 0.9 });
const bollardMaterial = new THREE.MeshStandardMaterial({
  color: "#2c353b",
  roughness: 0.52,
  metalness: 0.45,
});
const floraMaterial = new THREE.MeshStandardMaterial({ color: "#58734d", roughness: 0.92 });
const corniceMaterial = new THREE.MeshStandardMaterial({
  color: "#d8d1c2",
  roughness: 0.82,
  metalness: 0.04,
});
const glassPaneMaterial = new THREE.MeshStandardMaterial({
  color: "#1b2c36",
  roughness: 0.14,
  metalness: 0.25,
  transparent: true,
  opacity: 0.78,
});
const windowBackingMaterial = new THREE.MeshStandardMaterial({
  color: "#2a241d",
  emissive: "#f5b864",
  emissiveIntensity: 0.12,
  roughness: 0.9,
});
for (const material of [
  figureMaterial,
  accentMaterial,
  carMaterial,
  cueMaterial,
  bollardMaterial,
  floraMaterial,
  corniceMaterial,
  glassPaneMaterial,
  windowBackingMaterial,
]) {
  material.userData.shared = true;
}

function roundedGeometry(width, height, depth, radius) {
  const safe = Math.min(radius, width / 2.05, height / 2.05, depth / 2.05);
  return new RoundedBoxGeometry(width, height, depth, 2, Math.max(0.004, safe));
}

/**
 * Replace a plain box with a chamfered box of the same dimensions.
 * Shared or tiny geometries are left untouched to protect draw budgets.
 */
export function chamferMesh(mesh, radius = 0.035) {
  if (!mesh?.isMesh || mesh.isInstancedMesh) return false;
  const geometry = mesh.geometry;
  if (!geometry || geometry.type !== "BoxGeometry" || !geometry.parameters) return false;
  const { width, height, depth } = geometry.parameters;
  if (!width || !height || !depth) return false;
  // Skip decals, mullions and other thin trim; they read better crisp.
  if (Math.min(width, height, depth) < 0.09) return false;
  const next = roundedGeometry(width, height, depth, radius);
  mesh.geometry = next;
  mesh.userData.chamfered = true;
  return true;
}

/** Chamfer all qualifying boxes in a landmark. */
export function applyLandmarkCraft(root, { radius = 0.035 } = {}) {
  let chamfered = 0;
  root.traverse((object) => {
    if (chamferMesh(object, radius)) chamfered++;
  });
  root.userData.chamferedBoxes = chamfered;
  return chamfered;
}

/**
 * Add restrained human-scale cues derived from published real-world width.
 * Tiny or landscape-scale models are skipped; the cue would be invisible.
 */
export function addLandmarkScaleCues(root, spec) {
  const realWidth = spec?.real?.width;
  if (!realWidth) return 0;
  root.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(root);
  const size = bounds.getSize(new THREE.Vector3());
  if (!Number.isFinite(size.x) || size.x <= 0) return 0;
  const metresPerUnit = realWidth / size.x;
  const figureHeight = 1.8 / metresPerUnit;
  if (figureHeight < 0.035 || figureHeight > 0.35) return 0;

  const group = new THREE.Group();
  group.name = "landmark-human-scale-cues";
  const front = bounds.max.z * 0.72;
  const left = bounds.min.x + size.x * 0.18;

  const figure = (x, z, material) => {
    const person = new THREE.Group();
    const body = new THREE.Mesh(figureGeometry, material);
    body.scale.setScalar(figureHeight / 1.0);
    body.position.y = figureHeight * 0.52;
    const head = new THREE.Mesh(headGeometry, material);
    head.scale.setScalar(figureHeight / 1.0);
    head.position.y = figureHeight * 0.96;
    person.add(body, head);
    person.position.set(x, 0, z);
    person.userData.scaleCue = true;
    return person;
  };

  group.add(figure(left, front, figureMaterial));
  group.add(figure(left + figureHeight * 1.4, front + figureHeight * 0.2, accentMaterial));
  group.add(figure(left - figureHeight * 1.1, front - figureHeight * 0.15, cueMaterial));

  const car = new THREE.Mesh(carGeometry, carMaterial);
  const carScale = 4.4 / metresPerUnit / 1.8;
  car.scale.setScalar(carScale);
  car.position.set(bounds.max.x * 0.52, 0.25 * carScale, front * 0.86);
  car.userData.scaleCue = true;
  group.add(car);

  // Instanced bollards and indigenous flora tufts for balanced + detail tiers
  const bollardCount = 4;
  const bollards = new THREE.InstancedMesh(bollardGeometry, bollardMaterial, bollardCount);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < bollardCount; i++) {
    const t = i / (bollardCount - 1) - 0.5;
    dummy.position.set(t * size.x * 0.68, figureHeight * 0.22, front * 0.95);
    dummy.scale.setScalar(figureHeight * 0.68);
    dummy.updateMatrix();
    bollards.setMatrixAt(i, dummy.matrix);
  }
  bollards.instanceMatrix.needsUpdate = true;
  bollards.userData.lodMin = 1;
  bollards.userData.scaleCue = true;
  group.add(bollards);

  const floraCount = 6;
  const flora = new THREE.InstancedMesh(floraGeometry, floraMaterial, floraCount);
  for (let i = 0; i < floraCount; i++) {
    const angle = (i / floraCount) * Math.PI * 1.4 - Math.PI * 0.7;
    const radius = Math.max(size.x, size.z) * 0.46;
    dummy.position.set(Math.sin(angle) * radius, figureHeight * 0.14, Math.cos(angle) * radius);
    dummy.rotation.set(i * 0.4, i * 1.1, 0);
    dummy.scale.set(figureHeight * 0.9, figureHeight * 0.65, figureHeight * 0.85);
    dummy.updateMatrix();
    flora.setMatrixAt(i, dummy.matrix);
  }
  flora.instanceMatrix.needsUpdate = true;
  flora.userData.lodMin = 1;
  flora.userData.scaleCue = true;
  group.add(flora);

  root.add(group);
  return group.children.length;
}

/**
 * Bake subtle procedural crevice & ground-contact darkening into vertex colors
 * so architectural recesses pop on balanced mobile without extra shadow cost.
 */
export function applyVertexCreviceAO(mesh, { groundY = 0, strength = 0.24 } = {}) {
  const geometry = mesh?.geometry;
  if (!geometry?.attributes?.position || geometry.attributes.color) return false;
  const pos = geometry.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  mesh.updateMatrixWorld(true);
  const worldPos = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    worldPos.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
    const heightAboveGround = Math.max(0, worldPos.y - groundY);
    const ao = 1 - strength * Math.exp(-heightAboveGround * 2.2);
    colors[i * 3] = ao;
    colors[i * 3 + 1] = ao;
    colors[i * 3 + 2] = ao;
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  if (mesh.material && !Array.isArray(mesh.material) && !mesh.material.userData?.shared) {
    mesh.material.vertexColors = true;
    mesh.material.needsUpdate = true;
  }
  return true;
}

/**
 * Add instanced roof cornices/parapet trims onto major architectural boxes
 * so silhouettes catch rim highlights on balanced and detail tiers.
 */
export function addArchitecturalTrim(root) {
  const boxes = [];
  root.traverse((obj) => {
    if (!obj.isMesh || obj.isInstancedMesh || obj.userData?.scaleCue || obj.userData?.trim) return;
    const params = obj.geometry?.parameters;
    if (!params?.width || !params?.height || !params?.depth) return;
    if (params.height >= 0.45 && params.width >= 0.45 && params.depth >= 0.45) {
      boxes.push(obj);
    }
  });
  if (boxes.length === 0) return 0;

  const trim = new THREE.InstancedMesh(trimGeometry, corniceMaterial, boxes.length);
  trim.name = "landmark-architectural-trim";
  trim.userData.lodMin = 1;
  trim.userData.trim = true;
  const dummy = new THREE.Object3D();
  const worldPos = new THREE.Vector3();
  const worldQuat = new THREE.Quaternion();
  const worldScale = new THREE.Vector3();

  boxes.forEach((box, idx) => {
    box.updateMatrixWorld(true);
    box.matrixWorld.decompose(worldPos, worldQuat, worldScale);
    const { width, height, depth } = box.geometry.parameters;
    const lipH = Math.min(0.06, height * 0.08);
    dummy.position.copy(worldPos);
    dummy.position.y += height * worldScale.y * 0.5 + lipH * 0.35;
    dummy.quaternion.copy(worldQuat);
    dummy.scale.set(width * worldScale.x + 0.045, lipH, depth * worldScale.z + 0.045);
    dummy.updateMatrix();
    trim.setMatrixAt(idx, dummy.matrix);
  });
  trim.instanceMatrix.needsUpdate = true;
  root.add(trim);
  return boxes.length;
}

/**
 * Two-layer architectural window: recessed warm emissive interior + reflective dark glass pane.
 */
export function createTwoLayerWindow(width, height, depth = 0.04) {
  const group = new THREE.Group();
  const back = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.88, height * 0.88, depth * 0.5),
    windowBackingMaterial,
  );
  back.position.z = -depth * 0.25;
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth * 0.35),
    glassPaneMaterial,
  );
  glass.position.z = depth * 0.15;
  group.add(back, glass);
  return group;
}

/**
 * Stratified geological cutaway plinth for museum/landmark bases.
 */
export function createStratifiedPlinth(width, depth, { height = 0.42 } = {}) {
  const group = new THREE.Group();
  group.name = "landmark-stratified-plinth";
  const layers = [
    { ratio: 0.22, color: "#6c7a56", yOffset: 0.39 }, // topsoil / fynbos crust
    { ratio: 0.38, color: "#c9b38c", yOffset: 0.09 }, // sandstone strata
    { ratio: 0.4, color: "#5f584f", yOffset: -0.3 }, // bedrock
  ];
  for (const layer of layers) {
    const h = height * layer.ratio;
    const mesh = new THREE.Mesh(
      roundedGeometry(width, h, depth, 0.025),
      new THREE.MeshStandardMaterial({ color: layer.color, roughness: 0.9, metalness: 0.02 }),
    );
    mesh.position.y = height * layer.yOffset;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  return group;
}

/** Tag expensive detail so saver hardware can drop it without a rebuild. */
export function tagLandmarkLod(root) {
  root.traverse((object) => {
    if (object.userData?.lodMin !== undefined) return;
    if (object.isInstancedMesh && object.count >= 24) object.userData.lodMin = 1;
  });
}

/**
 * 0 = saver, 1 = balanced, 2 = detail.
 * Objects without a lodMin stay visible at every tier.
 */
export function applyLandmarkLod(root, tier) {
  const level = THREE.MathUtils.clamp(Math.round(tier), 0, 2);
  let changed = false;
  root.traverse((object) => {
    const min = object.userData?.lodMin;
    if (typeof min !== "number") return;
    const visible = level >= min;
    if (object.visible !== visible) {
      object.visible = visible;
      changed = true;
    }
  });
  return changed;
}
