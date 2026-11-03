import { test, expect } from "@playwright/test";

test("Retina mobile renders 3D above 1x without exceeding the capped pixel budget", async (
  { browser },
  testInfo,
) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Mobile Chromium renderer coverage");
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    reducedMotion: "reduce",
  });
  try {
    const page = await context.newPage();
    await page.goto("/johannesburg/landmarks");
    const canvas = page.locator(".persistent-canvas canvas");
    await expect(canvas).toBeVisible({ timeout: 30000 });
    const ratio = await canvas.evaluate((element) => {
      const width = element.getBoundingClientRect().width;
      return width > 0 ? element.width / width : 0;
    });
    // The low-power path caps high-density screens to 1.5 physical
    // framebuffer pixels per CSS pixel, without forcing 1x blur.
    expect(ratio).toBeGreaterThanOrEqual(1.45);
    expect(ratio).toBeLessThanOrEqual(1.55);
    await expect(page.locator(".webgl-fallback")).toHaveCount(0);
  } finally {
    await context.close();
  }
});
