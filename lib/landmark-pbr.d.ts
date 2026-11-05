import * as THREE from "three";

export type LandmarkSurface = "sandstone" | "limestone" | "terracotta" | "concrete" | "cliff" | "membrane";
export function pbrSurface(kind: LandmarkSurface, tint?: string, vertexColors?: boolean): THREE.MeshStandardMaterial;
export function landmarkPbrTextureBytes(): number;
