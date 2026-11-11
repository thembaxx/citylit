"use client";

import Link from "next/link";
import { BookmarkSimple, Cube, House, MapPin } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";
import BrandWordmark from "./BrandWordmark";
import { useState, type ReactNode } from "react";
import ThemeToggle from "./ThemeToggle";
import SettingsModal from "./SettingsModal";
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
  const pathname = usePathname();
  const dayCity = places.find((place) => place.id === state.itinerary[0])?.city;
  const isHome = pathname === "/";
  const [settingsOpen, setSettingsOpen] = useState(false);

  const isDayActive = pathname.startsWith("/explore");
  const isCitiesActive = pathname === "/destinations" || pathname.startsWith("/provinces");

  return (
    <div className={`discovery-guide reference-guide${stage ? " reference-stage-guide" : ""}`}>
      {!stage && <GuideBackdrop selection={mapSelection} essential={state.essential} />}
      <GuideMotion essential={state.essential} />
      <a className="guide-skip" href="#guide-main">
        Skip to content
      </a>

      {!isHome && (
        <header className="atlas-nav">
          <Link className="atlas-wordmark" href="/" aria-label="Citylit home">
            <BrandWordmark />
          </Link>
          <nav aria-label="Main navigation">
            <Link
              href="/destinations"
              aria-current={pathname === "/destinations" ? "page" : undefined}
            >
              Cities
            </Link>
            <Link
              href={`/explore?${dayCity ? `city=${dayCity}&` : ""}tab=day`}
              className="atlas-day-link"
            >
              <BookmarkSimple size={17} aria-hidden="true" /> My day
              {state.itinerary.length ? ` (${state.itinerary.length})` : ""}
            </Link>
            <ThemeToggle onOpenSettings={() => setSettingsOpen(true)} />
          </nav>
        </header>
      )}

      <main id="guide-main" tabIndex={-1}>
        {children}
      </main>

      {/* Floating 4-tab Bottom Dock */}
      <nav className="atlas-native-dock citylit-bottom-dock" aria-label="Mobile navigation">
        <Link
          href="/"
          aria-label="Home · Explore"
          aria-current={isHome ? "page" : undefined}
          className={isHome ? "is-active" : ""}
        >
          <House size={22} aria-hidden="true" weight={isHome ? "fill" : "regular"} />
          <span>Home</span>
          {isHome && <span className="citylit-dock-indicator" aria-hidden="true" />}
        </Link>
        <Link
          href="/destinations"
          aria-current={isCitiesActive ? "page" : undefined}
          className={isCitiesActive ? "is-active" : ""}
        >
          <MapPin size={22} aria-hidden="true" weight={isCitiesActive ? "fill" : "regular"} />
          <span>Cities</span>
          {isCitiesActive && <span className="citylit-dock-indicator" aria-hidden="true" />}
        </Link>
        <Link
          href={`/explore?${dayCity ? `city=${dayCity}&` : ""}tab=day`}
          aria-current={isDayActive ? "page" : undefined}
          className={isDayActive ? "is-active" : ""}
        >
          <BookmarkSimple size={22} aria-hidden="true" weight={isDayActive ? "fill" : "regular"} />
          <span>My day</span>
          {isDayActive && <span className="citylit-dock-indicator" aria-hidden="true" />}
        </Link>
        <Link href="/?view=3d" className="citylit-dock-atlas">
          <Cube size={22} aria-hidden="true" />
          <span>Atlas</span>
        </Link>
      </nav>

      <footer className="atlas-footer">
        <div>
          <Link href="/" className="atlas-wordmark">
            <BrandWordmark />
          </Link>
        </div>
        <div className="atlas-footer-links">
          <Link href="/about">About &amp; sources</Link>
          <Link href="/privacy">Privacy &amp; data</Link>
        </div>
        <p className="atlas-evidence">
          Made for discovering South Africa. Research dates describe source checks, not live venue
          confirmation. Hours, fees and access can change; check with the operator before you go.
        </p>
      </footer>

      {/* Settings Modal */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
