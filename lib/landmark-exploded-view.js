import * as THREE from "three";

const STATE = "__citylitExplodedView";

/**
 * Capture the authored direct-child transforms once. Landmark builders can keep
 * their existing procedural hierarchy; this controller never reparents geometry.
 */
export function prepareLandmarkExplodedView(root) {
  if (root.userData[STATE]) return root.userData[STATE];
  root.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(root);
  const centre = bounds.isEmpty() ? new THREE.Vector3() : bounds.getCenter(new THREE.Vector3());
  const entries = root.children.map((object, index) => {
    const world = new THREE.Vector3();
    object.getWorldPosition(world);
    const direction = world.sub(centre);
    if (direction.lengthSq() < 1e-8) {
      const angle = index * 2.399963229728653;
      direction.set(Math.cos(angle), 0.35 + (index % 3) * 0.12, Math.sin(angle));
    }
    direction.normalize();
    return {
      object,
      position: object.position.clone(),
      quaternion: object.quaternion.clone(),
      direction,
      phase: (index % 5) * 0.08,
    };
  });
  const state = { entries, centre, progress: 0 };
  root.userData[STATE] = state;
  return state;
}

/** progress=0 restores the authored model; progress=1 separates structural layers. */
export function setLandmarkExplodedView(root, progress, distance = 1.35) {
  const state = prepareLandmarkExplodedView(root);
  const amount = THREE.MathUtils.clamp(Number.isFinite(progress) ? progress : 0, 0, 1);
  const eased = amount * amount * (3 - 2 * amount);
  const safeDistance = THREE.MathUtils.clamp(Number.isFinite(distance) ? distance : 1.35, 0, 8);
  for (const entry of state.entries) {
    const offset = safeDistance * eased * (0.55 + entry.phase);
    entry.object.position.copy(entry.position).addScaledVector(entry.direction, offset);
    entry.object.quaternion.copy(entry.quaternion);
    if (amount > 0) {
      const spin = entry.phase * eased;
      entry.object.rotateY(spin);
    }
  }
  state.progress = amount;
  root.updateMatrixWorld(true);
  return amount;
}

export function restoreLandmarkAssembly(root) {
  return setLandmarkExplodedView(root, 0);
}
