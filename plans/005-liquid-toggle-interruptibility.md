# 005 — Liquid Toggle Interruptibility

- **Status**: DONE
- **Commit**: a1c192f
- **Severity**: MEDIUM
- **Category**: Interruptibility
- **Estimated scope**: 1 file (components/ui/LiquidToggle.tsx)

## Problem

The toggle thumb applies fixed 360ms tweens for `scaleX` and `scaleY`. When clicked rapidly or reversed, the tween restarts or delays settling, feeling rubbery and laggy.

```tsx
/* components/ui/LiquidToggle.tsx:64-75 — current */
scaleX: {
  type: "tween",
  duration: 0.36,
  times: [0, 0.35, 0.7, 1],
  ease: "easeInOut",
},
scaleY: {
  type: "tween",
  duration: 0.36,
  times: [0, 0.35, 0.7, 1],
  ease: "easeInOut",
}
```

## Target

Replace the 360ms tween with a snappy, interruptible 180ms ease-out squish or pure spring scaling.

```tsx
/* target */
scaleX: {
  type: "tween",
  duration: 0.18,
  times: [0, 0.4, 1],
  ease: [0.23, 1, 0.32, 1],
},
scaleY: {
  type: "tween",
  duration: 0.18,
  times: [0, 0.4, 1],
  ease: [0.23, 1, 0.32, 1],
}
```

## Repo conventions to follow

- `components/ui/LiquidToggle.tsx` uses `motion/react` with `useReducedMotion()`.

## Steps

1. Update `scaleX` and `scaleY` transitions to `duration: 0.18` and `ease: [0.23, 1, 0.32, 1]` with `times: [0, 0.4, 1]`.

## Boundaries

- Keep track spring intact (`stiffness: 520, damping: 26`).

## Verification

- **Mechanical**: `pnpm run lint` and `pnpm run typecheck` pass.
- **Feel check**: Click the toggle rapidly multiple times; thumb should snap cleanly without lagging behind clicks.
- **Done when**: Toggle transitions in under 200ms without lag.
