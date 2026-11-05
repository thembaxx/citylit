import { expect, test } from "@playwright/test";

test("Khwezi action is genuinely clickable above the live city map", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?view=guide");

  const hop = page.getByRole("button", { name: "Make Khwezi hop" });
  await expect(hop).toBeVisible();
  await hop.scrollIntoViewIfNeeded();
  const clearHitTarget = await hop.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const top = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    return top === element || element.contains(top);
  });
  expect(clearHitTarget, "map backdrop must not intercept the mascot button").toBe(true);

  await hop.click();
  await expect(page.getByRole("button", { name: "Say hello" })).toBeVisible();
});

test("safe-area layout keeps interactive guide elements within a compact viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?view=guide");
  await expect(page.getByRole("combobox", { name: "Choose a city on the map" })).toBeVisible();
  const overflow = await page.evaluate(() => {
    const guide = document.querySelector(".reference-guide");
    return guide ? guide.scrollWidth - guide.clientWidth : 999;
  });
  expect(overflow).toBeLessThanOrEqual(1);
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
});

test("mobile inspector popover and camera preset stay above the model", async ({ page }) => {
  test.slow();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/cape-town/landmarks");
  await page.getByRole("button", { name: "Table Mountain", exact: true }).click();
  await expect(page.locator(".atlas-ring-scene")).toHaveAttribute(
    "data-active-model-status",
    "ready",
    { timeout: 30000 },
  );

  const inspect = page.getByRole("button", { name: "Open 3D inspector" });
  await expect(inspect).toBeVisible();
  await inspect.click();

  const panel = page.locator(".atlas-inspector-panel.is-open");
  await expect(panel).toBeVisible();
  const preset = page.getByRole("button", { name: "Close-up", exact: true });
  await expect(preset).toBeVisible();
  await preset.scrollIntoViewIfNeeded();

  const hit = await preset.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const top = document.elementFromPoint(
      bounds.left + bounds.width / 2,
      bounds.top + bounds.height / 2,
    );
    return top === element || element.contains(top);
  });
  expect(hit, "inspector controls must be hit-testable above the 3D canvas").toBe(true);
  await preset.click();
  const selected = await preset.evaluate(
    (element) =>
      element.classList.contains("active") || element.getAttribute("aria-pressed") === "true",
  );
  expect(selected).toBe(true);
});
