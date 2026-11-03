# CityLit — site-informed architectural sculpt benchmark

This milestone replaces five *template* Blender stage objects with recognisable, bespoke topology. The resulting shapes are still original editorial interpretations and must not be presented as surveyed, photogrammetric, or architecturally exact replicas.

## Distinctive structures

| Model | Reference-informed architectural features | Scope |
| --- | --- | --- |
| Ponte City, Johannesburg | Hollow circular residential tower, concrete floor bands, outer/inner glazing grid and lift bank | True open shaft; non-branded roof band |
| Moses Mabhida Stadium, Durban | Open elliptical seating bowl, annular fabric canopy, signature Y-arch and radial cable net | Miniature engineering interpretation |
| Union Buildings, Pretoria | Two symmetric sandstone wings, curved centre colonnade, twin domed towers and stepped terraces | Broad arrangement, not surveyed proportions |
| Table Mountain, Cape Town | Irregular flat mesa, sandstone cliff tiers, cableway station, exposed rock strata | Terrain interpretation, not digital elevation model |
| Big Hole, Kimberley | Sloped terraced excavation, rough rock layers, recessed water surface and overlook fence | Artistic quarry relief, not a scaled mine plan |

## Reference links

- Ponte building operator: https://pontecity.co.za/ponte-city-apartments-about-ponte/
- Moses Mabhida stadium structural engineers: https://www.sbp.de/en/project/moses-mabhida-stadium/
- Union Buildings, South African Presidency: https://presidency.gov.za/union-buildings
- Table Mountain and Big Hole geometry: original art direction based on common scenic features; no geospatial survey or copied commercial mesh

These references are architectural **descriptions** only. The geometry and UV-mapped PBR materials are original/CC0. No third-party photos or copyrighted CAD models are embedded.

## Rendering and release

The five models still use the existing build flow (`pnpm models:build`) and stage GLB catalog, so no new runtime dependencies or external texture requests are introduced. The Draco pipeline retains all CC0 scanned maps and is expected to stay below the existing 2 MiB per-model / 22 MiB total bounds.

To validate: `pnpm models:audit && pnpm site-models:audit`. For real desktop/mobile screenshots run the existing `scripts/capture-stage-catalog.mjs` with `STAGE_FOCUS_IDS=ponte,stadium,union-buildings,table-mountain,hole`, using a running production build.

**Release gate:** a structural audit and clean build are necessary but insufficient. Inspect the ten real browser screenshots and avoid claiming reference-grade photorealism until the visuals warrant it. Perform mobile performance validation before changing quality defaults globally.

## Remaining model groups

The ten earlier PBR templates are being replaced on the separate `feat/sculpt-remaining-ten-stage-assets` branch by distinctive original meshes. Their source and geometry budget are documented in `docs/remaining-sculpt-assets.md`. The five priority models and independently authored McGregor Museum hero remain preserved. The new ten models are not production assets until regenerated, audited, visually reviewed and merged.
