import * as THREE from "three/webgpu";

export type TerrainColor = (
  x: number,
  z: number,
  height: number,
  slope: number,
  normalY: number,
) => THREE.Color;

export type TerrainOptions = {
  size: number;
  segments: number;
  height: (x: number, z: number) => number;
  color: TerrainColor;
  material?: THREE.Material;
};

export function createTerrainMesh({
  size,
  segments,
  height,
  color,
  material,
}: TerrainOptions): THREE.Mesh {
  const positions: number[] = [];
  const colors: number[] = [];
  const step = size / segments;
  const half = size / 2;
  const tmp = new THREE.Color();

  const pushTriangle = (ax: number, az: number, bx: number, bz: number, cx: number, cz: number) => {
    const ay = height(ax, az);
    const by = height(bx, bz);
    const cy = height(cx, cz);
    const ux = bx - ax;
    const uy = by - ay;
    const uz = bz - az;
    const vx = cx - ax;
    const vy = cy - ay;
    const vz = cz - az;
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    const length = Math.hypot(nx, ny, nz) || 1;
    const normalY = ny / length;
    const slope = Math.sqrt(Math.max(0, 1 - normalY * normalY)) / Math.max(0.02, Math.abs(normalY));
    const mx = (ax + bx + cx) / 3;
    const mz = (az + bz + cz) / 3;
    const my = (ay + by + cy) / 3;
    const face = color(mx, mz, my, slope, normalY);
    tmp.setRGB(face.r, face.g, face.b);
    positions.push(ax, ay, az, bx, by, bz, cx, cy, cz);
    for (let i = 0; i < 3; i++) colors.push(tmp.r, tmp.g, tmp.b);
  };

  for (let iz = 0; iz < segments; iz++) {
    for (let ix = 0; ix < segments; ix++) {
      const x0 = -half + ix * step;
      const x1 = x0 + step;
      const z0 = -half + iz * step;
      const z1 = z0 + step;
      // Wind counter-clockwise seen from above so the surface normal points up.
      pushTriangle(x0, z0, x0, z1, x1, z1);
      pushTriangle(x0, z0, x1, z1, x1, z0);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(
    geometry,
    material ??
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.96,
        metalness: 0,
        flatShading: true,
      }),
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** A vertical cut face around the terrain edge, so a raised landscape reads as a block. */
export function createTerrainSkirt({
  size,
  segments,
  height,
  material,
}: {
  size: number;
  segments: number;
  height: (x: number, z: number) => number;
  material: THREE.Material;
}): THREE.Mesh | null {
  const positions: number[] = [];
  const indices: number[] = [];
  const step = size / segments;
  const half = size / 2;
  const edge = (x: number, z: number) => Math.max(0, height(x, z));

  const addQuad = (x0: number, z0: number, x1: number, z1: number, reverse = false) => {
    const h0 = edge(x0, z0);
    const h1 = edge(x1, z1);
    if (h0 < 0.008 && h1 < 0.008) return;
    const base = positions.length / 3;
    positions.push(x0, h0, z0, x1, h1, z1, x1, 0, z1, x0, 0, z0);
    if (reverse) indices.push(base, base + 2, base + 1, base, base + 3, base + 2);
    else indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };

  for (let i = 0; i < segments; i++) {
    const a = -half + i * step;
    const b = a + step;
    addQuad(a, -half, b, -half);
    addQuad(b, half, a, half);
    addQuad(-half, b, -half, a);
    addQuad(half, a, half, b);
  }

  if (!indices.length) return null;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export type WaterOptions = {
  size: number;
  segments: number;
  level: number;
  height: (x: number, z: number) => number;
  /** Optional separate bed height for depth tinting (e.g. a carved seabed under a shallow mesh). */
  depth?: (x: number, z: number) => number;
  material: THREE.Material;
};

export function createWaterMesh({ size, segments, level, height, depth, material }: WaterOptions) {
  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2);
  const position = geometry.attributes.position;
  const depths = new Float32Array(position.count);
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const z = position.getZ(i);
    const bed = depth ? depth(x, z) : height(x, z);
    depths[i] = Math.max(0, level - bed);
  }
  geometry.setAttribute("aDepth", new THREE.BufferAttribute(depths, 1));
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = level;
  mesh.receiveShadow = false;
  mesh.renderOrder = 2;
  return mesh;
}

export function createRibbonMesh({
  points,
  width,
  material,
  segments = 72,
  yOffset = 0.02,
  taper = false,
}: {
  points: THREE.Vector3[];
  width: number;
  material: THREE.Material;
  segments?: number;
  yOffset?: number;
  taper?: boolean;
}) {
  const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.35);
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const point = curve.getPoint(t);
    const tangent = curve.getTangent(t);
    tangent.y = 0;
    if (tangent.lengthSq() < 1e-6) tangent.set(1, 0, 0);
    tangent.normalize();
    const side = new THREE.Vector3().crossVectors(up, tangent).normalize();
    const localWidth = taper ? width * (0.35 + 0.65 * Math.sin(Math.PI * t)) : width;
    const a = point.clone().addScaledVector(side, localWidth / 2);
    const b = point.clone().addScaledVector(side, -localWidth / 2);
    a.y += yOffset;
    b.y += yOffset;
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
    uvs.push(0, t, 1, t);
    if (i < segments) {
      const k = i * 2;
      indices.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  return mesh;
}

export function createRoofPrism(width: number, depth: number, height: number) {
  const w = width / 2;
  const d = depth / 2;
  const h = height;
  const positions = [
    // front slope
    -w,
    0,
    d,
    w,
    0,
    d,
    w,
    h,
    0,
    -w,
    0,
    d,
    w,
    h,
    0,
    -w,
    h,
    0,
    // back slope
    -w,
    h,
    0,
    w,
    h,
    0,
    w,
    0,
    -d,
    -w,
    h,
    0,
    w,
    0,
    -d,
    -w,
    0,
    -d,
    // left gable
    -w,
    0,
    -d,
    -w,
    0,
    d,
    -w,
    h,
    0,
    // right gable
    w,
    0,
    d,
    w,
    0,
    -d,
    w,
    h,
    0,
    // underside
    -w,
    0,
    -d,
    w,
    0,
    -d,
    w,
    0,
    d,
    -w,
    0,
    -d,
    w,
    0,
    d,
    -w,
    0,
    d,
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export function createHyperboloidGeometry(
  height: number,
  baseRadius: number,
  topRadius: number,
  waistRadius: number,
  segments = 48,
) {
  const points: THREE.Vector2[] = [];
  for (let i = 0; i <= 28; i++) {
    const t = i / 28;
    const radius =
      waistRadius +
      (baseRadius - waistRadius) * Math.pow(1 - t, 2.25) +
      (topRadius - waistRadius) * Math.pow(t, 2.6);
    points.push(new THREE.Vector2(radius, t * height));
  }
  return new THREE.LatheGeometry(points, segments);
}

export function createArchGeometry(majorRadius: number, tubeRadius: number, arc = Math.PI) {
  return new THREE.TorusGeometry(majorRadius, tubeRadius, 8, 30, arc);
}

export function createBeam(
  from: THREE.Vector3,
  to: THREE.Vector3,
  radius: number,
  material: THREE.Material,
  radialSegments = 5,
) {
  const direction = new THREE.Vector3().subVectors(to, from);
  const length = direction.length();
  const geometry = new THREE.CylinderGeometry(radius, radius, length, radialSegments, 1);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(from).add(to).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  mesh.castShadow = true;
  return mesh;
}

export function createTubeCurve(points: THREE.Vector3[], radius: number, material: THREE.Material) {
  const curve = new THREE.CatmullRomCurve3(points);
  const geometry = new THREE.TubeGeometry(curve, Math.max(24, points.length * 8), radius, 4, false);
  return new THREE.Mesh(geometry, material);
}
