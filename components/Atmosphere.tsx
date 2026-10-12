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
  const count = mode === "map" ? 9 : mode === "category" ? 10 : reading ? 7 : 8;
  const objects = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: (i % 2 === 0 ? -1 : 1) * (0.72 + (i % 4) * 0.06),
        y: -0.85 + (i / Math.max(count - 1, 1)) * 1.7,
        phase: i * 1.37 + category * 0.2,
        size: reading ? 0.07 + (i % 3) * 0.02 : 0.12 + (i % 3) * 0.045,
        kind: i % 4,
        color: i % 5 === 0 ? accent : ink[(i + category) % ink.length],
      })),
    [mode, count, reading, category, accent],
  );
  useEffect(() => {
    if (!animate) return;
    const move = (event: PointerEvent) => {
      pointer.current = {
        x: event.clientX / window.innerWidth - 0.5,
        y: event.clientY / window.innerHeight - 0.5,
      };
    };
    const wheel = (event: WheelEvent) => {
      gust.current = THREE.MathUtils.clamp(gust.current + event.deltaY * 0.0012, -1.2, 1.2);
    };
    const scrolled = (event: Event) => {
      const target = event.target;
      if (target instanceof Element) scroll.current = target.scrollTop;
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("wheel", wheel, { passive: true });
    document.addEventListener("scroll", scrolled, true);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("wheel", wheel);
      document.removeEventListener("scroll", scrolled, true);
    };
  }, [animate]);
  const halo = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (!root.current) return;
    const step = Math.min(delta, 0.05);
    if (animate) {
      elapsed.current += step;
      const smooth = 1 - Math.exp(-step * 2.4);
      parallax.current.x += (pointer.current.x - parallax.current.x) * smooth;
      parallax.current.y += (pointer.current.y - parallax.current.y) * smooth;
      gust.current *= 0.97;
      if (halo.current) halo.current.rotation.z += step * 0.08;
      invalidate();
    }
    const time = elapsed.current;
    const drift = scroll.current * 0.0008 + gust.current * 0.28;
    root.current.children.forEach((node, i) => {
      const p = objects[i];
      if (!p) return;
      const bob = animate ? Math.sin(time * 0.42 + p.phase) : 0;
      node.position.x = (p.x * viewport.width) / 2 + parallax.current.x * 0.7 + bob * 0.12;
      node.position.y =
        (p.y * viewport.height) / 2 - parallax.current.y * 0.45 - drift * (0.35 + (i % 3) * 0.12);
      node.rotation.z = p.phase * 0.2 + (animate ? time * 0.08 : 0);
      node.rotation.y = parallax.current.x * 0.4;
    });
  });
  return (
    <>
      <OrthographicCamera makeDefault position={[0, 0, 12]} zoom={70} near={0.1} far={30} />
      <group ref={root}>
        {objects.map((p, i) => (
          <mesh
            key={`${mode}-${i}`}
            position={[(p.x * viewport.width) / 2, (p.y * viewport.height) / 2, -2 - (i % 3) * 0.4]}
            raycast={() => {}}
          >
            <sphereGeometry args={[p.size, 18, 14]} />
            <meshBasicMaterial
              color={p.color}
              transparent
              opacity={night ? 0.1 + (i % 3) * 0.03 : 0.16 + (i % 3) * 0.04}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
      <mesh ref={halo} position={[0, -0.2, -4]} raycast={() => {}}>
        <torusGeometry args={[2.4, 0.012, 8, 64]} />
        <meshBasicMaterial
          color={accent}
          transparent
          opacity={night ? 0.12 : 0.2}
          depthWrite={false}
        />
      </mesh>
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
