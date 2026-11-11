"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Compass,
  Cube,
  Leaf,
  Mountains,
  Sparkle,
} from "@phosphor-icons/react";
import { AnimatePresence, useReducedMotion } from "motion/react";
import { cities } from "../lib/data";
import { cityPhoto } from "../lib/discovery-guide";
import { AnimatedTabs, type EasyUITabItem } from "./ui/AnimatedTabs";
import TiltCard from "./ui/TiltCard";

export type AtlasMood = "explore" | "views" | "green" | "stories" | "surprise";

const moodTabs: EasyUITabItem[] = [
  { id: "explore", label: "Explore", icon: <Compass size={16} aria-hidden="true" /> },
  { id: "views", label: "Big views", icon: <Mountains size={16} aria-hidden="true" /> },
  { id: "green", label: "Green & open", icon: <Leaf size={16} aria-hidden="true" /> },
  { id: "stories", label: "Stories", icon: <BookOpen size={16} aria-hidden="true" /> },
  { id: "surprise", label: "Surprise me", icon: <Sparkle size={16} aria-hidden="true" /> },
];

export default function LivingAtlasDiscovery({
  mood,
  selectedCity,
  onMoodChange,
}: {
  mood: AtlasMood;
  selectedCity: (typeof cities)[number] | null;
  onMoodChange: (id: string) => void;
}) {
  const reducedMotion = useReducedMotion();
  const tabsId = "living-atlas-moods";

  return (
    <section className="living-atlas-explorer" aria-labelledby="living-atlas-explorer-title">
      <div className="living-atlas-panel-heading">
        <h2 id="living-atlas-explorer-title">Where should we wander?</h2>
        <Link
          href="/destinations"
          className="living-atlas-all-cities"
          data-transition-label="All 12 cities"
        >
          All 12 cities <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>

      <AnimatedTabs
        items={moodTabs}
        value={mood}
        onChange={onMoodChange}
        ariaLabel="Choose the kind of discovery you want"
        idPrefix={tabsId}
        className="living-atlas-mood-tabs"
      />

      <div
        id={`${tabsId}-panel`}
        role="tabpanel"
        aria-labelledby={`${tabsId}-tab-${mood}`}
        tabIndex={0}
        className="living-atlas-discovery-panel"
      >
        <AnimatePresence mode="wait" initial={false}>
          {selectedCity ? (
            <TiltCard
              key={selectedCity.slug}
              className="living-atlas-city-card"
              maxTilt={3.2}
              initial={reducedMotion ? false : { opacity: 0, y: 8, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -6, scale: 0.99 }}
              transition={{ duration: reducedMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
              aria-label={`${selectedCity.name} city preview`}
            >
              <div className="living-atlas-city-image">
                {cityPhoto(selectedCity) && (
                  <Image
                    src={cityPhoto(selectedCity)!.src}
                    alt={cityPhoto(selectedCity)!.alt}
                    fill
                    sizes="(max-width: 700px) 76px, 108px"
                  />
                )}
              </div>
              <div className="living-atlas-city-copy">
                <p className="living-atlas-city-place">
                  {selectedCity.province} <span>·</span> {selectedCity.tag}
                </p>
                <h3>{selectedCity.name}</h3>
                <p>{selectedCity.intro}</p>
                <div className="living-atlas-city-actions">
                  <Link
                    href={`/${selectedCity.slug}`}
                    className="living-atlas-primary-action"
                    data-transition-label={selectedCity.name}
                  >
                    Enter the city <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                  {selectedCity.landmarks[0] && (
                    <Link
                      href={`/${selectedCity.slug}/landmarks`}
                      className="living-atlas-3d-badge"
                      data-transition-label={`${selectedCity.name} 3D stage`}
                    >
                      <Cube size={14} weight="duotone" aria-hidden="true" />
                      3D · {selectedCity.landmarks[0]}
                    </Link>
                  )}
                </div>
              </div>
            </TiltCard>
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  );
}
