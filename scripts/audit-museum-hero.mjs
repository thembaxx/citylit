import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { NodeIO } from "@gltf-transform/core";
import { KHRDracoMeshCompression } from "@gltf-transform/extensions";
import draco from "draco3d";

const file = new URL("../public/models/hero/mcgregor-museum.glb", import.meta.url);
const raw = await readFile(file);
const meta = JSON.parse(
  await readFile(new URL("../public/models/hero/manifest.json", import.meta.url), "utf8"),
);
assert.equal(raw.toString("utf8", 0, 4), "glTF");
assert.equal(raw.readUInt32LE(4), 2);
assert.equal(meta.bytes, raw.byteLength);
assert.equal(meta.id, "mcgregor-museum");
// Do not impose a fixed transfer cap; keep independent glTF and materials checks.
const json = JSON.parse(raw.toString("utf8", 20, 20 + raw.readUInt32LE(12)));
assert.ok(json.extensionsRequired.includes("KHR_draco_mesh_compression"));
assert.ok(json.images?.length >= 8, "Expected actual embedded PBR textures");
assert.ok(
  json.images.every((image) => !image.uri),
  "No external runtime texture URLs",
);
const nodeNames = new Set(json.nodes.map((node) => node.name));
for (const name of ["MuseumFacade", "MuseumRoof", "MuseumGlass", "MuseumLandscape"]) {
  assert.ok(nodeNames.has(name), "Missing animated architectural layer: " + name);
}
const io = new NodeIO().registerExtensions([KHRDracoMeshCompression]).registerDependencies({
  "draco3d.decoder": await draco.createDecoderModule(),
});
const document = await io.readBinary(raw);
const vertices = document
  .getRoot()
  .listMeshes()
  .flatMap((mesh) => mesh.listPrimitives())
  .reduce((sum, prim) => sum + (prim.getAttribute("POSITION")?.getCount() || 0), 0);
assert.ok(vertices > 2000, "Hero is still unexpectedly primitive");
assert.ok(document.getRoot().listMaterials().length >= 10);
console.log("Heritage hero audited", {
  bytes: raw.length,
  textures: json.images.length,
  vertices,
  materialCount: document.getRoot().listMaterials().length,
  interactiveLayers: 4,
});
