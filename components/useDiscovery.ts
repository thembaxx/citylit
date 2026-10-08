"use client";
import { useMemo, useSyncExternalStore } from "react";
const key = "citylit-discovery-v2";
export type Discovery = {
  saved: string[];
  visited: string[];
  itinerary: string[];
  passport: boolean;
  essential: boolean;
};
const fallback: Discovery = {
  saved: [],
  visited: [],
  itinerary: [],
  passport: true,
  essential: false,
};
const listeners = new Set<() => void>();
let listening = false;
function subscribe(fn: () => void) {
  listeners.add(fn);
  if (!listening && typeof window !== "undefined") {
    window.addEventListener("storage", () => listeners.forEach((l) => l()));
    listening = true;
  }
  return () => {
    listeners.delete(fn);
  };
}
function snapshot() {
  try {
    return localStorage.getItem(key) || localStorage.getItem("mzansi-saved") || "{}";
  } catch {
    return "{}";
  }
}
export function useDiscovery() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => "{}");
  const state = useMemo<Discovery>(() => {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed))
        return { ...fallback, saved: parsed.filter((v) => typeof v === "string") };
      return {
        ...fallback,
        ...parsed,
        saved: Array.isArray(parsed.saved) ? parsed.saved : [],
        visited: Array.isArray(parsed.visited) ? parsed.visited : [],
        itinerary: Array.isArray(parsed.itinerary) ? parsed.itinerary : [],
      };
    } catch {
      return fallback;
    }
  }, [raw]);
  const update = (change: Partial<Discovery> | ((previous: Discovery) => Partial<Discovery>)) => {
    const next = { ...state, ...(typeof change === "function" ? change(state) : change) };
    try {
      localStorage.setItem(key, JSON.stringify(next));
      localStorage.setItem("mzansi-saved", JSON.stringify(next.saved));
      if (next.saved.some((id) => !state.saved.includes(id)))
        window.dispatchEvent(new CustomEvent("citylit:spark-saved"));
    } catch {}
    listeners.forEach((l) => l());
  };
  return { state, update };
}
