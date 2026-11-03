# CityLit — architectural display-base pass

The supplied Iconly skyline illustration is a reference for the premium
architectural presentation, not a design or 3D model to reproduce.

The previous orange/gold rings under every landmark distracted from the
architecture and made it read like toy miniatures. Blender now builds a
neutral, bevelled porcelain exhibition slab for the twelve architectural
model classes. Table Mountain, the Big Hole and Durban Botanic Gardens retain
organic circular terrain bases without the amber accent ring.

**Rebuilt source and real rendered evidence**
- Full all-fifteen Blender regeneration and GLB decode audit, format, lint,
  TypeScript, production build and selected desktop/mobile capture:
  https://github.com/thembaxx/citylit/actions/runs/41684796069
- Artifact `citylit-porcelain-architectural-plinths` contains 12 browser
  screenshots (6 models at 1440×900 and 390×844; active GLB status ready)
- Base-type assertions are in `scripts/audit-site-informed-models.mjs`.
- This builds on #62's actual cutout glazing/interior study, without
  rewriting those models or the McGregor Museum hero.

**Visual verdict:** The neutral slabs clearly avoid the artificial gold
ring and present the objects more like physical architectural exhibitions.
However the buildings are still stylized and simplified. This is *not*
equivalent to photorealistic architecture with ray-traced glazing,
bespoke vegetation or measured architectural proportions. Mobile GPU
budgets also need live-device profiling before any dramatic further
geometry expansion.
