"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { geoMercator } from "d3-geo";
import * as THREE from "three";
import gsap from "gsap";
import { provinceColors, availableProvinces } from "../lib/province-colors";
import boundaries from "../public/data/provinces.json";
export const provinceLabels = boundaries.features.map((f) => ({
  code: f.properties.shapeISO,
  name: f.properties.shapeName.replace("Nothern", "Northern"),
}));
export type LabelRefs = { current: Record<string, HTMLDivElement | null> };
function ProjectedLabel({
  label,
  p,
  labels,
}: {
  label: string;
  p: [number, number, number];
  labels: LabelRefs;
}) {
  const ref = useRef<THREE.Group>(null);
  const vector = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, size }) => {
    const element = labels.current[label];
    if (!element || !ref.current) return;
    ref.current.getWorldPosition(vector);
    vector.project(camera);
    element.style.transform = `translate3d(${(vector.x * 0.5 + 0.5) * size.width}px,${(-vector.y * 0.5 + 0.5) * size.height}px,0) translate(-50%,-50%)`;
    element.style.visibility =
      Math.abs(vector.x) > 1 || Math.abs(vector.y) > 1 || vector.z > 1 ? "hidden" : "visible";
  });
  return <group ref={ref} position={p} />;
}
const project = geoMercator().center([24.5, -28.5]).scale(17).translate([0, 0]);
function point(coord: number[]): [number, number] {
  const p = project([coord[0], coord[1]])!;
  return [p[0], -p[1]];
}
const labelCoords: Record<string, number[]> = {
  EC: [26, -32],
  FS: [26.7, -28.4],
  GT: [28, -25.55],
  KZ: [30, -28.8],
  LI: [29, -23.9],
  MP: [30.2, -26],
  NW: [25, -26.6],
  NC: [21, -29.6],
  WC: [20, -33.1],
};
function Province({
  feature,
  onCity,
  reduced,
  labels,
}: {
  feature: (typeof boundaries.features)[number];
  onCity: (i: number) => void;
  reduced: boolean;
  labels: LabelRefs;
}) {
  const ref = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);
  const { invalidate } = useThree();
  const code = feature.properties.shapeISO,
    city = availableProvinces[code],
    active = city !== undefined;
  const geometry = useMemo(() => {
    const polygons =
      feature.geometry.type === "MultiPolygon"
        ? feature.geometry.coordinates
        : [feature.geometry.coordinates];
    return (polygons as number[][][][])
      .filter((p) => p[0].length > 3)
      .map((p) => {
        const shape = new THREE.Shape(p[0].map((c) => new THREE.Vector2(...point(c))));
        p.slice(1).forEach((h) =>
          shape.holes.push(new THREE.Path(h.map((c) => new THREE.Vector2(...point(c))))),
        );
        return new THREE.ExtrudeGeometry(shape, {
          depth: active ? 0.24 : 0.15,
          bevelEnabled: true,
          bevelSize: 0.009,
          bevelThickness: 0.008,
          bevelSegments: 1,
          steps: 1,
          curveSegments: 1,
        });
      });
  }, [feature, active]);
  useEffect(() => {
    const label = labels.current[code];
    if (label) label.dataset.hovered = String(hover);
    if (!ref.current) return;
    const tween = gsap.to(ref.current.position, {
      z: hover && active ? 0.08 : 0,
      duration: reduced ? 0 : 0.35,
      ease: "power2.out",
      onUpdate: invalidate,
    });
    return () => {
      tween.kill();
    };
  }, [hover, active, reduced, invalidate, labels, code]);
  useEffect(() => () => geometry.forEach((g) => g.dispose()), [geometry]);
  const [x, y] = point(labelCoords[code]);
  return (
    <group
      ref={ref}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
      }}
      onPointerOut={() => setHover(false)}
      onClick={(e) => {
        if (active && e.delta < 5) {
          e.stopPropagation();
          onCity(city);
        }
      }}
    >
      {geometry.map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshStandardMaterial
            color={provinceColors[code]}
            emissive={provinceColors[code]}
            emissiveIntensity={hover && active ? 0.25 : 0.04}
            flatShading
            roughness={0.9}
          />
        </mesh>
      ))}
      <ProjectedLabel label={code} p={[x, y, active ? 0.26 : 0.19]} labels={labels} />
    </group>
  );
}
export default function ProvinceMap({
  onCity,
  reduced,
  labels,
}: {
  onCity: (i: number) => void;
  reduced: boolean;
  labels: LabelRefs;
}) {
  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      {boundaries.features.map((f) => (
        <Province
          key={f.properties.shapeISO}
          feature={f}
          onCity={onCity}
          reduced={reduced}
          labels={labels}
        />
      ))}
    </group>
  );
}
