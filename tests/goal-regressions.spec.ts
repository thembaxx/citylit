import { expect, test } from "@playwright/test";

const VIEWPORTS = [
  { name: "mobile-320", width: 320, height: 640 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "desktop-1440", width: 1440, height: 900 },
] as const;

test.describe("Citylit goal regressions", () => {
  test("Settings modal has compact theme pills and 44px close target", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await page.getByRole("button", { name: "Settings" }).first().click();

    const darkBtn = page.getByRole("button", { name: "Dark", exact: true });
    const systemBtn = page.getByRole("button", { name: "System", exact: true });
    const lightBtn = page.getByRole("button", { name: "Light", exact: true });
    const closeBtn = page.getByRole("button", { name: "Close settings" });

    await expect(darkBtn).toBeVisible();
    await expect(systemBtn).toBeVisible();
    await expect(lightBtn).toBeVisible();
    await expect(closeBtn).toBeVisible();

    const darkBox = await darkBtn.boundingBox();
    const closeBox = await closeBtn.boundingBox();
    expect(darkBox).not.toBeNull();
    expect(closeBox).not.toBeNull();
    expect(darkBox!.height).toBeGreaterThanOrEqual(44);
    expect(darkBox!.height).toBeLessThanOrEqual(56);
    expect(closeBox!.width).toBeGreaterThanOrEqual(44);
    expect(closeBox!.height).toBeGreaterThanOrEqual(44);

    await lightBtn.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "day");
  });

  test("mdxcn components render cleanly and fake review claims are gone", async ({ page }) => {
    await page.goto("/about", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".mdxcn-callout")).toBeVisible();
    await expect(page.locator(".mdxcn-steps .mdxcn-step")).toHaveCount(3);
    await expect(page.locator(".mdxcn-table")).toBeVisible();
    await expect(page.locator(".mdxcn-codeblock")).toBeVisible();

    await page.goto("/privacy", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".mdxcn-callout")).toBeVisible();
    await expect(page.locator(".mdxcn-table")).toBeVisible();

    await page.goto("/cape-town?landmark=table-mountain", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("12k reviews")).toHaveCount(0);
    await page.getByRole("tab", { name: "Facts" }).click();
    await expect(page.locator(".mdxcn-table")).toBeVisible();
    await page.getByRole("tab", { name: "Sources" }).click();
    await expect(page.locator(".mdxcn-callout")).toBeVisible();
    await expect(page.locator(".mdxcn-codeblock")).toBeVisible();
  });

  test("PixiJS 3D stage renders real GLB models on /dioramas", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dioramas?scope=pixi3d", { waitUntil: "domcontentloaded" });

    const stageCanvas = page.locator(".pixi3d-canvas");
    await expect(stageCanvas).toBeVisible({ timeout: 20000 });
    await expect(page.locator(".dioramas-badge.is-live")).toContainText("PixiJS", {
      timeout: 20000,
    });

    const box = await stageCanvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(240);
    expect(box!.height).toBeGreaterThan(200);

    await page.getByRole("tab", { name: /McGregor Museum/i }).click();
    await expect(page.locator(".dioramas-stage-title strong")).toHaveText("McGregor Museum");
    await expect(page.locator(".dioramas-badge.is-live")).toContainText("PixiJS", {
      timeout: 20000,
    });

    expect(errors).toEqual([]);
  });

  for (const vp of VIEWPORTS) {
    test(`zero horizontal overflow across routes at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      for (const route of ["/", "/about", "/privacy", "/dioramas"]) {
        await page.goto(route, { waitUntil: "domcontentloaded" });
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        expect(overflow, `Overflow on ${route} at ${vp.name}`).toBeLessThanOrEqual(1);
      }
    });
  }
});
