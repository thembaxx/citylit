# PR #96 — CityLit 3D production QA and adaptive renderer

## Starting point: PR #93 release / incident

- Production merge `0eae9bb2842574cd1c9028ed09bf52720ff42281` is **READY** on Vercel.
- Prior GitHub run: https://github.com/thembaxx/citylit/actions/runs/42016210512
- Quality/build, security, desktop Firefox and mobile WebKit passed.
- Chromium desktop shard 1 and mobile shard 1 **failed**. The log showed
  `Make Khwezi hop` was visible but unclickable: `.glow-map` and the
  `.atlas-map-backdrop` subtree intercepted pointer events. Another
  interaction test expected transient feedback after the click.
- Chromium desktop shard 2 passed. At initial PR #94 investigation, the
  second mobile shard was still executing; do not describe it as passed.
- PR #93 already produced a genuine desktop screenshot artifact:
  https://github.com/thembaxx/citylit/actions/runs/42016210512/artifacts/13409932314

**Resolution under review:** elevate the guide hero/card hit target above the
interactive map backdrop without disabling the map itself; add an actual
`document.elementFromPoint()` pointer-hit regression. Keep the inspector in
the browser's popover top layer with adequate hit targets.

## Renderer telemetry (not a synthetic benchmark)

`RendererTelemetry` is mounted once inside the shared R3F `Canvas`, not in
each `View`. It exposes read-only diagnostics on
`window.__citylitRendererDiagnostics` and CSS data attributes on
`.canvas-root`. Open the developer console:

```js
window.__citylitRendererDiagnostics
// { tier, dpr, fps, frameMs, drawCalls, triangles, points,
//   geometries, textures, context, gpuMs }
```

- **Actual WebGL rendering counters:** `gl.info.render.calls`,
  `gl.info.render.triangles`, `gl.info.render.points`, plus
  `gl.info.memory.geometries/textures`. These are renderer counters rather
  than a hardware GPU execution-time benchmark.
- **Measured frame cadence:** accumulated `performance.now()` between
  actively rendered frames, sampled in windows of 70 frames. Idle gaps,
  hidden tabs and extremely short gaps are excluded. As the app uses
  `frameloop="demand"`, samples may be missing while static; that is
  intentional, not a zero-FPS failure.
- **Real GPU milliseconds:** `gpuMs: null`. Do not claim to measure GPU
  execution time without `EXT_disjoint_timer_query_webgl2` support.
- **Quality tiers:** `detail` 2 DPR, `balanced` 1.5 DPR,
  `saver` 1 DPR, capped by the real device pixel ratio. Coarse/mobile
  devices start balanced; connection Save-Data stays on saver.
- Two sustained slow sampling windows trigger a one-step downshift; four
  smooth windows trigger a one-step upshift (up to device policy).
  The algorithm does not change resolution based on isolated input delays or
  an intentionally idle scene.
- WebGL context lost/restored events update `data-webgl-status` and present
  a non-blocking status notice. The 3D scene must recover without trapping
  HTML navigation.

The existing static budgets in `lib/landmark-budget.js` remain in place,
with limits for geometry allocation, texture allocation, draw count and
instanced triangle count. These are not substitutes for real-device FPS
testing or GPU profiler captures.

## Screenshot and architectural comparison gate

The CI `visuals` matrix reuses the *exact built Next.js artifact* from
quality. It opens the actual five landmark scenes in desktop Chromium and
mobile Chromium, checks that they render, selects each model and saves real
viewport/canvas screenshots in the `real-landmark-screenshots-*` artifacts.
No AI-generated replacement scenes, no CSS-only illustrations and no mockups.

Compare a matching view angle and visible features against:

| City / model | Grounded visual reference | Required visual checklist |
| --- | --- | --- |
| Cape Town — Table Mountain | [SANParks Table Mountain](https://www.sanparks.org/parks/table-mountain) | Broad level summit, cliff strata, Devil's Peak and Lion's Head separated, no floating vegetation |
| Durban — Moses Mabhida Stadium | [sbp structural photographs](https://www.sbp.de/en/project/moses-mabhida-stadium/), [MakMax roof](https://www.makmax.com.au/project/moses-mabhida-stadium-roof/) | Oval bowl, steel arch and visible cable geometry, 208-panel white PTFE canopy |
| Johannesburg — Ponte City | [Ponte City official](https://pontecity.co.za/ponte-city-apartments-about-ponte/) | Round 54-level facade, hollow central lightwell, consistent glazing |
| Pretoria — Union Buildings | [The Presidency](https://www.thepresidency.gov.za/union-buildings) | Long sandstone wings, symmetrical towers, central semicircular terrace, reddish roof line |
| Kimberley — The Big Hole | [Official visitor site](https://thebighole.com/) | Asymmetric strata and rim, deep steep rock walls, dark turquoise water below, viewing platform |

Photo-to-screenshot pixel matching is **not** a valid accuracy metric: camera,
season, lighting, source crop and scale differ. Review recognizable geometry,
real model proportions, materials, hit targets and mobile legibility.

## Release checklist

- [ ] New quality, typechecking, formatting, security and production build are green
- [ ] Full Chromium browser shards, Firefox and WebKit are green
- [ ] Dedicated real mobile and desktop screenshot jobs succeeded with five images each
- [ ] Inspect and camera buttons pass pointer hit testing at 320/390 px
- [ ] Mobile landscape, safe areas, PWA fullscreen and canvas stacking remain functional
- [ ] Runtime metrics are finite and context recovers; FPS claims tested on physical hardware
- [ ] Artifacts visually reviewed against genuine reference images before merge

**Do not auto-merge PR #94** while checks are missing, failed, or visuals are
not available to review. An Action marked green is necessary but does not
prove that the models are photorealistic or that physical device battery use
has been benchmarked.
