"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
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
const GlowMap = dynamic(() => import("./GlowMap"), {
  ssr: false,
  loading: () => (
    <div className="glow-map-loading" role="status">
      Lighting up South Africa…<Link href="#cities">Browse the city guides</Link>
    </div>
  ),
});

export default function DiscoveryHome() {
  const [selected, setSelected] = useState<number | null>(null);
  const city = selected === null ? null : cities[selected];
  return (
    <GuideShell>
      <section className="atlas-hero">
        <div className="atlas-hero-copy">
          <p className="atlas-eyebrow">
            <span className="atlas-live-dot" /> SOUTH AFRICA, THROUGH A DIFFERENT LENS
          </p>
          <h1>
            Discover
            <br />
            <em>South</em> Africa<span className="atlas-title-period">.</span>
          </h1>
          <p className="atlas-hero-sub">
            Follow the glow.
            <br />
            Find your kind of somewhere.
          </p>
          <a href="#cities" className="atlas-button atlas-primary">
            Find your next city <ArrowDown size={18} />
          </a>
        </div>
        <div className="atlas-map-stage">
          <GlowMap selected={selected} onSelect={setSelected} />
          <div className="atlas-map-coordinate" aria-hidden="true">
            22° — 35° S<br />
            16° — 33° E
          </div>
        </div>
        <div className="atlas-hero-bottom">
          <p className="atlas-hero-count">
            <span>12 cities</span>
            <span>9 provinces</span>
            <span>A thousand ways to feel here.</span>
          </p>
          <div className="atlas-beacon-card" aria-live="polite">
            <div>
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
              <p>
                {city
                  ? city.intro
                  : "A little curiosity goes a long way. Choose a glowing city, or browse the guides below."}
              </p>
            </div>
            <div className="atlas-beacon-actions">
              <Link href={city ? `/${city.slug}` : "/destinations"} className="atlas-text-link">
                {city ? "Explore the city" : "Browse all city guides"} <ArrowUpRight size={18} />
              </Link>
              {city && (
                <button aria-label="Reset map selection" onClick={() => setSelected(null)}>
                  <ArrowCounterClockwise size={19} />
                </button>
              )}
            </div>
          </div>
        </div>
        <a href="#cities" className="atlas-scroll-cue">
          <ArrowDown size={16} /> A country waiting to be discovered
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
          <p>
            Considered guides to {places.length} places, with the details that help you turn a spark
            into a day out.
          </p>
        </div>
        <ol>
          {[
            {
              icon: Compass,
              title: "Find your city",
              copy: "Follow a beacon or browse the collection. Familiar or far away, every city has its own rhythm.",
            },
            {
              icon: MapPin,
              title: "Get to know a place",
              copy: "Landmark stories, local discoveries, addresses and source-linked visitor information.",
            },
            {
              icon: BookmarkSimple,
              title: "Make the day yours",
              copy: "Save the places that catch your eye. Build a day, reorder your stops and take your guide with you.",
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
