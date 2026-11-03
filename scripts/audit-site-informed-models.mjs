import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { NodeIO } from "@gltf-transform/core";
import { KHRDracoMeshCompression } from "@gltf-transform/extensions";
import draco from "draco3d";

const base = new URL("../public/models/stage/", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("manifest.json", base), "utf8"));
const originals = new Map(manifest.map((m) => [m.id, m]));
const originalFive = ["ponte", "stadium", "union-buildings", "table-mountain", "hole"];
const remainingTen = [
  "bridge",
  "lighthouse",
  "park",
  "dome",
  "tower",
  "arch",
  "fort",
  "bo-kaap",
  "cooling-towers",
  "aquarium",
];
const required = [...originalFive, ...remainingTen];
const io = new NodeIO().registerExtensions([KHRDracoMeshCompression]).registerDependencies({
  "draco3d.decoder": await draco.createDecoderModule(),
});
let total = 0;
for (const id of required) {
  const metadata = originals.get(id);
  assert.ok(metadata, id + " has no manifest entry");
  assert.equal(
    metadata.geometryTier,
    originalFive.includes(id) ? "site-informed-sculpt-v1" : "distinct-sculpt-v2",
    id + " has the wrong sculpt revision",
  );
  assert.ok(metadata.textureCount >= 3, id + " is missing PBR maps");
  const raw = await readFile(new URL(id + ".glb", base));
  assert.equal(raw.subarray(0, 4).toString(), "glTF");
  assert.equal(metadata.bytes, raw.length, id + " manifest length mismatch");
  assert.ok(raw.length < 2 * 1024 * 1024, id + " exceeds 2 MiB budget");
  const doc = await io.readBinary(raw);
  const meshCount = doc.getRoot().listMeshes().length;
  const positions = doc
    .getRoot()
    .listMeshes()
    .flatMap((mesh) => mesh.listPrimitives())
    .reduce((n, primitive) => n + (primitive.getAttribute("POSITION")?.getCount() || 0), 0);
  assert.ok(positions >= 700, id + " geometry appears primitive");
  assert.ok(meshCount > 0, id + " lacks decoded geometry");
  assert.ok(
    doc.getRoot().listMaterials().length >= 4,
    id + " has insufficient material differentiation",
  );
  if (id === "bo-kaap" || id === "cooling-towers") {
    const painted = doc
      .getRoot()
      .listMaterials()
      .filter((mat) => mat.getName().startsWith("Sculpt painted"));
    const uniqueTints = new Set(
      painted.map((mat) => JSON.stringify(mat.getBaseColorFactor().slice(0, 3))),
    );
    assert.ok(
      uniqueTints.size >= (id === "bo-kaap" ? 5 : 2),
      id + " is missing its independent, locally embedded paint colours",
    );
    assert.ok(
      painted.every((mat) => mat.getBaseColorFactor().some((value) => value < 0.92)),
      id + " has lost the authored paint tint",
    );
  }
  total += raw.length;
  console.log(
    id +
      ": " +
      positions +
      " decoded vertices, " +
      doc.getRoot().listMaterials().length +
      " materials, " +
      Math.round(raw.length / 1024) +
      " KiB",
  );
}
assert.ok(total < 22 * 1024 * 1024, "Fifteen-model catalog exceeds 22 MiB");
console.log("Validated all 15 original editorial sculpts across two authoring tiers");
