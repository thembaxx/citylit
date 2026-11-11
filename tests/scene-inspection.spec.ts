import { expect, test } from '@playwright/test';
import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import {
  createSceneInspectionController,
  sceneTimelineProgress,
} from '../lib/scene-inspection';

test('scene inspection provides reversible deterministic component separation', () => {
  const root = new Group();
  const facade = new Mesh(new BoxGeometry(1, 2, 0.2), new MeshStandardMaterial());
  const wing = new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial());
  facade.position.x = -1;
  wing.position.x = 1;
  root.add(facade, wing);
  const original = facade.position.clone();
  const inspection = createSceneInspectionController(root, { gap: 0.25 });

  inspection.setProgress(0.5);
  expect(facade.position.distanceTo(original)).toBeGreaterThan(0);
  inspection.setProgress(1);
  const final = facade.position.clone();
  inspection.setProgress(1);
  expect(facade.position.toArray()).toEqual(final.toArray());
  inspection.dispose();
  expect(facade.position.toArray()).toEqual(original.toArray());
});

test('timeline seeking clamps to its deterministic bounds', () => {
  expect(sceneTimelineProgress(250, 1000)).toBe(0.25);
  expect(sceneTimelineProgress(-1, 1000)).toBe(0);
  expect(sceneTimelineProgress(1001, 1000)).toBe(1);
});
