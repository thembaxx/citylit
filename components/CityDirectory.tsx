"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowUpRight, MagnifyingGlass, X } from "@phosphor-icons/react";
import { cities } from "../lib/data";
import { CityCard } from "./GuideCards";

export default function CityDirectory({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const province = params.get("province") || "All provinces";
  const query = params.get("q") || "";
  const setFilter = (name: string, value: string) => {
    const search = new URLSearchParams(location.search);
    if (value && value !== "All provinces") search.set(name, value);
    else search.delete(name);
    window.history.replaceState(
      null,
      "",
      pathname + (search.size ? "?" + search : "") + location.hash,
    );
  };
  const setProvince = (value: string) => setFilter("province", value);
  const setQuery = (value: string) => setFilter("q", value);
  const provinces = ["All provinces", ...new Set(cities.map((city) => city.province))];
  const selected = cities.filter(
    (city) =>
      (province === "All provinces" || city.province === province) &&
      `${city.name} ${city.province} ${city.short}`
        .toLowerCase()
        .includes(query.toLowerCase().trim()),
  );
  return (
    <section
      className="atlas-section atlas-directory"
      id="cities"
      aria-labelledby="city-directory-title"
    >
      <div className="atlas-section-heading">
        <div>
          <p className="atlas-eyebrow">THE CITY COLLECTION</p>
          <h2 id="city-directory-title">
            Twelve cities,
            <br />
            <em>one glow.</em>
          </h2>
        </div>
        <p>
          From familiar skylines to somewhere new.
          <br />
          Find a place that feels like you.
        </p>
      </div>
      <div className="atlas-directory-tools">
        <label className="atlas-search">
          <MagnifyingGlass size={20} aria-hidden="true" />
          <span className="sr-only">Search city guides</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="A city, a province, a little curiosity…"
          />
          {query && (
            <button aria-label="Clear city search" onClick={() => setQuery("")}>
              <X size={16} />
            </button>
          )}
        </label>
        <label className="atlas-province-select">
          <span className="sr-only">Filter by province</span>
          <select value={province} onChange={(event) => setProvince(event.target.value)}>
            {provinces.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="atlas-results" role="status">
        {selected.length} city guide{selected.length === 1 ? "" : "s"}
        {province !== "All provinces" ? ` in ${province}` : " across South Africa"}
      </p>
      <div className="atlas-city-grid">
        {(compact && !query && province === "All provinces" ? selected.slice(0, 6) : selected).map(
          (city) => (
            <CityCard key={city.slug} city={city} index={cities.indexOf(city)} />
          ),
        )}
      </div>
      {!selected.length && (
        <div className="atlas-empty">
          <h3>No cities found.</h3>
          <p>Try another name or browse all twelve guides.</p>
          <button
            className="atlas-button"
            onClick={() => {
              setQuery("");
              setProvince("All provinces");
            }}
          >
            Show all cities
          </button>
        </div>
      )}
      {compact && !query && province === "All provinces" && (
        <a className="atlas-text-link" href="/destinations">
          Explore all twelve city guides <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      )}
    </section>
  );
}
