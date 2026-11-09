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
    vec3 dusk = mix(vec3(0.055, 0.059, 0.075), vec3(0.135, 0.145, 0.178), horizon);
    dusk = mix(dusk, vec3(0.32, 0.24, 0.18), pow(1.0 - abs(direction.y + 0.08), 12.0) * 0.22);
    vec3 midnight = mix(vec3(0.024, 0.027, 0.036), vec3(0.072, 0.078, 0.102), horizon);
    float auroraLine = sin(direction.x * 8.0 + uTime * 0.14 + sin(direction.z * 7.0)) * 0.5 + 0.5;
    float aurora = smoothstep(0.75, 0.98, auroraLine) * smoothstep(-0.05, 0.38, direction.y) * uNight;
    vec3 color = mix(dusk, midnight, uNight);
    color += vec3(0.24, 0.20, 0.15) * aurora * 0.36;
    float stars = step(0.9978, hash(floor(direction * 310.0)));
    stars *= smoothstep(0.02, 0.58, direction.y) * uNight;
    color += vec3(0.84, 0.86, 0.92) * stars * (0.65 + 0.35 * sin(uTime * 1.4 + direction.x * 12.0));
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
    float gridX = 1.0 - smoothstep(0.0, 0.032, abs(fract(vUv.x * 42.0) - 0.5));
    float gridY = 1.0 - smoothstep(0.0, 0.032, abs(fract(vUv.y * 42.0) - 0.5));
    float grid = max(gridX, gridY) * 0.1;
    float contours = 1.0 - smoothstep(0.0, 0.04, abs(fract(radius * 54.0 + vHeight * 3.0 - uTime * 0.012) - 0.5));
    float waveRing = exp(-pow((radius - fract(uTime * 0.04) * 0.36) * 28.0, 2.0)) * 0.14;
    float glow = exp(-radius * 8.2) * (0.2 + uNight * 0.14) + waveRing;
    float edge = 1.0 - smoothstep(0.32, 0.5, radius);
    vec3 ground = mix(vec3(0.048, 0.052, 0.068), vec3(0.032, 0.035, 0.046), uNight);
    vec3 color = ground + uAccent * (grid * 0.34 + contours * 0.11 + glow) * edge;
    float alpha = edge * (0.78 + grid * 0.38 + contours * 0.09);
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
    gl_PointSize = clamp(3.4 * (4.0 / -viewPosition.z), 1.4, 5.8);
    vGlow = 0.4 + 0.6 * sin(uTime * 1.15 + aPhase * 31.0) * sin(uTime * 1.15 + aPhase * 31.0);
  }
`;
const sparkFragment = `
  uniform vec3 uAccent;
  uniform float uNight;
  varying float vGlow;
  void main() {
    float radius = length(gl_PointCoord - 0.5);
    if (radius > 0.5) discard;
    float core = exp(-radius * radius * 16.0);
    float aura = 1.0 - smoothstep(0.06, 0.5, radius);
    float alpha = mix(aura, core, 0.55) * vGlow * (0.36 + uNight * 0.22);
    vec3 tint = mix(uAccent, vec3(0.98, 0.94, 0.84), core * 0.35);
    gl_FragColor = vec4(tint, alpha);
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
          color={night ? "#181a22" : "#222531"}
          roughness={0.25}
          metalness={0.48}
          clearcoat={0.88}
          clearcoatRoughness={0.2}
        />
      </mesh>
      <mesh position={[0, -0.51, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[4.52, 0.014, 8, 128]} />
        <meshBasicMaterial color={accent} transparent opacity={night ? 0.85 : 0.6} />
      </mesh>
      <mesh position={[0, -0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.9, 0.008, 6, 128]} />
        <meshBasicMaterial color="#d0d5e2" transparent opacity={night ? 0.36 : 0.2} />
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
