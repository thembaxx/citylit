import { test, expect, type Page } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { createElement, type ReactNode, type Key } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import GlobalError from "../app/global-error";
// Playwright serializes imported JSX for component fixtures. Restore native elements
// so React's server renderer can render the actual recovery document, not a copied template.
function recoveryElement(value: unknown): ReactNode {
  if (Array.isArray(value)) return value.map(recoveryElement);
  if (value && typeof value === "object" && "__pw_type" in value) {
    const node = value as {
      __pw_type: unknown;
      type?: unknown;
      props?: Record<string, unknown>;
      key?: Key;
    };
    if (typeof node.type !== "string" || !node.props)
      throw new Error("Expected native recovery elements");
    const { children, ...props } = node.props;
    const content = Array.isArray(children) ? children : [children];
    return createElement(node.type, { ...props, key: node.key }, ...content.map(recoveryElement));
  }
  return value as ReactNode;
}
const colors = {
  day: { css: "rgb(246, 243, 237)", hex: "#f6f3ed", scheme: "light" },
  night: { css: "rgb(8, 15, 32)", hex: "#080f20", scheme: "dark" },
} as const;
async function matchesTheme(page: Page, theme: keyof typeof colors) {
  await expect(page.locator("html")).toHaveCSS("background-color", colors[theme].css);
  await expect(page.locator("body")).toHaveCSS("background-color", colors[theme].css);
  await expect(page.locator("html")).toHaveCSS("color-scheme", colors[theme].scheme);
  await expect
    .poll(() =>
      page
        .locator('meta[name="theme-color"]')
        .evaluateAll((metas) => [...new Set(metas.map((meta) => meta.getAttribute("content")))]),
    )
    .toEqual([colors[theme].hex]);
}

for (const theme of ["day", "night"] as const) {
  test(`initial root recovery paints saved ${theme} with the regular bootstrap delayed`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme === "day" ? "dark" : "light" });
    await page.addInitScript((selected) => localStorage.setItem("citylit-theme", selected), theme);
    const markup = renderToStaticMarkup(
      recoveryElement(GlobalError({ error: new Error("Fixture"), retry: () => {} })),
    );
    await page.route("**/__root-error-fixture", async (route) => {
      // Render the real fallback component under a real fresh production response policy.
      const response = await route.fetch();
      await route.fulfill({
        status: 500,
        contentType: "text/html",
        headers: {
          "Content-Security-Policy": response.headers()["content-security-policy"],
        },
        body: `<!doctype html>${markup}`,
      });
    });
    let release!: () => void;
    const paused = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route("**/theme.js", async (route) => {
      await paused;
      await route.continue();
    });
    try {
      await page.goto("/__root-error-fixture", { waitUntil: "commit" });
      await expect(page.getByRole("heading", { name: "A spark went astray." })).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await matchesTheme(page, theme);
    } finally {
      release();
    }
  });
  test(`saved ${theme} paints before delayed hydration and stays consistent afterwards`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme === "day" ? "dark" : "light" });
    await page.addInitScript((selected) => {
      localStorage.setItem("citylit-theme", selected);
      localStorage.setItem("citylit-khwezi-met", "yes");
    }, theme);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error" && /hydration|didn't match/i.test(message.text()))
        errors.push(message.text());
    });
    let release!: () => void;
    const paused = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route("**/_next/**/*.js", async (route) => {
      await paused;
      await route.continue();
    });
    try {
      await page.goto("/", { waitUntil: "commit" });
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await matchesTheme(page, theme);
      // Neither React nor the Three.js bundle is needed for the correct page/chrome paint.
      await expect(page.locator(".scene-loading")).toBeVisible();
    } finally {
      release();
    }
    await expect(page.getByRole("button", { name: /Switch to .* theme/ })).toBeVisible();
    await expect(page.locator(".scene-loading")).toHaveCount(0);
    await matchesTheme(page, theme);
    expect(errors).toEqual([]);
  });
}

test("without JavaScript, online and offline shells follow both device themes", async ({
  browser,
  baseURL,
}) => {
  for (const theme of ["day", "night"] as const) {
    const context = await browser.newContext({
      baseURL,
      javaScriptEnabled: false,
      colorScheme: colors[theme].scheme,
    });
    const page = await context.newPage();
    for (const path of ["/", "/offline.html"]) {
      await page.goto(path);
      await expect(page.locator("html")).toHaveCSS("background-color", colors[theme].css);
      await expect(page.locator("body")).toHaveCSS("background-color", colors[theme].css);
      await expect(
        page.locator(
          `meta[name="theme-color"][media="(prefers-color-scheme: ${colors[theme].scheme})"]`,
        ),
      ).toHaveAttribute("content", colors[theme].hex);
    }
    await context.close();
  }
});

test("system changes and cross-tab choices update the UI; explicit choices survive navigation", async ({
  page,
  context,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.addInitScript(() => localStorage.setItem("citylit-khwezi-met", "yes"));
  await page.goto("/");
  await matchesTheme(page, "day");
  await page.emulateMedia({ colorScheme: "dark" });
  await matchesTheme(page, "night");
  await expect(page.getByRole("button", { name: "Switch to day theme" })).toBeVisible();
  const other = await context.newPage();
  await other.emulateMedia({ colorScheme: "dark" });
  await other.goto("/brand");
  await other.getByRole("button", { name: "Switch to day theme" }).click();
  await matchesTheme(page, "day");
  await expect(page.getByRole("button", { name: "Switch to night theme" })).toBeVisible();
  await page.emulateMedia({ colorScheme: "dark" });
  await page.getByRole("button", { name: "Choose from 12 destinations" }).click();
  await page
    .getByRole("navigation", { name: "Available provinces" })
    .locator('a[href="/durban"]')
    .click();
  await expect(page).toHaveURL(/\/durban$/);
  await matchesTheme(page, "day");
  // Also exercise a route that uses ThemeToggle instead of Explorer's control.
  await page.goto("/explore");
  await matchesTheme(page, "day");
  await expect(page.getByRole("button", { name: "Switch to night theme" })).toBeVisible();
  await other.evaluate(() => localStorage.removeItem("citylit-theme"));
  await matchesTheme(page, "night");
  await other.close();
});

test("denied storage still follows the OS and keeps a manual choice for this session", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new DOMException("Denied", "SecurityError");
      },
    });
  });
  await page.goto("/brand");
  await matchesTheme(page, "day");
  await page.getByRole("button", { name: "Switch to night theme" }).click();
  await matchesTheme(page, "night");
  await page.emulateMedia({ colorScheme: "dark" });
  await page.emulateMedia({ colorScheme: "light" });
  await matchesTheme(page, "night");
});

test("an invalid saved preference falls back to the device theme", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.addInitScript(() => localStorage.setItem("citylit-theme", "unexpected-theme"));
  await page.goto("/brand");
  await matchesTheme(page, "day");
  await page.emulateMedia({ colorScheme: "dark" });
  await matchesTheme(page, "night");
});

test("viewport metadata replacements and compact landscape leave no background seams", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem("citylit-theme", "day");
    localStorage.setItem("citylit-khwezi-met", "yes");
  });
  await page.goto("/johannesburg/entertainment");
  await matchesTheme(page, "day");
  await page.evaluate(() => {
    document.documentElement.removeAttribute("data-theme");
    document
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((meta) => meta.setAttribute("content", "#080f20"));
  });
  await matchesTheme(page, "day");
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await expect(page.locator(".canvas-root")).toHaveCSS("background-color", colors.day.css);
    await expect(page.locator(".game-atmosphere")).toHaveCSS("background-color", colors.day.css);
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBe(viewport.width);
    await expect(page.locator(".canvas-root")).toHaveCSS("height", `${viewport.height}px`);
  }
});

test("a cold cached-guide launch keeps the saved background before the guide hydrates", async ({
  page,
  request,
}) => {
  // Test real connection loss. WebKit's offline emulation bypasses even local SW responses:
  // https://github.com/microsoft/playwright/issues/42775
  // Snapshot only known public responses. The isolated origin cannot proxy arbitrary requests.
  const paths = [
    "/offline.html",
    "/offline.js",
    "/offline.css",
    "/theme.js",
    "/theme.css",
    "/icons/ui.svg",
    "/sw.js",
    "/pwa-release.js",
    "/manifest.webmanifest",
    "/data/places.json",
    "/data/cities.json",
    "/app-icon.svg",
    "/brand/khwezi-offline.svg",
    "/brand/apple-touch-icon.png",
    "/brand/app-icon-192.png",
    "/brand/app-icon-512.png",
    "/brand/app-icon-maskable.png",
  ];
  const assets = new Map(
    await Promise.all(
      paths.map(async (path) => {
        const response = await request.get(path);
        expect(response.status(), path).toBe(200);
        const headers = response.headers();
        // APIResponse.body() is decompressed. Let the isolated server frame its response.
        for (const name of [
          "content-encoding",
          "content-length",
          "transfer-encoding",
          "connection",
        ])
          delete headers[name];
        return [path, { headers, body: await response.body() }] as const;
      }),
    ),
  );
  const server = createServer((incoming, outgoing) => {
    const asset = assets.get(incoming.url || "");
    if (!asset) {
      outgoing.writeHead(404).end();
      return;
    }
    outgoing.writeHead(200, asset.headers).end(asset.body);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Missing test origin");
  const origin = `http://127.0.0.1:${address.port}`;
  const stop = async (running: Server) => {
    running.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      running.close((error) => (error ? reject(error) : resolve())),
    );
  };
  try {
    await page.addInitScript(() => {
      if (!localStorage.getItem("citylit-theme")) localStorage.setItem("citylit-theme", "day");
    });
    await page.goto(`${origin}/offline.html`);
    await page.evaluate(async () => {
      await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller)
        await new Promise<void>((resolve) =>
          navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), {
            once: true,
          }),
        );
    });
    await stop(server);
    const response = await page.goto(`${origin}/durban/entertainment/ushaka-marine-world`);
    expect(response?.fromServiceWorker()).toBe(true);
    await matchesTheme(page, "day");
    await expect(page.locator(".offline-top")).toBeVisible();
    // The referenced Hugeicons artwork must paint with the origin unavailable, not just exist.
    await expect
      .poll(() =>
        page
          .locator(".offline-tabs svg")
          .evaluateAll((icons) =>
            icons.every((icon) => (icon as SVGGraphicsElement).getBBox().width > 0),
          ),
      )
      .toBe(true);
    await page.getByRole("button", { name: "Switch theme", exact: true }).click();
    await matchesTheme(page, "night");
    await page.reload();
    await matchesTheme(page, "night");
  } finally {
    if (server.listening) await stop(server);
  }
});
