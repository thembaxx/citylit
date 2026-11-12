/* oxlint-disable */
// src/diorama/coastal.ts
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
var S = 5.4;
var T = 2.02;
var _up = new THREE.Vector3(0, 1, 0);
var _pos = new THREE.Vector3();
var _quat = new THREE.Quaternion();
var _scl = new THREE.Vector3();
var _tan = new THREE.Vector3();
var _x = new THREE.Vector3(1, 0, 0);
var _m = new THREE.Matrix4();
function smoothstep(e0, e1, x) {
  const t = THREE.MathUtils.clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
}
function hash2(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 1831565813) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function waveOf(across) {
  return 0.045 * Math.sin(across * 7.5) + 0.02 * Math.sin(across * 16 + 0.6);
}
function coastAt(x, z) {
  const along = (x + z) / (2 * S);
  const across = (x - z) / (2 * S);
  return along - waveOf(across);
}
function xzFromAlongAcross(along, across) {
  return { x: (along + across) * S, z: (along - across) * S };
}
function pointAtCoast(coast, across) {
  return xzFromAlongAcross(coast + waveOf(across), across);
}
function harborMask(x, z) {
  const inX = smoothstep(-3.55, -3.1, x) * (1 - smoothstep(-0.85, -0.35, x));
  const inZ = smoothstep(2.35, 2.95, z) * (1 - smoothstep(4.55, 5.05, z));
  return inX * inZ;
}
function hillRaw(x, z) {
  const peak = xzFromAlongAcross(-0.62, -0.42);
  const dx = (x - peak.x) / 1.22;
  const dz = (z - peak.z) / 1.12;
  let h = Math.exp(-(dx * dx + dz * dz)) * 4.15;
  const shoulder = xzFromAlongAcross(-0.4, -0.12);
  const dx2 = (x - shoulder.x) / 1.15;
  const dz2 = (z - shoulder.z) / 1.05;
  h += Math.exp(-(dx2 * dx2 + dz2 * dz2) * 1.5) * 0.85;
  h *= 1 + 0.035 * Math.sin(x * 1.7 + 0.4) * Math.cos(z * 1.5);
  return Math.max(0, h);
}
function edgeFalloff(x, z) {
  return smoothstep(0.2, 1.1, Math.min(S - Math.abs(x), S - Math.abs(z)));
}
function hillAt(x, z) {
  return hillRaw(x, z) * edgeFalloff(x, z);
}
function landY(x, z) {
  const c = coastAt(x, z);
  let y = -0.045 * smoothstep(0.02, 0.3, c);
  if (c < 0.16) y = Math.max(y, hillAt(x, z));
  const h = harborMask(x, z);
  if (h > 1e-3 && c < 0.36) y = Math.min(y, -0.32 * h);
  return y;
}
function seabedY(x, z) {
  const c = coastAt(x, z);
  const t = smoothstep(0.24, 0.58, c);
  const n = Math.sin(x * 1.35 + z * 0.75) * 0.055 + Math.sin(x * 3.1 - z * 2.2) * 0.028;
  return THREE.MathUtils.lerp(-0.04, -1.42, t) + n * t;
}
function rimY(x, z) {
  const c = coastAt(x, z);
  if (c > 0.32) return Math.min(-0.06, seabedY(x, z));
  return Math.min(0.04, Math.max(landY(x, z), -0.02));
}
var STADIUM_ALONG = 0;
var STADIUM_ACROSS = 0.16;
function stadiumCenter() {
  return xzFromAlongAcross(STADIUM_ALONG, STADIUM_ACROSS);
}
function inStadium(x, z, pad = 1.12) {
  const c = stadiumCenter();
  const cos = Math.cos(-Math.PI / 4);
  const sin = Math.sin(-Math.PI / 4);
  const dx = x - c.x;
  const dz = z - c.z;
  const lx = dx * cos - dz * sin;
  const lz = dx * sin + dz * cos;
  return (lx / (1.9 * pad)) ** 2 + (lz / (1.38 * pad)) ** 2 < 1;
}
function track(bin, asset) {
  bin.add(asset);
  return asset;
}
function std(bin, color, roughness = 0.74, metalness = 0.04) {
  return track(bin, new THREE.MeshStandardMaterial({ color, roughness, metalness }));
}
function paintGround() {
  const N = 512;
  const canvas = document.createElement("canvas");
  canvas.width = N;
  canvas.height = N;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  const img = ctx.createImageData(N, N);
  const data = img.data;
  for (let y = 0; y < N; y++) {
    const z = -S + (y / (N - 1)) * 2 * S;
    for (let x = 0; x < N; x++) {
      const wx = -S + (x / (N - 1)) * 2 * S;
      const c = coastAt(wx, z);
      const hill = hillAt(wx, z);
      const hb = harborMask(wx, z);
      const n = hash2(x, y);
      const n2 = hash2(x * 0.37, y * 0.41);
      let r;
      let g;
      let b;
      if (hb > 0.55) {
        r = 168;
        g = 158;
        b = 138;
      } else if (hill > 0.42 && c < 0.05) {
        const moss = hash2(Math.floor(wx * 3.5), Math.floor(z * 3.5));
        r = 38 + n * 22 + moss * 18;
        g = 78 + n * 36 + moss * 28;
        b = 34 + n * 12;
      } else if (c > 0.02) {
        const wet = smoothstep(0.16, 0.42, c);
        const grain = n2 * 22;
        r = 226 + grain - wet * 46;
        g = 198 + n * 16 - wet * 38;
        b = 146 + n * 12 - wet * 28;
      } else if (c < 0.02 && hill < 0.28) {
        r = 72 + n * 28;
        g = 126 + n * 32;
        b = 54 + n * 14;
      } else {
        r = 74 + n * 36;
        g = 124 + n * 30;
        b = 52 + n * 14;
      }
      const i = (y * N + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const worldToPx = (x, z) => [((x + S) / (2 * S)) * (N - 1), ((z + S) / (2 * S)) * (N - 1)];
  const stroke = (pts, width, color, dash = []) => {
    if (pts.length < 2) return;
    ctx.save();
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.setLineDash(dash);
    ctx.beginPath();
    pts.forEach((p, i) => {
      const [px, py] = worldToPx(p.x, p.z);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
    ctx.restore();
  };
  const road = (pts, width) => {
    stroke(pts, width + 6, "#3e4744");
    stroke(pts, width, "#6a726e");
    stroke(pts, 2, "rgba(236,232,220,0.85)", [12, 14]);
  };
  const promenade = [];
  const avenue = [];
  const towerRoad = [];
  for (let i = 0; i <= 48; i++) {
    const t = i / 48;
    const across = -0.86 + t * 1.72;
    promenade.push(pointAtCoast(0.115, across));
    avenue.push(pointAtCoast(-0.01, -0.72 + t * 1.35));
    const along = -0.5 + t * 0.62;
    towerRoad.push(xzFromAlongAcross(along + waveOf(0.3), 0.3));
  }
  road(promenade, 15);
  road(avenue, 13);
  road(towerRoad, 12);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = false;
  tex.anisotropy = 8;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}
function paintStrata() {
  const w = 512;
  const h = 512;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  const img = ctx.createImageData(w, h);
  const data = img.data;
  for (let y = 0; y < h; y++) {
    const depth = y / (h - 1);
    for (let x = 0; x < w; x++) {
      const n = hash2(x, y);
      let r;
      let g;
      let b;
      if (depth < 0.055) {
        r = 62 + n * 24;
        g = 112 + n * 22;
        b = 46;
      } else if (depth < 0.11) {
        r = 112 + n * 18;
        g = 84 + n * 12;
        b = 52;
      } else {
        const warp = Math.sin(x * 0.018) * 0.04 + Math.sin(x * 0.061 + 1.7) * 0.012;
        const layer = Math.sin((1 - depth + warp) * 16.5 + Math.sin(x * 0.027) * 1.1);
        const band = layer * 0.5 + 0.5;
        const shade = 1 - depth * 0.28;
        const soil = depth < 0.42 ? 1 : 0.82;
        r = (168 + band * 48 + (n - 0.5) * 30) * shade * soil;
        g = (124 + band * 28 + (n - 0.5) * 20) * shade * soil;
        b = (78 + band * 16) * shade * (depth > 0.72 ? 0.9 : 1);
        if (n > 0.965) {
          r = 96 * shade;
          g = 92 * shade;
          b = 86 * shade;
        }
      }
      const i = (y * w + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.set(7, 1);
  tex.anisotropy = 8;
  return tex;
}
function paintFacade(wall) {
  const N = 256;
  const canvas = document.createElement("canvas");
  canvas.width = N;
  canvas.height = N;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, N, N);
  const cols = 4;
  const rows = 5;
  const cw = N / cols;
  const rh = N / rows;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const h = hash2(x + 3, y + wall.charCodeAt(1));
      ctx.fillStyle = h > 0.82 ? "#ffe1a8" : h > 0.38 ? "#7ea8bc" : "#35586c";
      const px = cw * 0.16;
      const py = rh * 0.18;
      ctx.fillRect(x * cw + px, y * rh + py, cw - px * 2, rh - py * 2);
    }
    ctx.fillStyle = "rgba(80,70,60,0.18)";
    ctx.fillRect(0, y * rh + rh - 3, N, 3);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}
function paintPitch() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 360;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  for (let i = 0; i < 9; i++) {
    ctx.fillStyle = i % 2 ? "#3c8a44" : "#47a050";
    ctx.fillRect(0, i * 40, 512, 40);
  }
  ctx.strokeStyle = "rgba(255,255,255,0.92)";
  ctx.lineWidth = 5;
  ctx.strokeRect(26, 20, 460, 320);
  ctx.beginPath();
  ctx.moveTo(256, 20);
  ctx.lineTo(256, 340);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(256, 180, 46, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeRect(26, 110, 78, 140);
  ctx.strokeRect(408, 110, 78, 140);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}
function buildGrid(samples, heightAt, include) {
  const stride = samples + 1;
  const positions = [];
  const uvs = [];
  for (let j = 0; j <= samples; j++) {
    for (let i = 0; i <= samples; i++) {
      const x = -S + (i / samples) * 2 * S;
      const z = -S + (j / samples) * 2 * S;
      positions.push(x, heightAt(x, z), z);
      uvs.push((x + S) / (2 * S), (z + S) / (2 * S));
    }
  }
  const indices = [];
  for (let j = 0; j < samples; j++) {
    for (let i = 0; i < samples; i++) {
      const cx = -S + ((i + 0.5) / samples) * 2 * S;
      const cz = -S + ((j + 0.5) / samples) * 2 * S;
      if (!include(cx, cz)) continue;
      const a = j * stride + i;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;
      indices.push(a, b, c, b, d, c);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const normals = geo.getAttribute("normal");
  let sum = 0;
  for (let i = 0; i < normals.count; i++) sum += normals.getY(i);
  if (sum < 0) {
    const idx = geo.getIndex();
    if (idx) {
      for (let i = 0; i < idx.count; i += 3) {
        const t = idx.getX(i + 1);
        idx.setX(i + 1, idx.getX(i + 2));
        idx.setX(i + 2, t);
      }
      geo.computeVertexNormals();
    }
  }
  return geo;
}
function buildCurtain(axis, sign, topAt = rimY) {
  const seg = 72;
  const ySeg = 18;
  const stride = seg + 1;
  const positions = [];
  const normals = [];
  const uvs = [];
  const nx = axis === "x" ? sign : 0;
  const nz = axis === "z" ? sign : 0;
  for (let iy = 0; iy <= ySeg; iy++) {
    const fy = iy / ySeg;
    for (let i = 0; i <= seg; i++) {
      const t = i / seg;
      const x = axis === "x" ? sign * S : -S + t * 2 * S;
      const z = axis === "z" ? sign * S : -S + t * 2 * S;
      const y = THREE.MathUtils.lerp(-T, topAt(x, z), fy);
      positions.push(x, y, z);
      normals.push(nx, 0, nz);
      uvs.push(t, fy);
    }
  }
  const indices = [];
  for (let iy = 0; iy < ySeg; iy++) {
    for (let i = 0; i < seg; i++) {
      const a = iy * stride + i;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
}
var COAST_GLSL =
  /* glsl */
  `
uniform float uS;
float coastOf(vec2 xz) {
  float along = (xz.x + xz.y) / (2.0 * uS);
  float across = (xz.x - xz.y) / (2.0 * uS);
  float wave = 0.045 * sin(across * 7.5) + 0.02 * sin(across * 16.0 + 0.6);
  return along - wave;
}
float harbourOf(vec2 xz) {
  float inX = smoothstep(-3.55, -3.1, xz.x) * (1.0 - smoothstep(-0.85, -0.35, xz.x));
  float inZ = smoothstep(2.35, 2.95, xz.y) * (1.0 - smoothstep(4.55, 5.05, xz.y));
  return inX * inZ;
}
float seabedOf(vec2 xz) {
  float c = coastOf(xz);
  float t = smoothstep(0.24, 0.58, c);
  float n = sin(xz.x * 1.35 + xz.y * 0.75) * 0.055 + sin(xz.x * 3.1 - xz.y * 2.2) * 0.028;
  return mix(-0.04, -1.42, t) + n * t;
}
`;
function makeWaterMaterial(mode) {
  const uniforms = {
    uTime: { value: 0 },
    uS: { value: S },
    uMode: { value: mode === "wall" ? 1 : mode === "harbour" ? 2 : 0 },
    uShallow: { value: new THREE.Color("#7ef0ea") },
    uDeep: { value: new THREE.Color("#08748c") },
    uSand: { value: new THREE.Color("#f3ddb4") },
    uFoam: { value: new THREE.Color("#f8fbff") },
  };
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: mode === "wall",
    side: THREE.DoubleSide,
    uniforms,
    vertexShader:
      /* glsl */
      `
      uniform float uTime;
      uniform float uMode;
      varying vec3 vWorld;
      varying vec3 vLocal;
      ${COAST_GLSL}
      void main() {
        vec3 p = position;
        float c = coastOf(p.xz);
        float amp = uMode == 1.0 ? 0.0 : smoothstep(0.2, 0.42, max(c, uMode == 2.0 ? 0.34 : 0.0));
        float w1 = sin(p.x * 1.35 + p.z * 0.42 + uTime * 1.25);
        float w2 = sin(-p.x * 0.52 + p.z * 1.7 - uTime * 0.86);
        p.y += amp * (w1 * 0.032 + w2 * 0.02);
        p.x += (1.0 - step(0.5, uMode)) * amp * w1 * 0.016;
        vec4 world = modelMatrix * vec4(p, 1.0);
        vWorld = world.xyz;
        vLocal = p;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader:
      /* glsl */
      `
      uniform float uTime;
      uniform float uMode;
      uniform vec3 uShallow;
      uniform vec3 uDeep;
      uniform vec3 uSand;
      uniform vec3 uFoam;
      varying vec3 vWorld;
      varying vec3 vLocal;
      ${COAST_GLSL}
      void main() {
        float c = coastOf(vLocal.xz);
        float hb = harbourOf(vLocal.xz);
        vec3 col;
        float alpha;
        if (uMode > 0.5 && uMode < 1.5) {
          float bed = seabedOf(vLocal.xz);
          if (c < 0.30 || vLocal.y < bed + 0.02 || vLocal.y > 0.09) discard;
          float h = clamp((vLocal.y - bed) / max(0.06 - bed, 0.25), 0.0, 1.0);
          float depth = smoothstep(0.30, 0.72, c);
          vec3 sand = uSand * (0.95 + 0.05 * sin(vLocal.x * 9.0 + vLocal.z * 4.0));
          vec3 body = mix(vec3(0.35, 0.82, 0.84), uDeep, depth);
          col = mix(sand, body, smoothstep(0.0, 0.55, h));
          float bands = sin(c * 36.0 - vLocal.y * 8.0 + uTime * 1.35);
          float crest = smoothstep(0.78, 0.98, bands) * smoothstep(0.25, 0.9, h);
          col = mix(col, uFoam, crest * 0.8);
          alpha = 0.96;
        } else if (uMode > 1.5) {
          if (hb < 0.45) discard;
          col = mix(uShallow, uDeep, 0.35);
          float w = sin(vLocal.x * 6.0 + uTime * 1.4) * sin(vLocal.z * 5.0 - uTime);
          col += vec3(0.08) * w;
          alpha = 0.9;
        } else {
          if (c < 0.36) discard;
          float depthT = smoothstep(0.36, 0.78, c);
          float rip = sin(vLocal.x * 7.2 + vLocal.z * 2.2 + uTime * 0.55) * sin(vLocal.z * 6.0 - vLocal.x * 1.6);
          vec3 sand = uSand * (0.9 + 0.1 * rip);
          vec3 water = mix(vec3(0.02, 0.72, 0.78), uDeep, depthT);
          col = mix(sand, water, mix(0.74, 0.92, depthT));
          float cau = pow(max(sin(vLocal.x * 5.4 + uTime) * sin(vLocal.z * 4.6 - uTime * 0.8), 0.0), 2.0);
          col += cau * (1.0 - depthT) * 0.1;
          float shoreDist = c - 0.36;
          float wobble = 0.012 * sin(vLocal.x * 6.0 + vLocal.z * 4.0 + uTime * 0.8);
          float foam = smoothstep(0.02, 0.0, abs(shoreDist - 0.015 + wobble));
          foam += smoothstep(0.018, 0.0, abs(shoreDist - 0.07 + wobble)) * 0.8;
          foam += smoothstep(0.016, 0.0, abs(shoreDist - 0.14 + wobble)) * 0.55;
          foam *= 0.72 + 0.28 * sin(vLocal.x * 4.5 - vLocal.z * 2.0 - uTime);
          float shore = smoothstep(0.03, 0.0, shoreDist);
          col = mix(col, uFoam, clamp(foam + shore * 0.35, 0.0, 1.0));
          vec3 n = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
          if (n.y < 0.0) n = -n;
          vec3 viewDir = normalize(cameraPosition - vWorld);
          vec3 sun = normalize(vec3(-0.25, 0.86, 0.45));
          float spec = pow(max(dot(n, normalize(sun + viewDir)), 0.0), 70.0);
          col += spec * vec3(1.0, 0.98, 0.94);
          alpha = mix(0.8, 0.93, depthT);
          alpha = mix(alpha, 0.97, shore);
        }
        gl_FragColor = vec4(col, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  return mat;
}
function makeFoamMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 } },
    vertexShader:
      /* glsl */
      `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader:
      /* glsl */
      `
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        float edge = smoothstep(0.5, 0.08, abs(vUv.x - 0.5));
        float crest = 0.35 + 0.65 * smoothstep(0.15, 0.9, 0.5 + 0.5 * sin(vUv.y * 18.0 - uTime * 2.1));
        float alpha = edge * crest * 0.78;
        if (alpha < 0.03) discard;
        gl_FragColor = vec4(0.96, 0.99, 1.0, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
}
function ribbon(pts, width) {
  const positions = [];
  const uvs = [];
  const indices = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const nxt = pts[Math.min(pts.length - 1, i + 1)];
    const prv = pts[Math.max(0, i - 1)];
    _tan.subVectors(nxt, prv);
    if (_tan.lengthSq() < 1e-6) _tan.set(1, 0, 0);
    _tan.normalize();
    const sx = -_tan.z * width * 0.5;
    const sz = _tan.x * width * 0.5;
    positions.push(p.x + sx, p.y, p.z + sz, p.x - sx, p.y, p.z - sz);
    const v = i / Math.max(1, pts.length - 1);
    uvs.push(0, v * 6, 1, v * 6);
  }
  for (let i = 0; i < pts.length - 1; i++) {
    const o = i * 2;
    indices.push(o, o + 1, o + 2, o + 1, o + 3, o + 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
}
function shoreLine(coast, y) {
  const pts = [];
  for (let i = 0; i <= 56; i++) {
    const across = -0.92 + (i / 56) * 1.84;
    const p = pointAtCoast(coast, across);
    if (Math.abs(p.x) > S - 0.08 || Math.abs(p.z) > S - 0.08) {
      if (pts.length) break;
      continue;
    }
    pts.push(new THREE.Vector3(p.x, y, p.z));
  }
  return pts;
}
function paintColor(geo, color) {
  const count = geo.getAttribute("position").count;
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    arr[i * 3] = color.r;
    arr[i * 3 + 1] = color.g;
    arr[i * 3 + 2] = color.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(arr, 3));
}
function makePalm() {
  const parts = [];
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.015, 0.14, 0.01),
    new THREE.Vector3(0.04, 0.28, 0.012),
    new THREE.Vector3(0.07, 0.42, 0),
  ]);
  const trunk = new THREE.TubeGeometry(curve, 7, 0.016, 5, false);
  paintColor(trunk, new THREE.Color("#6b4a30"));
  parts.push(trunk);
  const leaf = new THREE.Shape();
  leaf.moveTo(0, 0);
  leaf.quadraticCurveTo(0.05, 0.12, 0.012, 0.3);
  leaf.quadraticCurveTo(0, 0.33, -0.012, 0.3);
  leaf.quadraticCurveTo(-0.045, 0.12, 0, 0);
  for (let i = 0; i < 7; i++) {
    const geo = new THREE.ShapeGeometry(leaf);
    paintColor(geo, new THREE.Color(i % 2 ? "#2c7438" : "#3f8f46"));
    geo.rotateX(Math.PI / 2.2);
    geo.translate(0, 0.42, 0);
    geo.rotateY((i / 7) * Math.PI * 2);
    parts.push(geo);
  }
  const merged = mergeGeometries(parts, false);
  parts.forEach((g) => g.dispose());
  merged?.computeVertexNormals();
  return merged;
}
function createCoastalDiorama(quality) {
  const mobile = typeof matchMedia === "function" && matchMedia("(max-width: 800px)").matches;
  const resolved = {
    segs: quality?.segs ?? (mobile ? 72 : 96),
    trees: quality?.trees ?? (mobile ? 180 : 280),
    people: quality?.people ?? (mobile ? 70 : 120),
  };
  const bin = /* @__PURE__ */ new Set();
  const root = new THREE.Group();
  root.userData.citylitDiorama = true;
  const waters = [];
  const foams = [];
  const groundMap = track(bin, paintGround());
  const strataMap = track(bin, paintStrata());
  const land = new THREE.Mesh(
    track(
      bin,
      buildGrid(resolved.segs, landY, (x, z) => coastAt(x, z) < 0.42 || harborMask(x, z) > 0.08),
    ),
    track(bin, new THREE.MeshStandardMaterial({ map: groundMap, roughness: 0.92, metalness: 0 })),
  );
  land.receiveShadow = true;
  land.castShadow = true;
  land.name = "land";
  root.add(land);
  const seabed = new THREE.Mesh(
    track(
      bin,
      buildGrid(Math.max(40, resolved.segs - 24), seabedY, (x, z) => coastAt(x, z) > 0.28),
    ),
    track(bin, new THREE.MeshStandardMaterial({ color: "#e7d3a4", roughness: 0.94 })),
  );
  seabed.receiveShadow = true;
  seabed.name = "seabed";
  root.add(seabed);
  const strataMat = track(
    bin,
    new THREE.MeshStandardMaterial({ map: strataMap, roughness: 0.94, metalness: 0 }),
  );
  ["x", "z"].forEach((axis) => {
    [1, -1].forEach((sign) => {
      const wall = new THREE.Mesh(track(bin, buildCurtain(axis, sign)), strataMat);
      wall.castShadow = true;
      wall.receiveShadow = true;
      root.add(wall);
    });
  });
  const sea = new THREE.Mesh(
    track(
      bin,
      buildGrid(
        resolved.segs,
        () => 0.035,
        (x, z) => coastAt(x, z) > 0.32,
      ),
    ),
    makeWaterMaterial("sea"),
  );
  sea.renderOrder = 2;
  root.add(sea);
  waters.push(sea.material);
  ["x", "z"].forEach((axis) => {
    const wall = new THREE.Mesh(
      track(
        bin,
        buildCurtain(axis, 1, () => 0.045),
      ),
      makeWaterMaterial("wall"),
    );
    wall.position[axis] += 0.02;
    wall.renderOrder = 3;
    root.add(wall);
    waters.push(wall.material);
  });
  const harbour = new THREE.Mesh(
    track(
      bin,
      buildGrid(
        40,
        () => -0.055,
        (x, z) => harborMask(x, z) > 0.35,
      ),
    ),
    makeWaterMaterial("harbour"),
  );
  harbour.renderOrder = 2;
  root.add(harbour);
  waters.push(harbour.material);
  [0.4, 0.48, 0.58].forEach((coast, i) => {
    const pts = shoreLine(coast, 0.055 + i * 4e-3);
    if (pts.length < 4) return;
    const mat = makeFoamMaterial();
    foams.push(mat);
    const mesh = new THREE.Mesh(track(bin, ribbon(pts, 0.16 + i * 0.05)), mat);
    mesh.renderOrder = 4;
    root.add(mesh);
  });
  addStadium(root, bin);
  addBuildings(root, bin);
  addVegetation(root, bin, resolved);
  addBeachLife(root, bin, resolved);
  addHarbour(root, bin);
  addClouds(root, bin);
  const cars = addCars(root, bin);
  const kayaks = addKayaks(root, bin);
  root.userData.tick = (time) => {
    waters.forEach((m) => {
      m.uniforms.uTime.value = time;
    });
    foams.forEach((m) => {
      m.uniforms.uTime.value = time;
    });
    cars.tick(time);
    kayaks.tick(time);
  };
  root.userData.disposeAssets = () => {
    bin.forEach((asset) => asset.dispose());
  };
  return root;
}
function addStadium(root, bin) {
  const center = stadiumCenter();
  const g = new THREE.Group();
  g.position.set(center.x, Math.max(0, landY(center.x, center.z)), center.z);
  g.rotation.y = Math.PI / 4;
  root.add(g);
  const white = std(bin, "#f7f5f1", 0.48, 0.06);
  const seat = std(bin, "#e8e2d6", 0.78, 0.02);
  const dark = std(bin, "#d8d3c8", 0.8, 0.04);
  const profile = [
    [0.58, 0.04],
    [0.74, 0.16],
    [0.94, 0.32],
    [1.1, 0.46],
    [1.18, 0.46],
    [1.22, 0.06],
    [1.22, 0],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const bowl = new THREE.Mesh(track(bin, new THREE.LatheGeometry(profile, 72)), seat);
  bowl.scale.set(1.42, 1, 1.06);
  bowl.castShadow = true;
  bowl.receiveShadow = true;
  g.add(bowl);
  const skirt = new THREE.Mesh(
    track(bin, new THREE.CylinderGeometry(1.2, 1.26, 0.16, 48, 1, true)),
    dark,
  );
  skirt.scale.set(1.42, 1, 1.06);
  skirt.position.y = 0.08;
  skirt.castShadow = true;
  g.add(skirt);
  const roof = new THREE.Mesh(track(bin, new THREE.TorusGeometry(1.05, 0.11, 8, 72)), white);
  roof.rotation.x = Math.PI / 2;
  roof.scale.set(1.55, 1.12, 0.22);
  roof.position.y = 0.5;
  roof.name = "moses-mabhida-radial-roof";
  roof.geometry.name = "MosesMabhidaRoofMembrane";
  roof.castShadow = true;
  roof.receiveShadow = true;
  g.add(roof);
  const ribs = new THREE.InstancedMesh(
    track(bin, new THREE.BoxGeometry(0.05, 0.035, 0.42)),
    white,
    28,
  );
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    _quat.setFromAxisAngle(_up, -a);
    _pos.set(Math.cos(a) * 1.28, 0.52, Math.sin(a) * 0.92);
    _scl.set(1, 1, 1);
    _m.compose(_pos, _quat, _scl);
    ribs.setMatrixAt(i, _m);
  }
  ribs.instanceMatrix.needsUpdate = true;
  ribs.castShadow = true;
  g.add(ribs);
  const pitchMap = track(bin, paintPitch());
  const pitch = new THREE.Mesh(
    track(bin, new THREE.CircleGeometry(1, 40)),
    track(bin, new THREE.MeshStandardMaterial({ map: pitchMap, roughness: 0.9 })),
  );
  pitch.rotation.x = -Math.PI / 2;
  pitch.scale.set(0.78, 0.56, 1);
  pitch.position.y = 0.055;
  pitch.receiveShadow = true;
  g.add(pitch);
  const archCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.15, 0.02, 0.05),
    new THREE.Vector3(-1.55, 0.85, 0.02),
    new THREE.Vector3(-0.7, 1.85, 0),
    new THREE.Vector3(0.15, 2.45, -0.02),
    new THREE.Vector3(1.05, 1.7, 0),
    new THREE.Vector3(1.75, 0.55, 0.03),
    new THREE.Vector3(2.05, 0.02, 0.06),
  ]);
  const arch = new THREE.Mesh(
    track(bin, new THREE.TubeGeometry(archCurve, 96, 0.042, 10, false)),
    std(bin, "#fbfaf7", 0.32, 0.12),
  );
  arch.name = "moses-mabhida-single-signature-arch";
  g.add(arch);
}
function addBuildings(root, bin) {
  const rand = mulberry32(11);
  const walls = ["#f3eee4", "#e7dccc", "#ded3c4", "#f7f3ea", "#e8cfc0", "#d9cec0"];
  const blocks = [];
  const push = (b) => {
    if (Math.abs(b.x) > S - 0.3 || Math.abs(b.z) > S - 0.3) return;
    if (coastAt(b.x, b.z) > 0.06 || hillAt(b.x, b.z) > 0.22 || harborMask(b.x, b.z) > 0.2) return;
    if (inStadium(b.x, b.z)) return;
    if (blocks.some((o) => Math.hypot(o.x - b.x, o.z - b.z) < (o.w + b.w) * 0.55)) return;
    blocks.push(b);
  };
  const yaw = Math.PI / 4;
  push({ ...pointAtCoast(-0.02, 0.4), w: 0.46, h: 2.05, d: 0.4, yaw, wall: "#efe6d8" });
  push({ ...pointAtCoast(-0.1, 0.52), w: 0.4, h: 1.72, d: 0.38, yaw, wall: "#e5d9c8" });
  for (let i = 0; i < 8; i++) {
    const p = pointAtCoast(0, -0.58 + i * 0.12);
    push({
      x: p.x,
      z: p.z,
      w: 0.22,
      h: 0.16 + (i % 3) * 0.04,
      d: 0.18,
      yaw,
      wall: i % 2 ? "#f6f1e8" : "#f0e0d4",
    });
  }
  for (let i = 0; i < 180 && blocks.length < 40; i++) {
    const across = -0.7 + rand() * 1.25;
    const along = -0.55 + rand() * 0.5;
    const p = xzFromAlongAcross(along + waveOf(across), across);
    const tall = rand() > 0.82;
    push({
      x: p.x,
      z: p.z,
      w: 0.28 + rand() * 0.38,
      h: tall ? 0.9 + rand() * 0.7 : 0.32 + rand() * 0.55,
      d: 0.26 + rand() * 0.34,
      yaw: yaw + (rand() < 0.2 ? Math.PI / 2 : 0),
      wall: walls[Math.floor(rand() * walls.length)],
    });
  }
  const box = track(bin, new THREE.BoxGeometry(1, 1, 1));
  const bases = /* @__PURE__ */ new Map();
  const capMat = track(bin, new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.8 }));
  const caps = new THREE.InstancedMesh(box, capMat, blocks.length * 2);
  caps.castShadow = true;
  caps.receiveShadow = true;
  blocks.forEach((b, i) => {
    let base = bases.get(b.wall);
    if (!base) {
      base = track(bin, paintFacade(b.wall));
      bases.set(b.wall, base);
    }
    const map = track(bin, base.clone());
    map.repeat.set(Math.max(0.45, b.w), Math.max(0.35, b.h));
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 8;
    const mat = track(
      bin,
      new THREE.MeshStandardMaterial({ map, color: "#ffffff", roughness: 0.8, metalness: 0.03 }),
    );
    const mesh = new THREE.Mesh(box, mat);
    const y = Math.max(0, landY(b.x, b.z));
    mesh.scale.set(b.w, b.h, b.d);
    mesh.position.set(b.x, y + b.h / 2, b.z);
    mesh.rotation.y = b.yaw;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
    _quat.setFromAxisAngle(_up, b.yaw);
    _pos.set(b.x, y + b.h + 0.02, b.z);
    _scl.set(b.w + 0.03, 0.045, b.d + 0.03);
    _m.compose(_pos, _quat, _scl);
    caps.setMatrixAt(i * 2, _m);
    caps.setColorAt(i * 2, new THREE.Color(b.wall).multiplyScalar(0.9));
    _pos.set(b.x, y + 0.03, b.z);
    _scl.set(b.w + 0.02, 0.06, b.d + 0.02);
    _m.compose(_pos, _quat, _scl);
    caps.setMatrixAt(i * 2 + 1, _m);
    caps.setColorAt(i * 2 + 1, new THREE.Color("#c9bfb2"));
  });
  caps.instanceMatrix.needsUpdate = true;
  if (caps.instanceColor) caps.instanceColor.needsUpdate = true;
  root.add(caps);
  const houses = [];
  const hr = mulberry32(19);
  const roofs = ["#c45a38", "#a84832", "#d07a48", "#b85a3c"];
  const houseWalls = ["#f7f3ec", "#f1e6d4", "#efeae2", "#e7d8c6"];
  for (let i = 0; i < 500 && houses.length < 46; i++) {
    const x = -S + hr() * S * 1.3;
    const z = -S + hr() * S * 1.15;
    const h = hillAt(x, z);
    const slope =
      Math.abs(hillAt(x + 0.14, z) - hillAt(x - 0.14, z)) +
      Math.abs(hillAt(x, z + 0.14) - hillAt(x, z - 0.14));
    if (h < 0.38 || h > 2.45 || slope > 0.72 || coastAt(x, z) > 0.02) continue;
    if (houses.some((o) => Math.hypot(o.x - x, o.z - z) < 0.34)) continue;
    houses.push({
      x,
      z,
      w: 0.14 + hr() * 0.12,
      h: 0.1 + hr() * 0.08,
      d: 0.12 + hr() * 0.1,
      yaw: hr() * Math.PI * 2,
      wall: houseWalls[houses.length % houseWalls.length],
    });
  }
  if (!houses.length) return;
  const wallMesh = new THREE.InstancedMesh(box, std(bin, "#ffffff", 0.86), houses.length);
  const roofGeo = track(bin, new THREE.CylinderGeometry(0, 0.72, 0.45, 4));
  roofGeo.rotateY(Math.PI / 4);
  const roofMesh = new THREE.InstancedMesh(roofGeo, std(bin, "#ffffff", 0.8), houses.length);
  wallMesh.castShadow = roofMesh.castShadow = true;
  wallMesh.receiveShadow = roofMesh.receiveShadow = true;
  houses.forEach((house, i) => {
    const y = hillAt(house.x, house.z);
    _quat.setFromAxisAngle(_up, house.yaw);
    _pos.set(house.x, y + house.h / 2, house.z);
    _scl.set(house.w, house.h, house.d);
    _m.compose(_pos, _quat, _scl);
    wallMesh.setMatrixAt(i, _m);
    wallMesh.setColorAt(i, new THREE.Color(house.wall));
    _pos.y = y + house.h + 0.045;
    _scl.set(house.w * 0.85, 0.16, house.d * 0.85);
    _m.compose(_pos, _quat, _scl);
    roofMesh.setMatrixAt(i, _m);
    roofMesh.setColorAt(i, new THREE.Color(roofs[i % roofs.length]));
  });
  wallMesh.instanceMatrix.needsUpdate = true;
  roofMesh.instanceMatrix.needsUpdate = true;
  if (wallMesh.instanceColor) wallMesh.instanceColor.needsUpdate = true;
  if (roofMesh.instanceColor) roofMesh.instanceColor.needsUpdate = true;
  root.add(wallMesh, roofMesh);
}
function addVegetation(root, bin, quality) {
  const rand = mulberry32(4);
  const canopyGeo = track(bin, new THREE.IcosahedronGeometry(0.18, 1));
  const pos = canopyGeo.getAttribute("position");
  for (let i = 0; i < pos.count; i++) {
    const n = 1 + 0.2 * Math.sin(pos.getX(i) * 11 + pos.getY(i) * 7) * Math.cos(pos.getZ(i) * 9);
    pos.setXYZ(i, pos.getX(i) * n, pos.getY(i) * n * 0.82, pos.getZ(i) * n);
  }
  canopyGeo.computeVertexNormals();
  const greens = ["#2c6430", "#3c7a38", "#4c8c3c", "#68a048", "#234f28"].map(
    (c) => new THREE.Color(c),
  );
  const spots = [];
  for (let i = 0; i < quality.trees * 14 && spots.length < quality.trees; i++) {
    const x = (rand() * 2 - 1) * S;
    const z = (rand() * 2 - 1) * S;
    const y = hillAt(x, z);
    if (coastAt(x, z) > -0.02 || harborMask(x, z) > 0.12 || inStadium(x, z, 1.35)) continue;
    if (y < 0.2 && rand() > 0.28) continue;
    spots.push({ x, z, y, s: 0.34 + rand() * 0.55, color: Math.floor(rand() * greens.length) });
  }
  if (!spots.length) return;
  const canopy = new THREE.InstancedMesh(
    canopyGeo,
    track(bin, new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.9 })),
    spots.length,
  );
  const trunk = new THREE.InstancedMesh(
    track(bin, new THREE.CylinderGeometry(0.02, 0.028, 0.16, 5)),
    std(bin, "#5a4030", 0.9),
    spots.length,
  );
  canopy.castShadow = false;
  trunk.castShadow = false;
  canopy.receiveShadow = true;
  spots.forEach((s, i) => {
    _quat.setFromAxisAngle(_up, rand() * 6);
    _pos.set(s.x, s.y + 0.12 * s.s, s.z);
    _scl.set(s.s, s.s * 0.82, s.s);
    _m.compose(_pos, _quat, _scl);
    canopy.setMatrixAt(i, _m);
    canopy.setColorAt(i, greens[s.color]);
    _pos.set(s.x, s.y + 0.06 * s.s, s.z);
    _scl.set(s.s, s.s, s.s);
    _m.compose(_pos, _quat, _scl);
    trunk.setMatrixAt(i, _m);
  });
  canopy.instanceMatrix.needsUpdate = true;
  trunk.instanceMatrix.needsUpdate = true;
  if (canopy.instanceColor) canopy.instanceColor.needsUpdate = true;
  root.add(canopy, trunk);
  const palmGeo = makePalm();
  if (!palmGeo) return;
  track(bin, palmGeo);
  const palms = [];
  for (let i = 0; i < 30; i++) {
    const across = -0.82 + (i / 29) * 1.64;
    const p = pointAtCoast(0.1, across);
    if (Math.abs(p.x) > S - 0.2 || Math.abs(p.z) > S - 0.2) continue;
    if (harborMask(p.x, p.z) > 0.2) continue;
    palms.push({ x: p.x, z: p.z, y: landY(p.x, p.z), s: 0.85 + rand() * 0.35, yaw: rand() * 6 });
  }
  if (!palms.length) return;
  const palmMesh = new THREE.InstancedMesh(
    palmGeo,
    track(bin, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82 })),
    palms.length,
  );
  palmMesh.castShadow = false;
  palms.forEach((p, i) => {
    _quat.setFromAxisAngle(_up, p.yaw);
    _pos.set(p.x, p.y, p.z);
    _scl.setScalar(p.s);
    _m.compose(_pos, _quat, _scl);
    palmMesh.setMatrixAt(i, _m);
  });
  palmMesh.instanceMatrix.needsUpdate = true;
  root.add(palmMesh);
}
function addBeachLife(root, bin, quality) {
  const rand = mulberry32(8);
  const people = [];
  const cloth = [
    "#e23d3d",
    "#f2c14e",
    "#ffffff",
    "#2f6fed",
    "#1d1d1d",
    "#e4578a",
    "#f08a24",
    "#20324a",
  ];
  for (let i = 0; i < quality.people * 8 && people.length < quality.people; i++) {
    const across = -0.8 + rand() * 1.6;
    const coast = 0.16 + rand() * 0.12;
    const p = pointAtCoast(coast, across);
    if (Math.abs(p.x) > S - 0.15 || Math.abs(p.z) > S - 0.15) continue;
    if (harborMask(p.x, p.z) > 0.1) continue;
    people.push({ x: p.x, z: p.z, y: landY(p.x, p.z), color: cloth[people.length % cloth.length] });
  }
  if (people.length) {
    const body = new THREE.InstancedMesh(
      track(bin, new THREE.CapsuleGeometry(0.028, 0.05, 2, 6)),
      std(bin, "#ffffff", 0.7),
      people.length,
    );
    body.castShadow = false;
    people.forEach((p, i) => {
      _quat.identity();
      _pos.set(p.x, p.y + 0.034, p.z);
      _scl.set(1, 0.85 + (i % 5) * 0.05, 1);
      _m.compose(_pos, _quat, _scl);
      body.setMatrixAt(i, _m);
      body.setColorAt(i, new THREE.Color(p.color));
    });
    body.instanceMatrix.needsUpdate = true;
    if (body.instanceColor) body.instanceColor.needsUpdate = true;
    root.add(body);
  }
  const umbrellas = [];
  const shades = ["#e23d3d", "#f2c14e", "#ffffff", "#2a6fdb", "#f4f4f4", "#1c1c1c"];
  for (let i = 0; i < 36; i++) {
    const p = pointAtCoast(0.18 + (i % 3) * 0.025, -0.75 + (i / 35) * 1.5);
    if (Math.abs(p.x) > S - 0.2 || Math.abs(p.z) > S - 0.2) continue;
    umbrellas.push({
      x: p.x,
      z: p.z,
      y: landY(p.x, p.z),
      color: shades[i % shades.length],
      yaw: rand() * Math.PI,
    });
  }
  if (umbrellas.length) {
    const cone = track(bin, new THREE.ConeGeometry(0.09, 0.04, 8));
    cone.translate(0, 0.014, 0);
    const canopies = new THREE.InstancedMesh(cone, std(bin, "#ffffff", 0.55), umbrellas.length);
    const poles = new THREE.InstancedMesh(
      track(bin, new THREE.CylinderGeometry(4e-3, 4e-3, 0.07, 4)),
      std(bin, "#f2f2f2", 0.5),
      umbrellas.length,
    );
    canopies.castShadow = poles.castShadow = true;
    umbrellas.forEach((u, i) => {
      _quat.setFromAxisAngle(_up, u.yaw);
      _pos.set(u.x, u.y + 0.11, u.z);
      _scl.set(1, 1, 1);
      _m.compose(_pos, _quat, _scl);
      canopies.setMatrixAt(i, _m);
      canopies.setColorAt(i, new THREE.Color(u.color));
      _pos.set(u.x, u.y + 0.035, u.z);
      _m.compose(_pos, _quat, _scl);
      poles.setMatrixAt(i, _m);
    });
    canopies.instanceMatrix.needsUpdate = true;
    poles.instanceMatrix.needsUpdate = true;
    if (canopies.instanceColor) canopies.instanceColor.needsUpdate = true;
    root.add(canopies, poles);
  }
  const pier = (across, length) => {
    const a = pointAtCoast(0.28, across);
    const b = pointAtCoast(0.28 + length, across);
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len = Math.hypot(dx, dz);
    const deck = new THREE.Mesh(
      track(bin, new THREE.BoxGeometry(len, 0.03, 0.12)),
      std(bin, "#e4d2b4", 0.72),
    );
    deck.position.set((a.x + b.x) / 2, 0.06, (a.z + b.z) / 2);
    deck.rotation.y = Math.atan2(dz, dx);
    deck.castShadow = true;
    root.add(deck);
    const wood = std(bin, "#b08968", 0.86);
    for (let i = 0; i <= 5; i++) {
      const t = i / 5;
      const x = a.x + dx * t;
      const z = a.z + dz * t;
      const pile = new THREE.Mesh(
        track(bin, new THREE.CylinderGeometry(0.012, 0.012, 0.55, 6)),
        wood,
      );
      pile.position.set(x, -0.2, z);
      root.add(pile);
    }
    if (length > 0.28) {
      const hut = new THREE.Mesh(
        track(bin, new THREE.BoxGeometry(0.12, 0.08, 0.1)),
        std(bin, "#f7f4ef", 0.6),
      );
      hut.position.set(b.x, 0.1, b.z);
      hut.castShadow = true;
      root.add(hut);
      const roof = new THREE.Mesh(
        track(bin, new THREE.ConeGeometry(0.09, 0.06, 4)),
        std(bin, "#d16448", 0.7),
      );
      roof.position.set(b.x, 0.17, b.z);
      roof.rotation.y = Math.PI / 4;
      root.add(roof);
    }
  };
  pier(0.12, 0.16);
  pier(-0.22, 0.1);
}
function addHarbour(root, bin) {
  const wood = std(bin, "#c7ad88", 0.78);
  const quay = new THREE.Mesh(
    track(bin, new THREE.BoxGeometry(0.16, 0.1, 2.5)),
    std(bin, "#d9d3c8", 0.84),
  );
  quay.position.set(-3.28, 0.02, 3.75);
  quay.castShadow = true;
  quay.receiveShadow = true;
  root.add(quay);
  for (let i = 0; i < 4; i++) {
    const dock = new THREE.Mesh(track(bin, new THREE.BoxGeometry(0.55, 0.03, 0.07)), wood);
    dock.position.set(-2.85, -0.02, 3.15 + i * 0.42);
    dock.castShadow = true;
    root.add(dock);
  }
  const hullMat = std(bin, "#8d3a34", 0.62, 0.08);
  const hull = new THREE.Mesh(track(bin, new THREE.BoxGeometry(0.28, 0.12, 0.85)), hullMat);
  hull.position.set(-2.15, -0.06, 3.85);
  hull.castShadow = true;
  root.add(hull);
  const cabin = new THREE.Mesh(
    track(bin, new THREE.BoxGeometry(0.16, 0.12, 0.2)),
    std(bin, "#f4f1ea", 0.55),
  );
  cabin.position.set(-2.15, 0.05, 4.12);
  cabin.castShadow = true;
  root.add(cabin);
  const colors = ["#d4533c", "#2f6f4e", "#e2b143", "#2a5f99", "#c9842a"];
  colors.forEach((color, i) => {
    const box = new THREE.Mesh(
      track(bin, new THREE.BoxGeometry(0.16, 0.08, 0.12)),
      std(bin, color, 0.55, 0.08),
    );
    box.position.set(-2.15, 0.04, 3.55 + i * 0.13);
    box.castShadow = true;
    root.add(box);
  });
  const sailHull = new THREE.Mesh(
    track(bin, new THREE.BoxGeometry(0.1, 0.05, 0.32)),
    std(bin, "#f7f4ee", 0.5),
  );
  sailHull.position.set(-1.55, -0.03, 3.25);
  root.add(sailHull);
  const sail = new THREE.Mesh(
    track(bin, new THREE.ConeGeometry(0.07, 0.28, 4)),
    std(bin, "#fbfbfb", 0.45),
  );
  sail.position.set(-1.55, 0.14, 3.25);
  root.add(sail);
  const craneMat = std(bin, "#e2b143", 0.5, 0.15);
  [3.45, 4.35].forEach((z) => {
    const mast = new THREE.Mesh(track(bin, new THREE.BoxGeometry(0.04, 0.72, 0.04)), craneMat);
    mast.position.set(-3.55, 0.36, z);
    mast.castShadow = true;
    root.add(mast);
    const jib = new THREE.Mesh(track(bin, new THREE.BoxGeometry(0.7, 0.03, 0.03)), craneMat);
    jib.position.set(-3.25, 0.7, z);
    jib.castShadow = true;
    root.add(jib);
  });
  const poolMat = track(
    bin,
    new THREE.MeshStandardMaterial({ color: "#19b4c8", roughness: 0.16, metalness: 0.12 }),
  );
  [
    [-1.2, 1.2, 0.32, 0.2],
    [-0.55, 0.85, 0.16, 0.16],
    [-1.55, 0.72, 0.14, 0.18],
  ].forEach(([x, z, sx, sz]) => {
    const pool = new THREE.Mesh(track(bin, new THREE.CircleGeometry(1, 28)), poolMat);
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(x, 0.03, z);
    pool.scale.set(sx, sz, 1);
    pool.receiveShadow = true;
    root.add(pool);
  });
  const slide = new THREE.Mesh(
    track(
      bin,
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(-1.2, 0.04, 1.42),
          new THREE.Vector3(-1.18, 0.2, 1.62),
          new THREE.Vector3(-1.05, 0.34, 1.78),
        ]),
        12,
        0.025,
        6,
        false,
      ),
    ),
    std(bin, "#f0c53a", 0.45, 0.1),
  );
  slide.castShadow = true;
  root.add(slide);
  const rocks = new THREE.InstancedMesh(
    track(bin, new THREE.DodecahedronGeometry(0.05, 0)),
    std(bin, "#ffffff", 1),
    28,
  );
  const rr = mulberry32(21);
  for (let i = 0; i < 28; i++) {
    const underwater = i < 12;
    const p = underwater
      ? pointAtCoast(0.5 + rr() * 0.35, -0.45 + rr() * 0.9)
      : pointAtCoast(0.26 + rr() * 0.05, -0.7 + rr() * 1.4);
    const y = underwater ? seabedY(p.x, p.z) + 0.03 : landY(p.x, p.z) + 0.02;
    const s = 0.5 + rr() * 1.1;
    _quat.setFromEuler(new THREE.Euler(rr(), rr(), rr()));
    _pos.set(p.x, y, p.z);
    _scl.set(s, s * 0.6, s);
    _m.compose(_pos, _quat, _scl);
    rocks.setMatrixAt(i, _m);
    rocks.setColorAt(i, new THREE.Color(underwater ? "#cbb892" : "#b7a48a"));
  }
  rocks.instanceMatrix.needsUpdate = true;
  if (rocks.instanceColor) rocks.instanceColor.needsUpdate = true;
  rocks.castShadow = true;
  root.add(rocks);
}
function addClouds(root, bin) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const grd = ctx.createRadialGradient(128, 128, 16, 128, 128, 124);
  grd.addColorStop(0, "rgba(255,255,255,0.95)");
  grd.addColorStop(0.45, "rgba(255,255,255,0.55)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 256, 256);
  const map = track(bin, new THREE.CanvasTexture(canvas));
  map.colorSpace = THREE.SRGBColorSpace;
  const mat = track(
    bin,
    new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, color: "#ffffff" }),
  );
  const plane = track(bin, new THREE.PlaneGeometry(1, 1));
  const peak = xzFromAlongAcross(-0.62, -0.08);
  const puff = (x, y, z, scale, seed) => {
    const rand = mulberry32(seed);
    for (let i = 0; i < 5; i++) {
      const p = new THREE.Mesh(plane, mat);
      p.position.set(
        x + (rand() - 0.5) * scale,
        y + (rand() - 0.5) * scale * 0.28,
        z + (rand() - 0.5) * scale,
      );
      p.scale.setScalar(scale * (0.55 + rand() * 0.6));
      p.rotation.y = rand() * Math.PI;
      p.rotation.x = (rand() - 0.5) * 0.5;
      p.renderOrder = 6;
      root.add(p);
    }
  };
  puff(peak.x, hillAt(peak.x, peak.z) * 0.92, peak.z, 1.5, 3);
  puff(-1.2, 4.6, -0.4, 1.3, 5);
  puff(1.4, 5.1, 0.8, 1.15, 9);
  puff(-2.4, 5.4, 1.6, 1.05, 13);
  puff(0.2, 4.3, -2.2, 0.9, 17);
}
function addCars(root, bin) {
  const paths = [[], []];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    paths[0].push(pointAtCoast(0.115, -0.8 + t * 1.6));
    paths[1].push(pointAtCoast(-0.01, -0.62 + t * 1.15));
  }
  const colors = ["#f4f4f4", "#d24a3a", "#2c3f55", "#f0d35a", "#8d9398", "#1c1c1c"];
  const count = 16;
  const body = new THREE.InstancedMesh(
    track(bin, new THREE.BoxGeometry(1, 1, 1)),
    std(bin, "#ffffff", 0.45, 0.2),
    count,
  );
  const cabin = new THREE.InstancedMesh(
    track(bin, new THREE.BoxGeometry(1, 1, 1)),
    std(bin, "#d5e7ef", 0.25, 0.1),
    count,
  );
  body.castShadow = cabin.castShadow = true;
  const phase = Array.from({ length: count }, (_, i) => (i / count) * 0.92);
  const lane = Array.from({ length: count }, (_, i) => (i % 2 === 0 ? 0 : 1));
  const paint = colors.map((c) => new THREE.Color(c));
  root.add(body, cabin);
  const sample = (path, t) => {
    const u = ((t % 1) + 1) % 1;
    const f = u * (path.length - 1);
    const i = Math.min(path.length - 2, Math.floor(f));
    const a = path[i];
    const b = path[i + 1];
    const k = f - i;
    return { x: a.x + (b.x - a.x) * k, z: a.z + (b.z - a.z) * k, tx: b.x - a.x, tz: b.z - a.z };
  };
  return {
    tick(time) {
      for (let i = 0; i < count; i++) {
        const p = sample(paths[lane[i]], phase[i] + time * (0.028 + (i % 3) * 4e-3));
        _tan.set(p.tx, 0, p.tz).normalize();
        _quat.setFromUnitVectors(_x, _tan);
        _pos.set(p.x, 0.025, p.z);
        _scl.set(0.1, 0.028, 0.046);
        _m.compose(_pos, _quat, _scl);
        body.setMatrixAt(i, _m);
        body.setColorAt(i, paint[i % paint.length]);
        _pos.y = 0.048;
        _scl.set(0.048, 0.022, 0.04);
        _m.compose(_pos, _quat, _scl);
        cabin.setMatrixAt(i, _m);
      }
      body.instanceMatrix.needsUpdate = true;
      cabin.instanceMatrix.needsUpdate = true;
      if (body.instanceColor) body.instanceColor.needsUpdate = true;
    },
  };
}
function addKayaks(root, bin) {
  const mesh = new THREE.InstancedMesh(
    track(bin, new THREE.BoxGeometry(0.09, 0.012, 0.025)),
    std(bin, "#ffffff", 0.4, 0.1),
    10,
  );
  const bases = Array.from({ length: 10 }, (_, i) => {
    const p = pointAtCoast(0.4 + (i % 3) * 0.06, -0.35 + i * 0.08);
    return p;
  });
  const colors = ["#f2c14e", "#ffffff", "#e23d3d", "#2f6fed"].map((c) => new THREE.Color(c));
  root.add(mesh);
  return {
    tick(time) {
      bases.forEach((p, i) => {
        _quat.setFromAxisAngle(_up, -Math.PI / 4 + (i % 2) * 0.4);
        _pos.set(p.x, 0.045 + Math.sin(time * 1.3 + i) * 0.012, p.z);
        _scl.set(1, 1, 1);
        _m.compose(_pos, _quat, _scl);
        mesh.setMatrixAt(i, _m);
        mesh.setColorAt(i, colors[i % colors.length]);
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    },
  };
}
export { createCoastalDiorama, landY };
