import { expect, test } from "@playwright/test";
import { cities } from "../lib/data";

for (const citySlug of [
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
  test(`architectural inspection stays interactive in ${citySlug}`, async ({ page }) => {
    test.slow();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error" && /webgl|shader|glsl/i.test(message.text())) {
        errors.push(message.text());
      }
    });
    const glbRequests: string[] = [];
    page.on("request", (request) => {
      const url = request.url();
      if (
        (url.includes("/models/stage/") || url.includes("/models/hero/")) &&
        url.endsWith(".glb")
      ) {
        glbRequests.push(url);
      }
    });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/${citySlug}/landmarks`);
    const city = cities.find((item) => item.slug === citySlug)!;
    await expect(page.locator(".atlas-stage-sheet h2")).toHaveText(city.landmarks[0]);
    await expect(page.locator(".atlas-ring-scene")).toHaveAttribute(
      "data-active-model-status",
      "ready",
      { timeout: 30000 },
    );
    const toolbar = page.getByLabel("3D inspection tools");
    await expect(toolbar).toBeVisible();
    if ((page.viewportSize()?.width ?? 1024) <= 767) {
      await toolbar.getByRole("button", { name: "Open 3D inspector" }).click();
    }

    await toolbar.getByRole("button", { name: "Switch to night lighting" }).click();
    await expect(toolbar.getByRole("button", { name: "Switch to daylight" })).toBeVisible();
    const explode = toolbar.getByRole("button", { name: "Exploded view" });
    const sceneCanvas = page.locator(".atlas-ring-scene canvas");
    await expect(explode).toBeVisible();
    await expect(explode).toHaveAttribute("aria-pressed", "false");
    await explode.click();
    await expect(explode).toHaveAttribute("aria-pressed", "true");
    await expect(sceneCanvas).toHaveAttribute("data-exploded-progress", "1.000");
    await explode.click();
    await expect(explode).toHaveAttribute("aria-pressed", "false");
    await expect(sceneCanvas).toHaveAttribute("data-exploded-progress", "0.000");
    await toolbar.getByRole("button", { name: "Rotate selected miniature" }).click();
    await toolbar.getByRole("button", { name: "Zoom in" }).click();
    await toolbar.getByRole("button", { name: "Close-up" }).click();
    await expect(toolbar.getByRole("button", { name: "Close-up" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await toolbar.getByRole("button", { name: "Overhead" }).click();
    await expect(toolbar.getByRole("button", { name: "Overhead" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await toolbar.getByRole("button", { name: "Reset inspection" }).click();
    await expect(toolbar.getByRole("button", { name: "Overview" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    const contextToggle = toolbar.getByRole("button", { name: "Show illustrative surroundings" });
    await expect(contextToggle).toHaveAttribute("aria-pressed", "false");
    await contextToggle.click();
    await expect(
      toolbar.getByRole("button", { name: "Hide illustrative surroundings" }),
    ).toHaveAttribute("aria-pressed", "true");
    await toolbar.getByRole("button", { name: "Hide illustrative surroundings" }).click();
    await expect(contextToggle).toHaveAttribute("aria-pressed", "false");

    await page.getByRole("button", { name: "Next discovery" }).click();
    await expect(page.locator(".atlas-stage-sheet h2")).toHaveText(city.landmarks[1]);
    await expect(page.getByRole("link", { name: "Open guide" })).toBeVisible();
    expect(glbRequests).toEqual([]);
    expect(errors).toEqual([]);
  });
}
