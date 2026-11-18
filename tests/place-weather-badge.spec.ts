import { test, expect } from "@playwright/test";

test("Places 3D info cards show the selected place's current weather", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route(/\/api\/weather\?/, async (route) => {
    const url = new URL(route.request().url());
    const latitude = Number(url.searchParams.get("latitude"));
    // Two Oceans Aquarium sits north of Mount Nelson; give each a distinct
    // WMO code so the badge has to re-read the forecast when the place changes.
    const code = latitude > -33.92 ? 61 : 71;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ temp: 12, code }),
    });
  });

  await page.goto("/dioramas?scope=landmark&city=cape-town&mode=places");

  const badge = page.locator(".dioramas-landmark-sheet .place-weather-badge");
  await expect(badge).toBeVisible();
  await expect(badge).toHaveAttribute("data-condition", "rain");
  await expect(badge).toHaveAttribute("aria-label", /Current weather at .*: Rain, 12°C/);
  await expect(badge.locator("svg")).toBeVisible();

  await page.getByRole("button", { name: "Mount Nelson", exact: true }).click();
  await expect(page.locator(".dioramas-landmark-sheet h2")).toHaveText("Mount Nelson");
  await expect(badge).toHaveAttribute("data-condition", "snow");
  await expect(badge).toHaveAttribute("aria-label", /Current weather at Mount Nelson: Snow, 12°C/);
});

test("weather badge stays out of the way when the forecast cannot load", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route(/\/api\/weather\?/, (route) => route.abort());
  await page.goto("/dioramas?scope=landmark&city=cape-town&mode=places");
  await expect(page.locator(".dioramas-landmark-sheet h2")).toBeVisible();
  await expect(page.locator(".dioramas-landmark-sheet .place-weather-badge")).toHaveCount(0);
});
