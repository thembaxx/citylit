# CityLit — authored botanical fidelity

The Durban Botanic Gardens scene had visible, oversized sphere crowns and
floating oval foliage, even after the architectural-detail pass. Its large
canopy silhouettes failed the owner's architectural reference target.

This isolated improvement replaces **only** the park's tree canopies with
2,816 deterministic curved leaf laminae (4 trees × 11 clusters × 64 leaves),
plus slender twigs and hundreds of individually tapered ground blades.
Individual laminae have geometric midrib curvature and four physically rough
green materials. The entire canopy exports as one Blender mesh with four
material slots rather than thousands of extra object/draw calls; groundcover
shares another mesh. Blender and Three.js render the leaves double sided.

The original four tree trunks, garden paths, glasshouse, benches, planter
geometry, neutral landscape ground and other fourteen landmark classes
remain unchanged. No external runtime assets or copyrighted reference
geometry were used. Source texture maps stay bundled for other surfaces.

**Release gate:** regenerate and decode actual GLBs, inspect 1440×900,
390×844 and 320×720 ready-state screenshots, check that botanical foliage
is visibly more natural and that stage controls don't collide. Check
mobile memory and interactions. This is a detailed procedural miniature,
not a scanned real-world tree or photorealistic botanical reconstruction.

## Second visual-density pass

The first ready-state desktop and phone capture showed correct leaf geometry but
canopies still appeared sparse at the app's normal field of view. Leaf counts
increased to 2,816 while preserving the one-mesh canopy and independent green
materials. Actual screenshots and frame-time behavior must be reviewed again;
source counts alone are not the release gate.
