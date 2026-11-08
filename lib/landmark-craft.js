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
for (const geometry of [figureGeometry, headGeometry, carGeometry]) geometry.userData.shared = true;
const figureMaterial = new THREE.MeshStandardMaterial({ color: "#4e5a63", roughness: 0.88 });
const accentMaterial = new THREE.MeshStandardMaterial({ color: "#b4552f", roughness: 0.82 });
const carMaterial = new THREE.MeshStandardMaterial({
  color: "#d9c7a5",
  roughness: 0.42,
  metalness: 0.35,
});
const cueMaterial = new THREE.MeshStandardMaterial({ color: "#3d4650", roughness: 0.9 });
for (const material of [figureMaterial, accentMaterial, carMaterial, cueMaterial])
  material.userData.shared = true;

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

  root.add(group);
  return group.children.length;
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
