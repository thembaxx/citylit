# 006 — Slide to Confirm Velocity Handling

- **Status**: DONE
- **Commit**: a1c192f
- **Severity**: MEDIUM
- **Category**: Interruptibility & Physicality
- **Estimated scope**: 1 file (components/ui/SlideToConfirm.tsx)

## Problem

`handleDragEnd` evaluates drag completion using purely distance (`currentX >= maxDrag * 0.78`). A fast, intentional user flick across 60–70% of the slider fails to trigger confirmation because velocity is ignored.

```tsx
/* components/ui/SlideToConfirm.tsx:60-63 — current */
const handleDragEnd = () => {
  const currentX = dragX.get();
  if (currentX >= maxDrag * 0.78) {
```

## Target

Accept PanInfo in `handleDragEnd` (`(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo)`) and evaluate velocity:

```tsx
/* target */
const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
  const currentX = dragX.get();
  const isFlick = info.velocity.x > 350;
  if (currentX >= maxDrag * 0.7 || isFlick) {
```

## Repo conventions to follow

- Uses `PanInfo` from `motion/react`.

## Steps

1. Import `PanInfo` from `motion/react` in `components/ui/SlideToConfirm.tsx`.
2. Update `handleDragEnd` signature to `(_event: unknown, info: PanInfo)`.
3. Check `info.velocity.x > 350 || currentX >= maxDrag * 0.7`.

## Boundaries

- Keep rebound spring animations intact.

## Verification

- **Mechanical**: `pnpm run lint` and `pnpm run typecheck` pass.
- **Feel check**: Flick the slider quickly across half the track; it should complete smoothly.
- **Done when**: Flick gesture triggers confirmation.
