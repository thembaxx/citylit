"use client";

import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { RoundedBox } from "@react-three/drei";
import {
  makeMuseumSurfaces,
  disposeMuseumSurfaces,
  type MuseumSurface,
  type MuseumSurfaceLibrary,
} from "../lib/museum-surfaces";

export type MuseumFeature = "architecture" | "roof" | "windows" | "gardens";
export type MuseumProps = {
  night?: boolean;
  exploded?: boolean;
  feature?: MuseumFeature;
  reduced?: boolean;
  onFeature?: (feature: MuseumFeature) => void;
};

const stone = "#d2c2ad";
const trim = "#efe4d2";
const copper = "#395e50";
const timber = "#684b3a";

const SurfaceContext = createContext<MuseumSurfaceLibrary | null>(null);

function SurfaceMaterial({
  color,
  roughness,
  metalness,
  surface = "plaster",
}: {
  color: string;
  roughness: number;
  metalness: number;
  surface?: MuseumSurface;
}) {
  const maps = useContext(SurfaceContext)?.[surface];
  return (
    <meshStandardMaterial
      color={color}
      roughness={roughness}
      metalness={metalness}
      map={maps?.albedo}
      bumpMap={maps?.bump}
      bumpScale={maps?.bumpScale ?? 0}
      envMapIntensity={surface === "copper" ? 1.1 : 0.75}
    />
  );
}

/** Smooth, layered vegetation; intentionally art-directed, not botanical survey data. */
function DetailedTree({ x, z, seed }: { x: number; z: number; seed: number }) {
  const leaves = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => {
        const angle = i * 2.39996 + seed;
        const radius = 0.2 + ((i * 17 + seed * 9) % 11) * 0.023;
        const height = 0.66 + ((i * 23 + seed * 3) % 13) * 0.028;
        const size = 0.15 + ((i * 7 + seed) % 9) * 0.012;
        return {
          position: [Math.cos(angle) * radius, height, Math.sin(angle) * radius] as [
            number,
            number,
            number,
          ],
          size,
          color: ["#375e40", "#547951", "#446b43", "#73916a", "#426544"][(i + seed) % 5],
        };
      }),
    [seed],
  );
  return (
    <group position={[x, 0.015, z]} name="landscape-tree">
      <mesh castShadow receiveShadow position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.042, 0.072, 0.67, 9]} />
        <meshStandardMaterial color="#796450" roughness={0.94} />
      </mesh>
      {Array.from({ length: 5 }, (_, i) => {
        const a = i * 2.1;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.12, 0.53 + i * 0.035, Math.sin(a) * 0.12]}
            rotation={[Math.sin(a) * 0.53, 0, Math.cos(a) * 0.58]}
            castShadow
          >
            <cylinderGeometry args={[0.014, 0.03, 0.4, 6]} />
            <meshStandardMaterial color="#77634b" roughness={0.95} />
          </mesh>
        );
      })}
      {leaves.map((leaf, i) => (
        <mesh key={i} position={leaf.position} castShadow receiveShadow>
          <icosahedronGeometry args={[leaf.size, 2]} />
          <meshStandardMaterial color={leaf.color} roughness={0.93} />
        </mesh>
      ))}
    </group>
  );
}

function Volume({
  position,
  size,
  color = stone,
  roughness = 0.83,
  metalness = 0,
  castShadow = true,
  surface = "plaster",
}: {
  position: [number, number, number];
  size: [number, number, number];
  color?: string;
  roughness?: number;
  metalness?: number;
  castShadow?: boolean;
  surface?: MuseumSurface;
}) {
  return (
    <RoundedBox
      position={position}
      args={size}
      radius={Math.min(0.014, ...size.map((dimension) => dimension * 0.08))}
      smoothness={2}
      castShadow={castShadow}
      receiveShadow
    >
      <SurfaceMaterial
        surface={surface}
        color={color}
        roughness={roughness}
        metalness={metalness}
      />
    </RoundedBox>
  );
}

function MuseumWindow({
  position,
  side = false,
  night,
  active,
}: {
  position: [number, number, number];
  side?: boolean;
  night: boolean;
  active: boolean;
}) {
  return (
    <group position={position} rotation={[0, side ? Math.PI / 2 : 0, 0]}>
      <Volume position={[0, 0, -0.012]} size={[0.35, 0.45, 0.075]} color="#a89984" surface="stone" />
      <Volume position={[0, 0, 0.016]} size={[0.31, 0.41, 0.027]} color="#242f30" surface="stone" />
      <mesh position={[0, 0, 0.039]}>
        <boxGeometry args={[0.27, 0.36, 0.01]} />
        <meshPhysicalMaterial
          color={night ? "#efcd83" : "#405b63"}
          metalness={0.06}
          roughness={0.095}
          ior={1.46}
          envMapIntensity={1.6}
          clearcoat={1}
          clearcoatRoughness={0.06}
          emissive={night ? "#e1ab52" : active ? "#568d9d" : "#071924"}
          emissiveIntensity={night ? 0.65 : active ? 0.18 : 0.025}
        />
      </mesh>
      <Volume position={[0, 0, 0.044]} size={[0.025, 0.42, 0.027]} color={trim} />
      <Volume position={[0, 0.015, 0.044]} size={[0.33, 0.027, 0.028]} color={trim} />
      <Volume position={[0, -0.235, 0.032]} size={[0.4, 0.055, 0.12]} color="#c9b9a0" />
      <Volume position={[0, 0.245, 0.032]} size={[0.41, 0.055, 0.11]} color={trim} />
    </group>
  );
}

/**
 * Art-directed, original miniature museum; not a surveyed recreation of the historic building.
 * Architectural layers remain independent so visitors can inspect the roof and grounds.
 */
export default function MuseumShowcase({
  night = false,
  exploded = false,
  feature = "architecture",
  reduced = false,
  onFeature,
}: MuseumProps) {
  const roof = useRef<THREE.Group>(null);
  const grounds = useRef<THREE.Group>(null);
  const { invalidate } = useThree();
  const surfaces = useMemo(makeMuseumSurfaces, []);
  useEffect(() => () => disposeMuseumSurfaces(surfaces), [surfaces]);
  const buildingWindows = useMemo(
    () => [-0.78, -0.26, 0.26, 0.78].flatMap((x) => [0.43, 1.07].map((y) => ({ x, y }))),
    [],
  );

  useEffect(() => {
    const animations = [
      roof.current &&
        gsap.to(roof.current.position, {
          y: exploded ? 0.79 : 0,
          duration: reduced ? 0 : 0.7,
          ease: "power3.inOut",
          onUpdate: invalidate,
        }),
      grounds.current &&
        gsap.to(grounds.current.position, {
          y: exploded ? -0.22 : 0,
          duration: reduced ? 0 : 0.7,
          ease: "power3.inOut",
          onUpdate: invalidate,
        }),
    ].filter((value): value is gsap.core.Tween => Boolean(value));
    invalidate();
    return () => animations.forEach((animation) => animation.kill());
  }, [exploded, reduced, invalidate]);

  return (
    <SurfaceContext.Provider value={surfaces}>
      <group name="museum-showcase">
        <group ref={grounds} name="gardens-and-plinth">
          <Volume
            position={[0, -0.21, 0]}
            size={[3.18, 0.21, 2.86]}
            color="#948576"
            surface="stone"
          />
          <Volume
            position={[0, -0.085, 0]}
            size={[3.08, 0.065, 2.76]}
            color="#d5c8b6"
            surface="paving"
          />
          <Volume
            position={[0, -0.031, 0]}
            size={[2.99, 0.045, 2.67]}
            color="#728f69"
            surface="grass"
          />
          <Volume
            position={[0, 0.003, 1.11]}
            size={[0.78, 0.018, 0.43]}
            color="#d5c4a8"
            surface="paving"
          />
          <Volume
            position={[0, 0.029, 1.36]}
            size={[0.74, 0.045, 0.23]}
            color="#ddcfb8"
            surface="paving"
          />
          {[
            [-1.25, -0.95, 3],
            [1.27, -0.98, 7],
          ].map(([x, z, seed]) => (
            <DetailedTree key={seed} x={x} z={z} seed={seed} />
          ))}
          {[-1, 1].map((x) => (
            <group key={x}>
              <Volume
                position={[x * 1.38, 0.075, 0.17]}
                size={[0.12, 0.13, 0.65]}
                color="#d6c1a6"
              />
              {[-0.2, 0.11, 0.38].map((z) => (
                <mesh key={z} position={[x * 1.38, 0.17, z]}>
                  <sphereGeometry args={[0.105, 12, 8]} />
                  <meshStandardMaterial color="#527f59" roughness={0.94} />
                </mesh>
              ))}
            </group>
          ))}
        </group>

        <group name="stone-facade">
          <Volume position={[0, 0.74, 0]} size={[2.18, 1.44, 1.48]} />
          <Volume position={[0, 0.76, 0.753]} size={[2.26, 1.47, 0.07]} color="#eee2ce" />
          <Volume position={[0, 0.18, 0.81]} size={[2.3, 0.11, 0.19]} color="#baaa90" />
          <Volume position={[0, 0.79, 0.812]} size={[2.31, 0.06, 0.14]} color="#d6c7ae" />
          <Volume position={[0, 1.52, 0.02]} size={[2.34, 0.1, 1.64]} color={trim} />
          {[-1.065, 1.065].map((x) => (
            <group key={x}>
              <Volume position={[x, 0.74, 0.82]} size={[0.12, 1.48, 0.16]} color={trim} />
              <Volume position={[x * 0.9, 0.31, 0.837]} size={[0.13, 0.6, 0.15]} color="#cbb99e" />
              <Volume position={[x, 1.44, 0.84]} size={[0.2, 0.12, 0.18]} color="#f3e6d4" />
            </group>
          ))}
          <Volume
            position={[0, 0.35, 0.831]}
            size={[0.42, 0.62, 0.075]}
            color={timber}
            surface="wood"
          />
          <Volume position={[0, 0.7, 0.851]} size={[0.52, 0.1, 0.14]} color={trim} />
          <Volume
            position={[0, 0.38, 0.882]}
            size={[0.018, 0.58, 0.02]}
            color="#caad78"
            metalness={0.5}
          />
          <mesh position={[0.15, 0.37, 0.901]}>
            <sphereGeometry args={[0.026, 12, 8]} />
            <meshStandardMaterial color="#ba8c44" metalness={0.7} roughness={0.3} />
          </mesh>
          {[-0.59, 0.59].map((x) => (
            <group key={x}>
              <Volume position={[x, 0.69, 0.895]} size={[0.095, 1.18, 0.1]} color={trim} />
              <Volume position={[x, 1.32, 0.9]} size={[0.15, 0.12, 0.15]} color="#d1bc9d" />
            </group>
          ))}
          <Volume position={[0, 1.38, 0.89]} size={[1.5, 0.115, 0.24]} color={trim} />
          {[-0.72, 0.72].map((x) => (
            <MuseumWindow
              key={x}
              position={[x, 0.99, 0.859]}
              night={night}
              active={feature === "windows"}
            />
          ))}
          {[-0.64, 0.64].map((x) => (
            <MuseumWindow
              key={x + 3}
              position={[x, 0.42, -0.774]}
              night={night}
              active={feature === "windows"}
            />
          ))}
          {buildingWindows
            .filter(({ x }) => Math.abs(x) > 0.6)
            .map(({ x, y }) => (
              <MuseumWindow
                key={`${x}-${y}`}
                position={[x > 0 ? 1.111 : -1.111, y, x > 0 ? -0.27 : 0.27]}
                side
                night={night}
                active={feature === "windows"}
              />
            ))}
          <mesh position={[0, 0.07, 1.04]} receiveShadow>
            <boxGeometry args={[0.84, 0.115, 0.48]} />
            <meshStandardMaterial color="#d2c1a7" roughness={0.97} />
          </mesh>
        </group>

        <group ref={roof} name="copper-roof">
          {[-1, 1].map((side) => (
            <group key={side}>
              <mesh castShadow position={[side * 0.59, 1.8, 0]} rotation={[0, 0, side * -0.45]}>
                <boxGeometry args={[1.42, 0.1, 1.89]} />
                <SurfaceMaterial
                  surface="copper"
                  color={feature === "roof" ? "#779c83" : copper}
                  roughness={0.39}
                  metalness={0.62}
                />
              </mesh>
              {[-0.6, -0.2, 0.2, 0.6].map((z) => (
                <mesh
                  key={z}
                  castShadow
                  position={[side * 0.59, 1.855, z]}
                  rotation={[0, 0, side * -0.45]}
                >
                  <boxGeometry args={[1.42, 0.012, 0.012]} />
                  <SurfaceMaterial
                    color="#a4bba0"
                    surface="copper"
                    metalness={0.62}
                    roughness={0.35}
                  />
                </mesh>
              ))}
            </group>
          ))}
          <Volume
            position={[0, 2.1, 0]}
            size={[0.08, 0.13, 2.0]}
            color="#3f6257"
            metalness={0.42}
          />
          <Volume position={[0.48, 2.12, -0.18]} size={[0.34, 0.65, 0.38]} color="#e7dccc" />
          <Volume position={[0.48, 2.51, -0.18]} size={[0.42, 0.12, 0.46]} color="#cbb9a0" />
          <Volume
            position={[0.48, 2.62, -0.18]}
            size={[0.49, 0.09, 0.53]}
            color="#43695e"
            metalness={0.33}
          />
          <Volume
            position={[0.48, 2.43, 0.023]}
            size={[0.14, 0.23, 0.025]}
            color={night ? "#e5b56c" : "#658d96"}
          />
        </group>
        {onFeature &&
          (
            [
              { id: "architecture", position: [0, 0.65, 1.03] },
              { id: "roof", position: [-0.2, 2.2, 0.54] },
              { id: "windows", position: [0.73, 1.02, 0.91] },
              { id: "gardens", position: [-1.24, 0.26, 0.92] },
            ] as { id: MuseumFeature; position: [number, number, number] }[]
          ).map((hotspot) => (
            <mesh
              key={hotspot.id}
              name={`hotspot-${hotspot.id}`}
              position={hotspot.position}
              onClick={(event) => {
                event.stopPropagation();
                onFeature(hotspot.id);
              }}
              onPointerOver={() => {
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                document.body.style.cursor = "";
              }}
            >
              <sphereGeometry args={[feature === hotspot.id ? 0.08 : 0.065, 16, 12]} />
              <meshStandardMaterial
                color={feature === hotspot.id ? "#fff4dc" : "#d7b47a"}
                roughness={0.35}
                metalness={0.36}
                emissive="#d9b36b"
                emissiveIntensity={feature === hotspot.id ? 0.42 : 0.15}
              />
            </mesh>
          ))}
        {night && (
          <pointLight position={[0, 0.7, 1.12]} intensity={1.5} distance={3.5} color="#ffcd8d" />
        )}
      </group>
    </SurfaceContext.Provider>
  );
}
