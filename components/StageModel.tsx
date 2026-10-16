"use client";
import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";

export default function StageModel({ model }: { model: string }) {
  const { scene } = useGLTF(`/models/stage/${model}.glb`, "/draco/");
  const instance = useMemo(() => scene.clone(true), [scene]);
  return <primitive object={instance} dispose={null} />;
}
