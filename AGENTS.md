<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Citylit design direction

Use [the reference brief](docs/redesign/reference-brief.md), its retained complete HTML and the linked Claude conversation as the visual source. The design centers on the living South Africa map, city/province framing, cream/ink/amber surfaces, Fraunces/Manrope typography, and interactive landmark/place stages. Use squircle controls and Phosphor icons. Preserve the real catalog, source attribution, accessibility, offline behavior and day-planning state; do not replace them with prototype drafts or placeholder policies.

## Quiet UX / DX / AX defaults

- Each screen should make its primary action obvious without a tagline or helper paragraph. Use real content and plain labels; keep the South Africa map, existing brand, and purposeful 3D interactions.
- Keep user-facing source disclaimers, factual context, accessibility labels, empty/error feedback, offline support, saved-day state and responsive safe areas.
- The single 16px editable-control rule lives in `app/native-refinement.css`. This covers text inputs, select, textarea, editable content and textbox-like ARIA controls across themes and viewports. Do not add per-page font-size overrides.
- Use existing semantic color tokens and Phosphor icons. Avoid installing a new design system or duplicating UI logic simply to achieve visual polish.
- Protect touch and keyboard interactions: meaningful focus states, accessible names, 44px targets where practical, WCAG AA contrast, reduced-motion support, and Inspect popovers above WebGL.
- Verify affected flows at 320px, 390px and desktop; run formatter, lint, types, build and browser regressions. Do not report a check as passed until it has actually completed.
