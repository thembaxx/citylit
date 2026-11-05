import type * as THREE from "three";

export function createProceduralLandmark(name: string, model?: string): THREE.Group;
export function setProceduralNight(group: THREE.Group, night: boolean): void;
export function disposeProceduralLandmark(group: THREE.Group): void;
