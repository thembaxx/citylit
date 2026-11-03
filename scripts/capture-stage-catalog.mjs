import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const base = process.env.STAGE_URL ?? "http://127.0.0.1:3000";
const directory = "artifacts/stage-pbr";
await mkdir(directory, { recursive: true });

// One representative, real UI selection for each of the 15 unique Blender
// asset types. These are not screenshots of the historical landmark itself.
const cases = [
  ["table-mountain", "cape-town", "Table Mountain"],
  ["stadium", "durban", "Moses Mabhida"],
  ["union-buildings", "pretoria", "Union Buildings"],
  ["ponte", "johannesburg", "Ponte City"],
  ["bridge", "johannesburg", "Nelson Mandela Bridge"],
  ["lighthouse", "durban", "Umhlanga Lighthouse"],
  ["hole", "kimberley", "The Big Hole"],
  ["park", "durban", "Durban Botanic Gardens"],
  ["dome", "johannesburg", "Constitution Hill"],
  ["tower", "durban", "Durban City Hall"],
  ["arch", "bloemfontein", "Women's Memorial"],
  ["fort", "cape-town", "Castle of Good Hope"],
  ["bo-kaap", "cape-town", "Bo-Kaap"],
  ["cooling-towers", "johannesburg", "Orlando Towers"],
  ["aquarium", "durban", "uShaka Marine World"],
];

const browser = await chromium.launch({
  headless: true,
  args: ["--enable-webgl", "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"],
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "reduce",
  deviceScaleFactor: 1,
});
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
for (const screen of [
  { id: "desktop", width: 1440, height: 900 },
  { id: "mobile", width: 390, height: 844 },
]) {
  await page.setViewportSize({ width: screen.width, height: screen.height });
  for (const [id, city, name] of cases) {
    await page.goto(base + "/" + city + "/landmarks", { waitUntil: "domcontentloaded" });
    const chip = page.locator(".atlas-stage-chips").getByRole("button", { name, exact: true });
    await chip.click();
    await page.locator(".atlas-ring-scene").waitFor();
    await page.waitForTimeout(950);
    if ((await page.locator("canvas").count()) < 1) {
      throw new Error(id + " lacks the shared 3D canvas");
    }
    const filename = id + (screen.id === "mobile" ? "-mobile" : "") + ".png";
    await page.screenshot({ path: directory + "/" + filename });
    console.log("Captured", screen.id, "live model:", id, name);
  }
}
await page.close();
await browser.close();
if (errors.length) throw new Error("Uncaught stage page errors: " + errors.slice(0, 5).join("; "));
