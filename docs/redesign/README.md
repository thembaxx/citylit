# Citylit guide redesign

The supplied `Discover South Africa | Citylit (redesign).html` and handoff established the direction: Fraunces and Manrope, warm day/night surfaces, amber city beacons, generous editorial typography and a country-to-city-to-visit journey. The production implementation keeps the existing Next.js routes, source-linked catalog, offline guide and optional original 3D experience. Cards and controls use squircle corners with rounded fallbacks. All UI icons and the offline sprite use Phosphor.

## Product Design review

1. **Reference / discovery.** [Supplied reference capture](00-reference.png). The particle map and city selection create a clear visual identity. The reference landmark, place and day-plan cards are plain `div` elements with no navigation. The production guide uses real links with concise accessible names and explicit planning controls.
2. **Home / choose a city.** [Desktop capture](03-home-desktop.png). A city beacon or the labelled city selector updates the preview; its link opens the correct city. A searchable, province-filtered directory provides a direct alternative to the map.
3. **City / discover a place.** [Mobile capture](05-city-mobile.png). Each landmark opens a catalog place or a complete landmark story. Explicit aliases connect shortened landmark names to their venue records. Place search and category filters survive detail navigation in the URL. The reset action clears both filters together.
4. **Visit / save a day.** [Venue capture](06-venue-dark.png). Source-linked details, attributed gallery, official website, name-and-address Maps search, saved discoveries and day actions are available together. Day picks survive reloads; a new city cannot silently replace an existing day. Storage failures produce a visible message.

The original 3D atlas remains available through “The 3D atlas” and city “Explore in 3D” links. “Read guide” returns to the redesigned experience. The `citylit-view` first-party preference cookie remembers the selected experience; the privacy page explains its purpose and lifetime. Existing 3D tests explicitly select this preference. New guide tests exercise the default experience independently.

## Research changes — 15 October 2026

The catalog grows from 83 to 89 places. Six additions: Table Mountain, Voortrekker Monument, Route 67, William Humphreys Art Gallery, Polokwane Game Reserve and National Museum Bloemfontein. Existing facts are refreshed for seven places. Practical facts retain source URLs, check dates and confidence; there are 46 verified practical facts. Editorial durations are labelled estimates.

| Research source | Applied to |
| --- | --- |
| [Apartheid Museum visitor information](https://www.apartheidmuseum.org/about-the-museum/visitor-information) | Opening days, admission categories, visit duration, booking |
| [SANBI Lowveld](https://www.sanbi.org/gardens/lowveld/visitor-information/information/) | Seasonal hours and fees |
| [Stellenbosch Museum](https://stelmus.co.za/about/) | Seasonal Sunday hours and closures |
| [The Big Hole](https://thebighole.com/visitors-info/) | Official domain, hours, March 2026 fees, booking, qualified access note |
| [Oliewenhuis](https://nationalmuseum.co.za/visitor-information/) | Hours, free admission, parking and documented access |
| [SANBI Kirstenbosch](https://www.sanbi.org/gardens/kirstenboch/visitor-information/information/) | 2026–2027 admission categories and cashless payments |
| [Nelson Mandela Bay Tourism](https://www.nmbt.co.za/listing/route_67.html) | Route 67 and Donkin visitor context |
| [Table Mountain Cableway](https://www.tablemountain.net/) | Weather-dependent operations and official booking route |
| [Voortrekker Monument](https://vtm.org.za/en/contact-us/) and [fees](https://vtm.org.za/entrance-fees/) | Current hours, closure days, admission categories |
| [William Humphreys Art Gallery](https://whag.co.za/contact-us) | Address, hours and guided visits |
| [Polokwane Municipality](https://www.polokwane.gov.za/things-to-do/) | Reserve listing; fees/hours remain unconfirmed |
| [National Museum](https://nationalmuseum.co.za/) | Museum listing and address; hours remain unconfirmed |

No new venue coordinates were inferred from city pins. New places reuse licensed venue photos where available, otherwise explicitly labelled city atmosphere. Nineteen orphan credit records for files absent from the repository were removed; referenced photo credits were retained. Catalog refresh now matches seed data by city and name so reordered data cannot overwrite another venue.

## Implementation and limits

- Guide content and links render on the server. Removing the root loading boundary prevents no-JavaScript visitors from being stranded in a streamed, hidden page; route-level planner loading remains.
- The particle map uses the repository's provincial geometry, including its holes, rather than the prototype's approximate outline. Its camera fits narrow viewports. Scroll capture invalidates the shared renderer so the map clears as the guide scrolls. The directory remains usable without WebGL.
- Fonts are local, with bundled SIL OFL licenses. Phosphor's MIT license is included. No Google Fonts or script CDN is needed at runtime.
- The attached Blender script is an untested base-shape exporter. Existing original procedural landmark models remain available; no Blender or Unity output is claimed.
- Research is not live venue confirmation. Many opening hours, access details and entrance pins still need operator confirmation. There are 52 venue pins; the other records use explicitly labelled city references. The correction workflow remains an on-device draft queue, not a publication backend.

## Verification

See [design-qa.md](../../design-qa.md) and `tests/redesign.spec.ts`. The focused run completed 60/62 checks; both dialog-close timing failures were corrected and passed in the final 16/16 follow-up run. Browser evidence includes responsive layouts, navigation from beacons and every landmark, search/filter recovery, gallery interaction, persistence, cross-city day protection, denied storage, no-JavaScript navigation, and WCAG automated checks. Existing security, offline/PWA and original 3D regression coverage is retained.
