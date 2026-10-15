import { test as base } from "@playwright/test";
export { expect } from "@playwright/test";
export type { Page } from "@playwright/test";
/** Retain regression coverage for the user-selectable original 3D experience.
 * redesign.spec.ts exercises the new default guide without this preference. */
export const test = base.extend<{ legacyExperience: void }>({
  legacyExperience: [
    async ({ context, baseURL }, use) => {
      await context.addCookies([{ name: "citylit-view", value: "3d", url: baseURL! }]);
      await use();
    },
    { auto: true },
  ],
});
