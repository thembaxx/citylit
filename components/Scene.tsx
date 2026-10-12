"use client";
import Link from "next/link";
import { useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, View, PerformanceMonitor } from "@react-three/drei";
import { useCallback, useEffect, useRef, useState, type ComponentRef } from "react";
import { useReducedMotion } from "motion/react";
import * as THREE from "three";
import gsap from "gsap";
import ProvinceMap, { provinceLabels, type LabelRefs } from "./ProvinceMap";
import { provinceColors, availableProvinces } from "../lib/province-colors";
import { cities } from "../lib/data";
import ExpandedLandmark from "./ExpandedLandmark";
import { Landmark, CategoryModel } from "./Models";
const viewMemory = new Map<string, number[]>();
const labelOffsets: Record<string, [number, number]> = {
  NC: [0, 0],
  NW: [0, 0],
  GT: [0, 0],
  LI: [0, 0],
  MP: [0, 0],
  FS: [0, 0],
  KZ: [0, 0],
  WC: [0, 0],
  EC: [0, 0],
};
type Props = {
  mode: string;
  city: number;
  index: number;
  category: number;
  onCity: (i: number) => void;
  onSelect: () => void;
  onCycle?: (step: number) => void;
  onSecret?: () => void;
  reset: number;
  animate: boolean;
};
function World({
  mode,
  city,
  index,
  category,
  onCity,
  onSelect,
  onSecret,
  reset,
  animate,
  visible,
  labels,
  spin,
  controlsElement,
}: Props & { visible: boolean; labels: LabelRefs; spin: number; controlsElement: HTMLElement }) {
  const { camera, invalidate, setDpr, size } = useThree();
  const reduced = useReducedMotion();
  const group = useRef<THREE.Group>(null);
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const previousMode = useRef(mode);
  const previousReset = useRef(reset);
  const memoryKey = `${mode}:${city}:${index}:${category}`;
  const [travel, setTravel] = useState(false);
  const gentle = !!reduced || !animate || !visible;
  useEffect(() => {
    const changed = previousMode.current !== mode;
    previousMode.current = mode;
    setTravel(true);
    const aspect = size.width / Math.max(size.height, 1);
    const narrow = Math.max(0, 1 - aspect);
    const squat = Math.max(0, aspect - 1.05);
    const fit =
      mode === "map"
        ? Math.min(2.15, 1.22 + narrow * 1.45 + squat * 0.42)
        : Math.min(3.25, 1.7 + narrow * 2.35 + squat * 0.7);
    if (previousReset.current !== reset) viewMemory.delete(memoryKey);
    previousReset.current = reset;
    const remembered = viewMemory.get(memoryKey);
    const target = remembered
      ? { x: remembered[0], y: remembered[1], z: remembered[2] }
      : mode === "map"
        ? { x: 3.05 * fit, y: 6.85 * fit, z: 5.45 * fit }
        : { x: 2.72 * fit, y: 2.55 * fit, z: 4.25 * fit };
    const lookY = mode === "map" ? 0.02 : 0.24;
    const tween = gsap.to(camera.position, {
      ...target,
      duration: reduced ? 0 : changed ? 1.15 : 0.7,
      ease: "power3.inOut",
      onUpdate: () => {
        camera.lookAt(0, lookY, 0);
        invalidate();
      },
      onComplete: () => {
        controls.current?.update();
        setTravel(false);
        invalidate();
      },
    });
    return () => {
      tween.kill();
    };
  }, [camera, mode, reset, reduced, invalidate, size.width, size.height, memoryKey]);
  useEffect(() => {
    if (!group.current || size.height < 2) return;
    const node = group.current;
    const aspect = size.width / Math.max(size.height, 1);
    const narrow = Math.max(0, 1 - aspect);
    const fitted =
      mode === "map" ? Math.max(0.84, 0.96 - narrow * 0.1) : Math.max(0.76, 0.88 - narrow * 0.1);
    const context = gsap.context(() => {
      gsap.fromTo(
        node.scale,
        { x: fitted * 0.72, y: fitted * 0.2, z: fitted * 0.72 },
        {
          x: fitted,
          y: fitted,
          z: fitted,
          duration: reduced ? 0 : 0.85,
          ease: "power3.out",
          onUpdate: invalidate,
        },
      );
      gsap.fromTo(
        node.rotation,
        { y: -0.4 },
        { y: 0, duration: reduced ? 0 : 1.05, ease: "power3.out", onUpdate: invalidate },
      );
      gsap.fromTo(
        node.position,
        { y: -0.55 },
        { y: 0, duration: reduced ? 0 : 0.9, ease: "power3.out", onUpdate: invalidate },
      );
    });
    return () => context.revert();
  }, [mode, city, index, category, reduced, invalidate, size.width, size.height]);
  useEffect(() => {
    if (!spin || !group.current) return;
    const node = group.current;
    const tween = gsap.to(node.rotation, {
      y: node.rotation.y + Math.PI * 2,
      duration: reduced ? 0 : 1.4,
      ease: "power2.inOut",
      onUpdate: invalidate,
      onComplete: () => {
        node.rotation.y %= Math.PI * 2;
        invalidate();
      },
    });
    return () => {
      tween.kill();
    };
  }, [spin, reduced, invalidate]);
  const heldLong = useRef(false);
  const holdTimer = useRef<number | null>(null);
  const clearHold = () => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
  };
  return (
    <>
      <PerspectiveCamera makeDefault fov={34} position={[3.2, 6.4, 5.4]} />
      <hemisphereLight args={["#fff6ea", "#8d7360", 0.8]} />
      <ambientLight intensity={0.62} />
      <directionalLight position={[4.2, 8.2, 5]} intensity={2.15} color="#fffaf3" />
      <directionalLight position={[-4.5, 3.2, -2]} intensity={0.55} color="#ffd0a8" />
      <pointLight position={[0.4, 2.4, 2.2]} intensity={6} distance={9} color="#ffe3bf" />
      <PerformanceMonitor
        onDecline={() => setDpr(1)}
        onIncline={() => setDpr(Math.min(window.devicePixelRatio, 1.5))}
      />
      <group
        ref={group}
        onPointerDown={() => {
          heldLong.current = false;
          clearHold();
          if (!onSecret) return;
          holdTimer.current = window.setTimeout(() => {
            heldLong.current = true;
            onSecret();
          }, 860);
        }}
        onPointerUp={clearHold}
        onPointerLeave={clearHold}
        onClick={(e) => {
          if (
            (e.nativeEvent.target as HTMLElement)?.closest(
              "button,a,input,select,label,.modal-backdrop,.spot-layer",
            )
          )
            return;
          if (heldLong.current) return;
          if ((mode === "city" || mode === "category") && e.delta < 5) {
            e.stopPropagation();
            onSelect();
          }
        }}
      >
        {mode === "map" ? (
          <ProvinceMap onCity={onCity} reduced={gentle} labels={labels} />
        ) : mode === "category" ? (
          <CategoryModel index={category} reduced={gentle} />
        ) : city < 3 ? (
          <Landmark city={city} index={index} reduced={gentle} />
        ) : (
          <ExpandedLandmark city={city} index={index % 3} reduced={gentle} />
        )}
      </group>
      <OrbitControls
        ref={controls}
        domElement={controlsElement}
        makeDefault
        onEnd={() => viewMemory.set(memoryKey, camera.position.toArray())}
        enabled={!travel}
        enablePan={false}
        enableDamping
        dampingFactor={0.075}
        rotateSpeed={0.7}
        zoomSpeed={0.9}
        target={[0, mode === "map" ? 0.02 : 0.24, 0]}
        minDistance={mode === "map" ? 5.2 : 2.8}
        maxDistance={mode === "map" ? 22 : 14}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.15}
      />
    </>
  );
}
export default function Scene(props: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const labels = useRef<Record<string, HTMLDivElement | null>>({});
  const [visible, setVisible] = useState(true);
  const [spin] = useState(0);
  const [controlsElement, setControlsElement] = useState<HTMLElement | null>(null);
  const trackControls = useCallback((element: HTMLElement | THREE.Group | null) => {
    setControlsElement(element instanceof HTMLElement ? element : null);
  }, []);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0.05,
    });
    if (ref.current) observer.observe(ref.current);
    const onVisibility = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
  const gesture = useRef<{ x: number; y: number; t: number } | null>(null);
  return (
    <div
      ref={ref}
      className="scene-view"
      role="region"
      aria-label="Toy map of South Africa. Drag to spin, scroll or pinch to zoom, swipe to discover, tap a toy to step inside."
      onPointerDown={(event) => {
        gesture.current = { x: event.clientX, y: event.clientY, t: performance.now() };
      }}
      onPointerUp={(event) => {
        const start = gesture.current;
        gesture.current = null;
        if (!start || props.mode !== "city" || !props.onCycle) return;
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        const dt = performance.now() - start.t;
        if (dt < 340 && Math.abs(dx) > 78 && Math.abs(dx) > Math.abs(dy) * 1.7)
          props.onCycle(dx > 0 ? -1 : 1);
      }}
    >
      <View ref={trackControls} index={2} className="three-view" frames={Infinity}>
        {controlsElement && (
          <World
            {...props}
            visible={visible}
            labels={labels}
            spin={spin}
            controlsElement={controlsElement}
          />
        )}
      </View>
      {props.mode === "map" && (
        <div className="map-label-layer">
          {provinceLabels.map((p) => (
            <div
              key={p.code}
              data-province-code={p.code}
              ref={(element) => {
                labels.current[p.code] = element;
              }}
              className="projected-label"
              style={
                {
                  "--province-color": provinceColors[p.code],
                  "--label-x": `${labelOffsets[p.code][0]}px`,
                  "--label-y": `${labelOffsets[p.code][1]}px`,
                } as React.CSSProperties
              }
            >
              {availableProvinces[p.code] !== undefined ? (
                <Link
                  href={`/${cities[availableProvinces[p.code]].slug}`}
                  prefetch={false}
                  data-available="true"
                  className="province province-active"
                  aria-label={`Explore ${cities[availableProvinces[p.code]].name}`}
                  onClick={(event) => event.stopPropagation()}
                  onNavigate={(event) => {
                    event.preventDefault();
                    props.onCity(availableProvinces[p.code]);
                  }}
                  onPointerDownCapture={(event) => event.stopPropagation()}
                >
                  {p.name}
                </Link>
              ) : (
                <span data-available="false" className="province">
                  {p.name}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
