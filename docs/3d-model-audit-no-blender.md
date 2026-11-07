# CityLit 3D model audit — Three.js/WebGL only

**Audit date:** 2026-11-07  
**Repository baseline:** `main` at `fa8623ec7b518511d93ea707937c24ea41a19ae7`  
**Constraint:** No Blender, Blender Python API, Blender-authored assets, or Blender-dependent build steps. Model creation, materials, animation, inspection, and rendering must use Three.js and WebGL.

## Executive finding

CityLit already has a substantial runtime procedural-geometry foundation. The city landmark stage does **not** need Blender to render its main interactive models: `LandmarkRing → SafeStageModel → ProceduralStageModel → createProceduralLandmark()` creates real Three.js geometry and custom GLSL materials at runtime.

However, the repository is not yet Blender-free. Its package scripts still invoke Blender, the stage GLB manifest identifies 15 assets as authored in Blender 4.3, the museum hero loads a Blender-authored GLB, and a browser test explicitly validates the Blender/Draco GLB catalogue. These are contradictory legacy paths that must be retired or replaced before the project can honestly claim a Three.js/WebGL-only pipeline.

## What exists today

### Runtime procedural path

- `components/LandmarkRing.tsx` mounts `SafeStageModel`.
- `components/SafeStageModel.tsx` delegates to `ProceduralStageModel`; its failure boundary uses a simple geometric fallback.
- `components/ProceduralStageModel.tsx` creates and disposes the Three.js group, applies night lighting and exploded-view transforms, and ticks only the active scene.
- `lib/procedural-landmarks.js` contains the procedural geometry and GLSL water/fall shaders.
- The main stage has bespoke builders for Table Mountain, Union Buildings, Moses Mabhida Stadium, Nelson Mandela Bridge, and the Big Hole.
- Ponte City is a dedicated branch inside `genericLandmark()`: a hollow cylindrical tower with 54 floors, 36 instanced window panes per floor, and instanced floor bands.
- Other categories have procedural templates (Bo-Kaap, cooling towers, lighthouse/tower, aquarium, hotel, museum/theatre, cave, waterfall, village, entertainment, park, arch/fort). Several categories are still generic archetypes rather than one researched model per named place.

### Legacy Blender dependencies confirmed

- `package.json` defines `models:build` and `hero:build` commands that invoke the `blender` executable and Python scripts.
- `scripts/build-landmark-models.py`, `scripts/build-museum-hero.py`, `scripts/sculpt-landmark-heroes.py`, and related scripts use the Blender Python API.
- `public/models/stage/manifest.json` declares 15 GLB assets with `authoring: Blender 4.3`.
- `components/MuseumHeroAsset.tsx` loads `/models/hero/mcgregor-museum.glb`; its procedural `MuseumShowcase` is already a fallback.
- `components/StageModel.tsx` still contains a GLTF/Draco loader for stage GLBs.
- `tests/all-3d-landmarks.spec.ts` asserts the presence and structure of 15 Blender-authored Draco GLBs.
- The five landmark regression tests in `tests/procedural-stage.spec.ts` already assert that the interactive landmark stage makes no request for a stage GLB.

## Confirmed gaps and priorities

| Priority | Finding | Evidence | Recommended direction |
|---|---|---|---|
| P0 | Build pipeline violates the no-Blender requirement | `package.json` `models:build` and `hero:build` call Blender | Replace with Node scripts that construct/export geometry using Three.js APIs only, or remove obsolete build commands once all consumers are migrated |
| P0 | Museum hero still depends on a Blender GLB | `MuseumHeroAsset.tsx` loads `mcgregor-museum.glb` | Promote the existing procedural museum scene to the primary path; add fidelity layers in Three.js |
| P0 | Legacy GLB tests encode the old toolchain as a requirement | `tests/all-3d-landmarks.spec.ts` requires 15 Draco GLBs | Replace with procedural scene coverage, geometry/silhouette invariants, shader compilation checks, and no-GLB-network assertions |
| P1 | Named-place coverage is uneven | Only five named builders are selected by `createProceduralLandmark()`; many other places share category templates | Add researched, named Three.js builders for priority places, starting with the five flagship landmarks and then the highest-traffic catalogue entries |
| P1 | Ponte City is detailed but remains a simplified cylindrical archetype | 54 × 36 instanced glazing and floor bands; no verified site dimensions in code | Improve the characteristic open atrium, floor plates, balconies, vertical service core, rooftop, facade variation, and camera-readable proportions; retain instancing |
| P1 | Table Mountain terrain is procedurally shaped but stylised | 100 × 72 terrain grid plus companion peaks and instanced fynbos/rocks | Improve the plateau/cliff profile with deterministic multi-scale erosion, geological strata, ravines, and site-informed silhouette checks |
| P1 | Moses Mabhida roof and arch need robust silhouette/fidelity checks | Oval roof, radial membrane panels and arch are procedural | Validate arch sweep, leg anchoring, cable fan, stadium bowl, canopy profile, and Durban coastline context against references |
| P1 | Union Buildings model needs architectural proportion checks | Twin wings, curved amphitheatre, domed towers and formal gardens are procedural | Validate symmetry, wing heights, curved colonnade, domes, terraces, steps, and garden axes |
| P1 | Big Hole needs terrain and excavation fidelity checks | Bespoke model and water shader exist | Validate the recessed terraced pit, rim irregularity, exposed geology, water depth, and scale cues |
| P2 | Runtime quality claims need real-device evidence | Existing budgets are geometry proxies; renderer tests correctly avoid claiming GPU milliseconds | Keep draw/triangle/texture budgets, add real Chromium device captures and frame-time sampling where supported; never label proxy estimates as measured GPU time |

## Three.js version

The repository already declares `three: ^0.187.0` and matching `@types/three: ^0.187.0`. As of this audit, npm lists `three@0.187.0` as latest. Do not upgrade blindly; keep the runtime and type package aligned and validate the r187 migration behavior.

## Migration progress (2026-11-07)

- **Completed on the audit branch:** museum hero now delegates directly to the existing procedural Three.js `MuseumShowcase`; its GLB/Draco loader, cloned GLB materials, and model-specific disposal path are removed.
- **Completed on the audit branch:** `models:build` and `hero:build` no longer invoke Python or Blender; they explain that geometry is generated at runtime. Both audit commands now run `scripts/audit-procedural-models.mjs`.
- **Completed on the audit branch:** replaced the museum asset-manifest/Draco test with a browser regression test that checks museum interaction and asserts no museum GLB request. Removed the test that required 15 Blender-authored Draco files.
- **Completed on the audit branch:** Moses Mabhida now has one continuous signature arch instead of two parallel arch sweeps.
- **Completed on the audit branch:** Ponte City now includes an explicit inner atrium wall, instanced inner gallery floors, exterior balcony lips, and vertical concrete fins while retaining instanced facade details.
- **Completed on the audit branch:** Table Mountain and Big Hole receive a custom GLSL geological-bedding pass layered onto their PBR materials.
- **Added:** a static Node audit that checks the Three.js version, procedural stage wiring, named builder entry points, new geometry features, museum loader removal, and absence of Blender from package build commands.
- **Not yet completed:** Blender-authored scripts and legacy GLB files remain in the repository as unused/legacy assets pending a full reference audit. Union Buildings and additional Table Mountain / Big Hole / stadium details still need visual review. The generic category models need named-place fidelity upgrades. CI has been triggered, but jobs have not yet returned results.

## Proposed implementation stages

1. **Finish removing Blender from the active product path.** Audit every remaining GLTF consumer and contributor/CI reference. Remove or clearly archive the Blender-only authoring scripts and GLB catalogue only after confirming no route, test, or deploy process consumes them.
2. **Create a reusable procedural modelling toolkit.** Shared helpers for parametric surfaces, bevelled architectural profiles, lathed forms, instanced facade systems, deterministic terrain displacement, UVs, vertex colors, and resource ownership. Prefer merged geometry/instancing over thousands of individual meshes.
3. **Upgrade the five flagship landmarks.** One isolated builder and visual regression suite per landmark. Use site-informed proportions and recognizable silhouette first, then facade/terrain detail, PBR response, and micro-details.
4. **Upgrade remaining category models.** Replace generic archetypes with named builders when the catalogue has reliable references. Keep illustrative models clearly distinguished from measured reconstructions.
5. **WebGL shader and lighting pass.** Use GLSL `ShaderMaterial` / `onBeforeCompile` where it adds visible value: terrain strata, procedural roughness variation, water, atmospheric depth, emissive night windows, and subtle wind. Preserve WebGL2 compatibility, fallback behavior, and reduced-motion settings.
6. **Validation and performance.** Test silhouettes, mesh bounds, winding/normals, material/shader compilation, day/night transitions, disposal, 320/390/desktop viewports, touch/keyboard inspection, and no GLB requests. Measure actual browser frame times on representative devices; keep geometry budgets as guardrails, not FPS claims.

## Acceptance criteria

- No runtime route, build script, CI job, test, or contributor instruction requires Blender.
- No Blender-authored GLB is required for the CityStage or museum hero experience.
- The primary landmark scenes are generated from Three.js geometry and GLSL shaders.
- Each flagship landmark has a deterministic geometry/silhouette regression test and captured desktop/mobile visuals.
- No regression to PWA behavior, accessibility, reduced motion, touch controls, inspect overlays, or memory/resource disposal.
- Performance reports distinguish measured frame timings from geometry-based estimates.

## Scope note

This audit documents confirmed repository structure and a migration plan. It does not claim that the GLB assets have already been removed or that any visual upgrade has been implemented or device-verified.
