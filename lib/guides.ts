import { categories, cities, categorySlug, places, type Place } from "./data";
import {
  absoluteUrl,
  cityPlaces,
  placeUrl,
  routeDescription,
  routeTitle,
  latestCheck,
  provinces,
  type DiscoveryRoute,
} from "./seo";

const text = (value: string) => value.replace(/[\r\n]+/g, " ").replace(/[\\`*_[\]<>]/g, "\\$&");
const link = (label: string, path: string) => `[${text(label)}](${absoluteUrl(path)})`;
export const evidenceNote =
  "Source check dates describe our catalog research, not live confirmation by the venue. Opening hours, prices and accessibility can change. Unknown facts are not confirmed unavailable. City-reference coordinates and city photographs must not be treated as venue locations or venue photos.";
function placeMarkdown(place: Place, heading = "##") {
  const city = cities.find((city) => city.slug === place.city)!;
  return [
    `${heading} ${text(place.name)}`,
    `\n${place.description}`,
    `\n- City: ${city.name}, ${city.province}, South Africa`,
    `- Category: ${place.category}`,
    `- Address: ${text(place.address)}`,
    `- Citylit page: ${absoluteUrl(placeUrl(place))}`,
    `- Official website: ${place.website}`,
    ...(place.wikipedia ? [`- Wikipedia: ${place.wikipedia}`] : []),
    `- Sources checked: ${place.checkedAt}`,
    `- Coordinates: longitude ${place.coords[0]}, latitude ${place.coords[1]} (${place.coordinateAccuracy === "venue" ? "venue pin; entrance may be unverified" : "CITY REFERENCE ONLY; venue coordinates unknown"})`,
    `- Coordinate source: ${text(place.coordinateSource)}`,
    ...(place.about
      ? [
          `\n${place.about}`,
          ...(place.aboutSource
            ? [
                `\nAbout source: ${place.aboutSource}; checked ${place.aboutCheckedAt || place.checkedAt}${place.aboutLicense ? `; license ${place.aboutLicense}` : ""}.`,
              ]
            : []),
        ]
      : []),
    `\n${heading}# Practical facts`,
    ...Object.entries(place.facts || {}).map(
      ([key, fact]) =>
        `- ${key}: ${fact.value === null || fact.confidence === "unknown" ? "Unknown / unconfirmed" : text(String(fact.value))} (${fact.confidence})${fact.checkedAt ? `; checked ${fact.checkedAt}` : ""}${fact.source ? `; source: ${text(fact.source)}` : ""}`,
    ),
    `\n${heading}# Sources`,
    ...place.sources.map(
      (source) =>
        `- ${text(source.title)}: ${source.url}; fetched ${source.fetchedAt}; ${source.status === "fetched" ? "retrieved during research" : text(source.status)}`,
    ),
    `\n${heading}# Photographs and credits`,
    ...(place.images.length
      ? place.images.map(
          (photo) =>
            `- ${absoluteUrl(photo.src)} — ${text(photo.alt)}. ${place.imageContext === "venue" ? "Venue photograph" : "CITY ATMOSPHERE, NOT A VENUE PHOTOGRAPH"}. Author: ${text(photo.author)}; license: ${text(photo.license)}${photo.licenseUrl ? ` (${photo.licenseUrl})` : ""}; source: ${photo.sourceUrl}`,
        )
      : ["- No cached photographs. Check the official venue website."]),
  ].join("\n");
}
export function guideMarkdown(route: DiscoveryRoute) {
  const lines = [
    `# ${routeTitle(route)} — Citylit`,
    `\n${routeDescription(route)}`,
    `\nCanonical page: ${absoluteUrl(route.path)}`,
    `\n${evidenceNote}`,
  ];
  if (route.kind === "country" || route.kind === "province") {
    const selected = route.kind === "country" ? cities : route.province.cities;
    lines.push(
      "\n## City guides",
      ...selected.map(
        (city) =>
          `- ${link(city.name, `/${city.slug}`)} — ${city.province}. ${city.intro} ${cityPlaces(city).length} researched places. ${link("Markdown guide", `/guides/${city.slug}`)}.`,
      ),
    );
    if (route.kind === "country")
      lines.push(
        "\n## Provinces",
        ...provinces.map((province) => `- ${link(province.name, `/provinces/${province.slug}`)}`),
      );
  } else if (route.kind === "place") lines.push("\n" + placeMarkdown(route.place));
  else {
    const selected = route.kind === "category" ? route.places : cityPlaces(route.city);
    lines.push(
      `\nLatest source check: ${latestCheck(selected) || "No places researched in this chapter yet"}`,
    );
    if (route.kind === "city")
      lines.push(
        "\n## Landmarks",
        ...route.city.landmarks.map((name) => `- ${text(name)}`),
        "\n## Available categories",
        ...categories
          .filter((category) => selected.some((place) => place.category === category))
          .map(
            (category) => `- ${link(category, `/${route.city.slug}/${categorySlug(category)}`)}`,
          ),
      );
    lines.push("\n## Places", ...selected.map((place) => "\n" + placeMarkdown(place, "###")));
  }
  lines.push(
    `\n## Further reading\n${link("How Citylit researches its guides", "/about")} · ${link("Privacy and data", "/privacy")}\n\nOriginal descriptions are Citylit editorial content. Wikipedia excerpts and photographs retain their separately linked licenses. No blanket license covers all third-party material.\n`,
  );
  return lines.join("\n");
}
export function llmsIndex() {
  return (
    [
      "# Citylit",
      `\n> Every city has a spark. A source-linked discovery guide to ${cities.length} South African destinations, ${provinces.length} provinces and ${places.length} researched places.`,
      `\n${evidenceNote}`,
      "\n## Start here",
      `- ${link("Destination directory", "/destinations")}: Browse provinces and city chapters.`,
      `- ${link("Complete text reference", "/llms-full.txt")}: Catalog entries, practical-fact confidence, source dates and individual photo credits.`,
      `- ${link("About the research", "/about")}: Coverage, data limitations and attribution.`,
      `- ${link("Structured public catalog", "/data/places.json")}: The same venue facts used by the app.`,
      `- ${link("Sitemap", "/sitemap.xml")}: Canonical, populated public pages.`,
      "\n## Destinations",
      ...cities.map(
        (city) =>
          `- ${link(`${city.name}, ${city.province}`, `/guides/${city.slug}`)}: Markdown guide and source-linked places.`,
      ),
      "\n## Use and attribution",
      "Cite the specific Citylit place page and the underlying source for a factual claim. Preserve uncertainty, research dates and photograph context. Hours, prices, live availability, ratings and business amenities must not be inferred. The llms.txt files are a reading aid, not a guarantee of indexing or a change to third-party licensing.",
    ].join("\n") + "\n"
  );
}
export function llmsFull() {
  return (
    llmsIndex() +
    "\n---\n\n" +
    cities
      .map((city) => guideMarkdown({ kind: "city", city, path: `/${city.slug}` }))
      .join("\n---\n\n")
  );
}
export function markdownResponse(body: string, canonical?: string) {
  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "X-Robots-Tag": "noindex, follow",
      ...(canonical
        ? { Link: `<${absoluteUrl(canonical)}>; rel="canonical"; type="text/html"` }
        : {}),
    },
  });
}
