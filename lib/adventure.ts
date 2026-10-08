import { places, cities, type Place } from "./data";
import sourcedCollections from "../public/data/collections.json" with { type: "json" };
import sourcedEvents from "../public/data/events.json" with { type: "json" };
export const collections = sourcedCollections;
export const events = sourcedEvents;
export const placePath = (p: Place) =>
  `/${p.city}/${p.category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}/${p.id}`;
export function distanceKm(a: number[], b: number[]) {
  const rad = Math.PI / 180;
  const dLat = (b[1] - a[1]) * rad,
    dLon = (b[0] - a[0]) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
export function orderItinerary(ids: string[], start?: number[]) {
  const remaining = Array.from(new Set(ids))
    .map((id) => places.find((p) => p.id === id))
    .filter((p): p is Place => !!p);
  if (!remaining.length) return [];
  // Keep approximate city-reference pins out of geographic optimization.
  let current = start || remaining[0].coords;
  const verified = remaining.filter((p) => p.coordinateAccuracy === "venue");
  const output: Place[] = [];
  while (verified.length) {
    verified.sort((a, b) => distanceKm(current, a.coords) - distanceKm(current, b.coords));
    const next = verified.shift()!;
    output.push(next);
    current = next.coords;
  }
  return [...output, ...remaining.filter((p) => p.coordinateAccuracy !== "venue")];
}
export function tripLink(ids: string[], city: string) {
  const params = new URLSearchParams({ city, trip: ids.join(",") });
  return `/explore?${params}`;
}
export function activeEvents(now = new Date()) {
  const day = now.toISOString().slice(0, 10);
  return events.filter((e) => e.end >= day).sort((a, b) => a.start.localeCompare(b.start));
}
export function matchesFact(p: Place, key: string, value: string | boolean) {
  return p.facts?.[key]?.value === value && p.facts[key].confidence === "verified";
}
export function suggestions(
  city: string,
  mood: string,
  minutes: number,
  budget: string,
  variant = 0,
) {
  const list = places
    .filter((p) => p.city === city && p.category !== "Lodging" && p.category !== "Clubs")
    .filter((p) =>
      budget === "free"
        ? matchesFact(p, "admission", "free")
        : budget === "under200"
          ? matchesFact(p, "admission", "free") ||
            (p.facts?.entryPriceZAR?.confidence === "verified" &&
              typeof p.facts.entryPriceZAR.value === "number" &&
              p.facts.entryPriceZAR.value <= 200)
          : true,
    );
  if (list.length) {
    const cut = variant % list.length;
    list.push(...list.splice(0, cut));
  }
  const preferred =
    mood === "nature"
      ? "Parks & zoos"
      : mood === "culture"
        ? "Entertainment"
        : mood === "night"
          ? "Theatres"
          : null;
  const picked: Place[] = [];
  let remaining = minutes;
  for (const place of list.sort(
    (a, b) => Number(b.category === preferred) - Number(a.category === preferred),
  )) {
    const duration = Number(place.facts?.durationMinutes?.value || 90);
    if (duration <= remaining && picked.length < 3) {
      picked.push(place);
      remaining -= duration;
    }
  }
  return picked;
}
export const cityBySlug = (slug: string) => cities.find((c) => c.slug === slug) || cities[0];
