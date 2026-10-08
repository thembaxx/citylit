"use client";
import { useSyncExternalStore } from "react";
function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}
const getSnapshot = () => document.documentElement.dataset.theme !== "day";
const getServerSnapshot = () => true;
export default function useTheme() {
  const night = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const toggleTheme = () => {
    document.dispatchEvent(
      new CustomEvent("citylit-theme-preference", {
        detail: document.documentElement.dataset.theme === "day" ? "night" : "day",
      }),
    );
  };
  return { night, toggleTheme };
}
