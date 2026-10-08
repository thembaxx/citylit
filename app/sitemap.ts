import type { MetadataRoute } from "next";
import {
  allDiscoveryRoutes,
  isIndexable,
  absoluteUrl,
  latestCheck,
  cityPlaces,
  isPreview,
} from "../lib/seo";
export default function sitemap(): MetadataRoute.Sitemap {
  if (isPreview) return [];
  return [
    ...allDiscoveryRoutes()
      .filter(isIndexable)
      .map((route) => ({
        url: absoluteUrl(route.path),
        ...(route.kind === "place"
          ? { lastModified: latestCheck([route.place]) }
          : "city" in route
            ? { lastModified: latestCheck(cityPlaces(route.city)) }
            : {}),
      })),
    ...["/destinations", "/about", "/privacy", "/brand", "/explore"].map((path) => ({
      url: absoluteUrl(path),
    })),
  ];
}
