# Remaining ten — sculpted stage models

## Direction and provenance

These ten CityLit miniatures are generated from dedicated Blender meshes rather than generic cones/boxes with distinct authored
structure. They use the original Blender material pipeline and locally embedded,
rights-cleared ambientCG CC0 PBR maps. They are **original interpretations** for
the interactive explorer, not site surveys or replicas of copyrighted architectural
models. `dome` and `tower` are reused *asset classes*, not guarantees that all
their assigned monuments look like the rendered landmark. No external runtime
assets or tracking are introduced.

| Model ID | Design intent of new topology |
| --- | --- |
| `bridge` | Asymmetric pylons, continuous road deck, stay cable web, two side guardrails |
| `lighthouse` | Tapered masonry shaft, lantern, gallery rail, bands, recessed windows |
| `park` | Individually branched canopy, glasshouse, garden paths, benches and flower beds |
| `dome` | Civic/justice court courtyard with colonnade, masonry wings and stairs (no generic sphere) |
| `tower` | Classical civic hall with portico, clock dial, roof and two wings |
| `arch` | Freestanding memorial arch with an actual open void, voussoirs and steps |
| `fort` | Pentagonal bastions, open court, crenellations and gatehouse |
| `bo-kaap` | Five individually coloured houses, stepped street and roof edges |
| `cooling-towers` | Two continuous open hyperboloid shells, bands, grid and unique finishes |
| `aquarium` | Ship-style framing, water habitat, curved tube tunnel and accessible forecourt |

## How to build and verify

```bash
python3 scripts/fetch-museum-pbr.py
pnpm models:build
pnpm models:audit
pnpm lint && pnpm typecheck && pnpm format:check && pnpm build
STAGE_FOCUS_IDS=bridge,lighthouse,park,dome,tower,arch,fort,bo-kaap,cooling-towers,aquarium node scripts/capture-stage-catalog.mjs
```

The one-time Blender regeneration has produced fifteen Draco-compressed models and a manifest. Per-asset technical validation passed in the rebuild workflow; visual review and complete final-branch CI remain separate gates.
All fifteen models must decode, contain at least three embedded CC0 images,
have adequate mesh complexity and material differentiation, and stay below
2 MiB each / 22 MiB for the combined catalog.

Inspect actual 1440×900 and 390×844 browser renderings, geometry silhouettes
and memory/performance before merge. Screen-reader navigation, keyboard
controls, day/night modes and offline fallbacks must continue working.
A clean build alone cannot establish realism or visual similarity to the
owner's reference.

## Important limitations

A few names map to composite editorial representations instead of a specific
surveyed landmark (for example civic hall/justice court, parks, aquarium).
Improved mesh complexity and texture resolution do **not** imply physically
accurate indirect lighting, photogrammetry, or faithful reconstruction. Those
require art-directed reference modeling, higher quality scans, interior geometry
and baked lighting with measured visual review.

## Recorded November 3 validation and remaining quality gap

- All fifteen GLBs regenerated or preserved and decoded; each stayed inside the
  2 MiB limit, with locally embedded CC0 material maps.
- The one-shot build [completed successfully](https://github.com/thembaxx/citylit/actions/runs/41664960658).
- Captures that only proved a WebGL canvas was present could contain a
  Suspense fallback. Screenshot coverage now requires explicit ready status for
  the active model, and a regression asserts error status on failed GLB loads.
- The [full 10-model loaded-geometry capture](https://github.com/thembaxx/citylit/actions/runs/41666258815)
  passed on 1440 × 900 desktop and 390 × 844 mobile.
- Recompressed authored baseColorFactor tints, including five independent Bo-Kaap
  paint colours, after detecting colour loss from Blender's MixRGB nodes.
  [The colour-corrected capture](https://github.com/thembaxx/citylit/actions/runs/41666595526)
  passed; the final source was normalized with pinned Oxfmt.
- Visual review confirms distinguishing geometry, no displayed loading fallback,
  and restored facade colours. However the scenes remain stylized, relatively
  low-poly editorial models. They **do not yet meet the requested photographic
  architectural-visualization benchmark**. The next art pass needs site-accurate
  measured proportions, realistic botanical models, higher-frequency UV detail,
  physically convincing glazing and interior depth, baked GI/AO, and comparative
  visual approval, with mobile memory/FPS review.
- Do not claim full fidelity or release approval solely from synthetic WebGL
  screenshots or pipeline CI. Keep this PR draft unless the visual benchmark is met.

## 2026-11-03 — High-resolution archviz follow-up (separate stacked branch)

The supplied architectural reference is **not met** by these renders. The earlier
2 MiB/22 MiB limits and 320 px scan downsampling were arbitrary technical limits,
not art-direction goals; remove them. New builds preserve source-scan resolution,
and Draco and structural checks remain mandatory. Only selected and adjacent
landmarks can mount when surroundings are visible, avoiding downloading all large
models just to show one. More expensive GLBs require real mobile memory tests and
per-scene error/fallback validation. Resolution alone does not create realism;
architecture, depth, materials and presentation still need comparison screenshots.

## Microgeometry layer (draft)

A separate physical detailing pass covers the ten newest landmark classes: mullioned
windows with shadow backing and window sills, joinery and roof edging, civic masonry,
bridge fittings, lighthouse lanterns, individual botanical leaves, fort surface
joints, cooling tower ladders and aquarium structural glazing. This is not an
as-built accuracy guarantee. Regenerate and inspect binary GLBs before counting
this work as delivered. The quality acceptance gate is a visual comparison of
**actual ready-state WebGL captures** and inspection close-ups, not merely source code.
