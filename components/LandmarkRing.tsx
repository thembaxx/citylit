"use client";
import { View, PerspectiveCamera, Line } from "@react-three/drei";
import { useThree, useFrame, invalidate as redraw } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import gsap from "gsap";
import StageModel from "./StageModel";
import type { StageItem } from "./CityStage";

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
              <Suspense fallback={null}>
                <StageModel model={item.model} />
              </Suspense>
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
