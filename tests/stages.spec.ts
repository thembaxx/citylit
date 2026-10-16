import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { cities } from "../lib/data";

test("the stage opens a landmark guide and shares the real day planner", async ({ page }) => {
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
  const scene = await page.locator(".atlas-ring-scene").boundingBox();
  expect(scene).not.toBeNull();
  await page.mouse.move(scene!.x + scene!.width * 0.45, scene!.y + scene!.height * 0.45);
  await page.mouse.down();
  await page.mouse.move(scene!.x + scene!.width * 0.45 + 150, scene!.y + scene!.height * 0.45, {
    steps: 8,
  });
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
