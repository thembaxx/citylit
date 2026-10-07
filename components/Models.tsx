"use client";
import { useEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
const blue = "#3454ee",
  dark = "#35414c",
  ivory = "#ede9d7",
  sand = "#c6be99";
type V = [number, number, number];
function Box({
  p = [0, 0, 0],
  s = [1, 1, 1],
  c = ivory,
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
      <meshStandardMaterial color={c} flatShading roughness={0.8} />
    </mesh>
  );
}
function Cylinder({
  p = [0, 0, 0],
  a = [0.2, 0.2, 1, 12],
  c = ivory,
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
      <meshStandardMaterial color={c} flatShading />
    </mesh>
  );
}
function Cable({
  from,
  to,
  c = ivory,
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
function Trees() {
  const ref = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    if (!ref.current) return;
    const m = new THREE.Object3D();
    Array.from({ length: 12 }, (_, i) => {
      const angle = i * 2.4,
        r = 1.28 + (i % 3) * 0.13;
      m.position.set(Math.sin(angle) * r, 0.23, Math.cos(angle) * r);
      m.scale.setScalar(0.13 + (i % 3) * 0.03);
      m.updateMatrix();
      ref.current!.setMatrixAt(i, m.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, 12]}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#8c9e75" flatShading />
    </instancedMesh>
  );
}
function Base({ ocean = false }: { ocean?: boolean }) {
  return (
    <>
      <Cylinder p={[0, -0.13, 0]} a={[1.65, 1.72, 0.22, 12]} c={ocean ? "#91bcc8" : "#d6d3b4"} />
      <Cylinder p={[0, -0.27, 0]} a={[1.72, 1.64, 0.12, 12]} c="#a7b394" />
      {!ocean && <Trees />}
    </>
  );
}
function Windows() {
  const ref = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const obj = new THREE.Object3D();
    let n = 0;
    for (let row = 0; row < 15; row++)
      for (let col = 0; col < 24; col++) {
        const angle = (col / 24) * Math.PI * 2;
        obj.position.set(Math.sin(angle) * 0.505, 0.18 + row * 0.115, Math.cos(angle) * 0.505);
        obj.rotation.y = angle;
        obj.scale.set(0.07, 0.065, 0.012);
        obj.updateMatrix();
        mesh.setMatrixAt(n++, obj.matrix);
      }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, 360]}>
      <boxGeometry />
      <meshStandardMaterial color="#465a67" roughness={0.4} />
    </instancedMesh>
  );
}
function Ponte() {
  return (
    <>
      <Cylinder p={[0, 1, 0]} a={[0.5, 0.5, 2, 24]} c="#cecab6" />
      <Windows />
      <Cylinder p={[0, 2.04, 0]} a={[0.51, 0.51, 0.17, 24]} c={blue} />
      <Cylinder p={[0, 2.14, 0]} a={[0.42, 0.51, 0.08, 24]} c={ivory} />
      <Cylinder p={[0, 2.19, 0]} a={[0.24, 0.24, 0.02, 24]} c={dark} />
      {[-0.95, 0.95].map((x, i) => (
        <group key={x}>
          <Box p={[x, 0.22, 0.35]} s={[0.43, 0.44, 0.5]} c={i ? "#b6b9ac" : "#bfc4b7"} />
          {[-0.1, 0.1].map((z) => (
            <Box key={z} p={[x, 0.2, 0.61]} s={[0.065, 0.2, 0.01]} c={dark} />
          ))}
        </group>
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
          <Cylinder p={[x, 0.99, 0]} a={[0.045, 0.065, 1.5, 8]} c={blue} />
          {Array.from({ length: 8 }, (_, i) => {
            const z = -1.35 + i * 0.38;
            return <Cable key={i} from={[x, 1.7, 0]} to={[z, 0.46, 0.2]} width={0.009} />;
          })}
          <Cylinder p={[x, 0.15, 0]} a={[0.1, 0.14, 0.3, 6]} c={sand} />
        </group>
      ))}
      <Box p={[-0.3, 0.54, 0.1]} s={[0.22, 0.1, 0.1]} c={blue} />
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
              c={[blue, "#ddb19d", "#93a1bf", "#dfc659"][(i + j) % 4]}
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
        <meshStandardMaterial color="#9caa85" flatShading side={THREE.DoubleSide} />
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
            <meshStandardMaterial color={ivory} flatShading />
          </mesh>
        ))}
      </Float>
      <Cable from={[-0.7, 1.13, 0.5]} to={[-1.3, 0.3, 0.9]} width={0.008} c={dark} />
      <Box p={[-1, 0.64, 0.71]} s={[0.15, 0.2, 0.14]} c={blue} />
    </>
  );
}
function BoKaap() {
  return (
    <>
      {[-1, -0.5, 0, 0.5, 1].map((x, i) => (
        <group key={x} position={[x, 0, (i % 2) * 0.2]}>
          <Box
            p={[0, 0.4, 0]}
            s={[0.46, 0.8, 0.62]}
            c={["#e4a295", "#d3c171", "#6eafbd", blue, "#b4bf78"][i]}
          />
          <Box p={[0, 0.86, 0]} s={[0.5, 0.06, 0.66]} />
          <Box p={[-0.1, 0.35, 0.316]} s={[0.12, 0.36, 0.015]} c={dark} />
          <Box p={[0.12, 0.54, 0.32]} s={[0.11, 0.16, 0.02]} c="#dfdfc9" />
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
          <meshStandardMaterial color="#96a586" flatShading />
        </mesh>
      )}
      <group position={[0, cape ? 0.55 : 0, 0]}>
        <Cylinder p={[0, 0.6, 0]} a={[0.18, 0.31, 1.2, 12]} />
        <Cylinder p={[0, 0.55, 0]} a={[0.245, 0.275, 0.22, 12]} c={blue} />
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
          <meshStandardMaterial color={blue} flatShading />
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
      <Cylinder p={[0, 0.18, 0]} a={[1.3, 1.2, 0.32, 32]} c={ivory} />
      <Cylinder p={[0, 0.35, 0]} a={[1.05, 1.05, 0.03, 32]} c="#839b78" />
      <Box p={[0, 0.39, 0]} s={[1.1, 0.02, 0.65]} c="#acbc87" />
      <mesh position={[0, 0.34, 0]}>
        <torusGeometry args={[1.05, 0.075, 6, 40, Math.PI]} />
        <meshStandardMaterial color={blue} />
      </mesh>
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
        <meshStandardMaterial color={sand} flatShading />
      </mesh>
      <Box p={[0, 0.4, 0]} s={[0.65, 0.35, 0.6]} c={ivory} />
      <Cylinder p={[0, 0.85, 0]} a={[0.025, 0.025, 0.9, 6]} c={dark} />
      <Box p={[0.15, 1.05, 0]} s={[0.3, 0.18, 0.025]} c={blue} />
      <Float autoInvalidate={!reduced} speed={reduced ? 0 : 1.5} floatIntensity={0.1}>
        <mesh position={[0.55, 0.43, 0.53]} rotation={[0, 0, -0.3]} scale={[1, 0.4, 0.35]}>
          <icosahedronGeometry args={[0.34, 1]} />
          <meshStandardMaterial color="#5383a4" flatShading />
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
          <meshStandardMaterial color={i ? blue : "#dbc381"} flatShading />
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
          <meshStandardMaterial color={blue} />
        </mesh>
        {Array.from({ length: 10 }, (_, i) => {
          const a = (i / 10) * Math.PI * 2,
            x = Math.cos(a) * 0.88,
            y = Math.sin(a) * 0.88;
          return (
            <group key={i}>
              <Cable from={[0, 0, 0]} to={[x, y, 0]} c={ivory} width={0.014} />
              <Box p={[x, y, 0]} s={[0.22, 0.19, 0.2]} c={i % 2 ? blue : "#dab58b"} />
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
        <meshStandardMaterial color="#8c9e75" flatShading />
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
          c={i % 3 === 0 ? blue : i % 3 === 1 ? "#b4bbd4" : "#dbccab"}
        />
      ))}
      <Stars reduced={reduced} />
    </>
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
  return (
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
  );
}
export function CategoryModel({ index, reduced }: { index: number; reduced: boolean }) {
  return (
    <group>
      <Base />
      {index === 0 ? (
        <Ferris reduced={reduced} />
      ) : index === 1 ? (
        <>
          <Box p={[0, 0.23, 0]} s={[1.5, 0.3, 1]} c={blue} />
          <Box p={[0, 0.45, 0]} s={[1.45, 0.13, 0.95]} />
          <Box p={[-0.7, 0.5, 0]} s={[0.1, 0.85, 1.1]} c={dark} />
          {[-0.25, 0.25].map((z) => (
            <Box key={z} p={[-0.44, 0.57, z]} s={[0.35, 0.12, 0.4]} c="#b4c5c6" />
          ))}
          <Box p={[0.4, 0.55, 0]} s={[0.6, 0.06, 1]} c="#bacbb8" />
          <Stars reduced={reduced} />
        </>
      ) : index === 2 ? (
        <>
          <Box p={[0, 0.12, 0]} s={[2, 0.22, 1.2]} c={dark} />
          {[-0.8, 0.8].map((x) => (
            <Box key={x} p={[x, 0.85, -0.1]} s={[0.35, 1.45, 0.2]} c={blue} />
          ))}
          <Box p={[0, 1.55, -0.1]} s={[2, 0.2, 0.2]} c={blue} />
          <Cylinder p={[0, 0.47, 0.1]} a={[0.04, 0.04, 0.7, 8]} c={dark} />
          <mesh position={[0, 0.83, 0.1]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshStandardMaterial color="#d3cdb3" />
          </mesh>
          <Stars reduced={reduced} />
        </>
      ) : index === 3 ? (
        <Giraffe />
      ) : (
        <Disco reduced={reduced} />
      )}
    </group>
  );
}
