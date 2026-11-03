# CityLit mobile WebGL rendering fidelity

The production renderer was previously locked to `dpr = 1` whenever the
viewport was narrow or used coarse touch input. That preserved GPU headroom
but softened thin mullions, glazing edges and detailed silhouettes on phones.

This isolated change raises the upper cap from 1× to 1.5× on low-power
screens, and from 1.5× to 2× elsewhere. React Three Fiber clamps to
`window.devicePixelRatio`, so ordinary 1× desktop monitors remain unchanged.
Low-power antialiasing, shadows, motion preferences, lazy GLB loading,
shared canvas and existing fallbacks stay the same.

**Tradeoff:** At the upper cap the mobile framebuffer has 2.25 times the
pixels of the previous 1× buffer. This may cost GPU time, memory or battery
on older handsets. Playwright SwiftShader confirms functional rendering,
not genuine mobile GPU performance. The change is **draft** until
high-density device screenshots and at least one representative phone
frame-time/memory comparison are reviewed. Revert the cap if regression
outweighs the increased sharpness; do not claim that display resolution
alone makes the geometry photorealistic.
