"use client";

import { View, PerspectiveCamera } from "@react-three/drei";
import { invalidate as redraw, useFrame, useThree } from "@react-three/fiber";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Eye, X } from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import * as THREE from "three";
import type { StageItem } from "./CityStage";
import SafeStageModel from "./SafeStageModel";
import { useKhwezi } from "./KhweziProvider";

function DistrictScene({
  items,
  accent,
  keys,
  touchDirection,
  onNearby,
}: {
  items: StageItem[];
  accent: string;
  keys: React.RefObject<Set<string>>;
  touchDirection: React.RefObject<string | null>;
  onNearby: (index: number) => void;
}) {
  const player = useRef<THREE.Group>(null);
  const cameraTarget = useRef(new THREE.Vector3());
  const { camera, invalidate } = useThree();
  const reduced = useReducedMotion();
  const [nearby, setNearby] = useState(-1);
  const lastNearby = useRef(-2);
  const lastTime = useRef(0);

  const stops = useMemo(
    () =>
      items.slice(0, 3).map((item, index) => ({
        item,
        index,
        position: new THREE.Vector3(index % 2 === 0 ? -2.8 : 2.8, 0, -4 + index * 4),
      })),
    [items],
  );

  useFrame((state, delta) => {
    if (!player.current) return;
    const now = state.clock.elapsedTime;
    const forward =
      keys.current.has("w") || keys.current.has("arrowup") || touchDirection.current === "up";
    const backward =
      keys.current.has("s") || keys.current.has("arrowdown") || touchDirection.current === "down";
    const left =
      keys.current.has("a") || keys.current.has("arrowleft") || touchDirection.current === "left";
    const right =
      keys.current.has("d") || keys.current.has("arrowright") || touchDirection.current === "right";
    const movement = new THREE.Vector3(
      Number(right) - Number(left),
      0,
      Number(backward) - Number(forward),
    );
    if (movement.lengthSq() > 0) {
      movement.normalize().multiplyScalar(Math.min(delta, 0.05) * 2.65);
      player.current.position.add(movement);
      player.current.position.x = THREE.MathUtils.clamp(player.current.position.x, -1.3, 1.3);
      player.current.position.z = THREE.MathUtils.clamp(player.current.position.z, -6, 6);
      player.current.rotation.y = Math.atan2(movement.x, movement.z) + Math.PI;
    }
    const p = player.current.position;
    cameraTarget.current.set(p.x, 2.15, p.z + 3.7);
    camera.position.lerp(cameraTarget.current, 1 - Math.exp(-delta * 4));
    camera.lookAt(p.x, 1.25, p.z - 0.9);
    if (now - lastTime.current > 0.16) {
      const nearest = stops.reduce(
        (best, stop) => {
          const distance = p.distanceTo(stop.position);
          return distance < best.distance ? { index: stop.index, distance } : best;
        },
        { index: -1, distance: Infinity },
      );
      const nextNearby = nearest.distance < 2.25 ? nearest.index : -1;
      if (lastNearby.current !== nextNearby) {
        lastNearby.current = nextNearby;
        setNearby(nextNearby);
        if (nextNearby >= 0) onNearby(nextNearby);
      }
      lastTime.current = now;
    }
    const moving = movement.lengthSq() > 0;
    if (!reduced && moving)
      player.current.children[0].position.y = 0.05 + Math.sin(now * 5) * 0.035;
    else player.current.children[0].position.y = 0;
    if (moving || camera.position.distanceToSquared(cameraTarget.current) > 0.0004) invalidate();
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 2.15, 7.7]} fov={55} />
      <hemisphereLight args={["#e4e7f0", "#454854", 1.75]} />
      <directionalLight position={[-5, 9, 4]} intensity={2.2} color="#fff2d6" castShadow />
      <group>
        <mesh renderOrder={-1}>
          <sphereGeometry args={[45, 32, 24]} />
          <shaderMaterial
            vertexShader={`varying vec3 vSkyPosition; void main() { vSkyPosition = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
            fragmentShader={`varying vec3 vSkyPosition; void main() { float horizon = smoothstep(-0.3, 0.72, normalize(vSkyPosition).y); vec3 low = vec3(0.24, 0.25, 0.30); vec3 high = vec3(0.09, 0.10, 0.14); gl_FragColor = vec4(mix(low, high, horizon), 1.0); }`}
            side={THREE.BackSide}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]} receiveShadow>
          <planeGeometry args={[40, 32]} />
          <meshStandardMaterial color="#2a2d36" roughness={0.96} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[3.6, 19]} />
          <meshStandardMaterial color="#1d1f26" roughness={0.92} />
        </mesh>
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={i} position={[0, 0.012, -7 + i * 2]}>
            <boxGeometry args={[0.08, 0.012, 0.9]} />
            <meshBasicMaterial color="#eddbb8" />
          </mesh>
        ))}
        {[-1, 1].map((side) => (
          <group key={side}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[side * 2.65, 0.035, 0]}>
              <planeGeometry args={[1.7, 19]} />
              <meshStandardMaterial color="#d3c4a4" roughness={1} />
            </mesh>
            {[-5, -1, 3, 7].map((z, i) => (
              <group key={z} position={[side * 4, 0, z]} scale={0.76 + (i % 2) * 0.12}>
                <mesh position={[0, 1.05, 0]} castShadow>
                  <boxGeometry args={[2.5, 2.1, 2.5]} />
                  <meshStandardMaterial color={i % 2 ? "#d4ad87" : "#e4c9a2"} roughness={0.9} />
                </mesh>
                <mesh position={[0, 2.24, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                  <coneGeometry args={[1.95, 0.9, 4]} />
                  <meshStandardMaterial color={i % 2 ? "#686c58" : "#86735e"} roughness={0.86} />
                </mesh>
                <mesh position={[0, 0.58, 1.27]}>
                  <boxGeometry args={[0.42, 1.05, 0.06]} />
                  <meshStandardMaterial color="#66594a" roughness={0.9} />
                </mesh>
                {[-0.7, 0.7].map((x) => (
                  <mesh key={x} position={[x, 1.35, 1.28]}>
                    <boxGeometry args={[0.46, 0.55, 0.07]} />
                    <meshStandardMaterial color="#89a9a0" roughness={0.35} />
                  </mesh>
                ))}
              </group>
            ))}
          </group>
        ))}
        {stops.map(({ item, index, position }) => (
          <group key={item.name} position={position.toArray()}>
            <mesh position={[0, 0.05, 0]}>
              <cylinderGeometry args={[0.92, 0.92, 0.08, 48]} />
              <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.16} />
            </mesh>
            <group scale={0.58} position={[0, 0.13, 0]}>
              <SafeStageModel
                model={item.model}
                name={item.name}
                active
                reduced={!!reduced}
                night={false}
              />
            </group>
            <pointLight
              position={[0, 1.4, 0]}
              color={accent}
              intensity={nearby === index ? 2.4 : 0.55}
              distance={3.2}
            />
          </group>
        ))}
        <group ref={player} position={[0, 0, 6]}>
          <group>
            <mesh position={[0, 0.92, 0]} castShadow>
              <capsuleGeometry args={[0.24, 0.62, 5, 9]} />
              <meshStandardMaterial color="#e6a95d" roughness={0.76} />
            </mesh>
            <mesh position={[0, 1.52, 0]} castShadow>
              <sphereGeometry args={[0.2, 16, 12]} />
              <meshStandardMaterial color="#8c604b" roughness={0.82} />
            </mesh>
            <mesh position={[0, 0.85, 0.2]}>
              <boxGeometry args={[0.39, 0.46, 0.18]} />
              <meshStandardMaterial color="#536c61" roughness={0.9} />
            </mesh>
          </group>
          <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.36, 24]} />
            <meshBasicMaterial color="#0e0f13" transparent opacity={0.32} />
          </mesh>
        </group>
        <gridHelper args={[38, 38, "#3e4250", "#323642"]} position={[0, -0.055, 0]} />
      </group>
    </>
  );
}

export default function WalkableDistrict({
  items,
  accent,
  onClose,
  onOpenGuide,
}: {
  items: StageItem[];
  accent: string;
  onClose: () => void;
  onOpenGuide: (index: number) => void;
}) {
  const keys = useRef(new Set<string>());
  const touchDirection = useRef<string | null>(null);
  const [nearby, setNearby] = useState(-1);
  const { feedback } = useKhwezi();
  const nearbyItem = items[nearby];
  const onNearby = useCallback(
    (index: number) => {
      setNearby(index);
      if (index >= 0) feedback("swipe");
    },
    [feedback],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
        if ((event.target as HTMLElement | null)?.closest("button, a, input, textarea")) return;
        event.preventDefault();
        keys.current.add(key);
        redraw();
      }
      if (key === "escape") onClose();
    };
    const onKeyUp = (event: KeyboardEvent) => {
      keys.current.delete(event.key.toLowerCase());
      redraw();
    };
    const onBlur = () => {
      keys.current.clear();
      redraw();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      keys.current.clear();
      touchDirection.current = null;
      redraw();
    };
  }, [onClose]);

  const moveButton = (direction: string, icon: ReactNode, label: string) => (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(event) => {
        event.preventDefault();
        touchDirection.current = direction;
        redraw();
      }}
      onPointerUp={() => {
        touchDirection.current = null;
        redraw();
      }}
      onPointerCancel={() => {
        touchDirection.current = null;
        redraw();
      }}
      onPointerLeave={() => {
        touchDirection.current = null;
        redraw();
      }}
      onKeyDown={(event) => {
        if (event.key === " ") touchDirection.current = direction;
      }}
      onKeyUp={() => (touchDirection.current = null)}
    >
      {icon}
    </button>
  );

  return (
    <>
      <View className="city-walk-view" index={2}>
        <DistrictScene
          items={items.slice(0, 3)}
          accent={accent}
          keys={keys}
          touchDirection={touchDirection}
          onNearby={onNearby}
        />
      </View>
      <section
        className="city-walk-hud"
        aria-label="Walk the city"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <header className="city-walk-header">
          <div>
            <span className="city-walk-eyebrow">FIELD WALK · 3 DISCOVERIES</span>
            <h2>Take the long way.</h2>
          </div>
          <button
            type="button"
            className="city-walk-close"
            onClick={() => {
              feedback("tap");
              onClose();
            }}
            aria-label="Exit walk mode"
          >
            <X size={20} />
          </button>
        </header>
        <div className="city-walk-tip" role="status" aria-live="polite">
          {nearbyItem ? (
            <>
              <strong>{nearbyItem.name}</strong>
              <span>You're close. Stop here to uncover its story.</span>
            </>
          ) : (
            <>
              <strong>Follow the lanterns</strong>
              <span>WASD or arrow keys · use the pad on touch</span>
            </>
          )}
        </div>
        <div className="city-walk-controls" aria-label="Movement controls">
          <span aria-hidden="true" />
          {moveButton("up", <ArrowUp size={20} />, "Move forward")}
          {moveButton("left", <ArrowLeft size={20} />, "Move left")}
          {moveButton("down", <ArrowDown size={20} />, "Move back")}
          {moveButton("right", <ArrowRight size={20} />, "Move right")}
        </div>
        <footer className="city-walk-footer">
          <span>Walkable story scene · artistic reconstruction</span>
          <div>
            {nearby >= 0 && (
              <button
                type="button"
                className="city-walk-discover"
                onClick={() => {
                  feedback("tap");
                  onOpenGuide(nearby);
                }}
              >
                <Eye size={17} /> Discover {items[nearby]?.name}
              </button>
            )}
          </div>
        </footer>
      </section>
    </>
  );
}
