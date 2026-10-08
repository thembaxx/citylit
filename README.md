# Citylit

A mobile-first discovery game for South African cities. Spin a province map, swipe through low-poly landmarks, choose a category, and find somewhere worth exploring.

**12 destinations · 9 provinces · 83 places**

## Start

Requires Node.js 22+ and **pnpm 12.10.1** (the latest stable version checked during implementation).

```sh
npm install --global pnpm@12.10.1
pnpm install
pnpm dev
```

Open http://localhost:3000. For production, run `pnpm build && pnpm start`.

## Explore

- Nine real province boundaries, projected and extruded. Provinces without data share a muted sage color. All nine provinces now contain seeded destinations and are elevated, individually colored and clickable, with outlined mono labels and small dot markers. Labels use a contrasting navy backplate; map pins are unnumbered. The destination chooser lists all twelve cities.
- Nine detailed procedural landmarks: Ponte City, Nelson Mandela Bridge, Orlando Towers, Table Mountain, Bo-Kaap, Cape Point, Moses Mabhida Stadium, uShaka Marine World and Umhlanga Lighthouse.
- Shared category dioramas: turning Ferris wheel, a bed with floating stars, a theatre stage, a giraffe and acacia, and a rotating disco ball.
- Drag to rotate, pinch or scroll to zoom, reset the view, pause ambient motion, swipe landmark captions, or use arrow buttons/keys.
- Eighty-three sourced places across five categories; fuzzy search spans the selected city. Save places locally and revisit them through the header.
- Detail screens show credited local photos, a swipeable/pinchable fullscreen gallery, source links, Wikipedia where available, lazy-loaded street maps and Google Maps directions, with Apple Maps and Waze alternatives.
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

Data was retrieved and checked on **8 October 2026**. 70 catalog source pages were crawlable; unavailable responses are recorded rather than treated as successful checks. Secondary Wikipedia and tourism sources supplement them. Coordinates have per-place provenance and an explicit accuracy field; unavailable venue pins remain labelled city reference points. Photos without a venue match are labelled city atmosphere, not venue images. Hours, prices and event schedules are linked to the venue rather than fabricated.

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

Category navigation uses relevant Hugeicons and a Motion shared-layout glass pill, with keyboard selection and reduced-motion support. All inputs use 16px text. Cards, galleries, street maps and detail facts use CSS squircle corners when supported, with border-radius fallbacks. 58 locally cached, credited images are included.

Place details include expandable About introductions, attributed Wikipedia links, source-linked Good to know facts and same-location cards when a shared site is confirmed. Unknown payment/accessibility facts remain unconfirmed. Refresh About excerpts with `python3 scripts/research-detail-facts.py`.

## Adventure field guides

`/explore` offers mood/time/budget suggestions, three editorial collections per destination, optional location-based nearby discovery, source-backed expiring events, an itinerary builder and a passport. Share links contain only venue IDs; imports validate them and keep a day within one destination. Proximity grouping uses verified venue pins and puts city-reference pins at the end. Distances are straight-line estimates, not road routing. Visit durations are labelled editorial estimates; time suggestions stay within the selected planning budget.

The catalog covers Johannesburg, Cape Town, Durban, Pretoria/Tshwane, Stellenbosch, Pietermaritzburg, Gqeberha, Bloemfontein, Mbombela, Polokwane, Kimberley and Mahikeng, across all nine provinces. Chapters represent visitor destinations rather than strict municipality boundaries. Outlying attractions are labelled in addresses. The original three city models are unchanged; additional cities use lightweight illustrative miniatures, including the Big Hole, Union Buildings, Donkin Reserve, thatched village huts and Pietermaritzburg’s clock tower. Their coverage starts with three researched places per city; unseeded categories explain the gap.

Place filters include confirmed free entry, indoors, confirmed family suitability, step-free entrance and districts. Search/filter URLs, listing scroll, landmark selection and manipulated camera positions survive returning to a discovery. Essential-motion mode stops continuous scenery while keeping deliberate transitions.

Each practical fact carries a value, confidence, source and check date; unknown differs from unavailable. `/editorial` surfaces missing entrance/venue pins, weak image coverage, failed crawl links and stale facts. Suggested corrections remain browser-local drafts until reviewed and exported; the public catalog is never changed automatically. A shared editorial inbox/authenticated publishing workflow is not configured.

Offline guides use a service worker and a standalone fallback page. Passport → Save field guide offline caches public descriptions, addresses, practical facts and up to one photo per saved place (maximum 30 saves per download). The guide supports saved places, itineraries and the cached catalog. Street-map tiles and live ticket pages require connectivity. Saves, visits and plans are stored in this browser, not synced to an account.

Run `pnpm data:audit` to verify unique identities, bounds, image files and credit metadata, and regenerate `public/data/quality-report.json`. Practical facts should be reviewed every 30 days, events weekly (and hidden after expiry), and historical context every 180 days. Source status reflects the last crawl, not real-time availability.

The pinned-action weekly GitHub workflow refreshes metadata, introductions and licensed photos, validates the catalog/build, and opens an `automation/catalog-*` review PR. It never pushes to the default branch. Scheduled publishing starts only after the workflow is merged to the default branch; GitHub Actions must be allowed to create PRs in repository settings. Practical fact dates remain independent of source crawl dates. New events and changed prices/access information need editorial review.


## Repository checks and delivery

GitHub Actions validates formatting, source data, TypeScript, the production build and browser flows. Security workflows add dependency review/auditing, CodeQL, redacted Gitleaks history scanning, Actionlint and Zizmor. The existing CodeRabbit and GitGuardian integrations are configured for the repository. Dependabot opens reviewed dependency updates, and Vercel deployments receive public HTTP smoke checks.

See [repository automation](docs/repository-automation.md) for main protection, owner setup, merge order and deployment behavior. The current coding integration lacks GitHub administration permission; the main rulesets and native security switches require the owner setup command before they are active.
