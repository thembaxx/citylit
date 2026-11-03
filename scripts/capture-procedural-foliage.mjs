import { chromium, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const base = process.env.CITYLIT_URL ?? "http://127.0.0.1:3000";
const out = process.env.FOLIAGE_CAPTURE_DIR ?? "artifacts/procedural-foliage";
await mkdir(out, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: [
    "--enable-webgl",
    "--enable-unsafe-swiftshader",
    "--use-gl=angle",
    "--use-angle=swiftshader",
  ],
});

try {
  for (const { label, width, height } of [
    { label: "desktop", width: 1440, height: 900 },
    { label: "mobile-390", width: 390, height: 844 },
    { label: "mobile-320", width: 320, height: 720 },
  ]) {
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));

    // Legacy city view contains the reusable instanced ProceduralTree canopy.
    await page.goto(base + "/johannesburg?view=3d", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".game-screen")).toBeVisible();
    await expect(page.locator(".persistent-canvas canvas")).toBeVisible({ timeout: 30000 });
    await expect(page.locator(".webgl-fallback")).toHaveCount(0);
    await page.waitForTimeout(900);
    await page.screenshot({ path: out + "/" + label + "-classic-city.png" });

    // The native stage includes those trees in its local miniature setting.
    await page.goto(base + "/johannesburg/landmarks", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Ponte City", exact: true }).click();
    const stage = page.locator(".atlas-ring-scene");
    await expect(stage).toHaveAttribute("data-active-model-status", "ready", {
      timeout: 30000,
    });
    await expect(page.locator(".persistent-canvas canvas")).toBeVisible();
    await page.waitForTimeout(900);
    await page.screenshot({ path: out + "/" + label + "-stage.png" });
    if (errors.length > 0) {
      throw new Error(label + " page errors: " + errors.slice(0, 3).join("; "));
    }
    console.log("Captured ready-state procedural foliage:", label);
    await page.close();
  }
} finally {
  await browser.close();
}
