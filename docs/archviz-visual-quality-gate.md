# CityLit — architecture visual-quality benchmark

## Source and design direction

The quality target is the user-provided premium architectural app reference.
The Kimberley McGregor Museum is a *historic red-brick Victorian Sanatorium
building*, not the simple cream cottage used by CityLit previously. The updated
hero is an **original illustrative architectural study** of the real landmark,
not a surveyed or photogrammetric reconstruction.

Historical references for form only (not republished or included as textures):
- https://www.gov.za/news/media-statements/northern-cape-sport-arts-and-culture-calls-nomination-serve-mcgregor-museum
- https://artefacts.co.za/main/Buildings/bldgframes_mob.php?bldgid=12247
- https://www.tripadvisor.com.mx/Attraction_Review-g312643-d2513715-Reviews-McGregor_Museum-Kimberley_Northern_Cape.html

## What has been authored

- Blender builder: `scripts/build-museum-hero.py`
- Licensed texture retrieval: `scripts/fetch-museum-pbr.py`
- Draco compression: `scripts/compress-museum-hero.mjs`
- Independent audit: `scripts/audit-museum-hero.mjs`
- Runtime: `components/MuseumHeroAsset.tsx`, backed by the procedural scene
  as an offline/network failure fallback
- Production asset: `public/models/hero/mcgregor-museum.glb`
- 3.92 MB compressed asset, 12 embedded PBR images
- Named MuseumFacade, MuseumRoof, MuseumGlass and MuseumLandscape nodes
- Detailing: red-brick walls, pitched and seamed roofs, chimneys, double veranda,
  balcony spindles, white columns, dark divided windows, landscaping and plinth
- PMREM studio reflections, calibrated material colors, adaptive shadows, day/night,
  camera-aware model orientation and collapsible mobile controls

## PBR scans and rights

The Blender model is original. Four generic surface sets are downloaded
**at build time only** from ambientCG, licensed CC0 1.0:
`Bricks090`, `PavingStones128`, `Grass004`, `Wood096`.
Their Color, NormalGL and Roughness maps are resized to 768px and embedded
in the GLB so CityLit does not depend on a third-party material CDN at runtime.

Official licensing: https://docs.ambientcg.com/license/

No museum photograph or proprietary design from the inspiration is shipped
inside the app.

## Follow-up visual changes (recessed glazing and stage grounding)

- One Boolean operation now cuts actual window and entrance openings into the
  brick facade. Sashes, partially transparent glazing, shaded room backing and
  curtains sit within those openings rather than looking pasted to a flat wall.
- Landscaping replaces oversized spherical crowns and uniform hedge balls with
  articulated branches, smaller angled leaves and individual garden planting.
- A locally generated 128px gradient contact shadow anchors the 3D plinth,
  including on mobile devices where costly dynamic shadow maps are disabled.
- When McGregor Museum is selected, other ring models are hidden visually,
  keeping the museum as the focus; chips, swipe and other navigation remain.
- The latest WebGL screenshot run is
  https://github.com/thembaxx/citylit/actions/runs/41647180994
  (artifact: `heritage-final-grounding-comparison`, 1440×900 and 390×844,
  daylight and night).
- Asset regeneration was audited: the updated Draco GLB is **3,921,484 bytes**,
  with the same 12 embedded PBR images.

This is closer to the supplied architectural app reference, but the real
screenshots still show a stylized digital miniature. It is **not a completed
photorealistic reconstruction**. Do not merge without the owner's visual
approval and real-device mobile performance validation.

## QA and visual gate

The built asset passes Blender export, Draco decode, texture/node integrity and
budget checks. True desktop/mobile renders were captured at 1440×900 and
390×844 (day/night) by Playwright WebGL on CI.

Final centered-reference screenshot run:
https://github.com/thembaxx/citylit/actions/runs/41642418418
Artifact: `heritage-museum-new-model-desktop-mobile`

The model now reads as a distinct heritage building and is framed properly,
but still looks like an architectural miniature, **not photorealistic**.
Full reference quality would require further production modeling, realistic
interiors through the windows, detailed vegetation, ambient occlusion, and
visual tuning with measured frame times on real devices.

Do not treat technical pass/fail, a small GLB size, or a polished UI as proof of
reference-level visual fidelity. **PR remains draft; do not merge automatically
until visual acceptance.**

## Reproducible commands

```bash
pnpm hero:build   # requires Blender + Python Pillow and access to CC0 scans
pnpm hero:audit
pnpm models:audit
pnpm lint && pnpm typecheck && pnpm format:check && pnpm build
```

## Full-fidelity revision

The previous mobile-size and compressor caps were not visual-quality criteria. Fixed
8/12 MiB GLB caps have been removed for the hero to support more architectural
geometry and source-resolution scans. This does not by itself improve the
already-exported museum asset. Any future rebuilt hero must still be decoded,
visually inspected on desktop and mobile, and tested for actual GPU memory and
frame-time behavior. Asset size cannot substitute for physical material quality.
