import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  SITE_URL,
  allDiscoveryRoutes,
  absoluteUrl,
  discoveryMetadata,
  discoveryRoute,
  discoverySchema,
  isIndexable,
  placeUrl,
  serializeJsonLd,
} from "../lib/seo";
import { places } from "../lib/data";

const indexed = allDiscoveryRoutes().filter(isIndexable);
test("catalog metadata is unique and schemas preserve evidence boundaries", () => {
  expect(new Set(indexed.map((route) => JSON.stringify(discoveryMetadata(route).title))).size).toBe(
    indexed.length,
  );
  for (const route of allDiscoveryRoutes()) {
    const metadata = discoveryMetadata(route);
    expect(metadata.alternates?.canonical).toBe(absoluteUrl(route.path));
    expect((metadata.robots as { index: boolean }).index).toBe(isIndexable(route));
    expect((discoveryMetadata(route, true).robots as { index: boolean }).index).toBe(false);
    const schema = discoverySchema(route);
    const breadcrumbs = schema["@graph"][1] as {
      itemListElement: { position: number; item: string }[];
    };
    expect(breadcrumbs.itemListElement.map((entry) => entry.position)).toEqual(
      breadcrumbs.itemListElement.map((_, i) => i + 1),
    );
    expect(breadcrumbs.itemListElement.at(-1)?.item).toBe(absoluteUrl(route.path));
    if (route.kind !== "place") continue;
    const page = schema["@graph"][0] as { mainEntity: Record<string, unknown> };
    const entity = page.mainEntity;
    expect(Boolean(entity.geo)).toBe(route.place.coordinateAccuracy === "venue");
    expect(Boolean(entity.image)).toBe(
      route.place.imageContext === "venue" && route.place.images.length > 0,
    );
    expect(entity).not.toHaveProperty("aggregateRating");
    expect(entity).not.toHaveProperty("openingHours");
    expect(entity).not.toHaveProperty("priceRange");
  }
  const hostile = { description: '</script><script>alert("injected")</script>' };
  expect(serializeJsonLd(hostile)).not.toContain("<");
  expect(JSON.parse(serializeJsonLd(hostile))).toEqual(hostile);
});

test("sitemap only contains real canonical pages that respond successfully", async ({
  request,
}) => {
  test.setTimeout(90000);
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const urls = Array.from(
    (await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g),
    (match) => match[1],
  );
  expect(new Set(urls).size).toBe(urls.length);
  expect(urls).toContain(`${SITE_URL}/destinations`);
  expect(urls.filter((url) => url.includes("?") || url.includes("/editorial"))).toEqual([]);
  for (const route of allDiscoveryRoutes())
    expect(urls.includes(absoluteUrl(route.path))).toBe(isIndexable(route));
  // Limit concurrent requests so the full catalog check does not overload CI.
  for (let start = 0; start < urls.length; start += 6) {
    await Promise.all(
      urls.slice(start, start + 6).map(async (url) => {
        const response = await request.get(new URL(url).pathname);
        expect(response.status(), url).toBe(200);
      }),
    );
  }
});

test("HTML exposes route metadata, citations and canonical links before hydration", async ({
  request,
}) => {
  const route = discoveryRoute(["cape-town", "parks-zoos", "kirstenbosch"])!;
  const response = await request.get(route.path, { headers: { "User-Agent": "Googlebot" } });
  const html = await response.text();
  expect(html).toContain(
    '<link rel="canonical" href="https://citylit.vercel.app/cape-town/parks-zoos/kirstenbosch"',
  );
  expect(html).toContain("Kirstenbosch in Cape Town | Citylit");
  const scripts = Array.from(
    html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g),
    (match) => JSON.parse(match[1]),
  );
  expect(scripts).toContainEqual(discoverySchema(route));
  const filtered = await request.get("/johannesburg/lodging?q=hotel", {
    headers: { "User-Agent": "Googlebot" },
  });
  expect(await filtered.text()).toContain('name="robots" content="noindex, follow"');
  for (const path of [
    "/not-a-city",
    "/durban/parks-zoos/kirstenbosch",
    "/cape-town/lodging/kirstenbosch",
  ]) {
    expect((await request.get(path)).status(), path).toBe(404);
  }
});

test("AI-readable guides expose sources and distinguish city reference data", async ({
  request,
}) => {
  const robots = await request.get("/robots.txt");
  expect(await robots.text()).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
  const index = await request.get("/llms.txt");
  expect(index.headers()["content-type"]).toContain("text/plain");
  expect(await index.text()).toContain("/llms-full.txt");
  const full = await request.get("/llms-full.txt");
  const catalog = await full.text();
  for (const place of places) expect(catalog).toContain(absoluteUrl(placeUrl(place)));
  const approximate = places.find((place) => place.coordinateAccuracy === "city")!;
  const guide = await request.get(`/guides${placeUrl(approximate)}`);
  expect(guide.headers()["content-type"]).toContain("text/markdown");
  expect(guide.headers()["link"]).toContain(absoluteUrl(placeUrl(approximate)));
  const content = await guide.text();
  expect(content).toMatch(/CITY REFERENCE ONLY; venue coordinates unknown/);
  expect(content).toContain(approximate.sources[0].url);
  expect(content).toContain(approximate.checkedAt);
  expect(content).toContain(approximate.images[0].license);
  expect((await request.get("/guides")).status()).toBe(200);
  expect((await request.get("/guides/provinces/gauteng")).status()).toBe(200);
  expect((await request.get("/guides/durban/parks-zoos/kirstenbosch")).status()).toBe(404);
});

test("social cards are valid PNGs for country, city and place", async ({ request }) => {
  test.setTimeout(60000);
  const cards: Buffer[] = [];
  for (const path of ["/share", "/share/durban", "/share/cape-town/parks-zoos/kirstenbosch"]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/png");
    const bytes = await response.body();
    expect(bytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    expect(bytes.readUInt32BE(16)).toBe(1200);
    expect(bytes.readUInt32BE(20)).toBe(630);
    cards.push(bytes);
  }
  expect(cards[0].equals(cards[1])).toBe(false);
  expect((await request.get("/share/not-a-city")).status()).toBe(404);
});

test("discovery works as a readable guide with JavaScript disabled", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
    viewport: { width: 390, height: 844 },
  });
  try {
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.locator(".no-script-guide h1")).toHaveText("Discover South Africa");
    await page.locator('.no-script-guide a[href="/cape-town"]').click();
    await expect(page.locator(".no-script-guide h1")).toHaveText("Things to do in Cape Town");
    await page
      .locator('.no-script-guide a[href="/cape-town/parks-zoos/kirstenbosch"]')
      .first()
      .click();
    await expect(page.locator(".no-script-guide h1")).toHaveText("Kirstenbosch in Cape Town");
    await expect(page.locator('.no-script-guide a[href*="sanbi.org"]').first()).toBeVisible();
    expect(await page.evaluate(() => document.body.scrollWidth > innerWidth)).toBe(false);
  } finally {
    await context.close();
  }
});

for (const path of [
  "/",
  "/cape-town",
  "/johannesburg/lodging?view=places",
  "/cape-town/parks-zoos/kirstenbosch",
  "/destinations",
  "/privacy",
]) {
  test(`WCAG accessibility on ${path}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
    // Let initial Motion transitions settle before testing visibility and contrast.
    await page.waitForTimeout(500);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(result.violations).toEqual([]);
  });
}

test("street-map failures retain a usable map link and named gallery", async ({ page }) => {
  await page.route("https://tile.openstreetmap.org/**", (route) => route.abort());
  await page.goto("/cape-town/parks-zoos/kirstenbosch");
  await expect(page.locator(".map-fallback")).toContainText("couldn’t load");
  await expect(page.getByRole("link", { name: "Open street map ↗", exact: true })).toHaveAttribute(
    "href",
    /^https:\/\/www.openstreetmap.org\/\?mlat=/,
  );
  await page.getByRole("button", { name: "Open venue photo gallery" }).click();
  await expect(page.getByRole("dialog", { name: "Kirstenbosch photograph gallery" })).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});
