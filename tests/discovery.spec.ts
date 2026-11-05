import { test, expect } from "./legacy-fixture";
test("map to place, sources, photos, saves and back navigation", async ({ page }) => {
  test.slow(); // Includes the full map, carousel, category, gallery and return journey.
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
  await page.locator(".landmark-caption").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".landmark-open h3")).toHaveText("Bo-Kaap");
  await page.getByRole("link", { name: "Explore Cape Town", exact: true }).click();
  await expect(page.locator(".place-card")).toHaveCount(0);
  await page.locator(".three-view").click();
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
test("essential motion keeps exploring usable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/johannesburg");
  await expect(page.locator(".brand-world")).toHaveAttribute("data-khwezi-motion", "still");
  // The 2026 simplified guide exposes theme directly; the separate
  // Experience settings dialog and its sound/haptic toggles were removed.
  // Theme changes must not play audio or trigger incidental vibration.
  await expect(page.getByRole("button", { name: "Switch to night theme" })).toBeVisible();
  await page.getByRole("button", { name: "Switch to night theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
  await expect(page.getByRole("button", { name: "Switch to day theme" })).toBeVisible();
  expect(
    await page.evaluate(() => (window as typeof window & { audioStarts: number }).audioStarts),
  ).toBe(0);
  expect(
    await page.evaluate(() => (window as typeof window & { vibrations: number }).vibrations),
  ).toBe(0);

});

test("province chooser, place trail and a short introduction", async ({ page }) => {
  test.slow();
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
  await expect(page.getByRole("navigation", { name: "Breadcrumb", exact: true })).toHaveCount(0);
  await page.getByRole("link", { name: "Explore Cape Town", exact: true }).click();
  await expect(page).toHaveURL(/\/cape-town\/entertainment$/);
  const description = page.locator(".heading-description");
  const height = await description.evaluate((el) => ({
    height: el.getBoundingClientRect().height,
    line: parseFloat(getComputedStyle(el).lineHeight),
  }));
  expect(height.height).toBeLessThanOrEqual(height.line * 2 + 1);
  await page.locator(".three-view").click();
  await page.getByPlaceholder("Search places").fill("Kirstenbosch");
  await page.locator(".place-open").click();
  const trail = page.getByRole("navigation", { name: "Breadcrumb", exact: true });
  await expect(trail.getByRole("link", { name: "Kirstenbosch", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await trail.getByRole("link", { name: "Parks & zoos", exact: true }).click();
  await expect(page).toHaveURL(/cape-town\/parks-zoos$/);
  await page.getByRole("button", { name: "Back to Cape Town", exact: true }).click();
  await page.getByRole("button", { name: "Back to map", exact: true }).click();
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
  test.slow();
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
