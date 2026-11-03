import { chromium, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const base = process.env.STAGE_URL ?? "http://127.0.0.1:3000";
const directory = process.env.STAGE_CAPTURE_DIR ?? "artifacts/stage-pbr";
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

const focusIds = new Set((process.env.STAGE_FOCUS_IDS ?? "").split(",").filter(Boolean));
const selectedCases = focusIds.size ? cases.filter(([id]) => focusIds.has(id)) : cases;
if (focusIds.size && selectedCases.length !== focusIds.size) {
  throw new Error("Unknown landmark model IDs in STAGE_FOCUS_IDS");
}
const browser = await chromium.launch({
  headless: true,
  args: [
    "--enable-webgl",
    "--enable-unsafe-swiftshader",
    "--use-gl=angle",
    "--use-angle=swiftshader",
  ],
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
  {
    id: "mobile",
    width: Number(process.env.STAGE_MOBILE_WIDTH ?? 390),
    height: Number(process.env.STAGE_MOBILE_HEIGHT ?? 844),
  },
]) {
  await page.setViewportSize({ width: screen.width, height: screen.height });
  for (const [id, city, name] of selectedCases) {
    await page.goto(base + "/" + city + "/landmarks", { waitUntil: "domcontentloaded" });
    const chip = page.locator(".atlas-stage-chips").getByRole("button", { name, exact: true });
    await chip.click();
    const scene = page.locator(".atlas-ring-scene");
    await expect(scene).toHaveAttribute("data-active-model", id);
    // A loaded canvas is not proof that the GLB has replaced Suspense fallback.
    await expect(scene).toHaveAttribute("data-active-model-status", "ready", {
      timeout: 30000,
    });
    await page.waitForTimeout(400);
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
