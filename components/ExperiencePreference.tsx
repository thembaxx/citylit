"use client";
import { useEffect } from "react";
export default function ExperiencePreference({ view }: { view: "3d" | "guide" }) {
  useEffect(() => {
    document.cookie = `citylit-view=${view}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  }, [view]);
  return null;
}
