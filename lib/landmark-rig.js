// Authored joints for procedural landmarks.
//
// The builders already animate a few parts (cable cars, traffic, winches). This
// layer turns those parts, and a few static ones, into inspectable mechanisms:
// revolute joints, linear joints and parts that follow a path. It deliberately
// stays deterministic: no physics engine, no per-frame allocation in the hot
// loop and no dependency on wall-clock time.
import * as THREE from "three";
import { LANDMARK_SPECS } from "./landmark-specs.js";

const STATE = "__citylitRig";

function pathCurve(points) {
  const vectors = points.map((point) => new THREE.Vector3(...point));
  return vectors.length === 2
    ? new THREE.LineCurve3(vectors[0], vectors[1])
    : new THREE.CatmullRomCurve3(vectors, false, "catmullrom", 0.2);
}

function captureRest(target) {
  return {
    position: target.position.clone(),
    quaternion: target.quaternion.clone(),
    scale: target.scale.clone(),
  };
}

/**
 * Attach declared joints to a freshly built landmark.
 * Safe to call twice: the first attachment wins.
 */
export function attachLandmarkRig(root, model) {
  if (root.userData[STATE]) return root.userData[STATE];
  const spec = LANDMARK_SPECS[model];
  const joints = [];
  for (const joint of spec?.joints ?? []) {
    const names = joint.targets ?? (joint.target ? [joint.target] : []);
    const targets = names
      .map((name) => root.getObjectByName(name))
      .filter((target) => target && target.isObject3D);
    if (!targets.length) continue;
    const axis = new THREE.Vector3(...(joint.axis ?? [0, 1, 0])).normalize();
    const range = joint.type === "revolute" ? (joint.range ?? [0, Math.PI / 2]) : null;
    joints.push({
      id: joint.id,
      label: joint.label ?? joint.id,
      type: joint.type ?? "prismatic",
      damping: joint.damping ?? 6,
      axis,
      distance: joint.distance ?? 1,
      range,
      curve: joint.path ? pathCurve(joint.path) : null,
      scratch: new THREE.Quaternion(),
      targets,
      rest: targets.map(captureRest),
      targetValue: null,
      currentValue: null,
      wasActive: false,
    });
  }
  const state = { model, joints: new Map(joints.map((joint) => [joint.id, joint])) };
  root.userData[STATE] = state;
  return state;
}

function applyJoint(joint, value) {
  const axis = joint.axis;
  if (joint.type === "revolute") {
    const [min, max] = joint.range;
    const angle = min + (max - min) * value;
    joint.scratch.setFromAxisAngle(axis, angle);
    joint.targets.forEach((target, index) => {
      // Rotate in the parent frame so a target's authored rest rotation is preserved.
      target.quaternion.copy(joint.scratch).multiply(joint.rest[index].quaternion);
    });
    return;
  }
  if (joint.type === "path" && joint.curve) {
    joint.targets.forEach((target, index) => {
      const rest = joint.rest[index];
      joint.curve.getPoint(value, target.position);
      target.quaternion.copy(rest.quaternion);
    });
    return;
  }
  joint.targets.forEach((target, index) => {
    const rest = joint.rest[index];
    target.position.copy(rest.position).addScaledVector(axis, joint.distance * value);
    target.quaternion.copy(rest.quaternion);
  });
}

function restoreJoint(joint) {
  joint.targets.forEach((target, index) => {
    const rest = joint.rest[index];
    target.position.copy(rest.position);
    target.quaternion.copy(rest.quaternion);
    target.scale.copy(rest.scale);
  });
}

function clampUnit(value) {
  const number = Number(value);
  return Number.isFinite(number) ? THREE.MathUtils.clamp(number, 0, 1) : null;
}

export function setLandmarkJoint(root, id, value) {
  const joint = root?.userData?.[STATE]?.joints?.get(id);
  if (!joint) return false;
  const next = clampUnit(value);
  if (next === null) return false;
  joint.targetValue = next;
  if (joint.currentValue === null) joint.currentValue = next;
  return true;
}

/** Return a joint to its authored animation rather than the rig override. */
export function clearLandmarkJoint(root, id) {
  const joint = root?.userData?.[STATE]?.joints?.get(id);
  if (!joint) return false;
  joint.targetValue = null;
  if (joint.wasActive) {
    restoreJoint(joint);
    joint.wasActive = false;
  }
  joint.currentValue = null;
  return true;
}

export function clearLandmarkJoints(root) {
  const state = root?.userData?.[STATE];
  if (!state) return;
  for (const joint of state.joints.values()) {
    joint.targetValue = null;
    if (joint.wasActive) restoreJoint(joint);
    joint.wasActive = false;
    joint.currentValue = null;
  }
}

/**
 * Advance all rig values and reapply overrides after the builder's own tick.
 * Returns true when a transform changed, so demand rendering can invalidate.
 */
export function updateLandmarkRig(root, delta) {
  const state = root?.userData?.[STATE];
  if (!state) return false;
  let changed = false;
  const step = Math.min(Math.max(delta, 0), 0.1);
  for (const joint of state.joints.values()) {
    if (joint.targetValue === null) {
      if (joint.wasActive) {
        restoreJoint(joint);
        joint.wasActive = false;
        joint.currentValue = null;
        changed = true;
      }
      continue;
    }
    const next =
      joint.currentValue === null
        ? joint.targetValue
        : THREE.MathUtils.damp(joint.currentValue, joint.targetValue, joint.damping, step);
    const settled = Math.abs(next - joint.targetValue) < 0.0005;
    joint.currentValue = settled ? joint.targetValue : next;
    applyJoint(joint, joint.currentValue);
    joint.wasActive = true;
    changed = true;
  }
  if (changed) root.updateMatrixWorld(true);
  return changed;
}

/** Apply values immediately (reduced motion, tests, scorecard sampling). */
export function applyLandmarkRig(root, values = {}) {
  const state = root?.userData?.[STATE];
  if (!state) return false;
  for (const [id, value] of Object.entries(values)) {
    const joint = state.joints.get(id);
    if (!joint) continue;
    const next = clampUnit(value);
    if (next === null) continue;
    joint.targetValue = next;
    joint.currentValue = next;
    applyJoint(joint, next);
    joint.wasActive = true;
  }
  root.updateMatrixWorld(true);
  return true;
}

export function landmarkJointState(root) {
  const state = root?.userData?.[STATE];
  if (!state) return [];
  return [...state.joints.values()].map((joint) => ({
    id: joint.id,
    label: joint.label,
    type: joint.type,
    value: joint.currentValue,
    target: joint.targetValue,
    active: joint.wasActive,
  }));
}

export function hasLandmarkRig(root) {
  return Boolean(root?.userData?.[STATE]?.joints?.size);
}
