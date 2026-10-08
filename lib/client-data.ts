import { places } from "./data";
const byId = new Map(places.map((place) => [place.id, place]));
export const MAX_TRIP_STOPS = 30;
export function publicHttpsUrl(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    value.length > 2048 ||
    Array.from(value).some(
      (character) => character.charCodeAt(0) <= 32 || character.charCodeAt(0) === 127,
    )
  )
    return false;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.port &&
      /^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(host) &&
      !/^\d+(?:\.\d+){3}$/.test(host) &&
      !/(?:^|\.)(?:localhost|local|internal|test|invalid)$/.test(host)
    );
  } catch {
    return false;
  }
}
function ids(value: unknown, limit = places.length, city?: string) {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .slice(0, 1000)
        .filter(
          (id): id is string =>
            typeof id === "string" && byId.has(id) && (!city || byId.get(id)!.city === city),
        ),
    ),
  ).slice(0, limit);
}
export type Discovery = {
  saved: string[];
  visited: string[];
  itinerary: string[];
  passport: boolean;
  essential: boolean;
};
export function normalizeDiscovery(value: unknown): Discovery {
  const input =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  return {
    saved: ids(Array.isArray(value) ? value : input.saved),
    visited: ids(input.visited),
    itinerary: ids(input.itinerary, MAX_TRIP_STOPS),
    passport: typeof input.passport === "boolean" ? input.passport : true,
    essential: typeof input.essential === "boolean" ? input.essential : false,
  };
}
export function parseSharedTrip(value: string | null, city: string) {
  return value && value.length <= 4096 ? ids(value.split(","), MAX_TRIP_STOPS, city) : [];
}
export type Correction = {
  id: string;
  placeId: string;
  field: string;
  value: string;
  source: string;
  createdAt: string;
  status: string;
};
export function normalizeCorrections(value: unknown): Correction[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 100)
    .filter(
      (row): row is Correction =>
        !!row &&
        typeof row === "object" &&
        typeof row.id === "string" &&
        /^[a-zA-Z0-9-]{1,80}$/.test(row.id) &&
        byId.has(row.placeId) &&
        ["address", "accessibility", "hours", "pricing", "photos", "other"].includes(row.field) &&
        typeof row.value === "string" &&
        row.value.length > 0 &&
        row.value.length <= 1200 &&
        publicHttpsUrl(row.source) &&
        typeof row.createdAt === "string" &&
        Number.isFinite(Date.parse(row.createdAt)) &&
        ["needs-review", "reviewed", "rejected"].includes(row.status),
    );
}
export function readCorrections(): Correction[] {
  try {
    const raw = localStorage.getItem("citylit-corrections") || "[]";
    return raw.length <= 200000 ? normalizeCorrections(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}
