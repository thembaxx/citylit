import { type Place } from "./data";
export function qualityIssues(place: Place, now = new Date()) {
  const issues: string[] = [];
  if (place.coordinateAccuracy !== "venue") issues.push("Missing venue pin");
  if (place.coordinateRole !== "entrance") issues.push("Entrance not verified");
  if (place.imageContext !== "venue" || !place.images.length)
    issues.push("Needs venue photographs");
  if (place.sources.some((s) => s.status === "unavailable"))
    issues.push("Source unavailable at last crawl");
  if (
    now.getTime() - new Date(place.checkedAt).getTime() > 30 * 86400000 ||
    Object.values(place.facts || {}).some(
      (fact) =>
        fact.confidence === "verified" &&
        now.getTime() - new Date(fact.checkedAt).getTime() > 30 * 86400000,
    )
  )
    issues.push("Facts need rechecking");
  if (
    place.aboutCheckedAt &&
    now.getTime() - new Date(place.aboutCheckedAt).getTime() > 180 * 86400000
  )
    issues.push("Historical context needs review");
  if (place.facts?.stepFreeEntrance?.value == null) issues.push("Access details need review");
  return issues;
}
