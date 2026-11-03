import { test, expect } from "@playwright/test";

test("mobile guide has tactile navigation, readable inputs and interactive Khwezi", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const dock = page.getByRole("navigation", { name: "Mobile navigation" });
  await expect(dock).toBeVisible();
  await expect(dock.getByRole("link")).toHaveCount(4);
  await expect(dock.getByRole("link", { name: "Discover" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(page.locator(".atlas-nav .atlas-about-link")).toHaveCount(0);
  const choose = page.getByRole("combobox", { name: "Choose a city on the map" });
  await expect(choose).toHaveCSS("font-size", "16px");
  await expect(choose).toBeVisible();
  await expect(page.getByRole("button", { name: "Make Khwezi hop" })).toBeVisible();
  await expect(page.locator(".atlas-beacon-mascot .khwezi-view")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await expect(page.locator(".persistent-canvas")).toHaveCSS("z-index", "20");
  await page.getByRole("button", { name: "Make Khwezi hop" }).click();
  await expect(page.getByRole("button", { name: "Say hello" })).toBeVisible();
  await choose.selectOption("1");
  await expect(page.locator(".atlas-beacon-card h2")).toHaveText("Cape Town");
  await expect(page.getByRole("link", { name: "Explore the city" })).toBeVisible();
  const overflow = await page
    .locator(".reference-guide")
    .evaluate((el) => el.scrollWidth > el.clientWidth + 1);
  expect(overflow).toBe(false);
  await dock.getByRole("link", { name: "Cities" }).click();
  await expect(page).toHaveURL(/\/destinations$/);
  await expect(
    page
      .getByRole("navigation", { name: "Mobile navigation" })
      .getByRole("link", { name: "Cities" }),
  ).toHaveAttribute("aria-current", "page");
});

for (const width of [320, 360, 390, 768, 1440]) {
  test(`brand and guide fit ${width}px screens`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await expect(page.locator(".reference-guide h1")).toBeVisible();
    const overflow = await page
      .locator(".reference-guide")
      .evaluate((el) => el.scrollWidth > el.clientWidth + 1);
    expect(overflow).toBe(false);
    await page.goto("/brand");
    await expect(page.getByRole("heading", { name: /Every city/ })).toBeVisible();
    expect(
      await page.locator(".brand-page").evaluate((el) => el.scrollWidth > el.clientWidth + 1),
    ).toBe(false);
    await expect(page.getByRole("button", { name: "Make Khwezi hop" })).toBeVisible();
  });
}

test("reduced motion leaves the guide logo and mascot controllable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".brand-world")).toHaveAttribute("data-khwezi-motion", "still");
  await expect(page.locator(".atlas-wordmark .citylit-logo-symbol").first()).toBeVisible();
  await page.getByRole("button", { name: "Make Khwezi hop" }).click();
  await expect(page.getByRole("button", { name: "Say hello" })).toBeVisible();
});

test("new icon and logo are available to installed users", async ({ request }) => {
  const icon = await request.get("/app-icon.svg");
  expect(icon.ok()).toBe(true);
  expect(await icon.text()).toContain("#F3C975");
  expect((await request.get("/brand/wordmark.svg")).ok()).toBe(true);
  expect((await request.get("/brand/apple-touch-icon.png")).ok()).toBe(true);
});


test("all editable controls use at least 16px text on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ["/", "/destinations", "/explore", "/brand"]) {
    await page.goto(route);
    const sizes = await page.locator('input, textarea, select, [contenteditable="true"], [role="combobox"], [role="textbox"], [role="searchbox"], [role="spinbutton"]').evaluateAll((elements) =>
      elements.map((element) => ({
        tag: element.tagName,
        size: Number.parseFloat(getComputedStyle(element).fontSize),
      })),
    );
    for (const control of sizes) {
      expect(control.size, `${route}: ${control.tag} font size`).toBeGreaterThanOrEqual(16);
    }
  }
});
