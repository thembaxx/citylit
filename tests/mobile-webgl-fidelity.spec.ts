import { test, expect } from "@playwright/test";

test("Retina mobile uses capped pixel density", async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Mobile Chromium renderer coverage");
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    reducedMotion: "reduce",
  });
  try {
    const page = await context.newPage();
    await page.goto("http://localhost:3000/johannesburg/landmarks");
    const canvas = page.locator(".persistent-canvas canvas");
    await expect(canvas).toBeVisible({ timeout: 30000 });
    // Canvas visibility precedes R3F's renderer resize and DPR negotiation.
    // Poll the actual backing buffer rather than sampling its initial 1× size.
    const framebufferRatio = () =>
      canvas.evaluate((element) => {
        if (!(element instanceof HTMLCanvasElement)) return 0;
        const width = element.getBoundingClientRect().width;
        return width > 0 ? element.width / width : 0;
      });
    // The low-power path must render Retina at 1.5×, not settle at 1×.
    await expect.poll(framebufferRatio, { timeout: 30000 }).toBeGreaterThanOrEqual(1.45);
    expect(await framebufferRatio()).toBeLessThanOrEqual(1.55);
    // A fallback node may remain mounted but hidden by the renderer.
    // Only an actually visible fallback means the 3D experience failed.
    await expect(page.locator(".webgl-fallback")).toBeHidden();
  } finally {
    await context.close();
  }
});
