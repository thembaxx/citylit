import { test, expect } from "@playwright/test";
import { cities, places } from "../lib/data";
import { suggestions, orderItinerary, activeEvents, distanceKm } from "../lib/adventure";

test("catalog has all provinces and planning never treats unknown admission as free", () => {
  expect(new Set(cities.map((c) => c.provinceCode)).size).toBe(9);
  expect(new Set(places.map((p) => p.id)).size).toBe(places.length);
  const free = suggestions("pietermaritzburg", "culture", 180, "free");
  expect(free.map((p) => p.id)).toContain("tatham-art-gallery");
  expect(free.every((p) => p.facts?.admission?.value === "free")).toBe(true);
  expect(
    suggestions("cape-town", "culture", 60, "any").reduce(
      (total, p) => total + Number(p.facts?.durationMinutes?.value || 90),
      0,
    ),
  ).toBeLessThanOrEqual(60);
  expect(suggestions("kimberley", "culture", 180, "under200").map((p) => p.id)).toContain(
    "the-big-hole",
  );
  expect(activeEvents(new Date("2027-01-01")).length).toBe(0);
  expect(distanceKm([18, -34], [18, -34])).toBe(0);
  const unknown = places.find((p) => p.coordinateAccuracy === "city")!,
    known = places.find((p) => p.coordinateAccuracy === "venue")!;
  expect(orderItinerary([unknown.id, known.id, known.id]).map((p) => p.id)).toEqual([
    known.id,
    unknown.id,
  ]);
});

test("collections build a day, preserve visits and import shareable trips", async ({ page }) => {
  await page.goto("/explore?city=pietermaritzburg");
  await page.getByRole("button", { name: "Switch to night theme", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
  await page.getByRole("button", { name: "Collections", exact: true }).click();
  await expect(page.locator(".collection-card")).toHaveCount(3);
  await page.getByRole("button", { name: "Make this my day" }).first().click();
  await expect(page.locator(".trip-stops li")).toHaveCount(1);
  await page.getByRole("button", { name: "Group nearby stops" }).click();
  await expect(page.locator(".hub-message")).toContainText("Verified pins");
  await page.goto("/explore?city=cape-town&trip=kirstenbosch,zeitz-mocaa");
  await page.getByRole("button", { name: "Import shared day" }).click();
  await expect(page.locator(".trip-stops li")).toHaveCount(2);
  await page.goto("/cape-town/parks-zoos/kirstenbosch");
  await page.getByRole("button", { name: "Mark visited", exact: true }).click();
  await expect(page.locator(".visit-stamp")).toContainText("Passport stamped");
  await page.goto("/explore?city=cape-town");
  await page.getByRole("button", { name: "Passport", exact: true }).click();
  await expect(page.locator(".passport-stamp")).toContainText("Cape Town");
  await page.getByLabel("Essential motion", { exact: true }).check();
  await expect(page.getByLabel("Essential motion", { exact: true })).toBeChecked();
  await expect(page.getByText("0 discovered · 1 marked visited.", { exact: false })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Build a day", exact: true }).click();
  await expect(page.locator(".trip-stops li")).toHaveCount(2);
});

test("practical filters and query survive opening a place and browser back", async ({ page }) => {
  await page.goto("/pietermaritzburg/entertainment?view=places");
  await page.getByRole("button", { name: "Free entry", exact: true }).click();
  await page.getByRole("button", { name: "Step-free entrance", exact: true }).click();
  await expect(page.locator(".place-card")).toHaveCount(1);
  await page.getByPlaceholder("Search places").fill("Tatham");
  await page.locator(".place-open").click();
  await expect(page.locator("h1")).toHaveText("Tatham Art Gallery");
  await page.goBack();
  await expect(page.getByPlaceholder("Search places")).toHaveValue("Tatham");
  await expect(page.getByRole("button", { name: "Free entry", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(
    page.getByRole("button", { name: "Step-free entrance", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("corrections stay in a review queue and do not change public facts", async ({ page }) => {
  await page.goto("/pretoria/entertainment/freedom-park");
  await page.getByRole("button", { name: "Suggest a correction" }).click();
  await page.getByLabel("Suggested details").fill("Verify accessible entrance location");
  await page.getByLabel("Supporting source").fill("https://www.freedompark.co.za/");
  await page.getByRole("button", { name: "Save for review" }).click();
  await expect(
    page.getByText("Draft saved on this device for review.", { exact: false }),
  ).toBeVisible();
  await page.goto("/editorial");
  await expect(page.locator(".correction-review")).toHaveCount(1);
  await page.getByRole("button", { name: "Mark reviewed", exact: true }).click();
  await expect(page.locator(".correction-review")).toContainText("Status: reviewed");
  await page.goto("/pretoria/entertainment/freedom-park");
  await expect(page.locator("h1")).toHaveText("Freedom Park");
});

test("nearby search handles location permission and new cities have one 3D canvas", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: -29.6, longitude: 30.38 });
  await page.goto("/explore?city=pietermaritzburg");
  await page.getByRole("button", { name: "Use my location", exact: true }).click();
  await expect(
    page.getByText("Distances are straight-line estimates to verified venue pins.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.goto("/kimberley");
  await expect(page.locator(".landmark-open h3")).toHaveText("The Big Hole");
  await page.getByRole("button", { name: "Spin illustration", exact: true }).click();
  await expect(page).toHaveURL(/kimberley$/);
  await expect(page.locator("canvas")).toHaveCount(1);
  await page.goto("/mahikeng");
  await expect(page.locator(".landmark-open h3")).toHaveText("Mahikeng Museum");
});

test("saved field guide works offline and keeps its source information", async ({
  page,
  context,
}) => {
  await page.goto("/cape-town/parks-zoos/kirstenbosch");
  await page.getByRole("button", { name: "Save this discovery", exact: true }).click();
  await page.goto("/explore?city=cape-town");
  await page.getByRole("button", { name: "Passport", exact: true }).click();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.getByRole("button", { name: "Save field guide offline", exact: true }).click();
  await expect(page.locator(".hub-message")).toContainText("Field guide ready", { timeout: 15000 });
  await context.setOffline(true);
  await page.goto("/offline.html");
  await expect(page.getByRole("heading", { name: "Kirstenbosch", exact: true })).toBeVisible();
  await expect(page.getByText("Rhodes Drive, Newlands", { exact: true })).toBeVisible();
  await expect(page.getByText("Wikipedia contributors · CC BY-SA 4.0")).toBeVisible();
  await context.setOffline(false);
});
