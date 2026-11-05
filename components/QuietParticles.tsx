"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";

// All displacement happens in the vertex shader: there are no per-particle JS updates.
const vertexShader = `
  uniform float uTime;
  uniform vec2 uPointer;
  attribute float aPhase;
  varying float vAlpha;

  void main() {
    vec3 p = position;
    p.x += sin(uTime * 0.28 + aPhase * 6.28318) * 0.085 + uPointer.x * 0.16;
    p.y += cos(uTime * 0.21 + aPhase * 8.0) * 0.11 - uPointer.y * 0.12;
    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = 1.8 + 2.0 * (0.5 + 0.5 * sin(aPhase * 13.0 + uTime * 0.9));
    vAlpha = 0.48 + 0.52 * sin(aPhase * 7.0 + uTime * 0.52) * sin(aPhase * 7.0 + uTime * 0.52);
  }
`;
const fragmentShader = `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;
  void main() {
    float radius = length(gl_PointCoord - vec2(0.5));
    float soft = 1.0 - smoothstep(0.05, 0.5, radius);
    gl_FragColor = vec4(uColor, soft * vAlpha * uOpacity);
    #include <colorspace_fragment>
  }
`;

export default function QuietParticles({
  accent,
  animate,
  night,
  reading,
  pointer,
}: {
  accent: string;
  animate: boolean;
  night: boolean;
  reading: boolean;
  pointer: RefObject<{ x: number; y: number }>;
}) {
  const { viewport } = useThree();
  const material = useRef<THREE.ShaderMaterial>(null);
  const time = useRef(0);
  const count = reading ? 20 : 64;
  const attributes = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // Deterministic edge distribution keeps the central interface quiet.
      const a = ((i * 0.61803398875) % 1);
      const b = ((i * 0.754877666) % 1);
      positions[i * 3] = (i % 2 ? 1 : -1) * (0.68 + a * 0.28) * viewport.width * 0.5;
      positions[i * 3 + 1] = (b - 0.5) * viewport.height * 0.86;
      positions[i * 3 + 2] = -5.5;
      phases[i] = (i * 0.41421356237) % 1;
    }
    return { positions, phases };
  }, [count, viewport.width, viewport.height]);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uPointer: { value: new THREE.Vector2() },
    uColor: { value: new THREE.Color(accent) },
    uOpacity: { value: night ? 0.24 : 0.15 },
  }), []); // Shader uniforms are updated below without reallocating.
  useFrame((_, delta) => {
    const shader = material.current;
    if (!shader) return;
    if (animate) time.current += Math.min(delta, 0.05);
    shader.uniforms.uTime.value = time.current;
    shader.uniforms.uPointer.value.set(pointer.current.x, pointer.current.y);
    shader.uniforms.uColor.value.set(accent);
    shader.uniforms.uOpacity.value = night ? 0.24 : 0.15;
  });
  return (
    <points frustumCulled={false} raycast={() => {}}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[attributes.positions, 3]} />
        <bufferAttribute attach="attributes-aPhase" args={[attributes.phases, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.NormalBlending}
      />
    </points>
  );
}
