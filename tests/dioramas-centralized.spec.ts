import { expect, test } from "@playwright/test";

test.describe("Centralized /dioramas 3D hub & non-3D discovery routes", () => {
  test("hosts Regional Dioramas and Cities & Landmarks via dropdown in /dioramas", async ({
    page,
  }) => {
    for (const viewport of [
      { width: 320, height: 640 },
      { width: 390, height: 844 },
      { width: 1280, height: 800 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("/dioramas");
      const scopeTrigger = page.getByRole("button", { name: "Choose 3D view" });
      await expect(scopeTrigger).toBeVisible();
      await expect(scopeTrigger).toContainText("Regional Dioramas");
      await expect(page.locator("canvas.dioramas-canvas")).toBeVisible();

      // Open dropdown and switch to Cities & Landmarks
      await scopeTrigger.click();
      await expect(page.getByRole("option", { name: /Africa Globe/i })).toHaveCount(0);
      await page.getByRole("option", { name: /Cities & Landmarks/i }).click();
      await expect(page.getByRole("tablist", { name: "Choose a city" })).toBeVisible();
      await expect(page.locator(".dioramas-landmark-stage .atlas-ring-scene")).toBeVisible();
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
