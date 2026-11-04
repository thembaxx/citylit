import { expect, test } from "@playwright/test";

test("mobile stage keeps 3D, inspector and place buttons in separate paint and layout layers", async ({
  page,
}) => {
  for (const viewport of [
    { width: 320, height: 700 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/johannesburg/places");

    const scene = page.locator(".atlas-ring-scene");
    const chips = page.locator(".atlas-stage-chips");
    await expect(scene).toBeVisible();
    await expect(chips).toBeVisible();

    const layout = await page.evaluate(() => {
      const box = (selector: string) => {
        const element = document.querySelector(selector);
        if (!element) throw new Error(`Missing ${selector}`);
        return element.getBoundingClientRect().toJSON();
      };
      const main = document.querySelector(".reference-stage-guide main");
      const canvas = document.querySelector(".persistent-canvas");
      if (!main || !canvas) throw new Error("Missing stage paint layers");
      return {
        heading: box(".atlas-stage-heading"),
        scene: box(".atlas-ring-scene"),
        chips: box(".atlas-stage-chips"),
        mainLayer: Number(getComputedStyle(main).zIndex),
        canvasLayer: Number(getComputedStyle(canvas).zIndex),
      };
    });

    expect(layout.scene.top).toBeGreaterThanOrEqual(layout.heading.bottom - 1);
    expect(layout.chips.top).toBeGreaterThanOrEqual(layout.scene.bottom - 1);
    expect(layout.mainLayer).toBeGreaterThan(layout.canvasLayer);

    await page.getByRole("button", { name: "Open 3D inspector" }).click();
    const panel = page.locator("#atlas-inspector-panel");
    await expect(panel).toBeVisible();
    const inspector = await page.evaluate(() => {
      const scene = document.querySelector(".atlas-ring-scene")!.getBoundingClientRect();
      const panel = document.querySelector("#atlas-inspector-panel")!.getBoundingClientRect();
      const chips = document.querySelector(".atlas-stage-chips")!.getBoundingClientRect();
      return {
        sceneBottom: scene.bottom,
        panelBottom: panel.bottom,
        panelRight: panel.right,
        sceneRight: scene.right,
        chipsTop: chips.top,
      };
    });
    expect(inspector.panelBottom).toBeLessThanOrEqual(inspector.sceneBottom + 1);
    expect(inspector.panelBottom).toBeLessThan(inspector.chipsTop);
    expect(inspector.panelRight).toBeLessThanOrEqual(inspector.sceneRight + 1);

    await page.getByRole("button", { name: "Close 3D inspector" }).click();
    const otherPlace = chips.locator("button").nth(1);
    await otherPlace.click();
    await expect(otherPlace).toHaveAttribute("aria-pressed", "true");
  }
});
