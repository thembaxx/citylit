# Citylit

A mobile-first discovery game for South African cities. Spin a province map, swipe through low-poly landmarks, choose a category, and find somewhere worth exploring.

**Johannesburg · Cape Town · Durban**

## Start

Requires Node.js 22+ and **pnpm 12.10.1** (the latest stable version checked during implementation).

```sh
npm install --global pnpm@12.10.1
pnpm install
pnpm dev
```

Open http://localhost:3000. For production, run `pnpm build && pnpm start`.

## Explore

- Nine real province boundaries, projected and extruded. Provinces without data share a muted sage color. **Gauteng, Western Cape and KwaZulu-Natal** remain elevated and clickable, with outlined labels and dot markers. Labels use a contrasting navy backplate; numbered pins use smaller Space Mono text.
- Nine detailed procedural landmarks: Ponte City, Nelson Mandela Bridge, Orlando Towers, Table Mountain, Bo-Kaap, Cape Point, Moses Mabhida Stadium, uShaka Marine World and Umhlanga Lighthouse.
- Shared category dioramas: turning Ferris wheel, a bed with floating stars, a theatre stage, a giraffe and acacia, and a rotating disco ball.
- Drag to rotate, pinch or scroll to zoom, reset the view, pause ambient motion, swipe landmark captions, or use arrow buttons/keys.
- Fifty-six sourced places across five categories; fuzzy search spans the selected city. Save places locally and revisit them through the header.
- Detail screens show credited local photos, a swipeable/pinchable fullscreen gallery, source links, Wikipedia where available, lazy-loaded street maps and Google Maps directions.
- Deep links and browser back/forward navigation work. Invalid city/category/place combinations return 404.

Country, city and category chapters occupy one non-scrollable viewport. City, category and place pages have linked breadcrumbs; main headings have short introductions limited to two lines. Condensed ivory headings, roman numerals, violet controls and quiet floating shards follow the supplied references. Johannesburg has an amber glow, Cape Town an ocean-blue glow, and Durban a teal glow. Existing 3D illustrations are preserved. A top icon switches between deep-indigo night and warm daylight themes, remembered locally. Sound starts muted every session; enable it for quiet synthesized notes. Touch feedback is on where supported and can be disabled in How to explore. No sound files or third-party audio are loaded.

Swipe landmarks, then choose **Explore city**. Swipe categories or use the bottom glyph bar; **Open category** opens an editorial field-guide page inspired by the linked Citylit lodging page: a large category headline beside its interactive 3D model, icon tabs, search and bordered place cards. On phones the hero stacks above the cards; on desktop the hero is split and cards form two columns. This page scrolls inside the app viewport and uses the active theme. Search also opens this page. The `?view=places` URL preserves its state through browser navigation; switching its tabs keeps the page open. Place details scroll within their own screen.

## Stack

Latest stable package releases checked with the registry and `pnpm update --latest`: Next.js 16.4, React 19.3, strict TypeScript 7, Tailwind CSS 4, Three.js, React Three Fiber, drei, d3-geo, GSAP, Motion, use-gesture, MiniSearch, MapLibre, Lucide, Oxlint, Oxfmt and Playwright. Exact resolved versions are in `pnpm-lock.yaml`; `packageManager` pins pnpm.

One persistent R3F canvas lives in the root layout. Two drei Views share this canvas: a full-screen decorative background and the interactive hero. Backgrounds vary by chapter and city: map constellations, Joburg crystals, Cape Town orbit rings, Durban wave arcs, category marbles/portals and place fireflies. Fewer, smaller background objects drift slowly near the edges, leaving the central content clear. Background-only rendering is requested at 24fps, with capped object counts, no textures, no shadows and no postprocessing; it pauses with the hero, while sheets are open, in hidden tabs and for reduced motion. Shared clearing keeps the layers from leaving trails. Labels project into React-managed DOM elements, avoiding separate React roots and context creation. GSAP controls camera/scene entrances and selected object animations; Motion handles UI transitions and the gallery. OrbitControls provides touch rotation, pinch zoom and inertia.

Performance choices include capped DPR, adaptive pixel ratio, demand rendering, instanced windows/trees, local optimized photos, self-hosted fonts, no postprocessing or shadow maps, and lazy-loaded MapLibre. Ambient motion pauses offscreen and in background tabs; reduced-motion preferences suppress automatic motion. A WebGL failure leaves the DOM exploration flow usable.

## Checks

```sh
pnpm lint
pnpm typecheck
pnpm build
pnpm exec playwright install chromium
pnpm test
```

Playwright checks theme persistence, text contrast, optional sound/haptics, compact fullscreen layouts, the full mobile/desktop discovery flow, searches, saved-place persistence, source links, gallery controls, route validation, shared-canvas persistence, reduced-motion controls, and real touch swipe/drag/pinch interactions. The GitHub workflow runs these checks on pushes and pull requests.

## Source data

Data was retrieved and checked on **7 October 2026**. 47 catalog source pages were crawlable; unavailable responses are recorded rather than treated as successful checks. Secondary Wikipedia and tourism sources supplement them. Coordinates have per-place provenance and an explicit accuracy field; unavailable venue pins remain labelled city reference points. Photos without a venue match are labelled city atmosphere, not venue images. Hours, prices and event schedules are linked to the venue rather than fabricated.

See [ATTRIBUTIONS.md](ATTRIBUTIONS.md) for image authors, licenses, geographic provenance, fonts and source links. Models are illustrative rather than architecturally exact. The province dataset represents 2020 boundaries, simplified while preserving shared topology and the Lesotho exclusion.

To refresh sources, install the optional Python image dependency first:

```sh
python3 -m pip install -r scripts/requirements.txt
pnpm sources:refresh # reuses a seven-day cache
python3 scripts/crawl-sources.py --force
pnpm sources:geocode
pnpm geo:refresh
```

Crawling is a build-time maintenance task. Wikipedia and Commons requests are batched; refresh stops on rate limits. Nominatim requests are paced and accept only matching venue names within the city region. Review changed data before publishing. No API keys are required.

## Hosting

Deploy as a standard Next.js application on a compatible Node.js host. There is no server-side user account or database: saved discoveries stay in the current browser. No hosted deployment is claimed by this repository.

Original source code is MIT licensed; photos, fonts and geographic data retain their own documented licenses.

Category navigation uses relevant Hugeicons and a Motion shared-layout glass pill, with keyboard selection and reduced-motion support. All inputs use 16px text. Cards, galleries, street maps and detail facts use CSS squircle corners when supported, with border-radius fallbacks. 39 locally cached, credited images are included.

Place details include expandable About introductions, attributed Wikipedia links, source-linked Good to know facts and same-location cards when a shared site is confirmed. Unknown payment/accessibility facts remain unconfirmed. Refresh About excerpts with `python3 scripts/research-detail-facts.py`.
