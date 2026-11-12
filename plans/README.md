# Citylit Animation Improvement Plans

Distilled from Emil Kowalski's animation philosophy and codebase motion audit.

## Execution Order & Status

| Plan | Title | Severity | Category | Status | Dependencies |
|---|---|---|---|---|---|
| [001](001-motion-easing-tokens.md) | Motion Easing Tokens | LOW | Cohesion & tokens | DONE | None |
| [002](002-view-transition-easing.md) | View Transition Easing | HIGH | Easing & duration | DONE | 001 |
| [003](003-gpu-transition-properties.md) | GPU Accelerated Transition Properties | HIGH | Performance | DONE | 001 |
| [004](004-card-button-transition-all.md) | Card and Button Transition All Cleanup | HIGH | Performance | DONE | None |
| [005](005-liquid-toggle-interruptibility.md) | Liquid Toggle Interruptibility | MEDIUM | Interruptibility | DONE | 001 |
| [006](006-slide-confirm-velocity.md) | Slide to Confirm Velocity Handling | MEDIUM | Interruptibility & Physicality | DONE | None |
| [007](007-hover-zoom-duration.md) | Thumbnail Hover Zoom Duration | MEDIUM | Easing & duration | DONE | 001 |
| [008](008-toast-physical-scale.md) | Dynamic Island Toast Physical Scale | MEDIUM | Physicality & origin | DONE | None |
