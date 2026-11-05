import { expect, test } from "@playwright/test";

// The five supplied landmark studies must be reachable from their real city catalogues.
const references = [
  ["cape-town", "Table Mountain"],
  ["pretoria", "Union Buildings"],
  ["durban", "Moses Mabhida"],
  ["johannesburg", "Nelson Mandela Bridge"],
  ["johannesburg", "Ponte City"],
  ["kimberley", "The Big Hole"],
] as const;

for (const [city, landmark] of references) {
  test(`procedural landmark: ${landmark} in ${city}`, async ({ page }, testInfo) => {
    test.slow();
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const glbRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/models/stage/") && request.url().endsWith(".glb")) {
        glbRequests.push(request.url());
      }
    });
    await page.goto(`/${city}/landmarks`);
    await page.getByRole("button", { name: landmark, exact: true }).click();
    const scene = page.locator(".atlas-ring-scene");
    await expect(scene).toHaveAttribute("data-active-model-status", "ready", { timeout: 30000 });
    await expect(page.locator(".atlas-stage-sheet h2")).toHaveText(landmark);
    if (
      process.env.CITYLIT_CAPTURE_VISUALS === "1" &&
      landmark !== "Nelson Mandela Bridge"
    ) {
      const filename = `citylit-real-${city}-${landmark.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
      const capture = testInfo.outputPath(filename);
      await scene.screenshot({ path: capture, animations: "disabled", timeout: 30000 });
      await testInfo.attach(`Real CityLit scene: ${landmark}`, {
        path: capture,
        contentType: "image/png",
      });
    }
    await page.getByRole("button", { name: "Switch to night lighting" }).click();
    await expect(page.getByRole("button", { name: "Switch to daylight" })).toBeVisible();
    expect(glbRequests).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test("procedural places have a scene in all twelve city catalogues", async ({ page }) => {
  test.slow();
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const city of [
    "johannesburg",
    "cape-town",
    "durban",
    "pretoria",
    "stellenbosch",
    "pietermaritzburg",
    "gqeberha",
    "bloemfontein",
    "mbombela",
    "polokwane",
    "kimberley",
    "mahikeng",
  ]) {
    await page.goto(`/${city}/places`);
    await expect(page.locator(".atlas-ring-scene")).toHaveAttribute(
      "data-active-model-status",
      "ready",
      { timeout: 30000 },
    );
    await expect(page.locator(".atlas-stage-sheet h2")).not.toBeEmpty();
  }
});
