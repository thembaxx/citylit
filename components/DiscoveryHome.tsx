"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookmarkSimple,
  CalendarPlus,
  Cube,
  MagnifyingGlass,
  X,
} from "@phosphor-icons/react";
import { cities, landmarkSources, places } from "../lib/data";
import { cityPhoto, landmarkPath } from "../lib/discovery-guide";
import GuideShell from "./GuideShell";
import { useKhwezi } from "./KhweziProvider";
import { useDiscovery } from "./useDiscovery";
import DiscoverySearchResults, { type DiscoveryFilter } from "./DiscoverySearchResults";
import LivingAtlasDiscovery, { type AtlasMood } from "./LivingAtlasDiscovery";
import WeatherWidget from "./WeatherWidget";
import DioramaWeatherController from "./DioramaWeatherController";
import { benchoAudio } from "../lib/bencho-audio";

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
  const [selectedCity, setSelectedCity] = useState<number | null>(0);
  const [mapSelectedCity, setMapSelectedCity] = useState<number | null>(null);
  const { feedback } = useKhwezi();
  const { state } = useDiscovery();
  const normalizedQuery = query.trim().toLowerCase();

  // Featured landmarks carousel (Cape Town, Pretoria, Durban, Joburg)
  const featuredList = useMemo(
    () => [
      {
        city: cities.find((c) => c.slug === "cape-town") || cities[0],
        landmark:
          landmarkSources.find((item) => item.name === "Table Mountain") || landmarkSources[0],
      },
      {
        city: cities.find((c) => c.slug === "tshwane") || cities[1],
        landmark:
          landmarkSources.find((item) => item.name === "Union Buildings") || landmarkSources[1],
      },
      {
        city: cities.find((c) => c.slug === "durban") || cities[2],
        landmark:
          landmarkSources.find((item) => item.name === "Moses Mabhida Stadium") ||
          landmarkSources[2],
      },
      {
        city: cities.find((c) => c.slug === "johannesburg") || cities[3],
        landmark:
          landmarkSources.find((item) => item.name === "Nelson Mandela Bridge") ||
          landmarkSources[3],
      },
    ],
    [],
  );
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const currentFeatured = featuredList[featuredIndex] || featuredList[0];
  const featuredCity = currentFeatured.city;
  const featuredLandmarkSource = currentFeatured.landmark;
  const featuredPhoto = featuredLandmarkSource.images[0];

  // 3D spotlight (real landmark)
  const spotlightCity = cities.find((c) => c.slug === "mbombela") || cities[0];
  const spotlightLandmarkName = spotlightCity.landmarks[0];
  const spotlightLandmark = landmarkSources.find((item) => item.name === spotlightLandmarkName);
  const spotlightPhoto = spotlightLandmark?.images[0] || cityPhoto(spotlightCity);

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
            const haystack =
              `${name} ${city.name} ${city.province} ${record?.about || ""}`.toLowerCase();
            if (!haystack.includes(normalizedQuery)) return false;
            if (filter === "Nature")
              return /mountain|garden|park|reserve|island|point|forest|beach/i.test(name);
            if (filter === "Architecture")
              return /tower|bridge|stadium|building|cathedral|church|fort|castle|museum|monument|city hall|station|library/i.test(
                `${name} ${record?.about || ""}`,
              );
            return true;
          })
          .map((name) => ({ name, city })),
      ),
    [normalizedQuery, filter],
  );

  const matchingPlaces = useMemo(
    () =>
      places.filter((place) => {
        const city = cities.find((row) => row.slug === place.city);
        const haystack =
          `${place.name} ${place.city} ${city?.name || ""} ${city?.province || ""} ${place.category} ${place.description} ${place.district || ""}`.toLowerCase();
        if (!haystack.includes(normalizedQuery)) return false;
        if (filter === "Nature") return place.category === "Parks & zoos";
        if (filter === "Architecture")
          return /architecture|museum|heritage|theatre|gallery/i.test(
            `${place.category} ${place.name} ${place.description}`,
          );
        return true;
      }),
    [normalizedQuery, filter],
  );

  const selectedCityData = selectedCity === null ? null : cities[selectedCity];
  const resultsVisible = normalizedQuery.length > 0;

  const selectMood = (id: string) => {
    const nextMood = id as AtlasMood;
    if (nextMood !== mood) feedback("swipe");
    setMood(nextMood);
    if (nextMood === "explore") {
      setSelectedCity(0);
      setMapSelectedCity(null);
      return;
    }
    if (nextMood === "surprise") {
      const options = cities.filter((_, index) => index !== selectedCity);
      const nextCity = options[Math.floor(Math.random() * options.length)] || cities[0];
      const nextIndex = cities.findIndex((city) => city.slug === nextCity.slug);
      setSelectedCity(nextIndex);
      setMapSelectedCity(nextIndex);
      return;
    }
    const nextCity = [...cities]
      .map((city, index) => ({
        city,
        index,
        score: cityMoodScore(city, moodPatterns[nextMood]!),
      }))
      .sort((a, b) => b.score - a.score || a.index - b.index)[0]?.city;
    const nextIndex = Math.max(
      0,
      cities.findIndex((city) => city.slug === nextCity?.slug),
    );
    setSelectedCity(nextIndex);
    setMapSelectedCity(nextIndex);
  };

  const selectCity = (slug: string, clearMood = true) => {
    const index = cities.findIndex((city) => city.slug === slug);
    if (index >= 0) {
      if (index !== selectedCity) feedback("tap");
      setSelectedCity(index);
      setMapSelectedCity(index);
      if (clearMood) setMood("explore");
    }
  };

  return (
    <GuideShell
      mapSelection={{
        selected: mapSelectedCity,
        onSelect: (index) => selectCity(cities[index].slug),
      }}
    >
      <div className="reference-home living-atlas-home">
        <div className="reference-home-main living-atlas-main">
          {/* Hero Section */}
          <section
            className="reference-home-hero living-atlas-hero"
            aria-labelledby="reference-home-title"
          >
            <p className="citylit-hero-eyebrow">The Nocturnal Edition · South Africa</p>
            <h1 id="reference-home-title">
              Follow your <em>curiosity.</em>
            </h1>
            <p className="reference-home-subtitle">
              Discover. Learn. Experience South Africa&apos;s iconic places and night-lit landmarks.
            </p>

            <WeatherWidget
              name={(cities[mapSelectedCity ?? selectedCity ?? 0] ?? cities[0]).name}
              longitude={(cities[mapSelectedCity ?? selectedCity ?? 0] ?? cities[0]).coords[0]}
              latitude={(cities[mapSelectedCity ?? selectedCity ?? 0] ?? cities[0]).coords[1]}
            />

            {/* Search Input */}
            <label className="reference-search">
              <MagnifyingGlass size={20} aria-hidden="true" />
              <input
                type="search"
                role="searchbox"
                aria-label="Search landmarks and cities"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                }}
                placeholder="Search landmarks, cities, or provinces..."
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

            {/* Category Filter Pills */}
            <div className="citylit-filter-pills-row" role="group" aria-label="Explore categories">
              {(["All", "Landmarks", "Cities", "Nature", "Architecture"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`citylit-filter-pill ${filter === tab ? "is-active" : ""}`}
                  aria-pressed={filter === tab}
                  onClick={() => {
                    benchoAudio.playClick(540);
                    setFilter(tab);
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </section>

          {/* Results or Featured View */}
          {resultsVisible ? (
            <DiscoverySearchResults
              key={`${normalizedQuery}:${filter}`}
              query={query}
              filter={filter}
              cities={matchingCities}
              landmarks={matchingLandmarks}
              places={matchingPlaces}
              onFilterChange={setFilter}
              onSelectQuery={(selectedQuery) => setQuery(selectedQuery)}
              onClear={() => {
                setQuery("");
                setFilter("All");
              }}
            />
          ) : (
            <>
              {/* Featured Landmark Card */}
              {(filter === "All" || filter === "Landmarks" || filter === "Nature") &&
                featuredPhoto && (
                  <section className="citylit-featured-section" aria-label="Featured place">
                    <div className="citylit-featured-card">
                      <div className="citylit-featured-media">
                        <Image
                          src={featuredPhoto.src}
                          alt={featuredPhoto.alt}
                          fill
                          priority
                          sizes="(max-width: 768px) 100vw, 900px"
                        />
                        <div className="citylit-featured-badge">Featured</div>
                        <div className="citylit-featured-meta">
                          <h2>{featuredLandmarkSource.name}</h2>
                          <p>{featuredCity.name}, South Africa</p>
                        </div>
                        <div className="citylit-featured-dots" role="tablist" aria-label="Featured landmarks">
                          {featuredList.map((item, idx) => (
                            <button
                              key={item.landmark.name}
                              type="button"
                              role="tab"
                              aria-selected={featuredIndex === idx}
                              className={`citylit-dot ${featuredIndex === idx ? "is-active" : ""}`}
                              onClick={() => {
                                benchoAudio.playTap(750 + idx * 40);
                                setFeaturedIndex(idx);
                              }}
                              aria-label={`View ${item.landmark.name}`}
                            />
                          ))}
                        </div>
                        <Link
                          href={landmarkPath(featuredCity, featuredLandmarkSource.name)}
                          className="citylit-featured-arrow-btn"
                          aria-label={`Explore ${featuredLandmarkSource.name}`}
                        >
                          <ArrowRight size={20} weight="bold" />
                        </Link>
                      </div>
                    </div>
                  </section>
                )}

              {/* 3D Landmark Interactive Canvas Card (visual ref) */}
              {(filter === "All" || filter === "Landmarks") && spotlightLandmarkName && (
                <section
                  className="citylit-3d-canvas-section"
                  aria-labelledby="home-3d-landmarks-title"
                >
                  <div className="citylit-3d-canvas-card">
                    <div className="citylit-3d-canvas-head">
                      <div>
                        <h2 id="home-3d-landmarks-title">{spotlightCity.name} landmarks</h2>
                      </div>
                      <Link
                        href={`/${spotlightCity.slug}/landmarks`}
                        className="citylit-inspect-btn"
                        data-transition-label={`${spotlightCity.name} 3D landmarks`}
                      >
                        <Cube size={17} weight="duotone" aria-hidden="true" /> Inspect
                      </Link>
                    </div>

                    {/* Real-time Weather & Atmospheric Scrubber (Image 6 & Image 8) */}
                    <DioramaWeatherController compact cityName={spotlightCity.name} />

                    <div className="citylit-3d-viewport">
                      {spotlightPhoto && (
                        <Image
                          src={spotlightPhoto.src}
                          alt={spotlightPhoto.alt}
                          fill
                          sizes="(max-width: 768px) 100vw, 900px"
                          className="citylit-3d-preview-image"
                        />
                      )}
                      <div className="citylit-3d-viewport-overlay" aria-hidden="true" />
                      <div className="citylit-3d-diorama-label">{spotlightLandmarkName}</div>
                      <div
                        className="citylit-3d-chip-row"
                        role="list"
                        aria-label="Landmark shortcuts"
                      >
                        <Link
                          href={`/${spotlightCity.slug}/landmarks`}
                          className="citylit-3d-chip is-active"
                          role="listitem"
                        >
                          {spotlightLandmarkName}
                        </Link>
                        {spotlightCity.landmarks.slice(1, 3).map((name) => (
                          <Link
                            key={name}
                            href={landmarkPath(spotlightCity, name)}
                            className="citylit-3d-chip"
                            role="listitem"
                          >
                            {name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Where should we wander? */}
              <LivingAtlasDiscovery
                mood={mood}
                selectedCity={selectedCityData}
                onMoodChange={selectMood}
              />

              {/* Popular Destinations */}
              {(filter === "All" || filter === "Cities") && (
                <section className="citylit-popular-section" aria-labelledby="popular-heading">
                  <div className="citylit-section-head">
                    <div>
                      <h2 id="popular-heading">Popular destinations</h2>
                      <p className="citylit-section-sub">Monographs, guides &amp; walking tours</p>
                    </div>
                    <Link href="/destinations" className="citylit-see-all-link">
                      See all 12 <ArrowRight size={14} weight="bold" />
                    </Link>
                  </div>
                  <div className="citylit-popular-scroll">
                    {cities.map((c) => {
                      const photo = cityPhoto(c);
                      const placeCount = places.filter((p) => p.city === c.slug).length;
                      return (
                        <Link
                          key={c.slug}
                          href={`/${c.slug}`}
                          className="citylit-popular-card"
                          onClick={() => feedback("tap")}
                        >
                          <div className="citylit-popular-thumb">
                            {photo && (
                              <Image
                                src={photo.src}
                                alt={photo.alt}
                                fill
                                sizes="(max-width: 600px) 160px, 180px"
                              />
                            )}
                          </div>
                          <div className="citylit-popular-body">
                            <span className="citylit-popular-prov">{c.province}</span>
                            <strong className="citylit-popular-name">{c.name}</strong>
                            <span className="citylit-popular-meta">
                              {placeCount} places · {c.landmarks.length} landmarks
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Plan your next adventure */}
              <section className="citylit-plan-card-section" aria-labelledby="home-plan-title">
                <div className="citylit-plan-card">
                  <div className="citylit-plan-icon" aria-hidden="true">
                    <CalendarPlus size={22} weight="duotone" />
                  </div>
                  <div className="citylit-plan-copy">
                    <h3 id="home-plan-title">Plan your next adventure</h3>
                    <p>
                      Save places, compile routes, and keep your day across South African cities.
                    </p>
                  </div>
                  <div className="citylit-plan-actions">
                    <Link href="/explore?tab=day" className="citylit-plan-primary">
                      <CalendarPlus size={18} aria-hidden="true" /> Create itinerary
                    </Link>
                    <Link
                      href="/explore?tab=saved"
                      className="citylit-plan-secondary"
                      aria-label="View saved places"
                    >
                      <BookmarkSimple size={17} weight="duotone" aria-hidden="true" />
                      <span>{state.saved.length || 0}</span>
                    </Link>
                  </div>
                  <div className="citylit-plan-status">
                    <span>
                      <span className="citylit-plan-dot" aria-hidden="true" /> The living atlas ·
                      Offline caches ready
                    </span>
                    <Link href="/about">Source notes →</Link>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </GuideShell>
  );
}
