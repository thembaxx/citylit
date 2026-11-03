"use client";
import Link from "next/link";
import { useState } from "react";
import dynamic from "next/dynamic";
import KhweziMark from "./KhweziMark";
import MagneticButton from "./ui/MagneticButton";
import type { KhweziPose } from "../lib/brand";
import {
  ArrowDown,
  ArrowUpRight,
  ArrowCounterClockwise,
  Compass,
  MapPin,
  BookmarkSimple,
} from "@phosphor-icons/react";
import { cities, places } from "../lib/data";
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
          <p className="atlas-eyebrow">SOUTH AFRICA / CITY GUIDES</p>
          <h1>
            Discover
            <br />
            <em>South</em> Africa<span className="atlas-title-period">.</span>
          </h1>
          <p className="atlas-hero-sub">Follow the glow.</p>
          <p className="atlas-hero-hint">Tap a glowing city to begin.</p>
        </div>
        <div className="atlas-map-stage">
          <div className="atlas-map-coordinate" aria-hidden="true">
            22° — 35° S<br />
            16° — 33° E
          </div>
        </div>
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
              <p className="atlas-eyebrow">{city ? city.province : "YOUR NEXT CHAPTER"}</p>
              <h2>{city ? city.name : "Where to?"}</h2>
              <p>{city ? city.intro : "Pick a city and explore its places."}</p>
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
                {mascotPose === "saved" ? "Say hello" : "Make Khwezi hop"}
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
      <section className="atlas-how atlas-section" aria-labelledby="how-title">
        <div>
          <p className="atlas-eyebrow">LESS SEARCHING. MORE FINDING.</p>
          <h2 id="how-title">
            Go with a little
            <br />
            <em>local curiosity.</em>
          </h2>
          <p>Discover {places.length} places and plan a day worth remembering.</p>
        </div>
        <ol>
          {[
            {
              icon: Compass,
              title: "Find your city",
              copy: "Choose a city on the map or in the list.",
            },
            {
              icon: MapPin,
              title: "Get to know a place",
              copy: "Find places, stories and practical information.",
            },
            {
              icon: BookmarkSimple,
              title: "Make the day yours",
              copy: "Save favourites and build your itinerary.",
            },
          ].map(({ icon: Icon, title, copy }, index) => (
            <li key={title}>
              <span className="atlas-how-number">0{index + 1}</span>
              <Icon size={24} aria-hidden="true" />
              <h3>{title}</h3>
              <p>{copy}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="atlas-end-note">
        <p className="atlas-eyebrow">TWELVE CITIES. ONE GLOW.</p>
        <h2>
          Somewhere new
          <br />
          starts with <em>you.</em>
        </h2>
        <Link href="/destinations" className="atlas-button atlas-primary">
          Follow your curiosity <ArrowUpRight size={18} />
        </Link>
      </section>
    </GuideShell>
  );
}
