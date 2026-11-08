// Model scorecard: craft, geometry, materials, physics and articulation.
//
// Run: pnpm models:score
//      pnpm models:score -- --write
//      pnpm models:score -- --strict
//
// Scores are comparative design signals, not photoreal fidelity claims.
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { LANDMARK_SPECS, landmarkSpec } from "../lib/landmark-specs.js";
import { MOBILE_LANDMARK_BUDGET, profileLandmark } from "../lib/landmark-budget.js";
import { analyseLandmark } from "../lib/landmark-physics.js";
import { buildCase, CASES, releaseCase } from "./landmark-cases.mjs";

const args = process.argv.slice(2);
const write = args.includes("--write");
const strict = args.includes("--strict");
const stamp = new Date().toISOString().slice(0, 10);

function craftStats(root) {
  const colors = new Set();
  let chamfered = 0;
  let cues = 0;
  let pbr = 0;
  let emissive = 0;
  root.traverse((object) => {
    if (object.userData?.chamfered) chamfered++;
    if (object.userData?.scaleCue) cues++;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!material) continue;
      if (material.name?.startsWith("landmark-pbr-")) pbr++;
      if ((material.emissiveIntensity ?? 0) > 0) emissive++;
      if (material.color) colors.add(material.color.getHexString());
    }
  });
  return { chamfered, cues, pbr, emissive, colors: colors.size };
}

function scoreModel({ physics, profile, craft, spec, model }) {
  const checks = [];
  const add = (axis, label, earned, possible) => {
    const value = Math.max(0, Math.min(possible, Math.round(earned)));
    checks.push({ axis, label, earned: value, possible });
  };

  add(
    "craft",
    "Chamfered edges",
    craft.chamfered >= 20 ? 8 : craft.chamfered >= 5 ? 6 : craft.chamfered >= 1 ? 3 : 0,
    8,
  );
  add("craft", "Human-scale cues", craft.cues >= 2 ? 8 : craft.cues >= 1 ? 4 : 0, 8);
  add("craft", "Named parts", physics.namedParts >= 8 ? 5 : physics.namedParts >= 3 ? 3 : 0, 5);
  add("craft", "Material differentiation", craft.colors >= 4 ? 4 : craft.colors >= 2 ? 2 : 0, 4);

  add(
    "geometry",
    "Triangle budget",
    physics.triangles <= 120000
      ? 12
      : physics.triangles <= 250000
        ? 8
        : physics.triangles <= MOBILE_LANDMARK_BUDGET.triangles
          ? 4
          : 0,
    12,
  );
  add(
    "geometry",
    "Draw-call budget",
    profile.drawCalls <= 120
      ? 8
      : profile.drawCalls <= 250
        ? 5
        : profile.drawCalls <= MOBILE_LANDMARK_BUDGET.drawCalls
          ? 2
          : 0,
    8,
  );
  add("geometry", "Instanced detail", physics.instanced.length > 0 ? 5 : 0, 5);

  add(
    "materials",
    "Texture budget",
    profile.textureBytes <= MOBILE_LANDMARK_BUDGET.textureBytes ? 5 : 0,
    5,
  );
  add("materials", "PBR surfaces", craft.pbr > 2 ? 5 : craft.pbr > 0 ? 3 : 0, 5);
  add("materials", "Night lighting", craft.emissive >= 3 ? 5 : craft.emissive >= 1 ? 2 : 0, 5);

  add("physics", "Stable support", physics.stable ? 8 : 0, 8);
  add(
    "physics",
    "Joint clearances",
    physics.collisions.newAtExtremes === 0
      ? 8
      : Math.max(0, 8 - physics.collisions.newAtExtremes * 2),
    8,
  );
  add(
    "physics",
    "Support margin",
    physics.support.stabilityMargin >= 0.05 ? 4 : physics.support.stabilityMargin > 0 ? 2 : 0,
    4,
  );

  add("articulation", "Named spec", spec ? 5 : 0, 5);
  const declared = spec?.joints ?? [];
  if (declared.length) {
    add(
      "articulation",
      "Declared joints attached",
      (physics.joints.length / declared.length) * 4,
      4,
    );
    add(
      "articulation",
      "Joint travel",
      (physics.joints.filter((joint) => joint.travelUnits > 0).length / declared.length) * 6,
      6,
    );
  } else {
    add("articulation", "Static monument (no joints declared)", 10, 10);
  }

  const axes = {};
  for (const check of checks) {
    axes[check.axis] ??= { earned: 0, possible: 0 };
    axes[check.axis].earned += check.earned;
    axes[check.axis].possible += check.possible;
  }
  const total = Object.values(axes).reduce((sum, axis) => sum + axis.earned, 0);
  const possible = Object.values(axes).reduce((sum, axis) => sum + axis.possible, 0);
  return {
    model,
    total,
    possible,
    percent: Math.round((total / possible) * 100),
    grade: total >= 90 ? "A" : total >= 80 ? "B" : total >= 70 ? "C" : "D",
    axes,
    checks,
  };
}

const results = [];
for (const item of CASES) {
  const root = buildCase(item);
  try {
    const physics = analyseLandmark(root, item.model);
    const profile = profileLandmark(root);
    const craft = craftStats(root);
    const spec = landmarkSpec(item.model);
    results.push({
      physics,
      profile,
      craft,
      spec,
      model: item.model,
      score: scoreModel({ physics, profile, craft, spec, model: item.model }),
    });
  } finally {
    releaseCase(root);
  }
}

const coveredLabels = new Set(results.map((entry) => entry.physics.label));
const missingSpecs = Object.values(LANDMARK_SPECS)
  .filter((spec) => !coveredLabels.has(spec.label))
  .map((spec) => spec.label);

const rows = results.map(({ physics, profile, score }) => ({
  model: physics.model,
  label: physics.label,
  score: score.percent,
  grade: score.grade,
  craft: `${score.axes.craft?.earned ?? 0}/25`,
  geometry: `${score.axes.geometry?.earned ?? 0}/25`,
  materials: `${score.axes.materials?.earned ?? 0}/15`,
  physics: `${score.axes.physics?.earned ?? 0}/20`,
  articulation: `${score.axes.articulation?.earned ?? 0}/15`,
  triangles: physics.triangles,
  drawCalls: profile.drawCalls,
  massMt: physics.massTonnes,
  stable: physics.stable ? "yes" : "no",
  collisions: physics.collisions.newAtExtremes,
}));

console.table(rows);

const average = Math.round(
  results.reduce((sum, entry) => sum + entry.score.percent, 0) / results.length,
);

const markdown = [
  "# Procedural landmark scorecard",
  "",
  `Generated ${stamp}. Comparative design signal, not a fidelity survey.`,
  "",
  `Average **${average}%** · ${results.length} models · ${missingSpecs.length} specs without a case.`,
  "",
  "| Model | Score | Craft | Geometry | Materials | Physics | Articulation | Tris | Draws | Mass (t) | Stable | New collisions |",
  "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | :---: | ---: |",
  ...results.map(({ physics, profile, score }) => {
    const axis = (name) => `${score.axes[name]?.earned ?? 0}/${score.axes[name]?.possible ?? 0}`;
    return `| ${physics.label} | **${score.percent}%** ${score.grade} | ${axis("craft")} | ${axis("geometry")} | ${axis("materials")} | ${axis("physics")} | ${axis("articulation")} | ${physics.triangles.toLocaleString("en-US")} | ${profile.drawCalls} | ${physics.massTonnes.toLocaleString("en-US")} | ${physics.stable ? "yes" : "no"} | ${physics.collisions.newAtExtremes} |`;
  }),
  "",
  "## Weakest checks",
  "",
  ...results
    .flatMap(({ physics, score }) =>
      score.checks
        .filter((check) => check.earned < check.possible)
        .map((check) => ({ model: physics.label, ...check })),
    )
    .sort((a, b) => a.earned / a.possible - b.earned / b.possible)
    .slice(0, 18)
    .map(
      (check) =>
        `- **${check.model}** · ${check.axis}: ${check.label} — ${check.earned}/${check.possible}`,
    ),
  missingSpecs.length ? "" : null,
  missingSpecs.length ? "## Specs without a review case" : null,
  missingSpecs.length ? "" : null,
  ...missingSpecs.map((label) => `- ${label}`),
  "",
].filter((line) => line !== null);

const json = {
  generatedAt: new Date().toISOString(),
  average,
  missingSpecs,
  cases: results.map(({ physics, profile, craft, score }) => ({
    model: physics.model,
    label: physics.label,
    score,
    profile,
    craft,
    physics,
  })),
};

if (write) {
  const mdPath = "docs/procedural-model-scorecard.md";
  const jsonPath = "docs/procedural-model-scorecard.json";
  await mkdir(dirname(mdPath), { recursive: true });
  await writeFile(mdPath, `${markdown.join("\n")}\n`);
  await mkdir(dirname(jsonPath), { recursive: true });
  await writeFile(jsonPath, `${JSON.stringify(json, null, 2)}\n`);
  console.log(`\nWrote ${mdPath} and ${jsonPath}`);
} else {
  console.log(`\nAverage ${average}%`);
  if (missingSpecs.length) console.warn(`Specs without a case: ${missingSpecs.join(", ")}`);
}

const failing = results.filter(({ score }) => score.percent < 70);
if (strict && (failing.length || missingSpecs.length)) {
  if (failing.length)
    console.warn(`\nBelow 70%: ${failing.map((entry) => entry.physics.label).join(", ")}`);
  process.exitCode = 1;
}
