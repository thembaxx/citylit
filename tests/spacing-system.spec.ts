import { expect, test } from "@playwright/test";

test("guide margins and cards follow the same spacing system across viewport sizes", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/destinations");
    await expect(page.locator(".atlas-directory")).toBeVisible();
    await expect(page.locator(".atlas-city-card-link").first()).toBeVisible();

    const measures = await page.evaluate(() => {
      const guide = document.querySelector<HTMLElement>(".reference-guide")!;
      const nav = document.querySelector<HTMLElement>(".atlas-nav")!;
      const heading = document.querySelector<HTMLElement>(".atlas-directory")!;
      const card = document.querySelector<HTMLElement>(".atlas-card-copy")!;
      const style = (element: Element) => getComputedStyle(element);
      return {
        overflow: guide.scrollWidth - guide.clientWidth,
        headerGutter: Number.parseFloat(style(nav).paddingLeft),
        contentGutter: Number.parseFloat(style(heading).paddingLeft),
        cardInset: Number.parseFloat(style(card).paddingLeft),
        cardGap: Number.parseFloat(style(card).gap),
        cardWidth: card.getBoundingClientRect().width,
        headerPaddingTop: Number.parseFloat(style(nav).paddingTop),
      };
    });
    expect(measures.overflow, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(1);
    expect(Math.abs(measures.headerGutter - measures.contentGutter)).toBeLessThanOrEqual(1);
    expect(measures.cardInset).toBeGreaterThanOrEqual(18);
    expect(measures.cardGap).toBeGreaterThanOrEqual(12);
    expect(measures.cardWidth).toBeGreaterThan(0);
    expect(measures.headerPaddingTop).toBeGreaterThanOrEqual(8);
  }
});

test("3D stage buttons remain separated from the model and spacious enough to tap", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/dioramas?scope=landmark&city=johannesburg&mode=places");
    const scene = page.locator(".atlas-ring-scene");
    const sheet = page.locator(".dioramas-landmark-sheet");
    await expect(scene).toBeVisible();
    await expect(sheet).toBeVisible();

    const metrics = await page.evaluate(() => {
      const scene = document.querySelector(".atlas-ring-scene")!.getBoundingClientRect();
      const sheet = document.querySelector(".dioramas-landmark-sheet")!;
      const sheetRect = sheet.getBoundingClientRect();
      const sheetStyle = getComputedStyle(sheet);
      const actions = [
        ...document.querySelectorAll<HTMLElement>(
          ".dioramas-landmark-sheet-actions a, .dioramas-landmark-sheet-actions button",
        ),
      ];
      return {
        sceneBottom: scene.bottom,
        sheetTop: sheetRect.top,
        sheetInset: Number.parseFloat(sheetStyle.paddingLeft),
        actionHeights: actions.map((button) => button.getBoundingClientRect().height),
      };
    });
    expect(metrics.sheetTop).toBeGreaterThanOrEqual(metrics.sceneBottom - 1);
    expect(metrics.sheetInset).toBeGreaterThanOrEqual(18);
    expect(metrics.actionHeights.length).toBeGreaterThan(0);
    expect(metrics.actionHeights.every((height) => height >= 44)).toBe(true);
  }
});

test("planner retains readable inset and mobile interactive actions", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/explore?tab=day");
  const planner = page.locator(".field-guide");
  await expect(planner).toBeVisible();
  const metrics = await planner.evaluate((element) => ({
    inset: Number.parseFloat(getComputedStyle(element).paddingLeft),
    overflow: element.scrollWidth - element.clientWidth,
  }));
  expect(metrics.inset).toBeGreaterThanOrEqual(16);
  expect(metrics.overflow).toBeLessThanOrEqual(1);
});
