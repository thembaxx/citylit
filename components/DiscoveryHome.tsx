"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookmarkSimple,
  MagnifyingGlass,
  MapPin,
  X,
} from "@phosphor-icons/react";
import { cities, landmarkSources } from "../lib/data";
import { cityPhoto, landmarkPath } from "../lib/discovery-guide";
import GuideShell from "./GuideShell";
import ThemeToggle from "./ThemeToggle";
import BrandWordmark from "./BrandWordmark";

type DiscoveryFilter = "All" | "Landmarks" | "Cities" | "Nature";

const featured = {
  city: cities.find((city) => city.slug === "cape-town")!,
  landmark: landmarkSources.find((item) => item.name === "Table Mountain"),
};

export default function DiscoveryHome() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<DiscoveryFilter>("All");
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

  const showCities = filter === "All" || filter === "Cities";
  const showLandmarks = filter === "All" || filter === "Landmarks" || filter === "Nature";
  const resultsVisible = normalizedQuery.length > 0;
  const visibleCities = resultsVisible ? matchingCities : cities.slice(0, 3);
  const visibleLandmarks = resultsVisible ? matchingLandmarks : [];

  return (
    <GuideShell>
      <div className="reference-home">
        <header className="reference-home-header">
          <Link href="/" aria-label="Citylit home">
            <BrandWordmark />
          </Link>
          <div className="reference-home-actions">
            <Link href="/destinations" className="reference-header-link">
              Explore cities <ArrowUpRight size={16} />
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <main className="reference-home-main">
          <section className="reference-home-hero" aria-labelledby="reference-home-title">
            <p className="reference-eyebrow">A little closer to somewhere wonderful</p>
            <h1 id="reference-home-title">
              Explore South Africa’s
              <br />
              <em>most iconic places.</em>
            </h1>
            <p className="reference-home-subtitle">
              Discover. Learn. Experience.
            </p>

            <label className="reference-search">
              <MagnifyingGlass size={20} aria-hidden="true" />
              <span className="sr-only">Search landmarks and cities</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search landmarks, cities..."
                autoComplete="off"
              />
              {query && (
                <button type="button" aria-label="Clear search" onClick={() => setQuery("")}>
                  <X size={17} />
                </button>
              )}
            </label>

            <div className="reference-filter-row" aria-label="Explore categories">
              {(["All", "Landmarks", "Cities", "Nature"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={filter === item}
                  onClick={() => setFilter(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </section>

          {resultsVisible ? (
            <section className="reference-results" aria-live="polite">
              <div className="reference-section-heading">
                <div>
                  <p className="reference-eyebrow">Search results</p>
                  <h2>Find your next place.</h2>
                </div>
                <span>{(showCities ? visibleCities.length : 0) + (showLandmarks ? visibleLandmarks.length : 0)} results</span>
              </div>
              {showLandmarks && visibleLandmarks.length > 0 && (
                <div className="reference-result-list">
                  {visibleLandmarks.map(({ name, city }) => {
                    const record = landmarkSources.find((item) => item.name === name);
                    const photo = record?.images[0];
                    return (
                      <Link key={`${city.slug}-${name}`} href={landmarkPath(city, name)} className="reference-result-card">
                        {photo && <Image src={photo.src} alt={photo.alt} width={88} height={76} />}
                        <span><strong>{name}</strong><small>{city.name}, {city.province}</small></span>
                        <ArrowUpRight size={18} />
                      </Link>
                    );
                  })}
                </div>
              )}
              {showCities && visibleCities.length > 0 && (
                <div className="reference-result-list">
                  {visibleCities.map((city) => {
                    const photo = cityPhoto(city);
                    return (
                      <Link key={city.slug} href={`/${city.slug}`} className="reference-result-card">
                        {photo && <Image src={photo.src} alt={photo.alt} width={88} height={76} />}
                        <span><strong>{city.name}</strong><small>{city.province}</small></span>
                        <ArrowUpRight size={18} />
                      </Link>
                    );
                  })}
                </div>
              )}
              {(!showCities || visibleCities.length === 0) &&
                (!showLandmarks || visibleLandmarks.length === 0) && (
                  <div className="reference-empty">
                    <p>No places found for “{query}”.</p>
                    <button type="button" onClick={() => { setQuery(""); setFilter("All"); }}>Clear search</button>
                  </div>
                )}
            </section>
          ) : (
            <>
              {(filter === "All" || filter === "Landmarks") && featured.landmark?.images[0] && (
                <section className="reference-featured" aria-label="Featured landmark">
                  <div className="reference-featured-image">
                    <Image
                      src={featured.landmark.images[0].src}
                      alt={featured.landmark.images[0].alt}
                      fill
                      priority
                      sizes="(max-width: 700px) 100vw, 70vw"
                    />
                    <span className="reference-featured-badge">
                      <span aria-hidden="true">★</span> Featured
                    </span>
                    <Link
                      href={landmarkPath(featured.city, featured.landmark.name)}
                      className="reference-featured-arrow"
                      aria-label={`Explore ${featured.landmark.name}`}
                    >
                      <ArrowUpRight size={20} />
                    </Link>
                    <div className="reference-featured-copy">
                      <p>{featured.city.name}, {featured.city.province}</p>
                      <h2>{featured.landmark.name}</h2>
                    </div>
                  </div>
                  <div className="reference-featured-footer">
                    <span>Discover the stories behind South Africa’s landmarks</span>
                    <Link href={landmarkPath(featured.city, featured.landmark.name)}>Explore landmark <ArrowRight size={16} /></Link>
                  </div>
                </section>
              )}

              {showCities && (
                <section className="reference-popular" aria-labelledby="reference-popular-title">
                  <div className="reference-section-heading">
                    <div>
                      <p className="reference-eyebrow">Start somewhere</p>
                      <h2 id="reference-popular-title">Popular destinations</h2>
                    </div>
                    <Link href="/destinations">See all <ArrowUpRight size={16} /></Link>
                  </div>
                  <div className="reference-city-strip">
                    {cities.slice(0, 6).map((city) => {
                      const photo = cityPhoto(city);
                      return (
                        <Link key={city.slug} href={`/${city.slug}`} className="reference-city-tile">
                          <span className="reference-city-image">
                            {photo && <Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 700px) 42vw, 220px" />}
                          </span>
                          <strong>{city.name}</strong>
                          <small>{city.province}</small>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              )}

              <section className="reference-quick-links" aria-label="More ways to explore">
                <Link href="/destinations"><MapPin size={19} /> Browse all cities <ArrowUpRight size={16} /></Link>
                <Link href="/explore?tab=day"><BookmarkSimple size={19} /> Open My Day <ArrowUpRight size={16} /></Link>
              </section>
            </>
          )}
        </main>
      </div>
    </GuideShell>
  );
}
