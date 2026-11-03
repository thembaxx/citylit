# CityLit — upgraded 3D asset catalog

## Scope and source of truth

The following 15 reusable Blender GLB model types are built from the original
CityLit source geometry and have UV-mapped, locally embedded CC0 PBR materials:

| Architecture or environment | GLB identifier |
| --- | --- |
| Table Mountain | `table-mountain` |
| Stadium canopy | `stadium` |
| Union Buildings | `union-buildings` |
| Ponte City | `ponte` |
| Bridge | `bridge` |
| Lighthouse | `lighthouse` |
| The Big Hole | `hole` |
| Parks and gardens | `park` |
| Museum / civic dome | `dome` |
| Tower | `tower` |
| Memorial arch | `arch` |
| Fortification | `fort` |
| Bo-Kaap building row | `bo-kaap` |
| Cooling towers | `cooling-towers` |
| Aquarium | `aquarium` |

The city and category legacy scenes also use local procedural albedo/relief
textures and denser, instanced tree leaves. The shared inspector defaults to an
unobstructed, larger **focused model** and exposes a user-controlled option to
show the original illustrative surroundings.

**These are enhanced original architectural miniatures, not surveyed or
photogrammetric representations.** The fifteen mesh types are reused for different attractions according to
`lib/stage-models.ts`. The first five landmark archetypes now have reference-informed
bespoke sculpting; the ten remaining archetypes use distinct topology builders,
described in `docs/remaining-sculpt-assets.md`. The entire collection remains
**editorial and is not fifteen site-specific photographic reconstructions**. The separately modeled
McGregor Museum hero lives under `public/models/hero`.

## Asset pipeline

The CC0 material scans originate from ambientCG and are retrieved only while
building, not while browsing. The same four source material groups are used
across the app: `Bricks090`, `PavingStones128`, `Grass004`, and `Wood096`.
Their albedo, OpenGL normal and roughness scans are optimized as 320px JPEGs
and embedded directly into each compressed model. Read the CC0 license at
https://docs.ambientcg.com/license/.

```bash
python3 scripts/fetch-museum-pbr.py
pnpm models:build
pnpm models:audit
pnpm lint && pnpm typecheck && pnpm format:check && pnpm build
```

Requires Blender, Python 3 + Pillow, Node 24 and the pinned pnpm version.
The Blender exporter creates uncompressed glTF binaries first; the
`@gltf-transform` script writes Draco-compressed GLBs, restores the intended
per-material base-colour multipliers, decodes each result and verifies integrity.

Each GLB must stay below 2 MiB, with a combined maximum of 22 MiB. The
catalog now totals approximately 4.9 MiB after the ten-mesh rebuild. Manifest entries record size,
texture count, compression, and material provenance.

## QA and release policy

- Check all 15 binaries for Draco decode, texture embedding, readable mesh
  primitives, colour factors, and model-size bounds.
- Run desktop/mobile Playwright across the existing 12-city tours, context
  visibility, landmark switching, night mode and camera presets.
- Render actual screenshots of all 15 model types using
  `node scripts/capture-stage-catalog.mjs` against a locally running build.
- Verify on lower-power mobile hardware before claiming an FPS target.
- Preserve PWA offline fallback and screen-reader accessible navigation.
- Ensure screenshots show coloured, recognizable assets and not blank canvases.

The studio reference supplied by the project owner is still a **higher
architectural-visualization standard**. Achieving photographic accuracy for
every landmark requires individual reference measurements, proportion-correct
modeling, UV-aware high-resolution scans, architectural interiors, and
art-directed baked illumination. Success of technical checks alone does not
prove visual parity.
