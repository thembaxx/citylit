"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const skyVertex = `
  varying vec3 vDirection;
  void main() {
    vDirection = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const skyFragment = `
  uniform float uTime;
  uniform float uNight;
  varying vec3 vDirection;
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  void main() {
    vec3 direction = normalize(vDirection);
    float horizon = smoothstep(-0.55, 0.88, direction.y);
    vec3 dusk = mix(vec3(0.025, 0.075, 0.071), vec3(0.13, 0.20, 0.19), horizon);
    dusk = mix(dusk, vec3(0.39, 0.27, 0.19), pow(1.0 - abs(direction.y + 0.08), 12.0) * 0.26);
    vec3 midnight = mix(vec3(0.012, 0.022, 0.039), vec3(0.055, 0.11, 0.15), horizon);
    float auroraLine = sin(direction.x * 8.0 + uTime * 0.14 + sin(direction.z * 7.0)) * 0.5 + 0.5;
    float aurora = smoothstep(0.75, 0.98, auroraLine) * smoothstep(-0.05, 0.38, direction.y) * uNight;
    vec3 color = mix(dusk, midnight, uNight);
    color += vec3(0.10, 0.30, 0.23) * aurora * 0.45;
    float stars = step(0.9978, hash(floor(direction * 310.0)));
    stars *= smoothstep(0.02, 0.58, direction.y) * uNight;
    color += vec3(0.78, 0.81, 0.72) * stars * (0.65 + 0.35 * sin(uTime * 1.4 + direction.x * 12.0));
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
const terrainVertex = `
  uniform float uTime;
  varying vec2 vUv;
  varying float vHeight;
  void main() {
    vUv = uv;
    vec3 p = position;
    float wave = sin(p.x * 0.22 + uTime * 0.12) * cos(p.y * 0.19 - uTime * 0.1) * 0.025;
    p.z += wave;
    vHeight = wave;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;
const terrainFragment = `
  uniform float uTime;
  uniform float uNight;
  uniform vec3 uAccent;
  varying vec2 vUv;
  varying float vHeight;
  void main() {
    vec2 centered = vUv - 0.5;
    float radius = length(centered);
    float gridX = 1.0 - smoothstep(0.0, 0.035, abs(fract(vUv.x * 42.0) - 0.5));
    float gridY = 1.0 - smoothstep(0.0, 0.035, abs(fract(vUv.y * 42.0) - 0.5));
    float grid = max(gridX, gridY) * 0.11;
    float contours = 1.0 - smoothstep(0.0, 0.045, abs(fract(radius * 54.0 + vHeight * 3.0 - uTime * 0.012) - 0.5));
    float glow = exp(-radius * 8.5) * (0.18 + uNight * 0.13);
    float edge = 1.0 - smoothstep(0.34, 0.52, radius);
    vec3 ground = mix(vec3(0.018, 0.047, 0.043), vec3(0.025, 0.064, 0.062), uNight);
    vec3 color = ground + uAccent * (grid * 0.34 + contours * 0.1 + glow) * edge;
    float alpha = edge * (0.72 + grid * 0.4 + contours * 0.08);
    gl_FragColor = vec4(color, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
const sparkVertex = `
  uniform float uTime;
  attribute float aPhase;
  varying float vGlow;
  void main() {
    vec3 p = position;
    p.x += sin(uTime * 0.18 + aPhase * 6.283) * 0.1;
    p.y += sin(uTime * 0.45 + aPhase * 18.0) * 0.12;
    p.z += cos(uTime * 0.14 + aPhase * 6.283) * 0.09;
    vec4 viewPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = clamp(3.2 * (4.0 / -viewPosition.z), 1.4, 5.5);
    vGlow = 0.38 + 0.62 * sin(uTime * 1.2 + aPhase * 31.0) * sin(uTime * 1.2 + aPhase * 31.0);
  }
`;
const sparkFragment = `
  uniform vec3 uAccent;
  uniform float uNight;
  varying float vGlow;
  void main() {
    float radius = length(gl_PointCoord - 0.5);
    float alpha = (1.0 - smoothstep(0.06, 0.5, radius)) * vGlow * (0.34 + uNight * 0.2);
    gl_FragColor = vec4(uAccent, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export default function AtlasWorld({
  night,
  accent = "#e4a95f",
  animate = true,
}: {
  night: boolean;
  accent?: string;
  animate?: boolean;
}) {
  const sky = useRef<THREE.ShaderMaterial>(null);
  const terrain = useRef<THREE.ShaderMaterial>(null);
  const sparks = useRef<THREE.ShaderMaterial>(null);
  const time = useRef(0);
  const nightMix = useRef(night ? 1 : 0);
  const color = useMemo(() => new THREE.Color(accent), [accent]);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uNight: { value: 0 },
      uAccent: { value: new THREE.Color(accent) },
    }),
    [accent],
  );
  const particles = useMemo(() => {
    const count = 56;
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const phase = (i * 0.61803398875) % 1;
      const angle = i * 2.3999632297;
      const radius = 1.9 + ((i * 13) % 35) / 10;
      positions.set(
        [Math.cos(angle) * radius, -0.15 + phase * 2.8, Math.sin(angle) * radius],
        i * 3,
      );
      phases[i] = phase;
    }
    return { positions, phases };
  }, []);
  useFrame((_, delta) => {
    if (animate) time.current += Math.min(delta, 0.05);
    nightMix.current = animate
      ? THREE.MathUtils.damp(nightMix.current, night ? 1 : 0, 3.2, delta)
      : night
        ? 1
        : 0;
    for (const material of [sky.current, terrain.current, sparks.current]) {
      if (!material) continue;
      material.uniforms.uTime.value = time.current;
      material.uniforms.uNight.value = nightMix.current;
    }
    if (terrain.current) terrain.current.uniforms.uAccent.value.copy(color);
    if (sparks.current) sparks.current.uniforms.uAccent.value.copy(color);
  });
  return (
    <>
      <mesh renderOrder={-10} frustumCulled={false}>
        <sphereGeometry args={[70, 32, 20]} />
        <shaderMaterial
          ref={sky}
          vertexShader={skyVertex}
          fragmentShader={skyFragment}
          uniforms={uniforms}
          side={THREE.BackSide}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
      <mesh position={[0, -0.72, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-4}>
        <planeGeometry args={[48, 48, 1, 1]} />
        <shaderMaterial
          ref={terrain}
          vertexShader={terrainVertex}
          fragmentShader={terrainFragment}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, -0.62, 0]} receiveShadow>
        <cylinderGeometry args={[4.68, 4.92, 0.18, 96, 1, false]} />
        <meshPhysicalMaterial
          color={night ? "#1f342d" : "#2b463d"}
          roughness={0.28}
          metalness={0.42}
          clearcoat={0.85}
          clearcoatRoughness={0.22}
        />
      </mesh>
      <mesh position={[0, -0.51, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[4.52, 0.014, 8, 128]} />
        <meshBasicMaterial color={accent} transparent opacity={night ? 0.82 : 0.54} />
      </mesh>
      <mesh position={[0, -0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.9, 0.008, 6, 128]} />
        <meshBasicMaterial color="#b9d49a" transparent opacity={night ? 0.38 : 0.18} />
      </mesh>
      <points position={[0, 0.25, 0]} frustumCulled={false} renderOrder={2} raycast={() => {}}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particles.positions, 3]} />
          <bufferAttribute attach="attributes-aPhase" args={[particles.phases, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={sparks}
          vertexShader={sparkVertex}
          fragmentShader={sparkFragment}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
}
