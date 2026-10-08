"use client";
import { useEffect } from "react";
export default function OfflineSupport() {
  useEffect(() => {
    try {
      const theme = localStorage.getItem("citylit-theme");
      document.documentElement.dataset.theme =
        theme || (matchMedia("(prefers-color-scheme: light)").matches ? "day" : "night");
    } catch {}
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
  }, []);
  return null;
}
