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


## Independent before/after verdict — 2026-11-03

Successful [baseline vs curved-foliage visual capture](https://github.com/thembaxx/citylit/actions/runs/41700801680) produced real ready-state WebGL screenshots for Bo-Kaap with surroundings enabled, day and night, at **1440×900**, **390×844**, and **320×720**. Both runs had the same landmark, camera preset and viewport. Source: the archived `foliage-baseline-desktop-mobile` and `foliage-curved-leaves-desktop-mobile` artifacts.

The foliage changes are visible only in very small trees near the periphery; the core architecture, composition, glazing and textures are almost identical. An independent pixel comparison of the daylight PNG captures using a maximum RGB-channel difference threshold of 10 found ~**0.06%** changed pixels on desktop, **0.24%** at 390px and **0.23%** at 320px. This measures visual footprint, not perceptual quality or frame rate.

**Visual acceptance: NOT MET.** Instanced laminae are a useful lower-level technique, but do not meaningfully close the gap to the reference image while the whole scene is too miniature-like. Keep draft/unmerged. Next prioritize reference-informed architecture geometry, proportion, glass/reflections and staged camera composition. Then revisit foliage at a scale where its improvement is perceptible. Do not claim photographic realism or mobile-GPU performance from software-rasterized Chromium images.
