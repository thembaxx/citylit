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
    await page.goto(`/dioramas?scope=landmark&city=${citySlug}`);
    const city = cities.find((item) => item.slug === citySlug)!;
    await expect(page.locator(".dioramas-landmark-sheet h2")).toHaveText(city.landmarks[0]);
    await expect(page.locator(".atlas-ring-scene")).toHaveAttribute(
      "data-active-model-status",
      "ready",
      { timeout: 30000 },
    );
    const toolbar = page.getByLabel("3D inspection tools");
    await expect(toolbar).toBeVisible();
    await toolbar.getByRole("button", { name: /open 3D inspector/i }).click();

    await toolbar.getByRole("button", { name: "Switch to night lighting" }).click();
    await expect(toolbar.getByRole("button", { name: "Switch to daylight" })).toBeVisible();
    await toolbar.getByRole("button", { name: "Rotate selected miniature" }).click();
    await toolbar.getByRole("button", { name: "Zoom in" }).click();
    await toolbar.getByRole("button", { name: "Close-up", exact: true }).click();
    await expect(toolbar.getByRole("button", { name: "Close-up", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    const overhead = toolbar.getByRole("switch", { name: "Toggle overhead camera" });
    await overhead.click();
    await expect(overhead).toHaveAttribute("aria-checked", "true");
    await toolbar.getByRole("button", { name: "Reset inspection" }).click();
    await expect(toolbar.getByRole("button", { name: "Overview" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    const contextToggle = toolbar.getByRole("switch", { name: "Toggle show surroundings" });
    await expect(contextToggle).toHaveAttribute("aria-checked", "false");
    await contextToggle.click();
    await expect(contextToggle).toHaveAttribute("aria-checked", "true");
    await contextToggle.click();
    await expect(contextToggle).toHaveAttribute("aria-checked", "false");

    await page.getByRole("button", { name: "Next discovery" }).click();
    await expect(page.locator(".dioramas-landmark-sheet h2")).toHaveText(city.landmarks[1]);
    await expect(page.getByRole("link", { name: "Open guide" })).toBeVisible();
    expect(glbRequests).toEqual([]);
    expect(errors).toEqual([]);
  });
}
