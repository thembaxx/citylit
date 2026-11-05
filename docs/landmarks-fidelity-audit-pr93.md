# PR #93 · Hero landmark visual-fidelity evidence

This change intentionally focuses on recognizable geometry, restrained PBR
surface variation, and low mobile draw-call overhead. It does **not** assert
photogrammetry, licensed photo texture provenance or survey-grade accuracy.

## Sources and visual comparison checklist

Reference images are linked, **not** embedded or redistributed. Inspect a
similar camera angle before judging proportions. Different viewpoints and
seasons make pixel-wise comparison with editorial photographs misleading.

| Landmark | First-party/reference sources | What a visually faithful silhouette should show | Baseline browser QA | Changes in #93 |
| --- | --- | --- | --- | --- |
| Table Mountain, Cape Town | [SANParks](https://www.sanparks.org/parks/table-mountain/what-to-do/attractions/table-mountain), [SANParks geology](https://www.sanparks.org/parks/table-mountain/explore/geology) | Horizontal sandstone summit, layered sheer face, separate Devil's Peak and Lion's Head, functioning cableway | Flat-topped form visible; stylized rocky surfaces and oversized generic trees | High-frequency sandstone bump/roughness study with UVs and PBR; preserve previous plateau/peak geometry |
| Moses Mabhida, Durban | [Structural engineer schlaich bergermann partner](https://www.sbp.de/en/project/moses-mabhida-stadium/), [roof contractor MakMax](https://www.makmax.com.au/project/moses-mabhida-stadium-roof/) | Oval bowl, Y-branching arch, white translucent roof with approximately 208 PTFE folded panels | Recognizable arch and white bowl, simplified roof and seats | Increase radial PTFE panel segments from 64 to 208; restrained membrane micro-surface finish |
| Ponte City, Johannesburg | [Ponte official building description](https://pontecity.co.za/ponte-city-apartments-about-ponte/) | 54-storey reinforced-concrete cylindrical tower with a roof-to-base open core and dense windows | Simplified cylinder and core; low-resolution floor bands | 54 facade rows and 1,944 GPU-instanced window panes, instanced concrete floor bands and roof accents |
| Union Buildings, Pretoria | [The Presidency](https://www.thepresidency.gov.za/union-buildings), [South African History Online](https://sahistory.org.za/place/union-buildings-pretoria) | Long sandstone wings, curved central amphitheatre, reddish tiled roofline, symmetric domed towers and terraced gardens | Wings, towers and columns recognizable, but flat-colored | Sandstone PBR, terracotta wing roofs, curved roof parapet and instanced garden parterres |
| Big Hole, Kimberley | [Big Hole official museum](https://thebighole.com/), [Northern Cape heritage register](https://register.nbkb.org.za/site/the-big-hole/) | Wide, irregular hand-excavated pit, stratified steep walls, turquoise water below, viewing platform | Circular pit and simple mine structures visible; muted, flat rock | More irregular eroded wall geometry, cliff PBR and dedicated brighter turquoise water shader |

### Actual-render baseline

On 5 November 2026 a real desktop browser visited the five CityLit production
landmark gallery views after PR #92. All five selected scenes rendered and the
selection buttons worked; no JavaScript page error was observed during that
session. The browser session captured screenshots (not mockups), viewable at:
https://agent.tinyfish.ai/runs/b68ce191-7755-4069-bdfa-e689f49fdeb0

The browser report noted a consistent stylized/low-poly appearance and generic
vegetation. It did **not** establish photographic likeness. The screenshots
were not stored in GitHub, so they are review evidence, not repository baselines.

### PR #93 after-change screenshot capture

On each pull request Chromium shard, Playwright opens the real Next.js
production build, selects the actual landmark by name, checks the model status,
and writes a PNG of `.atlas-ring-scene`. Files are uploaded as
`landmark-screenshots-<project>-<shard>-<attempt>` GitHub Actions artifacts.

The files themselves use `citylit-real-<city>-<landmark>.png`. The review
must compare the new screenshots against the above references, including
oblique, top-down, night and mobile framing where applicable. A human review is
still needed to evaluate aesthetics; source-photo pixel-diffs are inappropriate.

Capture manually:

```sh
CITYLIT_CAPTURE_VISUALS=1 pnpm exec playwright test tests/landmark-visual-capture.spec.ts --project=desktop-chromium
CITYLIT_CAPTURE_VISUALS=1 pnpm exec playwright test tests/landmark-visual-capture.spec.ts --project=mobile-chromium
```

## Mobile performance / compatibility gates

The deterministic `lib/landmark-budget.js` test counts visible or mounted
renderable meshes, GPU instances, triangles, geometry allocation, and unique
texture bytes. Current **static proxy budgets** per model:

| Metric | Limit |
| --- | ---: |
| Estimated draw calls | 450 |
| Instanced-adjusted triangle count | 850,000 |
| Geometry buffers | 12 MiB |
| Unique texture buffers | 850,000 bytes |

These numbers are **not** measured frame time. Before release on real devices,
verify WebGL context creation, DPR, 30 fps when animated, paused and reduced
motion, touch rotation, 1%/0% battery optimization when backgrounded, shader
compilation, context loss, and PWA full-screen navigation. Aim for 30 fps or
better on representative midrange Android hardware and do not accept major
overdraw, stalls, missing interaction affordances or crashes.

## Release decision

Green lint, typecheck, security, production build and Chromium/WebKit browser
checks are required. A visual screenshot attachment is necessary to review
material and geometric fidelity. **Do not merge** on an unverified art-quality
claim, unrelated browser failures, or optimistic performance projections.
