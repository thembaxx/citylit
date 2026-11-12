# 003 — GPU Accelerated Transition Properties

- **Status**: DONE
- **Commit**: a1c192f
- **Severity**: HIGH
- **Category**: Performance
- **Estimated scope**: 1 file (app/reference-redesign.css)

## Problem

`transition: all` is used on multiple interactive controls, including tabs, weather pills, and buttons. This causes unnecessary style recalcs and layout recalculations for non-composited properties.

```css
/* app/reference-redesign.css:3552 — current */
.weather-audio-btn {
  transition: all 0.15s ease;
}
```

## Target

Explicitly enumerate only the properties that change (`transform`, `opacity`, `background-color`, `border-color`, `box-shadow`) and avoid `all`.

```css
/* target */
.weather-audio-btn {
  transition: transform 160ms var(--ease-out), opacity 160ms var(--ease-out), background-color 160ms ease, border-color 160ms ease;
}
```

## Repo conventions to follow

- Hover and interactive button transitions in `app/reference-redesign.css`.

## Steps

1. Find all 13 occurrences of `transition: all` in `app/reference-redesign.css`.
2. Replace each with targeted property transitions.

## Boundaries

- Do not change visual layout, paddings, or dimensions.

## Verification

- **Mechanical**: `pnpm run lint` and `pnpm run build` pass.
- **Feel check**: Hover over weather pills and tabs; confirm 60fps compositor transitions without jitter.
- **Done when**: No `transition: all` rules remain on interactive UI elements in `app/reference-redesign.css`.
