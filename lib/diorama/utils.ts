export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function smoothstep(edge0: number, edge1: number, value: number) {
  const t = clamp((value - edge0) / (edge1 - edge0 || 0.00001), 0, 1);
  return t * t * (3 - 2 * t);
}

export function gaussian(x: number, z: number, cx: number, cz: number, radius: number) {
  const dx = (x - cx) / radius;
  const dz = (z - cz) / radius;
  return Math.exp(-(dx * dx + dz * dz));
}

export function ridge(
  x: number,
  z: number,
  cx: number,
  cz: number,
  radius: number,
  height: number,
) {
  return gaussian(x, z, cx, cz, radius) * height;
}

/** Smooth 2D value noise, deterministic for a seed. */
export function valueNoise2D(seed: number) {
  const rand = mulberry32(seed);
  const size = 256;
  const table = new Float32Array(size * size);
  for (let i = 0; i < table.length; i++) table[i] = rand();
  const at = (x: number, y: number) => {
    const xi = ((x % size) + size) % size;
    const yi = ((y % size) + size) % size;
    return table[yi * size + xi];
  };
  return (x: number, y: number) => {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const tx = x - x0;
    const ty = y - y0;
    const sx = tx * tx * (3 - 2 * tx);
    const sy = ty * ty * (3 - 2 * ty);
    const a = at(x0, y0);
    const b = at(x0 + 1, y0);
    const c = at(x0, y0 + 1);
    const d = at(x0 + 1, y0 + 1);
    return lerp(lerp(a, b, sx), lerp(c, d, sx), sy);
  };
}

export function fbm2D(seed: number, octaves = 4) {
  const noise = valueNoise2D(seed);
  return (x: number, y: number) => {
    let value = 0;
    let amplitude = 0.5;
    let frequency = 1;
    for (let i = 0; i < octaves; i++) {
      value += noise(x * frequency, y * frequency) * amplitude;
      frequency *= 2.03;
      amplitude *= 0.5;
    }
    return value;
  };
}
