"use client";
import { View, PerspectiveCamera, Line } from "@react-three/drei";
import { useThree, useFrame, invalidate as redraw } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import {
  ArrowCounterClockwise,
  ArrowClockwise,
  Cube,
  Stack,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  Moon,
  Sun,
} from "@phosphor-icons/react";
import * as THREE from "three";
import gsap from "gsap";
import SafeStageModel from "./SafeStageModel";
import MuseumHeroAsset from "./MuseumHeroAsset";
import { type MuseumFeature } from "./MuseumShowcase";
import StudioEnvironment from "./StudioEnvironment";
import ProceduralTree from "./ProceduralTree";
import type { StageItem } from "./CityStage";

// Small, original geometry adds a sense of place without introducing licensed GLB files.
// This is illustrative scenery, never a real street or geospatial representation.
function StreetHouse({ x, color, roofColor }: { x: number; color: string; roofColor: string }) {
  return (
    <group position={[x, 0, 0.95]} scale={0.46}>
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[0.86, 0.08, 0.81]} />
        <meshStandardMaterial color="#c9b69a" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.53, 0]} castShadow>
        <boxGeometry args={[0.76, 0.94, 0.71]} />
        <meshStandardMaterial color={color} roughness={0.88} />
      </mesh>
      <mesh position={[0, 1.04, 0]} castShadow>
        <coneGeometry args={[0.61, 0.42, 4]} />
        <meshStandardMaterial color={roofColor} roughness={0.8} metalness={0.06} />
      </mesh>
      <mesh position={[0, 0.99, 0.03]}>
        <boxGeometry args={[0.86, 0.055, 0.79]} />
        <meshStandardMaterial color="#fff0d6" roughness={0.9} />
      </mesh>
      <mesh position={[0.22, 1.21, -0.15]}>
        <boxGeometry args={[0.13, 0.22, 0.14]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.27, 0.365]}>
        <boxGeometry args={[0.19, 0.46, 0.032]} />
        <meshStandardMaterial color="#625748" roughness={0.83} />
      </mesh>
      <mesh position={[0.055, 0.28, 0.389]}>
        <sphereGeometry args={[0.017, 6, 4]} />
        <meshStandardMaterial color="#d5a655" metalness={0.5} roughness={0.4} />
      </mesh>
      {[-0.24, 0.24].map((windowX) => (
        <group key={windowX} position={[windowX, 0.68, 0.367]}>
          <mesh>
            <boxGeometry args={[0.23, 0.29, 0.035]} />
            <meshStandardMaterial color="#faf1dc" roughness={0.75} />
          </mesh>
          <mesh position={[0, 0, 0.023]}>
            <boxGeometry args={[0.18, 0.235, 0.01]} />
            <meshStandardMaterial color="#648c97" roughness={0.26} metalness={0.1} />
          </mesh>
          <mesh position={[0, 0, 0.033]}>
            <boxGeometry args={[0.025, 0.26, 0.012]} />
            <meshStandardMaterial color="#f9edd5" />
          </mesh>
          <mesh position={[0, 0, 0.034]}>
            <boxGeometry args={[0.21, 0.023, 0.012]} />
            <meshStandardMaterial color="#f9edd5" />
          </mesh>
          <mesh position={[0, -0.17, 0.036]}>
            <boxGeometry args={[0.26, 0.045, 0.08]} />
            <meshStandardMaterial color="#d3b38f" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function StreetLamp({ x }: { x: number }) {
  return (
    <group position={[x, 0, 1.07]}>
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.016, 0.026, 0.56, 6]} />
        <meshStandardMaterial color="#445954" metalness={0.4} roughness={0.65} />
      </mesh>
      <mesh position={[0.04, 0.55, 0]}>
        <boxGeometry args={[0.09, 0.018, 0.025]} />
        <meshStandardMaterial color="#445954" />
      </mesh>
      <mesh position={[0.082, 0.51, 0]}>
        <sphereGeometry args={[0.047, 8, 6]} />
        <meshStandardMaterial
          color="#fff0c8"
          emissive="#d69d55"
          emissiveIntensity={0.32}
          roughness={0.5}
        />
      </mesh>
    </group>
  );
}

// An illustrative street, not a surveyed reconstruction of any South African neighbourhood.
function MiniatureStreet({ compact }: { compact: boolean }) {
  return (
    <group position={[0, -0.43, 0]}>
      <mesh position={[0, 0.03, 1.46]} receiveShadow>
        <boxGeometry args={[3.4, 0.06, 0.49]} />
        <meshStandardMaterial color="#454b4a" roughness={0.96} />
      </mesh>
      {[1.17, 1.76].map((z) => (
        <group key={z}>
          <mesh position={[0, 0.07, z]} receiveShadow>
            <boxGeometry args={[3.4, 0.055, 0.17]} />
            <meshStandardMaterial color="#d2c4a7" roughness={0.96} />
          </mesh>
          <mesh position={[0, 0.1, z - 0.058]}>
            <boxGeometry args={[3.4, 0.017, 0.02]} />
            <meshStandardMaterial color="#f1e2c6" roughness={0.9} />
          </mesh>
        </group>
      ))}
      {[-1.25, -0.45, 0.35, 1.15].map((x) => (
        <mesh key={x} position={[x, 0.068, 1.46]}>
          <boxGeometry args={[0.33, 0.006, 0.023]} />
          <meshBasicMaterial color="#f5e5bf" />
        </mesh>
      ))}
      {[-0.1, 0, 0.1].map((x) => (
        <mesh key={x} position={[x + 0.44, 0.07, 1.55]}>
          <boxGeometry args={[0.045, 0.006, 0.29]} />
          <meshBasicMaterial color="#f7ebce" />
        </mesh>
      ))}
      <StreetHouse x={-1.32} color="#e7b88d" roofColor="#907968" />
      <StreetHouse x={1.32} color="#eecfaf" roofColor="#747d6a" />
      <StreetLamp x={-0.96} />
      <StreetLamp x={1.08} />
      <ProceduralTree
        position={[-0.94, 0, -1.32]}
        scale={0.43}
        color="#579761"
        seed={3}
        detail={compact ? "compact" : "hero"}
      />
      <ProceduralTree
        position={[0.98, 0, -1.3]}
        scale={0.41}
        color="#80ad62"
        seed={7}
        detail={compact ? "compact" : "hero"}
      />
      <mesh position={[-1.04, 0.13, 0.64]}>
        <boxGeometry args={[0.3, 0.09, 0.12]} />
        <meshStandardMaterial color="#8d694c" roughness={0.94} />
      </mesh>
      {[-1.14, -0.94].map((x) => (
        <mesh key={x} position={[x, 0.075, 0.64]}>
          <boxGeometry args={[0.022, 0.12, 0.1]} />
          <meshStandardMaterial color="#534d40" />
        </mesh>
      ))}
      {[-1.54, 1.54].map((x) => (
        <group key={x} position={[x, 0.08, -0.57]}>
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.17, 0.16, 0.18, 8]} />
            <meshStandardMaterial color="#a98964" roughness={0.93} />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.145, 0.145, 0.05, 8]} />
            <meshStandardMaterial color="#627957" roughness={1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

type StageView = "overview" | "detail" | "overhead";

function RotatingMiniature({
  children,
  selected,
  spin,
  reduced,
}: {
  children: React.ReactNode;
  selected: boolean;
  spin: number;
  reduced: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const previous = useRef(spin);
  const { invalidate } = useThree();
  useEffect(() => {
    if (!selected) {
      previous.current = spin;
      return;
    }
    if (!group.current || previous.current === spin) return;
    previous.current = spin;
    const tween = gsap.to(group.current.rotation, {
      y: group.current.rotation.y + Math.PI * 2,
      duration: reduced ? 0 : 1.28,
      ease: "power2.inOut",
      onUpdate: invalidate,
      onComplete: invalidate,
    });
    return () => {
      tween.kill();
    };
  }, [spin, selected, reduced, invalidate]);
  return <group ref={group}>{children}</group>;
}

function Ring({
  items,
  selected,
  onSelect,
  angle,
  itinerary,
  dragging,
  settle,
  night,
  exploded,
  feature,
  onFeature,
  zoom,
  spin,
  view,
  reduced,
}: {
  items: StageItem[];
  selected: number;
  onSelect: (index: number) => void;
  angle: React.RefObject<number>;
  itinerary: string[];
  dragging: React.RefObject<boolean>;
  settle: number;
  night: boolean;
  exploded: boolean;
  feature: MuseumFeature;
  onFeature: (feature: MuseumFeature) => void;
  zoom: number;
  spin: number;
  view: StageView;
  reduced: boolean;
}) {
  const ring = useRef<THREE.Group>(null);
  const { size, invalidate, camera } = useThree();
  const radius = items.length < 4 ? 2.8 : 3.8;
  useEffect(() => {
    const museum = items[selected]?.name.toLowerCase().includes("mcgregor museum");
    const preset = museum
      ? feature === "roof"
        ? [0, 3.30, 10.8]
        : feature === "windows"
          ? [1.15, 2.05, 10.2]
          : feature === "gardens"
            ? [-0.85, 3.15, 11.2]
            : [0.5, 2.35, size.width < 760 ? 10.6 : 11.45]
      : view === "detail"
        ? [0.7, 2.5, 8.5]
        : view === "overhead"
          ? [0.4, 5.1, 9.4]
          : [0, 3.2, 10.8];
    const tween = gsap.to(camera.position, {
      x: preset[0],
      y: preset[1],
      z: preset[2],
      duration: reduced ? 0 : 0.72,
      ease: "power3.inOut",
      onUpdate: () => {
        camera.lookAt(
          0,
          items[selected]?.name.toLowerCase().includes("mcgregor museum") ? 0.08 : 0.55,
          0,
        );
        invalidate();
      },
      onComplete: invalidate,
    });
    return () => {
      tween.kill();
    };
  }, [camera, feature, view, selected, reduced, invalidate, items, size.width]);
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
    camera.lookAt(
      0,
      items[selected]?.name.toLowerCase().includes("mcgregor museum") ? 0.08 : 0.55,
      0,
    );
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
      <PerspectiveCamera makeDefault position={[0.5, 2.35, 11.45]} fov={42} />
      <StudioEnvironment intensity={night ? 0.08 : 0.4} />
      <hemisphereLight args={[night ? "#97a8c8" : "#fff4e3", "#715b4a", night ? 0.10 : 0.29]} />
      <ambientLight intensity={night ? 0.06 : 0.11} />
      <directionalLight
        position={[4, 7, 5]}
        intensity={night ? 0.20 : 1.45}
        color={night ? "#a2b8e0" : "#fff3dd"}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-bias={-0.00025}
        shadow-normalBias={0.025}
      />
      <directionalLight
        position={[-4, 3, -2]}
        intensity={night ? 0.08 : 0.48}
        color={night ? "#99b4db" : "#ffa968"}
      />
      <group position={[size.width > size.height ? 0.66 : 0.04, 0, 0]}>
        <group ref={ring}>
          {items.map((item, index) => (
            <group
              key={item.name}
              position={positions[index]}
              rotation={[
                0,
                index === selected && item.name.toLowerCase().includes("mcgregor museum")
                  ? (index * Math.PI * 2) / items.length - 0.29
                  : 0,
                0,
              ]}
              scale={
                index === selected
                  ? (item.name.toLowerCase().includes("mcgregor museum")
                      ? size.width < 760
                        ? 1.12
                        : 0.63
                      : size.width < 760
                        ? 0.8
                        : 1) * zoom
                  : 0.55
              }
              onClick={(event) => {
                event.stopPropagation();
                onSelect(index);
              }}
            >
              {/* high-detail museum shares the same canvas and scene budget */}
              <RotatingMiniature selected={index === selected} spin={spin} reduced={reduced}>
                {item.name.toLowerCase().includes("mcgregor museum") ? (
                  <MuseumHeroAsset
                    night={night}
                    exploded={index === selected && exploded}
                    feature={index === selected ? feature : "architecture"}
                    reduced={reduced}
                    onFeature={index === selected ? onFeature : undefined}
                  />
                ) : (
                  <SafeStageModel model={item.model} active={index === selected} />
                )}
                {index === selected && !item.name.toLowerCase().includes("mcgregor museum") && (
                  <MiniatureStreet compact={size.width < 760} />
                )}
              </RotatingMiniature>
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
  const [night, setNight] = useState(false);
  const [exploded, setExploded] = useState(false);
  const [feature, setFeature] = useState<MuseumFeature>("architecture");
  const [zoom, setZoom] = useState(1);
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false);
  const [view, setView] = useState<StageView>("overview");
  const [spin, setSpin] = useState(0);
  const reduced = !!useReducedMotion();
  const museumSelected = items[selected]?.name.toLowerCase().includes("mcgregor museum");
  const features: { id: MuseumFeature; label: string }[] = [
    { id: "architecture", label: "Architecture" },
    { id: "roof", label: "Roof" },
    { id: "windows", label: "Windows" },
    { id: "gardens", label: "Gardens" },
  ];
  useEffect(() => {
    setExploded(false);
    setFeature("architecture");
    setZoom(1);
    setView("overview");
    setMobileInspectorOpen(false);
  }, [selected]);
  return (
    <div
      ref={setHost}
      className={museumSelected ? "atlas-ring-scene is-heritage-hero" : "atlas-ring-scene"}
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
            night={night}
            exploded={exploded}
            feature={feature}
            onFeature={setFeature}
            zoom={zoom}
            spin={spin}
            view={view}
            reduced={reduced}
          />
        )}
      </View>
      <div
        className="atlas-inspector-toolbar"
        aria-label="3D inspection tools"
        onPointerDown={(event) => event.stopPropagation()}
        onPointerMove={(event) => event.stopPropagation()}
        onPointerUp={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="atlas-inspector-toggle"
          aria-label={mobileInspectorOpen ? "Close 3D inspector" : "Open 3D inspector"}
          aria-controls="atlas-inspector-panel"
          aria-expanded={mobileInspectorOpen}
          onClick={() => setMobileInspectorOpen((open) => !open)}
        >
          <Cube size={18} />
          <span>Inspect</span>
        </button>
        <div
          id="atlas-inspector-panel"
          className={
            mobileInspectorOpen ? "atlas-inspector-panel is-open" : "atlas-inspector-panel"
          }
        >
          <div className="atlas-inspector-actions">
            <button
              type="button"
              aria-label={night ? "Switch to daylight" : "Switch to night lighting"}
              aria-pressed={night}
              title={night ? "Daylight" : "Night lighting"}
              onClick={() => setNight((value) => !value)}
            >
              {night ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <button
              type="button"
              title="Zoom in"
              aria-label="Zoom in"
              disabled={zoom >= 1.4}
              onClick={() => setZoom((value) => Math.min(1.4, +(value + 0.1).toFixed(2)))}
            >
              <MagnifyingGlassPlus size={19} />
            </button>
            <button
              type="button"
              title="Zoom out"
              aria-label="Zoom out"
              disabled={zoom <= 0.8}
              onClick={() => setZoom((value) => Math.max(0.8, +(value - 0.1).toFixed(2)))}
            >
              <MagnifyingGlassMinus size={19} />
            </button>
            <button
              type="button"
              title="Rotate selected miniature"
              aria-label="Rotate selected miniature"
              onClick={() => setSpin((value) => value + 1)}
            >
              <ArrowClockwise size={19} />
            </button>
            {museumSelected && (
              <button
                type="button"
                aria-label={
                  exploded ? "Assemble roof and landscape" : "Explode architectural layers"
                }
                aria-pressed={exploded}
                title="Exploded view"
                onClick={() => setExploded((value) => !value)}
              >
                <Stack size={19} />
              </button>
            )}
            <button
              type="button"
              title="Reset inspection"
              aria-label="Reset inspection"
              onClick={() => {
                setZoom(1);
                setNight(false);
                setExploded(false);
                setFeature("architecture");
                setView("overview");
              }}
            >
              <ArrowCounterClockwise size={19} />
            </button>
          </div>
          {!museumSelected && (
            <div className="atlas-inspector-features" aria-label="Landmark camera views">
              <span>
                <Cube size={15} /> Camera presets
              </span>
              {(
                [
                  { id: "overview", label: "Overview" },
                  { id: "detail", label: "Close-up" },
                  { id: "overhead", label: "Overhead" },
                ] as { id: StageView; label: string }[]
              ).map((option) => (
                <button
                  type="button"
                  key={option.id}
                  aria-pressed={view === option.id}
                  onClick={() => setView(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
          {museumSelected && (
            <div className="atlas-inspector-features">
              <span>
                <Cube size={15} /> Inspect details
              </span>
              {features.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={feature === option.id}
                  onClick={() => setFeature(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
          <p className="atlas-inspector-note" role="status" aria-live="polite">
            {museumSelected
              ? exploded
                ? "Architectural layers separated"
                : `${features.find((option) => option.id === feature)?.label} · interactive miniature`
              : `${night ? "Night" : "Day"} · ${view} · ${Math.round(zoom * 100)}% scale`}
          </p>
        </div>
      </div>
    </div>
  );
}
