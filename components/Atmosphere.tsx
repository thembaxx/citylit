"use client";
import { View, OrthographicCamera } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import * as THREE from "three";
import { cities } from "../lib/data";
type Props = { mode: string; city: number; category: number; night: boolean; animate: boolean };
const ink = ["#ff7a59", "#ffd166", "#8bd450", "#f48cb6", "#c084fc", "#3ec8c2"];
function Dreamscape({ mode, city, category, night, animate }: Props) {
  const { invalidate, viewport } = useThree();
  const root = useRef<THREE.Group>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const parallax = useRef({ x: 0, y: 0 });
  const gust = useRef(0);
  const scroll = useRef(0);
  const elapsed = useRef(0);
  const accent = city < cities.length ? cities[city].accentColor : ink[0];
  const reading = ["map", "place", "guide", "editorial"].includes(mode);
  const count = mode === "map" ? 14 : mode === "category" ? 16 : reading ? 10 : 12;
  const objects = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: (i % 2 === 0 ? -1 : 1) * (0.72 + (i % 4) * 0.06),
        y: -0.85 + (i / Math.max(count - 1, 1)) * 1.7,
        phase: i * 1.37 + category * 0.2,
        size: reading ? 0.045 + (i % 3) * 0.012 : 0.08 + (i % 3) * 0.03,
        kind: i % 4,
        color: i % 5 === 0 ? accent : ink[(i + category) % ink.length],
      })),
    [mode, count, reading, category, accent],
  );
  useEffect(() => {
    if (!animate) return;
    const timer = window.setInterval(invalidate, 1000 / 24);
    const move = (event: PointerEvent) => {
      pointer.current = {
        x: event.clientX / window.innerWidth - 0.5,
        y: event.clientY / window.innerHeight - 0.5,
      };
    };
    const wheel = (event: WheelEvent) => {
      gust.current = THREE.MathUtils.clamp(gust.current + event.deltaY * 0.0016, -1.4, 1.4);
    };
    const scrolled = (event: Event) => {
      const target = event.target;
      if (target instanceof Element) scroll.current = target.scrollTop;
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("wheel", wheel, { passive: true });
    document.addEventListener("scroll", scrolled, true);
    return () => {
      clearInterval(timer);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("wheel", wheel);
      document.removeEventListener("scroll", scrolled, true);
    };
  }, [animate, invalidate]);
  useFrame((_, delta) => {
    if (!root.current) return;
    const step = Math.min(delta, 0.08);
    if (animate) {
      elapsed.current += step;
      const smooth = 1 - Math.exp(-step * 3);
      parallax.current.x += (pointer.current.x - parallax.current.x) * smooth;
      parallax.current.y += (pointer.current.y - parallax.current.y) * smooth;
      gust.current *= 0.96;
    }
    const time = elapsed.current;
    const drift = scroll.current * 0.0008 + gust.current * 0.35;
    root.current.children.forEach((node, i) => {
      const p = objects[i];
      if (!p) return;
      const bob = animate ? Math.sin(time * 0.55 + p.phase) : 0;
      node.position.x = (p.x * viewport.width) / 2 + parallax.current.x * 0.55 + bob * 0.08;
      node.position.y =
        (p.y * viewport.height) / 2 - parallax.current.y * 0.4 - drift * (0.4 + (i % 3) * 0.15);
      node.rotation.z = p.phase + (animate ? time * 0.15 + gust.current : 0);
      node.rotation.y = parallax.current.x * 0.6;
    });
  });
  return (
    <>
      <OrthographicCamera makeDefault position={[0, 0, 12]} zoom={70} near={0.1} far={30} />
      <group ref={root}>
        {objects.map((p, i) => (
          <mesh
            key={`${mode}-${i}`}
            position={[(p.x * viewport.width) / 2, (p.y * viewport.height) / 2, -2]}
            raycast={() => {}}
          >
            {p.kind === 0 ? (
              <boxGeometry args={[p.size * 1.3, p.size * 0.85, p.size * 0.2]} />
            ) : p.kind === 1 ? (
              <coneGeometry args={[p.size * 0.7, p.size * 1.4, 5]} />
            ) : p.kind === 2 ? (
              <icosahedronGeometry args={[p.size * 0.7, 0]} />
            ) : (
              <octahedronGeometry args={[p.size * 0.65, 0]} />
            )}
            <meshBasicMaterial
              color={p.color}
              transparent
              opacity={night ? 0.16 : 0.28}
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
