// Deterministic, dependency-free PBR texture atlas for the five hero landmarks.
// Tiny DataTextures are generated once, reused by all scenes and retained across remounts.
// These are stylized material studies, not imported photographs or licensed scans.
import * as THREE from "three";

const SIZE = 128;
const DETAIL_SIZE = 256;
const textures = new Map();
const materials = new Map();

const profiles = {
  sandstone: { roughness: 0.84, metalness: 0, bump: 0.052, grain: 0.19, layers: 0.11 },
  limestone: { roughness: 0.9, metalness: 0, bump: 0.026, grain: 0.15, layers: 0.042 },
  terracotta: { roughness: 0.82, metalness: 0, bump: 0.028, grain: 0.11, layers: 0.082 },
  concrete: { roughness: 0.88, metalness: 0.03, bump: 0.022, grain: 0.11, layers: 0.035 },
  cliff: { roughness: 0.96, metalness: 0, bump: 0.08, grain: 0.26, layers: 0.19 },
  membrane: { roughness: 0.62, metalness: 0, bump: 0.003, grain: 0.024, layers: 0.015 },
  "brushed-metal": { roughness: 0.34, metalness: 0.78, bump: 0.008, grain: 0.06, layers: 0.09 },
  "glazed-glass": { roughness: 0.14, metalness: 0.18, bump: 0.002, grain: 0.015, layers: 0.008 },
  "weathered-timber": { roughness: 0.86, metalness: 0, bump: 0.036, grain: 0.14, layers: 0.14 },
};

function noise(x, y, seed) {
  let n = Math.imul(x + seed * 19, 374761393) + Math.imul(y + seed * 29, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function texture(bytes, color = false, size = SIZE) {
  const value = new THREE.DataTexture(bytes, size, size, THREE.RGBAFormat);
  value.wrapS = THREE.RepeatWrapping;
  value.wrapT = THREE.RepeatWrapping;
  value.magFilter = THREE.LinearFilter;
  value.minFilter = THREE.LinearMipmapLinearFilter;
  value.generateMipmaps = true;
  value.flipY = false;
  if (color) value.colorSpace = THREE.SRGBColorSpace;
  value.needsUpdate = true;
  return value;
}

function mapsFor(kind, size = SIZE) {
  const cacheKey = `${kind}:${size}`;
  if (textures.has(cacheKey)) return textures.get(cacheKey);
  const p = profiles[kind];
  if (!p) throw new RangeError("Unknown PBR surface: " + kind);
  const albedo = new Uint8Array(size * size * 4);
  const height = new Uint8Array(size * size * 4);
  const roughness = new Uint8Array(size * size * 4);
  // Stone, cliff, concrete, and timber faces benefit from normal variation.
  const detailed = [
    "sandstone",
    "limestone",
    "concrete",
    "cliff",
    "weathered-timber",
    "brushed-metal",
  ].includes(kind);
  const normal = detailed ? new Uint8Array(size * size * 4) : null;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const large = noise(Math.floor(x / 7), Math.floor(y / 7), 7);
      const fine = noise(x, y, 23);
      const micro = noise(x * 2, y * 2, 41);
      const isAniso = kind === "brushed-metal" || kind === "weathered-timber";
      const band = isAniso
        ? Math.sin(y * 0.85 + (large - 0.5) * 1.4)
        : Math.sin(y * 0.53 + Math.sin(x * 0.13) * 0.8);
      const grain =
        (large - 0.5) * p.grain + (fine - 0.5) * p.grain * 0.55 + (micro - 0.5) * p.grain * 0.25;
      const strata = p.layers * band;
      const value = THREE.MathUtils.clamp(0.89 + grain + strata, 0.42, 1);
      const elevation = Math.round(THREE.MathUtils.clamp((0.5 + grain + strata) * 255, 0, 255));
      const surfaceRough = Math.round(
        THREE.MathUtils.clamp((p.roughness + (fine - 0.5) * 0.18 + strata * 0.1) * 255, 0, 255),
      );
      albedo[i] = albedo[i + 1] = albedo[i + 2] = Math.round(value * 255);
      albedo[i + 3] = 255;
      height[i] = height[i + 1] = height[i + 2] = elevation;
      height[i + 3] = 255;
      roughness[i] = roughness[i + 1] = roughness[i + 2] = surfaceRough;
      roughness[i + 3] = 255;
    }
  }

  if (normal) {
    // Periodic finite differences avoid seams in tiled DataTextures. A real
    // tangent-space normal map catches grazing light without additional meshes.
    const sample = (x, y) => {
      const px = (x + size) % size;
      const py = (y + size) % size;
      return height[(py * size + px) * 4] / 255;
    };
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = (sample(x - 1, y) - sample(x + 1, y)) * p.bump * 28;
        const dy = (sample(x, y - 1) - sample(x, y + 1)) * p.bump * 28;
        const len = Math.hypot(dx, dy, 1);
        const index = (y * size + x) * 4;
        normal[index] = Math.round(((dx / len) * 0.5 + 0.5) * 255);
        normal[index + 1] = Math.round(((dy / len) * 0.5 + 0.5) * 255);
        normal[index + 2] = Math.round(((1 / len) * 0.5 + 0.5) * 255);
        normal[index + 3] = 255;
      }
    }
  }

  const maps = {
    color: texture(albedo, true, size),
    bump: texture(height, false, size),
    roughness: texture(roughness, false, size),
    ...(normal ? { normal: texture(normal, false, size) } : {}),
  };
  for (const value of Object.values(maps)) value.repeat.set(2.5, 2.5);
  textures.set(cacheKey, maps);
  return maps;
}

/**
 * Immutable, shared materials. The procedural landmark disposer intentionally
 * preserves materials marked shared; they consume <1 MB for all profiles.
 */
export function pbrSurface(kind, tint = "#ffffff", vertexColors = false, highDetail = false) {
  const size = highDetail ? DETAIL_SIZE : SIZE;
  const key = kind + ":" + tint + ":" + vertexColors + ":" + size;
  if (materials.has(key)) return materials.get(key);
  const profile = profiles[kind];
  const maps = mapsFor(kind, size);
  const surface = new THREE.MeshStandardMaterial({
    color: tint,
    vertexColors,
    map: maps.color,
    bumpMap: maps.bump,
    bumpScale: maps.normal ? profile.bump * 0.38 : profile.bump,
    normalMap: maps.normal ?? null,
    roughnessMap: maps.roughness,
    roughness: profile.roughness,
    metalness: profile.metalness,
  });
  surface.name = "landmark-pbr-" + kind;
  surface.userData.shared = true;
  materials.set(key, surface);
  return surface;
}

export function landmarkPbrTextureBytes() {
  return [...textures.values()].reduce(
    (sum, maps) =>
      sum + Object.values(maps).reduce((bytes, map) => bytes + map.image.data.byteLength, 0),
    0,
  );
}
