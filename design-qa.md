# Citylit reference redesign QA — 15 October 2026

**Final result: passed.** No unresolved P0–P2 findings in the inspected states. This report covers the reference-led map and stage implementation; [phase-one QA](docs/redesign/phase-one-qa.md) retains the earlier guide, catalog and merge history.

## Source and comparison method

Product Design review used [the supplied Claude conversation](https://claude.ai/share/fd51a657-84bd-4cd5-924c-6ede07fa78c4), opened in a real browser, and the attachments. The fullest researched [HTML prototype](docs/redesign/reference-complete.html) is the visual source; the earlier all-page file contains empty data blocks. The [handoff](docs/redesign/reference-handoff.md) and [implementation brief](docs/redesign/reference-brief.md) record the intended behavior and production adaptations.

Source and local production screenshots were captured at identical CSS viewports and device scale 1: desktop 1440×1000 and mobile 393×852. Side-by-side images place source left and implementation right. Source web fonts and implementation self-hosted fonts were allowed to load. The initial state has no city selected; stage comparisons select Table Mountain. Day/night are explicit theme states. A separate 320×568 capture checks the smallest supported layout.

| Evidence | Review |
| --- | --- |
| [Home, full desktop comparison](docs/redesign/v2/comparison-home-desktop.png) | Composition, map scale, hero position, navigation and preview panel |
| [City, full desktop comparison](docs/redesign/v2/comparison-city-desktop.png) | Camera framing, title hierarchy, facts and chapter navigation |
| [Stage, full desktop comparison](docs/redesign/v2/comparison-stage-desktop.png) | Ring arrangement, models, selection chips and detail sheet |
| [Home, mobile comparison](docs/redesign/v2/comparison-home-mobile.png) | Title wrapping, map crop and fully visible preview |
| [Stage, mobile comparison](docs/redesign/v2/comparison-stage-mobile.png) | Heading, model clearance, sheet placement and primary actions |
| [Hero typography detail](docs/redesign/v2/comparison-home-focus.png) | Fraunces optical size, weight, italic width and amber |
| [Detail sheet comparison](docs/redesign/v2/comparison-stage-focus.png) | Manrope body copy, facts, action hierarchy and spacing |
| [Mobile night home](docs/redesign/v2/implementation-home-mobile-night.png), [night stage](docs/redesign/v2/implementation-stage-mobile-night.png) | Ink surfaces, warm text, gold beacons and control contrast |
| [320px home](docs/redesign/v2/implementation-home-small-mobile.png), [province](docs/redesign/v2/implementation-province-desktop.png), [about](docs/redesign/v2/implementation-about-desktop.png) | Narrow layout, province framing and shared prose-page system |

## Five required surfaces

- **Fonts:** local variable Fraunces normal/italic and Manrope. Replaced static display-font rendering after the first comparison exposed different glyph widths and optical sizing. Final focused comparison confirms the characteristic letterforms and italic treatment.
- **Spacing:** fixed translucent navigation, full-viewport map, lower-left hero and lower-right preview follow the reference. Removed inherited mobile margins that clipped the preview, reduced stage heading size and moved the sheet upward. Full-guide and day actions now precede longer facts on mobile.
- **Colors:** shared cream `#f4efe6`, ink `#0e0f13` and reference amber `#d9660b` extend to recovery/offline pages, browser chrome and manifest. Small accent text uses darker accessible tokens; amber buttons use dark text.
- **Assets:** actual geographic boundaries replace the prototype point approximation. Fifteen Blender-authored, Draco-compressed illustrations replace prototype cones and domes. Each committed model decodes successfully and is 5.5–13.4 KB. Controls use requested squircle corners and Phosphor icons. Photographs, font licenses and decoder licenses remain available.
- **Copy:** use the real twelve-city catalog, current source attribution and accurate coordinate precision. Facts appear only when sourced; city references are not described as verified entrances. Models are labelled illustrations. Existing privacy and correction workflows replace prototype drafts.

## Findings and fixes

| Priority | Finding | Final result |
| --- | --- | --- |
| P1 | Previous implementation did not use the living map and model stages as the main interface | Shared fixed map, city/province framing and landmark/place ring routes implemented |
| P1 | Prototype cards and planning actions lacked complete behavior | Real guide links, model/name selection, continuous drag/snap, Prev/Next and persistent day actions verified |
| P2 | Static Fraunces differed from the source at large display sizes | Self-hosted variable normal/italic fonts match the intended optical treatment |
| P2 | Mobile preview inherited off-screen margins; stage sheet appeared too low | Preview fits 393px and 320px screens; stage actions appear before longer facts |
| P2 | Decorative map labels remained focusable while fading; ring label lacked a supported role | Inactive labels are hidden/disabled; ring has a group role; all final automated audits have zero violations |
| P2 | Heading fade-ins temporarily reduced text contrast; the visit-panel amber was too light on its tinted surface | Motion now changes position while text remains opaque; the panel uses the accessible accent token |
| P2 | Emergency root recovery still used the previous browser theme colors | Saved day/night themes and fallback colors now use the reference palette under the hashed recovery script |
| P2 | Local model decoder required WASM compilation and model assets inherited HTML no-store behavior | Narrow WASM CSP capability and cacheable model/decoder endpoints verified; JavaScript eval remains blocked |

Deliberate adaptations are the real boundary geometry, sourced catalog, accessible city selector, My day navigation, squircle controls and actual illustrative models. These explain differences from the prototype while retaining its composition and visual language. No Unity build was supplied; an unavailable flythrough is not advertised.

## Functional and production-build verification

The latest stage regression run passed on mobile and desktop Chromium, including every Cape Town landmark chip, drag/snap, selection changes, day persistence after reload, full-guide navigation, place selection, all twelve city routes, unknown-city 404 and cacheable GLBs. The prior focused six-check run also verified beacon navigation. Two final mobile/desktop regressions verify the fixed map fades, disables interaction and removes its city buttons from the accessibility tree while scrolling to the collection; the [scrolled screenshot](docs/redesign/v2/implementation-scrolled-home.png) confirms the visual result. No page errors occurred in these flows.

[Seven complete-page accessibility scans](docs/redesign/v2/accessibility.json) report zero WCAG A/AA violations across desktop home/stage, mobile home/stage, mobile night home/stage and the 320px home. The stage regression also audits the interactive content. These are automated checks of the inspected states, not assistive-technology certification.

The final local production build, TypeScript, lint, formatting, model decode/budget audit, workflow lint, dependency audit, catalog audit, four production-monitor tests and sixteen Python ingestion/image regressions pass. The catalog retains 89 places across twelve cities, 52 venue pins, 130 unique place images and 46 verified practical facts. CI runs the complete cross-browser suite against one shared production build and audits all model assets.

The read-only production monitor now checks the stage, model manifest, GLB and local WASM decoder alongside health/release identity, application JavaScript, catalog, guide, manifest and 404 handling. See [production readiness](docs/production-readiness.md) for existing owner tasks such as legal identity, alert delivery and real-device acceptance.

## Release follow-through — 16 October 2026

Pushed the implementation and fixed-map regression to main. The first complete CI run exposed the recovery theme colors and three text-contrast failures described above; the corrections passed four focused recovery checks and four accessibility regressions covering mobile/desktop home, city, directory and Kirstenbosch. The production build, formatting, lint and TypeScript pass after these corrections. The complete CI suite is rerun for the final release commit.

Real-browser checks on the deployed redesign verified beacon-to-city navigation, rendered GLB selection by clicking the Bo-Kaap model, the mobile stage with reduced motion, saved-day persistence, full venue navigation, visit stamping and the planner. There were no page errors. The twelve-request production monitor passed against the deployed revision; the deployment's error/fatal runtime-log query returned no groups during the check window.

Open PRs #15, #16 and #17 were duplicate heads of work already squash-merged in #12, #7 and #11. Each branch's complete tree exactly matched the corresponding original merge commit. Closed these duplicate PRs without reapplying older styling or dependencies.
