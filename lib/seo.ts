import type { Metadata } from "next";
import { cities, places, categories, categorySlug, cityImages, type Place } from "./data";

export const SITE_URL = "https://citylit.vercel.app";
export const isPreview = process.env.VERCEL_ENV === "preview";
export type City = (typeof cities)[number];
export type Category = (typeof categories)[number];
export const provinces = Array.from(new Set(cities.map((city) => city.province))).map((name) => ({
  name,
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  cities: cities.filter((city) => city.province === name),
}));
export type Province = (typeof provinces)[number];
export type DiscoveryRoute =
  | { kind: "country"; path: string }
  | { kind: "city"; path: string; city: City }
  | { kind: "category"; path: string; city: City; category: Category; places: Place[] }
  | { kind: "place"; path: string; city: City; place: Place }
  | { kind: "province"; path: string; province: Province };

export const absoluteUrl = (path: string) => new URL(path, SITE_URL).href;
export const placeUrl = (place: Place) =>
  `/${place.city}/${categorySlug(place.category)}/${place.id}`;
export const cityPlaces = (city: City) => places.filter((place) => place.city === city.slug);
export const guideUrl = (route: DiscoveryRoute) => `/guides${route.path === "/" ? "" : route.path}`;

/** Resolve a public route against the catalog, including its city/category ownership. */
export function discoveryRoute(path: string[] = []): DiscoveryRoute | null {
  if (!path.length) return { kind: "country", path: "/" };
  if (path.length > 3) return null;
  const city = cities.find((city) => city.slug === path[0]);
  if (!city) return null;
  const url = "/" + path.join("/");
  if (path.length === 1) return { kind: "city", path: url, city };
  const category = categories.find((category) => categorySlug(category) === path[1]);
  if (!category) return null;
  const selected = cityPlaces(city).filter((place) => place.category === category);
  if (path.length === 2) return { kind: "category", path: url, city, category, places: selected };
  const place = selected.find((place) => place.id === path[2]);
  return place ? { kind: "place", path: url, city, place } : null;
}
export function guideRoute(path: string[] = []): DiscoveryRoute | null {
  if (path[0] !== "provinces") return discoveryRoute(path);
  const province = path.length === 2 && provinces.find((province) => province.slug === path[1]);
  return province ? { kind: "province", province, path: `/provinces/${province.slug}` } : null;
}
export function allDiscoveryRoutes(): DiscoveryRoute[] {
  return [
    discoveryRoute()!,
    ...cities.flatMap((city) => [
      discoveryRoute([city.slug])!,
      ...categories.map((category) => discoveryRoute([city.slug, categorySlug(category)])!),
      ...cityPlaces(city).map((place) => discoveryRoute(placeUrl(place).slice(1).split("/"))!),
    ]),
    ...provinces.map((province): DiscoveryRoute => ({
      kind: "province",
      province,
      path: `/provinces/${province.slug}`,
    })),
  ];
}
export function routeTitle(route: DiscoveryRoute): string {
  if (route.kind === "country")
    return route.path === "/destinations" ? "South African city guides" : "Discover South Africa";
  if (route.kind === "province") return `Explore ${route.province.name}`;
  if (route.kind === "place") return `${route.place.name} in ${route.city.name}`;
  if (route.kind === "category")
    return `${route.category.replace("&", "and")} in ${route.city.name}`;
  return `Things to do in ${route.city.name}`;
}
export function routeDescription(route: DiscoveryRoute): string {
  if (route.kind === "country")
    return `Discover ${cities.length} South African destinations across ${provinces.length} provinces. Explore landmarks, find places worth visiting and plan a day with Citylit.`;
  if (route.kind === "province")
    return `Explore ${route.province.name} through ${route.province.cities.map((city) => city.name).join(", ")}. Browse researched city guides, landmarks and places with sources.`;
  if (route.kind === "place") return route.place.description;
  if (route.kind === "category")
    return route.places.length
      ? `Discover ${route.category.toLowerCase()} in ${route.city.name}: ${route.places
          .slice(0, 2)
          .map((place) => place.name)
          .join(" and ")}. Find addresses, photographs and source links.`
      : `This ${route.category.toLowerCase()} chapter in ${route.city.name} is still being researched. Explore the city's available discoveries.`;
  return `${route.city.intro} Discover ${cityPlaces(route.city).length} researched places in ${route.city.name}, ${route.city.province}, with addresses, photographs and source links.`;
}
export const isIndexable = (route: DiscoveryRoute) =>
  route.kind !== "category" || route.places.length > 0;
export function latestCheck(selected: Place[]): string | undefined {
  return selected
    .flatMap((place) => [
      place.checkedAt,
      place.aboutCheckedAt || "",
      ...place.sources.map((source) => source.fetchedAt),
    ])
    .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
    .sort()
    .at(-1);
}
export function metadataForPage(
  title: string,
  description: string,
  path: string,
  index = true,
  image = "/brand/social-card.png",
): Metadata {
  const fullTitle = `${title} | Citylit`;
  const summary = description.replace(/\s+/g, " ").trim().slice(0, 170);
  return {
    title: { absolute: fullTitle },
    description: summary,
    alternates: { canonical: absoluteUrl(path) },
    robots: {
      index: index && !isPreview,
      follow: !isPreview,
      googleBot: {
        index: index && !isPreview,
        follow: !isPreview,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      siteName: "Citylit",
      locale: "en_ZA",
      title: fullTitle,
      description: summary,
      url: absoluteUrl(path),
      images: [{ url: absoluteUrl(image), width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: summary,
      images: [{ url: absoluteUrl(image), alt: title }],
    },
  };
}
export function discoveryMetadata(route: DiscoveryRoute, filtered = false): Metadata {
  return {
    ...metadataForPage(
      routeTitle(route),
      routeDescription(route),
      route.path,
      isIndexable(route) && !filtered,
      `/share${route.path === "/" ? "" : route.path}`,
    ),
    alternates: {
      canonical: absoluteUrl(route.path),
      types: { "text/markdown": absoluteUrl(guideUrl(route)) },
    },
  };
}
/** Escape HTML delimiters rather than trusting text from crawled source pages. */
export const serializeJsonLd = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");
const country = { "@type": "Country", name: "South Africa" };
const cityEntity = (city: City) => ({
  "@type": "City",
  name: city.name,
  containedInPlace: {
    "@type": "AdministrativeArea",
    name: city.province,
    containedInPlace: country,
  },
});
export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#publisher`,
        name: "Citylit",
        url: SITE_URL,
        logo: absoluteUrl("/brand/app-icon-512.png"),
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: "Citylit",
        url: SITE_URL,
        inLanguage: "en-ZA",
        publisher: { "@id": `${SITE_URL}/#publisher` },
      },
    ],
  };
}
export function discoverySchema(route: DiscoveryRoute) {
  const url = absoluteUrl(route.path);
  const trail = [{ name: "South Africa", path: "/" }];
  if (route.kind === "country" && route.path !== "/")
    trail.push({ name: "City guides", path: route.path });
  let about: object = country;
  let selected: { name: string; path: string }[] = cities.map((city) => ({
    name: city.name,
    path: `/${city.slug}`,
  }));
  if (route.kind === "province") {
    about = { "@type": "AdministrativeArea", name: route.province.name, containedInPlace: country };
    trail.push({ name: route.province.name, path: route.path });
    selected = route.province.cities.map((city) => ({ name: city.name, path: `/${city.slug}` }));
  } else if (route.kind !== "country") {
    about = cityEntity(route.city);
    trail.push({ name: route.city.name, path: `/${route.city.slug}` });
    selected = cityPlaces(route.city).map((place) => ({ name: place.name, path: placeUrl(place) }));
    if (route.kind === "category") {
      trail.push({ name: route.category, path: route.path });
      selected = route.places.map((place) => ({ name: place.name, path: placeUrl(place) }));
    }
    if (route.kind === "place") {
      const place = route.place;
      trail.push(
        { name: place.category, path: `/${place.city}/${categorySlug(place.category)}` },
        { name: place.name, path: route.path },
      );
      about = {
        "@type": "Place",
        "@id": `${url}#place`,
        name: place.name,
        description: place.description,
        url,
        address: {
          "@type": "PostalAddress",
          streetAddress: place.address,
          addressLocality: route.city.name,
          addressRegion: route.city.province,
          addressCountry: "ZA",
        },
        containedInPlace: cityEntity(route.city),
        sameAs: [place.website, place.wikipedia].filter(Boolean),
        ...(place.coordinateAccuracy === "venue"
          ? {
              geo: {
                "@type": "GeoCoordinates",
                longitude: place.coords[0],
                latitude: place.coords[1],
              },
            }
          : {}),
        ...(place.imageContext === "venue" && place.images.length
          ? {
              image: place.images.map((photo) => ({
                "@type": "ImageObject",
                contentUrl: absoluteUrl(photo.src),
                caption: photo.alt,
                creditText: photo.author,
                ...(photo.licenseUrl ? { license: photo.licenseUrl } : {}),
                acquireLicensePage: photo.sourceUrl,
              })),
            }
          : {}),
      };
    }
  }
  const page = {
    "@type": route.kind === "place" ? "WebPage" : "CollectionPage",
    "@id": `${url}#page`,
    url,
    name: routeTitle(route),
    description: routeDescription(route),
    inLanguage: "en-ZA",
    isPartOf: { "@id": `${SITE_URL}/#website` },
    ...(route.kind === "place"
      ? { mainEntity: about, citation: route.place.sources.map((source) => source.url) }
      : {
          about,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: selected.length,
            itemListElement: selected.map((entry, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: entry.name,
              url: absoluteUrl(entry.path),
            })),
          },
        }),
  };
  return {
    "@context": "https://schema.org",
    "@graph": [
      page,
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumbs`,
        itemListElement: trail.map((entry, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: entry.name,
          item: absoluteUrl(entry.path),
        })),
      },
    ],
  };
}
export function sharePhoto(route: DiscoveryRoute) {
  if (route.kind === "place") return route.place.images[0];
  if (route.kind === "city" || route.kind === "category") return cityImages[route.city.slug]?.[0];
  return undefined;
}
