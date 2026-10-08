# Third-party data and assets

## Geography

South Africa ADM1 province geometry from [geoBoundaries gbOpen](https://www.geoboundaries.org/api/current/gbOpen/ZAF/ADM1/), originally sourced from OCHA ROSEA and the South African Municipal Demarcation Board. The selected dataset represents 2020 boundaries and declares **Creative Commons Attribution 3.0 Intergovernmental Organisations (CC BY 3.0 IGO)**. The exact metadata, source URL, versioned download and license source are in `public/data/geography-source.json`. Geometry was simplified with mapshaper while preserving topology, projected with d3-geo, and extruded for display. An upstream spelling error in Northern Cape is corrected in labels.

## Photographs

Wikimedia Commons photographs remain under their individual CC BY, CC BY-SA or public-domain licenses. `public/data/image-credits.json` records every redistributed photo's original filename, author, file-description URL and license. Photo credit and license links appear beside the gallery. JPEG files have been resized and compressed for display. City atmosphere photos are explicitly labelled when venue images are unavailable; they do not purport to show that venue.

## Venue and landmark information

Short descriptions are original paraphrases. Venue pages, Wikipedia articles, crawl dates and fetch outcomes are recorded in `public/data/places.json` and `crawl-report.json`; links are available in each detail view. Landmark links appear under each illustration. Wikipedia is a secondary source, and direct venue websites take precedence for hours, tickets and current programmes. No runtime scraping or Google Places photo caching is used.

Additional checks replaced closed Cape Town venues with Modular and Cabo Beach Club, using [Cape Town Tourism](https://www.capetown.travel/your-guide-to-the-hottest-nightclubs-and-bars-in-cape-town/), [Modular](https://modularclub.com/about/) and the [V&A Waterfront listing](https://www.waterfront.co.za/eat-and-drink/cabo-beach-club).

## Venue coordinates and street maps

Coordinate sources are recorded individually. Wikipedia-derived pins use the article link. OpenStreetMap-derived pins use their exact node/way/relation link. Missing coordinates remain city reference points and are labelled in the interface. [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) provide ODbL geographic data. Raster street-map tiles load directly from OpenStreetMap with on-map attribution; use an appropriate tile provider before scaling traffic significantly.

## Fonts

Barlow Condensed, DM Sans and Space Mono are distributed under the SIL Open Font License. Fonts are self-hosted in `public/fonts`; the corresponding OFL texts are bundled there. Sources: [Google Fonts](https://github.com/google/fonts).

## Illustrations

All 3D landmarks and category objects are original procedural models made for Citylit. They are stylised interpretations, not survey-accurate architecture. No screenshot geometry or external 3D assets were copied.

## Category icons

[Hugeicons free icons](https://github.com/hugeicons/hugeicons-react) use the MIT license. Category symbols represent admission tickets, lodging, theatre masks, trees and music. Copyright © Hugeicons.

Wikipedia introductions are excerpts attributed to the linked article and Wikipedia contributors under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Excerpts and their source/license are cached per place.
