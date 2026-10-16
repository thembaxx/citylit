# Citylit redesign QA — 15 October 2026

## Scope and evidence

Implemented in the existing Next.js application from the supplied HTML, Markdown handoff and model script. Product Design review compared the supplied reference with actual local production screenshots. This is a responsive adaptation to the existing Citylit routes and data, with the original 3D atlas available as an optional experience.

- [Reference](docs/redesign/00-reference.png)
- [Home, desktop](docs/redesign/03-home-desktop.png)
- [City guide, desktop](docs/redesign/04-city-desktop.png)
- [City guide, 320px](docs/redesign/05-city-mobile.png)
- [Venue guide, night](docs/redesign/06-venue-dark.png)
- [Scrolled home collection](docs/redesign/07-home-city-collection.png)
- [Design decisions and research sources](docs/redesign/README.md)

The reference's Fraunces/Manrope typography, amber particle map and day/night direction are carried through city, landmark, venue and planning pages. Cards, panels, buttons and fields use CSS squircle corners with rounded fallbacks. UI icons, including the offline sprite, use licensed Phosphor artwork. Fonts are local and include their licenses.

## Findings addressed

| Finding | Result |
| --- | --- |
| Prototype landmark/place/visit cards had no action | Native links open a venue or complete landmark story; planning cards also have explicit add/remove controls. All 60 landmark destinations return valid pages. |
| Search reset lost one filter; browser back lost search | City/place filters use the current URL and update both fields correctly. |
| Saves and plans could overwrite newer local changes | Actions read the latest normalized state; duplicate saves and trip limits are guarded. Storage failures are visible. |
| Planning a new city could discard an existing day | An existing day must be reviewed or cleared explicitly. |
| No-JavaScript visits could remain hidden behind root streaming | Default guide links render on the server; root loading boundary removed; invalid landmarks return 404. |
| Small-screen map extended beyond the layout | Camera fits the available width and the map clips its drawing area. |
| Demand-rendered views could retain their old position while scrolling | Scroll capture invalidates the shared renderer; the collection screenshot confirms the map clears. |
| Muted/accent text failed contrast on shared/offline surfaces | Shared day/night tokens and guide panel text were corrected. |
| Server motion attribute survived hydration on reduced-motion devices | Root starts still and enables motion after client visibility/preferences are available. |
| Desktop city preview fell below the first screen | Preview occupies the hero's lower-right area; browser regression checks its full visibility. |

## Verification

Production build, TypeScript, lint, formatting, data audit, dependency audit and 16 Python ingestion/image security regressions pass. The catalog audit reports 89 places, 12 cities, 52 venue pins, 130 unique place images and no errors. Research adds six venues and refreshes seven existing records, with 46 verified practical facts.

The focused regression run completed with 60 of 62 checks passing across mobile/desktop Chromium, WebKit and Firefox. Both failures were the same keyboard case acting before the native settings dialog had finished closing. The corrected test waits for the backdrop to be removed; both cases passed in the final follow-up run.

**Final follow-up: 16 passed, zero failures.** This run verified real beacon clicks, venue/gallery navigation, saved discoveries and visits after reload, day planning, blocked-storage messages for saves/visits/day additions, no-JavaScript navigation, 320px and 1440px layouts in both themes, full desktop preview visibility, canvas scrolling, and planner/original-field-guide accessibility. The broader focused run also verified 768px/1024px layouts, all 60 landmark destinations, search/filter recovery, cross-city protection, offline launch/editing, sitemap responses, map failure recovery, production smoke checks and cross-browser theme behavior.

Visual review: pass for the inspected reference adaptation. The particle map clears when scrolling to the collection; city navigation opens at the new heading. Final screenshots were captured at CSS resolution and inspected against the supplied reference.

Tests ran against local production builds with software-rendered Chromium and actual bundled WebKit/Firefox. In this container, WebKit's required Linux libraries were installed in the user cache and the dependency heuristic was bypassed after confirming the browser launched. CI installs browser dependencies normally. Automated checks do not establish real-device or assistive-technology certification; the complete repository suite remains available in CI.

## Remaining launch work

Venue information is researched, not live operator confirmation. Unknown hours, accessibility and entrances remain labelled; city-reference pins are never presented as verified entrances. Correction drafts now prepare public GitHub reports for maintainer review and publication; see [the correction workflow](docs/catalog-corrections.md). Hourly production uptime checks are implemented. Legal/operator identity, alert ownership, optional exception reporting, search-console ownership and physical iOS/Android assistive-technology acceptance remain owner tasks described in [production readiness](docs/production-readiness.md). No Blender/Unity export or new Citylit backend is claimed.

## Merge and production follow-through

Merged dependency PR #14 and the pending catalog refresh. The catalog merge advances 41 description source-check dates while retaining all 89 places and the newer practical facts. The other historical feature branches were already merged through their pull requests.

Added a public correction-report handoff, copy fallback, draft deletion, cross-tab queue refresh, storage-failure feedback, privacy disclosure and maintainer publication instructions. Six new mobile/desktop checks pass, including scoped WCAG A/AA checks, bounded public-report URLs and failed-storage behavior. Four uptime-check tests cover healthy production, outages, redirects, missing JavaScript, incomplete data and a release changing mid-check. The live production check passed using the managed environment's proxy. The production build, catalog audit, formatting, strict TypeScript, lint, workflow lint, dependency audit and all 16 ingestion/image tests pass locally. Full browser CI now shares one production build across six isolated jobs and retains the required `verify` gate.
