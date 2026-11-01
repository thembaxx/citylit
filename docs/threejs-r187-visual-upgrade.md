# Three.js r187 — procedural CityLit detail pass

Reference: https://x.com/zavrenn/status/2116564845860360225 (original post and author replies, 31 October 2026).

The thread's practical method is reference-first, repeated small refinements. The reference is inspiration rather than source code or permission to copy another city. CityLit's South African landmark and venue metadata, provenance and illustrative model notices remain unchanged.

## What changed

- Pin Three.js and @types/three to r187, with matching pnpm lockfile dependency edges.
- Replace ball-shaped tree crowns with seeded, multi-colour instanced foliage. Each tree is deterministic, requires no textures or imported meshes, and has one foliage draw call regardless of leaf count.
- Apply the same tree builder to the explorer's groves, expanded landmarks and the ring's selected miniature street.
- Add detailed hand-built street facades, glazed divided windows, doors, roof trims, chimneys, street lamps, crossing marks, curbs and street furniture. The backdrop is deliberately generic and illustrative.
- Retain the existing demand-rendered Canvas, reduced-motion behaviour, device pixel ratio scaling, GLB/Draco stages, selection, accessibility and source-linked travel details. Compact foliage reduces vertex work on narrow screens.

## Manual QA before merging

1. Run \`pnpm install --frozen-lockfile\`, \`pnpm typecheck\`, \`pnpm lint\`, \`pnpm format:check\`, \`pnpm models:audit\` and \`pnpm build\`.
2. Verify landscape/portrait mobile and desktop WebGL rendering, selection, ring dragging, view snapshots, guide links, fallback with WebGL disabled, and browser console warnings.
3. Verify the main explorer's first three cities and the expanded landmarks have detailed tree crowns, and that the landmark ring renders its selected streetscape without hiding the featured GLB.
4. Compare 3D render time and memory on low-end mobile, check tab visibility recovery and reduced-motion mode; keep the existing DPR and performance fallback.
5. Confirm this scene remains labelled illustrative, not a factual model of a specific place.

No imported assets, paid shaders or additional runtime dependencies are needed.
