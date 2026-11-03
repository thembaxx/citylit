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
