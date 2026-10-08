"use client";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { cities } from "../lib/data";
const colors = [
  "#b3a5ef",
  "#80b9d8",
  "#e6a487",
  "#b8c9aa",
  "#e1b55f",
  "#88c9b4",
  "#dfa8c2",
  "#9ea9e7",
  "#d2bf8d",
];
function Block({
  p = [0, 0, 0],
  s = [1, 1, 1],
  color = "#eee9d9",
}: {
  p?: [number, number, number];
  s?: [number, number, number];
  color?: string;
}) {
  return (
    <mesh position={p} scale={s}>
      <boxGeometry />
      <meshStandardMaterial color={color} flatShading />
    </mesh>
  );
}
function Tree({ x, z, color }: { x: number; z: number; color: string }) {
  return (
    <group position={[x, 0, z]}>
      <Block p={[0, 0.35, 0]} s={[0.09, 0.7, 0.09]} color="#79634c" />
      <mesh position={[0, 0.85, 0]}>
        <icosahedronGeometry args={[0.36, 0]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
    </group>
  );
}
function Signature({ model, index, tone }: { model: string; index: number; tone: string }) {
  if (model === "monument" && index === 0)
    return (
      <group>
        {[0, 1, 2].map((i) => (
          <Block
            key={i}
            p={[0, 0.12 + i * 0.12, 0]}
            s={[1.9 - i * 0.35, 0.15, 1.25 - i * 0.2]}
            color={i === 2 ? tone : "#d4d2bf"}
          />
        ))}
        <mesh position={[-0.55, 0.85, -0.15]}>
          <cylinderGeometry args={[0.14, 0.2, 1.2, 8]} />
          <meshStandardMaterial color="#a8855c" flatShading />
        </mesh>
        <mesh position={[-0.55, 1.58, -0.15]}>
          <coneGeometry args={[0.14, 0.4, 5]} />
          <meshStandardMaterial color="#f3b44c" flatShading />
        </mesh>
        <Block p={[0.5, 0.65, -0.2]} s={[0.85, 0.6, 0.55]} color="#ebe6d5" />
        {[-0.1, 0.2, 0.5].map((x) => (
          <Block key={x} p={[x, 0.72, 0.1]} s={[0.07, 0.45, 0.07]} color={tone} />
        ))}
        <Tree x={1.15} z={0.3} color="#a1b688" />
      </group>
    );
  if (model === "monument" && index === 1)
    return (
      <group>
        <Block p={[0, 0.4, 0]} s={[2.2, 0.7, 0.55]} color="#d7ba8c" />
        {[-1, 1].map((x) => (
          <group key={x}>
            <Block p={[x, 0.85, 0]} s={[0.35, 1.35, 0.7]} color="#e3cca8" />
            <mesh position={[x, 1.62, 0]}>
              <coneGeometry args={[0.3, 0.32, 8]} />
              <meshStandardMaterial color="#8da292" />
            </mesh>
          </group>
        ))}
        {[-0.7, -0.35, 0, 0.35, 0.7].map((x) => (
          <Block key={x} p={[x, 0.56, 0.31]} s={[0.08, 0.65, 0.08]} color="#eee7d5" />
        ))}
        {[0, 1, 2].map((i) => (
          <Block
            key={i}
            p={[0, 0.1, 0.5 + i * 0.2]}
            s={[1.8 - i * 0.2, 0.08, 0.16]}
            color="#a9ba8a"
          />
        ))}
      </group>
    );
  if (model === "hall" && index === 0)
    return (
      <group>
        <Block p={[0, 0.45, 0]} s={[1.8, 0.85, 0.85]} color="#b97765" />
        <Block p={[0, 1.13, 0]} s={[0.48, 1.8, 0.5]} color="#b97765" />
        <mesh position={[0, 1.69, 0.26]}>
          <circleGeometry args={[0.18, 16]} />
          <meshStandardMaterial color="#f5efda" />
        </mesh>
        <Block p={[0, 1.75, 0.29]} s={[0.025, 0.15, 0.02]} color="#394959" />
        <Block p={[0.06, 1.7, 0.29]} s={[0.12, 0.025, 0.02]} color="#394959" />
        <mesh position={[0, 2.18, 0]}>
          <coneGeometry args={[0.38, 0.5, 4]} />
          <meshStandardMaterial color="#72948f" flatShading />
        </mesh>
        {[-0.7, -0.35, 0.35, 0.7].map((x) => (
          <Block key={x} p={[x, 0.48, 0.44]} s={[0.1, 0.6, 0.05]} color="#e3d6bd" />
        ))}
      </group>
    );
  if (model === "gables" && (index === 0 || index === 2))
    return (
      <group>
        {[-0.8, 0, 0.8].map((x, i) => (
          <group key={x} position={[x, 0, (i % 2) * 0.2]}>
            <Block p={[0, 0.42, 0]} s={[0.7, 0.8, 0.65]} color={i === 1 ? tone : "#eee7d7"} />
            <mesh position={[0, 0.92, 0]} rotation={[0, Math.PI / 4, 0]} scale={[1, 1, 0.8]}>
              <coneGeometry args={[0.55, 0.45, 4]} />
              <meshStandardMaterial color="#a69178" flatShading />
            </mesh>
            <Block p={[0, 0.24, 0.34]} s={[0.15, 0.42, 0.06]} color="#7c9fa5" />
          </group>
        ))}
        <Block p={[0, 0.1, 0.7]} s={[2.5, 0.05, 0.25]} color="#bcb6a7" />
      </group>
    );
  if (model === "village" && index === 0)
    return (
      <group>
        {[
          [-0.65, 0.1],
          [0.6, 0.2],
          [0, -0.6],
        ].map(([x, z], i) => (
          <group key={i} position={[x, 0, z]}>
            <mesh position={[0, 0.38, 0]}>
              <cylinderGeometry args={[0.36, 0.39, 0.7, 10]} />
              <meshStandardMaterial color="#d9b285" flatShading />
            </mesh>
            <mesh position={[0, 0.95, 0]}>
              <coneGeometry args={[0.5, 0.55, 10]} />
              <meshStandardMaterial color="#b99458" flatShading />
            </mesh>
            <Block p={[0, 0.2, 0.38]} s={[0.17, 0.35, 0.025]} color="#796954" />
          </group>
        ))}
        <Tree x={1.2} z={-0.5} color="#a8b58b" />
      </group>
    );
  if (model === "waterfall" && index === 1)
    return (
      <group>
        {[-0.85, -0.45, 0, 0.45, 0.85].map((x, i) => (
          <mesh
            key={x}
            position={[x, 0.4 + Math.sin((i / 4) * Math.PI) * 0.65, 0]}
            scale={[0.65, 0.65, 0.5]}
          >
            <dodecahedronGeometry args={[0.65, 0]} />
            <meshStandardMaterial color={i % 2 ? "#c1ab94" : "#d6c5af"} flatShading />
          </mesh>
        ))}
        <mesh position={[0, 0.55, 0.12]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.5, 12]} />
          <meshStandardMaterial color="#857c72" />
        </mesh>
        <Tree x={1.15} z={-0.4} color={tone} />
      </group>
    );
  if (model === "waterfall" && index === 2)
    return (
      <group>
        <mesh position={[0, 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.85, 0.25, 8, 24]} />
          <meshStandardMaterial color="#eee8d4" flatShading />
        </mesh>
        <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.65, 20]} />
          <meshStandardMaterial color="#9bb78b" />
        </mesh>
        {Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4).map((a) => (
          <Block
            key={a}
            p={[Math.cos(a) * 1.15, 0.85, Math.sin(a) * 1.15]}
            s={[0.075, 1.5, 0.075]}
            color="#edb758"
          />
        ))}
      </group>
    );
  return null;
}

export default function ExpandedLandmark({
  city,
  index,
  reduced,
}: {
  city: number;
  index: number;
  reduced: boolean;
}) {
  const ornament = useRef<THREE.Mesh>(null);
  const tone = colors[(city - 3) % colors.length];
  const model = cities[city].model;
  useFrame((_, delta) => {
    if (!reduced && ornament.current) ornament.current.rotation.y += delta * 0.2;
  });
  const garden = index === 1 && ["gables", "gallery", "waterfall", "grassland"].includes(model);
  const signature = Signature({ model, index, tone });
  return (
    <group>
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[1.6, 1.35, 0.28, 8]} />
        <meshStandardMaterial color="#ebe8d6" flatShading />
      </mesh>
      {signature ||
        (garden ? (
          <>
            <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.85, 10]} />
              <meshStandardMaterial color="#72adb5" />
            </mesh>
            {[-1, 1].map((x) => (
              <Tree key={x} x={x} z={-0.3} color={tone} />
            ))}
            <Block p={[0, 0.2, 0.7]} s={[1, 0.12, 0.2]} color="#b99268" />
          </>
        ) : model === "mine" && index === 0 ? (
          <>
            <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.7, 1.3, 12]} />
              <meshStandardMaterial color="#b69270" />
            </mesh>
            <mesh position={[0, 0.11, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.7, 12]} />
              <meshStandardMaterial color="#427b93" />
            </mesh>
            <Block p={[1, 0.75, 0]} s={[0.13, 1.5, 0.13]} color={tone} />
            <Block p={[0.5, 1.45, 0]} s={[1, 0.14, 0.14]} color={tone} />
          </>
        ) : model === "pyramid" && index === 0 ? (
          <>
            <mesh position={[-0.4, 0.65, 0]} rotation={[0, Math.PI / 4, 0]}>
              <coneGeometry args={[0.75, 1.2, 4]} />
              <meshStandardMaterial color="#cfa777" flatShading />
            </mesh>
            <mesh position={[0.8, 0.9, 0.2]}>
              <cylinderGeometry args={[0.14, 0.25, 1.7, 8]} />
              <meshStandardMaterial color="#f1ede0" />
            </mesh>
            <mesh position={[0.8, 1.85, 0.2]}>
              <coneGeometry args={[0.27, 0.27, 8]} />
              <meshStandardMaterial color={tone} />
            </mesh>
          </>
        ) : model === "waterfall" && index === 0 ? (
          <>
            <Block p={[-0.4, 0.65, -0.2]} s={[0.8, 1.3, 0.6]} color="#acbaaa" />
            <Block p={[0.35, 0.35, 0]} s={[0.6, 0.7, 0.7]} color="#bac9b5" />
            <Block p={[-0.1, 0.7, 0.16]} s={[0.2, 1.2, 0.13]} color="#83d2e0" />
            <Tree x={0.9} z={-0.4} color={tone} />
          </>
        ) : (
          <>
            <Block p={[0, 0.4, 0]} s={[1.8, 0.8, 1]} color={tone} />
            {[-0.7, 0, 0.7].map((x) => (
              <Block key={x} p={[x, 0.6, 0.52]} s={[0.13, 0.7, 0.12]} />
            ))}
            <Block p={[0, 0.9, 0]} s={[2, 0.15, 1.2]} />
            {model === "gables" || model === "village" ? (
              <mesh position={[0, 1.13, 0]} rotation={[0, Math.PI / 4, 0]} scale={[1.4, 1, 0.85]}>
                <coneGeometry args={[0.8, 0.55, 4]} />
                <meshStandardMaterial color="#a59687" flatShading />
              </mesh>
            ) : (
              <>
                <Block p={[0, 1.25, 0]} s={[0.55, 0.6, 0.55]} color={tone} />
                <mesh position={[0, 1.65, 0]}>
                  <coneGeometry args={[0.38, 0.35, 8]} />
                  <meshStandardMaterial color="#e8d5a4" flatShading />
                </mesh>
              </>
            )}
            <Tree x={-1.15} z={0.5} color="#adba88" />
            <Tree x={1.15} z={-0.3} color="#adba88" />
          </>
        ))}
      <mesh ref={ornament} position={[0.9, 1.9, -0.6]}>
        <octahedronGeometry args={[0.16, 0]} />
        <meshStandardMaterial color={tone} flatShading />
      </mesh>
    </group>
  );
}
