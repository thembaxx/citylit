"use client";
import { View, PerspectiveCamera, Line } from "@react-three/drei";
import { useThree, useFrame, invalidate as redraw } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import gsap from "gsap";
import SafeStageModel from "./SafeStageModel";
import type { StageItem } from "./CityStage";

// Small, original geometry adds a sense of place without introducing licensed GLB files.
// This is illustrative scenery, never a real street or geospatial representation.
function MiniatureStreet() {
  return (
    <group position={[0, -0.43, 0]}>
      <mesh position={[0, 0.03, 1.46]} receiveShadow>
        <boxGeometry args={[3.4, 0.06, 0.48]} />
        <meshStandardMaterial color="#4c5450" roughness={0.94} />
      </mesh>
      {[-1.2, -0.4, 0.4, 1.2].map((x) => (
        <mesh key={x} position={[x, 0.067, 1.46]}>
          <boxGeometry args={[0.32, 0.004, 0.02]} />
          <meshBasicMaterial color="#fae9c7" />
        </mesh>
      ))}
      {[-1.33, 1.33].map((x, index) => (
        <group key={x} position={[x, 0, 0.96]} scale={0.45}>
          <mesh position={[0, 0.48, 0]} castShadow>
            <boxGeometry args={[0.7, 0.96, 0.64]} />
            <meshStandardMaterial color={index ? "#f5c5a1" : "#f3dcaf"} roughness={0.85} />
          </mesh>
          <mesh position={[0, 1.03, 0]} castShadow>
            <coneGeometry args={[0.63, 0.46, 4]} />
            <meshStandardMaterial color="#796d58" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.45, 0.327]}>
            <boxGeometry args={[0.16, 0.2, 0.012]} />
            <meshStandardMaterial color="#649db0" />
          </mesh>
        </group>
      ))}
      {[-0.95, 0.96].map((x) => (
        <group key={x} position={[x, 0, -1.32]}>
          <mesh position={[0, 0.22, 0]}>
            <cylinderGeometry args={[0.035, 0.05, 0.44, 6]} />
            <meshStandardMaterial color="#936d45" />
          </mesh>
          <mesh position={[0, 0.51, 0]} castShadow>
            <icosahedronGeometry args={[0.28, 1]} />
            <meshStandardMaterial color="#76a866" roughness={1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Ring({
  items,
  selected,
  onSelect,
  angle,
  itinerary,
  dragging,
  settle,
}: {
  items: StageItem[];
  selected: number;
  onSelect: (index: number) => void;
  angle: React.RefObject<number>;
  itinerary: string[];
  dragging: React.RefObject<boolean>;
  settle: number;
}) {
  const ring = useRef<THREE.Group>(null);
  const { size, invalidate, camera } = useThree();
  const radius = items.length < 4 ? 2.8 : 3.8;
  useEffect(() => {
    if (!ring.current) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const target = (-selected * Math.PI * 2) / items.length;
    const current = ring.current.rotation.y;
    const delta =
      THREE.MathUtils.euclideanModulo(target - current + Math.PI, Math.PI * 2) - Math.PI;
    const tween = gsap.to(ring.current.rotation, {
      y: current + delta,
      duration: reduced ? 0 : 0.75,
      ease: "power3.out",
      onUpdate: () => {
        angle.current = ring.current!.rotation.y;
        invalidate();
      },
    });
    camera.lookAt(0, 0.55, 0);
    invalidate();
    return () => {
      tween.kill();
    };
  }, [selected, items.length, camera, angle, invalidate, settle]);
  useFrame(() => {
    if (dragging.current && ring.current) {
      gsap.killTweensOf(ring.current.rotation);
      ring.current.rotation.y = angle.current;
    }
  });
  const positions = items.map((_, i): [number, number, number] => [
    Math.sin((i * Math.PI * 2) / items.length) * radius,
    0.02,
    Math.cos((i * Math.PI * 2) / items.length) * radius,
  ]);
  const route = itinerary.flatMap((id) => {
    const index = items.findIndex((item) => item.place?.id === id);
    return index >= 0 ? [positions[index]] : [];
  });
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 3.2, 10.8]} fov={42} />
      <ambientLight intensity={1.8} />
      <directionalLight position={[4, 7, 5]} intensity={2.5} />
      <group position={[size.width > size.height ? 1.45 : 0, 0, 0]}>
        <group ref={ring}>
          {items.map((item, index) => (
            <group
              key={item.name}
              position={positions[index]}
              scale={index === selected ? 1 : 0.6}
              onClick={(event) => {
                event.stopPropagation();
                onSelect(index);
              }}
            >
              <SafeStageModel model={item.model} />
              {index === selected && <MiniatureStreet />}
            </group>
          ))}
          {route.length > 1 && (
            <Line
              points={route}
              color="#d9660b"
              lineWidth={2.5}
              dashed
              dashSize={0.12}
              gapSize={0.08}
            />
          )}
        </group>
      </group>
    </>
  );
}

export default function LandmarkRing({
  items,
  selected,
  onSelect,
  itinerary,
}: {
  items: StageItem[];
  selected: number;
  onSelect: (index: number) => void;
  itinerary: string[];
}) {
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const angle = useRef(0);
  const drag = useRef<{ x: number; y: number; angle: number } | null>(null);
  const dragging = useRef(false);
  const moved = useRef(false);
  const [settle, setSettle] = useState(0);
  return (
    <div
      ref={setHost}
      className="atlas-ring-scene"
      role="group"
      aria-label="Interactive illustrative landmark models"
      onPointerDown={(event) => {
        if (event.button === 0) {
          drag.current = { x: event.clientX, y: event.clientY, angle: angle.current };
          moved.current = false;
        }
      }}
      onPointerMove={(event) => {
        if (!drag.current) return;
        const dx = event.clientX - drag.current.x,
          dy = event.clientY - drag.current.y;
        if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.2) {
          dragging.current = true;
          moved.current = true;
          angle.current = drag.current.angle + dx * 0.009;
          event.currentTarget.setPointerCapture(event.pointerId);
          redraw();
        }
      }}
      onPointerUp={() => {
        if (!drag.current) return;
        drag.current = null;
        dragging.current = false;
        if (moved.current) {
          const snapped = Math.round((-angle.current / (Math.PI * 2)) * items.length);
          onSelect(((snapped % items.length) + items.length) % items.length);
          setSettle((value) => value + 1);
        }
      }}
      onPointerCancel={() => {
        drag.current = null;
        dragging.current = false;
        setSettle((value) => value + 1);
      }}
    >
      <View className="atlas-ring-view" index={2}>
        {host && (
          <Ring
            items={items}
            selected={selected}
            onSelect={(index) => {
              if (!moved.current) onSelect(index);
            }}
            angle={angle}
            itinerary={itinerary}
            dragging={dragging}
            settle={settle}
          />
        )}
      </View>
    </div>
  );
}
