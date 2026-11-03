import { expect, test } from "@playwright/test";

test("museum uses a separately compressed, genuinely textured architectural asset", async ({
  request,
}) => {
  const metadata = await request.get("/models/hero/manifest.json");
  expect(metadata.ok()).toBeTruthy();
  const manifest = (await metadata.json()) as {
    id: string;
    bytes: number;
    src: string;
    textures: number;
    compression: string;
  };
  expect(manifest.id).toBe("mcgregor-museum");
  expect(manifest.src).toBe("/models/hero/mcgregor-museum.glb");
  expect(manifest.bytes).toBeLessThanOrEqual(12 * 1024 * 1024);
  expect(manifest.textures).toBeGreaterThanOrEqual(8);
  expect(manifest.compression).toBe("KHR_draco_mesh_compression");

  const response = await request.get(manifest.src);
  expect(response.ok()).toBeTruthy();
  const bytes = await response.body();
  expect(bytes.length).toBe(manifest.bytes);
  expect(bytes.toString("utf8", 0, 4)).toBe("glTF");
  expect(bytes.readUInt32LE(4)).toBe(2);
  const jsonLength = bytes.readUInt32LE(12);
  const gltf = JSON.parse(bytes.toString("utf8", 20, 20 + jsonLength));
  expect(gltf.extensionsRequired).toContain("KHR_draco_mesh_compression");
  const namedNodes = new Set((gltf.nodes ?? []).map((node: { name?: string }) => node.name));
  for (const key of ["MuseumFacade", "MuseumRoof", "MuseumGlass", "MuseumLandscape"]) {
    expect(namedNodes.has(key), key).toBeTruthy();
  }
  expect(gltf.images?.length).toBeGreaterThanOrEqual(8);
});

test("museum inspector remains usable after selecting the new model", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/kimberley/landmarks");
  await page.getByRole("button", { name: "McGregor Museum", exact: true }).click();
  const tools = page.getByLabel("3D inspection tools");
  if ((page.viewportSize()?.width ?? 1024) < 768) {
    await tools.getByRole("button", { name: "Open 3D inspector" }).click();
  }
  await tools.getByRole("button", { name: "Explode architectural layers" }).click();
  await expect(tools.getByRole("button", { name: "Assemble roof and landscape" })).toBeVisible();
  await tools.getByRole("button", { name: "Switch to night lighting" }).click();
  await expect(tools.getByRole("button", { name: "Switch to daylight" })).toBeVisible();
  await tools.getByRole("button", { name: "Reset inspection" }).click();
  await expect(tools.getByRole("button", { name: "Explode architectural layers" })).toBeVisible();
  expect(errors).toEqual([]);
});
