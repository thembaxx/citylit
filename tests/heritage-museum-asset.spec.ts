import { expect, test } from "@playwright/test";

test("museum inspector uses the procedural Three.js model without GLB requests", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors: string[] = [];
  const modelRequests: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (/\/models\/hero\/.*\.glb(?:$|\?)/i.test(request.url())) {
      modelRequests.push(request.url());
    }
  });

  await page.goto("/kimberley/landmarks");
  await page.getByRole("button", { name: "McGregor Museum", exact: true }).click();
  const tools = page.getByLabel("3D inspection tools");
  if ((page.viewportSize()?.width ?? 1024) < 768) {
    await tools.getByRole("button", { name: "Open 3D inspector" }).click();
  }

  await expect(page.locator(".atlas-ring-scene")).toHaveAttribute(
    "data-active-model-status",
    "ready",
    { timeout: 30000 },
  );
  await tools.getByRole("button", { name: "Explode architectural layers" }).click();
  await expect(tools.getByRole("button", { name: "Assemble roof and landscape" })).toBeVisible();
  await tools.getByRole("button", { name: "Switch to night lighting" }).click();
  await expect(tools.getByRole("button", { name: "Switch to daylight" })).toBeVisible();
  await tools.getByRole("button", { name: "Reset inspection" }).click();
  await expect(tools.getByRole("button", { name: "Explode architectural layers" })).toBeVisible();

  expect(modelRequests).toEqual([]);
  expect(errors).toEqual([]);
});
