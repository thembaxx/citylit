import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { cities } from "../lib/data";

test("the stage opens a landmark guide and shares the real day planner", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const model = page.waitForResponse(
    (response) => response.url().includes("/models/stage/") && response.status() === 200,
  );
  await page.goto("/cape-town/landmarks");
  await model;
  await expect(page.locator(".atlas-stage-sheet h2")).toHaveText("Table Mountain");
  await expect(page.getByRole("button", { name: "Table Mountain", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Next discovery" }).click();
  await expect(page.locator(".atlas-stage-sheet h2")).not.toHaveText("Table Mountain");
  await page.getByRole("button", { name: "Table Mountain", exact: true }).click();
  for (const name of cities.find((city) => city.slug === "cape-town")!.landmarks) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(page.locator(".atlas-stage-sheet h2")).toHaveText(name);
  }
  await page.getByRole("button", { name: "Table Mountain", exact: true }).click();
  // Selecting chips scrolls their sheet into view. Restore the scene viewport
  // before the drag; otherwise the mouse moves over the fixed header (y≈34).
  await page
    .locator(".reference-guide")
    .evaluate((guide) => guide.scrollTo({ top: 0, behavior: "instant" }));
  await expect(page.locator(".atlas-stage-heading h1")).toBeInViewport();
  // After selecting chips, the stage can be partly above the viewport.
  // A bounding-box percentage alone previously dragged at y=34, over the header.
  const point = await page.locator(".atlas-ring-scene").evaluate((host) => {
    const rect = host.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    for (const fractionX of [0.68, 0.62, 0.76]) {
      for (const fractionY of [0.6, 0.7, 0.55, 0.8]) {
        const x = Math.round(rect.left + rect.width * fractionX);
        const y = Math.round(rect.top + rect.height * fractionY);
        if (x < 120 || x > viewportWidth - 210 || y < 120 || y > viewportHeight - 110) continue;
        const target = document.elementFromPoint(x, y);
        if (target && host.contains(target)) return { x, y };
      }
    }
    throw new Error("The 3D ring has no visible unobstructed drag target.");
  });
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.mouse.move(point.x + 150, point.y, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator(".atlas-stage-sheet h2")).not.toHaveText("Table Mountain");
  await page.getByRole("button", { name: "Table Mountain", exact: true }).click();
  await page.getByRole("button", { name: "Add to my day", exact: true }).click();
  await expect(page.getByRole("button", { name: "In my day", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.reload();
  await expect(page.getByRole("button", { name: "In my day", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Open the full guide", exact: true }).click();
  await expect(page).toHaveURL(/\/cape-town\/parks-zoos\/table-mountain$/);
  await expect(page.locator("h1")).toHaveText("Table Mountain.");
  await page.goto("/cape-town/places");
  await page.getByRole("button", { name: "Next discovery" }).click();
  await expect(page.locator(".atlas-stage-sheet h2")).toBeVisible();
  const audit = await new AxeBuilder({ page })
    .include(".atlas-stage-content")
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
  expect(errors).toEqual([]);
});

test("stage routes resolve all twelve cities, reject unknown cities and serve cacheable models", async ({
  request,
}) => {
  for (const city of cities) {
    const response = await request.get(`/${city.slug}/landmarks`);
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain(city.name);
  }
  expect((await request.get("/not-a-city/landmarks")).status()).toBe(404);
  const model = await request.get("/models/stage/table-mountain.glb");
  expect(model.status()).toBe(200);
  expect(model.headers()["cache-control"]).not.toContain("no-store");
  expect((await model.body()).subarray(0, 4).toString()).toBe("glTF");
});

test("narrow-screen stages remain navigable with procedural city detail", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/cape-town/landmarks");
  await expect(page.locator(".atlas-ring-scene")).toBeVisible();
  await expect(page.locator(".atlas-stage-sheet h2")).toHaveText("Table Mountain");
  await page.getByRole("button", { name: "Next discovery" }).click();
  await expect(page.locator(".atlas-stage-sheet h2")).not.toHaveText("Table Mountain");
  await page.getByRole("button", { name: "Table Mountain", exact: true }).click();
  await expect(page.locator(".atlas-stage-sheet h2")).toHaveText("Table Mountain");
  await expect(page.getByRole("link", { name: "Open the full guide" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("320px header keeps a visible saved-day action and usable stage chips", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/johannesburg/landmarks");
  // The mobile redesign moves this action into the persistent bottom dock.
  const savedDay = page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "My day" });
  await expect(savedDay).toBeVisible();
  await expect(savedDay.locator("svg")).toBeVisible();
  await expect(savedDay).toHaveAttribute("href", /tab=day/);
  const chips = page.locator(".atlas-stage-chips");
  await expect(chips).toBeVisible();
  await chips.getByRole("button", { name: "Ponte City", exact: true }).click();
  await expect(page.locator(".atlas-ring-scene")).toHaveAttribute("data-active-model", "ponte");
  await expect(page.locator(".atlas-ring-scene")).toHaveAttribute(
    "data-active-model-status",
    "ready",
    {
      timeout: 30000,
    },
  );
  await expect(page.locator(".atlas-stage-sheet h2")).toHaveText("Ponte City");
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(321);
});
