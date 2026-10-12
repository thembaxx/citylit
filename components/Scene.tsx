"use client";
import UiIcon from "./UiIcon";
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
    const fit = Math.min(1.2, Math.max(1, 1.1 / (size.width / Math.max(size.height, 1))));
    if (previousReset.current !== reset) viewMemory.delete(memoryKey);
    previousReset.current = reset;
    const remembered = viewMemory.get(memoryKey);
    const target = remembered
      ? { x: remembered[0], y: remembered[1], z: remembered[2] }
      : mode === "map"
        ? { x: 3.2 * fit, y: 6.4 * fit, z: 5.4 * fit }
        : { x: 3.6, y: 3.15, z: 5.2 };
    const lookY = mode === "map" ? 0.2 : 0.55;
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
    if (!group.current) return;
    const node = group.current;
    const context = gsap.context(() => {
      gsap.fromTo(
        node.scale,
        { x: 0.72, y: 0.2, z: 0.72 },
        {
          x: 1,
          y: 1,
          z: 1,
          duration: reduced ? 0 : 0.95,
          ease: "back.out(1.6)",
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
  }, [mode, city, index, category, reduced, invalidate]);
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
  return (
    <>
      <PerspectiveCamera makeDefault fov={34} position={[3.2, 6.4, 5.4]} />
      <hemisphereLight args={["#fff8ee", "#c4a27a", 0.72]} />
      <ambientLight intensity={0.95} />
      <directionalLight position={[5, 9, 4]} intensity={2.35} color="#fffaf3" />
      <directionalLight position={[-5, 4, -2]} intensity={0.45} color="#ffe7c4" />
      <PerformanceMonitor
        onDecline={() => setDpr(1)}
        onIncline={() => setDpr(Math.min(window.devicePixelRatio, 1.5))}
      />
      <group
        ref={group}
        onClick={(e) => {
          if (
            (e.nativeEvent.target as HTMLElement)?.closest(
              "button,a,input,select,label,.modal-backdrop",
            )
          )
            return;
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
          <ExpandedLandmark city={city} index={index} reduced={gentle} />
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
        target={[0, mode === "map" ? 0.2 : 0.55, 0]}
        minDistance={mode === "map" ? 4.2 : 2.8}
        maxDistance={mode === "map" ? 16 : 9}
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
  const [spin, setSpin] = useState(0);
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
  return (
    <div
      ref={ref}
      className="scene-view"
      aria-label="Toy map of South Africa. Drag to spin, scroll or pinch to zoom, hover or hold a province, tap a sign to visit."
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
      {props.mode !== "map" && (
        <button
          className="model-spin"
          aria-label="Spin illustration"
          onClickCapture={(event) => {
            event.stopPropagation();
            setSpin((v) => v + 1);
          }}
          onPointerDownCapture={(event) => event.stopPropagation()}
        >
          <UiIcon name="rotate" size={22} />
        </button>
      )}
      {props.mode === "map" && (
        <p className="scene-hint">Drag to spin · pinch to zoom · poke a province</p>
      )}
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
