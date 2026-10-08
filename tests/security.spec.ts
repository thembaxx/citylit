import { test, expect } from "@playwright/test";
import { places } from "../lib/data";
import {
  normalizeDiscovery,
  normalizeCorrections,
  parseSharedTrip,
  publicHttpsUrl,
} from "../lib/client-data";

test("client schemas reject unsafe links, malformed storage and oversized itineraries", () => {
  for (const value of [
    "javascript:alert(1)",
    "http://venue.example",
    "https://127.0.0.1",
    "https://[::1]",
    "https://venue.local",
    "https://fixture:fixture@venue.example",
    "https://venue.example:8080",
    "https://venue.example/\nheader",
    null,
  ])
    expect(publicHttpsUrl(value)).toBe(false);
  expect(publicHttpsUrl("https://www.sanbi.org/gardens/")).toBe(true);
  expect(normalizeDiscovery(null).saved).toEqual([]);
  expect(
    normalizeDiscovery({
      saved: [places[0].id, places[0].id, "missing", {}],
      itinerary: places.map((p) => p.id),
      passport: "true",
      extra: true,
    }),
  ).toEqual({
    saved: [places[0].id],
    visited: [],
    itinerary: places.slice(0, 30).map((p) => p.id),
    passport: true,
    essential: false,
  });
  const city = places[0].city;
  const valid = places.find((p) => p.city === city)!;
  const other = places.find((p) => p.city !== city)!;
  expect(parseSharedTrip(`${valid.id},${valid.id},${other.id},missing`, city)).toEqual([valid.id]);
  expect(parseSharedTrip("x".repeat(4097), city)).toEqual([]);
  const correction = {
    id: "fixture",
    placeId: valid.id,
    field: "other",
    value: '<script>alert("text")</script>',
    source: "https://venue.example/",
    createdAt: "2026-10-08T00:00:00Z",
    status: "needs-review",
  };
  expect(
    normalizeCorrections([null, {}, correction, { ...correction, source: "javascript:alert(1)" }]),
  ).toEqual([correction]);
});

test("HTML uses fresh server-owned nonces and cannot be cached across visitors", async ({
  request,
}) => {
  const nonces: string[] = [];
  for (let i = 0; i < 2; i++) {
    const response = await request.get("/cape-town", {
      headers: { "x-nonce": "attacker", "Content-Security-Policy": "script-src * 'unsafe-inline'" },
    });
    const policy = response.headers()["content-security-policy"];
    const nonce = policy.match(/'nonce-([^']+)'/)?.[1];
    expect(nonce).toBeTruthy();
    expect(nonce).not.toBe("attacker");
    nonces.push(nonce!);
    expect(policy).toContain("'strict-dynamic'");
    expect(policy.split("script-src ")[1].split(";")[0]).not.toMatch(/unsafe-inline|unsafe-eval/);
    expect(policy).toContain("script-src-attr 'none'");
    expect(response.headers()["cache-control"]).toContain("no-store");
    const html = await response.text();
    const scripts = Array.from(html.matchAll(/<script\b([^>]*)>/gi), (match) => match[1]);
    expect(scripts.length).toBeGreaterThan(1);
    for (const attributes of scripts) expect(attributes).toContain(`nonce="${nonce}"`);
  }
  expect(nonces[0]).not.toBe(nonces[1]);
});

test("CSP blocks injected inline scripts and event handlers while the app works", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const state = window as unknown as { policyViolations: string[] };
    state.policyViolations = [];
    document.addEventListener("securitypolicyviolation", (event) =>
      state.policyViolations.push(event.effectiveDirective),
    );
  });
  // Inject into the actual HTML parser. DevTools page.evaluate has privileged CSP behavior.
  await page.route("**/cape-town", async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(
      "</body>",
      '<script>window.citylitInjected=true</script><img src="/missing-security-fixture.png" onerror="window.citylitEventInjected=true"></body>',
    );
    await route.fulfill({ response, body });
  });
  await page.goto("/cape-town");
  await expect(page.locator("h1")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { policyViolations: string[] }).policyViolations.length,
      ),
    )
    .toBeGreaterThanOrEqual(2);
  const result = await page.evaluate(() => {
    const state = window as unknown as Record<string, unknown>;
    return {
      script: state.citylitInjected,
      event: state.citylitEventInjected,
      violations: state.policyViolations,
    };
  });
  expect(result.script).toBeUndefined();
  expect(result.event).toBeUndefined();
  expect(result.violations).toContain("script-src-elem");
  expect(result.violations).toContain("script-src-attr");
  await expect(page.locator("canvas").first()).toBeVisible();
});

test("image optimization permits only local catalog images", async ({ request }) => {
  const src = places.find((p) => p.images.length)!.images[0].src;
  const query = (url: string) => `/_next/image?url=${encodeURIComponent(url)}&w=640&q=75`;
  const good = await request.get(query(src));
  expect(good.status()).toBe(200);
  expect(good.headers()["content-type"]).toContain("image/");
  for (const url of [
    "https://127.0.0.1/private",
    "https://upload.wikimedia.org/fixture.jpg",
    "/api/health",
    `${src}?variant=unbounded`,
  ])
    expect((await request.get(query(url))).status(), url).toBe(400);
});

test("sharing cards are precomputed and public handlers have no write behavior", async ({
  request,
}) => {
  const card = await request.get("/share/durban");
  const variant = await request.get("/share/durban?fixture=unique-query");
  expect(card.status()).toBe(200);
  expect((await variant.body()).equals(await card.body())).toBe(true);
  expect((await request.get("/share/not-a-city")).status()).toBe(404);
  expect((await request.post("/api/health", { data: { fixture: true } })).status()).toBe(405);
  // Next serves precomputed public assets for POST too; the body never changes their content.
  for (const path of ["/guides/durban", "/share/durban"]) {
    const read = await request.get(path);
    const posted = await request.post(path, { data: { fixture: true } });
    expect(posted.status()).toBe(200);
    expect((await posted.body()).equals(await read.body())).toBe(true);
  }
});

test("malformed local state does not crash discovery or editorial tools", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("citylit-discovery-v2", "null");
    localStorage.setItem("citylit-corrections", '{"not":"an array"}');
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/cape-town");
  await expect(page.locator("h1")).toBeVisible();
  await page.goto("/editorial");
  await expect(page.locator("h1")).toBeVisible();
  expect(errors).toEqual([]);
});

test("offline guide renders hostile strings as text and rejects unsafe links and images", async ({
  page,
}) => {
  const row = {
    ...places[0],
    name: "<script>window.offlineInjected=true</script>",
    website: "javascript:alert(1)",
    wikipedia: "javascript:alert(1)",
    images: [{ src: "https://evil.example/photo.svg", alt: "fixture" }],
  };
  await page.addInitScript(() => localStorage.setItem("citylit-discovery-v2", "null"));
  await page.route("**/data/places.json", (route) => route.fulfill({ json: [row] }));
  await page.goto("/offline.html#%broken");
  await page.locator("#all").click();
  await expect(page.locator("article h2")).toHaveText(row.name);
  expect(await page.locator("article img").count()).toBe(0);
  expect(await page.locator('article a[href^="javascript:"]').count()).toBe(0);
  expect(await page.evaluate(() => "offlineInjected" in window)).toBe(false);
});

test("legitimate discovery, gallery and offline flows do not violate CSP", async ({ page }) => {
  await page.addInitScript(() => {
    const state = window as unknown as { policyViolations: string[] };
    state.policyViolations = [];
    document.addEventListener("securitypolicyviolation", (event) =>
      state.policyViolations.push(`${event.effectiveDirective}: ${event.blockedURI}`),
    );
  });
  for (const path of [
    "/",
    "/cape-town",
    "/johannesburg/lodging",
    "/cape-town/parks-zoos/kirstenbosch",
    "/offline.html",
  ]) {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
    if (path.endsWith("kirstenbosch")) {
      await page.getByRole("button", { name: "Open venue photo gallery" }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
    }
    await page.waitForTimeout(300);
    expect(
      await page.evaluate(
        () => (window as unknown as { policyViolations: string[] }).policyViolations,
      ),
      path,
    ).toEqual([]);
  }
});
