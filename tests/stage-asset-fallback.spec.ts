import { expect, test } from "@playwright/test";

test("procedural landmarks remain interactive when legacy GLB requests are unavailable", async ({
  page,
}) => {
  let legacyRequests = 0;
  await page.route("**/models/stage/*.glb", (route) => {
    legacyRequests += 1;
    return route.fulfill({ status: 503, contentType: "text/plain", body: "Offline" });
  });
  await page.goto("/cape-town/landmarks");
  await expect(page.locator(".atlas-ring-scene")).toHaveAttribute(
    "data-active-model-status",
    "ready",
    { timeout: 30000 },
  );
  expect(legacyRequests).toBe(0);
  await expect(page.locator(".atlas-stage-sheet h2")).toHaveText("Table Mountain");
  await expect(page.getByRole("link", { name: "Open guide" })).toBeVisible();
  await expect(page.locator(".atlas-ring-scene")).toBeVisible();
  await expect(page.locator(".atlas-ring-scene")).toHaveAttribute(
    "data-active-model-status",
    "ready",
  );
  await page.getByRole("button", { name: "Next discovery" }).click();
  await expect(page.locator(".atlas-stage-sheet h2")).toHaveText("Bo-Kaap");
  await page.getByRole("button", { name: "Table Mountain", exact: true }).click();
  await expect(page.locator(".atlas-stage-sheet h2")).toHaveText("Table Mountain");
  const ring = page.locator(".atlas-ring-scene");
  const bounds = await ring.boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.move(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds!.x + bounds!.width / 2 + 160, bounds!.y + bounds!.height / 2, {
    steps: 8,
  });
  await page.mouse.up();
  await expect(page.locator(".atlas-stage-sheet h2")).not.toHaveText("Table Mountain");
});
