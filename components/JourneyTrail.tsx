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
    float head = fract(uTime * 0.1);
    float distanceToHead = abs(vUv.x - head);
    distanceToHead = min(distanceToHead, 1.0 - distanceToHead);
    float pulse = exp(-distanceToHead * distanceToHead * 920.0);
    float line = 0.3 + pulse * 1.25;
    gl_FragColor = vec4(uAccent * line, 0.2 + pulse * 0.78);
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
