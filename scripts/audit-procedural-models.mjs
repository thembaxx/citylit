import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");
const [
  pkgText,
  hero,
  showcase,
  stageModel,
  expanded,
  ring,
  safe,
  procedural,
  builders,
  pbr,
  specs,
  rig,
  craft,
  physics,
  stageModels,
] = await Promise.all([
  read("package.json"),
  read("components/MuseumHeroAsset.tsx"),
  read("components/MuseumShowcase.tsx"),
  read("components/StageModel.tsx"),
  read("components/ExpandedLandmark.tsx"),
  read("components/LandmarkRing.tsx"),
  read("components/SafeStageModel.tsx"),
  read("components/ProceduralStageModel.tsx"),
  read("lib/procedural-landmarks.js"),
  read("lib/landmark-pbr.js"),
  read("lib/landmark-specs.js"),
  read("lib/landmark-rig.js"),
  read("lib/landmark-craft.js"),
  read("lib/landmark-physics.js"),
  read("lib/stage-models.ts"),
]);
const pkg = JSON.parse(pkgText);

assert.match(pkg.dependencies?.three ?? "", /^\^0\.187\.0$/);
const packageCommands = Object.values(pkg.scripts ?? {}).join("\n");
assert.doesNotMatch(
  packageCommands,
  /(?:^|[;&|]\s*)(?:pnpm\s+exec\s+)?blender(?:\.exe)?(?:\s|$)/imu,
);
assert.match(pkg.scripts["models:build"], /runtime with Three\.js/);
assert.match(pkg.scripts["hero:build"], /runtime with Three\.js/);

assert.match(hero, /<MuseumShowcase \{\.\.\.props\}\s*\/>/);
assert.doesNotMatch(hero, /useGLTF|GLTFLoader|\.glb|\/draco\//i);
assert.doesNotMatch(stageModel, /useGLTF|GLTFLoader|\.glb|\/draco\//i);
assert.match(stageModel, /ProceduralStageModel/);
assert.match(showcase, /makeMuseumSurfaces/);
assert.match(expanded, /MuseumHeroAsset/);
assert.match(ring, /SafeStageModel/);
assert.match(safe, /ProceduralStageModel/);
assert.match(procedural, /createProceduralLandmark\(name, model\)/);

for (const key of ["table", "union", "stadium", "hole"]) {
  assert.ok(builders.includes(key), `Missing procedural landmark builder key: ${key}`);
}
assert.match(builders, /ponte/i);
assert.match(builders, /citylit-geological-strata-v1/);
assert.match(builders, /domeRibs/);
assert.match(builders, /moses-mabhida-single-signature-arch/);
assert.match(builders, /ponte-city-inner-atrium-wall/);
assert.match(builders, /ponte-city-inner-atrium-gallery-floors/);
assert.match(builders, /ponte-city-external-balcony-lips/);
assert.match(builders, /ponte-city-vertical-concrete-fins/);
assert.match(pbr, /const SIZE = 128;/);
assert.match(pkg.scripts["models:review"], /landmark-review/);
assert.match(pkg.scripts["models:score"], /model-scorecard/);
assert.doesNotMatch(Object.keys(pkg.dependencies ?? {}).join("\n"), /cannon|rapier|ammo|oimo/i);
assert.match(specs, /voortrekker/);
assert.match(specs, /bridge: "nelson-mandela-bridge"/);
assert.match(specs, /provenance/);
assert.match(rig, /export function attachLandmarkRig/);
assert.match(rig, /MathUtils\.damp/);
assert.match(craft, /RoundedBoxGeometry/);
assert.match(craft, /addLandmarkScaleCues/);
assert.match(builders, /function voortrekker\(\)/);
assert.match(builders, /voortrekker-wagon-laager/);
assert.match(builders, /updateLandmarkRig\(display/);
assert.match(builders, /applyLandmarkLod\(display/);
assert.match(stageModels, /return "voortrekker"/);
assert.doesNotMatch(stageModels, /voortrekker\|constitution/);
assert.match(ring, /landmarkJointLabels/);
assert.match(ring, /jointValues/);
assert.match(safe, /jointValues/);
assert.match(procedural, /applyLandmarkRig/);
assert.match(physics, /intersectsOBB/);
assert.match(physics, /newAtExtremes/);

console.log("Three.js-only model pipeline audit passed", {
  three: pkg.dependencies.three,
  museumHero: "procedural MuseumShowcase",
  landmarkStage: "ProceduralStageModel",
  articulation: "declarative specs + revolute/prismatic/path rig",
  physics: "OBB review in Node only",
  blenderBuildCommands: 0,
  museumGLBRequests: 0,
});
