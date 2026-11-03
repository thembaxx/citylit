"use client";

import { useEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import ProceduralTree from "./ProceduralTree";

export type MuseumFeature = "architecture" | "roof" | "windows" | "gardens";
export type MuseumProps = {
  night?: boolean;
  exploded?: boolean;
  feature?: MuseumFeature;
  reduced?: boolean;
  onFeature?: (feature: MuseumFeature) => void;
};

const stone = "#e4d7c3";
const trim = "#f6eddb";
const copper = "#547a68";
const timber = "#725848";

function Volume({
  position,
  size,
  color = stone,
  roughness = 0.83,
  metalness = 0,
  castShadow = true,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color?: string;
  roughness?: number;
  metalness?: number;
  castShadow?: boolean;
}) {
  return (
    <mesh position={position} castShadow={castShadow} receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
    </mesh>
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
      <Volume position={[0, 0, 0]} size={[0.33, 0.43, 0.055]} color={trim} />
      <mesh position={[0, 0, 0.031]}>
        <boxGeometry args={[0.27, 0.36, 0.01]} />
        <meshPhysicalMaterial
          color={night ? "#ffe6a4" : "#7c9ea7"}
          metalness={0.12}
          roughness={0.16}
          clearcoat={0.8}
          clearcoatRoughness={0.12}
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
    <group name="museum-showcase">
      <group ref={grounds} name="gardens-and-plinth">
        <Volume position={[0, -0.21, 0]} size={[3.18, 0.21, 2.86]} color="#b8aa94" />
        <Volume position={[0, -0.085, 0]} size={[3.08, 0.065, 2.76]} color="#ede4d4" />
        <Volume position={[0, -0.031, 0]} size={[2.99, 0.045, 2.67]} color="#9dba8e" />
        <Volume position={[0, 0.003, 1.11]} size={[0.78, 0.018, 0.43]} color="#d5c4a8" />
        <Volume position={[0, 0.029, 1.36]} size={[0.74, 0.045, 0.23]} color="#ddcfb8" />
        {[
          [-1.25, -0.95, 3],
          [1.27, -0.98, 7],
          [-1.24, 0.95, 11],
          [1.29, 0.86, 17],
        ].map(([x, z, seed]) => (
          <ProceduralTree
            key={seed}
            position={[x, 0.012, z]}
            scale={0.47}
            color={seed % 2 ? "#658b62" : "#789c73"}
            detail="hero"
            seed={seed}
          />
        ))}
        {[-1, 1].map((x) => (
          <group key={x}>
            <Volume position={[x * 1.38, 0.075, 0.17]} size={[0.12, 0.13, 0.65]} color="#d6c1a6" />
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
        <Volume position={[0, 0.35, 0.831]} size={[0.42, 0.62, 0.075]} color={timber} />
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
              <meshStandardMaterial
                color={feature === "roof" ? "#779c83" : copper}
                roughness={0.46}
                metalness={0.42}
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
                <meshStandardMaterial color="#a4bba0" metalness={0.55} roughness={0.42} />
              </mesh>
            ))}
          </group>
        ))}
        <Volume position={[0, 2.1, 0]} size={[0.08, 0.13, 2.0]} color="#3f6257" metalness={0.42} />
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
  );
}
