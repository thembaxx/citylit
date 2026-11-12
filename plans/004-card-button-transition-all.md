# 004 — Card and Button Transition All Cleanup

- **Status**: DONE
- **Commit**: a1c192f
- **Severity**: HIGH
- **Category**: Performance
- **Estimated scope**: 2 files (components/ui/ShimmerButton.tsx, components/ui/SpotlightCard.tsx)

## Problem

`ShimmerButton` and `SpotlightCard` use Tailwind's `transition-all duration-200` and `transition-all duration-300`, causing continuous reflows during mouse movement and state changes.

```tsx
/* components/ui/ShimmerButton.tsx:46 — current */
className={`shimmer-button relative inline-flex ... transition-all duration-200 ...`}

/* components/ui/SpotlightCard.tsx:43 — current */
className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${className}`}
```

## Target

Replace `transition-all` with targeted transitions:
- `ShimmerButton`: `transition-colors transition-shadow duration-200`
- `SpotlightCard`: `transition-colors duration-300`

## Repo conventions to follow

- Components in `components/ui/` use Tailwind CSS classes and `motion/react`.

## Steps

1. In `components/ui/ShimmerButton.tsx`, replace `transition-all duration-200` with `transition-[box-shadow,background-color,border-color] duration-200`.
2. In `components/ui/SpotlightCard.tsx`, replace `transition-all duration-300` with `transition-[border-color,background-color] duration-300`.

## Boundaries

- Do not alter Framer Motion `whileHover` or `whileTap` props.

## Verification

- **Mechanical**: `pnpm run lint` and `pnpm run typecheck` pass.
- **Feel check**: Hover over Spotlight cards; ensure smooth hover without frame drops.
- **Done when**: `transition-all` is removed from both components.
