import { expect, test } from "@playwright/test";

test("mobile navigation, readable controls and narrow screen layout", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/destinations");

  const dock = page.getByRole("navigation", { name: "Mobile navigation" });
  await expect(dock).toBeVisible();
  await expect(dock.locator("a")).toHaveCount(4);
  await expect(dock.getByRole("link", { name: "Cities" })).toHaveAttribute("aria-current", "page");

  const fontSizes = await page
    .locator("input, textarea, select")
    .evaluateAll((elements) =>
      elements.map((element) => Number.parseFloat(getComputedStyle(element).fontSize)),
    );
  expect(fontSizes.length).toBeGreaterThan(0);
  expect(fontSizes.every((size) => size >= 16)).toBe(true);

  for (const width of [360, 320]) {
    await page.setViewportSize({ width, height: 720 });
    const dimensions = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
      content: document.querySelector(".reference-guide")?.clientWidth ?? 0,
    }));
    expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
    expect(dimensions.content).toBeGreaterThan(0);
    const tapTargets = await dock
      .locator("a")
      .evaluateAll((anchors) => anchors.map((anchor) => anchor.getBoundingClientRect().height));
    expect(tapTargets.every((height) => height >= 44)).toBe(true);
  }

  await page.emulateMedia({ reducedMotion: "reduce" });
  const transitionDuration = await dock
    .locator("a")
    .first()
    .evaluate((anchor) => getComputedStyle(anchor).transitionDuration);
  expect(transitionDuration).toBe("0s");
});

test("Khwezi remains interactive and the PWA SVG uses the revised branding", async ({
  page,
  request,
}) => {
  const icon = await request.get("/app-icon.svg");
  expect(icon.ok()).toBe(true);
  expect(await icon.text()).toContain("#B39AFF");

  await page.goto("/brand");
  await expect(page.getByRole("heading", { name: "Meet Khwezi." })).toBeVisible();
  const hop = page.getByRole("button", { name: "Make Khwezi hop" });
  await expect(hop).toBeVisible();
  await hop.click();
  await expect(page.getByRole("button", { name: "Say hello" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Turn Khwezi" }).first()).toBeVisible();
});
