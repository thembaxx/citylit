import { expect, test } from "@playwright/test";

test("a failed Blender landmark asset does not disable the ring or researched guide", async ({
  page,
}) => {
  await page.route("**/models/stage/table-mountain.glb", (route) =>
    route.fulfill({ status: 503, contentType: "text/plain", body: "Temporarily unavailable" }),
  );
  await page.goto("/cape-town/landmarks");
  await expect(page.locator(".atlas-stage-sheet h2")).toHaveText("Table Mountain");
  await expect(page.getByRole("link", { name: "Open the full guide" })).toBeVisible();
  await expect(page.locator(".atlas-ring-scene")).toBeVisible();
  await page.getByRole("button", { name: "Next discovery" }).click();
  await expect(page.locator(".atlas-stage-sheet h2")).toHaveText("Bo-Kaap");
  await page.getByRole("button", { name: "Table Mountain", exact: true }).click();
  await expect(page.locator(".atlas-stage-sheet h2")).toHaveText("Table Mountain");
});
