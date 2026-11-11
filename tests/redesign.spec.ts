import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { cities, places } from "../lib/data";
import { landmarkPath, planningStops } from "../lib/discovery-guide";

// Theme choices live in the guide settings sheet; the header control only
// opens the sheet so that browsing settings never changes the theme.
async function setGuideTheme(page: Page, theme: "day" | "night") {
  if ((await page.locator("html").getAttribute("data-theme")) === theme) return;
  await page.getByRole("button", { name: "Open settings", exact: true }).click();
  await page.getByRole("button", { name: theme === "day" ? "Light" : "Dark", exact: true }).click();
  await page.getByRole("button", { name: "Close settings", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
}

test("beacon to city to landmark to a saved visit works end to end", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("Follow your curiosity");
  for (const field of await page.locator(".discovery-guide input, .discovery-guide select").all())
    await expect(field).toHaveCSS("font-size", "16px");
  await page.getByRole("tab", { name: "Explore", exact: true }).click();
  await expect(page.locator(".living-atlas-city-card h3")).toHaveText("Johannesburg");
  await page.getByRole("tab", { name: "Big views", exact: true }).click();
  await expect(page.locator(".living-atlas-city-card h3")).toHaveText("Cape Town");
  await page.getByRole("link", { name: "Enter the city", exact: true }).click();
  await expect(page).toHaveURL(/\/cape-town$/);
  await page
    .locator("#landmarks")
    .getByRole("link", { name: "Table Mountain", exact: true })
    .click();
  await expect(page).toHaveURL(/cape-town\/parks-zoos\/table-mountain$/);
  await expect(page.locator("h1")).toHaveText("Table Mountain.");
  await expect(page.getByRole("link", { name: "Visit official website" })).toHaveAttribute(
    "href",
    "https://www.tablemountain.net/",
  );
  await page.getByRole("button", { name: "Save Table Mountain", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Unsave Table Mountain", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Open venue photo gallery" }).click();
  await expect(page.locator(".gallery-dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".gallery-dialog")).not.toBeVisible();
  await page.getByRole("button", { name: "Mark visited", exact: true }).click();
  await expect(page.locator(".visit-stamp")).toContainText("Passport stamped");
  await page.getByRole("button", { name: "Add to day", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Added to your day." })).toBeVisible();
  await page.reload();
  await expect(page.locator(".visit-stamp")).toContainText("Passport stamped");
  await expect(
    page.getByRole("button", { name: "Unsave Table Mountain", exact: true }),
  ).toBeVisible();
  await page
    .locator(".citylit-bottom-dock")
    .getByRole("link", { name: "My day", exact: true })
    .click();
  await expect(page.locator(".trip-stops")).toContainText("Table Mountain");
  expect(errors).toEqual([]);
});

test("every landmark has a real detail destination and unmatched stories open", async ({
  page,
  request,
}) => {
  test.setTimeout(90000);
  const paths = new Set(
    cities.flatMap((city) => city.landmarks.map((name) => landmarkPath(city, name))),
  );
  // A sequential HTTP request for every landmark can exhaust the 90s
  // E2E budget under CI load. Keep full route coverage with bounded concurrency.
  const allPaths = [...paths];
  for (let i = 0; i < allPaths.length; i += 6) {
    await Promise.all(
      allPaths
        .slice(i, i + 6)
        .map(async (path) => expect((await request.get(path)).status(), path).toBe(200)),
    );
  }
  await page.goto("/johannesburg");
  await page.locator(".atlas-landmark-link").filter({ hasText: "Ponte City" }).click();
  await expect(page).toHaveURL(/landmark=ponte-city/);
  await expect(page.locator("h1")).toHaveText("Ponte City.");
  await expect(page.getByText("Current visiting hours", { exact: false })).toBeVisible();
  await page.getByRole("link", { name: "Back to Johannesburg" }).click();
  await expect(page).toHaveURL(/johannesburg#landmarks$/);
  expect((await request.get("/johannesburg?landmark=missing-landmark")).status()).toBe(404);
});

test("city search, province filters and empty-state reset work", async ({ page }) => {
  await page.goto("/destinations");
  await expect(page.locator(".atlas-city-card")).toHaveCount(12);
  await page.getByLabel("Filter by province").selectOption("Western Cape");
  await expect(page.locator(".atlas-city-card")).toHaveCount(2);
  await page.getByRole("searchbox", { name: "Search city guides" }).fill("Stellenbosch");
  await expect(page.locator(".atlas-city-card")).toHaveCount(1);
  await page.getByRole("searchbox", { name: "Search city guides" }).fill("no-such-city");
  await expect(page.getByRole("heading", { name: "No cities found." })).toBeVisible();
  await page.getByRole("button", { name: "Show all cities" }).click();
  await expect(page.locator(".atlas-city-card")).toHaveCount(12);
});

test("the particle map clears as the guide scrolls to city cards", async ({ page }) => {
  await page.goto("/destinations");
  await expect(
    page.getByRole("button", { name: "Choose Johannesburg", exact: true }),
  ).toBeInViewport();
  await page.locator(".discovery-guide").evaluate((guide) => {
    guide.scrollTo({ top: window.innerHeight, behavior: "instant" });
  });
  // The reference map stays fixed; scrolling fades its renderer and removes
  // the city controls from interaction and the accessibility tree.
  await expect(page.locator(".atlas-map-backdrop")).toHaveAttribute("aria-hidden", "true");
  await expect(page.locator(".glow-map")).toHaveAttribute("data-interactive", "false");
  await expect(page.getByRole("button", { name: "Choose Johannesburg", exact: true })).toHaveCount(
    0,
  );
  await page.screenshot({ scale: "css", path: test.info().outputPath("city-collection.png") });
  await page.locator(".atlas-city-card-link").first().click();
  await expect(page.locator(".atlas-city-hero h1")).toBeInViewport({ ratio: 1 });
});

test("place filters survive detail navigation and empty search resets", async ({ page }) => {
  await page.goto("/johannesburg#places");
  await page.getByRole("button", { name: "Entertainment", exact: true }).click();
  await page.getByRole("searchbox", { name: "Search places" }).fill("Apartheid");
  await expect(page.locator(".atlas-place-card")).toHaveCount(1);
  await page.locator(".atlas-place-card-link").click();
  await expect(page.locator("h1")).toHaveText("Apartheid Museum.");
  await page.goBack();
  await expect(page.getByRole("searchbox", { name: "Search places" })).toHaveValue("Apartheid");
  await expect(page.locator(".atlas-place-card")).toHaveCount(1);
  await page.getByRole("searchbox", { name: "Search places" }).fill("no-such-place");
  await page.getByRole("button", { name: "Show all places" }).click();
  await expect(page.locator(".atlas-place-card")).toHaveCount(
    places.filter((p) => p.city === "johannesburg").length,
  );
});

test("plan cards open venues and day picks persist without replacing another city", async ({
  page,
}) => {
  const stops = planningStops("stellenbosch");
  await page.goto("/stellenbosch#plan");
  await page.locator(".atlas-plan-stop-link").first().click();
  await expect(page.locator("h1")).toContainText(stops[0].name);
  await page.goBack();
  const add = page.locator(".atlas-plan-stop").first().getByRole("button");
  await add.click();
  await expect(add).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(page.locator(".atlas-plan-stop").first().getByRole("button")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.goto("/mahikeng#plan");
  await page.locator(".atlas-plan-stop").first().getByRole("button").click();
  await expect(page.locator(".atlas-plan-bottom [role=status]")).toContainText("another city");
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("citylit-discovery-v2") || "{}").itinerary,
    ),
  ).toEqual([stops[0].id]);
});

test("saved view switches cleanly between the guide and original 3D experience", async ({
  page,
}) => {
  await page.goto("/johannesburg?view=3d");
  await expect(page.locator(".game-screen")).toBeVisible();
  await page.getByRole("link", { name: "Read guide" }).click();
  await expect(page.locator(".discovery-guide")).toBeVisible();
  await page.reload();
  await expect(page.locator(".atlas-city-hero")).toBeVisible();
});

for (const width of [320, 768, 1024, 1440]) {
  test(`guide layout fits ${width}px in both themes`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: "light" });
    for (const route of [
      "/",
      "/johannesburg",
      "/destinations",
      "/kimberley/entertainment/the-big-hole",
    ]) {
      await page.goto(route);
      await expect(page.locator(".discovery-guide")).toBeVisible();
      for (const theme of ["day", "night"] as const) {
        await setGuideTheme(page, theme);
        const overflow = await page
          .locator(".discovery-guide")
          .evaluate((el) => el.scrollWidth > el.clientWidth + 1);
        if (overflow) {
          const culprits = await page.locator(".discovery-guide").evaluate((root) => {
            const edge = root.getBoundingClientRect().right;
            return Array.from(root.querySelectorAll("*"))
              .map((node) => ({
                tag: node.tagName,
                className: typeof node.className === "string" ? node.className.slice(0, 90) : "",
                overflowRight: Math.round(node.getBoundingClientRect().right - edge),
              }))
              .filter((node) => node.overflowRight > 1)
              .sort((a, b) => b.overflowRight - a.overflowRight)
              .slice(0, 8);
          });
          console.log("Citylit layout overflow:", route, width, theme, JSON.stringify(culprits));
        }
        expect(overflow, `${route} at ${width}px, ${theme}`).toBe(false);
        if (width === 1440 && route === "/")
          await expect(page.getByRole("heading", { level: 1 })).toBeInViewport();
        if (theme === "day" && width === 320 && route === "/johannesburg")
          await page.screenshot({ scale: "css", path: "docs/redesign/05-city-mobile.png" });
        if (theme === "day" && width === 1440 && route === "/")
          await page.screenshot({ scale: "css", path: "docs/redesign/03-home-desktop.png" });
        if (theme === "day" && width === 1440 && route === "/johannesburg")
          await page.screenshot({ scale: "css", path: "docs/redesign/04-city-desktop.png" });
        if (theme === "night" && width === 1440 && route.includes("the-big-hole"))
          await page.screenshot({ scale: "css", path: "docs/redesign/06-venue-dark.png" });
      }
    }
    expect(errors).toEqual([]);
  });
}

test("primary guide screens have no serious accessibility violations", async ({ page }) => {
  test.setTimeout(90000);
  for (const route of [
    "/",
    "/johannesburg",
    "/destinations",
    "/cape-town/parks-zoos/kirstenbosch",
  ]) {
    await page.goto(route);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      result.violations.filter((v) => v.impact === "serious" || v.impact === "critical"),
      route,
    ).toEqual([]);
  }
});

test("planner and offline settings are accessible in both themes", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto("/explore?city=cape-town&tab=passport");
  for (const theme of ["day", "night"] as const) {
    await setGuideTheme(page, theme);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(result.violations, theme).toEqual([]);
  }
});

test("the original 3D field guide remains readable in the night theme", async ({
  page,
  context,
}) => {
  await context.addCookies([{ name: "citylit-view", value: "3d", url: "http://localhost:3000" }]);
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto("/johannesburg/lodging?view=places");
  await expect(page.locator(".category-page h1")).toHaveText("Lodging");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(result.violations).toEqual([]);
});

test("denied storage reports a save failure and all guide links work without JavaScript", async ({
  page,
  browser,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/mahikeng#plan");
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Denied", "SecurityError");
    };
  });
  await page.locator(".atlas-plan-stop").first().getByRole("button").click();
  await expect(page.locator(".atlas-plan-bottom [role=status]")).toContainText("could not save");
  await page.goto("/cape-town/parks-zoos/table-mountain");
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Denied", "SecurityError");
    };
  });
  await page.getByRole("button", { name: "Save Table Mountain", exact: true }).click();
  await expect(page.locator(".atlas-save-place [role=status]")).toContainText("Unable to save");
  await page.getByRole("button", { name: "Mark visited", exact: true }).click();
  await expect(page.locator(".place-planning [role=status]")).toContainText(
    "could not save your visit",
  );
  await page.goto("/explore?city=cape-town");
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Denied", "SecurityError");
    };
  });
  await page.locator(".adventure-card-actions button").first().click();
  await expect(page.locator(".hub-message")).toContainText("could not save your day");
  const context = await browser.newContext({ javaScriptEnabled: false });
  const plain = await context.newPage();
  await plain.goto("http://localhost:3000/johannesburg");
  await plain.locator(".atlas-landmark-link").filter({ hasText: "Constitution Hill" }).click();
  await expect(plain.locator("h1")).toHaveText("Constitution Hill.");
  await context.close();
});
