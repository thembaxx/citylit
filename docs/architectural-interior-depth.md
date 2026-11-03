# CityLit — architectural window and interior depth

Visual target: the user-supplied architectural app render, particularly true
window reveal depth, layered glazing, detailed room volumes and light response.

This milestone is **an authored, non-surveyed architectural study** of the
existing three models. Named exterior shell meshes are used so Boolean cuts
do not depend on fragile object order. The new file
`scripts/recessed-architecture.py` cuts partial-depth masonry apertures
using the Blender Exact Boolean solver, inserts independent room backings,
reveals, floor plates and small interior objects. The existing glazing and
mullions remain separate surfaces; Three.js uses transparent physically-based
optics only on the named architectural glass material.

Affected examples: five Bo-Kaap façades, seven City Hall windows and five
Constitution Hill wing windows. Other eleven model classes and the existing
heritage museum hero are not remodeled in this milestone.

The full 15-GLB authoring script always regenerates the catalog when the
recess pass is updated; never count an edited Python source as a shipped GLB.
Verify the actual decoded GLBs, full production build, 1440×900 and 390×844
screenshots that report `data-active-model-status="ready"`, and mobile
memory/FPS before release. New geometry may be stylized and does not claim
survey-grade site fidelity. Texture files remain locally embedded CC0 scans.

## Independent validation

```bash
pnpm models:build
pnpm models:audit
node scripts/audit-recessed-architecture.mjs
pnpm format:check && pnpm lint && pnpm typecheck && pnpm build
STAGE_FOCUS_IDS=bo-kaap,tower,dome node scripts/capture-stage-catalog.mjs
```
