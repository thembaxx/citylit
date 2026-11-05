// Ported from the supplied Citylit landmark study; r187-compatible procedural Three.js.
// Geometry is illustrative, not a survey-grade reproduction. No imported models/textures.
import * as THREE from "three";

/** Coherent Gerstner-style water ripples, grazing highlights and shore foam. */
function waterShader() {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uNight: { value: 0 } },
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
      varying vec2 vUv;
      varying vec3 vLocal;
      void main() {
        vec2 p = vLocal.xz * 3.8 + vUv * 2.0;
        float a = sin(p.x * 3.7 + uTime * 1.4) * cos(p.y * 3.2 - uTime * 0.8);
        float b = sin(p.x * 7.1 - p.y * 4.3 + uTime * 1.2);
        float ripple = a * 0.65 + b * 0.35;
        float highlight = pow(max(0.0, 0.52 + ripple * 0.34), 7.0);
        float foam = smoothstep(0.36, 0.50, length(vUv - 0.5)) * 0.12;
        vec3 day = vec3(0.025, 0.27, 0.32);
        vec3 night = vec3(0.01, 0.09, 0.18);
        vec3 base = mix(day, night, uNight);
        vec3 water = base + highlight * vec3(0.19, 0.35, 0.38) + foam;
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
const warp = (geo, cap) => {
  const p = geo.attributes.position,
    a1 = new THREE.Color("#58763f"),
    a2 = new THREE.Color("#c0a077"),
    a3 = new THREE.Color("#8b8a55");
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i),
      z = p.getZ(i),
      a = Math.atan2(z, x),
      f = 1 + 0.09 * n(a * 3, y * 2) + (0.05 * Math.sin(a * 7) * (y + 1.2)) / 2.4;
    p.setXYZ(i, x * f, y + 0.04 * n(x * 2, z * 2), z * f);
  }
  return tint(geo, (k, x, y) => {
    const t = Math.floor(((y + 1.2) / 2.4) * 9) / 9;
    if (cap) {
      k.copy(a3);
    } else {
      k.copy(a1).lerp(a2, Math.min(1, Math.max(0, (t - 0.3) * 2)));
    }
  });
};
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
function table() {
  const g = new THREE.Group(),
    vm = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 });
  add(g, C(6.2, 6.9, 0.5, 96), M("#486a38", 1), 0, 0.25, 0);
  add(g, warp(C(3.6, 5.6, 2.4, 96, 14, true), 0), vm, 0, 1.45, 0).material.side = 2;
  add(
    g,
    warp(new THREE.CircleGeometry(3.6, 96).rotateX(-Math.PI / 2).translate(0, 1.2, 0), 1),
    vm,
    0,
    1.45,
    0,
  );
  lump(g, 1.5, -4.9, 1.9, 1, 1.15, "#5a7a44");
  lump(g, 1.6, 4.6, 0.8, 1.3, 1, "#7b7b55");
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
  const bs = new THREE.IcosahedronGeometry(0.16, 1),
    bm = [M("#3d5a2e", 1), M("#6b7f3a", 1), M("#8a5a3a", 1)];
  for (let i = 0; i < 80; i++) {
    const a = R(i) * 6.2832,
      r = 5.75 + R(i + 99) * 0.55;
    add(g, bs, bm[i % 3], r * Math.cos(a), 0.5, r * Math.sin(a)).scale.set(
      1 + R(i + 5),
      0.7 + R(i + 7) * 0.6,
      1 + R(i + 9),
    );
  }
  const rk = new THREE.DodecahedronGeometry(0.17, 0),
    rm = M("#a58c68", 1);
  for (let i = 0; i < 30; i++) {
    const a = R(i + 200) * 6.2832,
      r = Math.sqrt(R(i + 300)) * 3.1;
    add(g, rk, rm, r * Math.cos(a), 2.68, r * Math.sin(a)).scale.set(
      1 + R(i) * 1.2,
      0.5,
      1 + R(i + 1),
    );
  }
  add(g, C(0.08, 0.2, 0.45, 10), M("#8d8d8d", 0.9), -0.8, 2.85, -1.2);
  add(g, B(0.7, 0.5, 0.6), M("#c9c9c9", 0.5, 0.3), 1, 0.8, 6.4);
  add(g, B(0.6, 0.4, 0.6), M("#c9c9c9", 0.5, 0.3), 1, 2.85, 3.3);
  g.add(lines([1, 1.1, 6.4, 1, 2.9, 3.4], "#222"));
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
  [1.8, 2, 2.2, 2.4, -0.5, -0.8, -1.1].forEach((a, i) =>
    tree(g, 6.3 * Math.cos(a), 6.3 * Math.sin(a), 1 + R(i) * 0.5, 1, 0.5),
  );
  const cab2 = add(g, B(0.34, 0.24, 0.26), M("#2a6fd3", 0.4, 0.3));
  g.add(lines([1.4, 1.1, 6.4, 1.4, 2.9, 3.4], "#222"));
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
    cab.position.set(1, 1.0 + 1.8 * u, 6.4 - 3 * u);
    cab2.position.set(1.4, 1.0 + 1.8 * (1 - u), 6.4 - 3 * (1 - u));
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
    st = M("#d8b888", 0.85),
    dk = M("#b8955f", 0.9),
    cu = M("#5aa391", 0.4, 0.6),
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
  for (let i = 0; i <= 18; i++) {
    const a = (i / 18) * Math.PI;
    add(g, C(0.09, 0.1, 1.85, 12), st, 3.45 * Math.cos(a), 1.725, -1.2 - 3.45 * Math.sin(a));
  }
  [-1, 1].forEach((s) => {
    add(g, B(2.6, 2, 2.4), st, s * 5.1, 1.8, -1.2);
    add(g, B(2.8, 0.2, 2.6), dk, s * 5.1, 2.9, -1.2);
    add(g, B(1.3, 3.6, 1.3), st, s * 5.8, 2.6, -0.9);
    add(g, C(0.55, 0.65, 0.5, 24), st, s * 5.8, 4.65, -0.9);
    add(
      g,
      new THREE.SphereGeometry(0.7, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      cu,
      s * 5.8,
      4.9,
      -0.9,
    );
    for (let j = 0; j < 3; j++)
      for (let r = 0; r < 2; r++)
        add(g, B(0.35, 0.55, 0.05), wn, s * 5.1 + (j - 1) * 0.75 - s * 0.2, 1.4 + r * 0.9, 0);
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
function stadium() {
  const g = new THREE.Group(),
    sh = M("#e9e6df", 0.5, 0.1),
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
  add(g, new THREE.LatheGeometry(pr, 96), sh);
  add(g, new THREE.CircleGeometry(2.3, 64).rotateX(-Math.PI / 2), M("#3f8a4a", 1), 0, 0.16, 0);
  add(g, new THREE.TorusGeometry(4.35, 0.1, 10, 128).rotateX(Math.PI / 2), gl, 0, 2.35, 0);
  add(g, new THREE.TorusGeometry(4.4, 0.05, 8, 128).rotateX(Math.PI / 2), gl, 0, 1.3, 0);
  const H = 7.2,
    y = (x) => Math.max(0.1, H * (1 - (x / 5.6) ** 2)),
    dz = (x, s) => s * (x < -1.5 ? Math.min(1.5, (-1.5 - x) * 0.5) + 0.2 : 0.2);
  [-1, 1].forEach((s) => {
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const x = -5.6 + i * 0.28;
      pts.push(new THREE.Vector3(x, y(x), dz(x, s)));
    }
    add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 140, 0.13, 10), st);
  });
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
    add(g, C(r2 - 0.03, r1 - 0.03, b - a, 96, 1, true), m, 0, (a + b) / 2, 0);
  });
  const fm = M("#cfd3d8", 0.4, 0.6);
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * 6.2832;
    add(g, B(0.08, 2.35, 0.16), fm, 4.38 * Math.cos(a), 1.18, 4.38 * Math.sin(a)).rotation.y = -a;
  }
  for (let i = 0; i < 4; i++) {
    const a = i * 1.5708 + 0.785,
      x = 4.6 * Math.cos(a),
      z = 4.6 * Math.sin(a);
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
  const rm = M("#f2f2f2", 0.6);
  rm.side = 2;
  rm.transparent = true;
  rm.opacity = 0.85;
  add(
    g,
    new THREE.LatheGeometry([new THREE.Vector2(3.3, 2.15), new THREE.Vector2(4.45, 2.4)], 96),
    rm,
  );
  const tv = [],
    av = [];
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * 6.2832,
      c = Math.cos(a),
      s = Math.sin(a);
    tv.push(3.3 * c, 2.15, 3.3 * s, 4.45 * c, 2.4, 4.45 * s);
    av.push(2.4 * c, 0.22, 2.4 * s, 3.75 * c, 1.95, 3.75 * s);
  }
  g.add(lines(tv, "#aab4c0"));
  g.add(lines(av, "#8794a6"));
  add(g, C(5.6, 5.8, 0.12, 96), M("#b9b4a8", 0.9), 0, 0.06, 0);
  [-1, 1].forEach((s) => add(g, B(0.6, 0.5, 0.6), M("#9a9a96", 0.9), -5.6, 0.25, s * 1.7));
  add(g, B(0.7, 0.5, 0.9), M("#9a9a96", 0.9), 5.6, 0.25, 0);
  for (let i = 0; i < 5; i++)
    add(g, B(0.3, 0.01, 2.1), M(i % 2 ? "#4d9d58" : "#3a8446", 1), -1.2 + i * 0.6, 0.17, 0);
  const sk = add(g, B(0.3, 0.26, 0.3), M("#d33", 0.4, 0.3));
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
    wh = M("#f0f0f0", 0.3, 0.3),
    dk = M("#2b2e36", 0.8, 0.2),
    bd = G("#c9b99a", 0.9),
    v = [];
  add(g, B(15, 0.2, 1.7), dk, 0, 1.7, 0);
  [-7.4, 7.4].forEach((x) => add(g, B(1.2, 1.7, 1.9), dk, x, 0.85, 0));
  [
    [-2.3, 0.9],
    [2.5, -0.9],
  ].forEach(([mx, mz]) => {
    add(g, C(0.05, 0.16, 6.4, 16), wh, mx, 4.9, mz);
    for (let i = -6; i <= 6; i++) {
      if (!i) continue;
      v.push(mx, 8.1 - Math.abs(i) * 0.3, mz, mx + i * 0.55, 1.8, mz);
    }
  });
  g.add(lines(v, "#e9e9e9"));
  for (let k = 0; k < 6; k++) add(g, B(18, 0.05, 0.08), M("#777", 0.4, 0.8), 0, 0.05, -3 + k * 1.2);
  const trn = [
    [-4, -1.2, "#b5532f"],
    [3, 1.8, "#3d6fa8"],
    [-0.5, -2.4, "#c8a53a"],
  ].map(([x, z, c]) => {
    const m = add(g, B(2.6, 0.4, 0.6), M(c, 0.6, 0.2), x, 0.3, z);
    m.userData.x0 = x;
    return m;
  });
  add(g, C(0.8, 0.8, 5.6, 32), bd, -5.5, 2.8, -4);
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
  [-0.8, 0.8].forEach((z) => {
    add(g, B(15, 0.14, 0.05), wh, 0, 1.84, z);
    for (let i = 0; i < 9; i++) {
      const x = -6.6 + i * 1.65;
      add(g, pg, dk, x, 2.05, z);
      add(g, lp, bd, x, 2.35, z);
    }
  });
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
  add(g, C(0.08, 0.15, 7, 12), wh, 6.5, 3.5, -4.6);
  add(g, new THREE.SphereGeometry(0.4, 16, 12), bd, 6.5, 6, -4.6);
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
    if (yy < -0.01 && yy > -3 && Math.hypot(x, z) < 5.45) {
      const f = 1 + 0.05 * n(Math.atan2(z, x) * 2, yy * 1.5);
      p.setXYZ(i, x * f, yy, z * f);
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
  const vm = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, side: 2 });
  add(g, geo, vm);
  add(g, new THREE.CircleGeometry(2.3, 64).rotateX(-Math.PI / 2), waterShader(), 0, -2.45, 0);
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
  const bh = new THREE.IcosahedronGeometry(0.18, 0);
  for (let i = 0; i < 34; i++) {
    const a = R(i) * 6.2832,
      r = 6 + R(i + 50) * 1.4;
    add(
      g,
      bh,
      M(i % 3 ? "#7a6a40" : "#5c6e3a", 1),
      r * Math.cos(a),
      0.1,
      r * Math.sin(a),
    ).scale.set(1 + R(i) * 1.5, 0.7 + R(i + 3), 1 + R(i + 7) * 1.5);
  }
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
function windows(g, x, z, w, h, front, seed) {
  const cols = Math.max(2, Math.floor(w / 0.33)),
    rows = Math.max(1, Math.floor(h / 0.38));
  const geo = B(0.1, 0.17, 0.018),
    mat = G("#f5c887", 0.85),
    mesh = new THREE.InstancedMesh(geo, mat, cols * rows);
  const m = new THREE.Matrix4();
  let i = 0;
  for (let row = 0; row < rows; row++)
    for (let col = 0; col < cols; col++) {
      const xx = x + ((col - (cols - 1) / 2) * w) / (cols + 0.3),
        yy = 0.2 + ((row + 0.5) * h) / rows;
      m.makeTranslation(xx, yy, z + front / 2 + 0.012);
      if (R(seed + row * 97 + col * 31) > 0.82) m.scale(new THREE.Vector3(0.9, 0.16, 0.9));
      mesh.setMatrixAt(i++, m);
    }
  mesh.instanceMatrix.needsUpdate = true;
  g.add(mesh);
}
function building(g, x, z, w, h, d, wall, seed) {
  box(g, x, h / 2, z, w, h, d, M(wall, 0.84));
  box(g, x, h + 0.06, z, w + 0.12, 0.12, d + 0.1, M("#5b544e", 0.75));
  windows(g, x, z, w, h, d, seed);
}
function genericLandmark(name, kind) {
  const g = new THREE.Group(),
    s = seedName(name),
    tone = ["#d0b28a", "#cdbdaa", "#c8aaa0", "#bcc5be", "#c4b6a3"][s % 5];
  const stone = M(tone, 0.9),
    metal = M("#c9cbca", 0.48, 0.62),
    dark = M("#383b41", 0.72),
    grass = M("#5d8057", 0.98);
  add(g, C(3.2, 3.35, 0.18, 64), M("#a9a08e", 0.95), 0, 0.09, 0);
  const ground = add(g, C(3.0, 3.05, 0.025, 64), grass, 0, 0.192, 0);
  let tick = () => {};
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
    const wall = M("#d7d0be", 0.82),
      roof = M("#b4aba0", 0.75);
    add(g, C(0.85, 1.0, 2.7, 48, 1, true), wall, 0, 1.57, 0);
    add(g, new THREE.TorusGeometry(0.83, 0.07, 10, 64).rotateX(Math.PI / 2), roof, 0, 2.94, 0);
    for (let floor = 0; floor < 12; floor++)
      for (let k = 0; k < 24; k++) {
        const a = (k / 24) * Math.PI * 2;
        const p = add(
          g,
          B(0.095, 0.15, 0.018),
          G("#ffcf91", 0.55),
          0.875 * Math.sin(a),
          0.38 + floor * 0.215,
          0.875 * Math.cos(a),
        );
        p.rotation.y = a;
      }
  } else if (kind === "stadium") {
    const bowl = [
      [1.0, 0.3],
      [1.55, 0.9],
      [1.85, 1.55],
      [1.9, 1.75],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    add(g, new THREE.LatheGeometry(bowl, 72), stone);
    add(g, new THREE.CircleGeometry(1.0, 72).rotateX(-Math.PI / 2), M("#38805a", 1), 0, 0.31, 0);
    const pts = Array.from({ length: 28 }, (_, i) => {
      let x = -2.25 + (i * 4.5) / 27;
      return new THREE.Vector3(x, 2.8 * (1 - (x / 2.25) ** 2) + 0.26, 0);
    });
    add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 84, 0.065, 8), metal);
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2;
      add(g, B(0.07, 0.3, 0.08), G("#f0f0db", 1), 2.05 * Math.cos(a), 1.7, 2.05 * Math.sin(a));
    }
  } else if (kind === "table-mountain" || kind === "park") {
    const geo = new THREE.SphereGeometry(1.6, 48, 24),
      p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i),
        y = p.getY(i),
        z = p.getZ(i);
      const variation = 1 + 0.14 * n(x * 2.2, z * 2.2) + 0.05 * Math.sin(x * 5 + z * 2);
      p.setXYZ(
        i,
        x * variation,
        y * 0.38 + 0.39 + (kind === "table-mountain" ? Math.max(0, y) * 0.52 : 0),
        z * variation,
      );
    }
    geo.computeVertexNormals();
    add(g, geo, M(kind === "park" ? "#658c64" : "#888f70", 1), 0, 0.12, 0);
    if (kind === "park") {
      add(
        g,
        new THREE.CircleGeometry(0.65, 36).rotateX(-Math.PI / 2),
        waterShader(),
        0.3,
        0.52,
        0.25,
      );
    }
    for (let i = 0; i < 18; i++) {
      const a = R(s + i) * Math.PI * 2,
        r = 0.85 + R(i + s + 42) * 1.4;
      tree(g, Math.cos(a) * r, Math.sin(a) * r, 0.28 + R(i + s + 3) * 0.23, i % 3, 0.23);
    }
  } else if (kind === "lighthouse" || kind === "tower") {
    const isBeacon = kind === "lighthouse";
    add(
      g,
      C(isBeacon ? 0.3 : 0.45, isBeacon ? 0.5 : 0.62, isBeacon ? 2.25 : 2.05, 28),
      stone,
      0,
      1.25,
      0,
    );
    for (let i = 0; i < (isBeacon ? 3 : 7); i++)
      add(
        g,
        C(isBeacon ? 0.38 : 0.55, isBeacon ? 0.43 : 0.59, 0.045, 28),
        metal,
        0,
        0.45 + i * 0.29,
        0,
      );
    add(g, C(0.5, 0.48, 0.14, 28), dark, 0, 2.45, 0);
    add(g, C(0.38, 0.38, 0.4, 24), G("#ffdc99", 1.4), 0, 2.7, 0);
    add(g, new THREE.ConeGeometry(0.46, 0.35, 24), metal, 0, 3.05, 0);
    if (isBeacon) {
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
      tick = (t) => {
        beam.rotation.y = t * 0.45;
      };
    }
  } else if (kind === "bridge") {
    box(g, 0, 0.88, 0, 5, 0.12, 0.82, dark);
    for (let x of [-1.3, 1.3]) {
      add(g, C(0.08, 0.12, 2.6, 10), metal, x, 2.18, 0);
      const segments = [];
      for (let i = -5; i <= 5; i++) segments.push(x, 3.48, 0, i * 0.47, 0.95, 0);
      g.add(lines(segments, "#d8d9d8"));
    }
    const cars = [-1, 1].map((_, i) =>
      add(g, B(0.34, 0.13, 0.19), M(i ? "#d47b58" : "#6b9fc4"), 0, 1.04, i ? 0.2 : -0.2),
    );
    tick = (t) =>
      cars.forEach((c, i) => {
        c.position.x = THREE.MathUtils.euclideanModulo(t * (i ? 0.52 : -0.6) + i * 2.4, 4.8) - 2.4;
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
      building(g, 0, -0.2, 2.5, 1.35, 1.7, tone, s);
      for (let i = 0; i < 6; i++) box(g, -1.1 + i * 0.44, 1.52, 0.63, 0.24, 0.24, 0.3, stone);
      for (const x of [-1.1, 1.1]) add(g, C(0.32, 0.35, 1.7, 12), stone, x, 1.05, 0.6);
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
  } else {
    // Place-specific civic building rather than an unrelated landmark asset.
    const width = 2.4 + (s % 5) * 0.13;
    building(g, 0, -0.3, width, 1.4 + (s % 3) * 0.2, 1.5, tone, s);
    add(g, C(0.75, 0.82, 0.55, 36), stone, 0, 2.15, -0.3);
    add(
      g,
      new THREE.SphereGeometry(0.8, 36, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      metal,
      0,
      2.36,
      -0.3,
    );
    for (let i = 0; i < 5; i++) add(g, C(0.06, 0.07, 1.1, 10), stone, -0.95 + i * 0.48, 0.74, 0.49);
  }
  // Procedural vegetation and landmarks share one wind controller.
  if (kind !== "park" && kind !== "table-mountain" && kind !== "bo-kaap") {
    for (let i = 0; i < 5; i++) {
      const a = i * 2.3 + s * 0.001;
      tree(g, Math.cos(a) * 2.52, Math.sin(a) * 2.52, 0.28 + R(s + i) * 0.14, i % 3, 0.2);
    }
  }
  const originalTick = tick;
  g.userData.tick = (t) => originalTick(t);
  ground.userData.proceduralBase = true;
  return g;
}
const BUILT = { table, union, stadium, bridge, hole };
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
            : null;
  const subject = specific ? BUILT[specific]() : genericLandmark(name, model);
  // Initialize particles, cable cars, water, and flags even with reduced motion enabled.
  subject.userData.tick?.(0);
  const display = new THREE.Group();
  display.add(subject);
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
  display.userData.tick = (t, night = 0) => {
    subject.userData.tick?.(t);
    for (const { o, ph, a, sp } of wind) {
      o.rotation.z = Math.sin(t * sp + ph) * a;
      o.rotation.x = Math.cos(t * sp * 0.8 + ph) * a * 0.7;
    }
    for (const m of shaders) {
      if (m.uniforms?.uTime) m.uniforms.uTime.value = t;
      if (m.uniforms?.uNight) m.uniforms.uNight.value = night;
    }
  };
  display.userData.lights = [...emissive];
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
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => {
    if (!m.userData?.shared) {
      m.map?.dispose();
      m.emissiveMap?.dispose();
      m.dispose();
    }
  });
}
