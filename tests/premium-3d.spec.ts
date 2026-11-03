import { test, expect } from "@playwright/test";

test("Kimberley museum exposes functional, accessible architectural inspector tools", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/kimberley/landmarks");
  await page.getByRole("button", { name: "McGregor Museum", exact: true }).click();
  await expect(page.locator(".atlas-stage-sheet h2")).toHaveText("McGregor Museum");

  const tools = page.getByLabel("3D inspection tools");
  await expect(tools).toBeVisible();
  await tools.getByRole("button", { name: "Switch to night lighting" }).click();
  await expect(tools.getByRole("button", { name: "Switch to daylight" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await tools.getByRole("button", { name: "Zoom in" }).click();
  await expect(tools.getByRole("status")).toContainText("Architecture");

  await tools.getByRole("button", { name: "Explode architectural layers" }).click();
  await expect(tools.getByRole("button", { name: "Assemble roof and landscape" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(tools.getByRole("status")).toContainText("layers separated");

  await tools.getByRole("button", { name: "Windows", exact: true }).click();
  await expect(tools.getByRole("button", { name: "Windows" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await tools.getByRole("button", { name: "Reset inspection" }).click();
  await expect(tools.getByRole("button", { name: "Switch to night lighting" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expect(tools.getByRole("button", { name: "Explode architectural layers" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );

  await page.getByRole("button", { name: "The Big Hole", exact: true }).click();
  await expect(tools.getByRole("button", { name: "Explode architectural layers" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Open the full guide" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("inspector tools fit a narrow mobile viewport and respect reduced motion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/kimberley/landmarks");
  await page.getByRole("button", { name: "McGregor Museum", exact: true }).click();
  const tools = page.getByLabel("3D inspection tools");
  await expect(tools).toBeVisible();
  const box = await tools.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  await tools.getByRole("button", { name: "Explode architectural layers" }).click();
  await expect(tools.getByRole("status")).toContainText("layers separated");
  await expect(page.locator(".atlas-ring-scene")).toBeVisible();
});
