"use client";
import { View, OrthographicCamera } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import * as THREE from "three";
type Props = { mode: string; city: number; category: number; night: boolean; animate: boolean };
const palettes = [
  ["#edb94c", "#b69bff", "#f391b5"],
  ["#62baff", "#bfabff", "#8de1d5"],
  ["#5bdabe", "#89baff", "#f5b897"],
];
function Dreamscape({ mode, city, category, night, animate }: Props) {
  const { invalidate, viewport } = useThree();
  const root = useRef<THREE.Group>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const elapsed = useRef(0);
  const palette = palettes[city];
  const count = mode === "map" ? 32 : mode === "city" ? 14 : mode === "category" ? 18 : 24;
  const objects = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: Math.sin(i * 2.399) * (0.25 + (i % 7) * 0.1),
        y: Math.cos(i * 2.399) * (0.3 + (i % 5) * 0.13),
        phase: i * 1.73,
        size: mode === "map" ? 0.018 + (i % 3) * 0.009 : 0.1 + (i % 4) * 0.06,
      })),
    [mode, count],
  );
  useEffect(() => {
    if (!animate) return;
    // 24fps keeps this decorative layer inexpensive and stops demand rendering when paused.
    const timer = window.setInterval(invalidate, 1000 / 24);
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      pointer.current = {
        x: event.clientX / window.innerWidth - 0.5,
        y: event.clientY / window.innerHeight - 0.5,
      };
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      clearInterval(timer);
      window.removeEventListener("pointermove", move);
    };
  }, [animate, invalidate]);
  useFrame((_, delta) => {
    if (!root.current) return;
    if (animate) elapsed.current += Math.min(delta, 0.08);
    const time = elapsed.current;
    root.current.children.forEach((node, i) => {
      const p = objects[i];
      if (!p) return;
      node.position.x =
        (p.x * viewport.width) / 2 +
        Math.sin(time * 0.2 + p.phase) * 0.12 +
        pointer.current.x * 0.12;
      node.position.y =
        (p.y * viewport.height) / 2 +
        Math.cos(time * 0.17 + p.phase) * 0.15 -
        pointer.current.y * 0.12;
      node.rotation.x = p.phase + time * 0.035;
      node.rotation.y = p.phase * 0.5 + time * 0.055;
      node.rotation.z = p.phase + time * (mode === "category" ? 0.07 : 0.025);
    });
  });
  return (
    <>
      <OrthographicCamera makeDefault position={[0, 0, 12]} zoom={75} near={0.1} far={30} />
      <group ref={root}>
        {objects.map((p, i) => (
          <mesh
            key={i}
            position={[(p.x * viewport.width) / 2, (p.y * viewport.height) / 2, -2]}
            raycast={() => {}}
          >
            {mode === "map" || mode === "place" ? (
              <icosahedronGeometry args={[p.size, 0]} />
            ) : mode === "city" && city === 0 ? (
              <octahedronGeometry args={[p.size, 0]} />
            ) : mode === "city" && city === 2 ? (
              <torusGeometry args={[p.size * 1.8, 0.012, 4, 32, Math.PI * 1.5]} />
            ) : mode === "category" && category === 0 ? (
              <sphereGeometry args={[p.size, 8, 6]} />
            ) : mode === "category" && category === 1 ? (
              <boxGeometry args={[p.size * 1.5, p.size * 0.6, p.size]} />
            ) : mode === "category" && category === 2 ? (
              <coneGeometry args={[p.size, p.size * 2, 5]} />
            ) : mode === "category" && category === 3 ? (
              <tetrahedronGeometry args={[p.size, 0]} />
            ) : (
              <torusGeometry args={[p.size * 1.5, 0.016, 5, 32]} />
            )}
            <meshBasicMaterial
              color={palette[i % 3]}
              transparent
              opacity={night ? (mode === "map" ? 0.5 : 0.25) : 0.4}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
    </>
  );
}
export default function Atmosphere(props: Props) {
  const [visible, setVisible] = useState(true);
  const reduced = useReducedMotion();
  useEffect(() => {
    const change = () => setVisible(document.visibilityState === "visible");
    change();
    document.addEventListener("visibilitychange", change);
    return () => document.removeEventListener("visibilitychange", change);
  }, []);
  return (
    <View
      index={1}
      className="dreamscape-view"
      style={{ position: "fixed", inset: 0, pointerEvents: "none" }}
    >
      <Dreamscape {...props} animate={props.animate && visible && !reduced} />
    </View>
  );
}
