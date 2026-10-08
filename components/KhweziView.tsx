"use client";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, View } from "@react-three/drei";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDrag } from "@use-gesture/react";
import * as THREE from "three";
import KhweziMark from "./KhweziMark";
import { useKhwezi } from "./KhweziProvider";
import { brand, type KhweziPose } from "../lib/brand";

type Props = { pose?: KhweziPose; yaw?: number; index?: number; accent?: string; reset?: number };
function Facet({
  at,
  size,
  color = brand.colors.ivory,
}: {
  at: [number, number, number];
  size: [number, number, number];
  color?: string;
}) {
  return (
    <mesh position={at} scale={size}>
      <sphereGeometry args={[1, 8, 6]} />
      <meshStandardMaterial color={color} flatShading roughness={1} />
    </mesh>
  );
}
function Model({
  pose,
  yaw,
  accent,
  moving,
  visible,
  onReady,
  turn,
}: Required<Omit<Props, "index" | "reset">> & {
  moving: boolean;
  visible: boolean;
  onReady: () => void;
  turn: number;
}) {
  const { invalidate } = useThree();
  const root = useRef<THREE.Group>(null),
    ears = useRef<THREE.Group>(null),
    eyes = useRef<THREE.Group>(null),
    spark = useRef<THREE.Mesh>(null);
  const elapsed = useRef(0),
    ready = useRef(false);
  const tail = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.15, 0.55, -0.25),
          new THREE.Vector3(0.65, 0.35, -0.55),
          new THREE.Vector3(0.8, 0.65, -0.75),
          new THREE.Vector3(0.6, 0.95, -0.8),
        ]),
        12,
        0.055,
        5,
        false,
      ),
    [],
  );
  useEffect(() => () => tail.dispose(), [tail]);
  useEffect(() => {
    elapsed.current = 0;
    invalidate();
  }, [pose, moving, yaw, turn, invalidate]);
  useFrame((_, delta) => {
    if (!ready.current) {
      ready.current = true;
      onReady();
    }
    if (!root.current || !ears.current || !eyes.current || !spark.current) return;
    const active = moving && visible && document.visibilityState === "visible";
    if (active) elapsed.current += Math.min(delta, 0.05);
    const t = active ? elapsed.current : 0;
    const sleeping = pose === "offline";
    root.current.rotation.y =
      yaw + turn + (pose === "gesture" ? Math.sin(t * 1.8) * 0.3 : Math.sin(t * 0.7) * 0.035);
    root.current.position.y =
      pose === "saved"
        ? Math.sin(Math.PI * Math.min(t / 0.9, 1)) * 0.28
        : Math.sin(t * 1.5) * 0.016;
    root.current.scale.setScalar(sleeping ? 0.86 : 1 + Math.sin(t * 1.5) * 0.006);
    ears.current.rotation.z = sleeping ? -0.28 : Math.sin(t * 1.3) * 0.04;
    const blink = t % 5.4 > 5.1 ? 0.12 : 1;
    eyes.current.scale.y = sleeping ? 0.14 : blink;
    const catching = pose === "saved";
    spark.current.position.set(
      catching ? 0.65 * Math.max(0, 1 - t / 1.4) : 0.75 + Math.sin(t * 0.8) * 0.08,
      catching ? 2.25 - Math.min(t / 1.4, 1) * 1.3 : 2.2 + Math.cos(t * 0.8) * 0.1,
      0.55,
    );
    spark.current.rotation.y = t;
    if (active) invalidate();
  });
  return (
    <>
      <PerspectiveCamera makeDefault fov={36} position={[0, 1.5, 5.4]} />
      <ambientLight intensity={2} />
      <directionalLight position={[-3, 5, 4]} intensity={3} />
      <directionalLight position={[3, 1, -2]} intensity={1.2} color="#B8BCFF" />
      <group ref={root}>
        <mesh geometry={tail}>
          <meshStandardMaterial color={brand.colors.ink} flatShading />
        </mesh>
        <Facet at={[0, 0.85, 0]} size={[0.43, 0.57, 0.33]} />
        <Facet at={[-0.3, 0.17, 0.2]} size={[0.25, 0.16, 0.38]} color={brand.colors.ink} />
        <Facet at={[0.3, 0.17, 0.2]} size={[0.25, 0.16, 0.38]} color={brand.colors.ink} />
        <Facet at={[0, 1.65, 0.06]} size={[0.53, 0.48, 0.4]} />
        <group ref={ears} position={[0, 1.93, 0]}>
          {[-1, 1].map((side) => (
            <group key={side} position={[side * 0.25, 0, 0]} rotation={[0, 0, side * -0.15]}>
              <mesh position={[0, 0.48, 0]}>
                <coneGeometry args={[0.17, 1.1, 5]} />
                <meshStandardMaterial color={brand.colors.ivory} flatShading />
              </mesh>
              <mesh position={[0, 0.86, 0]}>
                <coneGeometry args={[0.115, 0.36, 5]} />
                <meshStandardMaterial color={brand.colors.ink} flatShading />
              </mesh>
              <Facet at={[0, 0.35, 0.1]} size={[0.065, 0.28, 0.025]} color={brand.colors.blush} />
            </group>
          ))}
        </group>
        <group ref={eyes} position={[0, 1.7, 0.4]}>
          {[-1, 1].map((side) => (
            <group key={side} position={[side * 0.21, 0, 0]}>
              <Facet at={[0, 0, 0]} size={[0.065, 0.085, 0.035]} color={brand.colors.ink} />
              <Facet at={[0.018, 0.025, 0.03]} size={[0.018, 0.021, 0.012]} color="#FFFFFF" />
            </group>
          ))}
        </group>
        <Facet at={[-0.3, 1.52, 0.33]} size={[0.08, 0.035, 0.025]} color={brand.colors.blush} />
        <Facet at={[0.3, 1.52, 0.33]} size={[0.08, 0.035, 0.025]} color={brand.colors.blush} />
        <mesh position={[0, 1.5, 0.47]} scale={[1, 0.7, 0.6]}>
          <octahedronGeometry args={[0.065]} />
          <meshStandardMaterial color={brand.colors.electric} />
        </mesh>
        <mesh position={[0, 1.41, 0.425]} rotation={[0, 0, Math.PI]} scale={[1, 0.6, 1]}>
          <torusGeometry args={[0.075, 0.012, 3, 12, Math.PI]} />
          <meshStandardMaterial color={brand.colors.ink} />
        </mesh>
        <mesh position={[0, 1.91, 0.39]} scale={[0.8, 1.2, 0.4]}>
          <octahedronGeometry args={[0.065]} />
          <meshBasicMaterial color={accent} />
        </mesh>
        <Facet at={[-0.4, 1, 0.27]} size={[0.11, 0.21, 0.12]} />
        <Facet at={[0.4, 1, 0.27]} size={[0.11, 0.21, 0.12]} />
        <Facet at={[0, 0.63, 0.31]} size={[0.18, 0.13, 0.075]} color={brand.colors.ink} />
        {pose === "welcome" && (
          <group position={[0, 0.98, 0.45]} rotation={[-0.15, 0, 0]}>
            {[-1, 0, 1].map((i) => (
              <mesh
                key={i}
                position={[i * 0.16, 0, Math.abs(i) * 0.04]}
                rotation={[0, i * -0.22, 0]}
              >
                <boxGeometry args={[0.16, 0.33, 0.018]} />
                <meshStandardMaterial color={i === 0 ? "#C3D2ED" : "#7B82C7"} flatShading />
              </mesh>
            ))}
            <mesh position={[0.03, 0.06, 0.03]}>
              <octahedronGeometry args={[0.045]} />
              <meshBasicMaterial color={accent} />
            </mesh>
          </group>
        )}
        {pose === "search" && (
          <group position={[0.4, 1.66, 0.62]}>
            <mesh>
              <torusGeometry args={[0.21, 0.035, 5, 16]} />
              <meshStandardMaterial color={accent} />
            </mesh>
            <mesh position={[0.2, -0.25, 0]} rotation={[0, 0, 0.65]}>
              <cylinderGeometry args={[0.035, 0.035, 0.28, 5]} />
              <meshStandardMaterial color={brand.colors.ink} />
            </mesh>
          </group>
        )}
        {pose === "offline" && (
          <group position={[0.75, 0.45, 0.35]}>
            <mesh>
              <cylinderGeometry args={[0.13, 0.13, 0.28, 6]} />
              <meshStandardMaterial
                color={brand.colors.amber}
                emissive={brand.colors.amber}
                emissiveIntensity={0.3}
              />
            </mesh>
            <mesh position={[0, 0.2, 0]}>
              <coneGeometry args={[0.19, 0.15, 6]} />
              <meshStandardMaterial color={brand.colors.ink} />
            </mesh>
            <mesh position={[0, -0.16, 0]}>
              <cylinderGeometry args={[0.16, 0.16, 0.04, 6]} />
              <meshStandardMaterial color={brand.colors.ink} />
            </mesh>
          </group>
        )}
        <mesh
          ref={spark}
          visible={["saved", "loading", "gesture"].includes(pose)}
          position={[0.75, 2.2, 0.55]}
        >
          <octahedronGeometry args={[0.12]} />
          <meshBasicMaterial color={accent} />
        </mesh>
      </group>
    </>
  );
}
export default function KhweziView({
  pose = "idle",
  yaw = 0,
  index = 3,
  accent = brand.colors.electric,
  reset = 0,
}: Props) {
  const { moving } = useKhwezi();
  const [ready, setReady] = useState(false),
    [visible, setVisible] = useState(true),
    [turn, setTurn] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const onReady = useCallback(() => setReady(true), []);
  useEffect(() => setTurn(0), [reset]);
  useEffect(() => {
    let inView = true;
    const update = () => setVisible(inView && document.visibilityState === "visible");
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      update();
    });
    if (ref.current) observer.observe(ref.current);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  const drag = useDrag(
    ({ offset: [x], tap, last, event }) => {
      event.stopPropagation();
      if (last && tap) setTurn((v) => v + 0.4);
      else if (!tap) setTurn(x * 0.009);
    },
    { axis: "x", filterTaps: true, from: () => [turn / 0.009, 0] },
  );
  return (
    <div ref={ref} className="khwezi-view" data-ready={ready}>
      <KhweziMark pose={pose} className="khwezi-view-fallback" />
      <View index={index} visible={visible} className="khwezi-three-view">
        <Model
          pose={pose}
          yaw={yaw}
          accent={accent}
          moving={moving}
          visible={visible}
          onReady={onReady}
          turn={turn}
        />
      </View>
      <button
        {...drag()}
        className="khwezi-turn"
        aria-label="Turn Khwezi"
        disabled={!ready}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            setTurn((v) => v + (event.key === "ArrowLeft" ? -0.25 : 0.25));
          }
        }}
        onClick={(event) => {
          if (!event.detail) setTurn((v) => v + 0.4);
        }}
      />
    </div>
  );
}
