"use client";
import { View, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useThree, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState, type ComponentRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { cities } from "../lib/data";
import boundaries from "../public/data/provinces.json";
import useTheme from "./useTheme";
import StageModel from "./StageModel";
import { stageModel } from "../lib/stage-models";
import { useReducedMotion } from "motion/react";

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
  focus,
  opacity,
  interactive,
  animate,
}: {
  night: boolean;
  selected: number | null;
  host: HTMLElement;
  labels: { current: (HTMLButtonElement | null)[] };
  focus?: number[];
  opacity: number;
  interactive: boolean;
  animate: boolean;
}) {
  const { camera, size, invalidate } = useThree();
  const fit = Math.max(1, (size.height / Math.max(size.width, 1)) * 0.72);
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const vector = useMemo(() => new THREE.Vector3(), []);
  const pulses = useRef<(THREE.Mesh | null)[]>([]);
  const reducedMotion = useReducedMotion();
  const positions = useMemo(() => {
    const polygons = boundaries.features.flatMap((feature) =>
      feature.geometry.type === "Polygon"
        ? [feature.geometry.coordinates as unknown as number[][][]]
        : (feature.geometry.coordinates as unknown as number[][][][]),
    );
    const vertices: number[] = [];
    for (let lon = 16.4; lon < 33; lon += 0.2)
      for (let lat = -34.9; lat < -22; lat += 0.2) {
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
  useFrame(({ clock }) => {
    cities.forEach((city, index) => {
      const label = labels.current[index];
      if (!label) return;
      vector.set(x(city.coords[0]), 0.15, z(city.coords[1])).project(camera);
      label.style.left = `${(vector.x * 0.5 + 0.5) * size.width}px`;
      label.style.top = `${(-vector.y * 0.5 + 0.5) * size.height}px`;
      label.style.visibility =
        Math.abs(vector.x) > 1 || Math.abs(vector.y) > 1 || vector.z > 1 ? "hidden" : "visible";
    });
    if (animate && !reducedMotion && interactive && opacity > 0.1) {
      pulses.current.forEach((pulse, index) => {
        if (!pulse) return;
        const phase = (clock.elapsedTime * 0.45 + index * 0.17) % 1;
        pulse.scale.setScalar(1 + phase * 2);
        (pulse.material as THREE.MeshBasicMaterial).opacity = (1 - phase) * 0.45 * opacity;
      });
      invalidate();
    }
  });
  useEffect(() => {
    const city = selected === null ? null : cities[selected];
    const reduced = !animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const focused = focus?.map((index) => cities[index]);
    const targetX = city
      ? x(city.coords[0])
      : focused?.length
        ? focused.reduce((sum, item) => sum + x(item.coords[0]), 0) / focused.length
        : 0;
    const targetZ = city
      ? z(city.coords[1])
      : focused?.length
        ? focused.reduce((sum, item) => sum + z(item.coords[1]), 0) / focused.length
        : 0;
    const distance = city ? 4.3 : focused?.length ? 5.6 : 7.0;
    const tween = gsap.to(camera.position, {
      x: targetX,
      y: distance * fit,
      z: targetZ + distance * fit,
      duration: reduced ? 0 : 0.8,
      ease: "power2.inOut",
      onUpdate: () => {
        controls.current?.update();
        invalidate();
      },
    });
    const targetTween = controls.current
      ? gsap.to(controls.current.target, {
          x: targetX,
          y: 0,
          z: targetZ,
          duration: reduced ? 0 : 0.8,
          onUpdate: () => {
            controls.current?.update();
            invalidate();
          },
        })
      : null;
    invalidate();
    return () => {
      tween.kill();
      targetTween?.kill();
    };
  }, [selected, camera, invalidate, fit, focus?.join(","), animate]);
  return (
    <>
      <ambientLight intensity={1.8} />
      <directionalLight position={[4, 8, 5]} intensity={2.5} />
      <PerspectiveCamera makeDefault position={[0, 7.5 * fit, 7 * fit]} fov={42} />
      <OrbitControls
        ref={controls}
        domElement={host}
        enableZoom={false}
        enablePan={false}
        enabled={interactive}
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
          size={0.047}
          sizeAttenuation
          transparent
          opacity={0.65 * opacity}
        />
      </points>
      {cities.map((city, index) => (
        <group key={city.slug} position={[x(city.coords[0]), 0.06, z(city.coords[1])]}>
          <mesh
            ref={(element) => {
              pulses.current[index] = element;
            }}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[0.15, 0.17, 40]} />
            <meshBasicMaterial
              color={night ? "#ffc46b" : "#d9660b"}
              transparent
              opacity={0.2 * opacity}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry
              args={[index === selected ? 0.12 : 0.065, index === selected ? 0.15 : 0.085, 32]}
            />
            <meshBasicMaterial
              color={night ? "#ffc46b" : "#d9660b"}
              side={THREE.DoubleSide}
              transparent
              opacity={opacity}
            />
          </mesh>
          <mesh position={[0, 0.4, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.8, 6]} />
            <meshBasicMaterial
              color={night ? "#ffc46b" : "#b35b19"}
              transparent
              opacity={(index === selected ? 0.8 : 0.35) * opacity}
            />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.055, 8, 8]} />
            <meshBasicMaterial
              color={night ? "#ffc46b" : "#d9660b"}
              transparent
              opacity={opacity}
            />
          </mesh>
          {index === selected && opacity > 0.65 && (
            <group position={[0, 0.13, 0]} scale={0.34}>
              <Suspense fallback={null}>
                <StageModel model={stageModel(city.landmarks[0])} />
              </Suspense>
            </group>
          )}
        </group>
      ))}
    </>
  );
}
export default function GlowMap({
  selected,
  onSelect,
  focus,
  opacity = 1,
  interactive = true,
  animate = true,
}: {
  selected: number | null;
  onSelect: (index: number) => void;
  focus?: number[];
  opacity?: number;
  interactive?: boolean;
  animate?: boolean;
}) {
  const labels = useRef<(HTMLButtonElement | null)[]>([]);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const { night } = useTheme();
  return (
    <div
      className="glow-map"
      ref={setHost}
      aria-label="Interactive map of South African city guides"
      data-interactive={interactive}
    >
      <View className="glow-map-view" index={2} visible={opacity > 0.01}>
        {host && (
          <Terrain
            host={host}
            night={night}
            selected={selected}
            labels={labels}
            focus={focus}
            opacity={opacity}
            interactive={interactive}
            animate={animate}
          />
        )}
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
            tabIndex={interactive ? 0 : -1}
            disabled={!interactive}
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
