import assert from "node:assert/strict";
import { writeFile, mkdir } from "node:fs/promises";
import { NodeIO } from "@gltf-transform/core";
import { KHRDracoMeshCompression } from "@gltf-transform/extensions";
import draco from "draco3d";

const dir = new URL("../public/models/hero/", import.meta.url);
const source = new URL("mcgregor-museum.glb", dir);
await mkdir(dir, { recursive: true });
const io = new NodeIO().registerExtensions([KHRDracoMeshCompression]).registerDependencies({
  "draco3d.encoder": await draco.createEncoderModule(),
  "draco3d.decoder": await draco.createDecoderModule(),
});
const document = await io.read(source.pathname);
const requiredNodes = ["MuseumFacade", "MuseumRoof", "MuseumGlass", "MuseumLandscape"];
for (const name of requiredNodes) {
  assert.ok(
    document
      .getRoot()
      .listNodes()
      .some((node) => node.getName() === name),
    name,
  );
}
assert.ok(document.getRoot().listTextures().length >= 8, "Missing image-based PBR maps");
document.createExtension(KHRDracoMeshCompression).setRequired(true).setEncoderOptions({
  method: "edgebreaker",
  encodeSpeed: 5,
  decodeSpeed: 5,
});
const compressed = await io.writeBinary(document);
console.log(
  "Compressed museum hero:",
  compressed.length,
  "bytes; textures:",
  document.getRoot().listTextures().length,
);
// Decode and inspect the hero regardless of file size; geometry fidelity is the priority.
const verified = await io.readBinary(compressed);
assert.ok(verified.getRoot().listMeshes().length > 3, "No compressed architecture meshes");
await writeFile(source, compressed);
const meta = {
  id: "mcgregor-museum",
  src: "/models/hero/mcgregor-museum.glb",
  bytes: compressed.length,
  compression: "KHR_draco_mesh_compression",
  textures: verified.getRoot().listTextures().length,
  modeling: "Original historic architecture study, not a measured reconstruction",
  materialSource: "ambientCG CC0 Bricks090, PavingStones128, Grass004, Wood096",
};
await writeFile(new URL("manifest.json", dir), JSON.stringify(meta, null, 2) + "\n");
console.log("Museum hero:", meta);
