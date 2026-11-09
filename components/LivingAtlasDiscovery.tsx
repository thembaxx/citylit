"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookmarkSimple,
  BookOpen,
  Compass,
  Leaf,
  Mountains,
  Sparkle,
} from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cities, landmarkSources } from "../lib/data";
import { cityPhoto, landmarkPath } from "../lib/discovery-guide";
import { AnimatedTabs, type EasyUITabItem } from "./ui/AnimatedTabs";

export type AtlasMood = "explore" | "views" | "green" | "stories" | "surprise";
type City = (typeof cities)[number];

const moodTabs: EasyUITabItem[] = [
  { id: "explore", label: "Explore", icon: <Compass size={16} aria-hidden="true" /> },
  { id: "views", label: "Big views", icon: <Mountains size={16} aria-hidden="true" /> },
  { id: "green", label: "Green & open", icon: <Leaf size={16} aria-hidden="true" /> },
  { id: "stories", label: "Stories", icon: <BookOpen size={16} aria-hidden="true" /> },
  { id: "surprise", label: "Surprise me", icon: <Sparkle size={16} aria-hidden="true" /> },
];
const storyPatterns: Partial<Record<AtlasMood, RegExp>> = {
  views: /mountain|point|beach|ocean|coast|waterfront|view|peak|lookout|cliff|bay|lighthouse/i,
  green: /garden|park|reserve|forest|botanic|bird|island|nature|beach/i,
  stories: /museum|heritage|history|culture|monument|fort|castle|mandela|district|art|memorial/i,
};

export default function LivingAtlasDiscovery({
  mood,
  suggestedCities,
  selectedCity,
  onMoodChange,
  onCitySelect,
}: {
  mood: AtlasMood;
  suggestedCities: City[];
  selectedCity: City | null;
  onMoodChange: (id: string) => void;
  onCitySelect: (slug: string) => void;
}) {
  const reducedMotion = useReducedMotion();
  const tabsId = "living-atlas-moods";
  const storyPattern = storyPatterns[mood];
  const storyLandmarks = selectedCity
    ? selectedCity.landmarks
        .filter((name) => {
          if (!storyPattern) return true;
          const story = landmarkSources.find((record) => record.name === name);
          return storyPattern.test(`${name} ${story?.about || ""}`);
        })
        .slice(0, 3)
    : [];
  const visibleStoryLandmarks = storyLandmarks.length
    ? storyLandmarks
    : (selectedCity?.landmarks.slice(0, 3) ?? []);

  return (
    <section className="living-atlas-explorer" aria-labelledby="living-atlas-explorer-title">
      <div className="living-atlas-panel-heading">
        <h2 id="living-atlas-explorer-title">Where should we wander?</h2>
        <span className="living-atlas-count">
          <span className="living-atlas-pulse" aria-hidden="true" />
          12 cities
        </span>
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
        {mood !== "explore" && (
          <div className="living-atlas-panel-copy">
            <Sparkle size={17} aria-hidden="true" />
            <span>
              {mood === "views"
                ? "Landscapes that make you stop and look."
                : mood === "green"
                  ? "Open air, garden paths, and room to slow down."
                  : mood === "stories"
                    ? "Places with a story worth staying for."
                    : "A new corner of the country, picked for you."}
            </span>
          </div>
        )}
        <div className="living-atlas-city-choices" role="group" aria-label="Suggested cities">
          {suggestedCities.map((city) => (
            <button
              key={city.slug}
              type="button"
              aria-pressed={selectedCity?.slug === city.slug}
              onClick={() => onCitySelect(city.slug)}
            >
              <span>{city.name}</span>
              <small>{city.province}</small>
            </button>
          ))}
          <Link href="/destinations" className="living-atlas-all-cities">
            All 12 cities <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {selectedCity ? (
            <motion.article
              key={selectedCity.slug}
              className="living-atlas-city-card"
              initial={reducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: reducedMotion ? 0 : 0.24, ease: "easeOut" }}
              aria-label={`${selectedCity.name} city preview`}
            >
              <div className="living-atlas-city-image">
                {cityPhoto(selectedCity) && (
                  <Image
                    src={cityPhoto(selectedCity)!.src}
                    alt={cityPhoto(selectedCity)!.alt}
                    fill
                    sizes="(max-width: 700px) 76px, 92px"
                  />
                )}
              </div>
              <div className="living-atlas-city-copy">
                <p className="living-atlas-city-place">
                  {selectedCity.province} <span>·</span> {selectedCity.tag}
                </p>
                <h3>{selectedCity.name}</h3>
                <p>{selectedCity.intro}</p>
                <div className="living-atlas-thread">
                  <p>{mood === "explore" ? "Places to begin" : "Follow this thread"}</p>
                  <div>
                    {visibleStoryLandmarks.map((name) => (
                      <Link key={name} href={landmarkPath(selectedCity, name)}>
                        {name} <ArrowUpRight size={13} aria-hidden="true" />
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="living-atlas-city-actions">
                  <Link href={`/${selectedCity.slug}`} className="living-atlas-primary-action">
                    Enter the city <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                  <Link href={`/explore?city=${selectedCity.slug}&tab=day`}>
                    Plan a day <BookmarkSimple size={15} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </motion.article>
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  );
}
