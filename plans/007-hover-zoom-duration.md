# 007 — Thumbnail Hover Zoom Duration

- **Status**: DONE
- **Commit**: a1c192f
- **Severity**: MEDIUM
- **Category**: Easing & duration
- **Estimated scope**: 1 file (app/reference-redesign.css)

## Problem

Card thumbnail zoom on hover runs for 480ms, well above the 300ms UI budget for frequently seen hover states.

```css
/* app/reference-redesign.css:9506-9508 — current */
.citylit-popular-thumb img,
.citylit-featured-media img {
  transition: transform 480ms cubic-bezier(0.22, 1, 0.36, 1);
}
```

## Target

Shorten duration to 240ms with `var(--ease-out)` for a responsive, crisp zoom.

```css
/* target */
.citylit-popular-thumb img,
.citylit-featured-media img {
  transition: transform 240ms var(--ease-out, cubic-bezier(0.23, 1, 0.32, 1));
}
```

## Repo conventions to follow

- Hover styles in `app/reference-redesign.css`.

## Steps

1. In `app/reference-redesign.css`, change `480ms cubic-bezier(0.22, 1, 0.36, 1)` to `240ms var(--ease-out, cubic-bezier(0.23, 1, 0.32, 1))`.

## Boundaries

- Do not alter `scale(1.05)` or hover triggers.

## Verification

- **Mechanical**: `pnpm run lint` and `pnpm run build` pass.
- **Feel check**: Hover over featured cards; zoom starts instantly and settles crisply.
- **Done when**: Transition duration is 240ms.
