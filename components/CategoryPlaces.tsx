"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowUpRight, Heart, Search, MapPin, X } from "lucide-react";
import { useEffect, useRef, useState, type RefObject } from "react";
import { useSearchParams } from "next/navigation";
import CategoryNav from "./CategoryNav";
import CategoryIcon from "./CategoryIcon";
import KhweziMoment from "./KhweziMoment";
import { categories, categorySlug, cities, type Place } from "../lib/data";
const Scene = dynamic(() => import("./Scene"), {
  ssr: false,
  loading: () => <KhweziMoment pose="loading" compact />,
});

type Props = {
  city: number;
  category: number;
  places: Place[];
  query: string;
  saved: string[];
  reset: number;
  animate: boolean;
  searchRef: RefObject<HTMLInputElement | null>;
  onQuery: (query: string) => void;
  onCategory: (index: number) => void;
  onSave: (id: string) => void;
  onPlace: (place: Place) => void;
  onHelp: () => void;
};
export default function CategoryPlaces(props: Props) {
  const city = cities[props.city],
    category = categories[props.category];
  const reduced = useReducedMotion();
  const pageRef = useRef<HTMLDivElement>(null);
  const params = useSearchParams();
  const [district, setDistrict] = useState(params.get("district") || "");
  const filters = (params.get("filters") || "").split(",").filter(Boolean);
  const filterPlaces = props.places.filter(
    (p) =>
      (!district || p.district === district) &&
      filters.every((filter) =>
        filter === "free"
          ? p.facts?.admission?.value === "free" && p.facts.admission.confidence === "verified"
          : filter === "indoors"
            ? ["indoor", "mixed"].includes(String(p.facts?.environment?.value))
            : filter === "family"
              ? p.facts?.family?.value === true && p.facts.family.confidence === "verified"
              : p.facts?.stepFreeEntrance?.value === true &&
                p.facts.stepFreeEntrance.confidence === "verified",
      ),
  );
  const unseeded = !props.places.length && !props.query && !filters.length && !district;
  const setFilter = (filter: string) => {
    const search = new URLSearchParams(params);
    const next = filters.includes(filter)
      ? filters.filter((v) => v !== filter)
      : [...filters, filter];
    if (next.length) search.set("filters", next.join(","));
    else search.delete("filters");
    window.history.replaceState(null, "", location.pathname + "?" + search);
  };
  useEffect(() => {
    const element = pageRef.current;
    if (!element) return;
    const key = "citylit-scroll-" + city.slug + "-" + category;
    try {
      const top = Number(sessionStorage.getItem(key) || 0);
      requestAnimationFrame(() => {
        element.scrollTop = top;
      });
    } catch {}
    const remember = () => {
      try {
        sessionStorage.setItem(key, String(element.scrollTop));
      } catch {}
    };
    element.addEventListener("scroll", remember, { passive: true });
    return () => element.removeEventListener("scroll", remember);
  }, [city.slug, category]);

  useEffect(() => {
    const element = pageRef.current;
    if (!element) return;
    // DOM scroll clipping does not clip the shared WebGL canvas automatically.
    const measure = () =>
      document.documentElement.style.setProperty("--category-page-top", `${element.offsetTop}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--category-page-top");
    };
  }, []);
  return (
    <motion.div
      ref={pageRef}
      className="category-page"
      aria-label={`${category} places in ${city.name}`}
      initial={{ opacity: 0, y: reduced ? 0 : 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.35 }}
    >
      <section className="category-page-hero" aria-labelledby="category-page-title">
        <header className="category-page-heading">
          <div className="category-page-chapter">
            <span>IV</span>Follow your curiosity
          </div>
          <h1 id="category-page-title">{category}</h1>
          <p>
            The places that make {city.short}, {city.short}. Find something worth stepping out for.
          </p>
          <Link className="category-page-back" href={`/${city.slug}`}>
            <ArrowLeft size={15} />
            Back to the city
          </Link>
        </header>
        <div className="category-page-illustration">
          <div className="category-page-meta">
            <span>{city.province}</span>
            <span>An interactive field guide</span>
          </div>
          <div className="category-page-model scene">
            <Scene
              mode="category"
              city={props.city}
              category={props.category}
              index={0}
              reset={props.reset}
              animate={props.animate}
              onCity={() => {}}
              onSelect={() =>
                document
                  .getElementById("category-results")
                  ?.scrollIntoView({ behavior: reduced ? "instant" : "smooth", block: "start" })
              }
            />
          </div>
          <div className="category-page-meta">
            <span>Drag to rotate · pinch to zoom</span>
            <button onClick={props.onHelp}>
              How to play <ArrowUpRight size={11} />
            </button>
          </div>
        </div>
      </section>
      <CategoryNav selected={props.category} onSelect={props.onCategory} />
      <section id="category-results" className="category-page-results" aria-label="Places">
        <div className="category-results-toolbar">
          <h2>
            Your next <span>“let’s go there.”</span>
          </h2>
          <label className="category-page-search">
            <Search size={17} />
            <input
              ref={props.searchRef}
              value={props.query}
              onChange={(event) => props.onQuery(event.target.value)}
              placeholder="Search places"
              aria-label={`Search ${city.short} places`}
            />
            {props.query && (
              <button onClick={() => props.onQuery("")} aria-label="Clear search">
                <X size={15} />
              </button>
            )}
          </label>
        </div>
        <div className="place-filters" aria-label="Practical place filters">
          {[
            ["free", "Free entry"],
            ["indoors", "Indoors"],
            ["family", "Family-friendly"],
            ["access", "Step-free entrance"],
          ].map(([id, label]) => (
            <button key={id} aria-pressed={filters.includes(id)} onClick={() => setFilter(id)}>
              {label}
            </button>
          ))}
          <details>
            <summary>More filters</summary>
            <label>
              District
              <select
                value={district}
                onChange={(e) => {
                  setDistrict(e.target.value);
                  const search = new URLSearchParams(params);
                  if (e.target.value) search.set("district", e.target.value);
                  else search.delete("district");
                  window.history.replaceState(null, "", location.pathname + "?" + search);
                }}
              >
                <option value="">All districts</option>
                {Array.from(new Set(props.places.map((p) => p.district).filter(Boolean))).map(
                  (d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ),
                )}
              </select>
            </label>
          </details>
        </div>
        <p className="planning-note">
          Free, family and access filters use confirmed facts. Setting and visit duration may be
          editorial estimates; unknown details are excluded.
        </p>
        <p className="result-count" aria-live="polite">
          {filterPlaces.length} {filterPlaces.length === 1 ? "place" : "places"} in {city.short}
          {props.query ? " · across all categories" : ""}
        </p>
        <div className="category-place-grid">
          {filterPlaces.map((place, index) => {
            const saved = props.saved.includes(place.id);
            return (
              <motion.article
                className="place-card category-place-card"
                key={place.id}
                initial={{ opacity: 0, y: reduced ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: reduced ? 0 : 0.2,
                  delay: reduced ? 0 : Math.min(index, 5) * 0.035,
                }}
              >
                <div className="place-icon">
                  <CategoryIcon index={categories.indexOf(place.category)} size={27} />
                </div>
                <Link
                  className="place-open"
                  href={`/${place.city}/${categorySlug(place.category)}/${place.id}`}
                  prefetch={false}
                  onNavigate={(event) => {
                    event.preventDefault();
                    props.onPlace(place);
                  }}
                >
                  <span className="tiny-label">{place.category}</span>
                  <h3>{place.name}</h3>
                  <p>{place.description}</p>
                  <span className="address">
                    <MapPin size={11} />
                    {place.address}
                  </span>
                </Link>
                <button
                  className="save-icon"
                  onClick={() => props.onSave(place.id)}
                  aria-label={`Save ${place.name}`}
                  aria-pressed={saved}
                >
                  <Heart size={17} fill={saved ? "currentColor" : "none"} />
                </button>
                <ArrowUpRight size={18} aria-hidden="true" />
              </motion.article>
            );
          })}
        </div>
        {!filterPlaces.length && (
          <div className="empty">
            <KhweziMoment pose="search" />
            <h3>{unseeded ? "A chapter taking shape." : "A little detour."}</h3>
            <p>
              {unseeded
                ? `We haven’t researched ${category.toLowerCase()} in ${city.short} yet. Explore the places we have verified in another category.`
                : "No matching places yet. Try clearing filters or choose another category; unconfirmed details are excluded."}
            </p>
            <button
              className="pill-button"
              onClick={() => {
                if (unseeded) props.onCategory(0);
                else {
                  props.onQuery("");
                  setDistrict("");
                  window.history.replaceState(null, "", location.pathname + "?view=places");
                }
              }}
            >
              {unseeded ? "Explore entertainment" : "Clear search and filters"}
            </button>
          </div>
        )}
      </section>
      <footer className="category-page-footer">
        <span>Made for the wanderers. The locals. The curious.</span>
        <Link href={`/${city.slug}/${categorySlug(category)}`}>
          Back to category picker <ArrowUpRight size={12} />
        </Link>
      </footer>
    </motion.div>
  );
}
