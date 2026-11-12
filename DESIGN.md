# Citylit Design System & Interaction Architecture

> Built on the aesthetic craft of [Pin UI](https://pinui.xyz) and the headless behavioral rigor of [Vercel Labs ui-sdk](https://github.com/vercel-labs/ui).

---

## 1. Aesthetic Identity & Core Principles

### A. Tactile Depth & The Chamfer Rule
Rather than flat monotone borders or generic box shadows, every card, pill, and container utilizes a dual-layer milled chamfer highlight:
- **Outer Hairline Border**: `1px solid rgba(255, 255, 255, 0.08)` (Night) / `1px solid rgba(0, 0, 0, 0.08)` (Day).
- **Inner Specular Chamfer Highlight**: `box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.12)` (Night) / `inset 0 1px 0 0 rgba(255, 255, 255, 0.85)` (Day).
- **Atmospheric Elevation**: Multi-tiered soft shadows grounding cards without harsh mud (`0 1px 2px rgba(0,0,0,0.12), 0 8px 24px -4px rgba(0,0,0,0.24), 0 24px 52px -12px rgba(0,0,0,0.38)`).

### B. Ambient Drifting Bloom
Surfaces are dynamic and living. Floating radial gradients (`filter: blur(48px)`, opacity 0.15–0.25) gently illuminate background planes, shifting between violet, amber, and forest hues reflecting time of day and local atmospheres.

### C. Continuous Curvature (Squircles & Inverted Fillets)
- Master cards & modals: `border-radius: 24px - 28px` (iOS-grade squircle geometry).
- Micro-badges & action buttons: `border-radius: 999px` (tactile pills).
- Folder tabs: **Inverted-fillet** concave curves blending the active tab into the surface below it without abrupt corners.

### D. Typographic Hierarchy & Duality
- **Display Serif**: `Fraunces` for editorial storytelling, city names, and prominent milestones.
- **Modern Grotesque UI Sans**: `Manrope` with tight tracking (`-0.025em`) for UI navigation, metrics, labels, and weather readings.
- **Monospace Micro-Badges**: UI shortcuts and metadata pills (`⌘K`, `LIVE`, `37%`).

---

## 2. Mobile-First Ergonomics & Gestures

1. **Thumb-Zone Navigation**:
   - The floating frosted glass dock (`.citylit-bottom-dock`) is anchored at the bottom with strict safe-area clearance (`bottom: max(10px, env(safe-area-inset-bottom))`).
   - Smooth layout sliding indicator (`layoutId="citylit-dock-active-pill"`).
   - Press compression haptics: `:active { transform: scale(0.92); }`.

2. **Touch & Gesture Physics**:
   - Tuned spring dynamics via `motion/react`: `stiffness: 360, damping: 28`.
   - Filter pills with horizontal scroll-snap and active compression (`:active { transform: scale(0.95); }`).
   - Drag-to-rotate 3D diorama canvas and hardware dials.

3. **Responsive Viewport Support**:
   - Tested and fluidly supported at **320px** (iPhone SE), **390px** (iPhone 14/15/16 Pro), and desktop viewports.
   - All editable controls maintain strict 16px font-size to prevent iOS Safari auto-zooming.
   - All interactive touch targets are ≥ 44×44px.

---

## 3. Behavioral Engine (Vercel Labs ui-sdk Architecture)

1. **Roving Focus Navigation**:
   - Horizontal tab groups, category filters, and weather scrubbers manage roving tabindex (`tabIndex={isActive ? 0 : -1}`) for instant arrow-key navigation.

2. **Focus Recovery**:
   - Search inputs, filter pills, and bottom sheets automatically restore focus to the triggering element upon dismissal or clearance.

3. **Semantic ARIA & Data Attributes**:
   - Accessible roles (`role="tab"`, `aria-selected`, `aria-controls`, `role="region"`, `aria-modal`).
   - Explicit `data-state="active|inactive"` and `data-theme="day|night"` attributes driving visual transitions without re-mounting DOM nodes.

---

## 4. Component Inventory & Pin UI Patterns

1. **Search & Command Card (`.reference-search`)**:
   - Floating search pill with `⌘K` / `/` shortcut tag, expanding into elevated card with pastel category pills and instant clear button.

2. **Thermal & Atmospheric Controller (`DioramaWeatherController`)**:
   - Real-time weather badge with hardware-style sunken scrubber track, illuminated condition pills, and sensory soundscape audio ripple button.

3. **Featured Landmark Card (`.citylit-featured-card`)**:
   - 26px squircles, top specular chamfer sheen, pulsing green status stamp, and spring hover lift.

4. **Floating Bottom Dock (`MagnifyingDock`)**:
   - Frosted glass (`backdrop-filter: blur(28px) saturate(190%)`), hairline border, and sliding spring pill.

5. **Settings Sheet (`SettingsModal`)**:
   - Ambient radial bloom, segmented layout slider tabs, and tactile toggle switches.
