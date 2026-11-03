# Bo-Kaap entrance-depth study — visual QA, 3 November 2026

## Status

**Not accepted for merger.** New geometry was regenerated, Draco-decoded, audited and rendered successfully. However, the reference-quality goal is not met, and the rendered doors are less visually readable than the original façade joinery.

## Verified work

- Five narrow terrace shells now have Blender Exact Boolean doorway pockets and independent returns, inset timber, transom glass, threshold and brass detailing.
- The obsolete flat surface-mounted door objects were removed from the authoring pass.
- Both [initial reconstruction](https://github.com/thembaxx/citylit/actions/runs/41707021414) and [refined reconstruction](https://github.com/thembaxx/citylit/actions/runs/41708822931) passed Blender, decoded model audits, TypeScript, formatting, lint and production build.
- Each run captured the **real ready-state WebGL model** at **1440 × 900**, **390 × 844** and **320 × 720**, using the same camera and CityLit route. Download the attached screenshot artifacts from the linked workflows.
- Only `public/models/stage/bo-kaap.glb` and its entry in `manifest.json` were committed by the rebuild workflow; no other landmark GLBs were replaced.

## Visual comparison

Comparing the *original production model* from the first run with *revision 2* from the second run, the fractions of screenshot pixels differing by more than 15 levels in at least one RGB channel were:

| Viewport | Changed pixels |
| --- | ---: |
| 1440 × 900 | 0.615% |
| 390 × 844 | 0.190% |
| 320 × 720 | 0.163% |

These are footprint measurements, not perceptual-quality scores. The door openings and shading are changed, but the warm timber leaf is obscured by the deep jambs from the default three-quarter perspective. Some entrances read as pale blank recesses rather than richer architectural detail. This is a **visual regression** in the current composition, even though the new Boolean geometry is real.

## Reference constraints and next correction

Bo-Kaap houses vary across Cape Dutch and Cape Georgian/Victorian treatments. Real streetscapes feature flat roofs, moulded parapets, narrow stoeps, coloured limewash, sash windows and distinctive door joinery. Historic Cape Dutch examples can have joinery nearly flush with the exterior, rather than uniformly recessed. References:

- [Cape Town Tourism: Bo-Kaap](https://www.capetown.travel/bo-kaap/)
- [The Heritage Portal: History and Style of the Bo-Kaap](https://www.theheritageportal.co.za/article/history-and-style-bo-kaap)
- [Iziko: Bo-Kaap Museum](https://www.iziko.org.za/museums/bo-kaap-museum/)

A further geometry pass should distinguish shallow/flush and deeper entry styles, create more believable timber/glass contrast from the default camera, and introduce varied doorway rhythms rather than five identical slots. Next captures should include inspector close-ups, physically credible day/night response and 320px overlap checks. Preserve the current *production* model until these shots are demonstrably better. Full photoreal or measured site parity has not been achieved.
