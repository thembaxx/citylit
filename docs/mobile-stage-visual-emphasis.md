# CityLit mobile landmark visual prominence

The real 390 × 844 GLB screenshot for Ponte City showed that even detailed
architecture was too small for visitors to read fine window and rooftop
geometry. The extra-zoomed camera attempt in an earlier PR cropped major
landmarks; this pass leaves camera overview presets, FOV and desktop design
unchanged.

Instead, apply a restrained selected-landmark scale increase on mobile:
`0.90 → 1.04` at 360–759px viewport widths, or `0.90 → 0.96` on
narrower phones. Lift the portrait gallery scene group by 0.12 world units
to preserve a buffer above the landmark selector chips.

McGregor Museum keeps its existing special-case scale, and inactive
neighbour models, desktop scale, camera tools, interactions and reduced-motion
behavior remain untouched. The next gate is actual ready-state desktop and
mobile WebGL captures for tall, wide and compact models and a 320px layout
check. Do not merge if chips, stage sheet or inspector collide with geometry.

## 320px browser QA and header refinement

The first responsive capture passed the ready-state model test for six model classes
at 1440px, 390px and 320px, with no observed cropped 3D geometry. It exposed
a pre-existing 320px navigation defect: the `My day` text was hidden by a
font-size-zero media rule *and* its BookmarkSimple icon was hidden by an older
480px rule, leaving an apparently blank button. The 320px rule now restores
its existing accessible icon with an explicit 18px size. The top navigation
continues to use its standard 36px tap target; the visible icon is
not duplicated as decoration.

The initial browser interaction run did not reach tests because the standalone
capture server was already running on port 3000 while Playwright expected to
create another one. The validation workflow now explicitly reuses the existing
test server and asserts the narrow-width saved-day icon and stage navigation.

At 320px the landmark chip row is kept below the stage models so the
broadest bases do not overlap controls; a small amount of white space is
intentional. Further reductions in this clearance require model-specific
bounds checks, not arbitrary negative margins.
