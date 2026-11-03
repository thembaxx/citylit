"use client";
import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import MuseumGroundShadow from "./MuseumGroundShadow";

/**
 * Give every existing, compressed Blender landmark believable material response
 * without mutating the cached GLTF used by other instances of the model.
 */
export default function StageModel({ model, active = true }: { model: string; active?: boolean }) {
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
            material.roughness = 0.2;
            material.metalness = 0.1;
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
          material.envMapIntensity = 0.7;
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

  return (
    <>
      {active && (
        <MuseumGroundShadow name="stage-contact-shadow" positionY={-0.18} dimensions={[4.2, 3.6]} />
      )}
      <primitive object={instance} dispose={null} />
    </>
  );
}
