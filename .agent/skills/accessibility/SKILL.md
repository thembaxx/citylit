---
name: accessibility
description: Audit and improve web accessibility following WCAG 2.2 guidelines. Use when asked to "improve accessibility", "a11y audit", "WCAG compliance", "screen reader support", "keyboard navigation", or "make accessible".
license: MIT
metadata:
  author: addyosmani
  version: "1.0.0"
  source: https://skills.sh/addyosmani/web-quality-skills/accessibility
---

# Web Accessibility Engineering (WCAG 2.2)

An actionable engineering skill for evaluating, auditing, and fixing web accessibility across the four POUR principles (Perceivable, Operable, Understandable, Robust) for WCAG 2.1 and WCAG 2.2 Conformance Levels A and AA.

## 1. Perceivable (Contrast, Alternatives, Typography)

- **Color Contrast (WCAG 1.4.3)**:
  - Normal text (< 18pt or < 14pt bold): minimum **4.5:1** contrast ratio against its background.
  - Large text (>= 18pt or >= 14pt bold): minimum **3:1** contrast ratio.
  - Non-text UI controls & borders (WCAG 1.4.11): minimum **3:1** against adjacent colors.
  - **Light/Dark Theme Parity**: Never hardcode `#ffffff` text or `#000000` text without dynamic theme tokens (`data-theme="day"` / `data-theme="night"`). Text in light theme must use dark ink (`#111827`, `#1f2937`), never pure white.
- **Text Alternatives (WCAG 1.1.1)**:
  - Every informative `<img>` must have meaningful `alt` text.
  - Decorative icons or visuals must have `aria-hidden="true"`.
  - Icon-only `<button>` or `<a>` elements must have an `aria-label` or visually hidden text (`.sr-only`). Never leave an icon button empty.

## 2. Operable (Keyboard, Touch Targets, Focus)

- **Touch Target Dimensions (WCAG 2.5.5 / 2.5.8)**:
  - Minimum touch target size for interactive controls on pointer/touch screens is **44x44px** (minimum 24x24px with adequate spacing for Level AA, 44x44px for Apple HIG and AAA).
  - Add `min-height: 44px; min-width: 44px;` or touch padding to pills, tabs, and action links on mobile.
- **Keyboard Navigation (WCAG 2.1.1)**:
  - All interactive controls must be reachable via `Tab` / `Shift+Tab`.
  - Custom tabs (`role="tablist"`) must support ArrowLeft/ArrowRight navigation, Home/End, and activate on Space/Enter.
  - Modals and sheets must trap focus and close on `Escape`.
- **Focus Visibility (WCAG 2.4.7 / 2.4.13)**:
  - Never use `outline: none` without providing a prominent `:focus-visible` ring.
  - Minimum 2px solid contrast outline with 2px-3px offset.

## 3. Understandable (Form Controls, Feedback, Labels)

- **Form Normalization & Labels (WCAG 3.3.2)**:
  - Every `<input>`, `<select>`, `<textarea>` must have an associated `<label>` (either explicit `<label for="...">` or wrapping `<label>`).
  - Search inputs: suppress browser native cancel duplicate icons with `input[type="search"]::-webkit-search-cancel-button { -webkit-appearance: none; display: none; }` when a custom clear button is provided.
  - Custom select dropdowns: normalize with `appearance: none; -webkit-appearance: none;` to prevent double-arrow rendering.
- **Status & Live Regions (WCAG 4.1.3)**:
  - Dynamic results count and toasts should use `role="status"` or `aria-live="polite"` so screen readers announce changes.

## 4. Robust (Semantic HTML, ARIA Roles)

- Use native elements (`<button>`, `<a>`, `<nav>`, `<main>`, `<header>`, `<footer>`) over `<div>` click handlers.
- When ARIA is required, follow WAI-ARIA Authoring Practices (e.g., `aria-pressed` for toggle buttons, `aria-selected` for tabs).
