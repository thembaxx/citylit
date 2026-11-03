import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const baseURL = process.env.ARCHVIZ_BASE_URL ?? "http://127.0.0.1:3000";
const folder = "artifacts/archviz";
await mkdir(folder, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  args: ["--enable-webgl", "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"],
});

for (const device of [
  { name: "desktop", viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  { name: "mobile", viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 },
]) {
  const page = await browser.newPage({
    viewport: device.viewport,
    deviceScaleFactor: device.deviceScaleFactor,
    reducedMotion: "reduce",
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${baseURL}/kimberley/landmarks`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "McGregor Museum", exact: true }).click();
  await page.locator(".atlas-inspector-toolbar").waitFor({ state: "visible" });
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `${folder}/${device.name}-day.png` });
  if (device.name === "mobile") {
    await page.getByRole("button", { name: "Open 3D inspector" }).click();
  }
  await page.getByRole("button", { name: "Switch to night lighting" }).click();
  if (device.name === "mobile") {
    await page.getByRole("button", { name: "Close 3D inspector" }).click();
  }
  await page.waitForTimeout(650);
  await page.screenshot({ path: `${folder}/${device.name}-night.png` });
  const renderer = await page.locator("canvas").count();
  console.log(`${device.name}: ${renderer} shared canvas, ${errors.length} uncaught errors`);
  if (renderer < 1 || errors.length) {
    console.error(errors);
    process.exitCode = 1;
  }
  await page.close();
}
await browser.close();
