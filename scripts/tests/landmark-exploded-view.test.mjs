import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { prepareLandmarkExplodedView, setLandmarkExplodedView, restoreLandmarkAssembly } from "../../lib/landmark-exploded-view.js";

test("landmark exploded view separates parts and restores authored transforms", () => {
  const root = new THREE.Group();
  const first = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial());
  const second = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial());
  first.position.set(-1, 0, 0);
  second.position.set(1, 0, 0);
  root.add(first, second);
  const originalFirst = first.position.clone();
  const originalSecond = second.position.clone();
  prepareLandmarkExplodedView(root);
  assert.equal(setLandmarkExplodedView(root, 1), 1);
  assert.ok(first.position.distanceTo(originalFirst) > 0.1);
  assert.ok(second.position.distanceTo(originalSecond) > 0.1);
  restoreLandmarkAssembly(root);
  assert.ok(first.position.distanceTo(originalFirst) < 1e-8);
  assert.ok(second.position.distanceTo(originalSecond) < 1e-8);
});

test("landmark inspection clamps invalid progress and is deterministic", () => {
  const root = new THREE.Group();
  root.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial()));
  prepareLandmarkExplodedView(root);
  assert.equal(setLandmarkExplodedView(root, Number.NaN), 0);
  setLandmarkExplodedView(root, 0.5);
  const first = root.children[0].position.clone();
  setLandmarkExplodedView(root, 0.5);
  assert.ok(root.children[0].position.distanceTo(first) < 1e-8);
});

test("landmark inspection resolves the inner subject beneath its display wrapper", () => {
  const display = new THREE.Group();
  const subject = new THREE.Group();
  const geometryRoot = new THREE.Group();
  const tower = new THREE.Group();
  const podium = new THREE.Group();
  tower.position.set(0, 2, 0);
  podium.position.set(1, 0, 0);
  geometryRoot.add(tower, podium);
  subject.add(geometryRoot);
  display.add(subject);
  prepareLandmarkExplodedView(display);
  setLandmarkExplodedView(display, 1);
  assert.ok(tower.position.distanceTo(new THREE.Vector3(0, 2, 0)) > 0.1);
  assert.ok(podium.position.distanceTo(new THREE.Vector3(1, 0, 0)) > 0.1);
  restoreLandmarkAssembly(display);
  assert.ok(tower.position.distanceTo(new THREE.Vector3(0, 2, 0)) < 1e-8);
  assert.ok(podium.position.distanceTo(new THREE.Vector3(1, 0, 0)) < 1e-8);
});
