"use client";
import { View, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useThree, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState, type ComponentRef } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import gsap from "gsap";
import { cities, places } from "../lib/data";
import { landmarkVenue } from "../lib/discovery-guide";
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
    vec3 dayBase = mix(vec3(0.20, 0.34, 0.28), vec3(0.62, 0.52, 0.34), vPulse);
    vec3 dayHigh = mix(dayBase, vec3(0.78, 0.48, 0.18), vElevation * 0.5 + vFocus * 0.65);
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

type AtlasPin = {
  key: string;
  label: string;
  href: string;
  kind: "place" | "landmark";
  position: [number, number, number];
};

function buildAtlasPins(): AtlasPin[] {
  const pins: AtlasPin[] = [];
  const at = new Map<string, number>();
  const add = (pin: AtlasPin, coordKey: string) => {
    const index = at.get(coordKey);
    if (index === undefined) {
      at.set(coordKey, pins.length);
      pins.push(pin);
      return;
    }
    if (pin.kind === "landmark") pins[index] = pin;
  };
  for (const place of places) {
    if (place.coordinateAccuracy !== "venue" || place.coords.length < 2) continue;
    const coordKey = `${place.coords[0].toFixed(3)},${place.coords[1].toFixed(3)}`;
    add(
      {
        key: `place-${place.id}`,
        label: place.name,
        href: `/${place.city}/places?place=${encodeURIComponent(place.id)}`,
        kind: "place",
        position: [x(place.coords[0]), 0.07, z(place.coords[1])],
      },
      coordKey,
    );
  }
  for (const city of cities) {
    for (const name of city.landmarks) {
      const place = landmarkVenue(city.slug, name);
      if (!place || place.coordinateAccuracy !== "venue" || place.coords.length < 2) continue;
      const coordKey = `${place.coords[0].toFixed(3)},${place.coords[1].toFixed(3)}`;
      add(
        {
          key: `landmark-${city.slug}-${name}`,
          label: name,
          href: `/${city.slug}/landmarks?landmark=${encodeURIComponent(name)}`,
          kind: "landmark",
          position: [x(place.coords[0]), 0.14, z(place.coords[1])],
        },
        coordKey,
      );
    }
  }
  return pins;
}

function pinPositions(pins: AtlasPin[], kind: AtlasPin["kind"]) {
  const values: number[] = [];
  for (const pin of pins) {
    if (pin.kind !== kind) continue;
    values.push(pin.position[0], pin.position[1], pin.position[2]);
  }
  return new Float32Array(values);
}

function MarkerDots({
  positions,
  color,
  radius,
  opacity,
}: {
  positions: Float32Array;
  color: string;
  radius: number;
  opacity: number;
}) {
  const count = positions.length / 3;
  const mesh = useMemo(() => {
    const geometry = new THREE.SphereGeometry(radius, 8, 6);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      depthWrite: false,
      opacity,
    });
    const instanced = new THREE.InstancedMesh(geometry, material, Math.max(count, 1));
    instanced.count = count;
    instanced.frustumCulled = false;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      dummy.position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      dummy.updateMatrix();
      instanced.setMatrixAt(i, dummy.matrix);
    }
    instanced.instanceMatrix.needsUpdate = true;
    return instanced;
  }, [positions, color, radius, count]);
  useEffect(() => {
    const material = mesh.material;
    if (!Array.isArray(material)) material.opacity = opacity;
  }, [mesh, opacity]);
  useEffect(() => {
    return () => {
      mesh.geometry.dispose();
      const material = mesh.material;
      if (!Array.isArray(material)) material.dispose();
    };
  }, [mesh]);
  if (count === 0) return null;
  return <primitive object={mesh} />;
}

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
  pins,
  pinLabels,
  focus,
  opacity,
  interactive,
  animate,
}: {
  night: boolean;
  selected: number | null;
  host: HTMLElement;
  labels: { current: (HTMLButtonElement | null)[] };
  pins: AtlasPin[];
  pinLabels: { current: (HTMLButtonElement | null)[] };
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
  const placeDots = useMemo(() => pinPositions(pins, "place"), [pins]);
  const landmarkDots = useMemo(() => pinPositions(pins, "landmark"), [pins]);
  const outline = useMemo(() => {
    const positions: number[] = [];
    for (const feature of boundaries.features) {
      const polygons =
        feature.geometry.type === "Polygon"
          ? [feature.geometry.coordinates as unknown as number[][][]]
          : (feature.geometry.coordinates as unknown as number[][][][]);
      for (const polygon of polygons) {
        for (const ring of polygon) {
          for (let i = 0; i < ring.length - 1; i++) {
            positions.push(
              x(ring[i][0]),
              0.03,
              z(ring[i][1]),
              x(ring[i + 1][0]),
              0.03,
              z(ring[i + 1][1]),
            );
          }
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
    return geometry;
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
    pins.forEach((pin, index) => {
      const label = pinLabels.current[index];
      if (!label) return;
      vector.set(pin.position[0], pin.position[1], pin.position[2]).project(camera);
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
      <lineSegments geometry={outline} dispose={null}>
        <lineBasicMaterial
          color={night ? "#e7d7bf" : "#5c5348"}
          transparent
          opacity={(night ? 0.72 : 0.55) * opacity}
          depthWrite={false}
        />
      </lineSegments>
      <MarkerDots positions={placeDots} color="#f7f1e6" radius={0.028} opacity={0.92 * opacity} />
      <MarkerDots
        positions={landmarkDots}
        color={night ? "#ffc46b" : "#d9660b"}
        radius={0.042}
        opacity={opacity}
      />
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
            <group position={[0, 0.14, 0]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <circleGeometry args={[0.28, 24]} />
                <meshBasicMaterial
                  color={night ? "#3a3328" : "#e6d3b4"}
                  transparent
                  opacity={0.9}
                />
              </mesh>
              <group scale={0.4}>
                <Suspense fallback={null}>
                  <StageModel model={stageModel(city.landmarks[0])} />
                </Suspense>
              </group>
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
  const pinLabels = useRef<(HTMLButtonElement | null)[]>([]);
  const pins = useMemo(() => buildAtlasPins(), []);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const { night } = useTheme();
  const { feedback } = useKhwezi();
  const router = useRouter();
  return (
    <div
      className="glow-map"
      ref={setHost}
      aria-label="Interactive map of South Africa, with cities, places and landmarks"
      data-interactive={interactive}
    >
      <View className="glow-map-view" index={2} visible={opacity > 0.01}>
        {host && (
          <Terrain
            host={host}
            night={night}
            selected={selected}
            labels={labels}
            pins={pins}
            pinLabels={pinLabels}
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
            aria-label={selected === index ? `Open ${city.name} in 3D` : `Choose ${city.name}`}
            aria-pressed={selected === index}
            tabIndex={interactive ? 0 : -1}
            disabled={!interactive}
            className={`glow-city-marker ${selected === index ? "is-selected" : ""} ${index < 3 ? "is-major" : ""}`}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => {
              feedback("tap");
              if (selected === index) {
                router.push(`/${city.slug}/landmarks`);
                return;
              }
              onSelect(index);
            }}
          >
            <span className="glow-marker-dot" />
            <span className="glow-marker-name">{city.short}</span>
          </button>
        ))}
        {pins.map((pin, index) => (
          <button
            key={pin.key}
            ref={(element) => {
              pinLabels.current[index] = element;
            }}
            type="button"
            className={`glow-place-marker ${pin.kind === "landmark" ? "is-landmark" : ""}`}
            aria-label={`Open ${pin.label} in 3D`}
            tabIndex={interactive ? 0 : -1}
            disabled={!interactive}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => {
              feedback("tap");
              router.push(pin.href);
            }}
          >
            <span className="glow-marker-name">{pin.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
