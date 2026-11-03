"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  makeMuseumSurfaces,
  disposeMuseumSurfaces,
  type MuseumSurface,
} from "../lib/museum-surfaces";

/**
 * Existing procedural CityLit models were deliberately flat-shaded and widely
 * assigned the same roughness. Apply category-aware finishes non-destructively.
 *
 * Meshes and geometry are kept intact; cloned materials only belong to this
 * mounted chapter and are restored/disposed when switching chapters.
 */
export default function SurfaceFinishes({ children }: { children: ReactNode }) {
  const root = useRef<THREE.Group>(null);
  const { invalidate } = useThree();

  useLayoutEffect(() => {
    const maps = makeMuseumSurfaces();
    const originals: {
      mesh: THREE.Mesh;
      material: THREE.Material | THREE.Material[];
      castShadow: boolean;
      receiveShadow: boolean;
    }[] = [];
    const copies: THREE.Material[] = [];
    root.current?.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const previous = object.material;
      const polish = (source: THREE.Material): THREE.Material => {
        if (!(source instanceof THREE.MeshStandardMaterial)) return source;
        const finish = source.clone();
        const name = (finish.name || "").toLowerCase();
        const color = finish.color;
        const bright = Math.max(color.r, color.g, color.b);
        const blueGlass = color.b > color.r * 1.32 && color.b > color.g * 1.12;
        const greenFoliage = color.g > color.r * 1.2 && color.g > color.b * 1.05;
        if (blueGlass || name.includes("glass")) {
          finish.roughness = 0.24;
          finish.metalness = 0.1;
        } else if (greenFoliage) {
          finish.roughness = 0.93;
          finish.metalness = 0;
        } else if (bright < 0.27) {
          finish.roughness = 0.53;
          finish.metalness = 0.22;
        } else {
          finish.roughness = Math.max(0.45, Math.min(0.91, finish.roughness));
          finish.metalness = Math.min(0.18, finish.metalness);
        }
        // These are lightweight procedurally generated maps for classic
        // CityLit objects, not scans or survey-accurate textures.
        const surface: MuseumSurface = greenFoliage
          ? "grass"
          : name.includes("wood") || name.includes("timber")
            ? "wood"
            : blueGlass
              ? "copper"
              : bright < 0.27
                ? "stone"
                : "plaster";
        if (!blueGlass && !finish.map) {
          finish.map = maps[surface].albedo;
          finish.bumpMap = maps[surface].bump;
          finish.bumpScale = maps[surface].bumpScale;
          finish.needsUpdate = true;
        }
        finish.envMapIntensity = 0.65;
        copies.push(finish);
        return finish;
      };
      object.material = Array.isArray(previous) ? previous.map(polish) : polish(previous);
      originals.push({
        mesh: object,
        material: previous,
        castShadow: object.castShadow,
        receiveShadow: object.receiveShadow,
      });
      object.castShadow = true;
      object.receiveShadow = true;
    });
    invalidate();
    return () => {
      originals.forEach(({ mesh, material, castShadow, receiveShadow }) => {
        mesh.material = material;
        mesh.castShadow = castShadow;
        mesh.receiveShadow = receiveShadow;
      });
      copies.forEach((copy) => copy.dispose());
      disposeMuseumSurfaces(maps);
      invalidate();
    };
  }, [invalidate]);

  return <group ref={root}>{children}</group>;
}
