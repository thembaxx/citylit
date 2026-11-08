import assert from "node:assert/strict";
import test from "node:test";
import { buildCase, CASES, releaseCase } from "../landmark-cases.mjs";
import { landmarkSpec } from "../../lib/landmark-specs.js";
import {
  clearLandmarkJoint,
  landmarkJointState,
  setLandmarkJoint,
  updateLandmarkRig,
} from "../../lib/landmark-rig.js";
import { analyseLandmark } from "../../lib/landmark-physics.js";
import { MOBILE_LANDMARK_BUDGET } from "../../lib/landmark-budget.js";

test("every named spec has a review case and attaches its declared joints", () => {
  const labels = new Set(CASES.map((item) => landmarkSpec(item.model)?.label));
  for (const item of CASES) {
    const spec = landmarkSpec(item.model);
    const root = buildCase(item);
    try {
      const joints = landmarkJointState(root);
      if (!spec) {
        assert.equal(joints.length, 0, `${item.model} has a rig but no spec`);
        continue;
      }
      assert.ok(labels.has(spec.label), `Missing review case for ${spec.label}`);
      assert.equal(joints.length, spec.joints.length, `${item.model} joint count`);
      for (const definition of spec.joints) {
        const joint = joints.find((candidate) => candidate.id === definition.id);
        assert.ok(joint, `${item.model} missing joint ${definition.id}`);
        assert.equal(joint.type, definition.type);
      }
    } finally {
      releaseCase(root);
    }
  }
});

test("joint overrides settle and clear back to authored motion", () => {
  const root = buildCase({ name: "Union Buildings", model: "union-buildings" });
  try {
    const joint = landmarkJointState(root).find((candidate) => candidate.id === "wing-east");
    assert.ok(joint);
    const wing = root.getObjectByName("union-buildings-east-wing");
    assert.ok(wing);
    const rest = wing.position.clone();
    assert.equal(setLandmarkJoint(root, "wing-east", 1), true);
    updateLandmarkRig(root, 0);
    assert.ok(wing.position.distanceTo(rest) > 0.1);
    assert.equal(clearLandmarkJoint(root, "wing-east"), true);
    assert.ok(wing.position.distanceTo(rest) < 1e-9);
    assert.equal(landmarkJointState(root).find((entry) => entry.id === "wing-east").value, null);
  } finally {
    releaseCase(root);
  }
});

test("named models stay stable and clear at joint extremes", () => {
  for (const item of CASES) {
    const root = buildCase(item);
    try {
      const report = analyseLandmark(root, item.model);
      assert.ok(report.stable, `${report.label} is outside its support footprint`);
      assert.equal(
        report.collisions.newAtExtremes,
        0,
        `${report.label} introduces ${report.collisions.newAtExtremes} collision(s) at joint extremes`,
      );
      assert.ok(report.massTonnes > 0, `${report.label} has no mass estimate`);
      assert.ok(
        report.triangles <= MOBILE_LANDMARK_BUDGET.triangles,
        `${report.label} exceeds the triangle budget`,
      );
      assert.ok(
        report.drawCalls <= MOBILE_LANDMARK_BUDGET.drawCalls,
        `${report.label} exceeds the draw-call budget`,
      );
    } finally {
      releaseCase(root);
    }
  }
});
