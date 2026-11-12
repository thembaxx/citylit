# 008 — Dynamic Island Toast Physical Scale

- **Status**: DONE
- **Commit**: a1c192f
- **Severity**: MEDIUM
- **Category**: Physicality & origin
- **Estimated scope**: 1 file (components/ui/DynamicIslandToast.tsx)

## Problem

Initial `scale: 0.88` causes an exaggerated 12% scale distortion for a top HUD toast pill.

```tsx
/* components/ui/DynamicIslandToast.tsx:48 — current */
initial={
  reduced ? { opacity: 0 } : { opacity: 0, y: -24, scale: 0.88, filter: "blur(8px)" }
}
```

## Target

Adjust initial scale to `0.96` and `y: -14` so the island pill settles physically from the top notch rather than ballooning up.

```tsx
/* target */
initial={
  reduced ? { opacity: 0 } : { opacity: 0, y: -14, scale: 0.96, filter: "blur(4px)" }
}
```

## Repo conventions to follow

- Toast component in `components/ui/DynamicIslandToast.tsx`.

## Steps

1. In `components/ui/DynamicIslandToast.tsx`, change initial `scale: 0.88` to `scale: 0.96` and `y: -24` to `y: -14`.
2. Change exit `scale: 0.92` to `scale: 0.97` and `y: -16` to `y: -10`.

## Boundaries

- Keep spring transition parameters (`stiffness: 420, damping: 26, mass: 0.8`).

## Verification

- **Mechanical**: `pnpm run lint` and `pnpm run typecheck` pass.
- **Feel check**: Trigger toast; it slides down subtly with natural mass without cartoonish expansion.
- **Done when**: Initial scale is 0.96.
