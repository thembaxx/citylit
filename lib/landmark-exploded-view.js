import * as THREE from "three";

const STATE = "__citylitExplodedView";

/**
 * Capture authored component transforms once after the landmark hierarchy is final.
 * The procedural landmark factory wraps its subject in display groups, so inspect
 * the innermost authored assembly and keep directions in its local coordinate space.
 */
export function prepareLandmarkExplodedView(root) {
  if (root.userData[STATE]) return root.userData[STATE];
  root.updateMatrixWorld(true);
  let assemblyRoot = root;
  while (assemblyRoot.children.length === 1 && assemblyRoot.children[0].isGroup) {
    assemblyRoot = assemblyRoot.children[0];
  }
  assemblyRoot.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(assemblyRoot);
  const centre = bounds.isEmpty() ? new THREE.Vector3() : bounds.getCenter(new THREE.Vector3());
  const entries = assemblyRoot.children.map((object, index) => {
    const world = new THREE.Vector3();
    object.getWorldPosition(world);
    const localPosition = assemblyRoot.worldToLocal(world);
    const localCentre = assemblyRoot.worldToLocal(centre.clone());
    const direction = localPosition.sub(localCentre);
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
  const state = { assemblyRoot, entries, centre, progress: 0 };
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
      entry.object.rotateY(entry.phase * eased);
    }
  }
  state.progress = amount;
  state.assemblyRoot.updateMatrixWorld(true);
  root.updateMatrixWorld(true);
  return amount;
}

/** Restores every inspected landmark layer to its captured authored transform. */
export function restoreLandmarkAssembly(root) {
  return setLandmarkExplodedView(root, 0);
}
