import type { Place } from "./data";

export const FEASIBILITY_STORAGE_KEY = "citylit-itinerary-feasibility-v1";
export type OpeningEvidence = {
  status: "unknown" | "open" | "closed";
  intervals: string;
  source: string;
  checkedAt: string;
  appliesOn: string;
};
export type TravelLeg = {
  minutes: number | null;
  source: "manual" | "route";
  provider: string;
  checkedAt: string;
};
export type TravelEstimate = { minutes: number[]; source: string; checkedAt: string };
export type FeasibilitySettings = {
  version: 1;
  date: string;
  start: string;
  budgetMinutes: number;
  visits: Record<string, number | null>;
  openings: Record<string, OpeningEvidence>;
  travel: Record<string, TravelLeg>;
};
export const legKey = (from: string, to: string) => JSON.stringify([from, to]);
export const feasibilityPlanKey = (places: Place[]) =>
  JSON.stringify([...new Set(places.map((place) => place.id))].sort());
export function minuteOfDay(value: string) {
  if (value === "24:00") return 1440;
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
  return Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
}
export function validPlanDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const day = new Date(value + "T12:00:00Z");
  return Number.isFinite(day.getTime()) && day.toISOString().slice(0, 10) === value;
}
export function formatPlanTime(value: number | null) {
  if (value === null) return "Time not established";
  const day = Math.floor(value / 1440),
    minutes = value % 1440;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}${day ? ` (+${day} day)` : ""}`;
}
export function openingIntervals(value: string): { start: number; end: number }[] | null {
  const parts = value.split(",").map((part) => part.trim());
  if (!value.trim() || parts.length > 6) return null;
  const result: { start: number; end: number }[] = [];
  for (const part of parts) {
    const match = part.match(/^(\d{2}:\d{2})\s*[-–]\s*(\d{2}:\d{2})$/);
    if (!match) return null;
    const start = minuteOfDay(match[1]),
      end = minuteOfDay(match[2]);
    if (start === null || start === 1440 || end === null || end === start) return null;
    result.push({ start, end: end < start ? end + 1440 : end });
  }
  return result;
}
export function defaultFeasibilitySettings(now = new Date()): FeasibilitySettings {
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return {
    version: 1,
    date,
    start: "09:00",
    budgetMinutes: 240,
    visits: {},
    openings: {},
    travel: {},
  };
}
export function emptyOpening(date: string): OpeningEvidence {
  return { status: "unknown", intervals: "", source: "", checkedAt: "", appliesOn: date };
}
export function visitMinutes(place: Place, settings: FeasibilitySettings): number | null {
  if (Object.hasOwn(settings.visits, place.id)) {
    const value = settings.visits[place.id];
    return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 1440
      ? value
      : null;
  }
  const fact = place.facts?.durationMinutes;
  return fact &&
    fact.confidence !== "unknown" &&
    typeof fact.value === "number" &&
    Number.isFinite(fact.value) &&
    fact.value > 0 &&
    fact.value <= 1440
    ? fact.value
    : null;
}
export function assessItinerary(places: Place[], settings: FeasibilitySettings) {
  let cursor: number | null = minuteOfDay(settings.start);
  let minimumMinutes = 0;
  let incomplete =
    cursor === null ||
    !validPlanDate(settings.date) ||
    !minutes(settings.budgetMinutes) ||
    settings.budgetMinutes === 0;
  const rows = places.map((place, index) => {
    const warnings: string[] = [];
    const leg = index ? settings.travel[legKey(places[index - 1].id, place.id)] : undefined;
    if (index) {
      if (leg?.minutes === null || leg?.minutes === undefined) {
        warnings.push("Travel time from the previous stop is unknown.");
        cursor = null;
        incomplete = true;
      } else {
        minimumMinutes += leg.minutes;
        if (cursor !== null) cursor += leg.minutes;
      }
    }
    const duration = visitMinutes(place, settings);
    if (duration === null) {
      warnings.push("Visit duration needs an estimate.");
      incomplete = true;
    } else minimumMinutes += duration;
    const arrival = cursor;
    const departure = arrival !== null && duration !== null ? arrival + duration : null;
    cursor = departure;
    if (place.coordinateAccuracy !== "venue")
      warnings.push("Approximate city-reference pin; confirm the venue entrance before routing.");
    const evidence = settings.openings[place.id];
    let openingStatus: "unknown" | "fits" | "closed" = "unknown";
    if (!evidence || evidence.status === "unknown")
      warnings.push("Opening hours are unknown; check the venue for this date.");
    else if (evidence.appliesOn !== settings.date)
      warnings.push(`Opening evidence applies to ${evidence.appliesOn}, not the selected date.`);
    else if (!evidence.source.trim() || !validPlanDate(evidence.checkedAt))
      warnings.push("Opening evidence needs a source and a date checked.");
    else if (arrival !== null && arrival >= 1440)
      warnings.push("Arrival falls on another date; opening hours need checking for that day.");
    else if (evidence.status === "closed") {
      openingStatus = "closed";
      warnings.push("Marked closed on the selected date.");
    } else {
      const intervals = openingIntervals(evidence.intervals);
      if (!intervals)
        warnings.push("Opening intervals need valid times, for example 09:00-12:00, 13:00-17:00.");
      else if (arrival === null || departure === null)
        warnings.push("Arrival and departure are needed to check opening hours.");
      else if (intervals.some((interval) => arrival >= interval.start && departure <= interval.end))
        openingStatus = "fits";
      else {
        openingStatus = "closed";
        warnings.push("The planned visit falls outside the entered opening interval.");
      }
    }
    return { place, arrival, departure, duration, leg, openingStatus, warnings };
  });
  return {
    rows,
    minimumMinutes,
    incomplete,
    overBudget: minimumMinutes > settings.budgetMinutes,
    finish: cursor,
    openingUnresolved: rows.some((row) => row.openingStatus === "unknown"),
    closed: rows.some((row) => row.openingStatus === "closed"),
  };
}

const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const minutes = (value: unknown) =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= 0 &&
  value <= 1440 &&
  Number.isInteger(value);
const bounded = (value: unknown, length: number): value is string =>
  typeof value === "string" && value.length <= length;
export function validFeasibilitySettings(value: unknown): value is FeasibilitySettings {
  if (
    !object(value) ||
    value.version !== 1 ||
    !validPlanDate(value.date) ||
    typeof value.start !== "string" ||
    minuteOfDay(value.start) === null ||
    value.start === "24:00" ||
    !minutes(value.budgetMinutes) ||
    value.budgetMinutes === 0
  )
    return false;
  if (
    !object(value.visits) ||
    Object.keys(value.visits).length > 30 ||
    !Object.values(value.visits).every((entry) => entry === null || minutes(entry))
  )
    return false;
  if (
    !object(value.travel) ||
    Object.keys(value.travel).length > 120 ||
    !Object.values(value.travel).every(
      (entry) =>
        object(entry) &&
        (entry.minutes === null || minutes(entry.minutes)) &&
        ["manual", "route"].includes(String(entry.source)) &&
        bounded(entry.provider, 300) &&
        bounded(entry.checkedAt, 40),
    )
  )
    return false;
  if (
    !object(value.openings) ||
    Object.keys(value.openings).length > 30 ||
    !Object.values(value.openings).every(
      (entry) =>
        object(entry) &&
        ["unknown", "open", "closed"].includes(String(entry.status)) &&
        bounded(entry.intervals, 150) &&
        bounded(entry.source, 1000) &&
        bounded(entry.checkedAt, 10) &&
        bounded(entry.appliesOn, 10),
    )
  )
    return false;
  return true;
}
type StoredPlan = { key: string; settings: FeasibilitySettings };
function storedPlans(raw: string | null): StoredPlan[] {
  if (raw === null) return [];
  if (raw.length > 1000000)
    throw new Error("Saved planning settings are too large to read safely.");
  const value: unknown = JSON.parse(raw);
  if (
    !object(value) ||
    value.version !== 1 ||
    !Array.isArray(value.plans) ||
    value.plans.length > 8 ||
    !value.plans.every(
      (plan) => object(plan) && bounded(plan.key, 6000) && validFeasibilitySettings(plan.settings),
    )
  )
    throw new Error("Saved planning settings could not be read safely and were left unchanged.");
  const plans = value.plans as StoredPlan[];
  if (new Set(plans.map((plan) => plan.key)).size !== plans.length)
    throw new Error("Duplicate saved plans were left unchanged.");
  return plans;
}
type PlanStorage = Pick<Storage, "getItem" | "setItem">;
export function loadFeasibility(storage: PlanStorage, key: string) {
  try {
    return {
      settings:
        storedPlans(storage.getItem(FEASIBILITY_STORAGE_KEY)).find((plan) => plan.key === key)
          ?.settings ?? defaultFeasibilitySettings(),
      error: "",
    };
  } catch (error) {
    return {
      settings: defaultFeasibilitySettings(),
      error: error instanceof Error ? error.message : "Local planning settings are unavailable.",
    };
  }
}
export function saveFeasibility(storage: PlanStorage, key: string, settings: FeasibilitySettings) {
  try {
    if (!validFeasibilitySettings(settings))
      throw new Error("Check the date, time and minute values before saving.");
    const plans = storedPlans(storage.getItem(FEASIBILITY_STORAGE_KEY)).filter(
      (plan) => plan.key !== key,
    );
    if (plans.length >= 8)
      throw new Error(
        "Eight plans already have saved settings. Clear an older plan’s settings before saving a new one.",
      );
    storage.setItem(
      FEASIBILITY_STORAGE_KEY,
      JSON.stringify({ version: 1, plans: [...plans, { key, settings }] }),
    );
    return "";
  } catch (error) {
    return error instanceof Error
      ? error.message
      : "This browser could not save planning settings.";
  }
}
export function clearFeasibility(storage: PlanStorage, key: string) {
  try {
    const plans = storedPlans(storage.getItem(FEASIBILITY_STORAGE_KEY)).filter(
      (plan) => plan.key !== key,
    );
    storage.setItem(FEASIBILITY_STORAGE_KEY, JSON.stringify({ version: 1, plans }));
    return "";
  } catch {
    return "Saved settings could not be cleared. Existing data was left unchanged.";
  }
}
