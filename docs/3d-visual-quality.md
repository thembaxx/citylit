# CityLit architectural-quality 3D upgrade

## Scope and visual reference

The scene targets the supplied architectural app reference: refined scale-model detail,
credible material response, soft edge highlights and deliberately restrained controls.
The reference is inspiration, not a licensed 3D asset or an exact recreation.

The McGregor Museum miniature is an **original illustrative interpretation**. It does
not claim to reproduce surveyed dimensions or historic architectural elements. CityLit
continues to show attributed venue photographs and linked practical visitor information
in the guide.

## What this implementation changes

- The legacy Kimberley 3D chapter and the newer Kimberley landmark atlas share
  `MuseumShowcase`, with separate facade, copper roof and landscape groups.
- The atlas exposes accessible controls for day/night lighting, zoom, camera/detail
  presets, separation of architectural layers and reset.
- Clickable 3D markers complement standard DOM buttons. The information and controls
  remain accessible when WebGL fails.
- Existing compressed Blender assets continue to load through a per-model boundary.
  Per-instance materials receive category-specific PBR roughness and remain independent
  of the shared GLTF cache.
- The shared single-canvas renderer uses AgX tone mapping and an adaptive shadow
  budget. Desktop receives soft shadow maps; coarse/small screens avoid that work.
  Stage shadow casting is limited to the selected asset.
- The Blender authoring script now assigns category-specific Principled BSDF settings
  and bevels large architectural masses. Existing shipped GLBs remain untouched
  until that script is run and its assets are reviewed.

## Quality gates

1. `pnpm lint && pnpm typecheck && pnpm format:check`
2. `pnpm build` (includes the existing PWA checks)
3. `pnpm exec playwright test tests/stages.spec.ts tests/premium-3d.spec.ts tests/stage-asset-fallback.spec.ts`
4. Review at 390×844, 768×1024 and 1440×900: no UI overlap; all tool
   buttons reachable; tap/drag/swipe still work; no blank frames or context loss.
5. Test reduced-motion, keyboard navigation and WebGL-disabled fallback; compare
   desktop/mobile screenshots against the provided references.
6. Measure frame time and GPU memory on real mid-tier mobile hardware; target
   smooth 30fps on mobile and up to 60fps on capable devices, not a blanket
   promise. Reduce DPR, shadow map resolution or visual detail when necessary.
7. For any Blender asset regeneration, use Blender 4.3+ and run
   `pnpm models:build && pnpm models:audit`; visually inspect the actual GLBs
   and keep the compressed model size budget.

## Remaining art-production work

This implementation improves real-time scene quality and makes the museum inspectable,
but it is **not yet a photorealistic surveyed GLB**. Production-grade landmark fidelity
requires rights-cleared reference photography/measurements, high-detail Blender modeling,
UVs, PBR texture maps, HDR environment maps or baked light probes, and visual comparison
against real buildings. Do not label procedurally inferred details as authoritative.

No new third-party asset rights, external runtime texture CDNs, or additional canvas
instances are required by this change.
