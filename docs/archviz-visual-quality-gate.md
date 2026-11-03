# CityLit — photographic-quality architecture benchmark

## Visual target

Reference supplied by the project owner: a realistic, art-directed isometric architectural
visualization of a contemporary building with genuinely convincing surfaces, depth,
reflection, landscaping, light, and camera composition.

**The current CityLit stage miniatures do not meet this target.** Passing TypeScript,
GLB size checks, or browser interaction tests is not evidence of comparable visual quality.

## Existing shortcomings confirmed by actual browser renders

- Many landmarks still resemble coloured primitives, including the historic museum hero.
- Geometry is too simple to produce believable window recesses, roof profiles,
  interiors, material transitions, edge highlights or small-scale architectural details.
- Generic vertex/solid colours stand in for UV-authored PBR texture maps.
- Landmark framing is cropped on desktop and has conflicted with controls on mobile.
- Landscape foliage has a conspicuously simplified, rounded appearance.
- Tiny Draco GLBs are evidence of efficient assets, not evidence of photorealism.

## Work in this experiment

- Local, procedural albedo/relief maps for stone, plaster, copper, paving, wood, and grass.
- Smooth micro-bevels, more convincing glazing, less obstructive foliage, richer contrast.
- Local PMREM studio reflection environment for surfaces without an external runtime fetch.
- Revised framing and a collapsible mobile inspector.
- Repeatable screenshots at 1440x900 and 390x844 in daylight and night mode.

**This is a rendering experiment, not the final asset-quality milestone.**

## Non-negotiable acceptance criteria for a future premium-asset milestone

1. A new, reference-informed Blender museum or other landmark model with authored
   proportions, bevelled hard-surface geometry, window reveals, mullions, doors, roof
   construction, trim and a believable interior behind glass.
2. Rights-cleared photographic/PBR material maps (base color, normal, roughness,
   ambient occlusion), with UVs, calibrated roughness and appropriate metalness.
3. HDR/PMREM studio lighting, ambient occlusion, soft contact shadows, correct colour
   management, and depth without overexposed white surfaces.
4. Landscape vegetation that reads as vegetation rather than spheres and low-poly cones.
5. **Visual review of actual browser captures** at 1440x900 and 390x844, compared
   side-by-side with the user's provided screenshots before any merge or rollout.
6. Render quality tiers, LOD, texture compression and asset preloading verified on
   real midrange mobile hardware. Adaptive settings must preserve recognisable quality.
7. Keyboard, screen reader, reduced-motion, offline fallback, and visual interaction QA.

## Release policy

Do not merge an experimental styling branch solely because it builds. A reviewer should
visually sign off on a genuinely improved hero image. Do not apply an unapproved
style mechanically across the remaining 3D assets.

Some figures in the supplied reference are a visually polished architectural illustration,
not proof of the ability to reconstruct a historic building. Never label an unverified
illustrative model as an accurate survey.
