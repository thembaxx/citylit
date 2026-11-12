# 001 — Motion Easing Tokens

- **Status**: DONE
- **Commit**: a1c192f
- **Severity**: LOW
- **Category**: Cohesion & tokens
- **Estimated scope**: 2 files (app/native-refinement.css, app/reference-redesign.css)

## Problem

Curves and durations are not centralized in shared CSS custom properties. Over 25 hand-typed `cubic-bezier(...)` strings are scattered across stylesheets without standardization, leading to visual drift and maintenance overhead.

```css
/* app/reference-redesign.css:10255 — current */
::view-transition-new(root) {
  animation: 240ms cubic-bezier(0, 0, 0.2, 1) 40ms both citylit-fade-in;
}
```

## Target

Introduce standard design tokens in `:root` inside `app/native-refinement.css` adhering to Emil Kowalski's animation playbook:

```css
/* target in app/native-refinement.css */
:root {
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
  --ease-snappy: cubic-bezier(0.16, 1, 0.3, 1);
}
```

## Repo conventions to follow

- Global tokens and baseline CSS refinements are placed in `app/native-refinement.css` under `:root`.
- High-level styling and components use these variables via `var(--ease-out)`, etc.

## Steps

1. In `app/native-refinement.css`, add the `--ease-out`, `--ease-in-out`, `--ease-drawer`, and `--ease-snappy` custom properties to `:root`.
2. Reference these tokens in existing transitions that currently use hardcoded cubic-bezier strings.

## Boundaries

- Do not modify font-size or spacing tokens.
- Do not introduce external animation libraries.

## Verification

- **Mechanical**: `pnpm run lint` and `pnpm run build` pass.
- **Feel check**: Confirm easing on tabs and view transitions feels responsive and cohesive.
- **Done when**: All standard easings are driven by tokens without CSS errors.
