import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");
const [pkgText, hero, showcase, expanded, ring, safe, procedural, builders] = await Promise.all([
  read("package.json"),
  read("components/MuseumHeroAsset.tsx"),
  read("components/MuseumShowcase.tsx"),
  read("components/ExpandedLandmark.tsx"),
  read("components/LandmarkRing.tsx"),
  read("components/SafeStageModel.tsx"),
  read("components/ProceduralStageModel.tsx"),
  read("lib/procedural-landmarks.js"),
]);
const pkg = JSON.parse(pkgText);

assert.match(pkg.dependencies?.three ?? "", /^\^0\.187\.0$/);
assert.doesNotMatch(JSON.stringify(pkg.scripts), /\bblender\b|\.py\b/iu);
assert.match(pkg.scripts["models:build"], /runtime with Three\.js/);
assert.match(pkg.scripts["hero:build"], /runtime with Three\.js/);

assert.match(hero, /<MuseumShowcase \.\.\.props\s*\/>/);
assert.doesNotMatch(hero, /useGLTF|GLTFLoader|\.glb|\/draco\//i);
assert.match(showcase, /makeMuseumSurfaces/);
assert.match(expanded, /MuseumHeroAsset/);
assert.match(ring, /SafeStageModel/);
assert.match(safe, /ProceduralStageModel/);
assert.match(procedural, /createProceduralLandmark\(name, model\)/);

for (const key of ["table", "union", "stadium", "hole"]) {
  assert.ok(builders.includes(key), `Missing procedural landmark builder key: ${key}`);
}
assert.match(builders, /ponte/i);

console.log("Three.js-only model pipeline audit passed", {
  three: pkg.dependencies.three,
  museumHero: "procedural MuseumShowcase",
  landmarkStage: "ProceduralStageModel",
  blenderBuildCommands: 0,
  museumGLBRequests: 0,
});
