"use client";
import { View, PerspectiveCamera } from "@react-three/drei";
import { useThree, useFrame, invalidate as redraw } from "@react-three/fiber";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { useKhwezi } from "./KhweziProvider";
import {
  ArrowCounterClockwise,
  ArrowClockwise,
  ArrowRight,
  CaretRight,
  Check,
  Cube,
  Stack,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  Moon,
  Mountains,
  Pause,
  Play,
  SlidersHorizontal,
  Sun,
} from "@phosphor-icons/react";
import * as THREE from "three";
import gsap from "gsap";
import SafeStageModel from "./SafeStageModel";
import MuseumHeroAsset from "./MuseumHeroAsset";
import { type MuseumFeature } from "./MuseumShowcase";
import StudioEnvironment from "./StudioEnvironment";
import ProceduralTree from "./ProceduralTree";
import AtlasWorld from "./AtlasWorld";
import JourneyTrail from "./JourneyTrail";
import WalkableDistrict from "./WalkableDistrict";
import { AnimatedTabs } from "./ui/AnimatedTabs";
import AnimatedPillGroup from "./ui/AnimatedPillGroup";
import LiquidToggle from "./ui/LiquidToggle";

import { benchoAudio } from "../lib/bencho-audio";
import useTheme from "./useTheme";
import type { StageItem } from "./CityStage";
import { landmarkJointLabels } from "../lib/landmark-specs.js";

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
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * 0.205, 1.16, 0]}
          rotation={[0, 0, side * -0.72]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.6, 0.041, 0.85]} />
          <meshStandardMaterial color={roofColor} roughness={0.77} metalness={0.03} />
        </mesh>
      ))}
      <mesh position={[0, 0.99, 0.03]}>
        <boxGeometry args={[0.86, 0.055, 0.79]} />
        <meshStandardMaterial color="#fff0d6" roughness={0.9} />
      </mesh>
      <mesh position={[0.22, 1.32, -0.15]} castShadow>
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
  const wasSelected = useRef(selected);
  const { invalidate } = useThree();
  useEffect(() => {
    if (!group.current) return;
    if (selected && !wasSelected.current && !reduced) {
      gsap.fromTo(
        group.current.position,
        { y: -0.08 },
        {
          y: 0,
          duration: 0.42,
          ease: "back.out(2.2)",
          onUpdate: invalidate,
          onComplete: invalidate,
        },
      );
      gsap.fromTo(
        group.current.scale,
        { x: 0.94, y: 0.94, z: 0.94 },
        {
          x: 1,
          y: 1,
          z: 1,
          duration: 0.44,
          ease: "back.out(2)",
          onUpdate: invalidate,
          onComplete: invalidate,
        },
      );
    }
    wasSelected.current = selected;
  }, [selected, reduced, invalidate]);
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
  showContext,
  reduced,
  onModelStatus,
  accent,
  touring,
  onTourComplete,
  jointValues,
}: {
  items: StageItem[];
  selected: number;
  onSelect: (index: number, interaction?: "tap" | "swipe") => void;
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
  showContext: boolean;
  reduced: boolean;
  onModelStatus: (model: string, status: "ready" | "error") => void;
  accent: string;
  touring: boolean;
  onTourComplete: () => void;
  jointValues: Record<string, number>;
}) {
  const ring = useRef<THREE.Group>(null);
  const { size, invalidate, camera } = useThree();
  const radius = items.length < 4 ? 2.8 : 3.8;
  const selectedName = items[selected]?.name ?? "";
  useEffect(() => {
    const museum = items[selected]?.name.toLowerCase().includes("mcgregor museum");
    const preset = museum
      ? feature === "roof"
        ? [0, 3.3, 10.8]
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
      duration: reduced ? 0 : 0.42,
      ease: "power3.out",
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
      duration: reduced ? 0 : 0.45,
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
  useEffect(() => {
    if (!touring) return;
    const museum = selectedName.toLowerCase().includes("mcgregor museum");
    const close = size.width < 760;
    const cameraPath = museum
      ? [
          [0, 3.2, 10.8],
          [4.6, 2.8, 8.8],
          [-3.6, 3.6, 8.9],
          [0.65, 1.75, close ? 8.4 : 7.2],
        ]
      : [
          [0, 2.9, 9.8],
          [4.0, 2.4, 7.7],
          [-3.2, 3.45, 7.9],
          [0.55, 1.8, close ? 7.8 : 6.4],
        ];
    if (reduced) {
      const finalShot = cameraPath[cameraPath.length - 1];
      camera.position.set(finalShot[0], finalShot[1], finalShot[2]);
      camera.lookAt(0, museum ? 0.08 : 0.55, 0);
      invalidate();
      onTourComplete();
      return;
    }
    const timeline = gsap.timeline({
      onComplete: onTourComplete,
    });
    cameraPath.forEach(([x, y, z], step) => {
      timeline.to(camera.position, {
        x,
        y,
        z,
        duration: step === 0 ? 0.45 : 0.82,
        ease: "power2.inOut",
        onUpdate: () => {
          camera.lookAt(0, museum ? 0.08 : 0.55, 0);
          invalidate();
        },
      });
    });
    return () => {
      timeline.kill();
    };
  }, [touring, selected, selectedName, camera, size.width, invalidate, onTourComplete, reduced]);
  useFrame(() => {
    if (dragging.current && ring.current) {
      gsap.killTweensOf(ring.current.rotation);
      ring.current.rotation.y = angle.current;
    }
  });
  const positions = useMemo(
    () =>
      items.map((_, i): [number, number, number] => [
        Math.sin((i * Math.PI * 2) / items.length) * radius,
        0.02,
        Math.cos((i * Math.PI * 2) / items.length) * radius,
      ]),
    [items.length, radius],
  );
  const itemIds = items.map((item) => item.place?.id || "").join("|");
  const placeIndexes = useMemo(
    () => new Map(items.flatMap((item, i) => (item.place ? [[item.place.id, i] as const] : []))),
    [itemIds],
  );
  const route = useMemo(
    () =>
      itinerary.flatMap((id) => {
        const index = placeIndexes.get(id);
        return index === undefined ? [] : [positions[index]];
      }),
    [itinerary, placeIndexes, positions],
  );
  return (
    <>
      <PerspectiveCamera makeDefault position={[0.5, 2.35, 11.45]} fov={42} />
      <AtlasWorld night={night} accent={accent} animate={!reduced} />
      <StudioEnvironment intensity={night ? 0.34 : 0.68} />
      <hemisphereLight args={[night ? "#a8b6d4" : "#fff6e8", "#5a534d", night ? 0.24 : 0.34]} />
      <ambientLight intensity={night ? 0.12 : 0.16} />
      <directionalLight
        position={[4, 7, 5]}
        intensity={night ? 0.62 : 1.68}
        color={night ? "#b6c8eb" : "#fff5e2"}
        castShadow
        shadow-mapSize-width={size.width < 760 ? 1024 : 2048}
        shadow-mapSize-height={size.width < 760 ? 1024 : 2048}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-bias={-0.00025}
        shadow-normalBias={0.025}
      />
      <directionalLight
        position={[-4, 3, -2]}
        intensity={night ? 0.2 : 0.4}
        color={night ? "#99b4db" : "#ffa968"}
      />
      <pointLight
        position={[1.8, 2.5, 3.4]}
        intensity={night ? 0.9 : 0.12}
        distance={9}
        color="#ffe3be"
      />
      <group
        position={[
          size.width > size.height ? 1.52 : size.width < 360 ? -0.18 : 0.04,
          size.width < 760 && !items[selected]?.name.toLowerCase().includes("mcgregor museum")
            ? 0.12
            : 0,
          0,
        ]}
      >
        <group ref={ring}>
          {items.map((item, index) => (
            <group
              key={item.name}
              visible={
                index === selected ||
                (showContext &&
                  (index === (selected + 1) % items.length ||
                    index === (selected - 1 + items.length) % items.length))
              }
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
                        ? 0.77
                        : 0.72
                      : size.width < 760
                        ? size.width < 360
                          ? 0.96
                          : 1.04
                        : 1.24) * zoom
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
                  (index === selected ||
                    (showContext &&
                      (index === (selected + 1) % items.length ||
                        index === (selected - 1 + items.length) % items.length))) && (
                    <SafeStageModel
                      model={item.model}
                      name={item.name}
                      night={night}
                      reduced={reduced}
                      active={index === selected}
                      explodedProgress={index === selected && exploded ? 1 : 0}
                      jointValues={index === selected ? jointValues : undefined}
                      onStatus={onModelStatus}
                    />
                  )
                )}
                {showContext &&
                  index === selected &&
                  !item.name.toLowerCase().includes("mcgregor museum") && (
                    <MiniatureStreet compact={size.width < 760} />
                  )}
              </RotatingMiniature>
            </group>
          ))}
          {showContext && route.length > 1 && (
            <JourneyTrail points={route} active animate={!reduced} accent={accent} />
          )}
        </group>
      </group>
    </>
  );
}

/** Presents the selected landmark ring, inspection controls, and contextual scene. */
export default function LandmarkRing({
  items,
  selected,
  onSelect,
  itinerary,
  accent = "#e4a95f",
  onOpenGuide,
}: {
  items: StageItem[];
  selected: number;
  onSelect: (index: number, interaction?: "tap" | "swipe") => void;
  itinerary: string[];
  accent?: string;
  onOpenGuide: (index: number) => void;
}) {
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const angle = useRef(0);
  const drag = useRef<{ x: number; y: number; angle: number } | null>(null);
  const dragging = useRef(false);
  const moved = useRef(false);
  const [settle, setSettle] = useState(0);
  // Follow the app theme until someone explicitly changes the stage lighting.
  const themeNight = useTheme().night;
  const [nightOverride, setNightOverride] = useState<boolean | null>(null);
  const night = nightOverride ?? themeNight;
  const [exploded, setExploded] = useState(false);
  const [feature, setFeature] = useState<MuseumFeature>("architecture");
  const [zoom, setZoom] = useState(1);
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false);
  const [useInspectorTopLayer, setUseInspectorTopLayer] = useState(false);
  const inspectorToggleRef = useRef<HTMLButtonElement>(null);
  const inspectorPanelRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<StageView>("overview");
  const [spin, setSpin] = useState(0);
  const [showContext, setShowContext] = useState(false);
  const [explorationMode, setExplorationMode] = useState("discover");
  const [touring, setTouring] = useState(false);
  const touringRef = useRef(false);
  const [modelStatuses, setModelStatuses] = useState<Record<string, "ready" | "error">>({});
  const [jointValues, setJointValues] = useState<Record<string, number>>({});
  const onModelStatus = useCallback((model: string, status: "ready" | "error") => {
    setModelStatuses((previous) =>
      previous[model] === status ? previous : { ...previous, [model]: status },
    );
  }, []);
  const { moving, feedback } = useKhwezi();
  const stopTour = useCallback(() => {
    touringRef.current = false;
    setTouring(false);
  }, []);
  const finishTour = useCallback(() => {
    stopTour();
    feedback("tap");
  }, [stopTour, feedback]);
  const toggleTour = () => {
    const next = !touringRef.current;
    touringRef.current = next;
    setTouring(next);
  };
  const switchExplorationMode = (mode: string) => {
    if (mode === explorationMode) return;
    setExplorationMode(mode);
    feedback("swipe");
    window.dispatchEvent(
      new CustomEvent("citylit:portal", {
        detail: { label: mode === "walk" ? "Walk the city" : "Landmark discoveries" },
      }),
    );
  };
  const selectItem = useCallback(
    (index: number, interaction: "tap" | "swipe" = "tap") => {
      stopTour();
      onSelect(index, interaction);
    },
    [onSelect, stopTour],
  );
  const reduced = !!useReducedMotion() || !moving;
  const museumSelected = items[selected]?.name.toLowerCase().includes("mcgregor museum");
  const features: { id: MuseumFeature; label: string }[] = [
    { id: "architecture", label: "Architecture" },
    { id: "roof", label: "Roof" },
    { id: "windows", label: "Windows" },
    { id: "gardens", label: "Gardens" },
  ];
  const joints = useMemo(
    () => (museumSelected ? [] : landmarkJointLabels(items[selected]?.model ?? "")),
    [items, selected, museumSelected],
  );
  const manualJointCount = joints.reduce(
    (count: number, joint: { id: string }) => (joint.id in jointValues ? count + 1 : count),
    0,
  );
  useEffect(() => {
    stopTour();
    setExploded(false);
    setFeature("architecture");
    setZoom(1);
    setView("overview");
    setMobileInspectorOpen(false);
    setJointValues({});
  }, [selected, stopTour]);

  // Safari can composite the shared fixed WebGL canvas above scrolled content.
  // A mobile popover enters the browser top layer, independent of z-index.
  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const sync = () =>
      setUseInspectorTopLayer(
        media.matches && typeof HTMLDivElement.prototype.showPopover === "function",
      );
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useLayoutEffect(() => {
    if (!useInspectorTopLayer || !host) return;
    const panel = inspectorPanelRef.current;
    const toggle = inspectorToggleRef.current;
    if (!panel || !toggle) return;

    const position = () => {
      const scene = host.getBoundingClientRect();
      const trigger = toggle.getBoundingClientRect();
      const viewportBottom = Math.min(scene.bottom, window.innerHeight);
      const top = Math.max(8, Math.min(trigger.bottom + 8, viewportBottom - 188));
      const available = Math.max(150, Math.min(340, viewportBottom - top - 8));
      panel.style.top = `${Math.round(top)}px`;
      panel.style.right = `${Math.max(12, Math.round(window.innerWidth - trigger.right))}px`;
      panel.style.maxHeight = `${Math.round(available)}px`;
    };

    position();
    if (mobileInspectorOpen && !panel.matches(":popover-open")) panel.showPopover();
    if (!mobileInspectorOpen && panel.matches(":popover-open")) panel.hidePopover();

    if (!mobileInspectorOpen) return;
    const guide = host.closest(".reference-guide");
    const observer = new ResizeObserver(position);
    observer.observe(host);
    guide?.addEventListener("scroll", position, { passive: true });
    window.addEventListener("resize", position);
    return () => {
      observer.disconnect();
      guide?.removeEventListener("scroll", position);
      window.removeEventListener("resize", position);
    };
  }, [host, mobileInspectorOpen, useInspectorTopLayer]);

  return (
    <div
      ref={setHost}
      className={[
        "atlas-ring-scene",
        museumSelected && "is-heritage-hero",
        explorationMode === "walk" && "is-walking",
      ]
        .filter(Boolean)
        .join(" ")}
      data-active-model={museumSelected ? "museum" : items[selected]?.model}
      data-active-model-status={
        museumSelected ? "ready" : (modelStatuses[items[selected]?.name] ?? "loading")
      }
      role="group"
      aria-label="Interactive illustrative landmark models"
      onPointerDown={(event) => {
        if (explorationMode === "walk") return;
        // Tapping the model dismisses the inspector; its toolbar stops bubbling.
        if (mobileInspectorOpen) setMobileInspectorOpen(false);
        if (event.button === 0) {
          // Capture immediately so dragging continues across scene overlays.
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = { x: event.clientX, y: event.clientY, angle: angle.current };
          moved.current = false;
        }
      }}
      onPointerMove={(event) => {
        if (explorationMode === "walk") return;
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
      onPointerUp={(event) => {
        if (explorationMode === "walk") {
          drag.current = null;
          dragging.current = false;
          return;
        }
        if (!drag.current) return;
        const travel = event.clientX - drag.current.x;
        drag.current = null;
        dragging.current = false;
        if (moved.current && items.length > 1) {
          const snapped = Math.round((-angle.current / (Math.PI * 2)) * items.length);
          const nearest = ((snapped % items.length) + items.length) % items.length;
          // Do not snap a deliberate short swipe back to its starting item.
          const next =
            nearest === selected && Math.abs(travel) > 24
              ? (selected + (travel > 0 ? items.length - 1 : 1)) % items.length
              : nearest;
          onSelect(next, "swipe");
          setSettle((value) => value + 1);
        }
      }}
      onPointerCancel={() => {
        drag.current = null;
        dragging.current = false;
        setSettle((value) => value + 1);
      }}
    >
      <div className="atlas-exploration-switch" onPointerDown={(event) => event.stopPropagation()}>
        <AnimatedTabs
          className="atlas-exploration-tabs"
          ariaLabel="Exploration mode"
          idPrefix="atlas-exploration"
          value={explorationMode}
          onChange={switchExplorationMode}
          items={[
            { id: "discover", label: "Discover", icon: <Cube size={16} /> },
            { id: "walk", label: "Walk the city", icon: <ArrowRight size={16} /> },
          ]}
        />
      </div>
      <div
        id="atlas-exploration-panel"
        role="tabpanel"
        aria-labelledby={`atlas-exploration-tab-${explorationMode}`}
      >
        {explorationMode === "walk" ? (
          <WalkableDistrict
            items={items}
            accent={accent}
            onClose={() => setExplorationMode("discover")}
            onOpenGuide={onOpenGuide}
          />
        ) : (
          <View className="atlas-ring-view" index={2}>
            {host && (
              <Ring
                items={items}
                selected={selected}
                onSelect={(index, interaction = "tap") => {
                  if (!moved.current) selectItem(index, interaction);
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
                showContext={showContext}
                reduced={reduced}
                onModelStatus={onModelStatus}
                accent={accent}
                touring={touring}
                onTourComplete={finishTour}
                jointValues={jointValues}
              />
            )}
          </View>
        )}
      </div>

      {(exploded || manualJointCount > 0 || touring) && (
        <div className="atlas-stage-live-badge" aria-hidden="true">
          <span className="atlas-live-dot" />
          <span>
            {touring
              ? "Cinematic tour active"
              : exploded
                ? "Exploded architectural view"
                : `${manualJointCount} mechanism${manualJointCount === 1 ? "" : "s"} in manual mode`}
          </span>
        </div>
      )}
      <div
        className="atlas-inspector-toolbar"
        aria-label="3D inspection tools"
        onClickCapture={() => feedback("tap")}
        onPointerDown={(event) => event.stopPropagation()}
        onPointerMove={(event) => event.stopPropagation()}
        onPointerUp={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key !== "Escape" || !mobileInspectorOpen) return;
          event.stopPropagation();
          setMobileInspectorOpen(false);
          inspectorToggleRef.current?.focus();
        }}
      >
        <button
          ref={inspectorToggleRef}
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
          ref={inspectorPanelRef}
          id="atlas-inspector-panel"
          popover={useInspectorTopLayer ? "auto" : undefined}
          onToggle={(event) => {
            if (useInspectorTopLayer && !event.currentTarget.matches(":popover-open")) {
              setMobileInspectorOpen(false);
            }
          }}
          className={
            mobileInspectorOpen ? "atlas-inspector-panel is-open" : "atlas-inspector-panel"
          }
        >
          {/* Top Quick Actions Bar (Image 2 style) */}
          <div
            className="atlas-inspector-actions"
            role="toolbar"
            aria-label="Quick inspector actions"
          >
            <button
              type="button"
              aria-label={night ? "Switch to daylight" : "Switch to night lighting"}
              aria-pressed={night}
              title={night ? "Daylight" : "Night lighting"}
              onClick={() => setNightOverride(!night)}
            >
              <Moon size={18} weight={night ? "fill" : "regular"} />
            </button>
            <button
              type="button"
              title="Zoom in"
              aria-label="Zoom in"
              disabled={zoom >= 1.4}
              onClick={() => setZoom((value) => Math.min(1.4, +(value + 0.1).toFixed(2)))}
            >
              <MagnifyingGlassPlus size={18} />
            </button>
            <button
              type="button"
              title="Zoom out"
              aria-label="Zoom out"
              disabled={zoom <= 0.8}
              onClick={() => setZoom((value) => Math.max(0.8, +(value - 0.1).toFixed(2)))}
            >
              <MagnifyingGlassMinus size={18} />
            </button>
            <button
              type="button"
              title="Reset inspection"
              aria-label="Reset inspection"
              onClick={() => {
                stopTour();
                setZoom(1);
                setNightOverride(null);
                setExploded(false);
                setFeature("architecture");
                setView("overview");
                setShowContext(false);
                setJointValues({});
              }}
            >
              <ArrowCounterClockwise size={18} />
            </button>
            <button
              type="button"
              title="Rotate selected miniature"
              aria-label="Rotate selected miniature"
              onClick={() => setSpin((value) => value + 1)}
            >
              <ArrowClockwise size={18} />
            </button>
            <button
              type="button"
              aria-label={
                reduced
                  ? "Jump to cinematic close-up"
                  : touring
                    ? "Stop cinematic camera tour"
                    : "Play cinematic camera tour"
              }
              aria-pressed={touring}
              title={touring ? "Stop tour" : "Camera tour"}
              onClick={toggleTour}
            >
              {touring ? <Pause size={18} /> : <Play size={18} />}
            </button>
            {museumSelected && (
              <button
                type="button"
                aria-label={
                  exploded ? "Assemble roof and landscape" : "Explode architectural layers"
                }
                aria-pressed={exploded}
                title={exploded ? "Assemble layers" : "Explode layers"}
                onClick={() => setExploded((value) => !value)}
              >
                <Stack size={18} />
              </button>
            )}
          </div>

          {/* Visual Camera Presets Cards (Image 2 style) */}
          {!museumSelected && (
            <div className="atlas-inspector-presets-section">
              <div className="atlas-inspector-section-head">
                <Cube size={15} />
                <span>Camera presets</span>
                <CaretRight size={14} className="atlas-inspector-chevron" />
              </div>
              <div
                className="atlas-inspector-visual-cards"
                role="group"
                aria-label="Camera presets"
              >
                {/* Overview Preset Card */}
                <button
                  type="button"
                  className={`atlas-preset-card ${view === "overview" ? "is-active" : ""}`}
                  aria-pressed={view === "overview"}
                  onClick={() => {
                    benchoAudio.playClick(580);
                    stopTour();
                    setView("overview");
                  }}
                >
                  <div className="atlas-preset-thumb diorama-overview-thumb" aria-hidden="true">
                    <svg viewBox="0 0 100 64" fill="none" className="preset-thumb-art">
                      <ellipse cx="50" cy="46" rx="42" ry="14" fill="#a4b494" />
                      <ellipse cx="50" cy="42" rx="38" ry="12" fill="#7fa873" />
                      <circle cx="38" cy="34" r="7" fill="#8B5CF6" opacity="0.9" />
                      <circle cx="50" cy="30" r="9" fill="#5B9E5A" />
                      <circle cx="62" cy="34" r="7" fill="#A78BFA" opacity="0.8" />
                      <circle cx="56" cy="37" r="5" fill="#4D804C" />
                      <circle cx="44" cy="37" r="5" fill="#9333EA" opacity="0.8" />
                    </svg>
                    {view === "overview" && (
                      <div className="atlas-preset-badge">
                        <Check size={11} weight="bold" />
                      </div>
                    )}
                  </div>
                  <span className="atlas-preset-title">Overview</span>
                </button>

                {/* Close-up Preset Card */}
                <button
                  type="button"
                  className={`atlas-preset-card ${view === "detail" ? "is-active" : ""}`}
                  aria-pressed={view === "detail"}
                  onClick={() => {
                    benchoAudio.playClick(680);
                    stopTour();
                    setView("detail");
                  }}
                >
                  <div className="atlas-preset-thumb diorama-closeup-thumb" aria-hidden="true">
                    <svg viewBox="0 0 100 64" fill="none" className="preset-thumb-art">
                      <rect width="100" height="64" rx="10" fill="#2d372e" />
                      <circle cx="34" cy="32" r="15" fill="#5B9E5A" />
                      <circle cx="62" cy="28" r="18" fill="#8B5CF6" opacity="0.9" />
                      <circle cx="78" cy="36" r="14" fill="#A78BFA" opacity="0.8" />
                      <circle cx="22" cy="40" r="12" fill="#4D804C" />
                    </svg>
                    {view === "detail" && (
                      <div className="atlas-preset-badge">
                        <Check size={11} weight="bold" />
                      </div>
                    )}
                  </div>
                  <span className="atlas-preset-title">Close-up</span>
                </button>
              </div>
            </div>
          )}

          {/* Toggles: Overhead & Show Surroundings (Bencho Liquid Toggle) */}
          <div className="atlas-inspector-toggles">
            <div className="atlas-inspector-toggle-row">
              <div className="atlas-toggle-meta">
                <Mountains size={18} />
                <span>Overhead</span>
              </div>
              <LiquidToggle
                checked={view === "overhead"}
                onChange={() => {
                  stopTour();
                  benchoAudio.playLiquidToggle(view !== "overhead");
                  setView(view === "overhead" ? "overview" : "overhead");
                }}
                ariaLabel="Toggle overhead camera"
              />
            </div>

            <div className="atlas-inspector-toggle-row">
              <div className="atlas-toggle-meta">
                <Sun size={18} />
                <span>Show surroundings</span>
              </div>
              <LiquidToggle
                checked={showContext}
                onChange={() => {
                  benchoAudio.playLiquidToggle(!showContext);
                  setShowContext((value) => !value);
                }}
                ariaLabel="Toggle show surroundings"
              />
            </div>
          </div>

          {!museumSelected && joints.length > 0 && (
            <div className="atlas-inspector-mechanisms" aria-label="Landmark mechanisms">
              <div className="atlas-mechanisms-head">
                <span>
                  <SlidersHorizontal size={15} /> Mechanisms
                </span>
                {manualJointCount > 0 && (
                  <button
                    type="button"
                    className="atlas-joint-restore"
                    aria-label="Restore authored motion"
                    onClick={() => setJointValues({})}
                  >
                    Restore
                  </button>
                )}
              </div>
              {joints.map((joint: { id: string; label: string }) => {
                const manual = typeof jointValues[joint.id] === "number";
                return (
                  <div className="atlas-joint" key={joint.id}>
                    <div className="atlas-joint-head">
                      <span>{joint.label}</span>
                      <button
                        type="button"
                        aria-pressed={manual}
                        aria-label={
                          manual
                            ? `Return ${joint.label} to authored motion`
                            : `Control ${joint.label} manually`
                        }
                        onClick={() =>
                          setJointValues((previous) => {
                            const next = { ...previous };
                            if (joint.id in next) delete next[joint.id];
                            else next[joint.id] = 0.5;
                            return next;
                          })
                        }
                      >
                        {manual ? "Manual" : "Auto"}
                      </button>
                    </div>
                    {manual && (
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={jointValues[joint.id] ?? 0.5}
                        aria-label={`${joint.label} position`}
                        onChange={(event) =>
                          setJointValues((previous) => ({
                            ...previous,
                            [joint.id]: Number(event.target.value),
                          }))
                        }
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {museumSelected && (
            <div className="atlas-inspector-features">
              <span>
                <Cube size={15} /> Inspect details
              </span>
              <AnimatedPillGroup
                ariaLabel="Inspect details"
                className="atlas-inspector-pill-group"
                activeId={feature}
                onChange={(id) => setFeature(id as MuseumFeature)}
                items={features.map((option) => ({
                  id: option.id,
                  label: option.label,
                }))}
              />
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
