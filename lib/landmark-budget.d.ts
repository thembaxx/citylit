import * as THREE from "three";

export interface LandmarkProfile {
  drawCalls: number;
  triangles: number;
  geometryBytes: number;
  textureBytes: number;
  instances: number;
}
export const MOBILE_LANDMARK_BUDGET: Readonly<Omit<LandmarkProfile, "instances">>;
export function profileLandmark(group: THREE.Object3D): LandmarkProfile;
export function verifyMobileBudget(
  group: THREE.Object3D,
  limits?: Readonly<Omit<LandmarkProfile, "instances">>,
): { stats: LandmarkProfile; violations: string[]; passed: boolean };
