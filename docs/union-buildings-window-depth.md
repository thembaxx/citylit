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
