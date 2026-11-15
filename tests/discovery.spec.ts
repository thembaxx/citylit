import { test, expect } from "@playwright/test";

test("invalid city and cross-category place URLs return 404", async ({ request }) => {
  expect((await request.get("/unknown-city")).status()).toBe(404);
  expect((await request.get("/cape-town/clubs/kirstenbosch")).status()).toBe(404);
});

test("essential motion keeps guide scenes still", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/johannesburg");
  await expect(page.locator(".brand-world")).toHaveAttribute("data-khwezi-motion", "still");
  await page.goto("/brand");
  await expect(page.locator(".brand-world")).toHaveAttribute("data-khwezi-motion", "still");
});

test("theme contrast, switching, and incidental feedback remain accessible", async ({ page }) => {
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
  const headerWordmark = page.locator(".atlas-nav .wordmark");
  await expect(headerWordmark).toHaveAccessibleName("Citylit");
  const brandSymbol = headerWordmark.locator(".citylit-logo-symbol-wrap");
  await expect(brandSymbol).toHaveCount(1);
  await expect(brandSymbol).toHaveAttribute("aria-hidden", "true");
  await expect(page.locator(".map-pin")).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "Explore", exact: true })).toBeVisible();
  expect(
    await page.evaluate(() => (window as typeof window & { audioStarts: number }).audioStarts),
  ).toBe(0);
  for (const theme of ["night", "day"]) {
    if (theme === "day") {
      await page.getByRole("button", { name: "Open settings", exact: true }).click();
      await page.getByRole("button", { name: "Light", exact: true }).click();
      await page.getByRole("button", { name: "Close settings", exact: true }).click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
    }
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
        ratio(css.getPropertyValue("--accent-ink"), css.getPropertyValue("--accent")),
        ratio("#f4f6ff", "#111c33"),
      ];
    });
    for (const ratio of ratios) expect(ratio).toBeGreaterThanOrEqual(4.5);
  }
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "day");
  // Guide theme choices live in the settings sheet opened by the header gear.
  await expect(page.getByRole("button", { name: "Open settings", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Open settings", exact: true }).click();
  const soundSwitch = page.getByRole("switch", { name: "Toggle tactile UI sound" });
  if ((await soundSwitch.getAttribute("aria-checked")) === "true") {
    await soundSwitch.click();
  }
  const mutedStarts = await page.evaluate(
    () => (window as typeof window & { audioStarts: number }).audioStarts,
  );
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await page.getByRole("button", { name: "Close settings", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
  await page.getByRole("button", { name: "Open settings", exact: true }).click();
  await page.getByRole("button", { name: "Light", exact: true }).click();
  await page.getByRole("button", { name: "Close settings", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "day");
  expect(
    await page.evaluate(() => (window as typeof window & { audioStarts: number }).audioStarts),
  ).toBe(mutedStarts);
  expect(
    await page.evaluate(() => (window as typeof window & { vibrations: number }).vibrations),
  ).toBe(0);
});

test("place context expands attributed about copy and links confirmed facts and shared sites", async ({
  page,
}) => {
  await page.goto("/cape-town/lodging/the-silo-hotel");
  await page.getByRole("tab", { name: "History", exact: true }).click();
  await expect(page.getByRole("heading", { name: "About", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Good to know", exact: true })).toBeVisible();
  await page.getByRole("link", { name: /Zeitz MOCAA/ }).click();
  await expect(page).toHaveURL(/cape-town\/entertainment\/zeitz-mocaa$/);
  await page.getByRole("tab", { name: "History", exact: true }).click();
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
  await page.getByRole("tab", { name: "History", exact: true }).click();
  await expect(page.getByRole("link", { name: "Free unlimited Wi-Fi" })).toHaveAttribute(
    "href",
    "https://www.southernsun.com/southern-sun-elangeni-maharani",
  );
  await expect(page.locator(".venue-facts li")).toHaveCount(3);
});
