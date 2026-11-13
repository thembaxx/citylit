"use client";

import Link from "next/link";
import { BookmarkSimple, MapPin, Mountains } from "@phosphor-icons/react";
import { usePathname, useSearchParams } from "next/navigation";
import BrandWordmark from "./BrandWordmark";
import { useEffect, useState, type ReactNode } from "react";
import ThemeToggle from "./ThemeToggle";
import SettingsModal from "./SettingsModal";
import MagnifyingDock from "./ui/MagnifyingDock";
import { useDiscovery } from "./useDiscovery";
import { places } from "../lib/data";
import GuideBackdrop, { type MapSelection } from "./GuideBackdrop";
import GuideMotion from "./GuideMotion";

export default function GuideShell({
  children,
  mapSelection,
  stage = false,
  backdrop = true,
}: {
  children: ReactNode;
  mapSelection?: MapSelection;
  stage?: boolean;
  backdrop?: boolean;
}) {
  const { state } = useDiscovery();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dayCity = places.find((place) => place.id === state.itinerary[0])?.city;
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }
      if (e.key === "Escape") {
        setSettingsOpen(false);
      } else if (e.key === "?" || e.key === "/") {
        e.preventDefault();
        setSettingsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const tabParam = searchParams.get("tab");
  const hasTrip = !!searchParams.get("trip");
  const isDayActive =
    pathname === "/explore" ? tabParam === "day" || hasTrip : pathname.startsWith("/explore");
  const isCitiesActive =
    pathname === "/" || pathname === "/destinations" || pathname.startsWith("/provinces");
  const isDioramasActive = pathname.startsWith("/dioramas");

  return (
    <div className={`discovery-guide reference-guide${stage ? " reference-stage-guide" : ""}`}>
      <a className="guide-skip" href="#guide-main">
        Skip to content
      </a>
      <GuideMotion essential={state.essential} />

      <header className="atlas-nav citylit-app-header">
        <Link className="atlas-wordmark" href="/" aria-label="cıtylit — Citylit home">
          <BrandWordmark />
        </Link>
        <nav aria-label="Main navigation">
          <Link
            href="/destinations"
            className="citylit-header-nav-link"
            aria-current={pathname === "/destinations" ? "page" : undefined}
          >
            <MapPin size={16} aria-hidden="true" /> Cities
          </Link>
          <Link
            href="/dioramas"
            className="citylit-header-nav-link"
            aria-current={isDioramasActive ? "page" : undefined}
          >
            <Mountains size={16} aria-hidden="true" /> Dioramas
          </Link>
          <Link
            href={`/explore?${dayCity ? `city=${dayCity}&` : ""}tab=day`}
            className="atlas-day-link citylit-header-nav-link"
            aria-current={isDayActive ? "page" : undefined}
          >
            <BookmarkSimple size={16} aria-hidden="true" /> My day
            {state.itinerary.length ? ` (${state.itinerary.length})` : ""}
          </Link>
          <ThemeToggle onOpenSettings={() => setSettingsOpen(true)} />
        </nav>
      </header>

      <main id="guide-main" tabIndex={-1}>
        {children}
      </main>

      {backdrop && !stage && <GuideBackdrop selection={mapSelection} essential={state.essential} />}

      <MagnifyingDock
        items={[
          {
            href: "/destinations",
            label: "Cities",
            isActive: isCitiesActive,
            icon: <MapPin size={22} aria-hidden="true" weight="regular" />,
            activeIcon: <MapPin size={22} aria-hidden="true" weight="fill" />,
          },
          {
            href: `/explore?${dayCity ? `city=${dayCity}&` : ""}tab=day`,
            label: "My day",
            isActive: isDayActive,
            icon: <BookmarkSimple size={22} aria-hidden="true" weight="regular" />,
            activeIcon: <BookmarkSimple size={22} aria-hidden="true" weight="fill" />,
          },
          {
            href: "/dioramas",
            label: "Dioramas",
            isActive: isDioramasActive,
            icon: <Mountains size={22} aria-hidden="true" weight="regular" />,
            activeIcon: <Mountains size={22} aria-hidden="true" weight="fill" />,
          },
        ]}
      />

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

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
