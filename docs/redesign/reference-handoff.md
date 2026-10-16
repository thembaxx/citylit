# Citylit redesign: handoff

## Where it lives
- Published artifact: https://claude.ai/artifact/FkXv5F9xENjRDEvKfYH5SK
- Source: a single file, `citylit-redesign.html`. No build step.
- Libraries (cdnjs, pinned): Three.js r128, GSAP 3.12.5, ScrollTrigger 3.12.5
- Fonts (Google Fonts): Fraunces and Manrope

## Routes (hash-based)
| Route | Page |
|---|---|
| `#/` | Home: hero, 3D map, city chapters, "how it's built" |
| `#/destinations` | All 12 cities, filterable by province |
| `#/city/<slug>` | City page: facts, landmarks, places, plan a day, neighbours |
| `#/city/<slug>/landmarks` | 3D landmarks stage |
| `#/city/<slug>/places` | 3D places stage with "My day" route |
| `#/province/<slug>` | Province page: its cities and other provinces |
| `#/about` | About the research (four accuracy notes) |
| `#/privacy` | Privacy & data (placeholder) |

City slugs: johannesburg, cape-town, durban, pretoria, stellenbosch, pietermaritzburg, gqeberha, bloemfontein, mbombela, polokwane, kimberley, mahikeng.

## How it's built
- One fixed WebGL canvas sits behind every page.
- Map mode: a dot field of South Africa plus a glowing beacon per city. Drag to tilt, tap a beacon to fly the camera there.
- Stage mode: a ring of low-poly models on pedestals, one per landmark or place. Drag to spin (snaps to nearest), tap or use Prev/Next to focus.
- `go()` is the router. It renders a template from `PAGES`, then tells the 3D scene what to show (`pick`, `frame`, `reset`, `openStage`).
- A "veil" overlay fades the 3D scene as you scroll or on text-heavy pages.
- GSAP handles the hero reveal, beacon pop-in, camera fly-tos, page fades and ScrollTrigger card reveals.
- Light and dark themes run off CSS variables on `:root`. `theme()` copies them into the 3D materials.
- Motion respects `prefers-reduced-motion`.

## Data hooks
- `DATA[slug]` holds `landmarks`, `places` and `plan` as `{n, d}` entries for all 12 cities.
  - These are **drafts from general knowledge**, with no source-check dates. City pages show a draft notice. Remove it once the entries are verified.
  - Smaller cities (Mbombela, Polokwane, Mahikeng) are the least certain. Check them first.
- Detail cards show Hours, Prices and Access as "Unconfirmed", because there is no verified data.
- "Type" on detail cards is my own classification from the entry name (`kind()` and `KL`).
- `COPY.privacy` is empty, so the Privacy page shows a placeholder.
- The About page uses the four accuracy notes from the original home page footer.
- "My day" selections are saved in the browser (localStorage), per city, and are never shared.

## Not done
- No Blender models yet. The 3D models are procedural stand-ins from `mono()`.
- No Unity WebGL build. It was only described as an optional, lazy-loaded per-city flythrough.
- The `/explore` route was not rebuilt.
- The map outline is a simplified polygon (no Lesotho, approximate borders).
- Not tested in a browser. The live subpages could not be read, so nothing here is matched to their real data.

## Suggested next steps
1. Open it on a phone and check drag, tap, page transitions and the My day route line.
2. Supply the real landmark, place, About and Privacy content, plus verified hours, prices and accessibility.
3. Replace `mono()` with Blender models exported as Draco-compressed glTF (`GLTFLoader` plus `DRACOLoader`), kept to roughly 150 KB each.
4. Port the design into the real repo, which has not been seen.

## Update: data research and Blender
- Blender was not available in the build environment (no `bpy`, no network), so no Blender-made models exist yet. `blender/build_models.py` is an untested script that builds the seven base shapes and exports Draco GLBs.
- Placeholders removed: the dashed slots, the "Unconfirmed" rows and the draft notice are gone. Detail cards show Address, Hours, Fees and Good to know only where a source was found, with the source domain and "Checked 15 Oct 2026".
- Researched entries: Apartheid Museum, Constitution Hill, Hector Pieterson Museum, Table Mountain, Moses Mabhida Stadium, Union Buildings, Voortrekker Monument, Freedom Park, The Big Hole, Oliewenhuis Art Museum, Free State National Botanical Garden, National Museum Bloemfontein, Naval Hill.
- Not researched: Stellenbosch, Pietermaritzburg, Gqeberha, Mbombela, Polokwane, Mahikeng, and most other entries. They show a description only.
- Sources disagree on several prices (Voortrekker Monument, Table Mountain cableway), so those entries say to confirm with the operator.
- The Privacy page now describes what this prototype actually does (no cookies, local-storage "My day", Google Fonts and cdnjs requests). It does not replace a production policy.

## Update: remaining six cities researched (15 Oct 2026)
- Added sourced details for Stellenbosch (Village Museum, Dorp Street, the Braak, Botanical Garden, Oom Samie se Winkel, wine estates), Pietermaritzburg (Tatham Art Gallery, City Hall), Gqeberha (Donkin Reserve, Route 67, Addo), Mbombela (Lowveld National Botanical Garden), Polokwane (Bakone Malapa, Polokwane Game Reserve, Art Museum, Hugh Exton Museum) and Mahikeng (Mahikeng Museum, Mahikeng Game Reserve).
- The Free State National Botanical Garden entry now says sources differ on its hours.
- The Lotlamoreng entry is renamed "Lotlamoreng Dam and Nature Reserve" to match the sources found.
- Still description-only (nothing sourced): Castle of Good Hope, Robben Island, V&A Waterfront, Kirstenbosch, Bo-Kaap, Durban places and City Hall, Juma Masjid, Church Square, Pretoria Art Museum, Pretoria National Botanical Garden, Msunduzi Museum, Railway Station, Alexandra Park, Howick Falls, Fort Frederick, Campanile, Humewood Beach, Fourth Raadsaal, Supreme Court of Appeal, Mbombela Stadium, Sudwala Caves, Makhonjwa Mountains, Kruger gates, Peter Mokaba Stadium, Honoured Dead Memorial, Kimberley City Hall, William Humphreys Art Gallery, McGregor Museum, Duggan-Cronin Gallery, Mahikeng siege cemetery.
- Several sources conflict or are undated (Tatham hours, Polokwane Game Reserve hours, Lowveld garden fees). Those entries say to confirm with the operator.
