# Remaining ten — sculpted stage models

## Direction and provenance

These ten CityLit miniatures replace generic cones/boxes with distinct authored
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

The reusable pipeline must output fifteen Draco-compressed models and a manifest.
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
