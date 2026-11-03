# Ponte City — authored architectural detail pass

The actual CityLit Pretoria and Johannesburg production screenshots show how
Ponte's cylindrical window wall reads as a flat, evenly tinted tube at the
default isometric camera angle. This pass targets geometry and optical variation
rather than arbitrary file-size changes.

- Keep the physically modelled **hollow atrium**; never fill the center.
- Vary apartment glazing gently between cool skylight reflection, shaded
  panes and rare warmer windows (three real GLB materials, no runtime decals).
- Add projected floor-slab edges to the cylindrical façade.
- Build inner-courtyard floor galleries and fine physical handrails for
  depth and parallax from the overhead camera.
- Add restrained continuous structural mullions and rooftop service units.

The landmark remains an original editorial interpretation, not a point-cloud,
survey, CAD reconstruction or copyrighted photographic copy. Blender output
must be regenerated, decoded and compared in actual **ready-state WebGL**
screenshots at 1440 × 900 and 390 × 844 before release. Other fourteen
landmark designs and CityLit's UI are unchanged.

## Final evidence and limitation

The Blender regeneration and structural/Draco/PBR audits passed in the
[one-shot workflow](https://github.com/thembaxx/citylit/actions/runs/41688776201),
along with format, lint, TypeScript and production build. The generated
assets were committed as `5ccd490`. Actual desktop (1440 × 900) and
mobile (390 × 844) ready-state Ponte City screenshots are in the GitHub
artifact `citylit-ponte-facade-depth-desktop-mobile`.

The front grid has more material variation and physically projecting slab
bands, the rooftop has more assembly detail, and the hollow courtyard is
preserved. On mobile the model still occupies a relatively small part of
the scene; raising visual prominence requires separate collision-tested
camera/scale work. This is **not yet photoreal reference parity**.
No changes were made to the other fourteen authored landmark classes.
