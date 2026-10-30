import { expect, test } from "@playwright/test";

test("a failed Blender landmark asset does not disable the ring or researched guide", async ({
  page,
}) => {
  await page.route("**/models/stage/table-mountain.glb", (route) =>
    route.fulfill({ status: 503, contentType: "text/plain", body: "Temporarily unavailable" }),
  );
  const failedModel = page.waitForResponse(
    (response) =>
      response.url().includes("/models/stage/table-mountain.glb") && response.status() === 503,
  );
  await page.goto("/cape-town/landmarks");
  await failedModel;
  await expect(page.locator(".atlas-stage-sheet h2")).toHaveText("Table Mountain");
  await expect(page.getByRole("link", { name: "Open the full guide" })).toBeVisible();
  await expect(page.locator(".atlas-ring-scene")).toBeVisible();
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
