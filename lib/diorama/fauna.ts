import * as THREE from "three/webgpu";

const dummy = new THREE.Object3D();

export type FaunaInstance = {
  x: number;
  z: number;
  y?: number;
  rotation?: number;
  scale?: number;
  color?: string;
};

const standard = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.86, metalness: 0, ...extra });

function setMatrix(
  mesh: THREE.InstancedMesh,
  index: number,
  x: number,
  y: number,
  z: number,
  yaw: number,
  scale: number,
  local?: { ox?: number; oy?: number; oz?: number; rx?: number; ry?: number; rz?: number },
) {
  const ox = local?.ox ?? 0;
  const oy = local?.oy ?? 0;
  const oz = local?.oz ?? 0;
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  dummy.position.set(x + ox * cos + oz * sin, y + oy, z - ox * sin + oz * cos);
  dummy.rotation.set(local?.rx ?? 0, yaw + (local?.ry ?? 0), local?.rz ?? 0);
  dummy.scale.setScalar(scale);
  dummy.updateMatrix();
  mesh.setMatrixAt(index, dummy.matrix);
}

function prepare(mesh: THREE.InstancedMesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  return mesh;
}

export type PenguinColonyBuild = {
  group: THREE.Group;
  tick: (time: number) => void;
};

/**
 * African penguins, built from instanced parts so a whole colony costs a
 * handful of draw calls. Bodies bob and heads turn as the colony idles.
 */
export function createPenguins({ penguins }: { penguins: FaunaInstance[] }): PenguinColonyBuild {
  const group = new THREE.Group();
  const count = penguins.length;

  const bodyGeometry = new THREE.SphereGeometry(0.055, 8, 6);
  bodyGeometry.scale(0.9, 1.5, 1);
  const bellyGeometry = new THREE.SphereGeometry(0.043, 8, 6);
  bellyGeometry.scale(0.85, 1.35, 0.6);
  const headGeometry = new THREE.SphereGeometry(0.032, 8, 6);
  const beakGeometry = new THREE.ConeGeometry(0.011, 0.045, 5);
  beakGeometry.rotateZ(-Math.PI / 2);
  const footGeometry = new THREE.BoxGeometry(0.032, 0.012, 0.05);
  const flipperGeometry = new THREE.BoxGeometry(0.012, 0.06, 0.024);

  const ink = standard("#252a30", { roughness: 0.8 });
  const white = standard("#f4f1e6", { roughness: 0.85 });
  const beak = standard("#d99a3f", { roughness: 0.7 });
  const feet = standard("#c9773c", { roughness: 0.8 });

  const bodies = prepare(new THREE.InstancedMesh(bodyGeometry, ink, count));
  const bellies = prepare(new THREE.InstancedMesh(bellyGeometry, white, count));
  const heads = prepare(new THREE.InstancedMesh(headGeometry, ink, count));
  const beaks = prepare(new THREE.InstancedMesh(beakGeometry, beak, count));
  const feetMesh = prepare(new THREE.InstancedMesh(footGeometry, feet, count * 2));
  const flippers = prepare(new THREE.InstancedMesh(flipperGeometry, ink, count * 2));

  const tick = (time: number) => {
    for (let i = 0; i < count; i++) {
      const penguin = penguins[i];
      const base = (penguin.scale ?? 1) * 1.8;
      const yaw = penguin.rotation ?? i;
      const phase = i * 1.7;
      const bob = Math.sin(time * 1.9 + phase) * 0.007;
      const sway = Math.sin(time * 0.8 + phase * 0.6) * 0.09;
      const x = penguin.x;
      const y = (penguin.y ?? 0) + bob;
      const z = penguin.z;

      setMatrix(bodies, i, x, y, z, yaw, base, { oy: 0.05 });
      setMatrix(bellies, i, x, y, z, yaw, base, { oy: 0.048, oz: 0.018 });
      setMatrix(heads, i, x, y, z, yaw + sway, base, { oy: 0.118, oz: 0.006 });
      setMatrix(beaks, i, x, y, z, yaw + sway, base, { oy: 0.116, oz: 0.045 });
      setMatrix(feetMesh, i * 2, x, y, z, yaw, base, { ox: -0.018, oy: 0.006, oz: 0.014 });
      setMatrix(feetMesh, i * 2 + 1, x, y, z, yaw, base, { ox: 0.018, oy: 0.006, oz: 0.014 });
      setMatrix(flippers, i * 2, x, y, z, yaw, base, { oy: 0.07, oz: -0.043, rz: 0.18 });
      setMatrix(flippers, i * 2 + 1, x, y, z, yaw, base, { oy: 0.07, oz: 0.043, rz: -0.18 });
    }
    for (const mesh of [bodies, bellies, heads, beaks, feetMesh, flippers]) {
      mesh.instanceMatrix.needsUpdate = true;
    }
  };

  tick(0);
  group.add(bodies, bellies, heads, beaks, feetMesh, flippers);
  return { group, tick };
}

export type ElephantHerdBuild = {
  group: THREE.Group;
  tick: (time: number) => void;
};

/** A herd of African elephants, instanced by body part, with a slow idle. */
export function createElephants({ elephants }: { elephants: FaunaInstance[] }): ElephantHerdBuild {
  const group = new THREE.Group();
  const count = elephants.length;

  const bodyGeometry = new THREE.SphereGeometry(0.5, 12, 9);
  bodyGeometry.scale(1.16, 0.86, 0.82);
  const headGeometry = new THREE.SphereGeometry(0.29, 12, 9);
  headGeometry.scale(0.92, 1, 0.96);
  const earGeometry = new THREE.SphereGeometry(0.2, 10, 8);
  earGeometry.scale(0.14, 1, 0.85);
  const legGeometry = new THREE.CylinderGeometry(0.085, 0.095, 0.38, 7);
  legGeometry.translate(0, -0.19, 0);
  const trunkGeometry = new THREE.CylinderGeometry(0.055, 0.085, 0.36, 7);
  trunkGeometry.translate(0, -0.18, 0);
  const tuskGeometry = new THREE.ConeGeometry(0.026, 0.2, 6);

  const hide = standard("#7f7a73", { roughness: 0.95 });
  const hideDark = standard("#6e6a63", { roughness: 0.95 });
  const ivory = standard("#e8dfc6", { roughness: 0.6 });

  const bodies = prepare(new THREE.InstancedMesh(bodyGeometry, hide, count));
  const heads = prepare(new THREE.InstancedMesh(headGeometry, hideDark, count));
  const ears = prepare(new THREE.InstancedMesh(earGeometry, hideDark, count * 2));
  const legs = prepare(new THREE.InstancedMesh(legGeometry, hide, count * 4));
  const trunks = prepare(new THREE.InstancedMesh(trunkGeometry, hideDark, count));
  const tusks = prepare(new THREE.InstancedMesh(tuskGeometry, ivory, count * 2));

  const tick = (time: number) => {
    for (let i = 0; i < count; i++) {
      const elephant = elephants[i];
      const base = elephant.scale ?? 1;
      const yaw = elephant.rotation ?? i;
      const phase = i * 1.3;
      const breathe = Math.sin(time * 0.9 + phase) * 0.006;
      const x = elephant.x;
      const y = (elephant.y ?? 0) + breathe;
      const z = elephant.z;
      const swing = Math.sin(time * 0.7 + phase) * 0.16;

      setMatrix(bodies, i, x, y, z, yaw, base, { oy: 0.53 });
      setMatrix(heads, i, x, y, z, yaw + swing * 0.35, base, { ox: 0.48, oy: 0.62, oz: 0.02 });
      for (const side of [-1, 1]) {
        setMatrix(ears, i * 2 + (side > 0 ? 1 : 0), x, y, z, yaw, base, {
          ox: 0.48,
          oy: 0.65,
          oz: side * 0.2,
          ry: side * 0.5,
          rz: side * (0.12 + Math.sin(time * 1.4 + phase) * 0.08),
        });
        setMatrix(tusks, i * 2 + (side > 0 ? 1 : 0), x, y, z, yaw, base, {
          ox: 0.7,
          oy: 0.46,
          oz: side * 0.09,
          rz: -1.1,
        });
      }
      setMatrix(trunks, i, x, y, z, yaw, base, {
        ox: 0.72,
        oy: 0.58,
        rz: -0.5 + Math.sin(time * 0.8 + phase) * 0.12,
        ry: swing * 0.4,
      });
      const legOffsets: [number, number][] = [
        [0.3, 0.24],
        [0.3, -0.24],
        [-0.32, 0.22],
        [-0.32, -0.22],
      ];
      legOffsets.forEach(([lx, lz], legIndex) => {
        setMatrix(legs, i * 4 + legIndex, x, y, z, yaw, base, {
          ox: lx,
          oy: 0.5,
          oz: lz,
        });
      });
    }
    for (const mesh of [bodies, heads, ears, legs, trunks, tusks]) {
      mesh.instanceMatrix.needsUpdate = true;
    }
  };

  tick(0);
  group.add(bodies, heads, ears, legs, trunks, tusks);
  return { group, tick };
}

export type GullFlockBuild = {
  group: THREE.Group;
  tick: (time: number) => void;
};

/** Small circling gulls, cheap enough to add to every coastal scene. */
export function createGulls({
  count = 8,
  center = [0, 6, 0] as [number, number, number],
  radius = 5,
  seed = 3,
}: {
  count?: number;
  center?: [number, number, number];
  radius?: number;
  seed?: number;
}): GullFlockBuild {
  const group = new THREE.Group();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      [0, 0, 0.09, 0, 0.02, 0, 0.34, 0, 0.12, 0, 0, 0.09, 0.34, 0, 0.12, 0.34, 0.02, 0],
      3,
    ),
  );
  geometry.computeVertexNormals();
  const material = standard("#f2f1ea", {
    roughness: 0.8,
    side: THREE.DoubleSide,
    flatShading: true,
  });
  const mesh = prepare(new THREE.InstancedMesh(geometry, material, count));
  const gulls = Array.from({ length: count }, (_, index) => {
    let a = (seed + index * 37) % 97;
    a = (a * 7) % 101;
    return {
      angle: (index / count) * Math.PI * 2 + (a % 13) * 0.1,
      speed: 0.12 + ((a % 11) / 11) * 0.12,
      radius: radius * (0.6 + ((a % 7) / 7) * 0.55),
      height: center[1] + ((a % 5) - 2) * 0.28,
      scale: 0.7 + ((a % 9) / 9) * 0.6,
      flap: 0.5 + ((a % 6) / 6) * 0.6,
    };
  });

  const tick = (time: number) => {
    gulls.forEach((gull, index) => {
      const angle = gull.angle + time * gull.speed;
      dummy.position.set(
        center[0] + Math.cos(angle) * gull.radius,
        gull.height + Math.sin(time * 0.9 + index) * 0.12,
        center[2] + Math.sin(angle) * gull.radius * 0.8,
      );
      dummy.rotation.set(0, -angle + Math.PI / 2, Math.sin(time * 4 * gull.flap + index) * 0.35);
      dummy.scale.setScalar(gull.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  };

  tick(0);
  group.add(mesh);
  return { group, tick };
}
