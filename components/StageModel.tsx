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
          if (name.includes("sea glass")) {
            // Shared scene remains opaque behind window recesses, while the
            // thin front pane provides optical depth and crisp studio glints.
            const pane = new THREE.MeshPhysicalMaterial({
              name: material.name,
              color: material.color.clone(),
              map: material.map,
              normalMap: material.normalMap,
              normalScale: material.normalScale.clone(),
              roughness: 0.14,
              metalness: 0,
              transmission: 0.48,
              thickness: 0.07,
              ior: 1.46,
              clearcoat: 0.7,
              clearcoatRoughness: 0.09,
              envMapIntensity: 1.35,
              side: THREE.DoubleSide,
            });
            material.dispose();
            return pane;
          }
          if (name.includes("water")) {
            material.roughness = 0.13;
            material.metalness = 0.07;
          } else if (name.includes("warmly shaded interior")) {
            material.emissive = new THREE.Color("#ffbd76");
            material.emissiveIntensity = 0.19;
            material.roughness = 0.84;
          } else if (name.includes("recess") || name.includes("glazing")) {
            material.roughness = 0.16;
            material.metalness = 0.09;
          } else if (name.includes("foliage") || name.includes("leaf")) {
            material.roughness = 0.88;
            material.metalness = 0;
          } else if (name.includes("paint")) {
            // Keep the vibrant authored Bo-Kaap and tower colours.
            material.roughness = 0.62;
            material.metalness = 0;
          } else if (name.includes("amber")) {
            material.roughness = 0.38;
            material.metalness = 0.3;
          } else {
            material.roughness = THREE.MathUtils.clamp(material.roughness, 0.12, 0.98);
            material.metalness = THREE.MathUtils.clamp(material.metalness, 0, 0.85);
          }
          material.envMapIntensity = 0.86;
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
      <primitive object={instance} dispose={null} />
    </>
  );
}
