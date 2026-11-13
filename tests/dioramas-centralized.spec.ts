import { expect, test } from "@playwright/test";

test.describe("Centralized /dioramas 3D hub & non-3D discovery routes", () => {
  test("hosts Regional Dioramas, Africa Globe & Provinces, and Cities & Landmarks in /dioramas", async ({
    page,
  }) => {
    for (const viewport of [
      { width: 320, height: 640 },
      { width: 390, height: 844 },
      { width: 1280, height: 800 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("/dioramas");
      await expect(page.getByRole("tab", { name: "Regional Dioramas" })).toBeVisible();
      await expect(page.getByRole("tab", { name: "Africa Globe & Provinces" })).toBeVisible();
      await expect(page.getByRole("tab", { name: "Cities & Landmarks" })).toBeVisible();
      await expect(page.locator("canvas.dioramas-canvas")).toBeVisible();

      // Switch to Africa Globe & Provinces
      await page.getByRole("tab", { name: "Africa Globe & Provinces" }).click();
      await expect(page.getByText("Africa · South Africa")).toBeVisible();
      await expect(page.getByRole("navigation", { name: "South African provinces" })).toBeVisible();

      // Switch to Cities & Landmarks
      await page.getByRole("tab", { name: "Cities & Landmarks" }).click();
      await expect(page.getByRole("tablist", { name: "Choose a city" })).toBeVisible();
    }
  });

  test("removes 3D stage and map canvases from /, /explore, /destinations, and /cape-town/landmarks", async ({
    page,
  }) => {
    const stageCanvases =
      ".atlas-map-backdrop canvas, .citylit-directory-3d-map-stage canvas, .scene canvas, .atlas-stage canvas";

    await page.goto("/");
    await expect(page.locator(stageCanvases)).toHaveCount(0);

    await page.goto("/explore");
    await expect(page.locator(stageCanvases)).toHaveCount(0);

    await page.goto("/destinations");
    await expect(page.locator(stageCanvases)).toHaveCount(0);
    await expect(page.getByRole("link", { name: /3D Globe & Provinces/i })).toBeVisible();

    await page.goto("/cape-town/landmarks");
    await expect(page.locator(stageCanvases)).toHaveCount(0);
    await expect(page.getByRole("link", { name: /Inspect in 3D/i })).toBeVisible();
  });
});
