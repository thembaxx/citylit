"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowUpRight, Cube, GridFour, MagnifyingGlass, X } from "@phosphor-icons/react";
import { cities } from "../lib/data";
import { CityCard } from "./GuideCards";
import AnimatedPillGroup from "./ui/AnimatedPillGroup";
import { benchoAudio } from "../lib/bencho-audio";

const SouthAfricaDioramaMap = dynamic(() => import("./SouthAfricaDioramaMap"), {
  ssr: false,
  loading: () => (
    <div className="diorama-map-loading" role="status">
      Loading 3D Province Puzzle…
    </div>
  ),
});

export default function CityDirectory({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const [show3dMap, setShow3dMap] = useState(!compact);
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
          <h2 id="city-directory-title">Cities</h2>
        </div>
        {!compact && (
          <button
            type="button"
            className="atlas-button citylit-view-toggle-btn"
            onClick={() => {
              benchoAudio.playLiquidToggle(!show3dMap);
              setShow3dMap((v) => !v);
            }}
            aria-pressed={show3dMap}
            aria-label={show3dMap ? "Switch to grid only" : "View 3D Province Puzzle"}
          >
            {show3dMap ? <GridFour size={17} /> : <Cube size={17} />}
            {show3dMap ? "Hide 3D Map" : "3D Province Puzzle"}
          </button>
        )}
      </div>

      {!compact && show3dMap && (
        <div className="citylit-directory-3d-map-stage">
          <SouthAfricaDioramaMap
            selectedProvince={province === "All provinces" ? null : province}
            onSelectProvince={(name) => {
              benchoAudio.playTap(800);
              setProvince(name);
            }}
          />
        </div>
      )}

      <div className="atlas-directory-tools">
        <label className="atlas-search">
          <MagnifyingGlass size={20} aria-hidden="true" />
          <span className="sr-only">Search city guides</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search cities"
          />
          {query && (
            <button aria-label="Clear city search" onClick={() => setQuery("")}>
              <X size={16} />
            </button>
          )}
        </label>
        <label className={`atlas-province-select${!compact ? " sr-only" : ""}`}>
          <span className="sr-only">Filter by province</span>
          <select value={province} onChange={(event) => setProvince(event.target.value)}>
            {provinces.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
      </div>
      {!compact && (
        <AnimatedPillGroup
          ariaLabel="Quick province filter"
          className="atlas-province-pills"
          activeId={province}
          onChange={(id) => setProvince(id)}
          items={provinces.map((name) => ({
            id: name,
            label: name === "All provinces" ? "All" : name,
          }))}
        />
      )}
      <p
        className={query || province !== "All provinces" ? "atlas-results" : "sr-only"}
        role="status"
      >
        {selected.length} cit{selected.length === 1 ? "y" : "ies"}
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
          All cities <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      )}
    </section>
  );
}
