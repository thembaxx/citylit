import { expect, test } from "@playwright/test";

test.describe("landmark mechanisms", () => {
  test("joints move between manual and authored motion", async ({ page }) => {
    test.slow();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error" && /webgl|shader|glsl/i.test(message.text())) {
        errors.push(message.text());
      }
    });

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/cape-town/landmarks");
    await expect(page.locator(".atlas-stage-sheet h2")).toHaveText("Table Mountain");
    await expect(page.locator(".atlas-ring-scene")).toHaveAttribute(
      "data-active-model-status",
      "ready",
      { timeout: 30000 },
    );

    const toolbar = page.getByLabel("3D inspection tools");
    const openInspector = async () => {
      if ((page.viewportSize()?.width ?? 1024) <= 767) {
        await toolbar.getByRole("button", { name: "Open 3D inspector" }).click();
      }
    };
    await openInspector();

    const mechanisms = page.getByLabel("Landmark mechanisms");
    await expect(mechanisms).toBeVisible();
    const ascentAuto = mechanisms.getByRole("button", {
      name: "Control Cable car · ascent manually",
    });
    await expect(ascentAuto).toHaveAttribute("aria-pressed", "false");
    await expect(mechanisms.getByRole("slider")).toHaveCount(0);

    await ascentAuto.click();
    const ascentManual = mechanisms.getByRole("button", {
      name: "Return Cable car · ascent to authored motion",
    });
    await expect(ascentManual).toHaveAttribute("aria-pressed", "true");
    const slider = mechanisms.getByRole("slider", { name: "Cable car · ascent position" });
    await expect(slider).toBeVisible();
    await expect(slider).toHaveValue("0.5");
    await slider.fill("0.85");
    await expect(slider).toHaveValue("0.85");

    const restore = mechanisms.getByRole("button", { name: "Restore authored motion" });
    await expect(restore).toBeVisible();
    await restore.click();
    await expect(mechanisms.getByRole("slider")).toHaveCount(0);
    await expect(ascentAuto).toHaveAttribute("aria-pressed", "false");

    // Both joints can be controlled, and the inspection reset returns them to Auto.
    await ascentAuto.click();
    await mechanisms.getByRole("button", { name: "Control Cable car · descent manually" }).click();
    await expect(mechanisms.getByRole("slider")).toHaveCount(2);
    await toolbar.getByRole("button", { name: "Reset inspection" }).click();
    await expect(mechanisms.getByRole("slider")).toHaveCount(0);
    await expect(ascentAuto).toHaveAttribute("aria-pressed", "false");
    await expect(
      mechanisms.getByRole("button", { name: "Control Cable car · descent manually" }),
    ).toHaveAttribute("aria-pressed", "false");

    // Switching landmarks clears any override rather than carrying it across.
    await ascentAuto.click();
    await expect(mechanisms.getByRole("slider")).toHaveCount(1);
    await page.getByRole("button", { name: "Next discovery" }).click();
    await expect(page.locator(".atlas-stage-sheet h2")).toHaveText("Bo-Kaap");
    await expect(page.getByLabel("Landmark mechanisms")).toHaveCount(0);
    await page.getByRole("button", { name: "Previous discovery" }).click();
    await expect(page.locator(".atlas-stage-sheet h2")).toHaveText("Table Mountain");
    await openInspector();
    await expect(ascentAuto).toHaveAttribute("aria-pressed", "false");
    await expect(mechanisms.getByRole("slider")).toHaveCount(0);

    expect(errors).toEqual([]);
  });

  test("mechanisms fit 320px and 390px viewports", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-chromium", "narrow layout runs once on mobile");
    test.slow();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));

    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 740 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/cape-town/landmarks");
      await expect(page.locator(".atlas-ring-scene")).toHaveAttribute(
        "data-active-model-status",
        "ready",
        { timeout: 30000 },
      );
      const toolbar = page.getByLabel("3D inspection tools");
      await toolbar.getByRole("button", { name: "Open 3D inspector" }).click();
      const mechanisms = page.getByLabel("Landmark mechanisms");
      await expect(mechanisms).toBeVisible();
      await mechanisms.getByRole("button", { name: "Control Cable car · ascent manually" }).click();
      await expect(mechanisms.getByRole("slider")).toBeVisible();
      await mechanisms.scrollIntoViewIfNeeded();

      const panelBox = await page.locator(".atlas-inspector-panel.is-open").boundingBox();
      expect(panelBox).not.toBeNull();
      expect(panelBox!.y + panelBox!.height).toBeLessThanOrEqual(740 + 0.5);
      const box = await mechanisms.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width + 0.5);
      expect(box!.y).toBeGreaterThanOrEqual(0);
      expect(box!.y + box!.height).toBeLessThanOrEqual(740 + 0.5);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
      ).toBe(true);

      // Controls stay finger-sized and the slider remains adjustable.
      for (const button of await mechanisms.getByRole("button").all()) {
        const buttonBox = await button.boundingBox();
        expect(buttonBox!.height).toBeGreaterThanOrEqual(32);
      }
      await expect(mechanisms.getByRole("slider")).toHaveValue("0.5");
      await mechanisms.getByRole("slider").fill("0.3");
      await expect(mechanisms.getByRole("slider")).toHaveValue("0.3");
    }

    expect(errors).toEqual([]);
  });
});
