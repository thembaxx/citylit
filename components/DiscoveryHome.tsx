"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  BookmarkSimple,
  GameController,
  MagnifyingGlass,
  X,
} from "@phosphor-icons/react";
import { cities, landmarkSources, places } from "../lib/data";
import GuideShell from "./GuideShell";
import ThemeToggle from "./ThemeToggle";
import BrandWordmark from "./BrandWordmark";
import { useKhwezi } from "./KhweziProvider";
import DiscoverySearchResults, { type DiscoveryFilter } from "./DiscoverySearchResults";
import LivingAtlasDiscovery, { type AtlasMood } from "./LivingAtlasDiscovery";
import LivingAtlasFollowups from "./LivingAtlasFollowups";
import { useDiscovery } from "./useDiscovery";

const moodPatterns: Partial<Record<AtlasMood, RegExp>> = {
  views: /mountain|point|beach|ocean|coast|waterfront|view|peak|lookout|cliff|bay|lighthouse/i,
  green: /garden|park|reserve|forest|botanic|bird|island|nature|beach/i,
  stories: /museum|heritage|history|culture|monument|fort|castle|mandela|district|art|memorial/i,
};

function cityMoodScore(city: (typeof cities)[number], pattern: RegExp) {
  const placesInCity = places.filter((place) => place.city === city.slug);
  const words = [
    ...city.landmarks,
    ...placesInCity.flatMap((place) => [place.name, place.description, place.category]),
  ];
  return words.reduce((score, word) => score + Number(pattern.test(word)), 0);
}

export default function DiscoveryHome() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<DiscoveryFilter>("All");
  const [mood, setMood] = useState<AtlasMood>("explore");
  const [selectedCity, setSelectedCity] = useState<number | null>(null);
  const [surpriseCity, setSurpriseCity] = useState<string | null>(null);
  const { feedback } = useKhwezi();
  const { state } = useDiscovery();
  const dayCity = places.find((place) => place.id === state.itinerary[0])?.city;
  const normalizedQuery = query.trim().toLowerCase();

  const matchingCities = useMemo(
    () =>
      cities.filter((city) =>
        `${city.name} ${city.province} ${city.tag || ""} ${city.intro}`
          .toLowerCase()
          .includes(normalizedQuery),
      ),
    [normalizedQuery],
  );

  const matchingLandmarks = useMemo(
    () =>
      cities.flatMap((city) =>
        city.landmarks
          .filter((name) => {
            const record = landmarkSources.find((item) => item.name === name);
            return (
              `${name} ${city.name} ${city.province} ${record?.about || ""}`
                .toLowerCase()
                .includes(normalizedQuery) &&
              (filter !== "Nature" ||
                /mountain|garden|park|reserve|island|point|forest|beach/i.test(name))
            );
          })
          .map((name) => ({ name, city })),
      ),
    [normalizedQuery, filter],
  );

  const matchingPlaces = useMemo(
    () =>
      places.filter((place) => {
        const city = cities.find((row) => row.slug === place.city);
        return (
          `${place.name} ${place.city} ${city?.name || ""} ${city?.province || ""} ${place.category} ${place.description} ${place.district || ""}`
            .toLowerCase()
            .includes(normalizedQuery) &&
          (filter !== "Nature" || place.category === "Parks & zoos")
        );
      }),
    [normalizedQuery, filter],
  );

  const suggestedCities = useMemo(() => {
    if (mood === "surprise") {
      return [cities.find((city) => city.slug === surpriseCity) || cities[0]];
    }
    const pattern = moodPatterns[mood];
    if (!pattern) return cities.slice(0, 4);
    return [...cities]
      .map((city, index) => ({ city, index, score: cityMoodScore(city, pattern) }))
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .slice(0, 4)
      .map(({ city }) => city);
  }, [mood, surpriseCity]);

  const selectedCityData = selectedCity === null ? null : cities[selectedCity];
  const resultsVisible = normalizedQuery.length > 0;

  const selectMood = (id: string) => {
    const nextMood = id as AtlasMood;
    if (nextMood !== mood) feedback("swipe");
    setMood(nextMood);
    if (nextMood === "explore") {
      setSelectedCity(null);
      return;
    }
    if (nextMood === "surprise") {
      const options = cities.filter((_, index) => index !== selectedCity);
      const nextCity = options[Math.floor(Math.random() * options.length)] || cities[0];
      setSurpriseCity(nextCity.slug);
      setSelectedCity(cities.findIndex((city) => city.slug === nextCity.slug));
      return;
    }
    const nextCity = [...cities]
      .map((city, index) => ({
        city,
        index,
        score: cityMoodScore(city, moodPatterns[nextMood]!),
      }))
      .sort((a, b) => b.score - a.score || a.index - b.index)[0]?.city;
    setSelectedCity(
      Math.max(
        0,
        cities.findIndex((city) => city.slug === nextCity?.slug),
      ),
    );
  };

  const selectCity = (slug: string, clearMood = true) => {
    const index = cities.findIndex((city) => city.slug === slug);
    if (index >= 0) {
      if (index !== selectedCity) feedback("tap");
      setSelectedCity(index);
      if (clearMood) setMood("explore");
    }
  };

  return (
    <GuideShell
      mapSelection={{
        selected: selectedCity,
        onSelect: (index) => selectCity(cities[index].slug),
      }}
    >
      <div className="reference-home living-atlas-home">
        <header className="reference-home-header">
          <Link href="/" aria-label="Citylit home">
            <BrandWordmark />
          </Link>
          <div className="reference-home-actions">
            <Link
              href="/destinations"
              className="reference-header-link"
              data-transition-label="Explore all cities"
            >
              Cities <ArrowUpRight size={16} />
            </Link>
            <Link
              href="/?view=3d"
              className="reference-header-link"
              data-transition-label="Play the atlas"
            >
              <GameController size={16} /> Play atlas
            </Link>
            <Link
              href={`/explore?${dayCity ? `city=${dayCity}&` : ""}tab=day`}
              className="reference-header-link"
              data-transition-label="Open your day"
            >
              <BookmarkSimple size={16} /> My day{" "}
              {state.itinerary.length ? `(${state.itinerary.length})` : ""}
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <div className="reference-home-main living-atlas-main">
          <section
            className="reference-home-hero living-atlas-hero"
            aria-labelledby="reference-home-title"
          >
            <p className="reference-eyebrow">The Living Atlas · South Africa</p>
            <h1 id="reference-home-title">
              Follow your
              <br />
              <em>curiosity.</em>
            </h1>
            <p className="reference-home-subtitle">
              Twelve cities. Countless ways to find your way in.
            </p>

            <label className="reference-search">
              <MagnifyingGlass size={20} aria-hidden="true" />
              <span className="sr-only">Search landmarks and cities</span>
              <input
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                }}
                placeholder="Find a place, story, or city"
                autoComplete="off"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setQuery("");
                  }}
                >
                  <X size={17} />
                </button>
              )}
            </label>
          </section>

          {resultsVisible ? (
            <DiscoverySearchResults
              key={`${normalizedQuery}:${filter}`}
              query={query}
              filter={filter}
              cities={matchingCities}
              landmarks={matchingLandmarks}
              places={matchingPlaces}
              onFilterChange={setFilter}
              onClear={() => {
                setQuery("");
                setFilter("All");
              }}
            />
          ) : (
            <>
              <LivingAtlasDiscovery
                mood={mood}
                suggestedCities={suggestedCities}
                selectedCity={selectedCityData}
                onMoodChange={selectMood}
                onCitySelect={(slug) => selectCity(slug, false)}
              />
              <LivingAtlasFollowups />
            </>
          )}
        </div>
      </div>
    </GuideShell>
  );
}
