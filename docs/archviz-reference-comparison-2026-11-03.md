# CityLit architectural reference comparison — 3 November 2026

## Reference and decision

The owner's supplied Iconly Skyline Tower visual establishes the target: an isometric architectural model with carefully recessed facades, realistic transparent glazing and interiors, layered structural elements, detailed roof equipment, calibrated white materials and soft global illumination. This is a **visual-quality reference**, not an asset to copy into CityLit.

**Visual decision: not at reference parity.** The current 15 original CityLit models are recognisable editorial miniatures, not site-measured architectural or photoreal replicas. Do not present them as such.

## Implemented in the staged PR

- Rebuilt all 15 Blender-authored GLBs with available source-resolution CC0 scanned material maps, instead of downscaling every image to 320px.
- Corrected paint albedo and physically based glass response; added layered glazing, mullions, recessed shadow reveals and warm room backing to the remaining architecture builders.
- Added conservative three-point lighting, improved shadow resolution on capable screens and selected-model-only loading to control peak resource use.
- Replaced the decorative amber ring under built architecture with a bevelled neutral porcelain platform; retained terrain dioramas where appropriate.
- Replaced the broken Bo-Kaap series of diagonal roof rods with continuous pitched roof planes and gutters.
- Expanded source budget sanity checks to accommodate material detail without making small GLBs an aesthetic target.

## Objective verification

The [successful one-time reconstruction](https://github.com/thembaxx/citylit/actions/runs/41670158126) completed Blender rebuild, model/decode audits, formatting, lint, typecheck, production build and **30 real WebGL screenshots** (15 selected models at 1440 × 900 and 390 × 844). Full browser outputs: artifact `citylit-reference-materials-desktop-mobile` attached to that run.

The 15 committed compressed GLBs total **34,380,996 bytes** (34.4 MB decimal); the files remain available individually as runtime-selected assets. This is not a claim of 34 MB being fetched on every page load. The actual rendering shows clearer bases and Bo-Kaap roof shapes. Improving materials alone did **not** make the models match the reference.

## Remaining visual blockers

1. **Geometry**: Many model silhouettes are still built from simplified facades and repeated primitives; the studio reference contains materially more convincing assembly detail. Individual reference-informed reconstruction is required, not more generic procedural buildings.
2. **Windows**: While newly layered, windows generally lack actual cut-through apertures, modeled room contents, accurate reflections and convincingly lit interiors.
3. **Lighting**: No physically baked indirect illumination, high-quality ambient occlusion or per-material art-directed light probes. Existing soft contact shadows are approximations.
4. **Materials**: Original source scans reach 1K; facade-specific dirt masks, trims, weathering, glass imperfection and UV-guided paint variation are not yet modeled.
5. **Camera/framing**: Desktop and mobile architecture remains small relative to the UI. Any move closer must be assessed for collisions with accessible controls and sheets.
6. **Site specificity**: The 15 GLB classes are reused by the real place catalog. A quality model class does not make a faithful reconstruction of every assigned landmark.
7. **Mobile**: Desktop/mobile software-rendered screenshots confirm nonblank WebGL frames, not real-device GPU throughput, memory stability or thermal performance.

## Acceptance before merger

- Compare every model at 1440 × 900 and 390 × 844 with the same reference shot and verified venue photos.
- Require recognizable, materially convincing high-frequency architectural detail without painted fake windows, missing roof surfaces or toy-like geometry.
- Verify visual consistency between day/night and reduced-motion, WebGL failures and slow-loading assets.
- Measure memory and frame pacing on a real mid-range mobile device.
- Preserve source rights, factual labeling, accessible guides, offline guide fallback and reliable interaction.
- Keep draft if the above gates fail; technical tests alone are insufficient.
