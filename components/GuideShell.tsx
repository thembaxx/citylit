"use client";

import Link from "next/link";
import { ArrowUpRight, BookmarkSimple, Compass } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import ThemeToggle from "./ThemeToggle";
import { useDiscovery } from "./useDiscovery";
import { places } from "../lib/data";
import GuideBackdrop, { type MapSelection } from "./GuideBackdrop";
import GuideMotion from "./GuideMotion";

export default function GuideShell({
  children,
  mapSelection,
  stage = false,
}: {
  children: ReactNode;
  mapSelection?: MapSelection;
  stage?: boolean;
}) {
  const { state } = useDiscovery();
  const dayCity = places.find((place) => place.id === state.itinerary[0])?.city;
  return (
    <div className={`discovery-guide reference-guide${stage ? " reference-stage-guide" : ""}`}>
      {!stage && <GuideBackdrop selection={mapSelection} essential={state.essential} />}
      <GuideMotion essential={state.essential} />
      <a className="guide-skip" href="#guide-main">
        Skip to content
      </a>
      <header className="atlas-nav">
        <Link className="atlas-wordmark" href="/" aria-label="Citylit home">
          c<span>ı</span>tylit<span className="wordmark-period">.</span>
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/destinations">City guides</Link>
          <Link href="/about" className="atlas-about-link">
            Our story
          </Link>
          <Link
            href={`/explore?${dayCity ? `city=${dayCity}&` : ""}tab=day`}
            className="atlas-day-link"
          >
            <BookmarkSimple size={17} aria-hidden="true" /> My day
            {state.itinerary.length ? ` (${state.itinerary.length})` : ""}
          </Link>
          <ThemeToggle />
        </nav>
      </header>
      <main id="guide-main" tabIndex={-1}>
        {children}
      </main>
      <footer className="atlas-footer">
        <div>
          <Link href="/" className="atlas-wordmark">
            c<span>ı</span>tylit.
          </Link>
          <p>A little curiosity. A whole country.</p>
        </div>
        <div className="atlas-footer-links">
          <Link href="/destinations">
            All city guides <ArrowUpRight size={14} />
          </Link>
          <Link href="/?view=3d">
            <Compass size={16} /> The 3D atlas
          </Link>
          <Link href="/about">About &amp; sources</Link>
          <Link href="/privacy">Privacy &amp; data</Link>
        </div>
        <p className="atlas-evidence">
          Made for discovering South Africa. Research dates describe source checks, not live venue
          confirmation. Hours, fees and access can change; check with the operator before you go.
        </p>
      </footer>
    </div>
  );
}
