"use client";
import Link from "next/link";
import { useState } from "react";
import dynamic from "next/dynamic";
import KhweziMark from "./KhweziMark";
import MagneticButton from "./ui/MagneticButton";
import type { KhweziPose } from "../lib/brand";
import { ArrowDown, ArrowUpRight, ArrowCounterClockwise } from "@phosphor-icons/react";
import { cities } from "../lib/data";
import GuideShell from "./GuideShell";
import CityDirectory from "./CityDirectory";

const KhweziView = dynamic(() => import("./KhweziView"), {
  ssr: false,
  loading: () => <KhweziMark pose="welcome" />,
});

export default function DiscoveryHome() {
  const [selected, setSelected] = useState<number | null>(null);
  const [mascotPose, setMascotPose] = useState<KhweziPose>("welcome");
  const city = selected === null ? null : cities[selected];
  return (
    <GuideShell mapSelection={{ selected, onSelect: setSelected }}>
      <section className="atlas-hero">
        <div className="atlas-hero-copy">
          <h1>
            Discover
            <br />
            <em>South</em> Africa<span className="atlas-title-period">.</span>
          </h1>
        </div>
        <div className="atlas-map-stage" aria-hidden="true" />
        <div className="atlas-hero-bottom">
          <div className="atlas-beacon-card" aria-live="polite">
            <div className="atlas-beacon-content">
              <label className="atlas-map-select">
                <span className="sr-only">Choose a city on the map</span>
                <select
                  aria-label="Choose a city on the map"
                  value={selected === null ? "" : String(selected)}
                  onChange={(event) =>
                    setSelected(event.target.value === "" ? null : Number(event.target.value))
                  }
                >
                  <option value="">Choose a city</option>
                  {cities.map((item, index) => (
                    <option key={item.slug} value={index}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              {city && (
                <>
                  <h2>{city.name}</h2>
                  <p>{city.intro}</p>
                </>
              )}
            </div>
            <div className="atlas-beacon-mascot">
              <div className="atlas-mascot-view">
                <KhweziView pose={mascotPose} index={6} />
              </div>
              <MagneticButton
                className="atlas-mascot-action"
                strength={0.13}
                onClick={() =>
                  setMascotPose((current) => (current === "saved" ? "welcome" : "saved"))
                }
              >
                {mascotPose === "saved" ? "Khwezi has hopped!" : "Make Khwezi hop"}
              </MagneticButton>
            </div>
            <div className="atlas-beacon-actions">
              <Link href={city ? `/${city.slug}` : "/destinations"} className="atlas-text-link">
                {city ? "Explore the city" : "Browse all city guides"} <ArrowUpRight size={18} />
              </Link>
              {city && (
                <MagneticButton
                  aria-label="Reset map selection"
                  strength={0.12}
                  onClick={() => setSelected(null)}
                >
                  <ArrowCounterClockwise size={19} />
                </MagneticButton>
              )}
            </div>
          </div>
        </div>
        <a href="#cities" className="atlas-scroll-cue">
          <ArrowDown size={16} /> Explore cities
        </a>
      </section>
      <CityDirectory compact />
    </GuideShell>
  );
}
