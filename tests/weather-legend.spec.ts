import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PLACE_STAGE = "/dioramas?scope=landmark&city=cape-town&mode=places";
const TRIGGER = "What do the weather icons mean?";

test("Places 3D cards open an accessible Weather Legend", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(PLACE_STAGE);

  const trigger = page.getByRole("button", { name: TRIGGER });
  await expect(trigger).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");

  await trigger.click();

  const dialog = page.getByRole("dialog", { name: "Weather legend" });
  await expect(dialog).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(dialog.getByRole("button", { name: "Close weather legend" })).toBeFocused();

  for (const label of [
    "Clear sky",
    "Partly cloudy",
    "Cloudy",
    "Fog",
    "Drizzle",
    "Rain",
    "Snow",
    "Thunderstorm",
  ]) {
    await expect(dialog.getByText(label, { exact: true })).toBeVisible();
  }
  await expect(dialog.getByText("A cloud with falling drops — steady rainfall.")).toBeVisible();
  await expect(
    dialog.getByText("A cloud with horizontal streaks — mist or fog reducing visibility."),
  ).toBeVisible();

  const a11y = await new AxeBuilder({ page })
    .include(".weather-legend-sheet")
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(a11y.violations).toEqual([]);

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("Weather Legend stays available when the live forecast cannot load", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route(/\/api\/weather\?/, (route) => route.abort());
  await page.goto(PLACE_STAGE);

  await expect(page.locator(".dioramas-landmark-sheet .place-weather-badge")).toHaveCount(0);
  const trigger = page.getByRole("button", { name: TRIGGER });
  await trigger.click();
  await expect(page.getByRole("dialog", { name: "Weather legend" })).toBeVisible();

  await page.locator(".weather-legend-backdrop").click({ position: { x: 6, y: 6 } });
  await expect(page.getByRole("dialog", { name: "Weather legend" })).toHaveCount(0);
});
