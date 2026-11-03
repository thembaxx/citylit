# Union Buildings architectural window-depth pass

The current Pretoria Union Buildings scene already has two sculpted wings,
arched linking colonnade and twin roof towers, but its windows are still flat
shadow decals. This pass reuses the validated `scripts/recessed-architecture.py`
Boolean aperture method first introduced for Bo-Kaap, City Hall and
Constitution Hill.

- Names the two façade shell meshes before applying Boolean cuts, so the
  process does not depend on object order or unrelated stage geometry.
- Makes 16 individual shallow openings through the front stone façades,
  creates side/back walls, floors and small furnishings for room-depth
  parallax, and gives each opening an individual glass surface.
- Uses the physically based `Architectural window glazing` treatment already
  in `components/StageModel.tsx`; unchanged other landmarks and interactions.
- Retains the existing model scale, accessible inspection controls,
  mobile-first layout and neutral porcelain display base.

These are stylised editorial studies, not measured or photogrammetric
reproductions. Blender outputs must be committed, validated with
`pnpm models:audit`, checked at 1440×900 and 390×844 from ready-state WebGL
captures, and reviewed for memory/performance before merging.

No assets from the user's reference image are copied.

## Verified reconstruction — November 3, 2026

The complete original Blender authoring run passed after fixing a Python
material-variable collision and an inherited Oxfmt formatting issue.
[Build, audited models, TypeScript, lint, format and actual desktop/mobile
ready-state captures](https://github.com/thembaxx/citylit/actions/runs/41687540362)
all succeeded. The generated, Draco-compressed fifteen-model catalog is
committed as `cb020d89`, including the Union Buildings actual Boolean apertures
and independent room backing, side walls, miniature furnishings and glass.

The screenshots are in artifact `citylit-union-buildings-window-depth`
(1440 × 900 and 390 × 844). These show the building and its windows load
successfully at both sizes, without loading-state fallbacks or lost geometry.

**Visual verdict:** The new architectural interiors are visible mainly on
close inspection and rotate; the overview still reads as a simplified,
editorial miniature. This does not meet the owner's photographic architectural
inspiration in the absence of measured landmark geometry, architectural
material aging, high-resolution environment lighting and baked GI/AO.
The work improves geometry and preserves existing navigation and accessibility,
but should not be described as reference-level realism.

One-shot workflow retired after successful capture; source and verification
remain reproducible through `pnpm models:build` and `pnpm models:audit`.
