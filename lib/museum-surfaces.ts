import * as THREE from "three";

export type MuseumSurface = "plaster" | "stone" | "copper" | "wood" | "grass" | "paving";

export type SurfacePair = {
  albedo: THREE.DataTexture;
  bump: THREE.DataTexture;
  bumpScale: number;
};

export type MuseumSurfaceLibrary = Record<MuseumSurface, SurfacePair>;

const SIZE = 256;
const SETTINGS: Record<MuseumSurface, { seed: number; grain: number; bump: number }> = {
  plaster: { seed: 17, grain: 7, bump: 0.006 },
  stone: { seed: 29, grain: 11, bump: 0.009 },
  copper: { seed: 37, grain: 5, bump: 0.0015 },
  wood: { seed: 43, grain: 14, bump: 0.003 },
  grass: { seed: 59, grain: 16, bump: 0.014 },
  paving: { seed: 61, grain: 10, bump: 0.005 },
};

function hash(x: number, y: number, seed: number) {
  let n = Math.imul(x ^ (seed + 43), 374761393) + Math.imul(y ^ seed, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function smoothNoise(x: number, y: number, cell: number, seed: number) {
  const px = x / cell;
  const py = y / cell;
  const x0 = Math.floor(px);
  const y0 = Math.floor(py);
  const fx = px - x0;
  const fy = py - y0;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const a = hash(x0, y0, seed);
  const b = hash(x0 + 1, y0, seed);
  const c = hash(x0, y0 + 1, seed);
  const d = hash(x0 + 1, y0 + 1, seed);
  return THREE.MathUtils.lerp(
    THREE.MathUtils.lerp(a, b, u),
    THREE.MathUtils.lerp(c, d, u),
    v,
  );
}

/**
 * Reproducible low-frequency material variation rather than repeated flat colors.
 * All maps are produced locally; no third-party asset rights or runtime network calls.
 * These are procedural surface textures, NOT scans of a real landmark.
 */
function createPair(type: MuseumSurface): SurfacePair {
  const setting = SETTINGS[type];
  const colors = new Uint8Array(SIZE * SIZE * 4);
  const heights = new Uint8Array(SIZE * SIZE * 4);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const coarse = smoothNoise(x, y, 46, setting.seed);
      const middle = smoothNoise(x, y, 13, setting.seed + 7);
      const fine = hash(x, y, setting.seed + 21);
      const stripe = type === "wood" ? Math.sin((x + coarse * 7) * 0.16) * 0.13 : 0;
      const veining = type === "stone" ? Math.sin((x + y * 0.48 + middle * 9) * 0.08) * 0.06 : 0;
      const granularity = (coarse - 0.5) * 0.65 + (middle - 0.5) * 0.24 +
        (fine - 0.5) * 0.11 + stripe + veining;
      const variance = granularity * setting.grain;
      const base = type === "grass" ? 221 : type === "copper" ? 235 : 241;
      const color = THREE.MathUtils.clamp(Math.round(base + variance), 0, 255);
      const relief = THREE.MathUtils.clamp(Math.round(126 + granularity * 91), 0, 255);
      const pos = (y * SIZE + x) * 4;
      for (let channel = 0; channel < 3; channel++) {
        colors[pos + channel] = color;
        heights[pos + channel] = relief;
      }
      colors[pos + 3] = 255;
      heights[pos + 3] = 255;
    }
  }
  const albedo = new THREE.DataTexture(colors, SIZE, SIZE, THREE.RGBAFormat);
  albedo.colorSpace = THREE.SRGBColorSpace;
  albedo.wrapS = albedo.wrapT = THREE.RepeatWrapping;
  albedo.repeat.set(2, 2);
  albedo.magFilter = THREE.LinearFilter;
  albedo.minFilter = THREE.LinearMipmapLinearFilter;
  albedo.generateMipmaps = true;
  albedo.needsUpdate = true;

  const bump = new THREE.DataTexture(heights, SIZE, SIZE, THREE.RGBAFormat);
  bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  bump.repeat.set(2, 2);
  bump.magFilter = THREE.LinearFilter;
  bump.minFilter = THREE.LinearMipmapLinearFilter;
  bump.generateMipmaps = true;
  bump.needsUpdate = true;
  return { albedo, bump, bumpScale: setting.bump };
}

export function makeMuseumSurfaces(): MuseumSurfaceLibrary {
  return {
    plaster: createPair("plaster"),
    stone: createPair("stone"),
    copper: createPair("copper"),
    wood: createPair("wood"),
    grass: createPair("grass"),
    paving: createPair("paving"),
  };
}

export function disposeMuseumSurfaces(surfaces: MuseumSurfaceLibrary) {
  for (const { albedo, bump } of Object.values(surfaces)) {
    albedo.dispose();
    bump.dispose();
  }
}
