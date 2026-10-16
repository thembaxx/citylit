import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { NodeIO } from "@gltf-transform/core";
import { KHRDracoMeshCompression } from "@gltf-transform/extensions";
import draco from "draco3d";
const root = new URL("../public/models/stage/", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("manifest.json", root), "utf8"));
const io = new NodeIO()
  .registerExtensions([KHRDracoMeshCompression])
  .registerDependencies({ "draco3d.decoder": await draco.createDecoderModule() });
assert.equal(manifest.length, 15);
for (const entry of manifest) {
  assert.match(entry.src, /^\/models\/stage\/[a-z-]+\.glb$/);
  const raw = await readFile(new URL(`${entry.id}.glb`, root));
  assert.equal(raw.toString("utf8", 0, 4), "glTF");
  assert.equal(raw.readUInt32LE(4), 2);
  assert.equal(raw.length, entry.bytes);
  assert.ok(raw.length < 150 * 1024);
  const json = JSON.parse(raw.toString("utf8", 20, 20 + raw.readUInt32LE(12)));
  assert.ok(json.extensionsRequired.includes("KHR_draco_mesh_compression"));
  const document = await io.readBinary(raw);
  assert.ok(
    document
      .getRoot()
      .listMeshes()
      .some((mesh) =>
        mesh
          .listPrimitives()
          .some((primitive) => primitive.getAttribute("POSITION")?.getCount() > 20),
      ),
  );
}
console.log(
  `${manifest.length} Draco-compressed Blender assets decoded; size and metadata checks passed.`,
);
