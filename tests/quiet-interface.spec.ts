import { expect, test } from "@playwright/test";

test("editable controls use 16px text across themes and viewport sizes", async ({ page }) => {
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/?view=guide");
    for (const theme of ["day", "night"]) {
      await page.locator("html").evaluate((root, value) => {
        root.setAttribute("data-theme", value);
      }, theme);
      const sizes = await page.evaluate(() => {
        const root = document.createElement("div");
        const controls: Element[] = [];
        for (const type of ["text", "search", "email", "number", "tel", "url", "date", "time"]) {
          const input = document.createElement("input");
          input.type = type;
          root.append(input);
          controls.push(input);
        }
        const select = document.createElement("select");
        const textarea = document.createElement("textarea");
        const editable = document.createElement("div");
        editable.contentEditable = "true";
        root.append(select, textarea, editable);
        controls.push(select, textarea, editable);
        for (const role of ["combobox", "textbox", "searchbox", "spinbutton"]) {
          const control = document.createElement("div");
          control.setAttribute("role", role);
          root.append(control);
          controls.push(control);
        }
        document.body.append(root);
        const result = controls.map((control) => ({
          control: control.getAttribute("role") || control.getAttribute("type") || control.tagName,
          size: parseFloat(getComputedStyle(control).fontSize),
        }));
        root.remove();
        return result;
      });
      for (const control of sizes) {
        expect(control.size, `${control.control} at ${width}px in ${theme} theme`).toBe(16);
      }
    }
  }
});

test("home and city guides prioritize discovery, not marketing filler", async ({ page }) => {
  await page.goto("/?view=guide");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Discover");
  await expect(page.getByRole("heading", { name: "Cities", exact: true })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Search city guides" })).toHaveCSS(
    "font-size",
    "16px",
  );
  await expect(page.locator(".atlas-hero-sub, .atlas-hero-hint, .atlas-how, .atlas-end-note")).toHaveCount(
    0,
  );
  await page.goto("/johannesburg");
  await expect(page.getByRole("heading", { name: "Landmarks", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Places", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Explore places" })).toHaveAttribute("href", "#places");
  await expect(page.getByRole("link", { name: "Landmarks", exact: true })).toHaveAttribute(
    "href",
    "/johannesburg/landmarks",
  );
});
