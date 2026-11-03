# CityLit — curved foliage for legacy 3D scenes

The independently rebuilt Durban Botanic Gardens GLB already uses detailed curved leaves, but the older React Three Fiber city and landmark miniatures still rendered each tree crown as an instanced **icosahedron** cluster.

This branch replaces those faceted clusters with deterministically authored tapered leaf-lamina geometry, including a raised midrib, gentle edge curvature and computed normals. It keeps one instanced foliage draw per tree and existing low-cost trunks/branches; the dense scene remains entirely local and offline-capable.

- Hero scenes: 224 individual leaves (up from 108 low-poly clusters)
- Compact scenes: 96 leaves (up from 48 clusters)
- Existing seeded colour variation and all caller props preserved
- Compact leaves no longer cast expensive individual shadows
- No GLB or third-party dependency changes

## Required acceptance

Run format, lint, strict TypeScript, production build, and desktop/mobile WebGL regressions. Compare 1440×900, 390×844 and 320×720 ready-state city/landmark captures, including day/night lighting, to check silhouette fullness, genuine lamina appearance, no visually floating fragments, and stable frame times on representative phones.

This is still an editorial procedural miniature. It cannot be described as a photographic, scanned, or surveyed botanical reconstruction. Keep the PR draft until visual and performance checks are complete.
