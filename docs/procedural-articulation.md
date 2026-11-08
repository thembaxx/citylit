# Procedural landmark articulation and review

CityLit's landmarks stay original, deterministic Three.js geometry. There is no
Blender step, no GLB download and no runtime physics engine. This document
describes the layers added on top of `lib/procedural-landmarks.js`: declarative
specs, inspectable joints, a craft/LOD pass, a Node-side physics review and a
scorecard.

## 1. Declarative specs

`lib/landmark-specs.js` is the shared source of truth for:

- human-readable label, kind and material family;
- approximate published dimensions (`real.width/height/depth`) used only for
  scale comparison and mass estimates;
- provenance text shown in reviews, not presented as a survey;
- articulated joints, their targets, axes, ranges and damping.

Named specs cover Table Mountain, Moses Mabhida Stadium, Union Buildings,
Nelson Mandela Bridge, The Big Hole, Ponte City, the lighthouse archetype, the
civic tower archetype and the Voortrekker Monument. `bridge` resolves to the
`nelson-mandela-bridge` spec through a small alias table.

Dimensions and provenance are descriptive metadata. Models remain illustrative
studies, never geospatial or structural reconstructions.

## 2. Joint rig

`lib/landmark-rig.js` attaches joints to the group returned by
`createProceduralLandmark`. Three joint types are supported:

| Type | Behaviour | Example |
| --- | --- | --- |
| `revolute` | angle from `range[0]` to `range[1]` around a parent-space axis | clock hands, headframe sheave, lantern beam |
| `prismatic` | linear travel along an axis | Union wings, roof lift, atrium lift |
| `path` | position along a line or Catmull-Rom path | cable cars, mine skip |

Runtime semantics:

- Absent joint value: the builder's authored animation keeps running.
- `setLandmarkJoint(root, id, 0..1)`: the rig overrides the authored transform
  and eases toward the value with `THREE.MathUtils.damp`.
- `clearLandmarkJoint` / `clearLandmarkJoints`: restores the captured rest
  transform, then the authored animation resumes on the next builder tick.
- `updateLandmarkRig(root, delta)` runs after the builder tick. Delta is clamped
  to 100 ms so a background tab cannot jump a joint.
- Reduced-motion mode applies values immediately with `applyLandmarkRig`
  instead of waiting for a frame loop.

Revolute rotation is applied in the parent frame (`R_axis * R_rest`) so a beam
with an authored 90° roll still sweeps around world up.

## 3. Craft pass

`lib/landmark-craft.js` adds inexpensive visual quality:

- **Chamfers**: qualifying `BoxGeometry` meshes are replaced by
  `RoundedBoxGeometry` with the same dimensions. Trim thinner than 0.09 units is
  left crisp to protect draw budgets and avoid shimmer.
- **Human-scale cues**: derived from the spec's real width, a few 1.8 m figures
  and a 4.4 m car are placed near the front of models whose scale makes them
  visible. Cue geometry and materials are shared across model instances and
  skipped by disposal.
- **Named parts**: builders name important components so the inspector,
  physics review and scorecard can refer to them.
- **LOD tag**: high-count instanced batches (friezes, windows, balconies,
  foliage) are tagged `userData.lodMin`. Tier 0 (`saver`) hides them; tiers 1
  and 2 show them.

## 4. Level of detail

`applyLandmarkLod(root, tier)` maps the renderer tier to detail:

| Tier | Name | Behaviour |
| --- | --- | --- |
| 0 | saver | hide instanced detail with `lodMin = 1` |
| 1 | balanced | show instanced detail |
| 2 | detail | show everything |

`ProceduralStageModel` applies the tier on mount from
`window.__citylitRendererDiagnostics`, and `display.userData.tick` re-applies it
when telemetry changes the tier. Objects without `lodMin` stay visible at every
tier.

## 5. Physics review

`lib/landmark-physics.js` runs only in Node and CI. It does not ship to the
browser.

For each assembled model it reports:

- mesh count, draw calls, triangles, materials, textures;
- bounding-volume volume, mass and centre of mass, converted with the spec's
  real width;
- support footprint (convex hull of low geometry) and whether the centre of
  mass is inside it;
- per-joint travel in model units and metres;
- collisions at rest and **new collisions at joint extremes** (0 and 1).

Collision handling deliberately avoids known false positives:

- each mesh is an OBB shrunk to 96%;
- broad phase uses bounding-sphere distance before `OBB.intersectsOBB`;
- open shells (`LatheGeometry`, open cylinder, partial sphere, torus, ring,
  plane) are skipped because their bounding box covers hollow space;
- moving target ↔ moving target pairs are skipped, since independent sliders can
  park two cable cars at the same station;
- only pairs absent at rest are reported for extremes.

The mass figure is a **bounding-volume estimate** with a 0.42 fill factor, not a
structural calculation. It is useful for order-of-magnitude comparison and for
catching accidental unit errors, not for engineering claims.

## 6. Scorecard

`scripts/model-scorecard.mjs` scores each model out of 100 across five axes:

| Axis | Points | Signals |
| --- | ---: | --- |
| Craft | 25 | chamfers, scale cues, named parts, material differentiation |
| Geometry | 25 | triangle and draw-call budgets, instanced detail |
| Materials | 15 | texture budget, PBR surfaces, night lighting |
| Physics | 20 | stable support, joint clearances, support margin |
| Articulation | 15 | named spec, attached joints, positive travel |

The latest report lives in
[`procedural-model-scorecard.md`](./procedural-model-scorecard.md), with the
full JSON beside it. Scores are comparative design signals, not fidelity claims.

## 7. Inspector controls

The 3D inspector gains a **Mechanisms** section for models with declared joints.
Each joint starts in **Auto**, which leaves the authored animation alone. The
toggle switches to **Manual** and reveals a slider; **Restore** in the
Mechanisms header (announced as "Restore authored motion") clears every
override. Keeping Restore in the header means it stays visible in the 340 px
mobile popover instead of scrolling below the joint list. Controls are keyboard
accessible, announce state through `aria-pressed`, and reset when the selected
landmark changes or the inspection is reset.

## 8. Adding a landmark

1. Add metadata and joints to `lib/landmark-specs.js`.
2. Build the geometry in `lib/procedural-landmarks.js` and name every joint
   target (and other meaningful parts).
3. Add a named builder to `BUILT` and `RIG_KEYS` if the place needs bespoke
   geometry; otherwise use a generic archetype.
4. Add a case to `scripts/landmark-cases.mjs` and, if the place has a distinct
   route, map it in `lib/stage-models.ts`.
5. Run `pnpm models:review`, adjust paths or clearances, then
   `pnpm models:score -- --write`.
6. Run `pnpm format`, `pnpm lint`, `pnpm typecheck`, `pnpm test:monitor` and
   `pnpm build`.

## 9. Verification

```bash
pnpm models:audit     # structural guardrails
pnpm models:review    # stability, mass and joint-extreme collisions
pnpm models:score     # five-axis scorecard
pnpm test:monitor     # rig, physics and production checks
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

`models:review -- --strict` exits non-zero when a model is unstable or a joint
introduces a new collision. `models:score -- --strict` exits non-zero when a
model falls below 70% or a spec lacks a review case.
