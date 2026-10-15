"use client";
import { View, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useThree, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type ComponentRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { cities } from "../lib/data";
import boundaries from "../public/data/provinces.json";
import useTheme from "./useTheme";

const x = (lon: number) => (lon - 25) * 0.48;
const z = (lat: number) => -(lat + 28.7) * 0.48;
function insideRing(point: number[], ring: number[][]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i],
      b = ring[j];
    if (
      a[1] > point[1] !== b[1] > point[1] &&
      point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / (b[1] - a[1]) + a[0]
    )
      inside = !inside;
  }
  return inside;
}
function Terrain({
  night,
  selected,
  host,
  labels,
}: {
  night: boolean;
  selected: number | null;
  host: HTMLElement;
  labels: { current: (HTMLButtonElement | null)[] };
}) {
  const { camera, size, invalidate } = useThree();
  const fit = Math.max(1, (size.height / Math.max(size.width, 1)) * 1.35);
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const vector = useMemo(() => new THREE.Vector3(), []);
  const positions = useMemo(() => {
    const polygons = boundaries.features.flatMap((feature) =>
      feature.geometry.type === "Polygon"
        ? [feature.geometry.coordinates as unknown as number[][][]]
        : (feature.geometry.coordinates as unknown as number[][][][]),
    );
    const vertices: number[] = [];
    for (let lon = 16.4; lon < 33; lon += 0.14)
      for (let lat = -34.9; lat < -22; lat += 0.14) {
        if (
          polygons.some(
            (polygon) =>
              insideRing([lon, lat], polygon[0]) &&
              !polygon.slice(1).some((ring) => insideRing([lon, lat], ring)),
          )
        )
          vertices.push(x(lon), Math.sin(lon * 3) * Math.cos(lat * 2) * 0.045, z(lat));
      }
    return new Float32Array(vertices);
  }, []);
  useFrame(() => {
    cities.forEach((city, index) => {
      const label = labels.current[index];
      if (!label) return;
      vector.set(x(city.coords[0]), 0.15, z(city.coords[1])).project(camera);
      label.style.left = `${(vector.x * 0.5 + 0.5) * size.width}px`;
      label.style.top = `${(-vector.y * 0.5 + 0.5) * size.height}px`;
      label.style.visibility =
        Math.abs(vector.x) > 1 || Math.abs(vector.y) > 1 || vector.z > 1 ? "hidden" : "visible";
    });
  });
  useEffect(() => {
    const city = selected === null ? null : cities[selected];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tween = gsap.to(camera.position, {
      x: city ? x(city.coords[0]) * 0.2 : 0,
      y: 7.5 * fit,
      z: 7 * fit,
      duration: reduced ? 0 : 0.8,
      ease: "power2.inOut",
      onUpdate: () => {
        controls.current?.update();
        invalidate();
      },
    });
    invalidate();
    return () => {
      tween.kill();
    };
  }, [selected, camera, invalidate, fit]);
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 7.5 * fit, 7 * fit]} fov={42} />
      <OrbitControls
        ref={controls}
        domElement={host}
        enableZoom={false}
        enablePan={false}
        minPolarAngle={0.35}
        maxPolarAngle={1.1}
        minAzimuthAngle={-0.45}
        maxAzimuthAngle={0.45}
      />
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color={night ? "#a4a092" : "#7b7362"}
          size={0.028}
          sizeAttenuation
          transparent
          opacity={0.65}
        />
      </points>
      {cities.map((city, index) => (
        <group key={city.slug} position={[x(city.coords[0]), 0.06, z(city.coords[1])]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry
              args={[index === selected ? 0.12 : 0.065, index === selected ? 0.15 : 0.085, 32]}
            />
            <meshBasicMaterial color={night ? "#ffc46b" : "#b35b19"} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0.28, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.56, 6]} />
            <meshBasicMaterial
              color={night ? "#ffc46b" : "#b35b19"}
              transparent
              opacity={index === selected ? 0.8 : 0.35}
            />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshBasicMaterial color={night ? "#ffc46b" : "#b35b19"} />
          </mesh>
        </group>
      ))}
    </>
  );
}
export default function GlowMap({
  selected,
  onSelect,
}: {
  selected: number | null;
  onSelect: (index: number) => void;
}) {
  const labels = useRef<(HTMLButtonElement | null)[]>([]);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const { night } = useTheme();
  return (
    <div
      className="glow-map"
      ref={setHost}
      aria-label="Interactive map of South African city guides"
    >
      <View className="glow-map-view" index={2}>
        {host && <Terrain host={host} night={night} selected={selected} labels={labels} />}
      </View>
      <div className="glow-map-labels">
        {cities.map((city, index) => (
          <button
            key={city.slug}
            ref={(element) => {
              labels.current[index] = element;
            }}
            aria-label={`Choose ${city.name}`}
            aria-pressed={selected === index}
            className={`glow-city-marker ${selected === index ? "is-selected" : ""} ${index < 3 ? "is-major" : ""}`}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => onSelect(index)}
          >
            <span className="glow-marker-dot" />
            <span className="glow-marker-name">{city.short}</span>
          </button>
        ))}
      </div>
      <p className="glow-map-caption">Drag to explore · Select a city beacon</p>
    </div>
  );
}
