import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { sharedPlace } from "../lib/pwa-share";

async function prepare(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller)
      await new Promise<void>((resolve) =>
        navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), {
          once: true,
        }),
      );
  });
}

test("manifest, launch metadata, shortcuts and generated worker release are usable", async ({
  request,
}) => {
  const response = await request.get("/manifest.webmanifest");
  const manifest = await response.json();
  expect(manifest).toMatchObject({
    id: "/",
    scope: "/",
    display: "standalone",
    lang: "en-ZA",
    share_target: { action: "/explore", method: "GET" },
  });
  expect(manifest.shortcuts.map((entry: { url: string }) => entry.url)).toContain(
    "/explore?tab=passport",
  );
  for (const shot of manifest.screenshots) expect((await request.get(shot.src)).status()).toBe(200);
  for (const icon of manifest.icons.filter((icon: { type: string }) => icon.type === "image/png"))
    expect((await request.get(icon.src)).status()).toBe(200);
  const html = await (await request.get("/")).text();
  expect(html).toContain("viewport-fit=cover");
  expect(html).toContain("interactive-widget=resizes-content");
  expect(html).not.toContain("user-scalable=no");
  expect(html).toContain('name="mobile-web-app-capable" content="yes"');
  const release = await request.get("/pwa-release.js");
  expect(await release.text()).toMatch(/CITYLIT_PWA_RELEASE = "[a-f0-9]{16}"/);
  expect(release.headers()["cache-control"]).toContain("no-store");
});

test("install prompt requires a click and installed apps stop advertising installation", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Experience settings", exact: true }).click();
  await page.evaluate(() => {
    const state = window as unknown as { installCalls: number };
    state.installCalls = 0;
    const event = new Event("beforeinstallprompt", { cancelable: true });
    Object.assign(event, {
      prompt: async () => {
        state.installCalls++;
        window.dispatchEvent(new Event("appinstalled"));
      },
      userChoice: Promise.resolve({ outcome: "accepted" }),
    });
    window.dispatchEvent(event);
  });
  expect(
    await page.evaluate(() => (window as unknown as { installCalls: number }).installCalls),
  ).toBe(0);
  await page.getByRole("button", { name: "Install Citylit", exact: true }).click();
  expect(
    await page.evaluate(() => (window as unknown as { installCalls: number }).installCalls),
  ).toBe(1);
  await expect(page.getByText("Home-screen app installed")).toBeVisible();
  await expect(page.getByRole("button", { name: "Install Citylit", exact: true })).toHaveCount(0);
});

test("iPhone install instructions, native sheet focus and both themes are accessible", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 390, height: 844 },
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Version/18.5 Mobile/15E148 Safari/604.1",
  });
  const page = await context.newPage();
  try {
    await page.goto("/");
    await page.getByRole("button", { name: "Experience settings", exact: true }).click();
    const sheet = page.getByRole("dialog", { name: "Experience settings", exact: true });
    expect(await sheet.evaluate((element) => element.matches(":modal"))).toBe(true);
    const bounds = (await sheet.boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(10);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(380);
    await page.getByRole("button", { name: "Add to Home Screen", exact: true }).click();
    await expect(sheet).toContainText("In Safari, open Share");
    for (const theme of ["day", "night"]) {
      await page.evaluate((value) => {
        document.documentElement.dataset.theme = value;
      }, theme);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(results.violations).toEqual([]);
    }
    await page.keyboard.press("Escape");
    await expect(sheet).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Experience settings", exact: true }),
    ).toBeFocused();
  } finally {
    await context.close();
  }
});

test("cold offline city launch keeps route context, search, saves, day editing and detail history", async ({
  page,
  context,
}) => {
  await prepare(page);
  await context.setOffline(true);
  await page.goto("/cape-town/parks-zoos/kirstenbosch");
  await expect(page.getByRole("heading", { name: "Kirstenbosch", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Save discovery", exact: true }).click();
  await page.getByRole("button", { name: "Add to day", exact: true }).click();
  await page.getByRole("button", { name: "Browse cached places", exact: true }).click();
  await page.getByPlaceholder("Search places").fill("Kirstenbosch");
  await expect(page.locator("article")).toHaveCount(1);
  await page.getByRole("link", { name: "Open discovery ↗", exact: true }).click();
  await expect(page.getByRole("heading", { name: "About", exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("link", { name: "Open discovery ↗", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "My day", exact: true }).click();
  await expect(page.locator("article")).toHaveCount(1);
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("citylit-discovery-v2")!),
  );
  expect(saved.saved).toContain("kirstenbosch");
  expect(saved.itinerary).toEqual(["kirstenbosch"]);
  await page.reload();
  await expect(page.locator("article h2")).toHaveText("Kirstenbosch");
  for (const input of await page.locator("input,select").all())
    await expect(input).toHaveCSS("font-size", "16px");
  expect(await page.evaluate(() => document.body.scrollWidth > innerWidth)).toBe(false);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
  await context.setOffline(false);
});

test("offline client navigation opens the guide instead of failing an RSC transition", async ({
  page,
  context,
}) => {
  await prepare(page);
  await context.setOffline(true);
  await expect(page.getByRole("complementary", { name: "App status" })).toBeVisible();
  await page.getByRole("button", { name: "Dismiss app status" }).click();
  await page.getByRole("link", { name: "Explore Cape Town", exact: true }).click();
  await expect(page).toHaveURL(/\/cape-town$/);
  await expect(
    page.getByRole("heading", { name: "Your sparks travel with you.", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Destination", exact: true })).toHaveValue(
    "cape-town",
  );
  await context.setOffline(false);
});

test("photo downloads count retained caches and clearing photos keeps saves and guide text", async ({
  page,
  context,
}) => {
  await page.goto("/cape-town/parks-zoos/kirstenbosch");
  await page.getByRole("button", { name: "Save this discovery", exact: true }).click();
  await page.goto("/explore?tab=passport");
  const panel = page.getByRole("region", { name: "Citylit app and offline settings" });
  await panel.getByRole("button", { name: "Download photos", exact: true }).click();
  await expect(panel).toContainText("Your pocket guide is ready to travel.", { timeout: 15000 });
  await expect(panel).toContainText("1 downloaded photos");
  const photos = sharedPlace(
    "https://citylit.vercel.app/cape-town/parks-zoos/kirstenbosch",
  )!.images;
  await page.evaluate(
    async (urls) => {
      const retained = await caches.open("citylit-field-guide-retained-fixture");
      for (const url of urls) await retained.put(url, await fetch(url));
    },
    photos.slice(0, 2).map((image) => image.src),
  );
  await panel.getByRole("button", { name: "Download photos", exact: true }).click();
  await expect(panel).toContainText("2 downloaded photos");
  await panel.getByRole("button", { name: "Remove photos", exact: true }).click();
  await expect(panel).toContainText("0 downloaded photos");
  await context.setOffline(true);
  await page.goto("/offline.html");
  await expect(page.locator("article h2")).toHaveText("Kirstenbosch");
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem("citylit-discovery-v2")!).saved),
  ).toContain("kirstenbosch");
  await context.setOffline(false);
});

test("share targets accept only known public places and support offline launch", async ({
  page,
  context,
}) => {
  const value = "https://citylit.vercel.app/cape-town/parks-zoos/kirstenbosch";
  expect(sharedPlace(value)?.id).toBe("kirstenbosch");
  expect(sharedPlace("https://citylit.vercel.app/durban/parks-zoos/kirstenbosch")).toBeUndefined();
  expect(sharedPlace("javascript:alert(1)")).toBeUndefined();
  await page.goto(`/explore?shared-url=${encodeURIComponent(value)}`);
  const incoming = page.getByRole("region", { name: "Shared discovery" });
  await expect(incoming).toContainText("Kirstenbosch");
  await incoming.getByRole("button", { name: "Save shared discovery", exact: true }).click();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Kirstenbosch", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Saved", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await context.setOffline(false);
});

test("waiting worker updates only after consent and reload preserves saved places", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const sw = Object.assign(new EventTarget(), {
      controller: {},
      register: async () => registration,
    });
    const active = {
      postMessage: (_message: unknown, ports: MessagePort[]) =>
        ports[0].postMessage({ ok: true, textSaved: true, photoCount: 0 }),
    };
    const registration = Object.assign(new EventTarget(), {
      active,
      installing: null,
      waiting: localStorage.getItem("pwa-updated")
        ? null
        : {
            postMessage: (message: { type: string }) => {
              if (message.type !== "SKIP_WAITING") throw new Error("Wrong message");
              localStorage.setItem("pwa-updated", "yes");
              sw.controller = registration.waiting!;
              registration.waiting = null;
              sw.dispatchEvent(new Event("controllerchange"));
            },
          },
      update: async () => {},
    });
    Object.defineProperty(navigator, "serviceWorker", { value: sw, configurable: true });
    if (!localStorage.getItem("citylit-discovery-v2"))
      localStorage.setItem("citylit-discovery-v2", JSON.stringify({ saved: ["kirstenbosch"] }));
  });
  await page.goto("/cape-town");
  await expect(page.getByRole("button", { name: "Update now", exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("pwa-updated"))).toBeNull();
  await page.getByRole("button", { name: "Experience settings", exact: true }).click();
  await expect(page.getByRole("button", { name: "Download photos", exact: true })).toBeDisabled();
  await expect(page.getByText("Update Citylit to use the latest offline controls.")).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await Promise.all([
    page.waitForEvent("load"),
    page.getByRole("button", { name: "Update now", exact: true }).click(),
  ]);
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem("citylit-discovery-v2")!).saved),
  ).toEqual(["kirstenbosch"]);
  await expect(page.getByRole("button", { name: "Update now", exact: true })).toHaveCount(0);
});

test("native chrome follows theme and hidden apps pause continuous scenery", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Switch to .* theme/ }).click();
  await expect
    .poll(() => page.locator('meta[name="theme-color"]').getAttribute("content"))
    .toBe(
      await page.evaluate(() =>
        document.documentElement.dataset.theme === "day" ? "#f6f3ed" : "#080f20",
      ),
    );
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator(".brand-world")).toHaveAttribute("data-khwezi-motion", "still");
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator(".brand-world")).toHaveAttribute("data-khwezi-motion", "play");
});

const source = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
test("worker does not cache nonce HTML, RSC, health or foreign tiles and waits for consent", async () => {
  const handlers: Record<string, (event: any) => void> = {};
  let activation = 0;
  let settled: Promise<unknown> | undefined;
  const requested: string[] = [];
  const cache = {
    addAll: async (requests: Request[]) =>
      requested.push(...requests.map((request) => new URL(request.url).pathname)),
  };
  runInNewContext(source, {
    URL,
    Request,
    Response,
    AbortController,
    setTimeout,
    clearTimeout,
    self: {
      location: { origin: "https://citylit.vercel.app" },
      addEventListener: (name: string, handler: (event: any) => void) => (handlers[name] = handler),
      skipWaiting: async () => {
        activation++;
      },
    },
    caches: { open: async () => cache },
    fetch: async () => new Response("fixture"),
  });
  handlers.install({ waitUntil: (promise: Promise<unknown>) => (settled = promise) });
  await settled;
  expect(activation).toBe(0);
  expect(requested).toContain("/offline.html");
  expect(requested).not.toContain("/");
  for (const url of [
    "https://citylit.vercel.app/api/health",
    "https://citylit.vercel.app/cape-town?_rsc=fixture",
    "https://tile.openstreetmap.org/0/0/0.png",
  ]) {
    let intercepted = false;
    handlers.fetch({
      request: { url, method: "GET", mode: "cors" },
      respondWith: () => {
        intercepted = true;
      },
    });
    expect(intercepted, url).toBe(false);
  }
  handlers.message({
    origin: "https://other.example",
    data: { type: "SKIP_WAITING" },
    waitUntil: () => {},
  });
  expect(activation).toBe(0);
  handlers.message({
    origin: "https://citylit.vercel.app",
    data: { type: "SKIP_WAITING" },
    waitUntil: (promise: Promise<unknown>) => (settled = promise),
  });
  await settled;
  expect(activation).toBe(1);
});

test("gallery supports downward dismissal, Escape and restores native focus", async ({
  page,
  isMobile,
}) => {
  await page.goto("/cape-town/parks-zoos/kirstenbosch");
  const opener = page.getByRole("button", { name: "Open venue photo gallery", exact: true });
  await opener.click();
  const dialog = page.getByRole("dialog", { name: "Kirstenbosch photograph gallery" });
  await expect(dialog).toBeVisible();
  const box = (await dialog.locator(".lightbox-image-area").boundingBox())!;
  const x = box.x + box.width / 2,
    y = box.y + box.height / 3;
  if (isMobile) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y, id: 0 }],
    });
    for (let step = 1; step <= 8; step++)
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x, y: y + step * 20, id: 0 }],
      });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await cdp.detach();
  } else {
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x, y + 160, { steps: 8 });
    await page.mouse.up();
  }
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
  await opener.click();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
});

test("quota-retained caches provide photos without overriding the current offline reader", async () => {
  const handlers: Record<string, (event: any) => void> = {};
  let reply: Promise<Response> | undefined;
  const current = {
    match: async (request: string | Request) => {
      const path = typeof request === "string" ? request : new URL(request.url).pathname;
      return path === "/offline.html" ? new Response("current reader") : undefined;
    },
  };
  runInNewContext(source, {
    URL,
    Request,
    Response,
    AbortController,
    setTimeout,
    clearTimeout,
    self: {
      location: { origin: "https://citylit.vercel.app" },
      addEventListener: (name: string, handler: (event: any) => void) => (handlers[name] = handler),
    },
    caches: { open: async () => current, match: async () => new Response("retained photo") },
    fetch: async () => {
      throw new Error("Offline");
    },
  });
  handlers.fetch({
    request: { url: "https://citylit.vercel.app/cape-town", method: "GET", mode: "navigate" },
    respondWith: (value: Promise<Response>) => (reply = value),
  });
  expect(await (await reply!).text()).toBe("current reader");
  handlers.fetch({
    request: new Request("https://citylit.vercel.app/images/abcdef123456.jpg"),
    respondWith: (value: Promise<Response>) => (reply = value),
  });
  expect(await (await reply!).text()).toBe("retained photo");
});

test("slow requested activation clears its error without accepting an unrelated controller", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "pwa-test-loads",
      String(Number(localStorage.getItem("pwa-test-loads") || 0) + 1),
    );
    const active = {
      postMessage: (_message: unknown, ports: MessagePort[]) =>
        ports[0].postMessage({ ok: true, textSaved: true, photoCount: 0 }),
    };
    const requested = { postMessage: () => {} };
    const unrelated = {};
    const registration = Object.assign(new EventTarget(), {
      active,
      installing: null,
      waiting: requested as object | null,
      update: async () => {},
    });
    const sw = Object.assign(new EventTarget(), {
      controller: active as object,
      register: async () => registration,
    });
    Object.defineProperty(navigator, "serviceWorker", { value: sw, configurable: true });
    Object.assign(window, {
      finishPwaActivation: (matches: boolean) => {
        sw.controller = matches ? requested : unrelated;
        if (matches) registration.waiting = null;
        sw.dispatchEvent(new Event("controllerchange"));
      },
    });
  });
  await page.goto("/cape-town");
  await expect(page.getByRole("button", { name: "Update now", exact: true })).toBeVisible();
  await page.clock.install();
  await page.getByRole("button", { name: "Update now", exact: true }).click();
  const activate = (matches: boolean) =>
    page.evaluate(
      (value) =>
        (
          window as unknown as { finishPwaActivation: (matches: boolean) => void }
        ).finishPwaActivation(value),
      matches,
    );
  await activate(false);
  await expect(page.getByRole("button", { name: "Updating…", exact: true })).toBeDisabled();
  expect(await page.evaluate(() => localStorage.getItem("pwa-test-loads"))).toBe("1");
  await page.clock.fastForward(12001);
  await expect(
    page.getByText("The update did not finish. Try again when your connection is ready."),
  ).toBeVisible();
  await activate(false);
  await expect(
    page.getByText("The update did not finish. Try again when your connection is ready."),
  ).toBeVisible();
  await activate(true);
  await expect(
    page.getByText("The update did not finish. Try again when your connection is ready."),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Update now", exact: true })).toBeEnabled();
  expect(await page.evaluate(() => localStorage.getItem("pwa-test-loads"))).toBe("1");
});
