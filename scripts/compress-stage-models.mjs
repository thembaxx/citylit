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
