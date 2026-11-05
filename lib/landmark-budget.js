// Geometry-based limits detect accidental complexity spikes before a slow phone
// enters the scene. They are proxies, not measured FPS or GPU timings.
export const MOBILE_LANDMARK_BUDGET = Object.freeze({
  drawCalls: 450,
  triangles: 850000,
  geometryBytes: 12 * 1024 * 1024,
  textureBytes: 850000,
});

export function profileLandmark(group) {
  const geometries = new Set();
  const textures = new Set();
  const stats = {
    drawCalls: 0,
    triangles: 0,
    geometryBytes: 0,
    textureBytes: 0,
    instances: 0,
  };

  group.traverse((node) => {
    if (node.isMesh || node.isPoints || node.isLine) {
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      stats.drawCalls += Math.max(1, materials.filter(Boolean).length);
      const instances = node.isInstancedMesh ? node.count : 1;
      if (node.isInstancedMesh) {
        stats.instances += instances;
        stats.geometryBytes += node.instanceMatrix?.array?.byteLength ?? 0;
        stats.geometryBytes += node.instanceColor?.array?.byteLength ?? 0;
      }
      const geometry = node.geometry;
      if (node.isMesh && geometry) {
        const count = geometry.index?.count ?? geometry.attributes.position?.count ?? 0;
        stats.triangles += Math.floor(count / 3) * instances;
      }
      if (geometry) geometries.add(geometry);
      for (const material of materials) {
        if (!material) continue;
        for (const key of ["map", "bumpMap", "roughnessMap", "normalMap", "emissiveMap"]) {
          const t = material[key];
          if (t?.isTexture) textures.add(t);
        }
      }
    }
  });

  for (const geometry of geometries) {
    for (const attribute of Object.values(geometry.attributes)) {
      stats.geometryBytes += attribute.array?.byteLength ?? 0;
    }
    stats.geometryBytes += geometry.index?.array?.byteLength ?? 0;
  }

  for (const texture of textures) {
    const image = texture.image;
    if (image?.data?.byteLength) {
      stats.textureBytes += image.data.byteLength;
    } else if (image?.width && image?.height) {
      stats.textureBytes += image.width * image.height * 4;
    }
  }

  return stats;
}

export function verifyMobileBudget(group, limits = MOBILE_LANDMARK_BUDGET) {
  const stats = profileLandmark(group);
  const violations = Object.entries(limits)
    .filter(([key, limit]) => stats[key] > limit)
    .map(([key, limit]) => `${key}: ${stats[key]} > ${limit}`);
  return { stats, violations, passed: violations.length === 0 };
}
