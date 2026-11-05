import { expect, test } from "@playwright/test";
import { DPR_CAPS, RendererQualityPolicy } from "../lib/renderer-quality";

const slow = { frames: 70, averageFrameMs: 58, slowFrameRatio: 0.5 };
const smooth = { frames: 70, averageFrameMs: 30, slowFrameRatio: 0.02 };

test("adaptive DPR waits for sustained slow frames and recovers conservatively", () => {
  const governor = new RendererQualityPolicy(false);
  expect(governor.tier).toBe("detail");
  expect(governor.sample(slow)).toBe("detail");
  expect(governor.sample(slow)).toBe("balanced");
  expect(governor.sample(slow)).toBe("balanced");
  expect(governor.sample(slow)).toBe("saver");
  for (let i = 0; i < 3; i++) {
    expect(governor.sample(smooth)).toBe("saver");
  }
  expect(governor.sample(smooth)).toBe("balanced");
});

test("mobile caps quality at balanced, battery saver remains in saver", () => {
  const mobile = new RendererQualityPolicy(true);
  expect(mobile.tier).toBe("balanced");
  for (let i = 0; i < 8; i++) mobile.sample(smooth);
  expect(mobile.tier).toBe("balanced");
  const batterySaver = new RendererQualityPolicy(true, true);
  expect(batterySaver.tier).toBe("saver");
  for (let i = 0; i < 10; i++) batterySaver.sample(smooth);
  expect(batterySaver.tier).toBe("saver");
  expect(DPR_CAPS.saver).toBeLessThan(DPR_CAPS.balanced);
  expect(DPR_CAPS.balanced).toBeLessThan(DPR_CAPS.detail);
});

test("idle or insufficient frame samples do not reduce quality", () => {
  const governor = new RendererQualityPolicy(false);
  for (let i = 0; i < 10; i++) {
    governor.sample({ frames: 2, averageFrameMs: 900, slowFrameRatio: 1 });
  }
  expect(governor.tier).toBe("detail");
});

test("live WebGL renderer exposes real draw counters without pretending GPU timing", async ({
  page,
}) => {
  await page.goto("/?view=guide");
  const root = page.locator(".canvas-root");
  await expect(root).toHaveAttribute("data-webgl-status", "ready", { timeout: 30000 });
  await expect(root).toHaveAttribute("data-renderer-quality", /detail|balanced|saver/);
  const diagnostics = await page.evaluate(() => window.__citylitRendererDiagnostics);
  expect(diagnostics).toBeDefined();
  expect(diagnostics!.context).toBe("ready");
  expect(diagnostics!.drawCalls).toBeGreaterThanOrEqual(0);
  expect(diagnostics!.triangles).toBeGreaterThanOrEqual(0);
  expect(diagnostics!.geometries).toBeGreaterThanOrEqual(0);
  expect(diagnostics!.textures).toBeGreaterThanOrEqual(0);
  expect(diagnostics!.dpr).toBeGreaterThan(0);
  expect(diagnostics!.gpuMs).toBeNull();
});
