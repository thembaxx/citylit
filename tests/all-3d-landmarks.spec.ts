import { expect, test } from "@playwright/test";
import { cities } from "../lib/data";

for (const citySlug of [
  "johannesburg",
  "cape-town",
  "durban",
  "pretoria",
  "stellenbosch",
  "pietermaritzburg",
  "gqeberha",
  "bloemfontein",
  "mbombela",
  "polokwane",
  "kimberley",
  "mahikeng",
]) {
  test(`architectural inspection stays interactive in ${citySlug}`, async ({ page }) => {
    test.slow();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/${citySlug}/landmarks`);
    const city = cities.find((item) => item.slug === citySlug)!;
    await expect(page.locator(".atlas-stage-sheet h2")).toHaveText(city.landmarks[0]);
    const toolbar = page.getByLabel("3D inspection tools");
    await expect(toolbar).toBeVisible();

    await toolbar.getByRole("button", { name: "Switch to night lighting" }).click();
    await expect(toolbar.getByRole("button", { name: "Switch to daylight" })).toBeVisible();
    await toolbar.getByRole("button", { name: "Rotate selected miniature" }).click();
    await toolbar.getByRole("button", { name: "Zoom in" }).click();
    await toolbar.getByRole("button", { name: "Close-up" }).click();
    await expect(toolbar.getByRole("button", { name: "Close-up" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await toolbar.getByRole("button", { name: "Overhead" }).click();
    await expect(toolbar.getByRole("button", { name: "Overhead" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await toolbar.getByRole("button", { name: "Reset inspection" }).click();
    await expect(toolbar.getByRole("button", { name: "Overview" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await page.getByRole("button", { name: "Next discovery" }).click();
    await expect(page.locator(".atlas-stage-sheet h2")).toHaveText(city.landmarks[1]);
    await expect(page.getByRole("link", { name: "Open the full guide" })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("all 15 Blender architectural assets remain valid Draco GLB files", async ({ request }) => {
  const manifestResponse = await request.get("/models/stage/manifest.json");
  expect(manifestResponse.ok()).toBeTruthy();
  const manifest = (await manifestResponse.json()) as { id: string; bytes: number; src: string }[];
  expect(manifest).toHaveLength(15);
  for (const entry of manifest) {
    const response = await request.get(entry.src);
    expect(response.ok(), entry.id).toBeTruthy();
    const data = await response.body();
    expect(data.subarray(0, 4).toString()).toBe("glTF");
    expect(data.length).toBe(entry.bytes);
    expect(data.length).toBeLessThanOrEqual(256 * 1024);
  }
});
