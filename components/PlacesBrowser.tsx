"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { categories, places, type Place } from "../lib/data";
import { PlaceCard } from "./GuideCards";

export default function PlacesBrowser({
  city,
  initialCategory = "All places",
}: {
  city: string;
  initialCategory?: string;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const category = params.get("category") || initialCategory;
  const query = params.get("q") || "";
  const setQuery = (value: string) => {
    const search = new URLSearchParams(location.search);
    if (value) search.set("q", value);
    else search.delete("q");
    window.history.replaceState(
      null,
      "",
      pathname + (search.size ? "?" + search : "") + location.hash,
    );
  };
  const setCategory = (value: string) => {
    const search = new URLSearchParams(location.search);
    search.set("category", value);
    window.history.replaceState(null, "", pathname + "?" + search + location.hash);
  };
  const local = places.filter((place) => place.city === city);
  const selected = local.filter(
    (place: Place) =>
      (category === "All places" || place.category === category) &&
      `${place.name} ${place.description} ${place.address}`
        .toLowerCase()
        .includes(query.toLowerCase().trim()),
  );
  return (
    <div className="atlas-places-browser">
      <div className="atlas-place-filters" role="group" aria-label="Filter places by category">
        {[
          "All places",
          ...categories.filter((name) => local.some((place) => place.category === name)),
        ].map((name) => (
          <button key={name} aria-pressed={category === name} onClick={() => setCategory(name)}>
            {name}
          </button>
        ))}
      </div>
      <label className="atlas-search">
        <MagnifyingGlass size={20} aria-hidden="true" />
        <span className="sr-only">Search places</span>
        <input
          type="search"
          placeholder="Find a museum, a garden, somewhere to stay…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {query && (
          <button aria-label="Clear place search" onClick={() => setQuery("")}>
            <X size={16} />
          </button>
        )}
      </label>
      <p className="atlas-results" role="status">
        {selected.length} place{selected.length === 1 ? "" : "s"} to discover
      </p>
      <div className="atlas-city-grid">
        {selected.map((place) => (
          <PlaceCard key={place.id} place={place} />
        ))}
      </div>
      {!selected.length && (
        <div className="atlas-empty">
          <h3>A little further afield?</h3>
          <p>No places match those filters. Try another search.</p>
          <button
            className="atlas-button"
            onClick={() => {
              setQuery("");
              setCategory("All places");
            }}
          >
            Show all places
          </button>
        </div>
      )}
    </div>
  );
}
