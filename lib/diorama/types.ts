import type * as THREE from "three/webgpu";
import type { DioramaLandmark, DioramaSlug, TimeMode } from "./content";

export type QualityTier = "high" | "balanced" | "saver";

export type Quality = {
  tier: QualityTier;
  terrainSegments: number;
  waterSegments: number;
  treeCount: number;
  detail: number;
  shadows: boolean;
  dpr: number;
};

export type Atmosphere = {
  /** 0 = full day, 1 = full night. */
  night: number;
  /** 0 = neutral, 1 = golden-hour warmth. */
  golden: number;
};

export type SceneBuild = {
  root: THREE.Group;
  /** The landscape that lifts away in the cutaway view. */
  terrain: THREE.Group;
  /** The three strata slabs under the landscape. */
  base: THREE.Group;
  landmarks: DioramaLandmark[];
  tick: (time: number, dt: number, atmosphere: Atmosphere) => void;
  camera?: {
    position: [number, number, number];
    target: [number, number, number];
  };
};

export type SceneContext = {
  quality: Quality;
  reducedMotion: boolean;
  rng: () => number;
};

export type SceneBuilder = (context: SceneContext) => SceneBuild;

export type SceneModule = {
  build: SceneBuilder;
};

export type SceneLoader = () => Promise<SceneModule>;

export type RendererKind = "WebGPU" | "WebGL 2";

/**
 * Which backend the renderer should start on. "auto" uses WebGPU when the
 * browser exposes it and silently falls back to WebGL 2. "webgl" forces the
 * WebGL 2 backend so the same TSL scene graph is compiled to GLSL instead.
 */
export type RenderBackend = "auto" | "webgl";

export type DioramaEngineOptions = {
  canvas: HTMLCanvasElement;
  reducedMotion: boolean;
  quality?: Quality;
  backend?: RenderBackend;
  onRenderer?: (kind: RendererKind) => void;
  onLandmarks?: (landmarks: DioramaLandmark[]) => void;
  onSelect?: (id: string | null) => void;
  onError?: (message: string) => void;
};

export type DioramaSceneKey = DioramaSlug;

export type DioramaEngine = {
  init: () => Promise<void>;
  load: (slug: DioramaSlug) => Promise<void>;
  setAtmosphere: (mode: TimeMode) => void;
  setExploded: (value: boolean) => void;
  setAutoRotate: (value: boolean) => void;
  focus: (id: string) => void;
  resetView: () => void;
  dispose: () => void;
};
