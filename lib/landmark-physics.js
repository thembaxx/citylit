// Node-side structural review for procedural landmarks.
//
// This is a design-time tool, not a runtime physics engine. It answers three
// questions the visual pass cannot:
//   1. Does a joint drive a part into geometry it never touches at rest?
//   2. Is the assembled model's centre of mass over its support footprint?
//   3. Are the bounding-volume mass and joint travel plausible for the place?
//
// All figures are estimates from axis-aligned mesh bounds, not surveys.
import * as THREE from "three";
import { OBB } from "three/examples/jsm/math/OBB.js";
import { landmarkSpec } from "./landmark-specs.js";
import { applyLandmarkRig, clearLandmarkJoints, landmarkJointState } from "./landmark-rig.js";

const DENSITY = {
  cliff: 2700,
  limestone: 2600,
  sandstone: 2400,
  concrete: 2400,
  terracotta: 2000,
  membrane: 1400,
};

const FILL_FACTOR = 0.42;
const SHRINK = 0.96;

function meshLabel(mesh, index) {
  if (mesh.name) return mesh.name;
  const position = mesh.getWorldPosition(new THREE.Vector3());
  return `${mesh.geometry?.type ?? "mesh"}#${index}@${position.x.toFixed(1)},${position.y.toFixed(1)},${position.z.toFixed(1)}`;
}

function isScaleCue(object) {
  for (let node = object; node; node = node.parent) if (node.userData?.scaleCue) return true;
  return false;
}

function materialKind(mesh, fallback) {
  const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
  if (!material) return fallback;
  const match = /landmark-pbr-([a-z]+)/.exec(material.name ?? "");
  if (match) return match[1];
  if ((material.metalness ?? 0) > 0.55) return "steel";
  return fallback;
}

function densityFor(kind) {
  return kind === "steel" ? 7850 : (DENSITY[kind] ?? 2400);
}

/**
 * Open shells and thin rings have a bounding box far larger than their solid
 * material. A lift rising through an atrium ring is not a collision, so those
 * geometries are excluded from the boolean broad-phase.
 */
function isShell(object) {
  const geometry = object.geometry;
  if (!geometry) return false;
  const type = geometry.type;
  if (type === "TorusGeometry" || type === "RingGeometry" || type === "LatheGeometry") return true;
  if (type === "PlaneGeometry" || type === "CircleGeometry") return true;
  if (type === "CylinderGeometry" && geometry.parameters?.openEnded) return true;
  if (type === "SphereGeometry") {
    const parameters = geometry.parameters ?? {};
    if ((parameters.phiLength ?? Math.PI * 2) < Math.PI * 2 - 1e-3) return true;
    if ((parameters.thetaLength ?? Math.PI) < Math.PI - 1e-3) return true;
  }
  return false;
}

function movingObjects(root) {
  const moving = new Set();
  for (const joint of root.userData?.__citylitRig?.joints?.values() ?? []) {
    for (const target of joint.targets) target.traverse((object) => moving.add(object));
  }
  return moving;
}

function collectSnapshots(root, spec, { metresPerUnit = 1 } = {}) {
  const snapshots = [];
  const moving = movingObjects(root);
  root.updateMatrixWorld(true);
  root.traverse((object) => {
    if (!object.isMesh || object.isInstancedMesh || !object.visible) return;
    if (isScaleCue(object)) return;
    if (!object.geometry?.attributes?.position) return;
    object.geometry.computeBoundingBox();
    const box = object.geometry.boundingBox;
    if (!box) return;
    const size = box.getSize(new THREE.Vector3());
    if (!Number.isFinite(size.x) || size.x <= 0) return;
    const determinant = Math.abs(object.matrixWorld.determinant());
    if (!Number.isFinite(determinant) || determinant <= 0) return;
    const volume = size.x * size.y * size.z * determinant;
    const kind = materialKind(object, spec.material);
    const obb = new OBB().fromBox3(box).applyMatrix4(object.matrixWorld);
    obb.halfSize.multiplyScalar(SHRINK);
    const center = box.getCenter(new THREE.Vector3()).applyMatrix4(object.matrixWorld);
    snapshots.push({
      id: snapshots.length,
      label: meshLabel(object, snapshots.length),
      mesh: object,
      obb,
      center,
      radius: obb.halfSize.length(),
      volume,
      massTonnes: (volume * Math.pow(metresPerUnit, 3) * FILL_FACTOR * densityFor(kind)) / 1000,
      kind,
      shell: isShell(object),
      moving: moving.has(object),
    });
  });
  return snapshots;
}

function collisionPairs(snapshots) {
  const pairs = new Set();
  for (let i = 0; i < snapshots.length; i++) {
    const a = snapshots[i];
    if (a.radius < 0.006 || a.shell) continue;
    for (let j = i + 1; j < snapshots.length; j++) {
      const b = snapshots[j];
      if (b.radius < 0.006 || b.shell) continue;
      if (a.moving && b.moving) continue;
      const reach = a.radius + b.radius;
      if (a.center.distanceToSquared(b.center) > reach * reach) continue;
      if (a.obb.intersectsOBB(b.obb, 0.0001)) pairs.add(`${i}:${j}`);
    }
  }
  return pairs;
}

function pairLabels(snapshots, key) {
  const [a, b] = key.split(":").map(Number);
  return [snapshots[a]?.label ?? "mesh", snapshots[b]?.label ?? "mesh"];
}

function convexHull(points) {
  const sorted = points
    .slice()
    .sort((a, b) => (a.x === b.x ? a.z - b.z : a.x - b.x))
    .filter(
      (point, index, array) =>
        index === 0 || point.x !== array[index - 1].x || point.z !== array[index - 1].z,
    );
  if (sorted.length <= 2) return sorted;
  const cross = (o, a, b) => (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
  const lower = [];
  for (const point of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0)
      lower.pop();
    lower.push(point);
  }
  const upper = [];
  for (let index = sorted.length - 1; index >= 0; index--) {
    const point = sorted[index];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0)
      upper.pop();
    upper.push(point);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

function footprint(points) {
  const hull = convexHull(points);
  if (hull.length < 3) return { hull: [], area: 0 };
  let area = 0;
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i];
    const b = hull[(i + 1) % hull.length];
    area += a.x * b.z - b.x * a.z;
  }
  return { hull, area: Math.abs(area) / 2 };
}

function insideHull(x, z, hull) {
  if (hull.length < 3) return false;
  let sign = 0;
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i];
    const b = hull[(i + 1) % hull.length];
    const cross = (b.x - a.x) * (z - a.z) - (b.z - a.z) * (x - a.x);
    if (Math.abs(cross) < 1e-9) continue;
    const current = Math.sign(cross);
    if (sign === 0) sign = current;
    else if (current !== sign) return false;
  }
  return true;
}

function edgeMargin(x, z, hull) {
  if (hull.length < 3) return { inside: false, margin: 0 };
  const inside = insideHull(x, z, hull);
  let minimum = Infinity;
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i];
    const b = hull[(i + 1) % hull.length];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const length = Math.hypot(dx, dz) || 1;
    const distance = Math.abs(dx * (z - a.z) - dz * (x - a.x)) / length;
    minimum = Math.min(minimum, distance);
  }
  return { inside, margin: (inside ? 1 : -1) * minimum };
}

function jointTravel(root, joint) {
  const targets = [];
  for (const target of root.userData?.__citylitRig?.joints?.get(joint.id)?.targets ?? [])
    targets.push(target.getWorldPosition(new THREE.Vector3()));
  if (!targets.length) return 0;
  if (joint.type === "prismatic") return joint.distance ?? 0;
  if (joint.type === "path" && joint.path) {
    const points = joint.path.map(([x, y, z]) => new THREE.Vector3(x, y, z));
    let length = 0;
    for (let i = 1; i < points.length; i++) length += points[i].distanceTo(points[i - 1]);
    return length;
  }
  if (joint.type === "revolute") {
    const range = joint.range ?? [0, Math.PI / 2];
    const radius = Math.max(...targets.map((target) => Math.hypot(target.x, target.z)), 0.001);
    return Math.abs(range[1] - range[0]) * radius;
  }
  return 0;
}

/**
 * Review one assembled landmark.
 * `root` must be the group returned by createProceduralLandmark.
 */
export function analyseLandmark(root, model) {
  const spec = landmarkSpec(model) ?? {
    label: model,
    material: "concrete",
    real: null,
    provenance: "Generic procedural archetype without a published-dimension spec.",
    joints: [],
  };
  const bounds = new THREE.Box3().setFromObject(root);
  const size = bounds.getSize(new THREE.Vector3());
  if (!Number.isFinite(size.x) || size.x <= 0) throw new Error(`Empty landmark: ${model}`);
  const metresPerUnit = spec.real?.width ? spec.real.width / size.x : 1;

  const snapshots = collectSnapshots(root, spec, { metresPerUnit });
  const restPairs = collisionPairs(snapshots);

  let volumeM3 = 0;
  let massTonnes = 0;
  const weighted = new THREE.Vector3();
  for (const entry of snapshots) {
    volumeM3 += entry.volume * Math.pow(metresPerUnit, 3);
    massTonnes += entry.massTonnes;
    weighted.addScaledVector(entry.center, entry.volume);
  }
  const totalVolume = snapshots.reduce((sum, entry) => sum + entry.volume, 0) || 1;
  const centerOfMass = weighted.multiplyScalar(1 / totalVolume);

  // Support footprint: broad, low geometry within 6% of the model's height.
  const height = Math.max(size.y, 0.001);
  const ground = bounds.min.y;
  const supportPoints = [];
  for (const entry of snapshots) {
    const box = new THREE.Box3().setFromObject(entry.mesh);
    if (box.min.y > ground + height * 0.06) continue;
    if (box.max.y > ground + height * 0.3) continue;
    for (const x of [box.min.x, box.max.x])
      for (const z of [box.min.z, box.max.z]) supportPoints.push({ x, z });
  }
  if (supportPoints.length < 3) {
    for (const x of [bounds.min.x, bounds.max.x])
      for (const z of [bounds.min.z, bounds.max.z]) supportPoints.push({ x, z });
  }
  const support = footprint(supportPoints);
  const stability = edgeMargin(centerOfMass.x, centerOfMass.z, support.hull);
  const footprintRadius = Math.max(size.x, size.z) / 2;

  const joints = landmarkJointState(root).map((jointState) => {
    const definition = (spec.joints ?? []).find((joint) => joint.id === jointState.id) ?? {};
    return {
      id: jointState.id,
      label: jointState.label,
      type: jointState.type,
      travelUnits: jointTravel(root, definition),
      travelMetres: jointTravel(root, definition) * metresPerUnit,
    };
  });

  const extremes = [];
  for (const joint of landmarkJointState(root)) {
    const definition = (spec.joints ?? []).find((candidate) => candidate.id === joint.id);
    if (!definition) continue;
    const collisions = [];
    for (const [value, position] of [
      [0, "start"],
      [1, "end"],
    ]) {
      applyLandmarkRig(root, { [joint.id]: value });
      const current = collectSnapshots(root, spec, { metresPerUnit });
      const currentPairs = collisionPairs(current);
      for (const pair of currentPairs) {
        if (!restPairs.has(pair)) {
          const labels = pairLabels(current, pair);
          collisions.push({ position, pair: labels });
        }
      }
      clearLandmarkJoints(root);
    }
    extremes.push({ id: joint.id, label: joint.label, collisions });
  }

  const instanced = [];
  root.traverse((object) => {
    if (!object.isInstancedMesh) return;
    instanced.push({ name: object.name || "instanced", count: object.count });
  });

  let triangles = 0;
  let drawCalls = 0;
  const materials = new Set();
  const textures = new Set();
  const names = [];
  root.traverse((object) => {
    if (!object.isMesh && !object.isPoints) return;
    drawCalls++;
    if (object.name) names.push(object.name);
    const geometry = object.geometry;
    if (geometry) {
      const count = geometry.index
        ? geometry.index.count
        : (geometry.attributes?.position?.count ?? 0);
      triangles += (count / 3) * (object.isInstancedMesh ? object.count : 1);
    }
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (!material) continue;
      materials.add(material);
      for (const key of ["map", "bumpMap", "roughnessMap", "normalMap", "emissiveMap"])
        if (material[key]) textures.add(material[key]);
    }
  });

  return {
    model,
    label: spec.label,
    provenance: spec.provenance,
    material: spec.material,
    real: spec.real,
    metresPerUnit: Number(metresPerUnit.toFixed(3)),
    bounds: {
      width: Number(size.x.toFixed(3)),
      height: Number(size.y.toFixed(3)),
      depth: Number(size.z.toFixed(3)),
    },
    meshes: snapshots.length,
    drawCalls,
    triangles: Math.round(triangles),
    materials: materials.size,
    textures: textures.size,
    instanced,
    namedParts: new Set(names).size,
    volumeM3: Math.round(volumeM3),
    massTonnes: Math.round(massTonnes),
    centerOfMass: {
      x: Number(centerOfMass.x.toFixed(3)),
      y: Number(centerOfMass.y.toFixed(3)),
      z: Number(centerOfMass.z.toFixed(3)),
    },
    support: {
      points: supportPoints.length,
      area: Number(support.area.toFixed(3)),
      stabilityMargin: Number(stability.margin.toFixed(3)),
      inside: stability.inside,
      footprintRadius: Number(footprintRadius.toFixed(3)),
    },
    joints,
    collisions: {
      rest: restPairs.size,
      extremes,
      newAtExtremes: extremes.reduce((sum, entry) => sum + entry.collisions.length, 0),
    },
    stable: stability.inside && support.area > 0 && Number.isFinite(massTonnes) && massTonnes > 0,
  };
}

export function reviewLandmarkCases(cases, builder) {
  return cases.map(({ name, model }) => {
    const root = builder(name, model);
    try {
      return analyseLandmark(root, model);
    } finally {
      root?.traverse?.((object) => {
        object.geometry?.dispose?.();
      });
    }
  });
}
