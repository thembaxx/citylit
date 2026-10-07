import { test, expect } from "@playwright/test";
test("map to place, sources, photos, saves and back navigation", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Explore Cape Town", exact: true })).toBeVisible();
  await expect(page.locator('[data-available="true"]')).toHaveCount(3);
  await expect(page.getByText("3 provinces ready to explore")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(1);
  await page.evaluate(() => {
    (window as typeof window & { originalCanvas?: HTMLCanvasElement }).originalCanvas =
      document.querySelector("canvas")!;
  });
  await page.getByRole("button", { name: "Explore Cape Town", exact: true }).click();
  await expect(page).toHaveURL(/\/cape-town$/);
  await expect(page.locator(".landmark-open h3")).toHaveText("Table Mountain");
  await page.getByRole("button", { name: "Next landmark", exact: true }).click();
  await expect(page.locator(".landmark-open h3")).toHaveText("Bo-Kaap");
  await page
    .locator(".category-grid")
    .getByRole("button", { name: "Entertainment", exact: true })
    .click();
  await expect(page.locator(".place-card")).toHaveCount(2);
  await page.getByPlaceholder("Search Cape Town…").fill("Kirstenbosch");
  await expect(page.locator(".place-card")).toHaveCount(1);
  await page.locator(".place-open").click();
  await expect(page.locator("h1")).toHaveText("Kirstenbosch");
  await expect(page.getByRole("link", { name: "Official website", exact: true })).toHaveAttribute(
    "href",
    "https://www.sanbi.org/gardens/kirstenbosch/",
  );
  await expect(page.getByRole("link", { name: "Read on Wikipedia", exact: true })).toHaveAttribute(
    "href",
    /en.wikipedia.org/,
  );
  await page.getByRole("button", { name: "Save this discovery", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Saved to discoveries", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open venue photo gallery" }).click();
  await expect(page.locator(".gallery-dialog")).toBeVisible();
  await page.getByRole("button", { name: "Next photo", exact: true }).click();
  await expect(page.locator(".lightbox-controls")).toContainText("2 / 3");
  await page.getByRole("button", { name: "Close gallery", exact: true }).click();
  await expect(page.locator(".gallery-dialog")).not.toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Saved to discoveries", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Citylit home", exact: true }).click();
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.locator("body")).toHaveJSProperty(
    "scrollWidth",
    await page.locator("body").evaluate((el) => el.clientWidth),
  );
  expect(errors).toEqual([]);
});
test("one WebGL canvas persists through city and category routes", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Explore Durban", exact: true })).toBeVisible();
  await page.evaluate(() => {
    (window as typeof window & { originalCanvas?: HTMLCanvasElement }).originalCanvas =
      document.querySelector("canvas")!;
  });
  await page.getByRole("button", { name: "Explore Durban", exact: true }).click();
  await expect(page).toHaveURL(/\/durban$/);
  await page.locator(".category-grid").getByRole("button", { name: "Clubs", exact: true }).click();
  await expect(page).toHaveURL(/\/durban\/clubs$/);
  expect(
    await page.evaluate(
      () =>
        (window as typeof window & { originalCanvas?: HTMLCanvasElement }).originalCanvas ===
        document.querySelector("canvas"),
    ),
  ).toBe(true);
  await page.goBack();
  await expect(page).toHaveURL(/\/durban$/);
});
test("invalid city and cross-category place URLs return 404", async ({ request }) => {
  expect((await request.get("/unknown-city")).status()).toBe(404);
  expect((await request.get("/cape-town/clubs/kirstenbosch")).status()).toBe(404);
});
test("reset, pause and reduced motion controls stay usable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/johannesburg");
  await page.getByRole("button", { name: "Reset 3D view", exact: true }).click();
  await page.getByRole("button", { name: "Pause animations", exact: true }).click();
  await expect(page.getByRole("button", { name: "Play animations", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Next landmark", exact: true }).click();
  await expect(page.locator(".landmark-open h3")).toHaveText("Nelson Mandela Bridge");
});
test("touch swipe changes landmarks; drag and pinch manipulate 3D without navigating", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Touch-specific browser check");
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/cape-town");
  await expect(page.locator(".three-view")).toBeVisible();
  await page.getByRole("button", { name: "Pause animations", exact: true }).click();
  const cdp = await page.context().newCDPSession(page);
  await page.locator(".landmark-caption").scrollIntoViewIfNeeded();
  const caption = (await page.locator(".landmark-caption").boundingBox())!;
  const x = caption.x + caption.width * 0.8,
    y = caption.y + caption.height * 0.5;
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y, id: 0 }],
  });
  for (let i = 1; i <= 6; i++)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: x - i * 30, y, id: 0 }],
    });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(page.locator(".landmark-open h3")).toHaveText("Bo-Kaap");
  await page.locator(".three-view").scrollIntoViewIfNeeded();
  await expect(page.getByRole("button", { name: "Play animations", exact: true })).toBeVisible();
  // Wait for the short entrance flight before gestures engage the controls.
  await page.waitForTimeout(900);
  const box = (await page.locator(".three-view").boundingBox())!,
    cx = box.x + box.width / 2,
    cy = box.y + box.height / 2;
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: cx - 60, y: cy, id: 0 }],
  });
  for (let i = 1; i <= 6; i++)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: cx - 60 + i * 20, y: cy + 10, id: 0 }],
    });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(page).toHaveURL(/\/cape-town$/);
  await page.waitForTimeout(500);
  const before = await page.locator(".scene").screenshot();
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { x: cx - 30, y: cy, id: 0 },
      { x: cx + 30, y: cy, id: 1 },
    ],
  });
  for (let i = 1; i <= 6; i++)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        { x: cx - 30 - i * 9, y: cy, id: 0 },
        { x: cx + 30 + i * 9, y: cy, id: 1 },
      ],
    });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await page.waitForTimeout(500);
  const after = await page.locator(".scene").screenshot();
  expect(before.equals(after)).toBe(false);
  await expect(page).toHaveURL(/\/cape-town$/);
  expect(errors).toEqual([]);
});
