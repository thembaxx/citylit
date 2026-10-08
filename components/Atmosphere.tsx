"use client";
import { View, OrthographicCamera } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import * as THREE from "three";
import { cities } from "../lib/data";
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
  const parallax = useRef({ x: 0, y: 0 });
  const palette =
    city < 3
      ? palettes[city]
      : [
          cities[city].accentColor,
          palettes[city % palettes.length][1],
          palettes[(city + 1) % palettes.length][2],
        ];
  const reading = ["map", "place", "guide", "editorial"].includes(mode);
  const count =
    mode === "map"
      ? 18
      : mode === "city"
        ? 10
        : mode === "category"
          ? 12
          : mode === "guide"
            ? 10
            : mode === "editorial"
              ? 8
              : 14;
  const objects = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: (i % 2 === 0 ? -1 : 1) * (0.8 + (i % 3) * 0.05),
        y: -0.8 + (i / Math.max(count - 1, 1)) * 1.6,
        phase: i * 1.73 + city * 0.17,
        size: reading ? 0.015 + (i % 3) * 0.007 : 0.07 + (i % 4) * 0.035,
      })),
    [mode, count, reading, city],
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
    if (animate) {
      elapsed.current += Math.min(delta, 0.08);
      const smooth = 1 - Math.exp(-delta * 2);
      parallax.current.x += (pointer.current.x - parallax.current.x) * smooth;
      parallax.current.y += (pointer.current.y - parallax.current.y) * smooth;
    }
    const time = elapsed.current;
    const speed =
      mode === "map"
        ? 0.08
        : mode === "place"
          ? 0.13
          : mode === "guide" || mode === "editorial"
            ? 0.05
            : 0.1;
    root.current.children.forEach((node, i) => {
      const p = objects[i];
      if (!p) return;
      // Keep the central reading area clear; wide, slow paths stay near the edges.
      node.position.x =
        (p.x * viewport.width) / 2 +
        Math.sin(time * speed + p.phase) * 0.07 +
        parallax.current.x * 0.05;
      node.position.y =
        (p.y * viewport.height) / 2 +
        Math.cos(time * speed * 0.8 + p.phase) * 0.13 -
        parallax.current.y * 0.05;
      node.rotation.x = p.phase + time * 0.012;
      node.rotation.y = p.phase * 0.5 + time * 0.018;
      node.rotation.z = p.phase + time * (mode === "category" ? 0.02 : 0.012);
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
            {reading ? (
              <icosahedronGeometry args={[p.size, 0]} />
            ) : mode === "city" && city % 3 === 0 ? (
              <octahedronGeometry args={[p.size, 0]} />
            ) : mode === "city" && city % 3 === 2 ? (
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
              opacity={night ? (reading ? 0.22 : 0.13) : 0.2}
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
