/**
 * Conservative, hysteretic quality policy for a demand-rendered Three.js scene.
 * Measurements describe rendered frame cadence, not GPU execution time.
 */
/** Never use high-resolution render targets on software WebGL rasterizers. */
export function isSoftwareRenderer(name: string): boolean {
  return /swiftshader|llvmpipe|softpipe|software rasterizer/i.test(name);
}

export type RendererTier = "saver" | "balanced" | "detail";
export type SampleWindow = {
  frames: number;
  averageFrameMs: number;
  slowFrameRatio: number;
};

const tiers: RendererTier[] = ["saver", "balanced", "detail"];

export const DPR_CAPS: Record<RendererTier, number> = {
  saver: 1,
  balanced: 1.5,
  detail: 2,
};

export class RendererQualityPolicy {
  tier: RendererTier;
  private poorWindows = 0;
  private goodWindows = 0;
  private readonly maximum: RendererTier;

  constructor(mobile: boolean, saveData = false) {
    this.maximum = saveData ? "saver" : mobile ? "balanced" : "detail";
    this.tier = this.maximum;
  }

  sample(window: SampleWindow): RendererTier {
    // Sparse on-demand frames and background tabs are not rendering regressions.
    if (window.frames < 45) return this.tier;
    const poor = window.averageFrameMs > 48 || window.slowFrameRatio > 0.38;
    const good = window.averageFrameMs <= 34 && window.slowFrameRatio < 0.08;

    this.poorWindows = poor ? this.poorWindows + 1 : 0;
    this.goodWindows = good ? this.goodWindows + 1 : 0;

    if (this.poorWindows >= 2) {
      this.tier = tiers[Math.max(0, tiers.indexOf(this.tier) - 1)];
      this.poorWindows = 0;
      this.goodWindows = 0;
    } else if (this.goodWindows >= 4) {
      const next = Math.min(tiers.indexOf(this.maximum), tiers.indexOf(this.tier) + 1);
      this.tier = tiers[next];
      this.goodWindows = 0;
    }
    return this.tier;
  }
}

export interface RendererDiagnostics {
  tier: RendererTier;
  dpr: number;
  fps: number | null;
  frameMs: number | null;
  drawCalls: number;
  triangles: number;
  points: number;
  geometries: number;
  textures: number;
  context: "ready" | "lost";
  // This sampler does not expose device GPU timestamp queries.
  gpuMs: null;
}

declare global {
  interface Window {
    __citylitRendererDiagnostics?: RendererDiagnostics;
  }
}
