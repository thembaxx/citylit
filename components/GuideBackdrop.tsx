"use client";
import dynamic from "next/dynamic";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cities } from "../lib/data";
const GlowMap = dynamic(() => import("./GlowMap"), { ssr: false });

export type MapSelection = { selected: number | null; onSelect: (index: number) => void };
export default function GuideBackdrop({
  selection,
  essential,
}: {
  selection?: MapSelection;
  essential: boolean;
}) {
  const path = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [fade, setFade] = useState(1);
  const cityIndex = cities.findIndex((city) => path === `/${city.slug}`);
  const isHome = path === "/";
  const provinceSlug = path.startsWith("/provinces/") ? path.split("/")[2] : null;
  const province =
    provinceSlug ||
    params
      .get("province")
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
  const active = isHome || cityIndex >= 0 || !!provinceSlug || path === "/destinations";
  const focus = province
    ? cities.flatMap((city, index) =>
        city.province.toLowerCase().replace(/[^a-z0-9]+/g, "-") === province ? [index] : [],
      )
    : undefined;
  useEffect(() => {
    const host = ref.current?.closest(".discovery-guide");
    if (!host) return;
    const scroll = () => setFade(Math.max(0, 1 - host.scrollTop / (window.innerHeight * 0.65)));
    scroll();
    host.addEventListener("scroll", scroll, { passive: true });
    return () => host.removeEventListener("scroll", scroll);
  }, [path]);
  return (
    <div className="atlas-map-backdrop" ref={ref} aria-hidden={!active || fade < 0.1}>
      <GlowMap
        selected={selection?.selected ?? (cityIndex >= 0 ? cityIndex : null)}
        onSelect={selection?.onSelect || ((index) => router.push(`/${cities[index].slug}`))}
        focus={focus}
        opacity={active ? fade : 0.08}
        interactive={active && fade > 0.1}
        animate={!essential}
      />
    </div>
  );
}
