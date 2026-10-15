import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  // Complete 3D/offline journeys need room for software-rendered mobile browsers.
  timeout: 60000,
  expect: { timeout: 15000 },
  use: {
    baseURL: "http://localhost:3000",
    // Continuous trace screenshots stall software WebGL. Keep DOM/network traces
    // and capture one screenshot on failure instead.
    trace: { mode: "retain-on-failure", screenshots: false, snapshots: true },
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"], launchOptions: { args: ["--enable-unsafe-swiftshader"] } },
    },
    {
      name: "desktop-chromium",
      use: {
        viewport: { width: 1440, height: 1000 },
        launchOptions: { args: ["--enable-unsafe-swiftshader"] },
      },
    },
    {
      name: "mobile-webkit-theme",
      testMatch: "theme.spec.ts",
      use: { ...devices["iPhone 13"], defaultBrowserType: "webkit" },
    },
    {
      name: "desktop-firefox-theme",
      testMatch: "theme.spec.ts",
      use: { browserName: "firefox", viewport: { width: 1440, height: 1000 } },
    },
  ],
  webServer: {
    command: "pnpm start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
