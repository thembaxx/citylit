// Ported from the supplied Citylit landmark study; r187-compatible procedural Three.js.
// Geometry is illustrative, not a survey-grade reproduction. No imported models/textures.
import * as THREE from "three";
import { createCoastalDiorama } from "./coastal-diorama.js";
import { pbrSurface } from "./landmark-pbr.js";
import { attachLandmarkRig, updateLandmarkRig } from "./landmark-rig.js";
import { addLandmarkScaleCues, applyLandmarkCraft, applyLandmarkLod } from "./landmark-craft.js";
import { landmarkSpec } from "./landmark-specs.js";

/** Coherent Gerstner-style water ripples, grazing highlights and shore foam. */
function waterShader(dayColor = "#318b94") {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uNight: { value: 0 },
      uDayTint: { value: new THREE.Color(dayColor) },
    },
    side: THREE.DoubleSide,
    vertexShader: `
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vLocal;
      void main() {
        vUv = uv;
        vLocal = position;
        vec3 p = position;
        p.y += 0.014 * sin(position.x * 7.4 + uTime * 1.3);
        p.y += 0.010 * cos(position.z * 10.7 - uTime * 0.9);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uNight;
      uniform vec3 uDayTint;
      varying vec2 vUv;
      varying vec3 vLocal;
      void main() {
        vec2 p = vLocal.xz * 3.8 + vUv * 2.0;
        float a = sin(p.x * 3.7 + uTime * 1.4) * cos(p.y * 3.2 - uTime * 0.8);
        float b = sin(p.x * 7.1 - p.y * 4.3 + uTime * 1.2);
        float ripple = a * 0.65 + b * 0.35;
        float highlight = pow(max(0.0, 0.52 + ripple * 0.34), 7.0);
        float foam = smoothstep(0.36, 0.50, length(vUv - 0.5)) * 0.12;
        vec3 resin = vec3(0.05, 0.72, 0.74);
        vec3 sand = vec3(0.93, 0.84, 0.66);
        float shore = smoothstep(0.46, 0.18, length(vUv - 0.5));
        float bands = sin(vUv.y * 46.0 - uTime * 1.2) * sin(vUv.x * 18.0 + uTime * 0.4);
        float crest = smoothstep(0.72, 0.98, bands) * shore;
        vec3 day = mix(sand, mix(resin, uDayTint, 0.72), 0.35 + shore * 0.5);
        vec3 night = vec3(0.01, 0.09, 0.18);
        vec3 water = mix(day, night, uNight);
        water += highlight * vec3(0.35, 0.55, 0.52);
        water = mix(water, vec3(0.96, 0.99, 1.0), crest * 0.85 + foam);
        gl_FragColor = vec4(water, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
}

/* ---------- helpers ---------- */
const M = (c, r = 0.7, m = 0) =>
  new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });

const G = (c, i = 1) => {
  const m = new THREE.MeshStandardMaterial({
    color: c,
    emissive: c,
    emissiveIntensity: 0.12,
    roughness: 0.5,
  });
  m.userData.i = i;
  return m;
};
const add = (g, geo, mat, x = 0, y = 0, z = 0) => {
  const o = new THREE.Mesh(geo, mat);
  o.position.set(x, y, z);
  g.add(o);
  return o;
};
const B = (w, h, d) => new THREE.BoxGeometry(w, h, d),
  C = (a, b, h, s = 32, hs = 1, o = false, ts = 0, tl = Math.PI * 2) =>
    new THREE.CylinderGeometry(a, b, h, s, hs, o, ts, tl);
const n = (x, z) =>
  Math.sin(x * 1.3 + z * 0.7) * 0.5 +
  Math.sin(x * 2.9 - z * 2.1) * 0.25 +
  Math.sin(x * 5.7 + z * 4.3) * 0.12;
const lines = (v, c) =>
  new THREE.LineSegments(
    new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(v, 3)),
    new THREE.LineBasicMaterial({ color: c }),
  );
const tint = (geo, fn) => {
  const p = geo.attributes.position,
    c = [],
    k = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    fn(k, p.getX(i), p.getY(i), p.getZ(i));
    c.push(k.r, k.g, k.b);
  }
  geo.setAttribute("color", new THREE.Float32BufferAttribute(c, 3));
  geo.computeVertexNormals();
  return geo;
};

/**
 * Add deterministic geological bedding to a lit PBR material in the WebGL shader.
 */
function addGeologicalStrata(material, { scale = 17, strength = 0.16, tint = "#b68f68" } = {}) {
  // Cloned PBR materials share cached DataTextures; only the material itself
  // is owned by this landmark instance and may be disposed on unmount.
  material.userData.sharedTextures = true;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uCityLitStrataScale = { value: scale };
    shader.uniforms.uCityLitStrataStrength = { value: strength };
    shader.uniforms.uCityLitStrataTint = { value: new THREE.Color(tint) };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vCityLitLocalPosition;")
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvCityLitLocalPosition = transformed;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform float uCityLitStrataScale;\nuniform float uCityLitStrataStrength;\nuniform vec3 uCityLitStrataTint;\nvarying vec3 vCityLitLocalPosition;",
      )
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
          float cityLitBedding = sin(
            vCityLitLocalPosition.y * uCityLitStrataScale +
            sin(vCityLitLocalPosition.x * 2.7 + vCityLitLocalPosition.z * 1.9) * 1.35
          );
          float cityLitLayer = smoothstep(-0.32, 0.32, cityLitBedding);
          vec3 cityLitStrataColor = mix(vec3(0.91), uCityLitStrataTint, cityLitLayer * 0.32);
          diffuseColor.rgb *= mix(vec3(1.0), cityLitStrataColor, uCityLitStrataStrength);`,
      );
  };
  material.customProgramCacheKey = () => "citylit-geological-strata-v1";
  material.needsUpdate = true;
  return material;
}

const R = (i) => {
  const x = Math.sin(i * 127.1) * 43758.5;
  return x - Math.floor(x);
};
const MC = {},
  Mc = (c) => MC[c] || (MC[c] = Object.assign(M(c, 0.9), { userData: { shared: true } }));
function tree(g, x, z, s = 1, k = 1, y = 0) {
  const t = new THREE.Group();
  t.position.set(x, y, z);
  t.scale.setScalar(s);
  t.rotation.y = R(x * 3 + z) * 6;
  add(t, C(0.04, 0.09, 0.9, 8), Mc(k == 2 ? "#5a3d26" : "#4a3a2a"), 0, 0.45, 0);
  for (let i = 0; i < 3; i++) {
    const b = add(
      t,
      C(0.015, 0.035, 0.5, 6),
      Mc("#4a3a2a"),
      Math.cos(i * 2.1) * 0.12,
      0.9,
      Math.sin(i * 2.1) * 0.12,
    );
    b.rotation.z = -Math.cos(i * 2.1) * 0.7;
    b.rotation.x = Math.sin(i * 2.1) * 0.7;
  }
  const cs = [
      ["#8a5fc0", "#a77bd6", "#6f4aa8"],
      ["#3f7a3a", "#5a9446", "#2e5f2d"],
      ["#9aa84a", "#b9b85a", "#7d8a3b"],
    ][k],
    f = new THREE.Group();
  f.position.y = 1.05;
  t.add(f);
  if (k == 2) f.scale.set(1.35, 0.65, 1.35);
  for (let i = 0; i < 9; i++) {
    const ge = new THREE.IcosahedronGeometry(0.22 + R(i + k * 9) * 0.14, 1),
      p = ge.attributes.position;
    for (let j = 0; j < p.count; j++) {
      const X = p.getX(j),
        Y = p.getY(j),
        Z = p.getZ(j),
        d = 1 + 0.16 * Math.sin(X * 23 + i) * Math.cos(Z * 19 + Y * 11);
      p.setXYZ(j, X * d, Y * d, Z * d);
    }
    ge.computeVertexNormals();
    const q = 0.32 * (1 + (i % 3) * 0.3);
    add(
      f,
      ge,
      Mc(cs[i % 3]),
      Math.cos(i * 2.4) * q,
      R(i + 3) * 0.4 + (i > 5 ? 0.3 : 0),
      Math.sin(i * 2.4) * q,
    );
  }
  g.add(t);
  f.userData.wind = { ph: R(x * 7 + z) * 6, a: 0.03, sp: 1.1 };
  return t;
}
function drift(g, n, col, sz, fn) {
  const p = new Float32Array(n * 3),
    ge = new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(p, 3)),
    o = new THREE.Points(
      ge,
      new THREE.PointsMaterial({
        color: col,
        size: sz,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
      }),
    );
  o.frustumCulled = false;
  g.add(o);
  return (t) => {
    for (let i = 0; i < n; i++) {
      const v = fn(i, t);
      p[i * 3] = v[0];
      p[i * 3 + 1] = v[1];
      p[i * 3 + 2] = v[2];
    }
    ge.attributes.position.needsUpdate = true;
  };
}
/* ---------- 1 · Table Mountain ---------- */
const lump = (g, r, x, z, sx, sy, sc) => {
  const s = new THREE.SphereGeometry(r, 64, 32),
    p = s.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const f = 1 + 0.07 * n(p.getX(i) * 3, p.getZ(i) * 3);
    p.setXYZ(i, p.getX(i) * f * sx, p.getY(i) * f * sy, p.getZ(i) * f);
  }
  s.computeVertexNormals();
  add(g, s, M(sc, 0.95), x, 0.4, z);
};
/**
 * The Cape Town skyline has a broad, nearly horizontal summit and abrupt
 * sandstone faces—not a circular cone. Generate one indexed, vertex-colored
 * massif with distinct cliff, talus and foothill zones.
 */
/** Sculpt separate angular Cape peaks rather than adding smooth spherical foothills. */
function createCompanionPeak(height, radius, seed) {
  const geo = new THREE.CylinderGeometry(0.025, radius, height, 56, 25, false);
  const positions = geo.attributes.position;
  const colors = [];
  const green = new THREE.Color("#597056");
  const sandstone = new THREE.Color("#aaa28d");
  const tint = new THREE.Color();
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);
    const angle = Math.atan2(z, x);
    const fraction = THREE.MathUtils.clamp((y + height * 0.5) / height, 0, 1);
    const folds = 0.08 * Math.sin(angle * 9 + seed) + 0.055 * Math.sin(angle * 17 - seed);
    const strata = 0.06 * Math.sin(y * 12 + angle * 3);
    const factor = 1 + folds + strata;
    positions.setXYZ(i, x * factor, y + 0.025 * Math.sin(x * 13 + seed), z * factor);
    tint.copy(green).lerp(sandstone, Math.pow(fraction, 0.78));
    tint.multiplyScalar(0.93 + 0.065 * Math.sin(y * 8 + angle * 7));
    colors.push(tint.r, tint.g, tint.b);
  }
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

function createTableMassif() {
  const geometry = new THREE.BufferGeometry();
  const cols = 100;
  const rows = 72;
  const positions = [];
  const colors = [];
  const uvs = [];
  const faces = [];
  const rock = new THREE.Color("#8d897b");
  const slopes = new THREE.Color("#5e7555");
  const summit = new THREE.Color("#aaa18c");
  const color = new THREE.Color();

  for (let row = 0; row <= rows; row++) {
    const z = -4.2 + (row / rows) * 8.4;
    for (let col = 0; col <= cols; col++) {
      const x = -6.05 + (col / cols) * 12.1;
      const rimX = Math.max(0, Math.abs(x) - 3.05);
      const rimZ = Math.max(0, Math.abs(z) - 1.46);
      const distance = Math.hypot(rimX, rimZ * 1.38);
      const cliff = THREE.MathUtils.smoothstep(distance, 0.08, 0.64);
      const talus = THREE.MathUtils.smoothstep(distance, 0.65, 2.42);
      const outer = THREE.MathUtils.smoothstep(distance, 2.42, 3.7);
      const erosion = Math.pow(Math.abs(Math.sin(x * 1.7 + z * 2.15)), 8);
      const gully = 0.16 * erosion * cliff * (1 - outer);
      const sediment = 0.045 * Math.sin(x * 7.3 + z * 2.4) * Math.cos(z * 5.4);
      const ledge = 0.04 * Math.sin(x * 4.2) * Math.sin(z * 5.9) * cliff;
      const y = Math.max(
        0.11,
        2.86 - 1.57 * cliff - 1.12 * talus - 0.12 * outer - gully + sediment + ledge,
      );
      positions.push(x, y, z);
      uvs.push((col / cols) * 2, (row / rows) * 2);

      const rockMix = THREE.MathUtils.smoothstep(y, 0.25, 2.5);
      color.copy(slopes).lerp(rock, rockMix);
      if (distance < 0.21) color.lerp(summit, 0.36);
      const bedding = 0.035 * Math.sin(y * 22.0 + x * 0.65);
      color.multiplyScalar(0.96 + bedding + 0.05 * Math.sin(x * 2.4 + z));
      colors.push(color.r, color.g, color.b);
    }
  }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const a = row * (cols + 1) + col;
      const b = a + 1;
      const c = a + cols + 1;
      const d = c + 1;
      faces.push(a, c, b, b, c, d);
    }
  }
  geometry.setIndex(faces);
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  geometry.name = "TableMountainMassif";
  return geometry;
}

function table() {
  const g = new THREE.Group(),
    vm = addGeologicalStrata(pbrSurface("cliff", "#ffffff", true).clone(), {
      scale: 12.5,
      strength: 0.2,
      tint: "#b89b76",
    });
  vm.userData.shared = false;
  add(g, C(6.2, 6.9, 0.5, 96), M("#486a38", 1), 0, 0.25, 0);
  const massif = add(g, createTableMassif(), vm);
  massif.name = "table-mountain-flat-summit";
  const devils = add(g, createCompanionPeak(2.65, 1.37, 8), vm, -4.9, 1.825, 1.9);
  devils.name = "table-mountain-devils-peak";
  const lions = add(g, createCompanionPeak(2.35, 1.03, 21), vm, 4.7, 1.675, 0.9);
  lions.name = "table-mountain-lions-head";
  lump(g, 1.2, -1.5, -4.6, 1.4, 0.7, "#58763f");
  const cm = M("#ffffff", 1);
  cm.transparent = true;
  cm.opacity = 0.93;
  const cl = [];
  for (let i = 0; i < 10; i++) {
    const x = -3 + i * 0.66,
      z = Math.sqrt(Math.max(0.4, 12.5 - x * x)) * 0.8,
      o = add(g, new THREE.SphereGeometry(0.6, 24, 16), cm, x, 2.75 + (i % 3) * 0.08, z);
    o.scale.set(1.3, 0.5, 1);
    o.userData.x = x;
    cl.push(o);
  }
  [-1.6, 0, 1.6].forEach((x) => {
    const o = add(g, new THREE.SphereGeometry(0.5, 24, 16), cm, x, 2.2, 3.5);
    o.scale.set(1.2, 0.9, 0.6);
    o.userData.x = x;
    cl.push(o);
  });
  // A pair of instanced batches replaces 110 individual bush/rock draws.
  const foliage = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(0.16, 1),
    M("#ffffff", 1),
    80,
  );
  const palette = ["#3d5a2e", "#6b7f3a", "#8a5a3a"].map((c) => new THREE.Color(c));
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3();
  const rotation = new THREE.Quaternion();
  for (let i = 0; i < 80; i++) {
    const angle = R(i) * Math.PI * 2;
    const radius = 5.75 + R(i + 99) * 0.55;
    position.set(radius * Math.cos(angle), 0.5, radius * Math.sin(angle));
    scale.set(1 + R(i + 5), 0.7 + R(i + 7) * 0.6, 1 + R(i + 9));
    matrix.compose(position, rotation, scale);
    foliage.setMatrixAt(i, matrix);
    foliage.setColorAt(i, palette[i % palette.length]);
  }
  foliage.instanceMatrix.needsUpdate = true;
  if (foliage.instanceColor) foliage.instanceColor.needsUpdate = true;
  foliage.name = "table-mountain-instanced-fynbos";
  g.add(foliage);

  const rocks = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(0.17, 0),
    M("#a58c68", 1),
    30,
  );
  for (let i = 0; i < 30; i++) {
    const angle = R(i + 200) * Math.PI * 2;
    const radius = Math.sqrt(R(i + 300)) * 3.1;
    position.set(radius * Math.cos(angle), 2.9, radius * Math.sin(angle));
    scale.set(1 + R(i) * 1.2, 0.5, 1 + R(i + 1));
    matrix.compose(position, rotation, scale);
    rocks.setMatrixAt(i, matrix);
  }
  rocks.instanceMatrix.needsUpdate = true;
  rocks.name = "table-mountain-instanced-rocks";
  g.add(rocks);
  add(g, C(0.08, 0.2, 0.45, 10), M("#8d8d8d", 0.9), -0.8, 2.85, -1.2);
  add(g, B(0.7, 0.2, 0.6), M("#c9c9c9", 0.5, 0.3), 1, 0.7, 6.4);
  add(g, B(0.6, 0.16, 0.6), M("#c9c9c9", 0.5, 0.3), 1, 3.1, 1.8);
  g.add(lines([1, 1.1, 6.4, 1, 2.9, 1.8], "#222"));
  for (let i = 0; i < 8; i++) {
    const a = 3 + i * 0.2;
    lump(
      g,
      0.75 + R(i) * 0.3,
      6.4 * Math.cos(a),
      6.4 * Math.sin(a),
      1,
      1.2,
      i % 2 ? "#6f7f4e" : "#7b7b55",
    );
  }
  const gm = M("#2d3a2a", 1);
  [
    [-0.3, 1.45, 4.55, 0.18],
    [1.7, 1.5, 4.3, 0.1],
    [-2.1, 1.5, 4.1, 0.1],
  ].forEach(([x, y, z, w]) => {
    add(g, B(w, 1.6, 0.3), gm, x, y, z).rotation.x = -0.69;
  });
  for (let i = 0; i < 8; i++) {
    const o = add(
      g,
      new THREE.SphereGeometry(0.4, 16, 12),
      cm,
      -2.4 + i * 0.7,
      2.9,
      -2.2 - R(i) * 0.6,
    );
    o.scale.set(1.3, 0.45, 1);
    o.userData.x = o.position.x;
    cl.push(o);
  }
  const cab = add(g, B(0.34, 0.24, 0.26), M("#d33", 0.4, 0.3));
  cab.name = "table-mountain-cable-car-up";
  [1.8, 2, 2.2, 2.4, -0.5, -0.8, -1.1].forEach((a, i) =>
    tree(g, 6.3 * Math.cos(a), 6.3 * Math.sin(a), 1 + R(i) * 0.5, 1, 0.5),
  );
  const cab2 = add(g, B(0.34, 0.24, 0.26), M("#2a6fd3", 0.4, 0.3));
  cab2.name = "table-mountain-cable-car-down";
  // Summit plateau lookout terrace & human-scale visitor cues (clear of cable car path)
  const summitDeck = add(g, B(0.85, 0.08, 0.55), M("#a89a82", 0.9), -1.1, 2.74, -0.35);
  summitDeck.name = "table-mountain-summit-terrace";
  [-1.32, -0.88].forEach((vx, idx) => {
    const visitor = add(
      g,
      B(0.06, 0.14, 0.06),
      M(idx ? "#c25934" : "#324b5c", 0.8),
      vx,
      2.85,
      -0.35,
    );
    visitor.name = `table-mountain-summit-visitor-${idx + 1}`;
    visitor.userData.scaleCue = true;
  });
  g.add(lines([1.4, 1.1, 6.4, 1.4, 2.9, 1.8], "#222"));
  const gls = [0, 1, 2, 3, 4].map(() => {
    const b = new THREE.Group(),
      m = M("#f2f2f2", 0.6);
    [-1, 1].forEach((s) => {
      add(b, B(0.16, 0.015, 0.07), m, s * 0.08, 0, 0).userData.s = s;
    });
    g.add(b);
    return b;
  });
  g.userData.tick = (t) => {
    cl.forEach((c, i) => {
      const z0 = (c.userData.z0 ??= c.position.z);
      c.position.x = c.userData.x + Math.sin(t * 0.4 + i) * 0.16;
      c.position.z = z0 + Math.sin(t * 0.3 + i * 1.3) * 0.14;
      c.scale.y = (c.userData.sy ??= c.scale.y) * (1 + 0.14 * Math.sin(t * 0.6 + i));
    });
    const u = (Math.sin(t * 0.35) + 1) / 2;
    cab.position.set(1, 1.0 + 1.8 * u, 6.4 - 4.6 * u);
    cab2.position.set(1.4, 1.0 + 1.8 * (1 - u), 6.4 - 4.6 * (1 - u));
    cab.rotation.z = cab2.rotation.z = Math.sin(t * 1.7) * 0.06;
    gls.forEach((b, i) => {
      const a = t * 0.25 + i * 1.3;
      b.position.set(5 * Math.cos(a), 4.2 + Math.sin(t * 0.7 + i) * 0.3, 5 * Math.sin(a));
      b.rotation.y = -a;
      b.children.forEach((w) => (w.rotation.z = w.userData.s * Math.sin(t * 9 + i) * 0.6));
    });
  };
  return g;
}

/* ---------- 2 · Union Buildings ---------- */
function union() {
  const g = new THREE.Group(),
    st = pbrSurface("sandstone", "#d8b888"),
    dk = pbrSurface("sandstone", "#b8955f"),
    cu = pbrSurface("terracotta", "#9c674d"),
    gr = M("#587a45", 1),
    wn = G("#ffcf8a");
  dk.side = 2;
  add(g, B(12.6, 0.8, 5.4), st, 0, 0.4, -2.5);
  [
    [2.2, 0.2],
    [1.5, 0.4],
    [0.9, 0.6],
  ].forEach(([z, h]) => {
    add(g, B(12.2, h, 1), st, 0, h / 2, z);
    add(g, B(11.6, 0.03, 0.7), gr, 0, h + 0.01, z);
  });
  add(g, C(3.75, 3.75, 1.85, 64, 1, true, Math.PI / 2, Math.PI), dk, 0, 1.725, -1.2);
  const sh = new THREE.Shape();
  sh.absarc(0, 0, 3.9, 0, Math.PI, false);
  sh.absarc(0, 0, 3, Math.PI, 0, true);
  add(
    g,
    new THREE.ExtrudeGeometry(sh, { depth: 0.3, bevelEnabled: false, curveSegments: 48 }).rotateX(
      -Math.PI / 2,
    ),
    st,
    0,
    2.65,
    -1.2,
  );
  // Continuous semicircular terracotta parapet frames Baker's central amphitheatre.
  const galleryRoof = add(
    g,
    new THREE.TorusGeometry(3.72, 0.13, 9, 96, Math.PI).rotateX(-Math.PI / 2),
    pbrSurface("terracotta", "#b16c4e"),
    0,
    2.92,
    -1.2,
  );
  galleryRoof.name = "union-buildings-curved-terracotta-gallery";
  for (let step = 0; step < 7; step++) {
    const radius = 2.1 + step * 0.19;
    add(
      g,
      new THREE.RingGeometry(radius, radius + 0.105, 64, 1, 0, Math.PI).rotateX(-Math.PI / 2),
      pbrSurface("limestone", "#cbbda0"),
      0,
      0.115 + step * 0.008,
      -1.2,
    );
  }

  for (let i = 0; i <= 18; i++) {
    const a = (i / 18) * Math.PI;
    add(g, C(0.09, 0.1, 1.85, 12), st, 3.45 * Math.cos(a), 1.725, -1.2 - 3.45 * Math.sin(a));
  }
  [-1, 1].forEach((s) => {
    const wing = new THREE.Group();
    wing.name = s < 0 ? "union-buildings-west-wing" : "union-buildings-east-wing";
    g.add(wing);
    add(wing, B(2.6, 2, 2.4), st, s * 5.1, 1.8, -1.2);
    add(wing, B(2.8, 0.2, 2.6), dk, s * 5.1, 2.9, -1.2);
    const terracotta = pbrSurface("terracotta", "#b66b4b");
    // Two pitched red-tile roofs per wing, aligned with the real sandstone facade.
    for (const face of [-1, 1]) {
      const roofPlane = add(
        wing,
        B(2.77, 0.09, 1.34),
        terracotta,
        s * 5.1,
        3.12,
        -1.2 + face * 0.55,
      );
      roofPlane.rotation.x = face * 0.18;
      roofPlane.name = "union-buildings-tiled-wing-roof";
    }
    add(wing, B(1.3, 3.6, 1.3), st, s * 5.8, 2.6, -0.9);
    add(wing, C(0.55, 0.65, 0.5, 24), st, s * 5.8, 4.65, -0.9);
    add(
      wing,
      new THREE.SphereGeometry(0.7, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      cu,
      s * 5.8,
      4.9,
      -0.9,
    );
    // The paired sandstone cupolas gain a visible drum rim, radial ribs and finial.
    add(
      wing,
      new THREE.TorusGeometry(0.65, 0.026, 8, 48).rotateX(Math.PI / 2),
      dk,
      s * 5.8,
      4.91,
      -0.9,
    );
    const domeRibs = [];
    for (let rib = 0; rib < 20; rib++) {
      const angle = (rib / 20) * Math.PI * 2;
      for (let segment = 0; segment < 4; segment++) {
        const lower = segment / 4;
        const upper = (segment + 1) / 4;
        const lowerRadius = 0.65 * (1 - lower);
        const upperRadius = 0.65 * (1 - upper);
        domeRibs.push(
          s * 5.8 + Math.cos(angle) * lowerRadius,
          4.92 + lower * 0.66,
          -0.9 + Math.sin(angle) * lowerRadius,
          s * 5.8 + Math.cos(angle) * upperRadius,
          4.92 + upper * 0.66,
          -0.9 + Math.sin(angle) * upperRadius,
        );
      }
    }
    wing.add(lines(domeRibs, "#8c7155"));
    add(wing, C(0.035, 0.045, 0.2, 12), dk, s * 5.8, 5.68, -0.9);
    add(wing, new THREE.SphereGeometry(0.065, 12, 8), dk, s * 5.8, 5.8, -0.9);
    for (let j = 0; j < 3; j++)
      for (let r = 0; r < 2; r++)
        add(wing, B(0.35, 0.55, 0.05), wn, s * 5.1 + (j - 1) * 0.75 - s * 0.2, 1.4 + r * 0.9, 0);
  });
  const fl = M("#d8d8d0", 0.4, 0.5),
    hd = M("#3f6a3a", 1),
    sb = M("#e6dcc4", 0.8),
    bz = M("#8a6a3a", 0.4, 0.7);
  for (let i = 0; i < 18; i++) {
    const a = ((i + 0.5) / 18) * Math.PI;
    add(g, B(0.28, 0.9, 0.06), wn, 3.68 * Math.cos(a), 1.6, -1.2 - 3.68 * Math.sin(a)).rotation.y =
      Math.atan2(-Math.cos(a), Math.sin(a));
  }
  [-1, 1].forEach((s) => {
    add(g, C(0.03, 0.03, 2.4, 8), fl, s * 5.8, 6.8, -0.9);
    add(
      g,
      new THREE.PlaneGeometry(0.55, 0.32, 10, 1),
      Object.assign(M("#007749", 0.6), { side: 2 }),
      s * 5.8 + 0.3,
      7.6,
      -0.9,
    ).userData.flag = 1;
  });
  // Rows of formal parterres and indigenous shrubs follow the garden terraces.
  const hedge = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.51, 0.18, 0.16),
    pbrSurface("limestone", "#64854e"),
    36,
  );
  const matrix = new THREE.Matrix4();
  for (let i = 0; i < 36; i++) {
    const x = ((i % 18) - 8.5) * 0.63;
    const z = 1.3 + Math.floor(i / 18) * 0.84;
    matrix.makeTranslation(x, 0.27, z);
    hedge.setMatrixAt(i, matrix);
  }
  hedge.instanceMatrix.needsUpdate = true;
  hedge.name = "union-buildings-terraced-garden-parterres";
  g.add(hedge);
  for (let i = -4; i <= 4; i++) {
    add(g, new THREE.ConeGeometry(0.2, 0.65, 10), hd, i * 1.3, 0.53, 2.25);
    add(g, new THREE.ConeGeometry(0.2, 0.65, 10), hd, i * 1.3 + 0.65, 0.73, 1.5);
  }
  [
    [2.2, 0.2],
    [1.5, 0.4],
    [0.9, 0.6],
  ].forEach(([z, h]) => add(g, B(1.6, h + 0.03, 1), sb, 0, (h + 0.03) / 2, z));
  add(g, B(0.7, 0.5, 0.7), st, 0, 1.05, -0.4);
  add(g, C(0.12, 0.16, 0.8, 12), bz, 0, 1.7, -0.4);
  add(g, new THREE.SphereGeometry(0.12, 16, 12), bz, 0, 2.2, -0.4);
  add(g, B(1.3, 0.09, 0.09), bz, 0, 2, -0.4);
  for (let i = 0; i < 28; i++) add(g, C(0.03, 0.03, 0.3, 6), st, -5.9 + i * 0.44, 0.95, 0.15);
  add(g, B(12.4, 0.06, 0.1), st, 0, 1.12, 0.15);
  [-1, 1].forEach((s) => {
    for (let j = 0; j < 4; j++)
      add(g, C(0.07, 0.08, 2, 12), st, s * 5.1 + (j - 1.5) * 0.75, 1.8, 0.2);
    const p = add(g, new THREE.ConeGeometry(1.5, 0.6, 4), dk, s * 5.1, 3.2, 0.1);
    p.rotation.y = Math.PI / 4;
    p.scale.z = 0.25;
  });
  for (let i = 0; i < 12; i++)
    tree(g, (i < 6 ? -1 : 1) * (3.6 + (i % 6) * 0.8), 3.2 + (i % 2) * 0.5, 1.15 + R(i) * 0.4, 0);
  const pet = drift(g, 70, "#b58be0", 0.07, (i, t) => {
    const u = ((R(i) * 3 + t * 0.3) % 3) / 3;
    return [
      (i % 2 ? -1 : 1) * (3.6 + R(i + 9) * 4.4) + Math.sin(t + i) * 0.3,
      2.3 * (1 - u) + 0.05,
      2.6 + R(i + 5) * 1.3 + Math.cos(t * 0.7 + i) * 0.2,
    ];
  });
  const fg = g.children.filter((o) => o.userData.flag);
  g.userData.tick = (t) => {
    pet(t);
    fg.forEach((f, k) => {
      const p = f.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i);
        p.setZ(i, Math.sin(x * 9 - t * 6 + k) * 0.05 * (x + 0.275) * 2);
      }
      p.needsUpdate = true;
    });
  };
  g.scale.setScalar(0.78);
  return g;
}

/* ---------- 3 · Moses Mabhida Stadium ---------- */
/** Folded membrane wedges give the stadium its distinctive radial roof texture. */
function createStadiumRoofPanels() {
  // Reference roof is formed from 208 PTFE panels; matching angular frequency is cheap.
  const segments = 208;
  const positions = [];
  const colors = [];
  const indices = [];
  const white = new THREE.Color("#f1f1ec");
  const shadow = new THREE.Color("#c8d0d0");
  const color = new THREE.Color();
  for (let i = 0; i < segments; i++) {
    const a = (i * 2 * Math.PI) / segments;
    const b = ((i + 1) * 2 * Math.PI) / segments;
    const base = positions.length / 3;
    const ridge = i % 2 ? 0.09 : 0.16;
    for (const angle of [a, b]) {
      for (const [radius, elevation] of [
        [3.31, 2.13],
        [3.92, 2.32 + ridge],
        [4.46, 2.4],
      ]) {
        positions.push(radius * 1.1 * Math.cos(angle), elevation, radius * 0.78 * Math.sin(angle));
        color.copy(white).lerp(shadow, radius === 3.92 ? 0.12 : i % 2 ? 0.22 : 0.04);
        colors.push(color.r, color.g, color.b);
      }
    }
    indices.push(
      base,
      base + 3,
      base + 1,
      base + 1,
      base + 3,
      base + 4,
      base + 1,
      base + 4,
      base + 2,
      base + 2,
      base + 4,
      base + 5,
    );
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.name = "MosesMabhidaRoofMembrane";
  return geometry;
}

function stadium() {
  const ovalX = 1.1;
  const ovalZ = 0.78;
  const g = new THREE.Group(),
    sh = pbrSurface("membrane", "#e9e6df"),
    st = M("#f4f4f4", 0.3, 0.6),
    gl = G("#9fd0ff", 1.4);
  sh.side = 2;
  const pr = [
    [2.3, 0.15],
    [3.2, 1.3],
    [3.9, 2.1],
    [4.4, 2.35],
    [4.4, 1.2],
    [4.2, 0],
  ].map((p) => new THREE.Vector2(...p));
  add(g, new THREE.LatheGeometry(pr, 96), sh).scale.set(ovalX, 1, ovalZ);
  add(
    g,
    new THREE.CircleGeometry(2.3, 64).rotateX(-Math.PI / 2),
    M("#3f8a4a", 1),
    0,
    0.16,
    0,
  ).scale.set(ovalX, 1, ovalZ);
  add(
    g,
    new THREE.TorusGeometry(4.35, 0.1, 10, 128).rotateX(Math.PI / 2),
    gl,
    0,
    2.35,
    0,
  ).scale.set(ovalX, 1, ovalZ);
  add(g, new THREE.TorusGeometry(4.4, 0.05, 8, 128).rotateX(Math.PI / 2), gl, 0, 1.3, 0).scale.set(
    ovalX,
    1,
    ovalZ,
  );
  const H = 7.2,
    y = (x) => Math.max(0.1, H * (1 - (x / 5.6) ** 2));
  // Moses Mabhida has one monumental arch, not a pair of parallel arches.
  // A single continuous sweep keeps its skyline silhouette unmistakable.
  const archPoints = [];
  for (let i = 0; i <= 80; i++) {
    const x = -5.6 + (i / 80) * 11.2;
    archPoints.push(new THREE.Vector3(x, y(x), 0));
  }
  const signatureArch = add(
    g,
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(archPoints), 180, 0.15, 12),
    st,
  );
  signatureArch.name = "moses-mabhida-single-signature-arch";
  const v = [];
  for (let x = -3.6; x <= 3.7; x += 0.4) {
    const zz = Math.sqrt(4.35 * 4.35 - x * x);
    [-1, 1].forEach((s) => v.push(x, y(x), 0, x, 2.35, s * zz));
  }
  g.add(lines(v, "#dfe6ee"));
  [
    [0.25, 0.7, 2.378, 2.73, "#2f6bb3"],
    [0.8, 1.2, 2.81, 3.12, "#e6e6e6"],
    [1.4, 2, 3.288, 3.81, "#2f6bb3"],
  ].forEach(([a, b, r1, r2, c]) => {
    const m = M(c, 0.8);
    m.side = 2;
    add(g, C(r2 - 0.03, r1 - 0.03, b - a, 96, 1, true), m, 0, (a + b) / 2, 0).scale.set(
      ovalX,
      1,
      ovalZ,
    );
  });
  const fm = pbrSurface("concrete", "#cfd3d8");
  const ribGeo = B(0.08, 2.35, 0.16);
  const ribs = new THREE.InstancedMesh(ribGeo, fm, 48);
  ribs.name = "moses-mabhida-facade-ribs";
  const ribDummy = new THREE.Object3D();
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * 6.2832;
    ribDummy.position.set(4.38 * ovalX * Math.cos(a), 1.18, 4.38 * ovalZ * Math.sin(a));
    ribDummy.rotation.set(0, -a, 0);
    ribDummy.updateMatrix();
    ribs.setMatrixAt(i, ribDummy.matrix);
  }
  ribs.instanceMatrix.needsUpdate = true;
  g.add(ribs);
  for (let i = 0; i < 4; i++) {
    const a = i * 1.5708 + 0.785,
      x = 4.6 * ovalX * Math.cos(a),
      z = 4.6 * ovalZ * Math.sin(a);
    add(g, C(0.03, 0.05, 3.2, 8), fm, x, 3.2, z);
    add(g, B(0.5, 0.3, 0.1), gl, x, 4.9, z).lookAt(0, 2, 0);
  }
  g.add(
    lines(
      [
        -1.5, 0.18, -1, 1.5, 0.18, -1, 1.5, 0.18, -1, 1.5, 0.18, 1, 1.5, 0.18, 1, -1.5, 0.18, 1,
        -1.5, 0.18, 1, -1.5, 0.18, -1, 0, 0.18, -1, 0, 0.18, 1,
      ],
      "#ffffff",
    ),
  );
  add(g, new THREE.RingGeometry(0.3, 0.33, 48).rotateX(-Math.PI / 2), M("#fff", 0.9), 0, 0.18, 0);
  const membrane = pbrSurface("membrane", "#fffdf4", true);
  membrane.side = THREE.DoubleSide;
  const roofCanopy = add(g, createStadiumRoofPanels(), membrane);
  roofCanopy.name = "moses-mabhida-radial-roof";
  const tv = [],
    av = [];
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * 6.2832,
      c = Math.cos(a),
      s = Math.sin(a);
    tv.push(3.3 * ovalX * c, 2.15, 3.3 * ovalZ * s, 4.45 * ovalX * c, 2.4, 4.45 * ovalZ * s);
    av.push(2.4 * ovalX * c, 0.22, 2.4 * ovalZ * s, 3.75 * ovalX * c, 1.95, 3.75 * ovalZ * s);
  }
  g.add(lines(tv, "#aab4c0"));
  g.add(lines(av, "#8794a6"));
  add(g, C(5.6, 5.8, 0.12, 96), M("#b9b4a8", 0.9), 0, 0.06, 0);
  [-1, 1].forEach((s) => add(g, B(0.6, 0.5, 0.6), M("#9a9a96", 0.9), -5.6, 0.25, s * 1.7));
  add(g, B(0.7, 0.5, 0.9), M("#9a9a96", 0.9), 5.6, 0.25, 0);
  for (let i = 0; i < 5; i++)
    add(g, B(0.3, 0.01, 2.1), M(i % 2 ? "#4d9d58" : "#3a8446", 1), -1.2 + i * 0.6, 0.17, 0);
  const sk = add(g, B(0.3, 0.26, 0.3), M("#d33", 0.4, 0.3));
  sk.name = "moses-mabhida-arch-cable-car";
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * 6.2832 + 0.2;
    tree(g, 6.9 * Math.cos(a), 6.9 * Math.sin(a), 0.9 + R(i) * 0.3, i % 3 ? 1 : 2);
  }
  g.userData.tick = (t) => {
    const x = -5.2 + 10.4 * (Math.sin(t * 0.25) * 0.5 + 0.5);
    sk.position.set(x, y(x) - 0.32, 0);
    sk.rotation.z = Math.cos(t * 0.25) * 0.12;
    gl.color.setHSL((t * 0.04) % 1, 0.55, 0.6);
    gl.emissive.copy(gl.color);
  };
  g.scale.setScalar(0.95);
  return g;
}

/* ---------- 4 · Nelson Mandela Bridge ---------- */
function bridge() {
  const g = new THREE.Group(),
    wh = pbrSurface("limestone", "#f0f0f0"),
    dk = pbrSurface("concrete", "#2b2e36"),
    skyMat = pbrSurface("sandstone", "#c9b99a"),
    bd = G("#ffd896", 0.9),
    v = [];
  const deck = add(g, B(15, 0.2, 1.7), dk, 0, 1.7, 0);
  deck.name = "bridge-road-deck";
  [-7.4, 7.4].forEach((x, idx) => {
    const abutment = add(g, B(1.2, 1.7, 1.9), dk, x, 0.85, 0);
    abutment.name = idx === 0 ? "bridge-abutment-west" : "bridge-abutment-east";
  });
  [
    [-2.3, 0.9],
    [2.5, -0.9],
  ].forEach(([mx, mz], idx) => {
    const pylon = add(g, C(0.05, 0.16, 6.4, 16), wh, mx, 4.9, mz);
    pylon.name = idx === 0 ? "bridge-pylon-west" : "bridge-pylon-east";
    for (let i = -6; i <= 6; i++) {
      if (!i) continue;
      v.push(mx, 8.1 - Math.abs(i) * 0.3, mz, mx + i * 0.55, 1.8, mz);
    }
  });
  const cableHarps = lines(v, "#e9e9e9");
  cableHarps.name = "bridge-stay-cables";
  g.add(cableHarps);
  for (let k = 0; k < 6; k++) add(g, B(18, 0.05, 0.08), M("#777", 0.4, 0.8), 0, 0.05, -3 + k * 1.2);
  const trn = [
    [-4, -1.2, "#b5532f"],
    [3, 1.8, "#3d6fa8"],
    [-0.5, -2.4, "#c8a53a"],
  ].map(([x, z, c], idx) => {
    const m = add(g, B(2.6, 0.4, 0.6), M(c, 0.6, 0.2), x, 0.3, z);
    m.name = `bridge-commuter-train-${idx + 1}`;
    m.userData.x0 = x;
    return m;
  });
  const siloTower = add(g, C(0.8, 0.8, 5.6, 32), skyMat, -5.5, 2.8, -4);
  siloTower.name = "bridge-skyline-rotunda";
  const cv = document.createElement("canvas");
  cv.width = 64;
  cv.height = 128;
  const cx = cv.getContext("2d");
  cx.fillStyle = "#2a2d35";
  cx.fillRect(0, 0, 64, 128);
  for (let r = 0; r < 16; r++)
    for (let c = 0; c < 8; c++) {
      cx.fillStyle = R(r * 8 + c + 3) > 0.45 ? "#ffd98a" : "#3a3f4a";
      cx.fillRect(c * 8 + 1, r * 8 + 1, 5, 5);
    }
  const tx = new THREE.CanvasTexture(cv);
  tx.colorSpace = THREE.SRGBColorSpace;
  const wt = new THREE.MeshStandardMaterial({
    map: tx,
    emissive: "#ffffff",
    emissiveMap: tx,
    emissiveIntensity: 0.05,
    roughness: 0.7,
  });
  wt.userData.i = 0.5;
  for (let i = 0; i < 16; i++) {
    const k = (i * 37) % 7;
    add(
      g,
      B(0.9, 1 + k * 0.55, 0.9),
      wt,
      -7.4 + i * 0.98,
      (1 + k * 0.55) / 2,
      -5.8 + (i % 3) * 0.55,
    );
  }
  g.add(
    lines(
      [
        -2.3, 8.1, 0.9, -7, 1.8, 0.9, -2.3, 8.1, 0.9, -6.6, 1.8, 0.9, 2.5, 8.1, -0.9, 7, 1.8, -0.9,
        2.5, 8.1, -0.9, 6.6, 1.8, -0.9,
      ],
      "#e9e9e9",
    ),
  );
  [
    [-2.3, 0.9],
    [2.5, -0.9],
  ].forEach(([x, z]) => add(g, new THREE.SphereGeometry(0.08, 12, 8), G("#ff3b3b", 2), x, 8.15, z));
  const yl = M("#e8c84a", 0.6),
    lp = new THREE.SphereGeometry(0.05, 8, 8),
    pg = C(0.015, 0.02, 0.55, 6);
  for (let i = 0; i < 20; i++) add(g, B(0.4, 0.01, 0.05), yl, -7 + i * 0.75, 1.81, 0);
  const lampMasts = new THREE.InstancedMesh(pg, dk, 18);
  lampMasts.name = "bridge-lamp-masts";
  const lampGlobes = new THREE.InstancedMesh(lp, bd, 18);
  lampGlobes.name = "bridge-lamp-luminaires";
  const lDummy = new THREE.Object3D();
  let lIdx = 0;
  [-0.8, 0.8].forEach((z, idx) => {
    const rail = add(g, B(15, 0.14, 0.05), wh, 0, 1.84, z);
    rail.name = idx === 0 ? "bridge-parapet-north" : "bridge-parapet-south";
    for (let i = 0; i < 9; i++) {
      const x = -6.6 + i * 1.65;
      lDummy.position.set(x, 2.05, z);
      lDummy.updateMatrix();
      lampMasts.setMatrixAt(lIdx, lDummy.matrix);
      lDummy.position.set(x, 2.35, z);
      lDummy.updateMatrix();
      lampGlobes.setMatrixAt(lIdx, lDummy.matrix);
      lIdx++;
    }
  });
  lampMasts.instanceMatrix.needsUpdate = true;
  lampGlobes.instanceMatrix.needsUpdate = true;
  g.add(lampMasts, lampGlobes);
  const cars = [0, 1, 2, 3].map((i) =>
    add(
      g,
      B(0.4, 0.18, 0.22),
      M(["#c33", "#fff", "#36c", "#fc3"][i], 0.4, 0.5),
      0,
      1.9,
      i % 2 ? 0.35 : -0.35,
    ),
  );
  for (let k = 0; k < 14; k++)
    add(
      g,
      new THREE.TorusGeometry(0.81, 0.02, 6, 32).rotateX(Math.PI / 2),
      dk,
      -5.5,
      0.4 + k * 0.38,
      -4,
    );
  const hillbrow = add(g, C(0.08, 0.15, 7, 12), wh, 6.5, 3.5, -4.6);
  hillbrow.name = "bridge-hillbrow-tower";
  const hillbrowPod = add(g, new THREE.SphereGeometry(0.4, 16, 12), bd, 6.5, 6, -4.6);
  hillbrowPod.name = "bridge-hillbrow-pod";
  add(g, C(0.03, 0.03, 1.2, 6), wh, 6.5, 7.4, -4.6);
  for (let i = 0; i < 9; i++)
    tree(g, -6.5 + i * 1.65, 3.7 + (i % 2) * 0.4, 0.8 + R(i) * 0.3, i % 2 ? 1 : 2);
  g.userData.tick = (t) => {
    cars.forEach((c, i) => {
      c.position.x = ((((t * (0.9 + i * 0.15) * (i % 2 ? 1 : -1) + i * 3.7) % 14) + 14) % 14) - 7;
    });
    trn.forEach((m, i) => {
      m.position.x =
        ((((t * (0.6 + i * 0.25) * (i % 2 ? -1 : 1) + m.userData.x0) % 16) + 16) % 16) - 8;
    });
  };
  g.scale.setScalar(0.92);
  return g;
}

/* ---------- 5 · The Big Hole, Kimberley ---------- */
function hole() {
  const g = new THREE.Group(),
    pts = [
      new THREE.Vector2(0.01, -3.2),
      new THREE.Vector2(7.6, -3.2),
      new THREE.Vector2(7.6, 0),
      new THREE.Vector2(5.4, 0),
    ];
  let r = 5.4,
    y = 0;
  for (let i = 0; i < 9; i++) {
    y -= 0.32;
    pts.push(new THREE.Vector2(r - 0.15, y));
    r -= 0.42;
    pts.push(new THREE.Vector2(r, y));
  }
  pts.push(new THREE.Vector2(0.01, y));
  const geo = new THREE.LatheGeometry(pts, 128),
    p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      yy = p.getY(i),
      z = p.getZ(i);
    if (yy < 0.05 && yy > -3.14 && Math.hypot(x, z) < 5.55) {
      const angle = Math.atan2(z, x);
      const erosion =
        0.075 * Math.sin(angle * 7 + yy * 1.7) +
        0.05 * Math.sin(angle * 13 - yy * 2.8) +
        0.045 * n(angle * 2, yy * 1.5);
      const f = 1 + erosion;
      p.setXYZ(i, x * f, yy + 0.018 * Math.sin(angle * 19 + yy * 3), z * f);
    }
  }
  const s = new THREE.Color("#c9a46f"),
    a = new THREE.Color("#c58a55"),
    b = new THREE.Color("#4a3a30");
  tint(geo, (k, x, yy, z) =>
    yy < -3.1
      ? k.copy(b)
      : yy > -0.01
        ? k.copy(s)
        : yy < -3
          ? k.copy(b)
          : k
              .copy(a)
              .lerp(b, -yy / 2.9)
              .multiplyScalar(0.82 + 0.18 * Math.sin(yy * 40 + Math.atan2(z, x) * 3)),
  );
  const vm = addGeologicalStrata(pbrSurface("cliff", "#ffffff", true).clone(), {
    scale: 18,
    strength: 0.24,
    tint: "#c58c5a",
  });
  vm.userData.shared = false;
  vm.side = THREE.DoubleSide;
  const wall = add(g, geo, vm);
  wall.name = "big-hole-stratified-crater";
  const pool = add(
    g,
    new THREE.CircleGeometry(2.3, 96).rotateX(-Math.PI / 2),
    waterShader("#33ac9c"),
    0,
    -2.45,
    0,
  );
  pool.name = "big-hole-turquoise-pool";
  const rs = M("#7b3f2a", 0.6, 0.6);
  [
    [6, 0.16],
    [6.6, -0.16],
  ].forEach(([x, rz]) => {
    const l = add(g, B(0.18, 3.6, 0.18), rs, x, 1.8, -1.4);
    l.rotation.z = rz;
  });
  [0.8, 1.6, 2.4].forEach((h) => add(g, B(0.7, 0.08, 0.08), rs, 6.3, h, -1.4));
  const wl = new THREE.Group();
  wl.position.set(6.3, 3.6, -1.4);
  wl.name = "big-hole-headframe-sheave";
  g.add(wl);
  add(wl, new THREE.TorusGeometry(0.38, 0.05, 8, 24), rs);
  add(wl, B(0.76, 0.04, 0.04), rs);
  add(wl, B(0.04, 0.76, 0.04), rs);
  add(g, B(1.8, 0.12, 2.2), M("#555", 0.5, 0.6), 0, 0.1, 5);
  const gl = M("#bfe8f0", 0.1);
  gl.transparent = true;
  gl.opacity = 0.28;
  add(g, B(1.8, 0.9, 0.05), gl, 0, 0.58, 3.95);
  const fm = M("#444", 0.5, 0.7);
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * 6.2832;
    add(g, C(0.02, 0.02, 0.55, 6), fm, 5.7 * Math.cos(a), 0.27, 5.7 * Math.sin(a));
  }
  add(g, new THREE.TorusGeometry(5.7, 0.012, 6, 128).rotateX(Math.PI / 2), fm, 0, 0.5, 0);
  g.add(lines([6.3, 3.6, -1.4, 2.2, -1.5, -0.6], "#222"));
  const bk = add(g, B(0.3, 0.25, 0.3), rs, 2.2, -1.65, -0.6);
  bk.name = "big-hole-mine-skip";
  const bh = new THREE.IcosahedronGeometry(0.18, 0);
  const rimBoulders = new THREE.InstancedMesh(bh, M("#7a6a40", 1), 34);
  rimBoulders.name = "big-hole-rim-boulders";
  const bDummy = new THREE.Object3D();
  for (let i = 0; i < 34; i++) {
    const a = R(i) * 6.2832,
      r = 6 + R(i + 50) * 1.4;
    bDummy.position.set(r * Math.cos(a), 0.1, r * Math.sin(a));
    bDummy.scale.set(1 + R(i) * 1.5, 0.7 + R(i + 3), 1 + R(i + 7) * 1.5);
    bDummy.updateMatrix();
    rimBoulders.setMatrixAt(i, bDummy.matrix);
  }
  rimBoulders.instanceMatrix.needsUpdate = true;
  g.add(rimBoulders);
  // Cantilevered rim viewing gallery & human-scale visitors
  const viewingDeck = add(g, B(1.8, 0.12, 0.9), M("#b4a68e", 0.85), 0.4, 0.14, 5.2);
  viewingDeck.name = "big-hole-viewing-deck";
  [-0.1, 0.45, 0.9].forEach((vx, idx) => {
    const visitor = add(
      g,
      B(0.14, 0.34, 0.14),
      M(idx === 1 ? "#b4552f" : "#3a4b59", 0.8),
      vx,
      0.38,
      5.05,
    );
    visitor.name = `big-hole-visitor-${idx + 1}`;
    visitor.userData.scaleCue = true;
  });
  [
    [-6.2, -3, "#6b7f8c"],
    [-5, -4.4, "#7a8c97"],
    [5.5, 3.8, "#6b7f8c"],
  ].forEach(([x, z, c]) => add(g, new THREE.ConeGeometry(0.9, 0.8, 16), M(c, 1), x, 0.4, z));
  for (let i = 0; i < 7; i++) {
    const q = 0.1 + i * 0.14;
    add(
      g,
      new THREE.ConeGeometry(0.28, 0.5, 4),
      M(i % 2 ? "#e8dcc0" : "#c9b48a", 1),
      6.4 * Math.cos(q),
      0.25,
      6.4 * Math.sin(q),
    ).rotation.y = 0.785;
  }
  add(g, B(1.2, 0.5, 0.8), M("#e8e2d2", 0.8), -2.5, 0.25, 6.5);
  add(g, B(1.3, 0.1, 0.9), rs, -2.5, 0.55, 6.5);
  const dN = 90,
    dA = [],
    dB = [],
    dU = [],
    dp = new Float32Array(dN * 3);
  for (let i = 0; i < dN; i++) {
    dA.push(R(i + 400) * 6.2832);
    dB.push(R(i + 500) * 3.2);
    dU.push(Math.sqrt(R(i + 600)));
  }
  const dg = new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(dp, 3)),
    pt = new THREE.Points(
      dg,
      new THREE.PointsMaterial({ color: "#ecc99a", size: 0.06, transparent: true, opacity: 0.6 }),
    );
  pt.frustumCulled = false;
  g.add(pt);
  const upd = (t) => {
    for (let i = 0; i < dN; i++) {
      const yy = -2.4 + ((dB[i] + t * 0.15) % 3.2),
        rr = dU[i] * (1.6 + (yy + 2.4) * 0.95);
      dp[i * 3] = rr * Math.cos(dA[i]);
      dp[i * 3 + 1] = yy;
      dp[i * 3 + 2] = rr * Math.sin(dA[i]);
    }
    dg.attributes.position.needsUpdate = true;
  };
  upd(0);
  for (let i = 0; i < 6; i++) {
    const q = 4.3 + i * 0.35;
    tree(g, 6.8 * Math.cos(q), 6.8 * Math.sin(q), 0.9 + R(i) * 0.3, 2);
  }
  const rp = [0, 1, 2].map(() =>
    add(
      g,
      new THREE.RingGeometry(0.9, 0.95, 48).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: "#bff", transparent: true, opacity: 0, side: 2 }),
      0,
      -2.44,
      0,
    ),
  );
  g.position.y = 3.2;
  const w = new THREE.Group();
  w.add(g);
  w.userData.tick = (t) => {
    upd(t);
    const u = (Math.sin(t * 0.4) + 1) / 2;
    bk.position.set(2.2 + 4.1 * u, -1.65 + 5.1 * u, -0.6 - 0.8 * u);
    wl.rotation.z = -u * 12;
    rp.forEach((r, i) => {
      const k = (t * 0.25 + i / 3) % 1;
      r.scale.setScalar(0.4 + k * 1.4);
      r.material.opacity = 0.5 * (1 - k);
    });
  };
  return w;
}

/* ---------- Catalog-wide geometry, keyed to each actual place ---------- */
const seedName = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) % 70000;
};
const box = (g, x, y, z, w, h, d, mat) => add(g, B(w, h, d), mat, x, y, z);
const FACADE_MAPS = new Map();
function facadeMap(hex) {
  const key = String(hex).toLowerCase();
  if (FACADE_MAPS.has(key)) return FACADE_MAPS.get(key);
  const size = 64;
  const data = new Uint8Array(size * size * 4);
  const base = new THREE.Color(key);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const col = Math.floor(x / 16);
      const row = Math.floor(y / 16);
      const lx = x % 16;
      const ly = y % 16;
      const pane = lx > 2 && lx < 13 && ly > 3 && ly < 12;
      const sill = ly >= 13 && ly <= 14;
      let r = Math.round(base.r * 255);
      let g = Math.round(base.g * 255);
      let b = Math.round(base.b * 255);
      if (pane) {
        const lit = (col * 3 + row * 5) % 7 > 4;
        r = lit ? 244 : 92;
        g = lit ? 214 : 132;
        b = lit ? 168 : 150;
      } else if (sill) {
        r = Math.round(r * 0.72);
        g = Math.round(g * 0.72);
        b = Math.round(b * 0.72);
      }
      const i = (y * size + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, size, size);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  tex.userData.shared = true;
  FACADE_MAPS.set(key, tex);
  return tex;
}
function building(g, x, z, w, h, d, wall, seed) {
  const map = facadeMap(wall);
  const mat = new THREE.MeshStandardMaterial({
    map,
    color: "#ffffff",
    roughness: 0.74,
    metalness: 0.04,
  });
  mat.userData.sharedTextures = true;
  const mesh = box(g, x, h / 2, z, w, h, d, mat);
  const uv = mesh.geometry.attributes.uv;
  const uScale = Math.max(1.4, w * 1.7);
  const vScale = Math.max(1.4, h * 1.35);
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * uScale, uv.getY(i) * vScale);
  uv.needsUpdate = true;
  box(g, x, h + 0.06, z, w + 0.1, 0.1, d + 0.08, M("#f6f3ec", 0.62));
  if (R(seed) > 0.55) box(g, x, 0.08, z, w + 0.16, 0.08, d + 0.14, M("#d9cfc0", 0.9));
}
/* ---------- 5 · Voortrekker Monument ---------- */
/**
 * A severe granite cube on a stepped hill, ringed by a laager of ox wagons.
 * Relief panels, narrow windows and a chamfered roof coping carry the detail;
 * instanced wagons keep the whole monument inside a handful of draw calls.
 */
function voortrekker() {
  const g = new THREE.Group();
  const granite = pbrSurface("limestone", "#b6b1a4");
  const graniteDark = pbrSurface("limestone", "#989285");
  const graniteWarm = pbrSurface("sandstone", "#c2b7a1");
  const bronze = M("#7c5b36", 0.46, 0.58);
  const bronzeDark = M("#4b3924", 0.62, 0.4);
  const lawn = M("#5b774a", 1);
  const wagonCanvas = M("#d8ccb2", 0.94);
  wagonCanvas.side = THREE.DoubleSide;

  // Monument Hill: dry-grass apron, granite terrace and a clipped lawn.
  add(g, C(8.2, 8.8, 0.16, 80), M("#8e8a72", 1), 0, 0.08, 0);
  add(g, C(6.35, 6.75, 0.34, 72), graniteDark, 0, 0.33, 0);
  add(g, C(5.9, 6.05, 0.07, 72), lawn, 0, 0.53, 0);

  // Three receding plinth steps lift the cube above the wagon laager.
  add(g, B(7.5, 0.4, 7.5), graniteWarm, 0, 0.68, 0);
  add(g, B(6.7, 0.36, 6.7), granite, 0, 1.06, 0);
  add(g, B(6.1, 0.2, 6.1), graniteDark, 0, 1.34, 0);

  const cube = add(g, B(5.6, 4, 5.6), granite, 0, 3.44, 0);
  cube.name = "voortrekker-monument-granite-cube";

  // Frieze band and shallow relief panels: one instanced draw call for all four faces.
  add(g, B(5.76, 0.72, 5.76), graniteDark, 0, 4.62, 0);
  const relief = new THREE.InstancedMesh(B(0.2, 0.44, 0.05), graniteWarm, 36);
  relief.name = "voortrekker-frieze-relief";
  const reliefDummy = new THREE.Object3D();
  for (let side = 0; side < 4; side++) {
    const angle = (side * Math.PI) / 2;
    for (let panel = 0; panel < 9; panel++) {
      const offset = -1.86 + panel * 0.465;
      reliefDummy.position.set(
        Math.sin(angle) * 2.9 + Math.cos(angle) * offset,
        4.62,
        Math.cos(angle) * 2.9 - Math.sin(angle) * offset,
      );
      reliefDummy.rotation.set(0, angle, 0);
      reliefDummy.updateMatrix();
      relief.setMatrixAt(side * 9 + panel, reliefDummy.matrix);
    }
  }
  relief.instanceMatrix.needsUpdate = true;
  g.add(relief);

  // Tall narrow windows, two per face, read as deep slots in the granite.
  const slots = new THREE.InstancedMesh(B(0.12, 1.2, 0.04), bronzeDark, 8);
  slots.name = "voortrekker-narrow-windows";
  for (let side = 0; side < 4; side++) {
    const angle = (side * Math.PI) / 2;
    for (const offset of [-0.86, 0.86]) {
      reliefDummy.position.set(
        Math.sin(angle) * 2.81 + Math.cos(angle) * offset,
        3.4,
        Math.cos(angle) * 2.81 - Math.sin(angle) * offset,
      );
      reliefDummy.rotation.set(0, angle, 0);
      reliefDummy.updateMatrix();
      slots.setMatrixAt(side * 2 + (offset < 0 ? 0 : 1), reliefDummy.matrix);
    }
  }
  slots.instanceMatrix.needsUpdate = true;
  g.add(slots);

  // Cornice, low parapet and the cenotaph oculus at the centre of the roof.
  add(g, B(6.15, 0.3, 6.15), graniteDark, 0, 5.56, 0);
  add(g, B(6.55, 0.16, 6.55), graniteWarm, 0, 5.76, 0);
  add(g, B(5.15, 0.34, 5.15), granite, 0, 5.94, 0);
  for (const s of [-1, 1]) {
    add(g, B(5.5, 0.44, 0.3), graniteDark, 0, 6.33, s * 2.45);
    add(g, B(0.3, 0.44, 4.6), graniteDark, s * 2.45, 6.33, 0);
  }
  add(g, B(2.0, 0.36, 2.0), granite, 0, 6.5, 0);
  add(g, B(1.35, 0.3, 1.35), graniteDark, 0, 6.83, 0);
  add(g, new THREE.TorusGeometry(0.44, 0.055, 8, 32).rotateX(Math.PI / 2), graniteWarm, 0, 7.0, 0);
  add(g, C(0.42, 0.42, 0.04, 32), bronzeDark, 0, 6.99, 0);

  // Bronze entrance arch and doors on the north face.
  const arch = new THREE.Shape();
  arch.moveTo(-0.98, 0);
  arch.lineTo(-0.98, 1.02);
  arch.absarc(0, 1.02, 0.98, Math.PI, 0, true);
  arch.lineTo(0.98, 0);
  arch.lineTo(-0.98, 0);
  const entrance = add(
    g,
    new THREE.ExtrudeGeometry(arch, { depth: 0.08, bevelEnabled: false, curveSegments: 28 }),
    bronzeDark,
    0,
    1.44,
    2.8,
  );
  entrance.name = "voortrekker-arched-entrance";
  for (const s of [-1, 1]) add(g, B(0.5, 1.55, 0.05), bronze, s * 0.27, 2.24, 2.89);
  const panelLines = [];
  for (const y of [1.95, 2.35, 2.75]) panelLines.push(-0.5, y, 2.92, 0.5, y, 2.92);
  g.add(lines(panelLines, "#caa46b"));

  // Four broad steps climb from the lawn to the plinth.
  [
    [3.22, 1.44],
    [3.58, 1.2],
    [3.94, 0.96],
    [4.3, 0.72],
  ].forEach(([z, top]) =>
    add(g, B(z === 3.22 ? 3.1 : 2.8, top - 0.56, 0.52), graniteWarm, 0, (top + 0.56) / 2, z),
  );

  // Bronze woman and children facing the monument, as at the real forecourt.
  const statue = new THREE.Group();
  statue.position.set(0, 0.57, 4.95);
  statue.name = "voortrekker-bronze-figures";
  statue.userData.scaleCue = true;
  add(statue, B(0.8, 0.28, 0.7), graniteDark, 0, 0.14, 0);
  const terraceVisitor = add(g, B(0.18, 0.44, 0.18), bronzeDark, 1.35, 0.8, 4.45);
  terraceVisitor.name = "voortrekker-forecourt-visitor";
  terraceVisitor.userData.scaleCue = true;
  add(statue, new THREE.CapsuleGeometry(0.1, 0.32, 3, 10), bronze, 0, 0.52, 0);
  add(statue, new THREE.SphereGeometry(0.1, 12, 10), bronze, 0, 0.8, 0);
  add(statue, new THREE.CapsuleGeometry(0.06, 0.18, 3, 8), bronze, 0.22, 0.42, 0.04);
  add(statue, new THREE.SphereGeometry(0.06, 10, 8), bronze, 0.22, 0.57, 0.04);
  add(statue, new THREE.CapsuleGeometry(0.06, 0.15, 3, 8), bronze, -0.21, 0.4, -0.03);
  add(statue, new THREE.SphereGeometry(0.058, 10, 8), bronze, -0.21, 0.54, -0.03);
  g.add(statue);

  // Two flagpoles frame the approach and share the scene's wind controller.
  for (const s of [-1, 1]) {
    add(g, C(0.025, 0.035, 2.2, 8), M("#d8d3c6", 0.5, 0.4), s * 2.25, 1.68, 4.4);
    const flag = add(
      g,
      new THREE.PlaneGeometry(0.72, 0.4),
      M(s < 0 ? "#2f6d4f" : "#b55a33", 0.8),
      s * 2.63,
      2.55,
      4.4,
    );
    flag.userData.wind = { ph: s + 2, a: 0.12, sp: 2.1 };
  }

  // Ox-wagon laager: three instanced meshes instead of ~90 separate pieces.
  const wagonCount = 12;
  const beds = new THREE.InstancedMesh(B(1.18, 0.26, 0.6), M("#5a4936", 0.9), wagonCount);
  const canopies = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.31, 0.31, 0.92, 12, 1, true, 0, Math.PI)
      .rotateZ(Math.PI / 2)
      .rotateX(-Math.PI / 2),
    wagonCanvas,
    wagonCount,
  );
  const wheels = new THREE.InstancedMesh(
    new THREE.TorusGeometry(0.2, 0.038, 6, 14),
    M("#413428", 0.86),
    wagonCount * 4,
  );
  beds.name = "voortrekker-wagon-laager";
  canopies.name = "voortrekker-wagon-canopies";
  wheels.name = "voortrekker-wagon-wheels";
  const wagonDummy = new THREE.Object3D();
  const wheelOffset = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  let wheelIndex = 0;
  for (let i = 0; i < wagonCount; i++) {
    const angle = (i / wagonCount) * Math.PI * 2;
    const x = Math.cos(angle) * 5.05;
    const z = Math.sin(angle) * 4.72;
    const yaw = -(angle + Math.PI / 2) + (R(i + 21) - 0.5) * 0.16;
    const scale = 0.96 + R(i + 4) * 0.08;
    wagonDummy.position.set(x, 0.9, z);
    wagonDummy.rotation.set(0, yaw, 0);
    wagonDummy.scale.setScalar(scale);
    wagonDummy.updateMatrix();
    beds.setMatrixAt(i, wagonDummy.matrix);
    wagonDummy.position.y = 1.06;
    wagonDummy.updateMatrix();
    canopies.setMatrixAt(i, wagonDummy.matrix);
    for (const end of [-1, 1]) {
      for (const side of [-1, 1]) {
        wheelOffset.set(end * 0.36, 0, side * 0.33).applyAxisAngle(up, yaw);
        wagonDummy.position.set(x + wheelOffset.x, 0.8, z + wheelOffset.z);
        wagonDummy.updateMatrix();
        wheels.setMatrixAt(wheelIndex++, wagonDummy.matrix);
      }
    }
  }
  beds.instanceMatrix.needsUpdate = true;
  canopies.instanceMatrix.needsUpdate = true;
  wheels.instanceMatrix.needsUpdate = true;
  g.add(beds, canopies, wheels);

  for (let i = 0; i < 3; i++) {
    const angle = 1.9 + i * 1.35;
    tree(g, Math.cos(angle) * 7.2, Math.sin(angle) * 7.2, 0.62 + R(i + 31) * 0.18, i % 3, 0.17);
  }
  return g;
}

function genericLandmark(name, kind) {
  const g = new THREE.Group(),
    s = seedName(name),
    tone = ["#d0b28a", "#cdbdaa", "#c8aaa0", "#bcc5be", "#c4b6a3"][s % 5];
  const stone = M(tone, 0.9),
    metal = M("#f4f1ea", 0.42, 0.08),
    dark = M("#3c403c", 0.72);
  let tick = () => {};
  if (
    ![
      "park",
      "table-mountain",
      "colosseum",
      "eiffel-tower",
      "leaning-tower",
      "clock-tower",
    ].includes(kind)
  ) {
    add(g, C(2.35, 2.4, 0.22, 64), M("#d5c8b5", 0.92, 0.04), 0, 0.11, 0);
    add(
      g,
      C(2.28, 2.32, 0.06, 64),
      M(
        ["stadium", "waterfall", "cave", "village", "arch"].includes(kind) ? "#4f823e" : "#beb4a5",
        0.95,
      ),
      0,
      0.23,
      0,
    );
  }
  if (kind === "bo-kaap") {
    for (let i = 0; i < 7; i++) {
      const x = (i - 3) * 0.79,
        z = (i % 2) * 0.22 - 0.4;
      building(
        g,
        x,
        z,
        0.72,
        0.85 + (i % 3) * 0.2,
        0.78,
        ["#f4b5a4", "#e3cc76", "#8dbfc7", "#dc9bc4", "#91b5a2"][i % 5],
        s + i,
      );
      box(g, x, 0.16, z + 0.4, 0.65, 0.05, 0.45, M("#a49a89", 1));
    }
  } else if (kind === "cooling-towers") {
    const pts = [
      new THREE.Vector2(0.58, 0.02),
      new THREE.Vector2(0.68, 0.28),
      new THREE.Vector2(0.53, 0.8),
      new THREE.Vector2(0.44, 1.45),
      new THREE.Vector2(0.51, 2.25),
    ];
    for (const x of [-1, 1]) {
      add(
        g,
        new THREE.LatheGeometry(pts, 48),
        M(x > 0 ? "#b8c9c1" : "#c7b6a5", 0.87, 0),
        x * 0.78,
        0.17,
        0,
      );
      for (let j = 0; j < 5; j++)
        add(
          g,
          new THREE.TorusGeometry(0.5 - j * 0.016, 0.018, 6, 48).rotateX(Math.PI / 2),
          dark,
          x * 0.78,
          0.7 + j * 0.27,
          0,
        );
    }
    const smoke = drift(g, 38, "#f7f4ee", 0.07, (i, t) => [
      (i % 2 ? 1 : -1) * 0.78 + (R(i + 3) - 0.5) * (0.12 + ((t * 0.014) % 1)),
      2.4 + ((R(i + 7) * 3 + t * 0.18) % 1.2),
      (R(i + 9) - 0.5) * 0.55,
    ]);
    tick = (t) => smoke(t);
  } else if (kind === "ponte") {
    // Ponte City is a 54-storey cylindrical concrete ring around an open core.
    // Instanced bands and 1,944 windows avoid thousands of separate draw calls.
    const wall = pbrSurface("concrete", "#a4a49e");
    const roof = pbrSurface("concrete", "#6b6863");
    wall.side = THREE.DoubleSide;
    const tower = add(g, C(0.85, 1, 2.7, 80, 1, true), wall, 0, 1.57, 0);
    tower.name = "ponte-city-open-core";
    add(g, new THREE.TorusGeometry(0.85, 0.055, 8, 80).rotateX(Math.PI / 2), roof, 0, 2.96);
    add(
      g,
      new THREE.TorusGeometry(0.85, 0.018, 6, 80).rotateX(Math.PI / 2),
      G("#ddbd92", 0.7),
      0,
      3.04,
    );

    const paneGeometry = B(0.108, 0.035, 0.013);
    const glazing = new THREE.MeshPhysicalMaterial({
      color: "#ffffff",
      roughness: 0.2,
      metalness: 0.14,
      clearcoat: 0.48,
      clearcoatRoughness: 0.21,
    });
    const columns = 36;
    const floors = 54;
    const panes = new THREE.InstancedMesh(paneGeometry, glazing, floors * columns);
    panes.name = "ponte-city-54-storey-glazing";
    const transform = new THREE.Matrix4();
    const rotation = new THREE.Quaternion();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3(1, 1, 1);
    const colors = [
      new THREE.Color("#698e9a"),
      new THREE.Color("#a6a7a0"),
      new THREE.Color("#bfaa81"),
      new THREE.Color("#394b5a"),
    ];
    let paneIndex = 0;
    for (let floor = 0; floor < floors; floor++) {
      const y = 0.28 + floor * (2.55 / (floors - 1));
      const radius = 1.0 - ((y - 0.22) / 2.7) * 0.15 + 0.016;
      for (let k = 0; k < columns; k++) {
        const angle = (k / columns) * Math.PI * 2;
        position.set(radius * Math.sin(angle), y, radius * Math.cos(angle));
        rotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
        transform.compose(position, rotation, scale);
        panes.setMatrixAt(paneIndex, transform);
        panes.setColorAt(paneIndex, colors[Math.floor(R(floor * 127 + k * 47) * colors.length)]);
        paneIndex++;
      }
    }
    panes.instanceMatrix.needsUpdate = true;
    if (panes.instanceColor) panes.instanceColor.needsUpdate = true;
    g.add(panes);

    const bands = new THREE.InstancedMesh(
      new THREE.TorusGeometry(1, 0.007, 4, 80).rotateX(Math.PI / 2),
      roof,
      floors,
    );
    bands.name = "ponte-city-floor-bands";
    for (let floor = 0; floor < floors; floor++) {
      const y = 0.255 + floor * (2.59 / (floors - 1));
      const radius = 1 - ((y - 0.22) / 2.7) * 0.15 + 0.02;
      transform.compose(
        new THREE.Vector3(0, y, 0),
        new THREE.Quaternion(),
        new THREE.Vector3(radius, 1, radius),
      );
      bands.setMatrixAt(floor, transform);
    }
    bands.instanceMatrix.needsUpdate = true;
    g.add(bands);

    // The defining feature is the open central atrium. Give it a visible inner
    // concrete wall and floor-level gallery edges rather than a dark void.
    const atriumWall = pbrSurface("concrete", "#777873");
    atriumWall.side = THREE.DoubleSide;
    const atrium = add(g, C(0.43, 0.52, 2.58, 80, 1, true), atriumWall, 0, 1.57, 0);
    atrium.name = "ponte-city-inner-atrium-wall";

    const innerGalleries = new THREE.InstancedMesh(
      new THREE.TorusGeometry(1, 0.014, 5, 64).rotateX(Math.PI / 2),
      pbrSurface("concrete", "#b0aaa0"),
      floors,
    );
    innerGalleries.name = "ponte-city-inner-atrium-gallery-floors";
    const galleryMatrix = new THREE.Matrix4();
    for (let floor = 0; floor < floors; floor++) {
      const y = 0.28 + floor * (2.55 / (floors - 1));
      galleryMatrix.compose(
        new THREE.Vector3(0, y, 0),
        new THREE.Quaternion(),
        new THREE.Vector3(0.49, 1, 0.49),
      );
      innerGalleries.setMatrixAt(floor, galleryMatrix);
    }
    innerGalleries.instanceMatrix.needsUpdate = true;
    g.add(innerGalleries);

    // Repeating external balcony lips and concrete fins break up the smooth
    // cylinder while keeping the 54-storey facade within a few draw calls.
    const balconies = new THREE.InstancedMesh(
      new THREE.TorusGeometry(1, 0.026, 6, 80).rotateX(Math.PI / 2),
      pbrSurface("concrete", "#aaa69e"),
      18,
    );
    balconies.name = "ponte-city-external-balcony-lips";
    for (let i = 0; i < 18; i++) {
      const floor = i * 3;
      const y = 0.31 + floor * (2.55 / (floors - 1));
      const radius = 1.035 - ((y - 0.22) / 2.7) * 0.15;
      galleryMatrix.compose(
        new THREE.Vector3(0, y, 0),
        new THREE.Quaternion(),
        new THREE.Vector3(radius, 1, radius),
      );
      balconies.setMatrixAt(i, galleryMatrix);
    }
    balconies.instanceMatrix.needsUpdate = true;
    g.add(balconies);

    const fins = new THREE.InstancedMesh(
      B(0.035, 2.64, 0.055),
      pbrSurface("concrete", "#858681"),
      24,
    );
    fins.name = "ponte-city-vertical-concrete-fins";
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      position.set(0.99 * Math.sin(angle), 1.57, 0.99 * Math.cos(angle));
      rotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
      transform.compose(position, rotation, scale);
      fins.setMatrixAt(i, transform);
    }
    fins.instanceMatrix.needsUpdate = true;
    g.add(fins);

    // Low-rise podium and an external service shaft add architectural scale.
    box(g, -0.02, 0.24, 0, 2.43, 0.27, 1.9, pbrSurface("concrete", "#777672"));
    box(g, -0.83, 1.57, -0.21, 0.17, 2.7, 0.22, pbrSurface("concrete", "#747874"));
    // The open atrium has always had a lift core; make the car inspectable.
    const atriumLift = add(g, B(0.3, 0.28, 0.3), M("#d2ccc0", 0.45, 0.55), 0, 0.72, 0);
    atriumLift.name = "ponte-city-atrium-lift";
    add(g, C(0.012, 0.012, 2.1, 6), M("#2b2b2b", 0.5, 0.8), 0.2, 1.9, 0);
  } else if (kind === "stadium") {
    const bowl = [
      [0.72, 0.28],
      [1.15, 0.55],
      [1.48, 0.95],
      [1.62, 1.2],
      [1.55, 1.28],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    const shell = add(g, new THREE.LatheGeometry(bowl, 72), M("#f7f4ee", 0.58, 0.04));
    shell.name = "civic-stadium-bowl";
    add(
      g,
      new THREE.TorusGeometry(1.42, 0.08, 8, 64).rotateX(Math.PI / 2),
      M("#f4f1ea", 0.5),
      0,
      1.22,
      0,
    ).name = "civic-stadium-roof-ring";
    add(g, new THREE.CircleGeometry(0.95, 40).rotateX(-Math.PI / 2), M("#3f8f46", 0.9), 0, 0.34, 0);
    const arch = [];
    for (let i = 0; i <= 24; i++) {
      const x = -2.15 + (i / 24) * 4.3;
      arch.push(new THREE.Vector3(x, 0.25 + 2.15 * (1 - (x / 2.15) ** 2), 0.15));
    }
    const archMesh = add(
      g,
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arch), 48, 0.045, 8),
      M("#f7f4ef", 0.4, 0.08),
    );
    archMesh.name = "civic-stadium-arch";
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      add(g, B(0.035, 0.22, 0.05), M("#e7e1d6", 0.7), 1.55 * Math.cos(a), 1.18, 1.55 * Math.sin(a));
    }
  } else if (kind === "table-mountain") {
    // Sculpted mountain massif with geological flat top and clay vegetation
    const plinth = add(g, C(2.35, 2.4, 0.22, 64), M("#d5c8b5", 0.92, 0.04), 0, 0.11, 0);
    plinth.name = "massif-pedestal-rim";
    const geo = new THREE.CylinderGeometry(1.35, 1.82, 0.95, 48, 4),
      p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i),
        y = p.getY(i),
        z = p.getZ(i);
      const variation = 1 + 0.12 * n(x * 2.2, z * 2.2);
      p.setXYZ(i, x * variation, y, z * variation);
    }
    geo.computeVertexNormals();
    add(g, geo, M("#82886f", 0.95), 0, 0.65, 0);
    add(
      g,
      new THREE.CircleGeometry(1.32, 48).rotateX(-Math.PI / 2),
      M("#6a8458", 0.96),
      0,
      1.13,
      0,
    );
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      tree(g, Math.cos(angle) * 1.62, Math.sin(angle) * 1.62, 0.62, 1, 0.22);
    }
  } else if (kind === "lighthouse" || kind === "tower") {
    const isBeacon = kind === "lighthouse";
    const body = add(
      g,
      C(isBeacon ? 0.3 : 0.45, isBeacon ? 0.5 : 0.62, isBeacon ? 2.25 : 2.05, 28),
      isBeacon ? pbrSurface("limestone", tone) : pbrSurface("sandstone", tone),
      0,
      1.25,
      0,
    );
    body.name = isBeacon ? "lighthouse-tower" : "tower-civic-hall";
    add(g, B(1.05, 0.2, 1.05), stone, 0, 0.3, 0).name = isBeacon
      ? "lighthouse-plinth"
      : "tower-plinth";
    add(g, B(0.22, 0.34, 0.1), dark, 0, 0.34, 0.38).name = isBeacon
      ? "lighthouse-door"
      : "tower-door";
    for (let i = 0; i < (isBeacon ? 3 : 7); i++)
      add(
        g,
        C(isBeacon ? 0.38 : 0.55, isBeacon ? 0.43 : 0.59, 0.045, 28),
        metal,
        0,
        0.45 + i * 0.29,
        0,
      );
    // Instanced observation gallery balustrade posts
    const balusterCount = 16;
    const balusters = new THREE.InstancedMesh(B(0.025, 0.16, 0.025), dark, balusterCount);
    balusters.name = isBeacon ? "lighthouse-gallery-balusters" : "tower-gallery-balusters";
    const galDummy = new THREE.Object3D();
    const galRadius = isBeacon ? 0.46 : 0.45;
    for (let i = 0; i < balusterCount; i++) {
      const ang = (i / balusterCount) * Math.PI * 2;
      galDummy.position.set(Math.cos(ang) * galRadius, 2.58, Math.sin(ang) * galRadius);
      galDummy.rotation.set(0, -ang, 0);
      galDummy.updateMatrix();
      balusters.setMatrixAt(i, galDummy.matrix);
    }
    balusters.instanceMatrix.needsUpdate = true;
    g.add(balusters);
    // Keeper annex / civic steps & human-scale observer bollards
    const annex = add(
      g,
      B(0.72, 0.46, 0.62),
      isBeacon ? pbrSurface("sandstone", "#d9cdb8") : pbrSurface("limestone", "#cfc5b4"),
      isBeacon ? -0.68 : 0.68,
      0.43,
      -0.18,
    );
    annex.name = isBeacon ? "lighthouse-keepers-cottage" : "tower-vestibule";
    [-0.28, 0.28].forEach((bx, idx) => {
      const bollard = add(g, C(0.035, 0.04, 0.18, 8), metal, bx, 0.29, 0.62);
      bollard.name = `${isBeacon ? "lighthouse" : "tower"}-scale-bollard-${idx + 1}`;
      bollard.userData.scaleCue = true;
    });
    add(g, C(0.5, 0.48, 0.14, 28), dark, 0, 2.45, 0).name = isBeacon
      ? "lighthouse-gallery"
      : "tower-gallery";
    add(g, C(0.38, 0.38, 0.4, 24), G("#ffdc99", 1.4), 0, 2.7, 0).name = isBeacon
      ? "lighthouse-lantern"
      : "tower-lantern";
    add(g, new THREE.ConeGeometry(0.46, 0.35, 24), metal, 0, 3.05, 0).name = isBeacon
      ? "lighthouse-roof"
      : "tower-roof";
    if (!isBeacon) {
      add(g, new THREE.CircleGeometry(0.18, 32), M("#f7f0dd", 0.7), 0, 2.05, 0.47).name =
        "tower-clock-face";
      const minute = add(g, B(0.018, 0.16, 0.012), M("#26231f", 0.6), 0, 2.05, 0.49);
      minute.geometry.translate(0, 0.08, 0);
      minute.name = "tower-clock-minute-hand";
      const hour = add(g, B(0.024, 0.11, 0.014), M("#26231f", 0.6), 0, 2.05, 0.5);
      hour.geometry.translate(0, 0.055, 0);
      hour.name = "tower-clock-hour-hand";
    }
    if (isBeacon) {
      add(
        g,
        new THREE.CircleGeometry(2.15, 40).rotateX(-Math.PI / 2),
        waterShader("#12a3b0"),
        1.15,
        0.23,
        0.85,
      );
      for (let i = 0; i < 7; i++) {
        add(
          g,
          new THREE.DodecahedronGeometry(0.1 + R(i + s) * 0.08, 0),
          M(i % 2 ? "#d9c4a2" : "#b7a48a", 1),
          0.4 + R(i + 2) * 1.5,
          0.28,
          0.2 + R(i + 6) * 1.2,
        );
      }
      const beam = add(
        g,
        new THREE.ConeGeometry(0.75, 2.2, 36, 1, true),
        new THREE.MeshBasicMaterial({
          color: "#ffebc3",
          transparent: true,
          opacity: 0.1,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
        0,
        2.68,
        0,
      );
      beam.rotation.z = Math.PI / 2;
      beam.name = "lighthouse-lantern-beam";
      tick = (t) => {
        beam.rotation.y = t * 0.45;
      };
    }
  } else if (kind === "bridge") {
    add(
      g,
      new THREE.CircleGeometry(2.3, 40).rotateX(-Math.PI / 2),
      waterShader("#149eab"),
      0,
      0.23,
      0,
    );
    box(g, 0, 0.95, 0, 5.1, 0.1, 0.72, M("#e7e2d8", 0.7));
    box(g, 0, 1.02, 0, 4.6, 0.02, 0.08, M("#f2c14e", 0.5));
    for (const x of [-1.35, 1.35]) {
      add(g, B(0.16, 2.15, 0.16), M("#f7f4ee", 0.5, 0.06), x, 1.7, 0);
      add(g, B(0.9, 0.08, 0.1), M("#f7f4ee", 0.5, 0.06), x, 2.72, 0);
      const cables = [];
      for (let i = -4; i <= 4; i++) cables.push(x, 2.68, 0, i * 0.42, 1.02, 0);
      g.add(lines(cables, "#f4f1ea"));
    }
    const cars = [-1, 1].map((_, i) =>
      add(g, B(0.28, 0.1, 0.16), M(i ? "#d4533c" : "#f4f4f4", 0.4, 0.2), 0, 1.08, i ? 0.16 : -0.16),
    );
    tick = (t) =>
      cars.forEach((c, i) => {
        c.position.x = THREE.MathUtils.euclideanModulo(t * (i ? 0.45 : -0.52) + i * 2.2, 4.4) - 2.2;
      });
  } else if (kind === "arch" || kind === "fort") {
    if (kind === "arch") {
      const sh = new THREE.Shape();
      sh.moveTo(-1.1, 0);
      sh.lineTo(-1.1, 1.8);
      sh.quadraticCurveTo(0, 3.3, 1.1, 1.8);
      sh.lineTo(1.1, 0);
      sh.lineTo(0.73, 0);
      sh.lineTo(0.73, 1.75);
      sh.quadraticCurveTo(0, 2.63, -0.73, 1.75);
      sh.lineTo(-0.73, 0);
      sh.closePath();
      const ex = new THREE.ExtrudeGeometry(sh, {
        depth: 0.26,
        bevelEnabled: true,
        bevelSize: 0.05,
        bevelThickness: 0.045,
        bevelSegments: 2,
        curveSegments: 28,
      });
      add(g, ex, stone, 0, 0.18, -0.1);
    } else {
      // Star-bastion heritage fort with PBR stone walls, instanced battlements & corner bastions
      const curtainMat = pbrSurface("sandstone", tone);
      const bastionMat = pbrSurface("limestone", "#b8aa91");
      const capMat = pbrSurface("terracotta", "#8b5e47");
      const courtyard = add(g, B(2.35, 0.16, 1.85), bastionMat, 0, 0.24, -0.15);
      courtyard.name = "fort-courtyard-plaza";
      const keep = add(g, B(1.75, 1.08, 1.28), curtainMat, 0, 0.84, -0.2);
      keep.name = "fort-curtain-keep";
      const gatehouse = add(g, B(0.58, 0.88, 0.22), dark, 0, 0.68, 0.48);
      gatehouse.name = "fort-sally-gatehouse";
      const portalGlow = add(g, B(0.32, 0.52, 0.06), G("#ffcf7b", 1.15), 0, 0.58, 0.57);
      portalGlow.name = "fort-gate-lantern";

      const crenels = new THREE.InstancedMesh(B(0.18, 0.22, 0.18), bastionMat, 16);
      crenels.name = "fort-battlement-crenels";
      const fDummy = new THREE.Object3D();
      for (let i = 0; i < 8; i++) {
        fDummy.position.set(-0.78 + i * 0.22, 1.48, 0.42);
        fDummy.updateMatrix();
        crenels.setMatrixAt(i, fDummy.matrix);
        fDummy.position.set(-0.78 + i * 0.22, 1.48, -0.82);
        fDummy.updateMatrix();
        crenels.setMatrixAt(i + 8, fDummy.matrix);
      }
      crenels.instanceMatrix.needsUpdate = true;
      g.add(crenels);

      [
        [-1.08, 0.55, "fort-bastion-sw"],
        [1.08, 0.55, "fort-bastion-se"],
        [-1.08, -0.92, "fort-bastion-nw"],
        [1.08, -0.92, "fort-bastion-ne"],
      ].forEach(([bx, bz, bName], idx) => {
        const bastion = add(g, C(0.32, 0.36, 1.56, 14), curtainMat, bx, 0.98, bz);
        bastion.name = bName;
        const coneCap = add(g, new THREE.ConeGeometry(0.36, 0.26, 14), capMat, bx, 1.88, bz);
        coneCap.name = `${bName}-cap`;
        add(g, B(0.06, 0.2, 0.06), G("#ffd68a", 0.9), bx, 1.25, bz + (idx < 2 ? 0.34 : -0.34));
      });
      [-0.42, 0.42].forEach((gx, idx) => {
        const guard = add(g, C(0.04, 0.045, 0.2, 8), metal, gx, 0.42, 0.85);
        guard.name = `fort-scale-bollard-${idx + 1}`;
        guard.userData.scaleCue = true;
      });
    }
  } else if (kind === "aquarium") {
    add(g, new THREE.TorusGeometry(1.15, 0.19, 12, 52, Math.PI).rotateZ(Math.PI), metal, 0, 1.4, 0);
    add(g, new THREE.CircleGeometry(1.45, 64).rotateX(-Math.PI / 2), waterShader(), 0, 0.23, 0);
    const fish = add(g, new THREE.ConeGeometry(0.17, 0.4, 7), M("#e7bd67", 0.38), 0.5, 0.6, 0);
    fish.rotation.z = Math.PI / 2;
    tick = (t) => {
      fish.position.x = Math.sin(t * 0.5) * 0.7;
      fish.position.z = Math.cos(t * 0.5) * 0.4;
      fish.rotation.y = t * 0.5;
    };
  } else if (kind === "hotel") {
    const plaster = M("#decbb0", 0.85);
    const metalwork = M("#655a55", 0.38, 0.3);
    building(g, 0, -0.27, 2.75, 2.25, 1.6, "#d7c5ac", s);
    box(g, 0, 2.5, -0.27, 2.91, 0.19, 1.85, plaster);
    box(g, 0, 0.57, 0.59, 0.54, 0.75, 0.07, M("#274a55", 0.18, 0.18));
    for (let level = 1; level < 5; level++) {
      const y = 0.42 + level * 0.4;
      box(g, 0, y, 0.63, 2.65, 0.035, 0.25, metalwork);
      for (let i = 0; i < 7; i++)
        box(g, -1.15 + i * 0.38, y + 0.13, 0.74, 0.023, 0.25, 0.027, metalwork);
    }
    box(g, 0, 0.99, 0.78, 1.2, 0.1, 0.7, M("#b78f6a", 0.73));
    for (const x of [-0.56, 0.56]) add(g, C(0.05, 0.06, 0.68, 16), plaster, x, 0.62, 0.88);
  } else if (kind === "museum" || kind === "theatre") {
    const gallery = kind === "museum";
    const finish = M(gallery ? "#d5c4ac" : "#ae8d7b", 0.88);
    box(g, 0, 0.22, 0, 3.0, 0.19, 1.85, stone);
    box(g, 0, 1.06, -0.17, 2.52, 1.63, 1.26, finish);
    box(g, 0, 1.91, -0.17, 2.76, 0.14, 1.43, metal);
    for (const x of [-1.07, -0.54, 0.54, 1.07]) {
      add(g, C(0.075, 0.082, 1.42, 16), stone, x, 1.09, 0.69);
      box(g, x, 1.87, 0.69, 0.21, 0.09, 0.22, metal);
    }
    const pediment = new THREE.Shape();
    pediment.moveTo(-1.41, 0);
    pediment.lineTo(0, 0.55);
    pediment.lineTo(1.41, 0);
    pediment.closePath();
    const roof = new THREE.ExtrudeGeometry(pediment, {
      depth: 0.2,
      bevelEnabled: true,
      bevelSize: 0.035,
      bevelThickness: 0.03,
    });
    add(g, roof, stone, 0, 2.02, 0.4);
    box(g, 0, 0.83, 0.73, 0.48, 0.83, 0.055, M("#234451", 0.17, 0.22));
    for (const x of [-0.92, 0.92]) {
      for (const y of [0.83, 1.31]) {
        box(g, x, y, 0.53, 0.23, 0.26, 0.035, G("#bcd9dc", 0.27));
        box(g, x, y + 0.14, 0.55, 0.3, 0.025, 0.09, metal);
      }
    }
    if (gallery) {
      const skylight = add(
        g,
        new THREE.SphereGeometry(0.52, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
        M("#a9c1c0", 0.21, 0.28),
        0,
        1.99,
        -0.22,
      );
      skylight.scale.set(1.13, 0.43, 0.83);
    } else {
      // Stage curtain, marquee and front-of-house amber lamps.
      box(g, 0, 1.05, 0.73, 0.4, 0.7, 0.07, M("#6a3449", 0.95));
      box(g, 0, 1.87, 0.75, 1.63, 0.17, 0.25, M("#41364a", 0.45));
      for (let i = 0; i < 9; i++)
        add(
          g,
          new THREE.SphereGeometry(0.038, 10, 8),
          G("#f6c582", 0.72),
          -0.72 + i * 0.18,
          1.88,
          0.89,
        );
    }
  } else if (kind === "cave") {
    // Uneven karst cliff with a dark, walkable opening and visible stalactites.
    const rock = M("#968f7e", 0.98);
    for (let i = 0; i < 23; i++) {
      const angle = i * 2.39996;
      const stonePiece = add(
        g,
        new THREE.IcosahedronGeometry(0.3 + R(s + i) * 0.32, 1),
        i % 4 ? rock : stone,
        Math.sin(angle) * 1.52,
        0.57 + R(s + i + 13) * 0.92,
        Math.cos(angle) * 0.9,
      );
      stonePiece.scale.set(1.2, 0.65 + R(i + 9) * 0.65, 0.82);
    }
    const mouth = add(g, new THREE.SphereGeometry(0.74, 48, 24), M("#151b21", 0.98), 0, 0.78, 0.94);
    mouth.scale.set(1.15, 1.3, 0.23);
    for (let i = 0; i < 8; i++) {
      const stalactite = add(
        g,
        new THREE.ConeGeometry(0.08 + R(i) * 0.07, 0.28 + R(i + 8) * 0.4, 9),
        rock,
        -0.61 + i * 0.18,
        1.48 - (i % 3) * 0.05,
        1.12,
      );
      stalactite.rotation.z = Math.PI;
    }
    for (let i = 0; i < 12; i++)
      add(
        g,
        new THREE.DodecahedronGeometry(0.09 + R(s + i) * 0.1, 1),
        stone,
        (R(i + s) - 0.5) * 2.8,
        0.23,
        1.0 + R(i + 4) * 0.8,
      );
  } else if (kind === "waterfall") {
    const cliff = M("#9f9b88", 0.96);
    const wet = M("#637b7c", 0.82);
    for (let i = 0; i < 12; i++) {
      const stonePiece = add(
        g,
        new THREE.IcosahedronGeometry(0.5 + (i % 3) * 0.13, 2),
        i % 2 ? cliff : wet,
        -1.35 + i * 0.24,
        0.65 + 0.5 * Math.sin(i * 1.7),
        -0.4,
      );
      stonePiece.scale.set(1.0, 1.3, 0.75);
    }
    add(g, new THREE.CircleGeometry(1.25, 72).rotateX(-Math.PI / 2), waterShader(), 0, 0.225, 0.62);
    for (let i = 0; i < 4; i++) {
      const fall = add(
        g,
        new THREE.PlaneGeometry(0.29 + R(i + s) * 0.2, 1.5, 12, 36),
        new THREE.ShaderMaterial({
          uniforms: { uTime: { value: 0 }, uNight: { value: 0 } },
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
          vertexShader: `varying vec2 vUv;uniform float uTime;void main(){vUv=uv;vec3 p=position;p.x+=0.024*sin(p.y*12.0+uTime*2.0);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`,
          fragmentShader: `
            uniform float uTime;
            varying vec2 vUv;
            void main() {
              float streams = pow(abs(sin(vUv.x * 28.0 + uTime * 0.7)), 4.0);
              float foam = pow(1.0 - vUv.y, 3.0) * 0.42;
              vec3 c = mix(
                vec3(0.15, 0.38, 0.46),
                vec3(0.74, 0.92, 0.96),
                streams * 0.56 + foam
              );
              gl_FragColor = vec4(c, 0.8);
              #include <tonemapping_fragment>
              #include <colorspace_fragment>
            }
          `,
        }),
        -0.55 + i * 0.38,
        1.14,
        0.28,
      );
      fall.rotation.y = (i - 1.5) * 0.12;
    }
    const mist = drift(g, 44, "#d1e6ed", 0.055, (i, t) => [
      (R(i + s) - 0.5) * 2.5 + Math.sin(t * 0.43 + i) * 0.16,
      0.32 + ((R(i + 13) + t * 0.11) % 1.3),
      0.4 + R(i + 34) * 0.8,
    ]);
    tick = (t) => mist(t);
  } else if (kind === "village") {
    const walls = M("#cfb693", 0.94);
    const thatch = M("#967146", 1);
    for (let i = 0; i < 5; i++) {
      const x = (i % 3) * 1.24 - 1.25,
        z = Math.floor(i / 3) * 1.12 - 0.62;
      const hut = new THREE.Group();
      hut.position.set(x, 0.21, z);
      add(hut, C(0.37, 0.42, 0.67, 16), walls, 0, 0.34);
      add(hut, new THREE.ConeGeometry(0.58, 0.5, 16), thatch, 0, 0.92);
      box(hut, 0, 0.3, 0.38, 0.19, 0.42, 0.035, dark);
      g.add(hut);
    }
    box(g, 0, 0.21, 0.95, 1.25, 0.03, 0.72, M("#b8aa88", 0.98));
  } else if (kind === "entertainment") {
    const venue = M("#a4a2a3", 0.5, 0.24);
    const black = M("#2d3443", 0.48, 0.2);
    building(g, 0, -0.27, 2.4, 1.55, 1.3, "#8f8b92", s);
    box(g, 0, 1.63, 0.58, 2.55, 0.12, 0.26, venue);
    for (let i = 0; i < 12; i++)
      box(g, -1.08 + i * 0.2, 1.61, 0.73, 0.13, 0.045, 0.1, G(i % 2 ? "#f7b3dc" : "#8ed6ee", 0.8));
    for (const x of [-0.6, 0.6]) {
      box(g, x, 0.75, 0.69, 0.43, 0.78, 0.07, black);
      box(g, x, 1.15, 0.73, 0.47, 0.03, 0.1, G("#8cd3e3", 0.7));
    }
    const lightDisc = add(
      g,
      new THREE.TorusGeometry(0.35, 0.045, 8, 48),
      G("#cf8cf1", 0.8),
      0,
      2.16,
      -0.18,
    );
    tick = (t) => (lightDisc.rotation.y = t * 0.27);
  } else if (kind === "park") {
    // Botanical garden / nature reserve diorama pedestal (Lowveld Botanical Garden, Kirstenbosch, etc.)
    // Matches the circular diorama disc with jacaranda & acacia trees, winding stream & footbridge (Image 2 style).
    const plinth = add(g, C(2.35, 2.4, 0.22, 64), M("#d5c8b5", 0.92, 0.04), 0, 0.11, 0);
    plinth.name = "botanical-pedestal-rim";

    // Undulating grassy mound
    const grassMat = M("#4f823e", 0.95);
    const mound = add(g, C(2.28, 2.32, 0.18, 64), grassMat, 0, 0.28, 0);
    mound.name = "botanical-grassy-mound";

    // Small winding stream with reflective water
    const stream = add(
      g,
      new THREE.RingGeometry(0.85, 1.45, 48, 1, 0.4, 2.4).rotateX(-Math.PI / 2),
      waterShader("#23828c"),
      -0.2,
      0.375,
      0.1,
    );
    stream.name = "botanical-stream";

    // Little wooden footbridge spanning the stream
    const bridgeWood = M("#7a5230", 0.88);
    const archBridge = add(g, B(0.38, 0.05, 0.72), bridgeWood, 0.45, 0.44, 0.35);
    archBridge.rotation.y = 0.55;
    box(g, 0.28, 0.56, 0.35, 0.04, 0.22, 0.72, bridgeWood);
    box(g, 0.62, 0.56, 0.35, 0.04, 0.22, 0.72, bridgeWood);

    // Boulders along stream bank
    const rock = M("#8c8779", 0.96);
    const rockPositions = [
      [-0.8, 0.38, 0.6],
      [-0.4, 0.37, 0.9],
      [0.2, 0.37, -0.4],
      [0.9, 0.38, 0.2],
      [-0.1, 0.38, -0.7],
      [-1.1, 0.38, -0.3],
    ];
    rockPositions.forEach(([rx, ry, rz], idx) => {
      const stoneMesh = add(
        g,
        new THREE.DodecahedronGeometry(0.12 + (idx % 3) * 0.06, 1),
        rock,
        rx,
        ry,
        rz,
      );
      stoneMesh.scale.set(1.2, 0.6, 0.9);
      stoneMesh.rotation.y = idx * 1.3;
    });

    // Trees: Jacarandas (purple blooms), Acacias (warm yellow-green canopy), Lush indigenous green
    const treeLocs = [
      { x: -1.2, z: -0.6, s: 0.88, k: 0 },
      { x: -0.7, z: -1.1, s: 0.75, k: 0 },
      { x: -0.3, z: -1.3, s: 0.95, k: 1 },
      { x: 0.5, z: -1.1, s: 0.82, k: 0 },
      { x: 1.1, z: -0.7, s: 0.92, k: 2 },
      { x: 1.3, z: -0.1, s: 0.78, k: 1 },
      { x: 1.2, z: 0.6, s: 0.85, k: 0 },
      { x: 0.8, z: 1.0, s: 0.72, k: 1 },
      { x: -0.6, z: 1.1, s: 0.8, k: 2 },
      { x: -1.3, z: 0.4, s: 0.9, k: 1 },
      { x: -0.5, z: 0.2, s: 0.68, k: 0 },
      { x: 0.1, z: 0.8, s: 0.74, k: 1 },
    ];
    treeLocs.forEach(({ x, z, s: sc, k }) => {
      tree(g, x, z, sc * 0.92, k, 0.36);
    });

    // Drifting blossom & petal particles floating above the garden
    const petals = drift(g, 42, "#c9a6ea", 0.045, (i, t) => [
      Math.sin(t * 0.28 + i * 1.7) * 1.5,
      0.65 + ((R(i + 7) * 2 + t * 0.12) % 1.5),
      Math.cos(t * 0.22 + i * 1.3) * 1.5,
    ]);
    tick = (t) => petals(t);
  } else if (kind === "colosseum") {
    // Roman amphitheatre diorama (Colosseum) matching Image 1
    const stoneCol = M("#d6c29e", 0.92, 0.02);
    const brickDark = M("#9c7152", 0.9);
    const sandMat = M("#dfcca3", 0.96);

    box(g, 0, 0.1, 0, 4.4, 0.2, 3.8, M("#c8b89e", 0.95));

    const outerRadiusX = 1.85;
    const outerRadiusZ = 1.45;
    const segments = 32;

    for (let tier = 0; tier < 3; tier++) {
      const yTier = 0.3 + tier * 0.62;
      const height = 0.58;
      const maxCol = tier === 0 ? segments : tier === 1 ? 26 : 20;

      for (let c = 0; c < maxCol; c++) {
        const theta = (c / segments) * Math.PI * 2;
        const xPos = outerRadiusX * Math.cos(theta);
        const zPos = outerRadiusZ * Math.sin(theta);
        const rotY = -theta + Math.PI / 2;

        const pMesh = add(g, B(0.18, height, 0.22), stoneCol, xPos, yTier + height / 2, zPos);
        pMesh.rotation.y = rotY;

        if (c < maxCol - 1) {
          const nextTheta = ((c + 0.5) / segments) * Math.PI * 2;
          const ax = outerRadiusX * Math.cos(nextTheta);
          const az = outerRadiusZ * Math.sin(nextTheta);
          const archMesh = add(g, B(0.24, 0.09, 0.22), stoneCol, ax, yTier + height - 0.045, az);
          archMesh.rotation.y = -nextTheta + Math.PI / 2;
        }
      }
    }

    for (let c = 0; c < 24; c++) {
      const theta = (c / 24) * Math.PI * 2;
      const ix = 1.32 * Math.cos(theta);
      const iz = 1.05 * Math.sin(theta);
      const innerMesh = add(g, B(0.14, 0.72, 0.16), stoneCol, ix, 0.56, iz);
      innerMesh.rotation.y = -theta + Math.PI / 2;
    }

    add(g, new THREE.CircleGeometry(0.85, 32).rotateX(-Math.PI / 2), sandMat, -0.1, 0.45, -0.1);

    for (let row = -3; row <= 3; row++) {
      box(g, row * 0.18, 0.28, 0.25, 0.045, 0.32, 0.65, brickDark);
    }

    const cypressMat = M("#274e2b", 0.9);
    const treeAngles = [0.8, 1.4, 2.3, 3.7, 4.6, 5.4];
    treeAngles.forEach((ang) => {
      const tx = 2.2 * Math.cos(ang);
      const tz = 1.8 * Math.sin(ang);
      const cyp = add(g, new THREE.ConeGeometry(0.14, 0.95, 8), cypressMat, tx, 0.68, tz);
      cyp.rotation.y = ang;
      add(g, C(0.03, 0.04, 0.22, 6), Mc("#4a3a2a"), tx, 0.28, tz);
    });
  } else if (kind === "eiffel-tower") {
    // Parisian lattice iron tower diorama matching Image 5
    const iron = M("#7e6d62", 0.65, 0.45);
    const lawn = M("#4f7d42", 0.95);
    box(g, 0, 0.1, 0, 3.4, 0.2, 3.4, M("#c7b89f", 0.95));
    box(g, 0, 0.21, 0, 3.2, 0.04, 3.2, lawn);

    const legOffset = 0.85;
    const corners = [
      [-legOffset, -legOffset],
      [legOffset, -legOffset],
      [-legOffset, legOffset],
      [legOffset, legOffset],
    ];
    corners.forEach(([cx, cz]) => {
      const leg = add(g, C(0.12, 0.22, 1.15, 6), iron, cx * 0.85, 0.75, cz * 0.85);
      leg.rotation.z = cx > 0 ? 0.24 : -0.24;
      leg.rotation.x = cz > 0 ? -0.24 : 0.24;
      box(g, cx, 0.24, cz, 0.38, 0.1, 0.38, stone);
    });

    corners.forEach(([cx, cz], i) => {
      const nextCorner = corners[(i + 1) % 4];
      const midX = (cx + nextCorner[0]) * 0.46;
      const midZ = (cz + nextCorner[1]) * 0.46;
      add(g, new THREE.TorusGeometry(0.55, 0.035, 6, 24, Math.PI), iron, midX, 1.08, midZ);
    });

    box(g, 0, 1.32, 0, 1.45, 0.08, 1.45, iron);
    box(g, 0, 1.38, 0, 1.35, 0.04, 1.35, M("#5a4e46", 0.7, 0.3));

    corners.forEach(([cx, cz]) => {
      const midLeg = add(g, C(0.08, 0.12, 0.95, 6), iron, cx * 0.48, 1.82, cz * 0.48);
      midLeg.rotation.z = cx > 0 ? 0.18 : -0.18;
      midLeg.rotation.x = cz > 0 ? -0.18 : 0.18;
    });

    box(g, 0, 2.32, 0, 0.85, 0.07, 0.85, iron);
    add(g, new THREE.ConeGeometry(0.36, 1.7, 6), iron, 0, 3.2, 0);
    add(g, new THREE.SphereGeometry(0.11, 16, 12), iron, 0, 4.1, 0);
    add(g, C(0.015, 0.02, 0.55, 6), M("#eae6df", 0.3, 0.7), 0, 4.4, 0);

    for (const [tx, tz] of [
      [-1.3, -1.3],
      [1.3, -1.3],
      [-1.3, 1.3],
      [1.3, 1.3],
    ]) {
      tree(g, tx, tz, 0.65, 1, 0.22);
    }
  } else if (kind === "leaning-tower") {
    // Leaning Tower of Pisa diorama matching Image 4
    const marble = M("#eee8db", 0.75, 0.05);
    const lawn = M("#4d7d3d", 0.95);
    box(g, 0, 0.1, 0, 3.2, 0.2, 3.2, M("#c7b89f", 0.95));
    box(g, 0, 0.21, 0, 3.0, 0.04, 3.0, lawn);

    for (const [hx, hz, rot] of [
      [-1.1, -0.9, 0],
      [1.1, 0.8, Math.PI / 2],
      [1.1, 1.15, Math.PI / 2],
    ]) {
      box(g, hx, 0.36, hz, 0.45, 0.28, 0.35, M("#f4ede0", 0.9));
      const roof = add(g, new THREE.ConeGeometry(0.34, 0.22, 4), M("#c25a3a", 0.85), hx, 0.58, hz);
      roof.rotation.y = Math.PI / 4 + rot;
    }

    const towerGroup = new THREE.Group();
    towerGroup.position.set(0, 0.22, 0);
    towerGroup.rotation.z = 0.07;

    add(towerGroup, C(0.55, 0.58, 0.65, 32), marble, 0, 0.325, 0);

    for (let t = 0; t < 6; t++) {
      const y = 0.72 + t * 0.38;
      add(towerGroup, C(0.46, 0.46, 0.36, 24), marble, 0, y, 0);
      add(
        towerGroup,
        new THREE.TorusGeometry(0.54, 0.024, 6, 32).rotateX(Math.PI / 2),
        marble,
        0,
        y + 0.18,
        0,
      );
      for (let c = 0; c < 12; c++) {
        const ang = (c / 12) * Math.PI * 2;
        add(
          towerGroup,
          C(0.024, 0.024, 0.34, 6),
          marble,
          0.52 * Math.sin(ang),
          y,
          0.52 * Math.cos(ang),
        );
      }
    }

    const belfryY = 3.15;
    add(towerGroup, C(0.42, 0.44, 0.45, 24), marble, 0, belfryY, 0);
    add(towerGroup, new THREE.SphereGeometry(0.12, 12, 8), M("#8a7155", 0.4, 0.6), 0, belfryY, 0);
    g.add(towerGroup);

    for (let i = 0; i < 7; i++) {
      const ang = i * 0.9;
      tree(g, Math.sin(ang) * 1.15, Math.cos(ang) * 1.15, 0.55, 1, 0.22);
    }
  } else if (kind === "clock-tower") {
    // Big Ben & Palace of Westminster diorama matching Image 4
    const limestone = M("#dfc7a2", 0.88, 0.05);
    const roofCopper = M("#3b6b55", 0.82);
    box(g, 0, 0.1, 0, 3.8, 0.2, 2.6, M("#2c2b28", 0.95));

    box(g, -0.65, 0.85, 0, 2.2, 1.3, 1.45, limestone);
    box(g, -0.65, 1.56, 0, 2.25, 0.16, 1.5, roofCopper);
    for (const [px, pz] of [
      [-1.7, -0.7],
      [-1.7, 0.7],
      [0.4, -0.7],
      [0.4, 0.7],
    ]) {
      add(g, new THREE.ConeGeometry(0.12, 0.42, 4), roofCopper, px, 1.82, pz);
    }

    const towerX = 0.95;
    box(g, towerX, 1.25, 0, 0.68, 2.1, 0.68, limestone);
    for (const [fx, fz, ry] of [
      [towerX, 0.35, 0],
      [towerX, -0.35, Math.PI],
      [towerX + 0.35, 0, Math.PI / 2],
      [towerX - 0.35, 0, -Math.PI / 2],
    ]) {
      const face = add(g, new THREE.CircleGeometry(0.19, 24), M("#fef7e6", 0.85), fx, 2.05, fz);
      face.rotation.y = ry;
      const hand = add(
        g,
        B(0.018, 0.14, 0.01),
        dark,
        fx,
        2.08,
        fz + (fz > 0 ? 0.01 : fz < 0 ? -0.01 : 0),
      );
      if (fx !== towerX) hand.position.x += fx > towerX ? 0.01 : -0.01;
    }
    box(g, towerX, 2.45, 0, 0.62, 0.32, 0.62, limestone);
    const spire = add(g, new THREE.ConeGeometry(0.42, 0.95, 4), roofCopper, towerX, 3.05, 0);
    spire.rotation.y = Math.PI / 4;
    add(g, C(0.02, 0.03, 0.45, 6), M("#ffd166", 0.3, 0.7), towerX, 3.65, 0);

    box(g, -0.65, 0.22, 0.45, 0.85, 0.04, 0.35, M("#4d7d3d", 0.95));
    tree(g, -0.9, 0.45, 0.55, 1, 0.24);
    tree(g, -0.4, 0.45, 0.55, 1, 0.24);
  } else {
    // Articulated civic hall & copper rotunda with portico pediment and instanced pilasters.
    const facadeMat = pbrSurface("limestone", tone);
    const wingMat = pbrSurface("sandstone", "#d4c6ae");
    const copperMat = pbrSurface("terracotta", "#5f7d6e");
    const width = 2.5 + (s % 5) * 0.11;

    const podium = add(g, B(width + 0.32, 0.22, 1.85), wingMat, 0, 0.31, -0.2);
    podium.name = "dome-granite-podium";
    const mainHall = add(g, B(width, 1.28, 1.48), facadeMat, 0, 1.06, -0.28);
    mainHall.name = "dome-civic-hall";
    const drum = add(g, C(0.74, 0.82, 0.56, 36), facadeMat, 0, 1.98, -0.28);
    drum.name = "dome-rotunda-drum";
    const cupola = add(
      g,
      new THREE.SphereGeometry(0.78, 36, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      copperMat,
      0,
      2.24,
      -0.28,
    );
    cupola.name = "dome-copper-cupola";
    const lantern = add(g, C(0.18, 0.2, 0.28, 16), G("#ffd896", 1.2), 0, 3.08, -0.28);
    lantern.name = "dome-cupola-lantern";
    const finial = add(g, new THREE.ConeGeometry(0.21, 0.26, 16), metal, 0, 3.34, -0.28);
    finial.name = "dome-finial-spire";

    // Instanced rotunda pilasters & classical portico colonnade
    const pilasterMesh = new THREE.InstancedMesh(B(0.09, 0.52, 0.09), wingMat, 12);
    pilasterMesh.name = "dome-rotunda-pilasters";
    const pDummy = new THREE.Object3D();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      pDummy.position.set(Math.cos(a) * 0.78, 1.98, -0.28 + Math.sin(a) * 0.78);
      pDummy.rotation.set(0, -a, 0);
      pDummy.updateMatrix();
      pilasterMesh.setMatrixAt(i, pDummy.matrix);
    }
    pilasterMesh.instanceMatrix.needsUpdate = true;
    g.add(pilasterMesh);

    const portico = new THREE.Group();
    portico.name = "dome-entrance-portico";
    for (let i = 0; i < 5; i++) {
      add(portico, C(0.06, 0.072, 1.08, 10), wingMat, -0.88 + i * 0.44, 0.96, 0.52);
    }
    add(portico, B(2.05, 0.14, 0.34), copperMat, 0, 1.56, 0.52);
    add(portico, B(0.46, 0.68, 0.06), G("#ffd184", 1.0), 0, 0.76, 0.46);
    g.add(portico);
    [-0.55, 0.55].forEach((sx, idx) => {
      const bollard = add(g, C(0.035, 0.04, 0.18, 8), dark, sx, 0.51, 0.68);
      bollard.name = `dome-step-bollard-${idx + 1}`;
      bollard.userData.scaleCue = true;
    });
  }
  const originalTick = tick;
  g.userData.tick = (t) => originalTick(t);
  return g;
}
const BUILT = { table, union, stadium, bridge, hole, voortrekker };
const RIG_KEYS = {
  table: "table-mountain",
  union: "union-buildings",
  stadium: "stadium",
  bridge: "nelson-mandela-bridge",
  hole: "hole",
  voortrekker: "voortrekker",
};
export function createProceduralLandmark(name, model = "dome") {
  const key = name.toLowerCase();
  const specific = key.includes("table mountain")
    ? "table"
    : key.includes("union buildings")
      ? "union"
      : key.includes("moses mabhida")
        ? "stadium"
        : key.includes("nelson mandela bridge")
          ? "bridge"
          : key.includes("big hole")
            ? "hole"
            : key.includes("voortrekker")
              ? "voortrekker"
              : null;
  const hasCanvas2d =
    typeof document !== "undefined" &&
    typeof document.createElement === "function" &&
    (() => {
      try {
        const c = document.createElement("canvas");
        return (
          typeof c.getContext === "function" &&
          typeof c.getContext("2d")?.createImageData === "function"
        );
      } catch {
        return false;
      }
    })();
  const coastal = hasCanvas2d && key.includes("moses mabhida");
  const subject = coastal
    ? createCoastalDiorama({ segs: 64, trees: 150, people: 56 })
    : specific
      ? BUILT[specific]()
      : genericLandmark(name, model);
  // Initialize particles, cable cars, water, and flags even with reduced motion enabled.
  subject.userData.citylitDiorama = true;
  subject.userData.tick?.(0);
  const rigKey = specific ? (RIG_KEYS[specific] ?? specific) : model;
  const display = new THREE.Group();
  display.add(subject);
  applyLandmarkCraft(display);
  addLandmarkScaleCues(display, landmarkSpec(rigKey));
  // The rig lives on the returned display group so React can address joints
  // without knowing about the inner builder group.
  attachLandmarkRig(display, rigKey);
  display.name = "procedural:" + name;
  display.userData.placeName = name;
  // Fit all 12 cities and all existing places into the same inspectable ring stage.
  const bounds = new THREE.Box3().setFromObject(display),
    size = bounds.getSize(new THREE.Vector3());
  const fit = Math.min(3.45 / Math.max(size.x, size.z, 0.001), 2.9 / Math.max(size.y, 0.001));
  subject.scale.multiplyScalar(Math.min(fit, 4));
  bounds.setFromObject(display);
  const center = bounds.getCenter(new THREE.Vector3());
  subject.position.x -= center.x;
  subject.position.z -= center.z;
  subject.position.y -= bounds.min.y - 0.02;
  const wind = [];
  const emissive = new Set(),
    shaders = [];
  display.traverse((o) => {
    if (o.userData?.wind) wind.push({ o, ...o.userData.wind });
    if (!o.isMesh && !o.isPoints) return;
    o.castShadow = !!o.isMesh;
    o.receiveShadow = !!o.isMesh;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) {
      if (m?.userData?.i) emissive.add(m);
      if (m?.isShaderMaterial) shaders.push(m);
    }
  });
  display.userData.lights = [...emissive];
  let previousTime = null;
  let lodTier = -1;
  display.userData.tick = (t, night = 0) => {
    subject.userData.tick?.(t);
    const delta = previousTime === null ? 0 : Math.min(Math.max(t - previousTime, 0), 0.1);
    previousTime = t;
    updateLandmarkRig(display, delta);
    if (typeof window !== "undefined") {
      const tier = window.__citylitRendererDiagnostics?.tier;
      const level = tier === "saver" ? 0 : tier === "balanced" ? 1 : 2;
      if (level !== lodTier) {
        applyLandmarkLod(display, level);
        lodTier = level;
      }
    }
    for (const { o, ph, a, sp } of wind) {
      o.rotation.z = Math.sin(t * sp + ph) * a;
      o.rotation.x = Math.cos(t * sp * 0.8 + ph) * a * 0.7;
    }
    for (const m of shaders) {
      if (m.uniforms?.uTime) m.uniforms.uTime.value = t;
      if (m.uniforms?.uNight) m.uniforms.uNight.value = night;
    }
  };
  return display;
}
export function setProceduralNight(group, night) {
  const lights = group.userData.lights || [];
  for (const m of lights) m.emissiveIntensity = (night ? 1.65 : 0.12) * (m.userData.i || 1);
  group.traverse((o) => {
    if (o.material) {
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        if (m.isShaderMaterial && m.uniforms?.uNight) m.uniforms.uNight.value = night ? 1 : 0;
      }
    }
  });
  group.userData.night = night ? 1 : 0;
}
export function disposeProceduralLandmark(group) {
  const geometries = new Set(),
    materials = new Set();
  group.traverse((o) => {
    if (o.geometry) geometries.add(o.geometry);
    if (o.material)
      (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => materials.add(m));
  });
  geometries.forEach((g) => {
    if (!g.userData?.shared) g.dispose();
  });
  materials.forEach((m) => {
    if (!m.userData?.shared) {
      if (!m.userData?.sharedTextures) {
        m.map?.dispose();
        m.emissiveMap?.dispose();
      }
      m.dispose();
    }
  });
}
