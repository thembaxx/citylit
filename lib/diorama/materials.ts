import * as THREE from "three/webgpu";
import * as TSL from "three/tsl";

const {
  attribute,
  color,
  float,
  mix,
  mx_fractal_noise_float,
  mx_noise_float,
  oneMinus,
  positionLocal,
  positionWorld,
  sin,
  smoothstep,
  time,
  uniform,
  uv,
  vec3,
} = TSL;

export type StrataPalette = {
  top: string;
  upper: string;
  middle: string;
  lower: string;
  seam: string;
};

export function createStrataMaterial(palette: StrataPalette) {
  const material = new THREE.MeshStandardNodeMaterial({
    roughness: 0.86,
    metalness: 0.04,
    side: THREE.DoubleSide,
  });
  const p = positionWorld;
  const noise = mx_fractal_noise_float(
    vec3(p.x.mul(0.42), p.y.mul(1.35), p.z.mul(0.42)),
    3,
    2,
    0.5,
  );
  const fine = mx_noise_float(vec3(p.x.mul(1.8), p.y.mul(4.6), p.z.mul(1.8)));
  const yy = p.y.add(noise.mul(0.24));
  const band = sin(yy.mul(2.35)).mul(0.5).add(0.5);
  const bandFine = sin(yy.mul(5.4).add(1.8)).mul(0.5).add(0.5);
  const top = color(palette.top);
  const upper = color(palette.upper);
  const middle = color(palette.middle);
  const lower = color(palette.lower);
  const seamColor = color(palette.seam);

  const a = mix(lower, middle, smoothstep(0.12, 0.7, band));
  const b = mix(a, upper, smoothstep(0.35, 0.95, bandFine).mul(0.42));
  const c = mix(b, top, smoothstep(-1.4, 0.05, p.y).mul(0.16));
  const seam = smoothstep(0.975, 1.0, TSL.fract(yy.mul(0.42))).mul(0.24);
  const crack = smoothstep(0.78, 0.99, fine).mul(0.13);
  const grit = smoothstep(0.55, 0.95, noise).mul(0.08);
  material.colorNode = c
    .mul(oneMinus(seam))
    .mul(oneMinus(crack))
    .add(seamColor.mul(seam.mul(0.4)))
    .add(seamColor.mul(grit.mul(0.35)));
  material.userData.dioramaMaterial = "strata";
  return material;
}

export type WaterUniforms = {
  time: ReturnType<typeof uniform>;
  night: ReturnType<typeof uniform>;
  golden: ReturnType<typeof uniform>;
};

export function createWaterMaterial({
  deep = "#176d7d",
  shallow = "#69d5cd",
  foam = "#f2fffb",
  speed = 1,
}: {
  deep?: string;
  shallow?: string;
  foam?: string;
  speed?: number;
} = {}) {
  const uTime = uniform(0);
  const uNight = uniform(0);
  const uGolden = uniform(0);
  const material = new THREE.MeshStandardNodeMaterial({
    transparent: true,
    roughness: 0.24,
    metalness: 0.12,
    side: THREE.DoubleSide,
  });
  const depth = attribute("aDepth", "float");
  const p = positionWorld;
  const t = uTime.mul(speed);
  const ripple = sin(p.x.mul(3.1).add(t.mul(1.1)))
    .add(sin(p.z.mul(4.3).sub(t.mul(1.4))))
    .mul(0.5);
  const noise = mx_fractal_noise_float(vec3(p.x.mul(0.55), p.z.mul(0.55), t.mul(0.14)), 2, 2, 0.5);
  const shore = smoothstep(0.55, 0.04, depth);
  const deepColor = color(deep);
  const shallowColor = color(shallow);
  const foamColor = color(foam);
  const base = mix(
    deepColor,
    shallowColor,
    shore.mul(0.8).add(noise.mul(0.12)).add(ripple.mul(0.05)),
  );
  const foamMask = smoothstep(0.1, 0.0, depth)
    .mul(smoothstep(0.35, 0.85, ripple.add(noise).mul(0.5).add(0.5)))
    .mul(0.62);
  const goldenTint = mix(base, base.mul(vec3(1.16, 0.92, 0.66)), uGolden.mul(0.42));
  const nightTint = mix(goldenTint, goldenTint.mul(vec3(0.52, 0.64, 0.9)), uNight.mul(0.58));
  material.colorNode = mix(nightTint, foamColor, foamMask);
  material.emissiveNode = foamColor.mul(foamMask.mul(0.12));
  material.opacityNode = float(0.9).add(foamMask.mul(0.08));
  material.positionNode = vec3(
    positionLocal.x,
    positionLocal.y.add(ripple.mul(0.016)),
    positionLocal.z,
  );
  material.userData.dioramaMaterial = "water";
  material.userData.uniforms = {
    time: uTime,
    night: uNight,
    golden: uGolden,
  } satisfies WaterUniforms;
  return material;
}

export function createWaterfallMaterial() {
  const uTime = uniform(0);
  const material = new THREE.MeshBasicNodeMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const tex = uv();
  const flow = mx_fractal_noise_float(
    vec3(tex.x.mul(3.2), tex.y.mul(9.5).sub(uTime.mul(1.8)), 0),
    2,
    2,
    0.5,
  );
  const streak = smoothstep(0.18, 0.82, flow);
  // Fade the card's edges so the fall reads as water, not a lit rectangle.
  const edgeX = smoothstep(0, 0.3, tex.x).mul(smoothstep(1, 0.7, tex.x));
  const edgeTop = smoothstep(0.92, 1, tex.y).mul(0.5).add(0.5);
  const edgeBottom = smoothstep(0.1, 0, tex.y).mul(0.55).add(0.45);
  material.colorNode = mix(color("#bfeef7"), color("#ffffff"), streak);
  material.opacityNode = float(0.38).add(streak.mul(0.5)).mul(edgeX).mul(edgeTop).mul(edgeBottom);
  material.userData.dioramaMaterial = "waterfall";
  material.userData.uniforms = { time: uTime };
  return material;
}

/** A flat water surface ribbon used for rivers above sea level. */
export function createRiverMaterial({
  color = "#5aa6b4",
  emissive = "#0f3540",
  opacity = 0.92,
}: {
  color?: string;
  emissive?: string;
  opacity?: number;
} = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.16,
    metalness: 0.06,
    transparent: true,
    opacity,
    emissive: new THREE.Color(emissive),
    emissiveIntensity: 0.16,
  });
}

/** Basic node material used for mist and other soft transparent shapes. */
export function createMistMaterial(opacity = 0.18) {
  return new THREE.MeshBasicNodeMaterial({
    transparent: true,
    opacity,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

/** A material whose colour can be animated between day and night. */
export function createCloudMaterial() {
  const material = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    roughness: 1,
    metalness: 0,
    flatShading: true,
    transparent: true,
    opacity: 0.97,
    emissive: "#ffffff",
    emissiveIntensity: 0.06,
  });
  return material;
}

export function setMaterialUniforms(
  material: THREE.Material,
  values: { time?: number; night?: number; golden?: number },
) {
  const uniforms = material.userData.uniforms as
    | {
        time?: { value: number };
        night?: { value: number };
        golden?: { value: number };
      }
    | undefined;
  if (!uniforms) return;
  if (values.time !== undefined && uniforms.time) uniforms.time.value = values.time;
  if (values.night !== undefined && uniforms.night) uniforms.night.value = values.night;
  if (values.golden !== undefined && uniforms.golden) uniforms.golden.value = values.golden;
}

export { time };
