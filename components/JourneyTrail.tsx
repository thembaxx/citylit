"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const fragmentShader = `
  uniform float uTime;
  uniform vec3 uAccent;
  varying vec2 vUv;
  void main() {
    float headA = fract(uTime * 0.11);
    float headB = fract(uTime * 0.11 + 0.5);
    float trailA = fract(headA - vUv.x);
    float trailB = fract(headB - vUv.x);
    float cometA = exp(-trailA * 18.0) * smoothstep(0.0, 0.02, trailA);
    float cometB = exp(-trailB * 22.0) * smoothstep(0.0, 0.02, trailB) * 0.65;
    float pulse = max(cometA, cometB);
    float ticks = 0.85 + 0.15 * sin(vUv.x * 96.0);
    float line = (0.28 + pulse * 1.35) * ticks;
    vec3 color = mix(uAccent, vec3(0.99, 0.94, 0.82), pulse * 0.42);
    gl_FragColor = vec4(color * line, 0.22 + pulse * 0.76);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export default function JourneyTrail({
  points,
  active,
  animate,
  accent,
}: {
  points: [number, number, number][];
  active: boolean;
  animate: boolean;
  accent: string;
}) {
  const marker = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const path = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        points.map(([x, y, z]) => new THREE.Vector3(x, y + 0.075, z)),
        false,
        "centripetal",
      ),
    [points],
  );
  const geometry = useMemo(
    () => new THREE.TubeGeometry(path, Math.max(64, points.length * 32), 0.018, 8, false),
    [path, points.length],
  );
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uAccent: { value: new THREE.Color(accent) } }),
    [accent],
  );
  const color = useMemo(() => new THREE.Color(accent), [accent]);
  useFrame(({ clock }) => {
    if (!active) return;
    const elapsed = animate ? clock.elapsedTime : 0;
    const progress = (elapsed * 0.1) % 1;
    if (material.current) material.current.uniforms.uTime.value = elapsed;
    if (marker.current) {
      path.getPointAt(progress, marker.current.position);
      marker.current.position.y += 0.18;
      marker.current.rotation.y = elapsed * 1.4;
      marker.current.rotation.x = elapsed * 0.65;
    }
    if (material.current) material.current.uniforms.uAccent.value.copy(color);
  });
  return (
    <group>
      <mesh geometry={geometry}>
        <shaderMaterial
          ref={material}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={marker} scale={0.1}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>
    </group>
  );
}
