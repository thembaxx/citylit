"use client";
import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import MuseumGroundShadow from "./MuseumGroundShadow";

/**
 * Give every existing, compressed Blender landmark believable material response
 * without mutating the cached GLTF used by other instances of the model.
 */
export default function StageModel({
  model,
  active = true,
  onReady,
}: {
  model: string;
  active?: boolean;
  onReady?: () => void;
}) {
  const { scene } = useGLTF(`/models/stage/${model}.glb`, "/draco/");
  const instance = useMemo(() => {
    const root = scene.clone(true);
    root.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = active;
      object.receiveShadow = active;
      const tune = (source: THREE.Material): THREE.Material => {
        const material = source.clone();
        if (material instanceof THREE.MeshStandardMaterial) {
          const name = material.name.toLowerCase();
          if (name.includes("water")) {
            material.roughness = 0.13;
            material.metalness = 0.08;
            material.envMapIntensity = 1.55;
          } else if (
            name.includes("sea glass") ||
            (name.includes("glass") && !name.includes("recess"))
          ) {
            material.roughness = 0.07;
            material.metalness = 0.04;
            material.envMapIntensity = 1.7;
            material.side = THREE.DoubleSide;
          } else if (
            name.includes("recess") ||
            name.includes("glass") ||
            name.includes("glazing")
          ) {
            material.roughness = 0.25;
            material.metalness = 0.12;
          } else if (name.includes("foliage") || name.includes("leaf")) {
            material.roughness = 0.93;
            material.metalness = 0;
          } else if (name.includes("paint")) {
            material.roughness = 0.68;
            material.metalness = 0;
          } else if (name.includes("amber")) {
            material.roughness = 0.48;
            material.metalness = 0.17;
          } else {
            // Keep authored Blender PBR finishes for metal, plaster, glazing,
            // wood, sandstone and roof materials instead of flattening them.
            material.roughness = THREE.MathUtils.clamp(material.roughness, 0.14, 0.98);
            material.metalness = THREE.MathUtils.clamp(material.metalness, 0, 0.85);
          }
          material.envMapIntensity = Math.max(material.envMapIntensity, 0.95);
        }
        return material;
      };
      object.material = Array.isArray(object.material)
        ? object.material.map(tune)
        : tune(object.material);
    });
    return root;
  }, [scene, active]);

  useEffect(() => {
    return () => {
      // Geometries belong to the cached GLB. Only cloned materials belong to this instance.
      instance.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      });
    };
  }, [instance]);

  useEffect(() => {
    onReady?.();
  }, [instance, onReady]);

  return (
    <>
      {active && (
        <MuseumGroundShadow name="stage-contact-shadow" positionY={-0.18} dimensions={[4.2, 3.6]} />
      )}
      <group rotation={[0, model === "dome" ? Math.PI : model === "tower" ? -Math.PI / 2 : 0, 0]}>
        <primitive object={instance} dispose={null} />
      </group>
    </>
  );
}
