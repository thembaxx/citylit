"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowUpRight,
  Heart,
  Search,
  MapPin,
  Ticket,
  BedDouble,
  Drama,
  Trees,
  Music,
  X,
} from "lucide-react";
import { useEffect, useRef, type RefObject } from "react";
import { categories, categorySlug, cities, type Place } from "../lib/data";
const Scene = dynamic(() => import("./Scene"), { ssr: false });
const icons = [Ticket, BedDouble, Drama, Trees, Music];
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
      <nav className="category-page-tabs" aria-label="Attraction categories">
        {categories.map((name, i) => {
          const Icon = icons[i];
          return (
            <button
              key={name}
              aria-label={name}
              aria-current={i === props.category ? "page" : undefined}
              onClick={() => props.onCategory(i)}
            >
              <Icon size={17} strokeWidth={1.5} />
              {name}
            </button>
          );
        })}
      </nav>
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
        <p className="result-count" aria-live="polite">
          {props.places.length} {props.places.length === 1 ? "place" : "places"} in {city.short}
          {props.query ? " · across all categories" : ""}
        </p>
        <div className="category-place-grid">
          {props.places.map((place, index) => {
            const Icon = icons[categories.indexOf(place.category)];
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
                  <Icon size={27} strokeWidth={1.3} />
                </div>
                <button className="place-open" onClick={() => props.onPlace(place)}>
                  <span className="tiny-label">{place.category}</span>
                  <h3>{place.name}</h3>
                  <p>{place.description}</p>
                  <span className="address">
                    <MapPin size={11} />
                    {place.address}
                  </span>
                </button>
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
        {!props.places.length && (
          <div className="empty">
            <h3>A little detour.</h3>
            <p>No places found. Try another name or explore a different category.</p>
            <button className="pill-button" onClick={() => props.onQuery("")}>
              Clear search
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
