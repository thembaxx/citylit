import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { NodeIO } from "@gltf-transform/core";
import { KHRDracoMeshCompression } from "@gltf-transform/extensions";
import draco from "draco3d";

const root = new URL("../public/models/stage/", import.meta.url);
const io = new NodeIO().registerExtensions([KHRDracoMeshCompression]).registerDependencies({
  "draco3d.decoder": await draco.createDecoderModule(),
});
for (const id of ["bo-kaap", "dome", "tower"]) {
  const bytes = await readFile(new URL(id + ".glb", root));
  const document = await io.readBinary(bytes);
  const names = document
    .getRoot()
    .listMaterials()
    .map((material) => material.getName());
  for (const material of [
    "Interior room backing",
    "Interior furniture timber",
    "Interior reveal concrete",
  ]) {
    assert.ok(
      names.includes(material),
      id + " is missing actual modelled window interiors: " + material,
    );
  }
  assert.ok(
    names.includes("Architectural window glazing"),
    id + " has no individual glass material",
  );
  const count = document
    .getRoot()
    .listMeshes()
    .flatMap((mesh) => mesh.listPrimitives())
    .reduce((sum, primitive) => sum + (primitive.getAttribute("POSITION")?.getCount() ?? 0), 0);
  assert.ok(count > 5000, id + " lost architectural geometry");
  console.log(id + ": real recess materials and " + count + " decoded vertices verified");
}
