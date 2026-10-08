import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

test("Khwezi welcomes once, teaches gestures and keeps a single canvas", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const welcome = page.getByRole("complementary", { name: "Meet Khwezi" });
  await expect(welcome).toBeVisible();
  await expect(welcome.locator(".khwezi-view")).toHaveAttribute("data-ready", "true");
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.locator(".utility-nav .icon-button")).toHaveCount(4);
  await welcome.getByRole("button", { name: "Show me how" }).click();
  const help = page.getByRole("dialog", { name: "How to explore" });
  await expect(help).toBeVisible();
  await expect(help.locator('[data-pose="gesture"]')).toBeVisible();
  await help.getByRole("button", { name: "Let’s explore" }).click();
  await page.reload();
  await expect(welcome).toHaveCount(0);
  await expect(page.locator("canvas")).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("new saves catch a spark; unsaves and reloads do not celebrate", async ({ page }) => {
  await page.goto("/cape-town/parks-zoos/kirstenbosch");
  await page.getByRole("button", { name: "Save this discovery", exact: true }).click();
  await expect(page.locator(".khwezi-toast")).toContainText("A spark for later.");
  await expect(page.locator('.khwezi-toast [data-pose="saved"]')).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Saved to discoveries", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator(".khwezi-toast")).toHaveCount(0);
  await page.getByRole("button", { name: "Saved to discoveries", exact: true }).click();
  await expect(page.locator(".khwezi-toast")).toHaveCount(0);
});

test("the vector mascot and pose controls remain usable without WebGL", async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      value: function (this: HTMLCanvasElement, kind: string, ...args: unknown[]) {
        if (kind.includes("webgl")) return null;
        return Reflect.apply(getContext, this, [kind, ...args]);
      },
    });
  });
  await page.goto("/brand");
  await expect(page.locator(".webgl-fallback")).toContainText("3D is unavailable");
  const vector = page.locator(".brand-character-stage .khwezi-view-fallback");
  await expect(vector).toHaveCSS("opacity", "1");
  await page.getByRole("button", { name: "search", exact: true }).click();
  await expect(vector).toHaveAttribute("data-pose", "search");
});

test("the brand cache upgrade preserves previously downloaded venue photos", async ({ page }) => {
  await page.goto("/offline.html");
  await page.evaluate(async () => {
    const old = await caches.open("citylit-field-guide-v3");
    await old.put("/images/migration-check.jpg", new Response("cached-photograph"));
  });
  await page.goto("/explore");
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const updated = await caches.open("citylit-field-guide-v4");
        return (await updated.match("/images/migration-check.jpg"))?.text();
      }),
    )
    .toBe("cached-photograph");
});

test("settings trap focus, pause every mascot and persist preferences across routes", async ({
  page,
}) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Experience settings", exact: true });
  await trigger.click();
  const settings = page.getByRole("dialog", { name: "Experience settings" });
  await expect(
    settings.getByRole("button", { name: "Enable sounds", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await settings.getByRole("button", { name: "Pause animations", exact: true }).click();
  await expect(page.locator(".brand-world")).toHaveAttribute("data-khwezi-motion", "still");
  await settings.getByRole("checkbox", { name: /Essential motion/ }).check();
  await page.keyboard.press("Escape");
  await expect(settings).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await page.getByRole("button", { name: "Explore Durban", exact: true }).click();
  await trigger.click();
  await expect(
    settings.getByRole("button", { name: "Play animations", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.goto("/brand");
  await expect(page.locator(".brand-world")).toHaveAttribute("data-khwezi-motion", "still");
  await expect(page.getByLabel("A little local colour")).toHaveCSS("font-size", "16px");
});

test("brand model turns with keyboard and drag without navigation; export assets load", async ({
  page,
  request,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/brand");
  const stage = page.locator(".brand-character-stage");
  await expect(stage.locator(".khwezi-view")).toHaveAttribute("data-ready", "true");
  await stage.scrollIntoViewIfNeeded();
  await stage.getByRole("button", { name: "Turn Khwezi" }).focus();
  const before = await stage.screenshot();
  await page.keyboard.press("ArrowRight");
  await expect.poll(async () => (await stage.screenshot()).equals(before)).toBe(false);
  const box = (await stage.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.45, box.y + box.height * 0.55);
  await page.mouse.down();
  const previous = await stage.screenshot();
  await page.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.55, { steps: 12 });
  await page.mouse.up();
  await expect.poll(async () => (await stage.screenshot()).equals(previous)).toBe(false);
  await page.getByRole("button", { name: "Front", exact: true }).click();
  await stage.getByRole("button", { name: "Turn Khwezi" }).focus();
  await page.waitForTimeout(100);
  const front = await stage.screenshot();
  await stage.getByRole("button", { name: "Turn Khwezi" }).press("ArrowRight");
  await expect.poll(async () => (await stage.screenshot()).equals(front)).toBe(false);
  await page.getByRole("button", { name: "Front", exact: true }).click();
  await stage.getByRole("button", { name: "Turn Khwezi" }).focus();
  await expect.poll(async () => (await stage.screenshot()).equals(front)).toBe(true);
  await expect(page).toHaveURL(/\/brand$/);
  await expect(page.locator("canvas")).toHaveCount(1);
  for (const path of [
    "/app-icon.svg",
    "/brand/wordmark.svg",
    "/brand/khwezi.svg",
    "/brand/concept-sheet.png",
    "/brand/app-icon-maskable.png",
    "/brand/apple-touch-icon.png",
    "/brand/social-card.png",
  ])
    expect((await request.get(path)).status(), path).toBe(200);
});

test("empty searches introduce Khwezi; downloaded offline guides retain the mascot", async ({
  page,
  context,
}) => {
  await page.goto("/johannesburg/lodging?view=places");
  await page.getByPlaceholder("Search places").fill("qzxqzxqzxqzx");
  await expect(page.locator('.empty [data-pose="search"]')).toBeVisible();
  await page.goto("/explore");
  await page.getByRole("button", { name: "Passport", exact: true }).click();
  await page.getByRole("button", { name: "Save field guide offline", exact: true }).click();
  await expect(page.locator(".khwezi-toast")).toContainText("Your sparks travel with you.");
  await page.goto("/offline.html");
  await expect(page.getByAltText("Khwezi resting beside a lantern")).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("h1")).toHaveText("Your sparks travel with you.");
  await expect
    .poll(() =>
      page
        .getByAltText("Khwezi resting beside a lantern")
        .evaluate((image: HTMLImageElement) => image.naturalWidth),
    )
    .toBeGreaterThan(0);
  await context.setOffline(false);
});

test("offline downloads reject messages from foreign or missing origins", () => {
  let message: (event: { origin: string; data: { type: string }; waitUntil: () => void }) => void;
  let downloads = 0;
  runInNewContext(readFileSync(new URL("../public/sw.js", import.meta.url), "utf8"), {
    self: {
      location: { origin: "https://citylit.vercel.app" },
      addEventListener: (name: string, handler: typeof message) => {
        if (name === "message") message = handler;
      },
    },
    caches: {
      open: () => {
        downloads++;
        return Promise.resolve({});
      },
    },
  });
  for (const origin of ["https://other.example", "", "https://citylit.vercel.app.other.example"]) {
    message!({
      origin,
      data: { type: "SAVE_GUIDE" },
      waitUntil: () => {
        downloads++;
      },
    });
  }
  expect(downloads).toBe(0);
});

test("photo migration keeps its old cache and activates when storage is full", async () => {
  const source = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
  for (const full of [false, true]) {
    let activate: (event: { waitUntil: (promise: Promise<void>) => void }) => void;
    let activation: Promise<void> | undefined;
    let claimed = false;
    const deleted: string[] = [],
      copied: string[] = [];
    const requests = ["one", "two"].map((name) => ({
      url: `https://citylit.vercel.app/images/${name}.jpg`,
    }));
    const old = { keys: async () => requests, match: async () => new Response("photo") };
    const current = {
      match: async () => undefined,
      put: async (request: { url: string }) => {
        if (full && request === requests[0]) throw new Error("QuotaExceededError");
        copied.push(request.url);
      },
    };
    runInNewContext(source, {
      URL,
      self: {
        location: { origin: "https://citylit.vercel.app" },
        clients: {
          claim: async () => {
            claimed = true;
          },
        },
        addEventListener: (name: string, handler: typeof activate) => {
          if (name === "activate") activate = handler;
        },
      },
      caches: {
        keys: async () => ["citylit-field-guide-v3", "citylit-field-guide-v4"],
        open: async (key: string) => (key.endsWith("v3") ? old : current),
        delete: async (key: string) => {
          deleted.push(key);
          return true;
        },
      },
    });
    activate!({
      waitUntil: (promise) => {
        activation = promise;
      },
    });
    await activation;
    expect(claimed).toBe(true);
    expect(copied).toHaveLength(full ? 1 : 2);
    expect(deleted).toEqual(full ? [] : ["citylit-field-guide-v3"]);
  }
});
