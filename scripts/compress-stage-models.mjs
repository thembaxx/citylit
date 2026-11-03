import { readFile, writeFile } from "node:fs/promises";
import { NodeIO } from "@gltf-transform/core";
import { KHRDracoMeshCompression } from "@gltf-transform/extensions";
import draco from "draco3d";
const root = new URL("../public/models/stage/", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("manifest.json", root), "utf8"));
const io = new NodeIO().registerExtensions([KHRDracoMeshCompression]).registerDependencies({
  "draco3d.encoder": await draco.createEncoderModule(),
  "draco3d.decoder": await draco.createDecoderModule(),
});
for (const item of manifest) {
  if (!/^[a-z-]+$/.test(item.id)) throw new Error("Invalid model identifier.");
  const file = new URL(`${item.id}.glb`, root);
  const document = await io.read(file.pathname);
  document
    .createExtension(KHRDracoMeshCompression)
    .setRequired(true)
    .setEncoderOptions({ method: "edgebreaker", encodeSpeed: 5, decodeSpeed: 5 });
  // Blender's glTF exporter can omit the colour multiplier when the base
  // image is passed through a MixRGB node. Write the authored tint directly
  // into glTF's baseColorFactor so textured architecture never renders white.
  const tintByName = {
    "Warm limestone": [0.78, 0.67, 0.57],
    "Pale stone": [0.89, 0.81, 0.70],
    "Porous warm plaster": [0.91, 0.78, 0.65],
    "Cut sandstone highlights": [0.96, 0.85, 0.68],
    "Weathered earth brick": [0.74, 0.40, 0.29],
    "Dark oiled timber": [0.53, 0.34, 0.23],
    "Natural muted lawn": [0.53, 0.72, 0.41],
    "Foliage": [0.43, 0.67, 0.36],
    "Leaf canopy variations": [0.37, 0.61, 0.35],
    "Paving and mortar": [0.85, 0.78, 0.67],
    "Roof terracotta": [0.77, 0.39, 0.32],
    "Painted house 0": [0.93, 0.59, 0.52],
    "Painted house 1": [0.98, 0.84, 0.48],
    "Painted house 2": [0.57, 0.82, 0.88],
    "Painted house 3": [0.79, 0.66, 0.86],
  };
  for (const material of document.getRoot().listMaterials()) {
    if (!material.getBaseColorTexture()) continue;
    const tint = tintByName[material.getName()];
    if (!tint) continue;
    const alpha = material.getBaseColorFactor()[3];
    material.setBaseColorFactor([...tint, alpha]);
  }
  const textureCount = document.getRoot().listTextures().length;
  if (textureCount < 3) throw new Error(`${item.id} is missing CC0 PBR textures`);
  const bytes = await io.writeBinary(document);
  if (bytes.length > 2 * 1024 * 1024) throw new Error(`${item.id} exceeds 2 MiB PBR budget.`);
  const decoded = await io.readBinary(bytes);
  if (!decoded.getRoot().listMeshes().length)
    throw new Error(`${item.id} has no decoded geometry.`);
  await writeFile(file, bytes);
  item.bytes = bytes.length;
  item.compression = "KHR_draco_mesh_compression";
  item.textureCount = textureCount;
  item.materials = "embedded CC0 color, normal and roughness PBR maps";
  console.log(`${item.id}: ${bytes.length} bytes; decoded successfully`);
}
await writeFile(new URL("manifest.json", root), JSON.stringify(manifest, null, 2) + "\n");

const totalBytes = manifest.reduce((total, entry) => total + entry.bytes, 0);
if (totalBytes > 22 * 1024 * 1024) throw new Error("Total landmark PBR catalog exceeds 22 MiB");
console.log(`All ${manifest.length} landmark GLBs: ${totalBytes} bytes total`);
