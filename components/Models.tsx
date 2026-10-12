"use client";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
const windowBlue = "#3d7ef0",
  dark = "#3a3532",
  cream = "#fff4e6",
  peach = "#f3c7a6",
  roof = "#2f7a45",
  sand = "#e7c9a4";
type V = [number, number, number];
function Box({
  p = [0, 0, 0],
  s = [1, 1, 1],
  c = cream,
  r = [0, 0, 0],
}: {
  p?: V;
  s?: V;
  c?: string;
  r?: V;
}) {
  return (
    <mesh position={p} rotation={r}>
      <boxGeometry args={s} />
      <meshStandardMaterial color={c} roughness={0.8} />
    </mesh>
  );
}
function Cylinder({
  p = [0, 0, 0],
  a = [0.2, 0.2, 1, 12],
  c = cream,
  r = [0, 0, 0],
}: {
  p?: V;
  a?: [number, number, number, number];
  c?: string;
  r?: V;
}) {
  return (
    <mesh position={p} rotation={r}>
      <cylinderGeometry args={a} />
      <meshStandardMaterial color={c} />
    </mesh>
  );
}
function Cable({
  from,
  to,
  c = cream,
  width = 0.015,
}: {
  from: V;
  to: V;
  c?: string;
  width?: number;
}) {
  const a = new THREE.Vector3(...from),
    b = new THREE.Vector3(...to),
    mid = a.clone().add(b).multiplyScalar(0.5),
    dir = b.clone().sub(a);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir.clone().normalize(),
  );
  return (
    <mesh position={mid} quaternion={quaternion}>
      <cylinderGeometry args={[width, width, dir.length(), 5]} />
      <meshStandardMaterial color={c} />
    </mesh>
  );
}
function Grove() {
  const spots: [number, number][] = [
    [-1.2, 0.15],
    [1.22, 0.4],
    [-1.05, -0.95],
    [1.18, -0.9],
    [0.15, 1.22],
    [-0.4, -1.2],
    [1.32, -0.15],
    [-1.32, 0.6],
  ];
  return (
    <>
      {spots.map(([x, z], i) => (
        <group key={i} position={[x, 0.02, z]} scale={0.9 + (i % 3) * 0.15}>
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.028, 0.04, 0.16, 5]} />
            <meshStandardMaterial color="#8a5a32" />
          </mesh>
          <mesh position={[0, 0.22, 0]}>
            <icosahedronGeometry args={[0.12, 0]} />
            <meshStandardMaterial color={i % 2 ? "#6bc44a" : "#3e9a38"} />
          </mesh>
          <mesh position={[0, 0.32, 0]} scale={[0.7, 0.8, 0.7]}>
            <icosahedronGeometry args={[0.09, 0]} />
            <meshStandardMaterial color="#9be06a" />
          </mesh>
        </group>
      ))}
    </>
  );
}
function Base({ ocean = false }: { ocean?: boolean }) {
  return (
    <group>
      <mesh position={[0, -0.3, 0]}>
        <boxGeometry args={[3.4, 0.14, 3.4]} />
        <meshStandardMaterial color="#6b4128" roughness={0.9} />
      </mesh>
      <mesh position={[0, -0.18, 0]}>
        <boxGeometry args={[3.22, 0.12, 3.22]} />
        <meshStandardMaterial color="#e6c98a" roughness={0.86} />
      </mesh>
      <mesh position={[0, -0.06, 0]}>
        <boxGeometry args={[3.04, 0.14, 3.04]} />
        <meshStandardMaterial color="#86d456" roughness={0.78} />
      </mesh>
      {ocean && (
        <mesh position={[0.85, 0.03, 0.55]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.38, 18]} />
          <meshStandardMaterial color="#67d4ef" roughness={0.3} />
        </mesh>
      )}
      <Grove />
    </group>
  );
}
function Ponte() {
  return (
    <>
      <mesh position={[0, 0.16, 0]}>
        <boxGeometry args={[1.15, 0.28, 0.85]} />
        <meshStandardMaterial color="#f7f6f3" roughness={0.7} />
      </mesh>
      <Cylinder p={[0, 1.25, 0]} a={[0.16, 0.26, 2.15, 20]} c="#f7f7f5" />
      <Cylinder p={[0, 1.95, 0]} a={[0.4, 0.4, 0.2, 24]} c="#5ec8e8" />
      <Cylinder p={[0, 2.12, 0]} a={[0.46, 0.46, 0.12, 24]} c="#ffffff" />
      <Cylinder p={[0, 2.28, 0]} a={[0.38, 0.38, 0.16, 24]} c="#5ec8e8" />
      <Cylinder p={[0, 2.55, 0]} a={[0.08, 0.14, 0.42, 12]} c="#f7f7f5" />
      <Cylinder p={[0, 2.82, 0]} a={[0.045, 0.045, 0.16, 8]} c="#e23d3a" />
      {Array.from({ length: 5 }, (_, i) => (
        <mesh key={i} position={[0.175, 0.62 + i * 0.34, 0]}>
          <boxGeometry args={[0.015, 0.12, 0.16]} />
          <meshStandardMaterial
            color="#d7f3ff"
            emissive="#7ec8e8"
            emissiveIntensity={0.45}
            roughness={0.28}
          />
        </mesh>
      ))}
      {[-0.42, 0.42].map((x) => (
        <Box key={x} p={[x, 0.22, 0.48]} s={[0.22, 0.16, 0.08]} c={windowBlue} />
      ))}
    </>
  );
}
function Bridge() {
  return (
    <>
      <Box p={[0, 0.38, 0]} s={[2.8, 0.13, 0.5]} c={dark} />
      <Box p={[0, 0.45, 0]} s={[2.8, 0.02, 0.05]} c="#e6d482" />
      {[-0.9, 0.6].map((x) => (
        <group key={x}>
          <Cylinder p={[x, 0.99, 0]} a={[0.045, 0.065, 1.5, 8]} c={windowBlue} />
          {Array.from({ length: 8 }, (_, i) => {
            const z = -1.35 + i * 0.38;
            return <Cable key={i} from={[x, 1.7, 0]} to={[z, 0.46, 0.2]} width={0.009} />;
          })}
          <Cylinder p={[x, 0.15, 0]} a={[0.1, 0.14, 0.3, 6]} c={sand} />
        </group>
      ))}
      <Box p={[-0.3, 0.54, 0.1]} s={[0.22, 0.1, 0.1]} c={windowBlue} />
      <Box p={[0.5, 0.54, -0.12]} s={[0.2, 0.1, 0.1]} c="#d9a473" />
    </>
  );
}
function Towers() {
  return (
    <>
      {[-0.6, 0.6].map((x, i) => (
        <group key={x}>
          <Cylinder p={[x, 0.72, 0]} a={[0.39, 0.48, 1.4, 18]} c={i ? "#b3c9b0" : "#d0a86f"} />
          {[0.3, 0.55, 0.8, 1.05].map((y, j) => (
            <Cylinder
              key={y}
              p={[x, y, 0]}
              a={[0.4 - j * 0.007, 0.41 - j * 0.007, 0.11, 18]}
              c={[windowBlue, "#ddb19d", "#93a1bf", "#dfc659"][(i + j) % 4]}
            />
          ))}
          <Cylinder p={[x, 1.47, 0]} a={[0.41, 0.4, 0.06, 18]} c={dark} />
          <Cylinder p={[x, 1.51, 0]} a={[0.32, 0.32, 0.025, 18]} c="#8b927d" />
        </group>
      ))}
      <Cable from={[-0.6, 1.5, 0]} to={[0.6, 1.5, 0]} width={0.04} c={dark} />
    </>
  );
}
function Mountain({ reduced }: { reduced: boolean }) {
  const geometry = useMemo(() => {
    const points = [
      [-1.3, 0, 0.65],
      [1.3, 0, 0.65],
      [1.4, 0, -0.65],
      [-1.3, 0, -0.65],
      [-0.92, 1.05, 0.4],
      [0.92, 1.05, 0.4],
      [0.85, 1.05, -0.4],
      [-0.9, 1.05, -0.4],
    ];
    const faces = [
      0, 1, 5, 0, 5, 4, 1, 2, 6, 1, 6, 5, 2, 3, 7, 2, 7, 6, 3, 0, 4, 3, 4, 7, 4, 5, 6, 4, 6, 7,
    ];
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        faces.flatMap((i) => points[i]),
        3,
      ),
    );
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <>
      <mesh geometry={geometry}>
        <meshStandardMaterial color="#9caa85" side={THREE.DoubleSide} />
      </mesh>
      {[-0.7, -0.35, 0, 0.35, 0.7].map((x, i) => (
        <Box
          key={x}
          p={[x, 0.5, 0.5]}
          s={[0.05, 0.6 + (i % 2) * 0.15, 0.07]}
          c="#c1c4a2"
          r={[0, 0, 0.12]}
        />
      ))}
      <Box p={[0, 1.06, 0]} s={[1.82, 0.035, 0.8]} c="#c8cdb2" />
      <Float
        autoInvalidate={!reduced}
        speed={reduced ? 0 : 1.4}
        floatIntensity={0.1}
        rotationIntensity={0.05}
      >
        {[-0.5, -0.2, 0.15, 0.45].map((x) => (
          <mesh key={x} position={[x, 1.35, 0]} scale={[1.6, 0.4, 1]}>
            <icosahedronGeometry args={[0.3, 1]} />
            <meshStandardMaterial color={cream} />
          </mesh>
        ))}
      </Float>
      <Cable from={[-0.7, 1.13, 0.5]} to={[-1.3, 0.3, 0.9]} width={0.008} c={dark} />
      <Box p={[-1, 0.64, 0.71]} s={[0.15, 0.2, 0.14]} c={windowBlue} />
    </>
  );
}
function BoKaap() {
  return (
    <>
      {[-1, -0.5, 0, 0.5, 1].map((x, i) => (
        <group key={x} position={[x, 0, (i % 2) * 0.2]}>
          <Box p={[0, 0.4, 0]} s={[0.46, 0.8, 0.62]} c={i % 2 ? "#f8d7bc" : peach} />
          <Box p={[0, 0.88, 0]} s={[0.5, 0.12, 0.68]} c={roof} />
          <Box p={[-0.1, 0.48, 0.32]} s={[0.1, 0.16, 0.02]} c={windowBlue} />
          <Box p={[0.12, 0.48, 0.32]} s={[0.1, 0.16, 0.02]} c={windowBlue} />
          <Box p={[0, 0.22, 0.34]} s={[0.12, 0.22, 0.02]} c="#fff6ea" />
          <Box p={[-0.1, 0.08, 0.4]} s={[0.23, 0.12, 0.2]} c={sand} />
        </group>
      ))}
      <Box p={[0, 0.015, 0.7]} s={[2.65, 0.04, 0.3]} c={dark} />
    </>
  );
}
function Lighthouse({ cape = false, reduced = false }: { cape?: boolean; reduced?: boolean }) {
  return (
    <>
      {cape && (
        <mesh position={[0, 0.3, 0]} scale={[1.2, 0.5, 1]}>
          <dodecahedronGeometry args={[0.9, 0]} />
          <meshStandardMaterial color="#96a586" />
        </mesh>
      )}
      <group position={[0, cape ? 0.55 : 0, 0]}>
        <Cylinder p={[0, 0.6, 0]} a={[0.18, 0.31, 1.2, 12]} />
        <Cylinder p={[0, 0.55, 0]} a={[0.245, 0.275, 0.22, 12]} c={windowBlue} />
        <Cylinder p={[0, 1.22, 0]} a={[0.3, 0.3, 0.09, 12]} c={dark} />
        <Cylinder p={[0, 1.4, 0]} a={[0.18, 0.18, 0.25, 8]} c="#86bccb" />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * Math.PI) / 4;
          return (
            <Cylinder
              key={i}
              p={[Math.sin(a) * 0.19, 1.39, Math.cos(a) * 0.19]}
              a={[0.012, 0.012, 0.28, 4]}
              c={dark}
            />
          );
        })}
        <mesh position={[0, 1.62, 0]}>
          <coneGeometry args={[0.34, 0.23, 12]} />
          <meshStandardMaterial color="#e23d3a" />
        </mesh>
        <Cylinder p={[0, 1.8, 0]} a={[0.01, 0.015, 0.18, 6]} c={dark} />
        <Float autoInvalidate={!reduced} speed={reduced ? 0 : 1} floatIntensity={0.08}>
          <mesh position={[0.42, 1.39, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[0.25, 0.55, 12]} />
            <meshBasicMaterial color="#efd08a" transparent opacity={0.16} />
          </mesh>
        </Float>
      </group>
    </>
  );
}
function Stadium() {
  return (
    <>
      <Cylinder p={[0, 0.18, 0]} a={[1.3, 1.2, 0.32, 32]} c={cream} />
      <Cylinder p={[0, 0.35, 0]} a={[1.05, 1.05, 0.03, 32]} c="#839b78" />
      <Box p={[0, 0.39, 0]} s={[1.1, 0.02, 0.65]} c="#acbc87" />
      <mesh position={[0, 0.34, 0]}>
        <torusGeometry args={[1.05, 0.075, 8, 48, Math.PI]} />
        <meshStandardMaterial color="#ff7a59" roughness={0.42} />
      </mesh>
      <mesh position={[0, 1.28, 0]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color="#fff6ea" roughness={0.35} />
      </mesh>
      <Cable from={[0, 1.28, 0]} to={[0, 1.39, 0]} width={0.008} c={dark} />
      {Array.from({ length: 11 }, (_, i) => {
        const a = ((i + 0.5) / 12) * Math.PI;
        return (
          <Cable
            key={i}
            from={[Math.cos(a) * 1.05, 0.34 + Math.sin(a) * 1.05, 0]}
            to={[Math.cos(a) * 1.05, 0.32, 0.65]}
            width={0.008}
            c="#b8bfad"
          />
        );
      })}
      {Array.from({ length: 24 }, (_, i) => {
        const a = (i / 24) * Math.PI * 2;
        return (
          <Cylinder
            key={i}
            p={[Math.cos(a) * 1.22, 0.2, Math.sin(a) * 1.22]}
            a={[0.012, 0.018, 0.36, 4]}
            c="#adb9ad"
          />
        );
      })}
    </>
  );
}
function Ushaka({ reduced }: { reduced: boolean }) {
  return (
    <>
      <Box p={[0, 0.08, 0]} s={[2.1, 0.16, 1.25]} c="#7aafc3" />
      <mesh position={[0, 0.32, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 0.4, 0.6]}>
        <cylinderGeometry args={[0.65, 0.3, 2, 8]} />
        <meshStandardMaterial color={sand} />
      </mesh>
      <Box p={[0, 0.4, 0]} s={[0.65, 0.35, 0.6]} c={cream} />
      <Cylinder p={[0, 0.85, 0]} a={[0.025, 0.025, 0.9, 6]} c={dark} />
      <Box p={[0.15, 1.05, 0]} s={[0.3, 0.18, 0.025]} c={windowBlue} />
      <Float autoInvalidate={!reduced} speed={reduced ? 0 : 1.5} floatIntensity={0.1}>
        <mesh position={[0.55, 0.43, 0.53]} rotation={[0, 0, -0.3]} scale={[1, 0.4, 0.35]}>
          <icosahedronGeometry args={[0.34, 1]} />
          <meshStandardMaterial color="#5383a4" />
        </mesh>
      </Float>
    </>
  );
}
function Stars({ reduced }: { reduced: boolean }) {
  return (
    <Float
      autoInvalidate={!reduced}
      speed={reduced ? 0 : 1.4}
      floatIntensity={0.2}
      rotationIntensity={0.2}
    >
      {[-0.7, 0.2, 0.7].map((x, i) => (
        <mesh key={x} position={[x, 1.25 + (i % 2) * 0.25, -0.2]}>
          <octahedronGeometry args={[0.1, 0]} />
          <meshStandardMaterial color={i ? windowBlue : "#dbc381"} />
        </mesh>
      ))}
    </Float>
  );
}
function Ferris({ reduced }: { reduced: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const { invalidate } = useThree();
  useEffect(() => {
    if (reduced || !ref.current) return;
    const tween = gsap.to(ref.current.rotation, {
      z: Math.PI * 2,
      duration: 28,
      repeat: -1,
      ease: "none",
      onUpdate: invalidate,
    });
    return () => {
      tween.kill();
    };
  }, [reduced, invalidate]);
  return (
    <>
      <group position={[0, 0.94, 0]} ref={ref}>
        <mesh>
          <torusGeometry args={[0.88, 0.035, 6, 32]} />
          <meshStandardMaterial color={dark} />
        </mesh>
        {Array.from({ length: 10 }, (_, i) => {
          const a = (i / 10) * Math.PI * 2,
            x = Math.cos(a) * 0.88,
            y = Math.sin(a) * 0.88;
          const cabin = ["#ff7a59", "#ffd166", "#7dce6a", "#f48cb6", "#c084fc"][i % 5];
          return (
            <group key={i}>
              <Cable from={[0, 0, 0]} to={[x, y, 0]} c={cream} width={0.014} />
              <Box p={[x, y, 0]} s={[0.22, 0.19, 0.2]} c={cabin} />
            </group>
          );
        })}
      </group>
      <Cable from={[-0.45, 0, 0.23]} to={[0, 0.94, 0]} c={dark} width={0.04} />
      <Cable from={[0.45, 0, 0.23]} to={[0, 0.94, 0]} c={dark} width={0.04} />
      <Cylinder p={[0, 0.94, 0.04]} a={[0.07, 0.07, 0.15, 8]} r={[Math.PI / 2, 0, 0]} c={sand} />
    </>
  );
}
function Giraffe() {
  return (
    <>
      <group position={[-0.4, 0, 0]}>
        <Box p={[0, 0.55, 0]} s={[0.55, 0.28, 0.25]} c="#dab676" />
        {[-0.18, 0.18].flatMap((x) =>
          [-0.08, 0.08].map((z) => (
            <Box key={x + "," + z} p={[x, 0.23, z]} s={[0.055, 0.45, 0.055]} c="#cda264" />
          )),
        )}
        <Box p={[0.24, 0.94, 0]} s={[0.14, 0.72, 0.14]} c="#dab676" r={[0, 0, -0.14]} />
        <Box p={[0.31, 1.31, 0]} s={[0.28, 0.15, 0.16]} c="#dab676" />
        {[0.03, -0.03].map((z) => (
          <Cylinder key={z} p={[0.27, 1.45, z]} a={[0.018, 0.018, 0.18, 4]} c={dark} />
        ))}
        {[-0.16, 0.03, 0.2].map((x) => (
          <Box key={x} p={[x, 0.6, 0.13]} s={[0.08, 0.09, 0.01]} c="#947245" />
        ))}
      </group>
      <Cylinder p={[0.75, 0.6, -0.4]} a={[0.055, 0.09, 1.2, 6]} c="#7e7855" />
      <mesh position={[0.75, 1.25, -0.4]} scale={[1.8, 0.4, 1.2]}>
        <icosahedronGeometry args={[0.45, 0]} />
        <meshStandardMaterial color="#8c9e75" />
      </mesh>
    </>
  );
}
function Disco({ reduced }: { reduced: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const { invalidate } = useThree();
  useEffect(() => {
    if (reduced || !ref.current) return;
    const tween = gsap.to(ref.current.rotation, {
      y: Math.PI * 2,
      duration: 20,
      repeat: -1,
      ease: "none",
      onUpdate: invalidate,
    });
    return () => {
      tween.kill();
    };
  }, [reduced, invalidate]);
  return (
    <>
      <Cylinder p={[0, 1.6, 0]} a={[0.012, 0.012, 0.6, 4]} c={dark} />
      <mesh ref={ref} position={[0, 1.15, 0]}>
        <icosahedronGeometry args={[0.48, 2]} />
        <meshStandardMaterial color="#8ca5c9" metalness={0.7} roughness={0.26} flatShading />
      </mesh>
      {Array.from({ length: 16 }, (_, i) => (
        <Box
          key={i}
          p={[(i % 4) * 0.35 - 0.525, 0.015, Math.floor(i / 4) * 0.35 - 0.525]}
          s={[0.33, 0.045, 0.33]}
          c={i % 3 === 0 ? windowBlue : i % 3 === 1 ? "#b4bbd4" : "#dbccab"}
        />
      ))}
      <Stars reduced={reduced} />
    </>
  );
}
export function Alive({ children, reduced }: { children: ReactNode; reduced: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const { invalidate } = useThree();
  const [hover, setHover] = useState(false);
  const [held, setHeld] = useState(false);
  const primed = useRef(false);
  useFrame((state, delta) => {
    const node = ref.current;
    if (!node || reduced) return;
    const step = Math.min(delta, 0.05);
    const bob = held ? 0 : Math.sin(state.clock.elapsedTime * 0.9) * 0.045;
    node.position.y += (bob - node.position.y) * (1 - Math.exp(-step * 2.4));
    invalidate();
  });
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (!primed.current) {
      primed.current = true;
      return;
    }
    const squash = held ? 0.94 : hover ? 1.05 : 1;
    const tween = gsap.to(node.scale, {
      x: squash,
      y: held ? 0.9 : squash,
      z: squash,
      duration: reduced ? 0 : 0.35,
      ease: "back.out(2.2)",
      overwrite: "auto",
      onUpdate: invalidate,
    });
    return () => {
      tween.kill();
    };
  }, [hover, held, reduced, invalidate]);
  return (
    <group
      ref={ref}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHover(true);
      }}
      onPointerOut={() => {
        setHover(false);
        setHeld(false);
        if (!ref.current || reduced) return;
        gsap.to(ref.current.rotation, {
          x: 0,
          z: 0,
          duration: 0.45,
          overwrite: "auto",
          onUpdate: invalidate,
        });
      }}
      onPointerDown={() => setHeld(true)}
      onPointerUp={() => setHeld(false)}
      onPointerMove={(event) => {
        if (!ref.current || reduced) return;
        gsap.to(ref.current.rotation, {
          x: THREE.MathUtils.clamp(event.point.z * 0.05, -0.14, 0.14),
          z: THREE.MathUtils.clamp(-event.point.x * 0.05, -0.16, 0.16),
          duration: 0.3,
          overwrite: "auto",
          onUpdate: invalidate,
        });
      }}
    >
      {children}
    </group>
  );
}
function Contact() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.11, 0]} raycast={() => null}>
      <circleGeometry args={[1.22, 36]} />
      <meshBasicMaterial color="#1a140f" transparent opacity={0.2} depthWrite={false} />
    </mesh>
  );
}
function Spark({ reduced, color }: { reduced: boolean; color: string }) {
  const ref = useRef<THREE.Group>(null);
  const { invalidate } = useThree();
  useFrame((_, delta) => {
    if (reduced || !ref.current) return;
    ref.current.rotation.y += Math.min(delta, 0.05) * 0.5;
    invalidate();
  });
  return (
    <group ref={ref}>
      <mesh position={[1.22, 1.25, 0]}>
        <octahedronGeometry args={[0.065, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.85}
          roughness={0.28}
        />
      </mesh>
    </group>
  );
}
function Bird({ reduced, color = "#f7f3ea" }: { reduced: boolean; color?: string }) {
  const ref = useRef<THREE.Group>(null);
  const { invalidate } = useThree();
  useFrame((state, delta) => {
    if (reduced || !ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.set(
      Math.cos(t * 0.55) * 1.2,
      1.62 + Math.sin(t * 1.5) * 0.07,
      Math.sin(t * 0.55) * 0.72,
    );
    ref.current.rotation.y = -t * 0.55 + Math.PI / 2;
    if (delta > 0) invalidate();
  });
  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[0.042, 10, 10]} />
        <meshStandardMaterial color={color} roughness={0.45} />
      </mesh>
      <mesh position={[0.055, 0.01, 0]} rotation={[0, 0, 0.5]}>
        <coneGeometry args={[0.028, 0.07, 6]} />
        <meshStandardMaterial color={color} roughness={0.45} />
      </mesh>
    </group>
  );
}
export function Landmark({
  city,
  index,
  reduced,
}: {
  city: number;
  index: number;
  reduced: boolean;
}) {
  const key = city * 3 + index;
  const accent = city === 1 ? "#8ec8ff" : city === 2 ? "#7ee0c8" : "#ffd27a";
  return (
    <group>
      <Contact />
      <Alive reduced={reduced}>
        <group>
          <Base ocean={city === 2} />
          {key === 0 ? (
            <Ponte />
          ) : key === 1 ? (
            <Bridge />
          ) : key === 2 ? (
            <Towers />
          ) : key === 3 ? (
            <Mountain reduced={reduced} />
          ) : key === 4 ? (
            <BoKaap />
          ) : key === 5 ? (
            <Lighthouse cape reduced={reduced} />
          ) : key === 6 ? (
            <Stadium />
          ) : key === 7 ? (
            <Ushaka reduced={reduced} />
          ) : (
            <Lighthouse reduced={reduced} />
          )}
        </group>
      </Alive>
      <Spark reduced={reduced} color={accent} />
      {index === 2 && <Bird reduced={reduced} color={accent} />}
    </group>
  );
}
export function CategoryModel({ index, reduced }: { index: number; reduced: boolean }) {
  const accent = ["#ff7a59", "#f3c7a6", "#c084fc", "#7dce6a", "#ffd166"][index] || "#ffd166";
  return (
    <group>
      <Contact />
      <Alive reduced={reduced}>
        <group>
          <Base />
          {index === 0 ? (
            <Ferris reduced={reduced} />
          ) : index === 1 ? (
            <>
              <Box p={[0, 0.28, 0]} s={[1.55, 0.42, 1.05]} c={peach} />
              <Box p={[0, 0.56, 0]} s={[1.65, 0.12, 1.15]} c={roof} />
              <Box p={[-0.7, 0.55, 0]} s={[0.1, 0.9, 1.1]} c={peach} />
              {[-0.25, 0.25].map((z) => (
                <Box key={z} p={[-0.44, 0.5, z]} s={[0.28, 0.18, 0.28]} c={windowBlue} />
              ))}
              <Box p={[0.35, 0.48, 0.54]} s={[0.22, 0.22, 0.02]} c={windowBlue} />
              <mesh position={[0.72, 0.08, 0.42]}>
                <sphereGeometry args={[0.05, 12, 12]} />
                <meshStandardMaterial color="#ffe7a8" emissive="#ffd166" emissiveIntensity={0.6} />
              </mesh>
              <Stars reduced={reduced} />
            </>
          ) : index === 2 ? (
            <>
              <Box p={[0, 0.12, 0]} s={[2, 0.22, 1.2]} c={peach} />
              {[-0.8, 0.8].map((x) => (
                <Box key={x} p={[x, 0.85, -0.1]} s={[0.35, 1.45, 0.2]} c={peach} />
              ))}
              <Box p={[0, 1.55, -0.1]} s={[2.1, 0.16, 0.28]} c={roof} />
              <Cylinder p={[0, 0.47, 0.1]} a={[0.04, 0.04, 0.7, 8]} c={dark} />
              <mesh position={[0, 0.83, 0.1]}>
                <sphereGeometry args={[0.07, 12, 12]} />
                <meshStandardMaterial color="#d3cdb3" roughness={0.4} />
              </mesh>
              <Box p={[0, 0.42, 0.62]} s={[0.55, 0.7, 0.04]} c="#6d4c7d" />
              <Stars reduced={reduced} />
            </>
          ) : index === 3 ? (
            <Giraffe />
          ) : (
            <Disco reduced={reduced} />
          )}
        </group>
      </Alive>
      <Spark reduced={reduced} color={accent} />
      {index === 3 && <Bird reduced={reduced} color={accent} />}
    </group>
  );
}
