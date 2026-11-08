// Structural review of the procedural landmark catalogue.
//
// Run: pnpm models:review
//      pnpm models:review -- --json artifacts/landmark-review.json
//      pnpm models:review -- --strict
//
// The bridge builder draws a window texture, so Node gets a no-op canvas shim.
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { analyseLandmark } from "../lib/landmark-physics.js";
import { buildCase, CASES, releaseCase } from "./landmark-cases.mjs";

const args = process.argv.slice(2);
const jsonIndex = args.indexOf("--json");
const jsonPath = jsonIndex >= 0 ? args[jsonIndex + 1] : null;
const strict = args.includes("--strict");

const results = [];
for (const item of CASES) {
  const root = buildCase(item);
  try {
    results.push(analyseLandmark(root, item.model));
  } finally {
    releaseCase(root);
  }
}

const rows = results.map((result) => ({
  model: result.model,
  label: result.label,
  meshes: result.meshes,
  drawCalls: result.drawCalls,
  triangles: result.triangles,
  joints: result.joints.length,
  massMt: result.massTonnes,
  stable: result.stable ? "yes" : "no",
  stability: result.support.stabilityMargin,
  collisions: result.collisions.newAtExtremes,
}));

console.table(rows);

const warnings = results.filter((result) => !result.stable || result.collisions.newAtExtremes > 0);
for (const result of warnings) {
  console.warn(`\n${result.model}:`);
  if (!result.stable)
    console.warn(
      `  stability: CoM ${result.support.inside ? "inside" : "outside"} footprint, margin ${result.support.stabilityMargin}, area ${result.support.area}`,
    );
  for (const extreme of result.collisions.extremes) {
    for (const collision of extreme.collisions) {
      console.warn(`  ${extreme.label} (${collision.position}) → ${collision.pair.join(" ↔ ")}`);
    }
  }
}

const payload = {
  generatedAt: new Date().toISOString(),
  cases: results,
  summary: {
    models: results.length,
    stable: results.filter((result) => result.stable).length,
    newCollisions: results.reduce((sum, result) => sum + result.collisions.newAtExtremes, 0),
    triangles: results.reduce((sum, result) => sum + result.triangles, 0),
    drawCalls: results.reduce((sum, result) => sum + result.drawCalls, 0),
  },
};

if (jsonPath) {
  await mkdir(dirname(jsonPath), { recursive: true });
  await writeFile(jsonPath, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`\nWrote ${jsonPath}`);
}

if (strict && warnings.length) process.exitCode = 1;
