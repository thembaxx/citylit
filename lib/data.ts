export const categories = [
  "Entertainment",
  "Lodging",
  "Theatres",
  "Parks & zoos",
  "Clubs",
] as const;
/** Short chapter lines. Original Citylit copy, not a venue listing. */
export const categoryBlurbs: Record<(typeof categories)[number], string> = {
  Entertainment: "Museums, play, and the rooms where a city shows off.",
  Lodging: "Stays worth knowing when the day runs long.",
  Theatres: "Stages for drama, dance, music and after-dark stories.",
  "Parks & zoos": "Gardens, reserves and green rooms where a city slows down.",
  Clubs: "Music, sundowners and a later chapter of the night.",
};
import sourcedCities from "../public/data/cities.json" with { type: "json" };
export const cities = sourcedCities;
import sourcedPlaces from "../public/data/places.json" with { type: "json" };
import sourcedLandmarks from "../public/data/landmarks.json" with { type: "json" };
import sourcedCityImages from "../public/data/city-images.json" with { type: "json" };
export type Photo = {
  src: string;
  alt: string;
  author: string;
  license: string;
  licenseUrl: string;
  sourceUrl: string;
  filename: string;
};
export type Place = {
  id: string;
  name: string;
  city: string;
  category: (typeof categories)[number];
  description: string;
  about?: string;
  aboutSource?: string;
  aboutCheckedAt?: string;
  aboutLicense?: string;
  locationGroup?: string;
  goodToKnow?: { label: string; icon: "wifi" | "pool" | "fitness" | "info"; source: string }[];
  address: string;
  coords: number[];
  coordinateAccuracy: "venue" | "city";
  coordinateSource: string;
  website: string;
  wikipedia?: string;
  images: Photo[];
  imageContext: "venue" | "city";
  sources: { url: string; title: string; fetchedAt: string; status: string }[];
  checkedAt: string;
  district?: string;
  visitNote?: string;
  facts?: Record<string, PracticalFact>;
  coordinateRole?: "entrance" | "venue" | "city";
};
function normalizeFacts(facts: object): Record<string, PracticalFact> {
  const output: Record<string, PracticalFact> = {};
  for (const [key, fact] of Object.entries(facts)) {
    if (
      !fact ||
      (!["string", "number", "boolean"].includes(typeof fact.value) && fact.value !== null) ||
      typeof fact.source !== "string" ||
      typeof fact.checkedAt !== "string" ||
      !["verified", "editorial-estimate", "unknown"].includes(fact.confidence)
    )
      throw new Error(`Invalid practical fact: ${key}`);
    output[key] = fact;
  }
  return output;
}
export const places = sourcedPlaces.map(({ facts, ...place }) => ({
  ...place,
  facts: normalizeFacts(facts || {}),
})) as Place[];
export const landmarkSources = sourcedLandmarks;
export const cityImages = sourcedCityImages as Record<string, Photo[]>;
export const categorySlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export type PracticalFact = {
  value: string | number | boolean | null;
  source: string;
  checkedAt: string;
  confidence: "verified" | "editorial-estimate" | "unknown";
};
export type VenueEvent = {
  id: string;
  placeId: string;
  title: string;
  start: string;
  end: string;
  source: string;
  checkedAt: string;
};
