"use client";
import { useSyncExternalStore } from "react";
function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}
const getSnapshot = () => document.documentElement.dataset.theme !== "day";
const getServerSnapshot = () => true;
export type ThemeMode = "dark" | "light" | "system";

export default function useTheme() {
  const night = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const theme =
    (typeof document !== "undefined" &&
      (document.documentElement.getAttribute("data-theme-preference") as ThemeMode | null)) ||
    (night ? ("dark" as ThemeMode) : ("light" as ThemeMode));

  const setTheme = (mode: ThemeMode) => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme-preference", mode);
    }
    const val =
      mode === "light"
        ? "day"
        : mode === "dark"
          ? "night"
          : window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "night"
            : "day";
    document.documentElement.dataset.theme = val;
    document.dispatchEvent(
      new CustomEvent("citylit-theme-preference", {
        detail: mode === "system" ? "system" : val,
      }),
    );
  };

  const toggleTheme = () => {
    const next = document.documentElement.dataset.theme === "day" ? "night" : "day";
    document.documentElement.dataset.theme = next;
    document.dispatchEvent(
      new CustomEvent("citylit-theme-preference", {
        detail: next,
      }),
    );
  };

  return { night, theme, setTheme, toggleTheme };
}
