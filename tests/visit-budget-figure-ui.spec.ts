import { expect, test } from "@playwright/test";

test("day-budget figure teaches how an extra stop changes a fixed day", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/johannesburg");

  await page.getByText("Explore the time budget", { exact: true }).click();
  await page.getByRole("group", { name: "Predict time remaining" }).getByRole("button", { name: "Less free time" }).click();

  const explain = page.getByRole("button", { name: "Explain the result" });
  await expect(explain).toBeDisabled();
  const stops = page.getByRole("slider", { name: /Stops/ });
  await stops.focus();
  await stops.press("ArrowRight");
  await expect(stops).toHaveValue("3");
  await expect(page.getByText("65m free", { exact: true })).toBeVisible();
  await expect(explain).toBeEnabled();
  await explain.click();

  await expect(page.getByRole("region", { name: "Explain" })).toBeVisible();
  await page.getByRole("group", { name: "Apply the time budget" }).getByRole("button", { name: "Decreases" }).click();
  await expect(page.getByText(/Correct: extra travel uses more/)).toBeVisible();
  await page.getByRole("button", { name: "Reset experiment" }).click();
  await expect(page.getByRole("group", { name: "Predict time remaining" }).getByRole("button", { name: "Less free time" })).toBeEnabled();
});
