---
name: web-design-guidelines
description: Review and audit UI code against Vercel's Web Interface Guidelines. Use when asked to "review UI", "check design", "audit interface", "design guidelines", "spacing system", or "clean up layout".
license: MIT
metadata:
  author: vercel-labs
  version: "1.0.0"
  source: https://skills.sh/vercel-labs/agent-skills/web-design-guidelines
---

# Web Interface & Design Guidelines

Guidelines derived from Vercel's Web Interface Guidelines for engineering clean, responsive, and robust user interfaces.

## 1. Layout & Spacing Rhythm

- **8pt Grid System**:
  - All margins, paddings, gaps, and heights should snap to multiples of 4px or 8px (e.g., 4, 8, 12, 16, 20, 24, 32, 48, 64px).
  - Avoid arbitrary margins (e.g., `margin-top: 7px; margin-bottom: 13px;`).
- **Fixed vs Dynamic Heights**:
  - Avoid fixed heights (`height: 70px; height: 180px;`) on content cards containing text. Use `min-height` with `height: auto` so text wrapping never causes vertical clipping.
- **Mobile Floating Bars & Docks**:
  - Any fixed bottom navigation dock or floating bar (`position: fixed; bottom: ...`) must have safe-area inset support: `padding-bottom: max(16px, env(safe-area-inset-bottom))`.
  - The main page container must reserve equivalent bottom clearance (e.g., `padding-bottom: 6rem;` / `pb-28`) so scrolling reaches the bottom without content being occluded.

## 2. Typography & Hierarchy

- **Single Semantic Font System**:
  - Headline font: Display / Serif (e.g. Fraunces, Georgia).
  - Body font: Clean sans-serif (e.g. Plus Jakarta Sans, Inter, system).
  - Monospace: Numerical data, coordinates, status codes.
- **Editable Controls Rule**:
  - Text inputs, textareas, and select elements must use a minimum `font-size: 16px` on mobile viewports to prevent iOS Safari auto-zoom.
- **Line Heights & Text Overflow**:
  - Body text: `line-height: 1.5` to `1.6`.
  - Headings: `line-height: 1.1` to `1.25`.
  - Handle long titles (e.g., compound destination names) with proper `word-break: break-word` or `hyphens: auto`.

## 3. Surface & Theme Tokens

- **Semantic Colors Over Raw Hexes**:
  - Use semantic color tokens (e.g. `--co-surface-low`, `--co-text-primary`, `--co-amber-highlight`, `--co-glass-border`) rather than hardcoded hexes `#ffffff` or `#000000`.
  - Test both Day mode (`[data-theme="day"]`) and Night mode (`[data-theme="night"]`):
    - Dark mode: deep slate/neutral surfaces with soft contrast borders.
    - Light mode: crisp limestone, warm white, and charcoal text with WCAG AA compliance.

## 4. Micro-Interactions & States

- **Interactive State Completeness**:
  - Every interactive component must declare: Default, Hover (only on pointer: fine), Active/Press, Focus-visible, and Disabled states.
- **Squircle Geometry**:
  - Use consistent squircle border-radii (`border-radius: 16px` or `border-radius: 20px`) with `overflow: hidden` for card containers.
