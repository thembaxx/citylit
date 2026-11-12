# 002 — View Transition Easing

- **Status**: DONE
- **Commit**: a1c192f
- **Severity**: HIGH
- **Category**: Easing & duration
- **Estimated scope**: 1 file (app/reference-redesign.css)

## Problem

`::view-transition-old(root)` uses `cubic-bezier(0.4, 0, 1, 1)` which is an `ease-in` curve. On page transitions, the outgoing page starts slowly, delaying dismissal and creating a sluggish feel.

```css
/* app/reference-redesign.css:10250 — current */
::view-transition-old(root) {
  animation: 160ms cubic-bezier(0.4, 0, 1, 1) both citylit-fade-out;
}
```

## Target

Outgoing view transitions must start fast (`ease-out`) to feel responsive. Use the newly defined `var(--ease-out)` token.

```css
/* target */
::view-transition-old(root) {
  animation: 160ms var(--ease-out, cubic-bezier(0.23, 1, 0.32, 1)) both citylit-fade-out;
}
```

## Repo conventions to follow

- Cross-page view transitions are defined in `app/reference-redesign.css` under `@view-transition`.

## Steps

1. In `app/reference-redesign.css`, replace `cubic-bezier(0.4, 0, 1, 1)` with `var(--ease-out, cubic-bezier(0.23, 1, 0.32, 1))`.

## Boundaries

- Do not alter `@keyframes citylit-fade-out` transform coordinates.
- Keep duration at 160ms.

## Verification

- **Mechanical**: `pnpm run lint` and `pnpm run build` pass.
- **Feel check**: In Chrome/Safari, click a navigation link and verify the old view clears immediately without initial sluggishness.
- **Done when**: `::view-transition-old(root)` animates with `var(--ease-out)`.
