"use client";
import { useMemo, useSyncExternalStore } from "react";
const key = "citylit-discovery-v2";
export type { Discovery } from "../lib/client-data";
import { normalizeDiscovery, type Discovery } from "../lib/client-data";
const fallback = normalizeDiscovery(null);
const listeners = new Set<() => void>();
let listening = false;
function subscribe(fn: () => void) {
  listeners.add(fn);
  if (!listening && typeof window !== "undefined") {
    window.addEventListener("storage", () => listeners.forEach((l) => l()));
    // Root providers and lazy-loaded screens can live in separate client bundles.
    window.addEventListener("citylit:discovery-changed", () => listeners.forEach((l) => l()));
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
      return raw.length <= 200000 ? normalizeDiscovery(JSON.parse(raw)) : fallback;
    } catch {
      return fallback;
    }
  }, [raw]);
  const update = (change: Partial<Discovery> | ((previous: Discovery) => Partial<Discovery>)) => {
    // Read the latest store when an action fires, including updates from another component.
    let previous = state;
    try {
      previous = normalizeDiscovery(JSON.parse(snapshot()));
    } catch {}
    const next = normalizeDiscovery({
      ...previous,
      ...(typeof change === "function" ? change(previous) : change),
    });
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      return false;
    }
    try {
      localStorage.setItem("mzansi-saved", JSON.stringify(next.saved));
    } catch {}
    if (next.saved.some((id) => !previous.saved.includes(id)))
      window.dispatchEvent(new CustomEvent("citylit:spark-saved"));
    window.dispatchEvent(new Event("citylit:discovery-changed"));
    return true;
  };
  return { state, update };
}
