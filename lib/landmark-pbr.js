// Deterministic, dependency-free PBR texture atlas for the five hero landmarks.
// Tiny DataTextures are generated once, reused by all scenes and retained across remounts.
// These are stylized material studies, not imported photographs or licensed scans.
import * as THREE from "three";

const SIZE = 96;
const textures = new Map();
const materials = new Map();

const profiles = {
  sandstone: { roughness: 0.86, metalness: 0, bump: 0.045, grain: 0.16, layers: 0.095 },
  limestone: { roughness: 0.92, metalness: 0, bump: 0.022, grain: 0.13, layers: 0.035 },
  terracotta: { roughness: 0.84, metalness: 0, bump: 0.025, grain: 0.09, layers: 0.075 },
  concrete: { roughness: 0.9, metalness: 0.02, bump: 0.019, grain: 0.09, layers: 0.03 },
  cliff: { roughness: 0.98, metalness: 0, bump: 0.07, grain: 0.23, layers: 0.17 },
  membrane: { roughness: 0.64, metalness: 0, bump: 0.0025, grain: 0.02, layers: 0.012 },
};

function noise(x, y, seed) {
  let n = Math.imul(x + seed * 19, 374761393) + Math.imul(y + seed * 29, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function texture(bytes, color = false) {
  const value = new THREE.DataTexture(bytes, SIZE, SIZE, THREE.RGBAFormat);
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

function mapsFor(kind) {
  if (textures.has(kind)) return textures.get(kind);
  const p = profiles[kind];
  if (!p) throw new RangeError("Unknown PBR surface: " + kind);
  const albedo = new Uint8Array(SIZE * SIZE * 4);
  const height = new Uint8Array(SIZE * SIZE * 4);
  const roughness = new Uint8Array(SIZE * SIZE * 4);

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const i = (y * SIZE + x) * 4;
      const large = noise(Math.floor(x / 7), Math.floor(y / 7), 7);
      const fine = noise(x, y, 23);
      const band = Math.sin(y * 0.53 + Math.sin(x * 0.13) * 0.8);
      const grain = (large - 0.5) * p.grain + (fine - 0.5) * p.grain * 0.55;
      const strata = p.layers * band;
      const value = THREE.MathUtils.clamp(0.89 + grain + strata, 0.45, 1);
      const elevation = Math.round(THREE.MathUtils.clamp((0.5 + grain + strata) * 255, 0, 255));
      const surfaceRough = Math.round(THREE.MathUtils.clamp(
        (p.roughness + (fine - 0.5) * 0.16) * 255,
        0,
        255,
      ));
      albedo[i] = albedo[i + 1] = albedo[i + 2] = Math.round(value * 255);
      albedo[i + 3] = 255;
      height[i] = height[i + 1] = height[i + 2] = elevation;
      height[i + 3] = 255;
      roughness[i] = roughness[i + 1] = roughness[i + 2] = surfaceRough;
      roughness[i + 3] = 255;
    }
  }

  const maps = {
    color: texture(albedo, true),
    bump: texture(height),
    roughness: texture(roughness),
  };
  for (const value of Object.values(maps)) value.repeat.set(2.5, 2.5);
  textures.set(kind, maps);
  return maps;
}

/**
 * Immutable, shared materials. The procedural landmark disposer intentionally
 * preserves materials marked shared; they consume <1 MB for all six profiles.
 */
export function pbrSurface(kind, tint = "#ffffff", vertexColors = false) {
  const key = kind + ":" + tint + ":" + vertexColors;
  if (materials.has(key)) return materials.get(key);
  const profile = profiles[kind];
  const maps = mapsFor(kind);
  const surface = new THREE.MeshStandardMaterial({
    color: tint,
    vertexColors,
    map: maps.color,
    bumpMap: maps.bump,
    bumpScale: profile.bump,
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
  return textures.size * SIZE * SIZE * 4 * 3;
}
