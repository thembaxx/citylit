"use client";
import { useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, View, PerformanceMonitor } from "@react-three/drei";
import { useEffect, useRef, useState, type ComponentRef } from "react";
import { useReducedMotion } from "motion/react";
import * as THREE from "three";
import gsap from "gsap";
import ProvinceMap, { provinceLabels, type LabelRefs } from "./ProvinceMap";
import { provinceColors, availableProvinces } from "../lib/province-colors";
import { cities } from "../lib/data";
import { Landmark, CategoryModel } from "./Models";
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
}: Props & { visible: boolean; labels: LabelRefs }) {
  const { camera, invalidate, setDpr, size } = useThree();
  const reduced = useReducedMotion();
  const group = useRef<THREE.Group>(null);
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const previousMode = useRef(mode);
  const [travel, setTravel] = useState(false);
  const gentle = !!reduced || !animate || !visible;
  useEffect(() => {
    const changed = previousMode.current !== mode;
    previousMode.current = mode;
    setTravel(true);
    const fit = Math.min(1.45, Math.max(1, 1.2 / (size.width / Math.max(size.height, 1))));
    const target =
      mode === "map" ? { x: 4.6 * fit, y: 6.2 * fit, z: 6.5 * fit } : { x: 3.8, y: 2.9, z: 5.4 };
    const tween = gsap.to(camera.position, {
      ...target,
      duration: reduced ? 0 : changed ? 1.15 : 0.7,
      ease: "power3.inOut",
      onUpdate: () => {
        camera.lookAt(0, mode === "map" ? 0 : 0.55, 0);
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
  }, [camera, mode, reset, reduced, invalidate, size.width, size.height]);
  useEffect(() => {
    if (!group.current) return;
    const node = group.current;
    const context = gsap.context(() => {
      gsap.fromTo(
        node.scale,
        { x: 0.82, y: 0.82, z: 0.82 },
        {
          x: 1,
          y: 1,
          z: 1,
          duration: reduced ? 0 : 0.7,
          ease: "back.out(1.3)",
          onUpdate: invalidate,
        },
      );
      gsap.fromTo(
        node.position,
        { y: -0.42 },
        { y: -0.15, duration: reduced ? 0 : 0.7, ease: "power3.out", onUpdate: invalidate },
      );
    });
    return () => context.revert();
  }, [mode, city, index, category, reduced, invalidate]);
  return (
    <>
      <PerspectiveCamera makeDefault fov={38} position={[4.6, 6.2, 6.5]} />
      <ambientLight intensity={1.6} />
      <directionalLight position={[-4, 7, 5]} intensity={3} />
      <directionalLight position={[4, 2, -4]} intensity={1.5} color="#c3d0ff" />
      <PerformanceMonitor
        onDecline={() => setDpr(1)}
        onIncline={() => setDpr(Math.min(window.devicePixelRatio, 1.5))}
      />
      <group
        ref={group}
        onClick={(e) => {
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
        ) : (
          <Landmark city={city} index={index} reduced={gentle} />
        )}
      </group>
      <mesh position={[0, -0.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[mode === "map" ? 3.2 : 1.8, 64]} />
        <meshBasicMaterial color="#c9ceba" transparent opacity={0.16} depthWrite={false} />
      </mesh>
      <OrbitControls
        ref={controls}
        makeDefault
        enabled={!travel}
        enablePan={false}
        enableDamping
        dampingFactor={0.075}
        rotateSpeed={0.65}
        zoomSpeed={0.7}
        target={[0, mode === "map" ? 0 : 0.55, 0]}
        minDistance={mode === "map" ? 6 : 3.4}
        maxDistance={mode === "map" ? 17 : 8}
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
      aria-label="Interactive 3D illustration: drag to rotate, pinch to zoom"
    >
      <View index={2} className="three-view" frames={Infinity}>
        <World {...props} visible={visible} labels={labels} />
      </View>
      {props.mode === "map" && (
        <div className="map-label-layer">
          {provinceLabels.map((p) => (
            <div
              key={p.code}
              ref={(element) => {
                labels.current[p.code] = element;
              }}
              className="projected-label"
              style={{ "--province-color": provinceColors[p.code] } as React.CSSProperties}
            >
              {availableProvinces[p.code] !== undefined ? (
                <button
                  data-available="true"
                  className="province province-active"
                  aria-label={`Explore ${cities[availableProvinces[p.code]].name}`}
                  onClick={() => props.onCity(availableProvinces[p.code])}
                >
                  {p.name.toUpperCase()}
                </button>
              ) : (
                <span data-available="false" className="province">
                  {p.name.toUpperCase()}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
