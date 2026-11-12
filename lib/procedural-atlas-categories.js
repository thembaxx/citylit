// Atlas-only dioramas: procedural geometry and GLSL materials, no downloaded assets.
import * as THREE from "three";

const PI = Math.PI;
const material = (color, roughness = 0.72, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });
const glow = (color, strength = 1) => {
  const value = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: strength,
    roughness: 0.3,
  });
  value.userData.i = strength;
  return value;
};
const mesh = (group, geometry, surface, x = 0, y = 0, z = 0) => {
  const object = new THREE.Mesh(geometry, surface);
  object.position.set(x, y, z);
  object.castShadow = true;
  object.receiveShadow = true;
  group.add(object);
  return object;
};
const box = (group, w, h, d, surface, x = 0, y = h / 2, z = 0) =>
  mesh(group, new THREE.BoxGeometry(w, h, d), surface, x, y, z);
const cylinder = (group, top, bottom, height, surface, x = 0, y = height / 2, z = 0) =>
  mesh(group, new THREE.CylinderGeometry(top, bottom, height, 32), surface, x, y, z);

function edge(group, from, to, radius, surface) {
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const difference = end.clone().sub(start);
  const object = mesh(
    group,
    new THREE.CylinderGeometry(radius, radius, difference.length(), 8),
    surface,
  );
  object.position.copy(start.add(end).multiplyScalar(0.5));
  object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), difference.normalize());
  return object;
}

function water() {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uNight: { value: 0 } },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorld;
      uniform float uTime;
      void main() {
        vUv = uv;
        vec3 displaced = position;
        displaced.z += sin(position.x * 9.0 + uTime * 1.25) * 0.018;
        displaced.z += cos(position.y * 12.0 - uTime * 0.9) * 0.013;
        vec4 world = modelMatrix * vec4(displaced, 1.0);
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying vec3 vWorld;
      uniform float uTime;
      uniform float uNight;
      void main() {
        vec2 p = vUv * vec2(21.0, 17.0);
        float ripples = sin(p.x + uTime * 1.6) * cos(p.y - uTime * 1.3);
        ripples += 0.46 * sin(p.x * 1.73 + p.y * 1.35 + uTime);
        float glimmer = pow(max(0.0, ripples * 0.35 + 0.45), 6.0);
        float edgeFoam = smoothstep(0.4, 0.52, length(vUv - vec2(0.5)));
        vec3 deep = mix(vec3(0.026, 0.28, 0.31), vec3(0.02, 0.10, 0.2), uNight);
        vec3 color = deep + vec3(0.16, 0.31, 0.32) * glimmer + edgeFoam * vec3(0.08);
        gl_FragColor = vec4(color, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    side: THREE.DoubleSide,
  });
}

const strataMap = (() => {
  const width = 8;
  const height = 64;
  const data = new Uint8Array(width * height * 4);
  const bands = [
    [94, 70, 52],
    [196, 132, 74],
    [236, 214, 176],
    [122, 74, 48],
    [214, 170, 112],
    [88, 58, 42],
  ];
  for (let y = 0; y < height; y++) {
    const band = bands[Math.floor((y / height) * bands.length)];
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const n = ((x * 13 + y * 7) % 17) - 8;
      data[i] = band[0] + n;
      data[i + 1] = band[1] + n;
      data[i + 2] = band[2] + n;
      data[i + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, width, height);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  tex.userData.shared = true;
  return tex;
})();

function ground(group, tint) {
  const soilMat = material("#ffffff", 0.96);
  soilMat.map = strataMap;
  soilMat.userData.sharedTextures = true;
  const soil = box(group, 3.75, 0.72, 3.75, soilMat, 0, -0.2);
  soil.name = "miniature-strata-plinth";
  box(group, 3.55, 0.06, 3.55, material(tint, 0.94), 0, 0.125);
  const pond = mesh(
    group,
    new THREE.CircleGeometry(0.34, 28).rotateX(-PI / 2),
    water(),
    1.28,
    0.17,
    1.12,
  );
  pond.name = "miniature-resin-pond";
  const people = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.055, 0.13, 0.04),
    new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.6, vertexColors: true }),
    8,
  );
  people.name = "miniature-people";
  const cloth = ["#e23d3d", "#f2c14e", "#ffffff", "#2f6fed", "#1c1c1c", "#e4578a"].map(
    (c) => new THREE.Color(c),
  );
  const matrix = new THREE.Matrix4();
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * PI * 2;
    matrix.makeTranslation(Math.cos(angle) * 1.45, 0.22, Math.sin(angle) * 1.45);
    people.setMatrixAt(i, matrix);
    people.setColorAt(i, cloth[i % cloth.length]);
  }
  people.instanceMatrix.needsUpdate = true;
  people.instanceColor.needsUpdate = true;
  group.add(people);
}

function tree(group, x, z, scale = 1) {
  const root = new THREE.Group();
  root.position.set(x, 0.15, z);
  root.scale.setScalar(scale);
  cylinder(root, 0.05, 0.085, 0.7, material("#68513d", 0.94), 0, 0.34);
  const leaves = material("#527b57", 0.94);
  for (let i = 0; i < 6; i++) {
    const angle = i * 2.39996;
    const sphere = mesh(
      root,
      new THREE.IcosahedronGeometry(0.27 + (i % 3) * 0.05, 2),
      leaves,
      Math.cos(angle) * 0.19,
      0.86 + (i % 2) * 0.14,
      Math.sin(angle) * 0.19,
    );
    sphere.rotation.y = angle;
  }
  root.userData.wind = { ph: x * 3 + z, a: 0.014, sp: 0.7 };
  group.add(root);
}

function hotelWindows(group, floors, columns) {
  const pane = new THREE.BoxGeometry(0.17, 0.17, 0.035);
  const glass = glow("#a6cbd8", 0.3);
  const windows = new THREE.InstancedMesh(pane, glass, floors * columns);
  const matrix = new THREE.Matrix4();
  let index = 0;
  for (let y = 0; y < floors; y++)
    for (let x = 0; x < columns; x++) {
      matrix.makeTranslation(-0.94 + (x * 1.88) / (columns - 1), 0.6 + y * 0.37, 0.37);
      windows.setMatrixAt(index++, matrix);
    }
  windows.instanceMatrix.needsUpdate = true;
  windows.castShadow = false;
  group.add(windows);
}

function entertainment(group) {
  ground(group, "#5b7455");
  const wheel = new THREE.Group();
  wheel.position.set(0, 1.38, -0.12);
  group.add(wheel);
  const metal = material("#a6aba8", 0.38, 0.64);
  const lamps = glow("#ffd99c", 0.62);
  mesh(wheel, new THREE.TorusGeometry(1.06, 0.047, 12, 96), metal);
  mesh(wheel, new THREE.TorusGeometry(0.93, 0.013, 8, 96), lamps);
  for (let i = 0; i < 12; i++) {
    const angle = (i * PI * 2) / 12;
    const x = Math.sin(angle) * 1.055;
    const y = Math.cos(angle) * 1.055;
    edge(wheel, [0, 0, 0], [x, y, 0], 0.011, metal);
    const cabin = new THREE.Group();
    cabin.position.set(x, y, 0);
    box(cabin, 0.19, 0.19, 0.22, material(i % 2 ? "#d08a75" : "#668fa1", 0.4), 0, -0.12);
    box(cabin, 0.23, 0.035, 0.25, metal, 0, 0.005);
    wheel.add(cabin);
    cabin.userData.cabin = true;
  }
  edge(group, [-0.92, 0.15, 0], [0, 1.38, -0.12], 0.06, metal);
  edge(group, [0.92, 0.15, 0], [0, 1.38, -0.12], 0.06, metal);
  box(group, 1.0, 0.38, 0.75, material("#d5c0a2"), -0.82, 0.32, 1.12);
  for (let i = 0; i < 8; i++) {
    const x = -1.26 + i * 0.125;
    box(group, 0.08, 0.07, 0.12, glow(i % 2 ? "#f0c979" : "#8accc8", 0.65), x, 0.59, 1.51);
  }
  return (t) => {
    wheel.rotation.z = t * 0.11;
    for (const child of wheel.children)
      if (child.userData.cabin) child.rotation.z = -wheel.rotation.z;
  };
}

function lodging(group) {
  ground(group, "#78816c");
  const walls = material("#e4ceb4", 0.9);
  const accents = material("#6c615a", 0.6);
  box(group, 2.5, 2.25, 1.1, walls, 0, 1.35, -0.2);
  box(group, 2.65, 0.13, 1.3, accents, 0, 2.54, -0.2);
  hotelWindows(group, 5, 8);
  box(group, 0.46, 0.79, 0.09, material("#2a454e", 0.17, 0.3), 0, 0.55, 0.39);
  for (const x of [-0.44, 0.44]) {
    cylinder(group, 0.065, 0.075, 0.76, walls, x, 0.52, 0.57);
    for (let y = 1; y < 5; y++) box(group, 2.44, 0.025, 0.17, accents, 0, 0.45 + y * 0.37, 0.44);
  }
  box(group, 1.3, 0.09, 0.71, material("#ad795f", 0.8), 0, 0.97, 0.67);
  for (let i = 0; i < 8; i++) {
    const x = -0.65 + i * 0.19;
    box(group, 0.075, 0.36, 0.035, material(i % 2 ? "#ead5b4" : "#c98f70"), x, 0.77, 1.0);
  }
  tree(group, -1.49, 0.55, 0.42);
  tree(group, 1.45, 0.48, 0.42);
  return () => {};
}

function theatres(group) {
  ground(group, "#7b7064");
  const stone = material("#c7a990", 0.88);
  const brass = material("#caad75", 0.35, 0.58);
  box(group, 2.9, 1.9, 0.96, stone, 0, 1.13, -0.2);
  box(group, 2.98, 0.19, 1.16, brass, 0, 2.16, -0.2);
  box(group, 2.2, 1.48, 0.09, material("#232335", 0.96), 0, 1.02, 0.35);
  mesh(group, new THREE.TorusGeometry(1.04, 0.11, 12, 40, PI), brass, 0, 1.18, 0.45);
  box(group, 2.1, 0.1, 0.12, brass, 0, 1.9, 0.48);
  const velour = material("#6f2738", 0.96);
  const curtains = [];
  for (const side of [-1, 1]) {
    const panel = new THREE.PlaneGeometry(0.95, 1.45, 28, 20);
    const positions = panel.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      positions.setZ(i, 0.09 * Math.sin(x * 28));
    }
    panel.computeVertexNormals();
    const curtain = mesh(group, panel, velour, side * 0.48, 1.09, 0.48);
    curtain.material.side = THREE.DoubleSide;
    curtains.push(curtain);
  }
  for (let i = 0; i < 7; i++) {
    const x = -1.12 + i * 0.37;
    mesh(group, new THREE.SphereGeometry(0.07, 16, 12), glow("#ffca7e", 0.8), x, 1.89, 0.54);
  }
  box(group, 0.85, 0.36, 0.08, material("#e0c28f"), 0, 0.62, 0.57);
  return (t) => {
    curtains[0].position.x = -0.48 - 0.075 * (1 + Math.sin(t * 0.25));
    curtains[1].position.x = 0.48 + 0.075 * (1 + Math.sin(t * 0.25));
  };
}

function parks(group) {
  ground(group, "#637e56");
  const pool = mesh(group, new THREE.CircleGeometry(0.87, 96), water(), 0.4, 0.2, 0);
  pool.rotation.x = -PI / 2;
  mesh(
    group,
    new THREE.RingGeometry(0.87, 1.01, 96),
    material("#b9ac8e"),
    0.4,
    0.197,
    0,
  ).rotation.x = -PI / 2;
  for (let i = 0; i < 13; i++) {
    const angle = i * 2.39996;
    const radius = i % 2 ? 1.48 : 1.6;
    tree(group, Math.cos(angle) * radius, Math.sin(angle) * radius, 0.35 + (i % 3) * 0.13);
  }
  for (let i = 0; i < 15; i++) {
    const angle = i * 1.9;
    const r = 1.0 + (i % 5) * 0.14;
    const pebble = mesh(
      group,
      new THREE.DodecahedronGeometry(0.055 + (i % 3) * 0.027, 1),
      material(i % 2 ? "#aca28e" : "#81796c", 1),
      Math.cos(angle) * r,
      0.24,
      Math.sin(angle) * r,
    );
    pebble.rotation.y = angle;
  }
  const bird = mesh(group, new THREE.IcosahedronGeometry(0.07, 1), material("#d8dfd0"), -0.4, 1.48);
  return (t) => {
    bird.position.x = Math.sin(t * 0.5) * 1.04;
    bird.position.z = Math.cos(t * 0.5) * 0.67;
    bird.position.y = 1.5 + Math.sin(t * 1.4) * 0.07;
    bird.rotation.y = t * 0.5;
  };
}

function clubs(group) {
  ground(group, "#3c4457");
  const black = material("#333442", 0.47, 0.34);
  box(group, 2.56, 1.34, 1.37, black, 0, 0.85, -0.2);
  box(group, 2.63, 0.14, 1.45, material("#79717e", 0.42), 0, 1.56, -0.2);
  const neon = [];
  for (let i = 0; i < 3; i++) {
    const tint = i % 2 ? "#ff93d5" : "#78d9ff";
    const stripe = box(group, 2.48, 0.028, 0.045, glow(tint, 1.2), 0, 0.52 + i * 0.42, 0.52);
    neon.push(stripe);
  }
  for (let i = 0; i < 9; i++) {
    const x = -1.12 + i * 0.28;
    box(group, 0.045, 0.84, 0.045, glow(i % 3 ? "#a18ef2" : "#f6a9c9", 0.7), x, 0.81, 0.53);
  }
  box(group, 0.6, 0.9, 0.065, material("#151b27", 0.24, 0.42), 0, 0.57, 0.58);
  cylinder(group, 0.46, 0.46, 0.035, material("#c1a0ce", 0.35), 0, 1.79, 0);
  const orb = mesh(group, new THREE.IcosahedronGeometry(0.2, 2), glow("#b897fa", 0.72), 0, 2.17, 0);
  return (t) => {
    orb.rotation.y = t * 0.36;
    const pulse = 0.84 + 0.16 * Math.sin(t * 2.5);
    for (const stripe of neon) stripe.material.emissiveIntensity = pulse * 1.2;
  };
}

const scenes = [entertainment, lodging, theatres, parks, clubs];

/** Five distinct, geometry-first atlas category dioramas with animated shader materials. */
export function createProceduralCategory(index) {
  if (!Number.isInteger(index) || index < 0 || index >= scenes.length)
    throw new RangeError("Unknown atlas category: " + index);
  const group = new THREE.Group();
  const tick = scenes[index](group);
  group.name = "atlas-category-" + index;
  const winds = [];
  const shaders = new Set();
  group.traverse((object) => {
    if (object.userData.wind) winds.push({ object, ...object.userData.wind });
    const surfaces = object.material
      ? Array.isArray(object.material)
        ? object.material
        : [object.material]
      : [];
    for (const surface of surfaces) if (surface.isShaderMaterial) shaders.add(surface);
  });
  group.userData.tick = (time) => {
    tick(time);
    for (const { object, ph, a, sp } of winds) {
      object.rotation.z = Math.sin(time * sp + ph) * a;
      object.rotation.x = Math.cos(time * sp * 0.8 + ph) * a * 0.6;
    }
    for (const shader of shaders) if (shader.uniforms?.uTime) shader.uniforms.uTime.value = time;
  };
  group.userData.tick(0);
  return group;
}
