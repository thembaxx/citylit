# CityLit 3D model audit — Three.js/WebGL only

**Audit date:** 2026-11-07  
**Repository baseline:** `main` at `fa8623ec7b518511d93ea707937c24ea41a19ae7`  
**Constraint:** No Blender, Blender Python API, Blender-authored assets, or Blender-dependent build steps. Model creation, materials, animation, inspection, and rendering must use Three.js and WebGL.

## Executive finding

CityLit already has a substantial runtime procedural-geometry foundation. The city landmark stage does **not** need Blender to render its main interactive models: `LandmarkRing → SafeStageModel → ProceduralStageModel → createProceduralLandmark()` creates real Three.js geometry and custom GLSL materials at runtime.

However, the repository is not yet Blender-free. Legacy authoring scripts and GLB files remain in the repository pending a complete reference audit and safe removal. Their continued presence must not be confused with active runtime dependencies.

## What exists today

### Runtime procedural path

- `components/LandmarkRing.tsx` mounts `SafeStageModel`.
- `components/SafeStageModel.tsx` delegates to `ProceduralStageModel`; its failure boundary uses a simple geometric fallback.
- `components/ProceduralStageModel.tsx` creates and disposes the Three.js group, applies night lighting and exploded-view transforms, and ticks only the active scene.
- `lib/procedural-landmarks.js` contains procedural geometry and custom GLSL effects.
- The main stage has bespoke builders for Table Mountain, Union Buildings, Moses Mabhida Stadium, Nelson Mandela Bridge, the Big Hole, and Ponte City.
- Other categories have procedural templates; several catalogue entries remain archetypes rather than individually researched reconstructions.

### Migration changes on this branch

- The museum hero now uses the procedural Three.js `MuseumShowcase`; the GLB/Draco loader and model-specific GLB disposal path were removed.
- The backwards-compatible `StageModel` entry point now delegates to `ProceduralStageModel`.
- `models:build` and `hero:build` no longer invoke Blender or Python. Geometry is generated at runtime.
- Museum and city-stage browser tests now assert interaction and absence of GLB network requests instead of requiring a Blender-authored Draco catalogue.
- Moses Mabhida has one continuous signature arch rather than duplicated parallel arches.
- Ponte City has an explicit inner atrium wall, instanced inner gallery floors, exterior balcony lips, and vertical concrete fins.
- Table Mountain and the Big Hole receive a custom GLSL geological-bedding pass.
- Union Buildings cupolas have radial sandstone ribs, drum rims, and finials.
- Procedural PBR texture resolution is 128px; cached shared textures are protected from per-landmark disposal.
- A static Node audit checks the Three.js version, procedural wiring, selected geometry features, museum loader removal, and absence of Blender from package build commands.

## Remaining work

1. Audit every remaining GLTF consumer, legacy GLB, Blender authoring script, CI reference, and contributor instruction before deleting legacy files.
2. Upgrade generic category models to named-place builders where reliable references exist.
3. Visually validate landmark proportions and silhouettes against trustworthy site references.
4. Validate shader compilation, resource disposal, day/night transitions, keyboard/touch inspection, and reduced-motion behavior.
5. Capture genuine desktop/mobile browser screenshots and measure actual browser frame times on representative devices. Geometry budgets are guardrails, not GPU measurements.

## Three.js version

The repository declares `three: ^0.187.0` and matching `@types/three: ^0.187.0`. CI installed `three 0.187.0` and `oxfmt 0.75.0` successfully on the latest attempt.

## Latest verification snapshot

- PR: [#113](https://github.com/thembaxx/citylit/pull/113), branch `audit/threejs-only-landmark-models`.
- Tested PR head: `991f8c559986fba29d2d035d8ec5a9197b22e488`; CI tested synthetic merge commit `b94e57a66fea0be00697fbed412d9c728636008a`.
- CI run: [42363093952](https://github.com/thembaxx/citylit/actions/runs/42363093952), run number 1112, completed 2026-11-07.
- Dependency installation and lockfile supply-chain policy both passed. Installed versions included Node 24.22.2, pnpm 12.10.1, Three.js 0.187.0, and Oxfmt 0.75.0.
- `pnpm format:check` failed because Oxfmt reported formatting differences in exactly `components/StageModel.tsx`, `lib/procedural-landmarks.js`, and `scripts/audit-procedural-models.mjs`. Its output explicitly instructs running Oxfmt without `--check` to apply the canonical formatting.
- The formatter failure caused the following checks to be skipped: data audit, procedural model audit, lint, typecheck, monitor tests, Python checks, ingestion/image security regression tests, production build, browser build handoff, mobile WebKit, desktop Firefox, and genuine landmark screenshot shards.
- The separate Security workflow passed.
- CodeRabbit status is successful, but it does not replace skipped CI checks.
- No merge, production deployment, successful shader compilation, screenshot comparison, or real-device GPU measurement has been verified.

## Merge gate

Do not merge PR #113 until the three files have been formatted with the repository-pinned Oxfmt version, the full CI pipeline passes, and desktop/mobile visual and runtime checks have been reviewed. Do not weaken or bypass formatting checks to get the pipeline green.
