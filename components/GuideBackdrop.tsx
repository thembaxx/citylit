"use client";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cities } from "../lib/data";

export type MapSelection = { selected: number | null; onSelect: (index: number) => void };
export default function GuideBackdrop({
  essential,
}: {
  selection?: MapSelection;
  essential: boolean;
}) {
  const path = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const [fade, setFade] = useState(1);
  const cityIndex = cities.findIndex((city) => path === `/${city.slug}`);
  const isHome = path === "/";
  const provinceSlug = path.startsWith("/provinces/") ? path.split("/")[2] : null;
  const active = isHome || cityIndex >= 0 || !!provinceSlug || path === "/destinations";
  useEffect(() => {
    const host = ref.current?.closest(".discovery-guide");
    if (!host) return;
    const scroll = () => setFade(Math.max(0, 1 - host.scrollTop / (window.innerHeight * 0.65)));
    scroll();
    host.addEventListener("scroll", scroll, { passive: true });
    return () => host.removeEventListener("scroll", scroll);
  }, [path]);
  return (
    <div
      className={`atlas-map-backdrop${essential ? " is-essential" : ""}`}
      ref={ref}
      aria-hidden="true"
      style={{ opacity: active ? fade : 0.08 }}
    />
  );
}
