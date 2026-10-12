"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { provinceColors, availableProvinces } from "../lib/province-colors";
import boundaries from "../public/data/provinces.json";

export const provinceLabels = boundaries.features.map((f) => ({
  code: f.properties.shapeISO,
  name: f.properties.shapeName.replace("Nothern", "Northern"),
}));
export type LabelRefs = { current: Record<string, HTMLDivElement | null> };

function ProjectedLabel({
  label,
  p,
  labels,
}: {
  label: string;
  p: [number, number, number];
  labels: LabelRefs;
}) {
  const ref = useRef<THREE.Group>(null);
  const vector = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, size }) => {
    const element = labels.current[label];
    if (!element || !ref.current) return;
    ref.current.getWorldPosition(vector);
    vector.project(camera);
    element.style.transform = `translate3d(${(vector.x * 0.5 + 0.5) * size.width}px,${(-vector.y * 0.5 + 0.5) * size.height}px,0) translate(-50%,-130%)`;
    element.style.visibility =
      Math.abs(vector.x) > 1.05 || Math.abs(vector.y) > 1.05 || vector.z > 1 ? "hidden" : "visible";
  });
  return <group ref={ref} position={p} />;
}

function roundedSlab(w: number, d: number, thickness: number, radius: number) {
  const shape = new THREE.Shape();
  const hw = w / 2;
  const hd = d / 2;
  const r = Math.min(radius, hw - 0.01, hd - 0.01);
  shape.moveTo(-hw + r, -hd);
  shape.lineTo(hw - r, -hd);
  shape.absarc(hw - r, -hd + r, r, -Math.PI / 2, 0, false);
  shape.lineTo(hw, hd - r);
  shape.absarc(hw - r, hd - r, r, 0, Math.PI / 2, false);
  shape.lineTo(-hw + r, hd);
  shape.absarc(-hw + r, hd - r, r, Math.PI / 2, Math.PI, false);
  shape.lineTo(-hw, -hd + r);
  shape.absarc(-hw + r, -hd + r, r, Math.PI, Math.PI * 1.5, false);
  return new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.03,
    bevelSegments: 2,
    curveSegments: 8,
  });
}

function blobGeometry(rx: number, rz: number, seed: number, depth: number) {
  const shape = new THREE.Shape();
  const n = 80;
  const lobes = 6 + (Math.abs(Math.floor(seed * 2.1)) % 3);
  const ring: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const scallop = Math.cos(lobes * a + seed * 1.7);
    const irregular = 0.07 * Math.sin(a * 3 + seed * 4) + 0.045 * Math.cos(a * 5 + seed);
    const wobble = 1.05 + 0.16 * scallop + irregular;
    ring.push([Math.cos(a) * rx * wobble, Math.sin(a) * rz * wobble]);
  }
  shape.moveTo(ring[0][0], ring[0][1]);
  for (let i = 1; i < ring.length; i++) shape.lineTo(ring[i][0], ring[i][1]);
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.055,
    bevelSize: 0.07,
    bevelSegments: 4,
    curveSegments: 1,
    steps: 1,
  });
}

function ToyTree({ p, scale = 1 }: { p: [number, number, number]; scale?: number }) {
  return (
    <group position={p} scale={scale}>
      <mesh position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.02, 0.032, 0.14, 5]} />
        <meshStandardMaterial color="#8d5a34" flatShading roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.18, 0]}>
        <icosahedronGeometry args={[0.09, 0]} />
        <meshStandardMaterial color="#3f9a38" flatShading roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.27, 0]} scale={[0.72, 0.85, 0.72]}>
        <icosahedronGeometry args={[0.075, 0]} />
        <meshStandardMaterial color="#86d25a" flatShading roughness={0.65} />
      </mesh>
    </group>
  );
}

function ToyRock({ p, scale = 1 }: { p: [number, number, number]; scale?: number }) {
  return (
    <mesh position={p} scale={scale} rotation={[0.5, 0.4, 0.2]}>
      <dodecahedronGeometry args={[0.07, 0]} />
      <meshStandardMaterial color="#c8cac6" flatShading roughness={0.85} />
    </mesh>
  );
}

const pieces = [
  {
    code: "LI",
    x: 0.05,
    z: -1.62,
    rx: 0.78,
    rz: 0.5,
    seed: 1.1,
    yaw: 0.18,
    depth: 0.2,
    order: 0,
    trees: [
      [-0.28, -0.08],
      [0.26, 0.1],
    ],
    rocks: [[0.02, 0.22]],
  },
  {
    code: "MP",
    x: 1.48,
    z: -1.22,
    rx: 0.82,
    rz: 0.56,
    seed: 2.2,
    yaw: -0.22,
    depth: 0.2,
    order: 1,
    trees: [
      [0.22, -0.16],
      [-0.32, 0.08],
    ],
    rocks: [[0.36, 0.18]],
  },
  {
    code: "NW",
    x: -1.22,
    z: -0.48,
    rx: 0.72,
    rz: 0.52,
    seed: 0.6,
    yaw: 0.28,
    depth: 0.2,
    order: 2,
    trees: [
      [-0.22, 0.06],
      [0.24, -0.14],
    ],
    rocks: [[0.02, 0.22]],
  },
  {
    code: "GT",
    x: 0.32,
    z: -0.48,
    rx: 0.36,
    rz: 0.3,
    seed: 3.4,
    yaw: 0.08,
    depth: 0.28,
    order: 3,
    trees: [[0.08, 0.06]],
    rocks: [] as [number, number][],
  },
  {
    code: "FS",
    x: 0.42,
    z: 0.28,
    rx: 0.64,
    rz: 0.5,
    seed: 4.1,
    yaw: -0.1,
    depth: 0.2,
    order: 4,
    trees: [
      [0.16, 0.12],
      [-0.22, -0.06],
    ],
    rocks: [[0.28, -0.14]],
  },
  {
    code: "KZ",
    x: 1.72,
    z: 0.18,
    rx: 0.62,
    rz: 0.55,
    seed: 1.9,
    yaw: 0.32,
    depth: 0.2,
    order: 5,
    trees: [
      [0.12, 0.18],
      [-0.18, -0.08],
      [0.28, -0.16],
    ],
    rocks: [[-0.02, 0.24]],
  },
  {
    code: "NC",
    x: -1.22,
    z: 0.92,
    rx: 1.12,
    rz: 0.74,
    seed: 5.2,
    yaw: -0.14,
    depth: 0.18,
    order: 6,
    trees: [
      [-0.45, 0.12],
      [0.2, -0.18],
      [-0.08, 0.36],
      [0.48, 0.16],
    ],
    rocks: [
      [-0.25, -0.22],
      [0.32, 0.28],
    ],
  },
  {
    code: "EC",
    x: 1.18,
    z: 1.22,
    rx: 0.74,
    rz: 0.5,
    seed: 6.3,
    yaw: -0.2,
    depth: 0.2,
    order: 7,
    trees: [
      [0.12, 0.14],
      [-0.24, -0.08],
    ],
    rocks: [[0.3, 0.02]],
  },
  {
    code: "WC",
    x: -0.12,
    z: 1.62,
    rx: 0.72,
    rz: 0.48,
    seed: 2.7,
    yaw: 0.16,
    depth: 0.2,
    order: 8,
    trees: [
      [0.16, 0.1],
      [-0.26, 0],
    ],
    rocks: [[0.02, -0.16]],
  },
] as const;

const REST_Y = 0.12;
const signOffset: Record<string, [number, number]> = {
  LI: [0.04, -0.26],
  MP: [0.2, -0.18],
  NW: [-0.16, -0.2],
  GT: [0.02, -0.06],
  FS: [-0.1, -0.06],
  KZ: [0.16, -0.16],
  NC: [-0.38, -0.04],
  EC: [0.06, -0.18],
  WC: [-0.02, 0.22],
};

function ProvincePiece({
  piece,
  onCity,
  reduced,
  labels,
}: {
  piece: (typeof pieces)[number];
  onCity: (i: number) => void;
  reduced: boolean;
  labels: LabelRefs;
}) {
  const ref = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);
  const [held, setHeld] = useState(false);
  const { invalidate } = useThree();
  const code = piece.code;
  const city = availableProvinces[code];
  const active = city !== undefined;
  const color = provinceColors[code];
  const geometry = useMemo(
    () => blobGeometry(piece.rx, piece.rz, piece.seed, piece.depth),
    [piece],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => {
    const label = labels.current[code];
    if (label) label.dataset.hovered = String(hover || held);
  }, [hover, held, labels, code]);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (reduced) {
      node.position.y = REST_Y;
      node.scale.set(1, 1, 1);
      return;
    }
    node.position.y = -0.85;
    node.scale.set(0.35, 0.12, 0.35);
    const rise = gsap.to(node.position, {
      y: REST_Y,
      duration: 0.9,
      delay: piece.order * 0.06,
      ease: "back.out(1.7)",
      overwrite: "auto",
      onUpdate: invalidate,
    });
    const pop = gsap.to(node.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 0.85,
      delay: piece.order * 0.06,
      ease: "back.out(1.8)",
      overwrite: "auto",
      onUpdate: invalidate,
    });
    return () => {
      rise.kill();
      pop.kill();
    };
  }, [reduced, invalidate, piece.order]);
  const hoveredOnce = useRef(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (!hoveredOnce.current) {
      hoveredOnce.current = true;
      return;
    }
    const lift = held ? -0.045 : hover && active ? 0.16 : 0;
    const squash = held ? 0.94 : hover && active ? 1.03 : 1;
    const tween = gsap.to(node.position, {
      y: REST_Y + lift,
      duration: reduced ? 0 : 0.32,
      ease: "back.out(2.4)",
      overwrite: "auto",
      onUpdate: invalidate,
    });
    const scale = gsap.to(node.scale, {
      x: squash,
      y: held ? 0.9 : squash,
      z: squash,
      duration: reduced ? 0 : 0.32,
      ease: "back.out(2)",
      overwrite: "auto",
      onUpdate: invalidate,
    });
    return () => {
      tween.kill();
      scale.kill();
    };
  }, [hover, held, active, reduced, invalidate]);
  return (
    <group position={[piece.x, 0, piece.z]} rotation={[0, piece.yaw, 0]}>
      <group ref={ref}>
        <mesh
          geometry={geometry}
          rotation={[-Math.PI / 2, 0, 0]}
          onPointerOver={(e) => {
            e.stopPropagation();
            if (active) setHover(true);
          }}
          onPointerOut={() => {
            setHover(false);
            setHeld(false);
          }}
          onPointerDown={(e) => {
            if (!active) return;
            e.stopPropagation();
            setHeld(true);
          }}
          onPointerUp={() => setHeld(false)}
          onClick={(e) => {
            if (active && e.delta < 6) {
              e.stopPropagation();
              onCity(city);
            }
          }}
        >
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={hover && active ? 0.18 : 0.03}
            flatShading
            roughness={0.62}
            metalness={0.02}
          />
        </mesh>
        {piece.trees.map(([x, z], i) => (
          <ToyTree key={`t${i}`} p={[x, piece.depth, z]} scale={0.85 + (i % 2) * 0.2} />
        ))}
        {piece.rocks.map(([x, z], i) => (
          <ToyRock key={`r${i}`} p={[x, piece.depth + 0.02, z]} scale={0.9 + i * 0.15} />
        ))}
        <mesh position={[signOffset[code][0], piece.depth + 0.28, signOffset[code][1]]}>
          <cylinderGeometry args={[0.018, 0.026, 0.52, 8]} />
          <meshStandardMaterial color="#f4f4f2" roughness={0.45} />
        </mesh>
        <mesh position={[signOffset[code][0], piece.depth + 0.52, signOffset[code][1]]}>
          <sphereGeometry args={[0.035, 10, 10]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <ProjectedLabel
          label={code}
          p={[signOffset[code][0], piece.depth + 0.56, signOffset[code][1]]}
          labels={labels}
        />
      </group>
    </group>
  );
}

function Platform({ reduced }: { reduced: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const { invalidate } = useThree();
  const layers = useMemo(
    () => [
      { geo: roundedSlab(6.2, 5.6, 0.16, 0.28), y: -0.46, color: "#6a4128" },
      { geo: roundedSlab(5.95, 5.35, 0.14, 0.3), y: -0.3, color: "#8b5734" },
      { geo: roundedSlab(5.7, 5.1, 0.12, 0.32), y: -0.16, color: "#e7cb8e" },
      { geo: roundedSlab(5.45, 4.85, 0.14, 0.34), y: -0.02, color: "#7ec44a" },
    ],
    [],
  );
  useEffect(() => () => layers.forEach((layer) => layer.geo.dispose()), [layers]);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (reduced) {
      node.scale.set(1, 1, 1);
      return;
    }
    const tween = gsap.fromTo(
      node.scale,
      { x: 0.82, y: 0.2, z: 0.82 },
      { x: 1, y: 1, z: 1, duration: 0.7, ease: "back.out(1.4)", onUpdate: invalidate },
    );
    return () => {
      tween.kill();
    };
  }, [reduced, invalidate]);
  return (
    <group ref={ref}>
      {layers.map((layer) => (
        <mesh
          key={layer.color}
          geometry={layer.geo}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, layer.y, 0]}
        >
          <meshStandardMaterial color={layer.color} roughness={0.86} flatShading />
        </mesh>
      ))}
      {(
        [
          [-2.15, 1.85],
          [2.2, 1.7],
          [-2.25, -1.7],
          [2.15, -1.85],
          [0.1, 2.15],
          [-1.7, 2.05],
          [1.85, -2.05],
        ] as [number, number][]
      ).map(([x, z], i) => (
        <ToyTree key={i} p={[x, 0.12, z]} scale={0.7 + (i % 3) * 0.18} />
      ))}
      {(
        [
          [2.0, 0.2],
          [-2.05, 0.4],
          [0.8, 2.0],
          [-0.4, -2.05],
        ] as [number, number][]
      ).map(([x, z], i) => (
        <ToyRock key={i} p={[x, 0.16, z]} scale={1.1 + i * 0.15} />
      ))}
    </group>
  );
}

export default function ProvinceMap({
  onCity,
  reduced,
  labels,
}: {
  onCity: (i: number) => void;
  reduced: boolean;
  labels: LabelRefs;
}) {
  return (
    <group>
      <Platform reduced={reduced} />
      {pieces.map((piece) => (
        <ProvincePiece
          key={piece.code}
          piece={piece}
          onCity={onCity}
          reduced={reduced}
          labels={labels}
        />
      ))}
    </group>
  );
}
