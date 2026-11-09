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
import { useKhwezi } from "./KhweziProvider";

const landVertex = `
  uniform float uTime;
  uniform float uMotion;
  uniform vec2 uSelectedPos;
  uniform float uHasSelected;
  attribute float aPhase;
  attribute float aElevation;
  varying float vPulse;
  varying float vElevation;
  varying float vFocus;
  void main() {
    vec3 p = position;
    float dist = length(p.xz - uSelectedPos);
    float focus = exp(-dist * 1.55) * uHasSelected;
    p.y += (sin(uTime * 0.48 + aPhase * 6.283) * 0.032 + focus * 0.055 * (0.5 + 0.5 * sin(uTime * 1.8 - dist * 3.2))) * uMotion;
    vec4 viewPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    float baseSize = 1.65 + 1.95 * (0.5 + 0.5 * sin(aPhase * 15.0 + uTime * 0.85)) + focus * 1.45;
    gl_PointSize = baseSize * (5.0 / -viewPosition.z);
    vPulse = 0.56 + 0.44 * sin(aPhase * 22.0 + uTime * 0.65) * sin(aPhase * 22.0 + uTime * 0.65);
    vElevation = aElevation;
    vFocus = focus;
  }
`;
const landFragment = `
  uniform float uNight;
  uniform float uOpacity;
  varying float vPulse;
  varying float vElevation;
  varying float vFocus;
  void main() {
    float radius = length(gl_PointCoord - 0.5);
    if (radius > 0.5) discard;
    float core = exp(-radius * radius * 18.0);
    float halo = 1.0 - smoothstep(0.08, 0.5, radius);
    float glow = mix(halo, core, 0.42);
    vec3 dayBase = mix(vec3(0.28, 0.30, 0.36), vec3(0.54, 0.58, 0.68), vPulse);
    vec3 dayHigh = mix(dayBase, vec3(0.84, 0.52, 0.20), vElevation * 0.45 + vFocus * 0.72);
    vec3 nightBase = mix(vec3(0.32, 0.35, 0.44), vec3(0.86, 0.65, 0.38), vPulse);
    vec3 nightHigh = mix(nightBase, vec3(0.98, 0.78, 0.46), vElevation * 0.40 + vFocus * 0.78);
    vec3 color = mix(dayHigh, nightHigh, uNight);
    float alpha = glow * (0.68 + vPulse * 0.28 + vFocus * 0.28) * uOpacity;
    gl_FragColor = vec4(color, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
const beamVertex = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;
const beamFragment = `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 1.6);
    float verticalFade = smoothstep(0.0, 0.14, vUv.y) * pow(1.0 - vUv.y, 1.85);
    float shimmer = 0.82 + 0.18 * sin(vUv.y * 14.0 - uTime * 2.2);
    float alpha = verticalFade * (0.28 + fresnel * 0.72) * shimmer * uOpacity;
    gl_FragColor = vec4(uColor, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

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
  const nightMix = useRef(night ? 1 : 0);
  const land = useMemo(() => {
    const polygons = boundaries.features.flatMap((feature) =>
      feature.geometry.type === "Polygon"
        ? [feature.geometry.coordinates as unknown as number[][][]]
        : (feature.geometry.coordinates as unknown as number[][][][]),
    );
    const vertices: number[] = [];
    const phases: number[] = [];
    const elevations: number[] = [];
    for (let lon = 16.4; lon < 33; lon += 0.2)
      for (let lat = -34.9; lat < -22; lat += 0.2) {
        if (
          polygons.some(
            (polygon) =>
              insideRing([lon, lat], polygon[0]) &&
              !polygon.slice(1).some((ring) => insideRing([lon, lat], ring)),
          )
        ) {
          const elev = Math.max(
            0,
            Math.min(1, (lon - 18) * 0.055 + (lat + 34) * 0.045 + Math.sin(lon * 2.4) * 0.15),
          );
          vertices.push(
            x(lon),
            Math.sin(lon * 3) * Math.cos(lat * 2) * 0.045 + elev * 0.04,
            z(lat),
          );
          phases.push(Math.abs(Math.sin(lon * 12.9898 + lat * 78.233) * 43758.5453) % 1);
          elevations.push(elev);
        }
      }
    return {
      positions: new Float32Array(vertices),
      phases: new Float32Array(phases),
      elevations: new Float32Array(elevations),
    };
  }, []);
  const landMaterial = useRef<THREE.ShaderMaterial>(null);
  const beamMaterial = useRef<THREE.ShaderMaterial>(null);
  useFrame(({ clock }, delta) => {
    nightMix.current =
      animate && !reducedMotion
        ? THREE.MathUtils.damp(nightMix.current, night ? 1 : 0, 3.2, delta)
        : night
          ? 1
          : 0;
    const activeCity = selected === null ? null : cities[selected];
    if (landMaterial.current) {
      landMaterial.current.uniforms.uTime.value = animate && !reducedMotion ? clock.elapsedTime : 0;
      landMaterial.current.uniforms.uNight.value = nightMix.current;
      landMaterial.current.uniforms.uOpacity.value = 0.65 * opacity;
      landMaterial.current.uniforms.uMotion.value =
        animate && !reducedMotion && interactive ? 1 : 0;
      landMaterial.current.uniforms.uHasSelected.value = activeCity ? 1 : 0;
      if (activeCity) {
        landMaterial.current.uniforms.uSelectedPos.value.set(
          x(activeCity.coords[0]),
          z(activeCity.coords[1]),
        );
      }
    }
    if (beamMaterial.current) {
      beamMaterial.current.uniforms.uTime.value = animate && !reducedMotion ? clock.elapsedTime : 0;
      beamMaterial.current.uniforms.uOpacity.value = 0.22 * opacity;
    }
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
      duration: reduced ? 0 : 0.55,
      ease: "power3.out",
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
          duration: reduced ? 0 : 0.55,
          ease: "power3.out",
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
          <bufferAttribute attach="attributes-position" args={[land.positions, 3]} />
          <bufferAttribute attach="attributes-aPhase" args={[land.phases, 1]} />
          <bufferAttribute attach="attributes-aElevation" args={[land.elevations, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={landMaterial}
          vertexShader={landVertex}
          fragmentShader={landFragment}
          uniforms={{
            uTime: { value: 0 },
            uNight: { value: night ? 1 : 0 },
            uOpacity: { value: 0.65 * opacity },
            uMotion: { value: 1 },
            uSelectedPos: { value: new THREE.Vector2(0, 0) },
            uHasSelected: { value: selected !== null ? 1 : 0 },
          }}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
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
          {index === selected && (
            <mesh position={[0, 1.08, 0]}>
              <cylinderGeometry args={[0.02, 0.22, 2.1, 24, 1, true]} />
              <shaderMaterial
                ref={beamMaterial}
                vertexShader={beamVertex}
                fragmentShader={beamFragment}
                uniforms={{
                  uColor: { value: new THREE.Color(night ? "#f0b35e" : "#c86d24") },
                  uOpacity: { value: 0.24 * opacity },
                  uTime: { value: 0 },
                }}
                transparent
                side={THREE.DoubleSide}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                toneMapped={false}
              />
            </mesh>
          )}
          <mesh>
            <sphereGeometry args={[0.055, 8, 8]} />
            <meshBasicMaterial
              color={night ? "#ffc46b" : "#d9660b"}
              transparent
              opacity={opacity}
            />
          </mesh>
          {index === selected && opacity > 0.65 && (
            <group position={[0, 0.14, 0]} scale={0.4}>
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
  const { feedback } = useKhwezi();
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
            onClick={() => {
              feedback("tap");
              onSelect(index);
            }}
          >
            <span className="glow-marker-dot" />
            <span className="glow-marker-name">{city.short}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
