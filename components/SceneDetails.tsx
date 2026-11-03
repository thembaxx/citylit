"use client";

import * as THREE from "three";

/**
 * Original geometry-only detail accents for the nine classic dioramas
 * and five category scenes. These are creative illustrations rather than
 * measured representations of South African landmarks.
 */

function Trim({
  from,
  to,
  color = "#c4a67a",
  radius = 0.012,
}: {
  from: [number, number, number];
  to: [number, number, number];
  color?: string;
  radius?: number;
}) {
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const delta = end.clone().sub(start);
  const center = start.clone().add(end).multiplyScalar(0.5);
  const rotation = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    delta.clone().normalize(),
  );
  return (
    <mesh position={[center.x, center.y, center.z]} quaternion={rotation} castShadow>
      <cylinderGeometry args={[radius, radius, delta.length(), 8]} />
      <meshStandardMaterial color={color} metalness={0.24} roughness={0.5} />
    </mesh>
  );
}
function Inset({
  position,
  scale,
  color = "#53737b",
}: {
  position: [number, number, number];
  scale: [number, number, number];
  color?: string;
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={scale} />
      <meshPhysicalMaterial
        color={color}
        roughness={0.22}
        metalness={0.12}
        clearcoat={0.65}
        clearcoatRoughness={0.18}
      />
    </mesh>
  );
}

export function LandmarkDetails({ city, index }: { city: number; index: number }) {
  const key = city * 3 + (index % 3);
  if (key === 0) {
    return (
      <group>
        {Array.from({ length: 9 }, (_, i) => (
          <group key={i} position={[0, i * 0.205, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.23, 0.012, 5, 32]} />
              <meshStandardMaterial color="#b5ae99" metalness={0.16} roughness={0.52} />
            </mesh>
            {Array.from({ length: 12 }, (_, j) => {
              const angle = (j / 12) * Math.PI * 2;
              return (
                <Inset
                  key={j}
                  position={[Math.cos(angle) * 0.22, 0.01, Math.sin(angle) * 0.22]}
                  scale={[0.045, 0.12, 0.016]}
                  color="#577a80"
                />
              );
            })}
          </group>
        ))}
      </group>
    );
  }
  if (key === 1) {
    return (
      <group>
        {Array.from({ length: 12 }, (_, i) => {
          const x = -1.12 + i * 0.2;
          return (
            <group key={i}>
              <Inset position={[x, 0.33, 0.26]} scale={[0.045, 0.018, 0.015]} color="#e2d8c6" />
              <Trim from={[x, 0.18, -0.23]} to={[x, 0.43, -0.23]} radius={0.009} />
            </group>
          );
        })}
        <Trim from={[-1.2, 0.45, -0.23]} to={[1.2, 0.45, -0.23]} />
      </group>
    );
  }
  if (key === 2) {
    return (
      <group>
        {[-0.7, 0.7].flatMap((x) =>
          [0.35, 0.7, 1.05, 1.38].map((y) => (
            <mesh key={`${x}-${y}`} position={[x, y, 0]}>
              <torusGeometry args={[0.27, 0.015, 5, 28]} />
              <meshStandardMaterial color="#a88e78" roughness={0.7} />
            </mesh>
          )),
        )}
      </group>
    );
  }
  if (key === 3) {
    return (
      <group>
        {Array.from({ length: 17 }, (_, i) => (
          <mesh
            key={i}
            position={[Math.sin(i * 2.4) * 0.94, 0.46 + (i % 4) * 0.12, Math.cos(i * 1.8) * 0.62]}
            receiveShadow
          >
            <dodecahedronGeometry args={[0.09 + (i % 3) * 0.035, 0]} />
            <meshStandardMaterial color={i % 3 ? "#ad9784" : "#c9b59d"} roughness={0.98} />
          </mesh>
        ))}
      </group>
    );
  }
  if (key === 4) {
    return (
      <group>
        {[-0.62, 0, 0.62].map((x) => (
          <group key={x}>
            <Inset position={[x, 0.59, 0.56]} scale={[0.19, 0.23, 0.02]} />
            <Inset position={[x, 0.19, 0.56]} scale={[0.16, 0.28, 0.02]} color="#70493d" />
            <Trim from={[x - 0.13, 0.75, 0.58]} to={[x + 0.13, 0.75, 0.58]} />
          </group>
        ))}
      </group>
    );
  }
  if (key === 5 || key === 8) {
    return (
      <group>
        {[0.48, 0.87, 1.28].map((y) => (
          <mesh key={y} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.24, 0.013, 5, 28]} />
            <meshStandardMaterial color="#c4b79d" metalness={0.22} roughness={0.65} />
          </mesh>
        ))}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <Trim
              key={i}
              from={[Math.cos(a) * 0.33, 1.32, Math.sin(a) * 0.33]}
              to={[Math.cos(a) * 0.33, 1.58, Math.sin(a) * 0.33]}
            />
          );
        })}
      </group>
    );
  }
  if (key === 6) {
    return (
      <group>
        {Array.from({ length: 25 }, (_, i) => {
          const a = (i / 25) * Math.PI * 2;
          return (
            <Trim
              key={i}
              from={[Math.cos(a) * 0.9, 0.14, Math.sin(a) * 0.57]}
              to={[Math.cos(a) * 0.91, 0.42, Math.sin(a) * 0.58]}
              radius={0.008}
            />
          );
        })}
      </group>
    );
  }
  return (
    <group>
      {[-0.65, -0.33, 0, 0.33, 0.65].map((x) => (
        <Inset key={x} position={[x, 0.35, 0.38]} scale={[0.2, 0.24, 0.022]} />
      ))}
      <Trim from={[-0.82, 0.58, 0.41]} to={[0.82, 0.58, 0.41]} color="#dfc5a3" />
    </group>
  );
}

export function CategoryDetails({ index }: { index: number }) {
  switch (index) {
    case 0:
      return (
        <group>
          <mesh position={[0, 0.94, 0.015]}>
            <torusGeometry args={[0.91, 0.015, 6, 48]} />
            <meshStandardMaterial color="#c8bb9f" metalness={0.55} roughness={0.4} />
          </mesh>
          {Array.from({ length: 16 }, (_, i) => {
            const a = (i / 16) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(a) * 0.92, 0.94 + Math.sin(a) * 0.92, 0]}>
                <sphereGeometry args={[0.021, 10, 7]} />
                <meshStandardMaterial
                  color="#ffeac2"
                  emissive="#e5ae62"
                  emissiveIntensity={0.52}
                  roughness={0.34}
                />
              </mesh>
            );
          })}
        </group>
      );
    case 1:
      return (
        <group>
          <mesh position={[0, 0.64, 0]} castShadow>
            <boxGeometry args={[1.4, 0.065, 1.0]} />
            <meshStandardMaterial color="#eee0c9" roughness={0.98} />
          </mesh>
          {[-0.35, 0.35].map((z) => (
            <mesh key={z} position={[-0.45, 0.7, z]} castShadow>
              <boxGeometry args={[0.35, 0.1, 0.28]} />
              <meshStandardMaterial color="#faf1df" roughness={0.97} />
            </mesh>
          ))}
          <Trim from={[-0.72, 0.62, 0.57]} to={[0.76, 0.62, 0.57]} color="#b49b77" />
        </group>
      );
    case 2:
      return (
        <group>
          {[-0.66, -0.48, -0.3, 0.3, 0.48, 0.66].map((x) => (
            <mesh key={x} position={[x, 0.77, -0.22]} castShadow>
              <boxGeometry args={[0.12, 1.42, 0.09]} />
              <meshStandardMaterial color="#8c5677" roughness={0.85} />
            </mesh>
          ))}
          {[-0.7, 0.7].map((x) => (
            <mesh key={x} position={[x, 1.34, 0.2]}>
              <sphereGeometry args={[0.095, 10, 8]} />
              <meshStandardMaterial color="#fff7dd" emissive="#f2c58d" emissiveIntensity={0.6} />
            </mesh>
          ))}
        </group>
      );
    case 3:
      return (
        <group>
          {[-0.16, -0.04, 0.08, 0.2].flatMap((x) =>
            [0.49, 0.62].map((y) => (
              <mesh key={`${x}-${y}`} position={[x - 0.41, y, 0.138]}>
                <circleGeometry args={[0.037, 10]} />
                <meshStandardMaterial color="#9c7346" roughness={0.9} />
              </mesh>
            )),
          )}
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh
              key={i}
              position={[0.74 + Math.sin(i * 2.5) * 0.21, 1.3 + (i % 2) * 0.11, -0.4]}
              castShadow
            >
              <icosahedronGeometry args={[0.29, 1]} />
              <meshStandardMaterial color={i % 2 ? "#6c9568" : "#96ad7e"} roughness={0.94} />
            </mesh>
          ))}
        </group>
      );
    default:
      return (
        <group>
          {Array.from({ length: 20 }, (_, i) => {
            const a = (i / 20) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(a) * 0.72, 0.14, Math.sin(a) * 0.72]} castShadow>
                <cylinderGeometry args={[0.025, 0.042, 0.28, 6]} />
                <meshStandardMaterial
                  color={i % 2 ? "#d7caa4" : "#6a80a0"}
                  metalness={0.28}
                  roughness={0.35}
                />
              </mesh>
            );
          })}
        </group>
      );
  }
}
