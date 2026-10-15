import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { correctionReport } from "../lib/corrections";
import type { Correction } from "../lib/client-data";

const draft: Correction = {
  id: "review-fixture",
  placeId: "freedom-park",
  field: "accessibility",
  value: "Please verify the accessible entrance & arrival route.",
  source: "https://www.freedompark.co.za/?section=visit&view=access",
  createdAt: "2026-10-15T10:00:00Z",
  status: "needs-review",
};

test("public correction links cannot escape the tracker or impersonate source verification", () => {
  const report = correctionReport(draft)!;
  const url = new URL(report.url);
  expect(url.origin + url.pathname).toBe("https://github.com/thembaxx/citylit/issues/new");
  expect(url.searchParams.get("source")).toBe(draft.source);
  expect(url.searchParams.get("correction")).toContain(draft.value);
  expect(url.searchParams.get("correction")).toContain("reviewer confirmation");
  expect(url.searchParams.get("checked")).toBe(null);
  expect(correctionReport({ ...draft, source: "javascript:alert(1)" })).toBe(null);
  expect(correctionReport({ ...draft, value: "   " })).toBe(null);
  const long = correctionReport({ ...draft, value: "旅".repeat(1200) })!;
  expect(long.needsPaste).toBe(true);
  expect(long.url).toBe("https://github.com/thembaxx/citylit/issues/new?template=data.yml");
  expect(long.text).toContain("旅".repeat(1200));
});

test("a saved correction can reach public review and be removed locally", async ({ page }) => {
  await page.goto("/pretoria/entertainment/freedom-park");
  await page.getByRole("button", { name: "Suggest a correction" }).click();
  await page.getByLabel("What needs updating?").selectOption("accessibility");
  await page.getByLabel("Suggested details").fill(draft.value);
  await page.getByLabel("Supporting source", { exact: true }).fill(draft.source);
  await page.getByRole("button", { name: "Save for review" }).click();
  const link = page.getByRole("link", { name: "Open report on GitHub" });
  await expect(link).toBeVisible();
  const report = new URL((await link.getAttribute("href"))!);
  expect(report.searchParams.get("template")).toBe("data.yml");
  expect(report.searchParams.get("url")).toBe(
    "https://citylit.vercel.app/pretoria/entertainment/freedom-park",
  );
  expect(report.searchParams.get("source")).toBe(draft.source);
  expect(report.searchParams.get("correction")).toContain(draft.value);
  await expect(page.getByText("Opening the form does not submit", { exact: false })).toBeVisible();
  const a11y = await new AxeBuilder({ page })
    .include(".correction-handoff")
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(a11y.violations).toEqual([]);
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          sessionStorage.setItem("copied-report", value);
        },
      },
    });
  });
  await page.getByRole("button", { name: "Copy report", exact: true }).click();
  await expect(page.getByText("Report copied.", { exact: false })).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem("copied-report"))).toContain(draft.value);
  await page.getByRole("link", { name: "Review or remove saved drafts" }).click();
  await expect(page.locator(".correction-review")).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Open report on GitHub" })).toBeVisible();
  await page.getByRole("button", { name: "Mark reviewed", exact: true }).click();
  await expect(page.locator(".correction-review")).toContainText("Status: reviewed");
  await page.reload();
  await expect(page.locator(".correction-review")).toContainText("Status: reviewed");
  await page.getByRole("button", { name: "Delete draft", exact: true }).click();
  await expect(page.locator(".correction-review")).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("citylit-corrections"))).toBe("[]");
});

test("blocked storage preserves review state and reports the failed change", async ({ page }) => {
  await page.addInitScript((value) => {
    localStorage.setItem("citylit-corrections", JSON.stringify([value]));
  }, draft);
  await page.goto("/editorial");
  await expect(page.locator(".correction-review")).toHaveCount(1);
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "citylit-corrections")
        throw new DOMException("Storage blocked", "QuotaExceededError");
      return original.call(this, key, value);
    };
  });
  await page.getByRole("button", { name: "Mark reviewed", exact: true }).click();
  await expect(
    page.getByText("This browser could not save the change.", { exact: false }),
  ).toBeVisible();
  await expect(page.locator(".correction-review")).toContainText("Status: needs-review");
  await page.getByRole("button", { name: "Delete draft", exact: true }).click();
  await expect(page.locator(".correction-review")).toHaveCount(1);
});
