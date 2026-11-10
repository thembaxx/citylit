"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowDown, ArrowUpRight } from "@phosphor-icons/react";
import { cities, landmarkSources, type Place } from "../lib/data";
import { cityPhoto, landmarkPath, venuePath } from "../lib/discovery-guide";
import AnimatedPillGroup from "./ui/AnimatedPillGroup";

export type DiscoveryFilter = "All" | "Landmarks" | "Cities" | "Places" | "Nature";
type City = (typeof cities)[number];
type LandmarkMatch = { name: string; city: City };

export default function DiscoverySearchResults({
  query,
  filter,
  cities: matchingCities,
  landmarks: matchingLandmarks,
  places: matchingPlaces,
  onFilterChange,
  onClear,
}: {
  query: string;
  filter: DiscoveryFilter;
  cities: City[];
  landmarks: LandmarkMatch[];
  places: Place[];
  onFilterChange: (filter: DiscoveryFilter) => void;
  onClear: () => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const showCities = filter === "All" || filter === "Cities";
  const showLandmarks = filter === "All" || filter === "Landmarks" || filter === "Nature";
  const showPlaces = filter === "All" || filter === "Places" || filter === "Nature";
  const visibleCities = showCities ? matchingCities.slice(0, showAll ? undefined : 8) : [];
  const visibleLandmarks = showLandmarks ? matchingLandmarks.slice(0, showAll ? undefined : 8) : [];
  const visiblePlaces = showPlaces ? matchingPlaces.slice(0, showAll ? undefined : 8) : [];
  const resultCount =
    (showCities ? matchingCities.length : 0) +
    (showLandmarks ? matchingLandmarks.length : 0) +
    (showPlaces ? matchingPlaces.length : 0);
  const hasMore =
    (showCities && visibleCities.length < matchingCities.length) ||
    (showLandmarks && visibleLandmarks.length < matchingLandmarks.length) ||
    (showPlaces && visiblePlaces.length < matchingPlaces.length);

  return (
    <>
      <AnimatedPillGroup
        className="reference-filter-row living-atlas-result-filters"
        ariaLabel="Filter search results"
        activeId={filter}
        onChange={(item) => {
          setShowAll(false);
          onFilterChange(item as DiscoveryFilter);
        }}
        items={(["All", "Landmarks", "Places", "Cities", "Nature"] as const).map((item) => ({
          id: item,
          label: item,
        }))}
      />
      <section className="reference-results" aria-live="polite">
        <div className="reference-section-heading">
          <div>
            <p className="reference-eyebrow">Search results</p>
            <h2>Places worth finding.</h2>
          </div>
          <span>{resultCount} results</span>
        </div>
        {visibleLandmarks.length > 0 && (
          <div className="reference-result-list">
            {visibleLandmarks.map(({ name, city }) => {
              const record = landmarkSources.find((item) => item.name === name);
              const photo = record?.images[0];
              return (
                <Link
                  key={`${city.slug}-${name}`}
                  href={landmarkPath(city, name)}
                  className="reference-result-card"
                >
                  {photo && <Image src={photo.src} alt={photo.alt} width={88} height={76} />}
                  <span>
                    <strong>{name}</strong>
                    <small>
                      {city.name}, {city.province}
                    </small>
                  </span>
                  <ArrowUpRight size={18} />
                </Link>
              );
            })}
          </div>
        )}
        {visiblePlaces.length > 0 && (
          <div className="reference-result-list">
            {visiblePlaces.map((place) => {
              const photo = place.images[0];
              const city = cities.find((row) => row.slug === place.city);
              return (
                <Link key={place.id} href={venuePath(place)} className="reference-result-card">
                  {photo && <Image src={photo.src} alt={photo.alt} width={88} height={76} />}
                  <span>
                    <strong>{place.name}</strong>
                    <small>
                      {city?.name || place.city} · {place.category}
                    </small>
                  </span>
                  <ArrowUpRight size={18} />
                </Link>
              );
            })}
          </div>
        )}
        {visibleCities.length > 0 && (
          <div className="reference-result-list">
            {visibleCities.map((city) => {
              const photo = cityPhoto(city);
              return (
                <Link key={city.slug} href={`/${city.slug}`} className="reference-result-card">
                  {photo && <Image src={photo.src} alt={photo.alt} width={88} height={76} />}
                  <span>
                    <strong>{city.name}</strong>
                    <small>{city.province}</small>
                  </span>
                  <ArrowUpRight size={18} />
                </Link>
              );
            })}
          </div>
        )}
        {resultCount === 0 && (
          <div className="reference-empty">
            <p>No places found for “{query}”.</p>
            <button type="button" onClick={onClear}>
              Clear search
            </button>
          </div>
        )}
      </section>
      {hasMore && (
        <button
          type="button"
          className="living-atlas-more-results"
          onClick={() => setShowAll(true)}
        >
          Show all {resultCount} results <ArrowDown size={16} aria-hidden="true" />
        </button>
      )}
    </>
  );
}
