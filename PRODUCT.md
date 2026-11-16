# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

 travellers and curious visitors planning days in South African cities, on phones first and desktop second; they need trustworthy, source-linked place information and a tactile way to explore a city before and during a visit.

## Product Purpose

 Citylit is a mobile-first South Africa destination guide, day planner and interactive 3D atlas. Success is a visitor who can discover a place, understand why it matters, and build a realistic day around it, offline if needed.

## Positioning

 A living South Africa map with city beacons and rotating landmark stages, backed by a real, source-attributed catalog and local-first day planning. The 3D is illustrative, not a surveyed reconstruction.

## Operating Context

 Progressive web app; persistent renderer for map/city/province framing; landmark and place stages for twelve cities; day-planning state stored locally; offline behavior; themed night/day surfaces; source and attribution disclosures throughout.

## Capabilities and Constraints

 - Preserve the real catalog, source citations, check dates, pin-confidence labels and CC BY-SA / geoBoundaries attribution.
 - Preserve the persistent day planner, offline support, accessibility labels and reduced-motion behavior.
 - Keep editable controls at the single `16px` rule defined in `app/native-refinement.css`.
 - UI icons come from `@phosphor-icons/react`; custom SVG is reserved for the KhweziMark brand mark.
 - Do not import `.glb` / `GLTFLoader` into procedural Three.js files; glTF/Draco loading stays isolated in `Pixi3DStage`.
 - Next.js 16 App Router; verify against the versioned docs in `node_modules/next/dist/docs/` before writing code.

## Brand Commitments

 Name: Citylit. Voice: quiet, precise, curious. Visual identity is documented in `DESIGN.md` (forest, limestone, sage and amber surfaces; Fraunces/Manrope typography; squircle controls; Phosphor icons) and in `docs/redesign/reference-brief.md`.

## Evidence on Hand

 `DESIGN.md`, `docs/redesign/reference-brief.md` and its retained reference HTML, `docs/redesign/reference-handoff.md`, the real data catalog in `lib/data`, and the production QA record in `design-qa.md`. Testimonials, pricing and benchmarks for any third-party showcase must not be presented as Citylit claims.

## Product Principles

 - Real content over placeholders; never invent ratings, counts or policies.
 - Source attribution and factual context travel with every place.
 - Touch, keyboard and reduced-motion users get the same complete experience.
 - Offline and saved-day state are part of the product, not an enhancement.

## Accessibility & Inclusion

 WCAG AA contrast, meaningful focus states, 44px practical touch targets, keyboard-accessible map beacons and stage controls, Inspect popovers above WebGL, and reduced-motion fallbacks.

## Inferred context

 The facts above were inferred from repository documentation and code because the user asked to proceed without a separate interview.
