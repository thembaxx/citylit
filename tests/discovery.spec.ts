import { test, expect } from "@playwright/test";
test("map to place, sources, photos, saves and back navigation", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Explore Cape Town", exact: true })).toBeVisible();
  await expect(page.locator('[data-available="true"]')).toHaveCount(9);
  await expect(page.getByText("9 provinces ready to explore")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(1);
  await page.evaluate(() => {
    (window as typeof window & { originalCanvas?: HTMLCanvasElement }).originalCanvas =
      document.querySelector("canvas")!;
  });
  await page.getByRole("link", { name: "Explore Cape Town", exact: true }).click();
  await expect(page).toHaveURL(/\/cape-town$/);
  await expect(page.locator(".landmark-open h3")).toHaveText("Table Mountain");
  await page.getByRole("button", { name: "Next landmark", exact: true }).click();
  await expect(page.locator(".landmark-open h3")).toHaveText("Bo-Kaap");
  await page.getByRole("link", { name: "Explore Cape Town", exact: true }).click();
  await expect(page.locator(".place-card")).toHaveCount(0);
  await page.getByRole("link", { name: "Open Entertainment", exact: true }).click();
  await expect(page.locator(".place-card")).toHaveCount(5);
  await page.getByPlaceholder("Search places").fill("Kirstenbosch");
  await expect(page.locator(".place-card")).toHaveCount(1);
  await page.locator(".place-open").click();
  await expect(page.locator("h1")).toHaveText("Kirstenbosch");
  await expect(page.getByRole("link", { name: "Official website", exact: true })).toHaveAttribute(
    "href",
    "https://www.sanbi.org/gardens/kirstenbosch/",
  );
  await expect(page.getByRole("link", { name: "Read on Wikipedia", exact: true })).toHaveAttribute(
    "href",
    /en.wikipedia.org/,
  );
  await page.getByRole("button", { name: "Save this discovery", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Saved to discoveries", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open venue photo gallery" }).click();
  await expect(page.locator(".gallery-dialog")).toBeVisible();
  await page.getByRole("button", { name: "Next photo", exact: true }).click();
  await expect(page.locator(".lightbox-controls")).toContainText("2 / 3");
  await page.getByRole("button", { name: "Close gallery", exact: true }).click();
  await expect(page.locator(".gallery-dialog")).not.toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Saved to discoveries", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Back to places", exact: true }).click();
  await page.getByRole("button", { name: "Back to categories", exact: true }).click();
  await page.getByRole("button", { name: "Back to Cape Town", exact: true }).click();
  await page.getByRole("button", { name: "Back to map", exact: true }).click();
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.locator("body")).toHaveJSProperty(
    "scrollWidth",
    await page.locator("body").evaluate((el) => el.clientWidth),
  );
  expect(errors).toEqual([]);
});
test("one WebGL canvas persists through city and category routes", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Explore Durban", exact: true })).toBeVisible();
  await page.evaluate(() => {
    (window as typeof window & { originalCanvas?: HTMLCanvasElement }).originalCanvas =
      document.querySelector("canvas")!;
  });
  await page.getByRole("link", { name: "Explore Durban", exact: true }).click();
  await expect(page).toHaveURL(/\/durban$/);
  await page.getByRole("link", { name: "Explore Durban", exact: true }).click();
  await page.getByRole("button", { name: "Clubs", exact: true }).click();
  await expect(page).toHaveURL(/\/durban\/clubs$/);
  expect(
    await page.evaluate(
      () =>
        (window as typeof window & { originalCanvas?: HTMLCanvasElement }).originalCanvas ===
        document.querySelector("canvas"),
    ),
  ).toBe(true);
  await page.goBack();
  await expect(page).toHaveURL(/\/durban$/);
});
test("invalid city and cross-category place URLs return 404", async ({ request }) => {
  expect((await request.get("/unknown-city")).status()).toBe(404);
  expect((await request.get("/cape-town/clubs/kirstenbosch")).status()).toBe(404);
});
test("reset, pause and reduced motion controls stay usable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/johannesburg");
  await page.getByRole("button", { name: "Experience settings", exact: true }).click();
  await page.getByRole("button", { name: "Reset 3D view", exact: true }).click();
  await page.getByRole("button", { name: "Pause animations", exact: true }).click();
  await expect(page.getByRole("button", { name: "Play animations", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "Next landmark", exact: true }).click();
  await expect(page.locator(".landmark-open h3")).toHaveText("Nelson Mandela Bridge");
});
test("touch swipe changes landmarks; drag and pinch manipulate 3D without navigating", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Touch-specific browser check");
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/cape-town");
  await expect(page.locator(".three-view")).toBeVisible();
  await page.getByRole("button", { name: "Experience settings", exact: true }).click();
  await page.getByRole("button", { name: "Pause animations", exact: true }).click();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Experience settings" })).toHaveCount(0);
  const cdp = await page.context().newCDPSession(page);
  await page.locator(".landmark-caption").scrollIntoViewIfNeeded();
  const caption = (await page.locator(".landmark-caption").boundingBox())!;
  const x = caption.x + caption.width * 0.8,
    y = caption.y + caption.height * 0.5;
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y, id: 0 }],
  });
  for (let i = 1; i <= 6; i++)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: x - i * 30, y, id: 0 }],
    });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(page.locator(".landmark-open h3")).toHaveText("Bo-Kaap");
  await page.locator(".three-view").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Experience settings", exact: true }).click();
  await expect(page.getByRole("button", { name: "Play animations", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Experience settings" })).toHaveCount(0);
  // Wait for the short entrance flight before gestures engage the controls.
  await page.waitForTimeout(900);
  const box = (await page.locator(".three-view").boundingBox())!,
    cx = box.x + box.width / 2,
    cy = box.y + box.height / 2;
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: cx - 60, y: cy, id: 0 }],
  });
  for (let i = 1; i <= 6; i++)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: cx - 60 + i * 20, y: cy + 10, id: 0 }],
    });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(page).toHaveURL(/\/cape-town$/);
  await page.waitForTimeout(500);
  const before = await page.locator(".scene").screenshot();
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { x: cx - 30, y: cy, id: 0 },
      { x: cx + 30, y: cy, id: 1 },
    ],
  });
  for (let i = 1; i <= 6; i++)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        { x: cx - 30 - i * 9, y: cy, id: 0 },
        { x: cx + 30 + i * 9, y: cy, id: 1 },
      ],
    });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await page.waitForTimeout(500);
  const after = await page.locator(".scene").screenshot();
  expect(before.equals(after)).toBe(false);
  await expect(page).toHaveURL(/\/cape-town$/);
  expect(errors).toEqual([]);
});

test("fullscreen chapters fit compact and landscape phones, with category navigation", async ({
  page,
}) => {
  for (const viewport of [
    { width: 360, height: 640 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    for (const route of ["/", "/durban", "/durban/entertainment"]) {
      await page.goto(route);
      await expect(page.locator(".three-view")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(
        viewport.height,
      );
      const stage = (await page.locator(".three-view").boundingBox())!;
      expect(stage.height).toBeGreaterThan(100);
      expect(stage.y + stage.height).toBeLessThanOrEqual(viewport.height);
    }
    await page.getByRole("button", { name: "Clubs", exact: true }).click();
    await expect(page.getByRole("button", { name: "Clubs", exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await page.getByRole("link", { name: "Open Clubs", exact: true }).click();
    await expect(page).toHaveURL(/view=places/);
    await expect(page.locator(".place-card")).toHaveCount(3);
    await page.goBack();
    await expect(page.locator(".category-page")).toHaveCount(0);
  }
});

test("themes persist, contrast is readable, and feedback is optional", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.addInitScript(() => {
    const scope = window as typeof window & { audioStarts: number; vibrations: number };
    scope.audioStarts = 0;
    scope.vibrations = 0;
    const NativeAudio = window.AudioContext;
    window.AudioContext = class extends NativeAudio {
      constructor() {
        super();
        scope.audioStarts++;
      }
    };
    Object.defineProperty(navigator, "vibrate", {
      configurable: true,
      value: () => {
        scope.vibrations++;
        return false;
      },
    });
  });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
  await expect(page.locator(".wordmark")).toHaveAccessibleName("citylit");
  await expect(page.locator(".wordmark svg, .wordmark img")).toHaveCount(0);
  await expect(page.locator(".map-pin")).toHaveCount(0);
  await expect(page.locator("a.province-active")).toHaveCount(9);
  expect(
    await page.evaluate(() => (window as typeof window & { audioStarts: number }).audioStarts),
  ).toBe(0);
  for (const theme of ["night", "day"]) {
    if (theme === "day") await page.getByRole("button", { name: "Switch to day theme" }).click();
    const ratios = await page.evaluate(() => {
      const css = getComputedStyle(document.documentElement);
      const luminance = (hex: string) => {
        const c = hex
          .trim()
          .slice(1)
          .match(/.{2}/g)!
          .map((v) => parseInt(v, 16) / 255)
          .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
        return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
      };
      const ratio = (a: string, b: string) => {
        const x = luminance(a),
          y = luminance(b);
        return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
      };
      return [
        ratio(css.getPropertyValue("--ink"), css.getPropertyValue("--bg")),
        ratio(css.getPropertyValue("--muted"), css.getPropertyValue("--bg")),
        ratio("#ffffff", css.getPropertyValue("--accent")),
        ratio("#f4f6ff", "#111c33"),
      ];
    });
    for (const ratio of ratios) expect(ratio).toBeGreaterThanOrEqual(4.5);
  }
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "day");
  await page.getByRole("button", { name: "Experience settings", exact: true }).click();
  await page.getByRole("button", { name: "Enable sounds", exact: true }).click();
  await expect(page.getByRole("button", { name: "Mute sounds", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(
    await page.evaluate(() => (window as typeof window & { audioStarts: number }).audioStarts),
  ).toBe(1);
  await page.getByRole("button", { name: /Touch feedback on/ }).click();
  await expect(page.getByRole("button", { name: /Touch feedback off/ })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  const vibrations = await page.evaluate(
    () => (window as typeof window & { vibrations: number }).vibrations,
  );
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "Switch to night theme" }).click();
  expect(
    await page.evaluate(() => (window as typeof window & { vibrations: number }).vibrations),
  ).toBe(vibrations);
  await page.reload();
  await page.getByRole("button", { name: "Experience settings", exact: true }).click();
  await expect(page.getByRole("button", { name: "Enable sounds", exact: true })).toBeVisible();
  expect(
    await page.evaluate(() => (window as typeof window & { audioStarts: number }).audioStarts),
  ).toBe(0);
});

test("linked breadcrumbs, two-line introductions and province chooser", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Browse city guides", exact: true })).toBeVisible();
  await expect(page.locator(".map-pin")).toHaveCount(0);
  await page.getByRole("button", { name: "9 provinces ready to explore", exact: true }).click();
  await page
    .getByRole("navigation", { name: "Available provinces" })
    .getByRole("link", { name: /Western Cape/ })
    .first()
    .click();
  await expect(page).toHaveURL(/cape-town$/);
  const trail = page.getByRole("navigation", { name: "Breadcrumb", exact: true });
  await expect(trail.getByRole("link", { name: "Cape Town", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await page.getByRole("link", { name: "Explore Cape Town", exact: true }).click();
  await expect(trail.getByRole("link", { name: "Entertainment", exact: true })).toHaveAttribute(
    "href",
    "/cape-town/entertainment",
  );
  await page.getByPlaceholder("Search places").fill("Kirstenbosch");
  await page.locator(".place-open").click();
  await expect(trail.getByRole("link", { name: "Kirstenbosch", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await trail.getByRole("link", { name: "Parks & zoos", exact: true }).click();
  await expect(page).toHaveURL(/cape-town\/parks-zoos$/);
  const description = page.locator(".heading-description");
  const height = await description.evaluate((el) => ({
    height: el.getBoundingClientRect().height,
    line: parseFloat(getComputedStyle(el).lineHeight),
  }));
  expect(height.height).toBeLessThanOrEqual(height.line * 2 + 1);
  await trail.getByRole("link", { name: "South Africa", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("opened category is a themed field guide with persistent tabs and search", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/johannesburg/lodging?view=places");
  await expect(page.locator("h1")).toHaveText("Lodging");
  await expect(page.locator(".category-page-model .three-view")).toBeVisible();
  await expect(page.locator(".place-card")).toHaveCount(3);
  await expect(page.getByRole("button", { name: "Lodging", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await page.getByRole("button", { name: "Entertainment", exact: true }).click();
  await expect(page).toHaveURL(/johannesburg\/entertainment\?view=places$/);
  await expect(page.locator("h1")).toHaveText("Entertainment");
  await expect(page.locator(".place-card")).toHaveCount(7);
  await page.getByPlaceholder("Search places").fill("Apartheid");
  await expect(page.locator(".place-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Clear search", exact: true }).click();
  await expect(page.locator(".place-card")).toHaveCount(7);
  await expect(page).toHaveURL(/view=places$/);
  await page.getByRole("button", { name: "Switch to day theme", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "day");
  await expect(page.locator(".glass-category-tabs")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(1);
  await page.getByRole("button", { name: "Back to categories", exact: true }).click();
  await expect(page).toHaveURL(/johannesburg\/entertainment$/);
  await expect(page.locator(".category-page")).toHaveCount(0);
});

test("glass category selector keeps icons upright and inputs at 16px", async ({ page }) => {
  await page.goto("/durban/entertainment");
  const nav = page.locator(".glass-category-compact");
  await expect(nav.locator("[data-category-icon]")).toHaveCount(5);
  await expect(nav.locator(".glass-active-pill")).toHaveCount(1);
  await expect(page.getByPlaceholder("Search places")).toHaveCSS("font-size", "16px");
  const lodging = nav.getByRole("button", { name: "Lodging", exact: true });
  await lodging.click();
  await expect(page).toHaveURL(/durban\/lodging$/);
  await expect(lodging).toHaveAttribute("aria-current", "page");
  await expect(lodging.locator(".glass-category-icon")).toHaveCSS("transform", "none");
  await lodging.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/durban\/theatres$/);
  await page.goto("/durban/theatres?view=places");
  await expect(page.getByPlaceholder("Search places")).toHaveCSS("font-size", "16px");
  await expect(page.locator(".glass-category-tabs .glass-active-pill")).toHaveCount(1);
});

test("place context expands attributed about copy and links confirmed facts and shared sites", async ({
  page,
}) => {
  await page.goto("/cape-town/lodging/the-silo-hotel");
  await expect(page.getByRole("heading", { name: "About", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Good to know", exact: true })).toBeVisible();
  await page.getByRole("link", { name: /Zeitz MOCAA/ }).click();
  await expect(page).toHaveURL(/cape-town\/entertainment\/zeitz-mocaa$/);
  const more = page.getByRole("button", { name: "More", exact: true });
  await more.click();
  await expect(page.getByRole("button", { name: "Less", exact: true })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await expect(page.locator(".context-license")).toHaveAttribute(
    "href",
    "https://creativecommons.org/licenses/by-sa/4.0/",
  );
  await page.goto("/durban/lodging/southern-sun-elangeni-maharani");
  await expect(page.getByRole("link", { name: "Free unlimited Wi-Fi" })).toHaveAttribute(
    "href",
    "https://www.southernsun.com/southern-sun-elangeni-maharani",
  );
  await expect(page.locator(".venue-facts li")).toHaveCount(3);
});
