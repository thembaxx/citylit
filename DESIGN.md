---
version: alpha
name: Citylit
description: Tactile 3D South Africa travel guide and interactive diorama atlas built around limestone daylight, obsidian night, forest sage, and amber accents.
colors:
  primary: "#ffb95f"
  on-primary: "#472a00"
  secondary: "#a78bfa"
  tertiary: "#5a8f69"
  background: "#121317"
  surface: "#1a1b20"
  on-surface: "#e3e2e7"
  on-surface-muted: "#ccc3d8"
  outline: "#4a4455"
  danger: "#9b2c1a"
typography:
  headline-display:
    fontFamily: Geist Serif
    fontSize: 36px
    fontWeight: 500
    lineHeight: 1.12
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist Serif
    fontSize: 24px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: -0.015em
  body-lg:
    fontFamily: Geist Sans
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0em
  body-md:
    fontFamily: Geist Sans
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0em
  label-md:
    fontFamily: Geist Sans
    fontSize: 13px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 0.01em
  mono:
    fontFamily: Geist Mono
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0.06em
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 36px
  touch-target: 44px
rounded:
  sm: 12px
  md: 18px
  lg: 22px
  full: 9999px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
    height: 44px
    padding: 12px
  card-surface:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: 16px
  callout-mdxcn:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface-muted}"
    rounded: "{rounded.sm}"
    padding: 16px
  badge-alert:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.full}"
    padding: 8px
---

# Citylit

## Overview

Citylit is a mobile-first South Africa destination guide, day planner, and interactive 3D atlas combining procedural Three.js landmarks, 14 regional GLSL/WebGPU/WebGL diorama basins, and a `@pixi/3d` PBR GLB stage. Every surface balances editorial clarity (verified source dates, pin confidence, CC BY-SA & geoBoundaries attribution) with tactile 3D inspection and local-first offline persistence.

## Colors

Night (Obsidian & Amber) is defined in frontmatter as the base dark palette matching `public/theme.css`. Both themes avoid harsh pure white/black glare (`#121317` obsidian slate vs `#f4efe6` warm limestone paper) while maintaining WCAG AA contrast across cards, inspector drawers, and WebGL/WebGPU overlays.

## Themes

Citylit switches via `:root[data-theme="day"]` and respects `prefers-color-scheme` on first paint before client hydration.

| Role | Night (default in frontmatter) | Day (`data-theme="day"`) | CSS Token |
| --- | --- | --- | --- |
| Background canvas | `#121317` | `#f4efe6` | `--bg` |
| Elevated surface | `#1a1b20` | `#fbf9f5` | `--surface` |
| Glass surface | `#1a1b20e8` | `#fbf9f5e8` | `--surface-glass` |
| Primary text | `#e3e2e7` | `#171920` | `--ink` |
| Muted text | `#ccc3d8` | `#525663` | `--muted` |
| Primary accent | `#ffb95f` | `#252834` | `--accent` |
| Accent ink | `#472a00` | `#ffffff` | `--accent-ink` |
| Hairline divider | `#4a4455` | `#d6d4cd` | `--line` |
| Atlas highlight | `#a78bfa` | `#7046c8` | `--citylit-purple` |
| Atmospheric sage | `#5a8f69` | `#5a8f69` | `--citylit-sage` |

## Typography

Headings use `Geist Serif` with tight display tracking (`-0.02em`), body copy uses `Geist Sans`, and tabular metadata, provenance timestamps, and `mdxcn` table/code chrome use `Geist Mono`. Editable controls (`input`, `select`, `textarea`, `[role="combobox"]`) enforce a single `16px` rule in `app/native-refinement.css` to prevent iOS auto-zoom without per-page overrides.

## Layout & Spacing

Mobile-first containers fit `320px` and `390px` viewports with zero horizontal overflow, dynamic `100dvh` height budgeting, safe-area inset bottom clearance (`env(safe-area-inset-bottom)` above the bottom dock), and a `44px` minimum interactive touch target across buttons, theme pills, and tabs. Hover effects are gated under `@media (hover: hover) and (pointer: fine)` to eliminate sticky hover states on touch screens.

## Elevation & Depth

Hierarchy relies on tonal surface stepping (`--bg` to `--surface`), subtle `1px` hairlines (`--line`), and frosted backdrop separation (`backdrop-filter: blur(18px)`) so inspector popovers and HUD controls remain crisp above 3D canvases. Interactive 3D dioramas use Three.js WebGPU/WebGL shaders, ACES tone mapping in `@pixi/3d`, and reduced-motion fallbacks (`prefers-reduced-motion` / `useReducedMotion`).

## Shapes

Controls and editorial frames use approachable squircle radii (`12px` for compact controls, pills, and `mdxcn` blocks; `18px–22px` for panels and spotlights) and full pill capsules (`9999px`) for primary stage actions. All UI iconography comes from `@phosphor-icons/react` (plus `/icons/ui.svg` Phosphor sprite in static HTML), paired only with Citylit's South Africa `KhweziMark` emblem.

## Components

- **Interactive primitives (`components/ui/`)**: EasyUI source-owned `AnimatedTabs`, `AnimatedPillGroup`, `SpotlightCard`, `ShimmerButton`, `MagneticButton`, `DropdownSelect`, `LiquidToggle`, `MagnifyingDock`, `LiquidTabs`, `SlideToConfirm`, and `DynamicIslandToast`.
- **Markdown-friendly reading (`components/ui/mdxcn/`)**: `MdxCallout`, `MdxSteps`, `MdxTimeline`, `MdxTable`, and `MdxCodeBlock` used in `/about`, `/privacy`, `LandmarkStory`, and `VenueDetailView`.
- **3D stages**: `DioramaExperience` unifies 14 regional terrain basins (`lib/diorama/`), procedural Three.js city landmarks (`LandmarkRing` + `ProceduralStageModel` using `lib/procedural-landmarks.js`), and the `@pixi/3d` glTF/Draco stage (`Pixi3DStage`).

## Do's and Don'ts

- Do keep verified check dates, source attribution, pin accuracy labels, and real catalog data — never invent ratings or placeholder counts.
- Do use `@phosphor-icons/react` exclusively for UI icons and reserve custom SVG paths for Citylit's `KhweziMark` brand mark.
- Don't override `16px` editable control sizing outside `app/native-refinement.css`.
- Don't import `.glb` / `GLTFLoader` inside procedural Three.js files (`MuseumHeroAsset`, `StageModel`, `LandmarkRing`, `SafeStageModel`, `ProceduralStageModel`); keep glTF/Draco asset loading isolated in `Pixi3DStage` under `/draco/`.
- Don't bypass `44px` minimum touch targets or `prefers-reduced-motion` guards on animated beams, camera tours, and auto-rotation.
