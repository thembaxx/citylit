import * as THREE from "three/webgpu";
import { createGroundShadowTexture } from "./textures";

export function createBase({
  size,
  depth,
  slabs,
  material,
  materials,
}: {
  size: number;
  depth: number;
  slabs: number;
  material: THREE.Material;
  /** Optional per-slab materials, ordered from the top slab down. */
  materials?: THREE.Material[];
}) {
  const group = new THREE.Group();
  const slabHeight = depth / slabs;
  const meshes: THREE.Mesh[] = [];
  for (let i = 0; i < slabs; i++) {
    const geometry = new THREE.BoxGeometry(size, slabHeight, size);
    const mesh = new THREE.Mesh(geometry, materials?.[i] ?? material);
    mesh.position.y = -slabHeight / 2 - i * slabHeight;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    meshes.push(mesh);
  }
  return { group, slabs: meshes, slabHeight };
}

export function createGroundShadow(size: number, y: number) {
  const texture = createGroundShadowTexture();
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = y;
  mesh.renderOrder = -1;
  return mesh;
}
