"use client";
import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
export type { Discovery } from "../lib/client-data";
import { normalizeDiscovery, type Discovery } from "../lib/client-data";
import { mutateDiscovery, readDiscoveryDocument } from "../lib/discovery-store";

const fallback = normalizeDiscovery(null);
let rawSnapshot = "{}";
const listeners = new Set<() => void>();
let listening = false;
let channel: BroadcastChannel | undefined;

function publish(value: Discovery, broadcast = true) {
  rawSnapshot = JSON.stringify(value);
  listeners.forEach((listener) => listener());
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("citylit:discovery-changed"));
    if (broadcast) channel?.postMessage("changed");
  }
}

function refresh() {
  void readDiscoveryDocument().then((value) => publish(value, false)).catch(() => {
    // Keep the last known snapshot visible; mutations still fail closed.
  });
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  if (!listening && typeof window !== "undefined") {
    window.addEventListener("storage", () => refresh());
    window.addEventListener("citylit:discovery-changed", () => listeners.forEach((listener) => listener()));
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel("citylit-discovery");
      channel.onmessage = refresh;
    }
    listening = true;
    refresh();
  }
  return () => listeners.delete(fn);
}

function snapshot() {
  return rawSnapshot;
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
  const update = useCallback(
    async (change: Partial<Discovery> | ((previous: Discovery) => Partial<Discovery>)) => {
      try {
        const next = await mutateDiscovery(change);
        publish(next);
        return true;
      } catch {
        return false;
      }
    },
    [],
  );
  useEffect(() => {
    refresh();
  }, []);
  return { state, update };
}
