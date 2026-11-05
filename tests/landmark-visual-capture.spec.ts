import { expect, test } from "@playwright/test";

// Capture REAL app output, never mockups or generated images. The reference
// photographs in docs/visual-fidelity-pr93.md are reviewed separately because
// their camera angles, lighting and seasons differ from the interactive scene.
const cases = [
  ["cape-town", "Table Mountain"],
  ["durban", "Moses Mabhida"],
  ["johannesburg", "Ponte City"],
  ["pretoria", "Union Buildings"],
  ["kimberley", "The Big Hole"],
] as const;

test.describe("hero landmark actual screenshot evidence", () => {
  test.skip(process.env.CITYLIT_CAPTURE_VISUALS !== "1", "Enable with CITYLIT_CAPTURE_VISUALS=1.");
  for (const [city, landmark] of cases) {
    test(`${city} / ${landmark} genuine renderer screenshot`, async ({ page }, testInfo) => {
      test.slow();
      await page.emulateMedia({ reducedMotion: "reduce" });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`/${city}/landmarks`);
      await page.getByRole("button", { name: landmark, exact: true }).click();
      const scene = page.locator(".atlas-ring-scene");
      await expect(scene).toHaveAttribute("data-active-model-status", "ready", { timeout: 30000 });
      await expect(page.locator(".atlas-stage-sheet h2")).toHaveText(landmark);
      const target = testInfo.outputPath(
        `citylit-real-${city}-${landmark.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`,
      );
      await scene.screenshot({ path: target, animations: "disabled", timeout: 30000 });
      await testInfo.attach(`Real CityLit canvas: ${landmark}`, {
        path: target,
        contentType: "image/png",
      });
      expect(errors).toEqual([]);
    });
  }
});
