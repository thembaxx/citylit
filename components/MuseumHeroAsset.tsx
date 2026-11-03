"use client";

import { Component, Suspense, useEffect, useMemo, type ReactNode } from "react";
import { useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import MuseumShowcase, { type MuseumFeature, type MuseumProps } from "./MuseumShowcase";
import MuseumGroundShadow from "./MuseumGroundShadow";

const url = "/models/hero/mcgregor-museum.glb";

function HeritageMuseum({
  exploded = false,
  night = false,
  feature = "architecture",
  onFeature,
  reduced = false,
}: MuseumProps) {
  const { scene } = useGLTF(url, "/draco/");
  const { invalidate } = useThree();
  // One cached GLB can occur in multiple city views. Cloning keeps each scene's
  // interactive positions and day/night material state independent.
  const instance = useMemo(() => {
    const root = scene.clone(true);
    root.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;
      const tune = (source: THREE.Material): THREE.Material => {
        const material = source.clone();
        if (material instanceof THREE.MeshStandardMaterial) {
          const name = material.name.toLowerCase();
          // Image-based base colors were exported without the original tint.
          // These calibrated factors let real brick/stone scans show through
          // without turning the entire model into a white paper miniature.
          if (name.includes("heritage brick")) material.color.set("#7d3829");
          else if (name.includes("pathway stone")) material.color.set("#9b856f");
          else if (name.includes("lawn")) material.color.set("#49683a");
          else if (name.includes("heritage wood")) material.color.set("#5c3b2a");
          else if (name.includes("copper red roof")) material.color.set("#612e29");
          else if (name.includes("roof seam")) material.color.set("#38211d");
          else if (name.includes("painted veranda trim")) material.color.set("#a48f78");
          else if (name.includes("trim edge")) material.color.set("#b7a28b");
          else if (name.includes("sash glazing")) {
            material.color.set("#193b48");
            material.roughness = 0.09;
            material.metalness = 0.18;
            material.envMapIntensity = 1.7;
          } else if (name.includes("deep interior")) material.color.set("#0c1117");
          material.needsUpdate = true;
        }
        return material;
      };
      object.material = Array.isArray(object.material)
        ? object.material.map(tune)
        : tune(object.material);
    });
    return root;
  }, [scene]);

  useEffect(() => {
    const layers = [
      [instance.getObjectByName("MuseumRoof"), exploded ? 0.7 : 0],
      [instance.getObjectByName("MuseumLandscape"), exploded ? -0.16 : 0],
    ] as const;
    const tweens = layers.flatMap(([object, y]) => {
      if (!object) return [];
      return [
        gsap.to(object.position, {
          y,
          duration: reduced ? 0 : 0.76,
          ease: "power3.inOut",
          onUpdate: invalidate,
        }),
      ];
    });
    invalidate();
    return () => {
      tweens.forEach((tween) => tween.kill());
    };
  }, [instance, exploded, reduced, invalidate]);

  useEffect(() => {
    instance.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        if (!(material instanceof THREE.MeshStandardMaterial)) return;
        if (material.name.toLowerCase().includes("sash glazing")) {
          material.emissive.set(night ? "#dba05a" : "#000000");
          material.emissiveIntensity = night ? 0.36 : 0;
          material.needsUpdate = true;
        }
      });
    });
    invalidate();
  }, [instance, night, invalidate]);

  useEffect(
    () => () => {
      instance.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      });
    },
    [instance],
  );

  const targets: { name: MuseumFeature; xyz: [number, number, number] }[] = [
    { name: "architecture", xyz: [0, 0.8, 1.47] },
    { name: "roof", xyz: [0.12, 2.37, 0.18] },
    { name: "windows", xyz: [1.33, 1.3, 0.76] },
    { name: "gardens", xyz: [-1.67, 0.15, 1.23] },
  ];
  return (
    <group name="heritage-museum-hero">
      <MuseumGroundShadow />
      <primitive object={instance} dispose={null} />
      {onFeature &&
        targets.map((target) => (
          <mesh
            key={target.name}
            name={"museum-hero-hotspot-" + target.name}
            position={target.xyz}
            onClick={(event) => {
              event.stopPropagation();
              onFeature(target.name);
            }}
            onPointerOver={() => {
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              document.body.style.cursor = "";
            }}
          >
            <sphereGeometry args={[feature === target.name ? 0.062 : 0.045, 12, 10]} />
            <meshStandardMaterial
              color={feature === target.name ? "#fff1ca" : "#d2a365"}
              emissive="#be853a"
              emissiveIntensity={0.22}
              roughness={0.35}
              metalness={0.4}
            />
          </mesh>
        ))}
      {night && (
        <pointLight intensity={1.2} distance={5.2} color="#f5bb7b" position={[0, 1.4, 1.8]} />
      )}
    </group>
  );
}

class HeritageErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/**
 * Graceful fallback is the existing interactive procedural museum scene.
 * Failure to fetch a new model must never blank out a user's guide.
 */
export default function MuseumHeroAsset(props: MuseumProps) {
  const fallback = <MuseumShowcase {...props} />;
  return (
    <HeritageErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <HeritageMuseum {...props} />
      </Suspense>
    </HeritageErrorBoundary>
  );
}
