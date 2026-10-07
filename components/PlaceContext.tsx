"use client";
import Link from "next/link";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Info, Wifi, Waves, Dumbbell } from "lucide-react";
import { places, categorySlug, type Place } from "../lib/data";
import CategoryIcon from "./CategoryIcon";
import { categories } from "../lib/data";
export default function PlaceContext({ place }: { place: Place }) {
  const [expanded, setExpanded] = useState(false);
  const reduced = useReducedMotion();
  const about = place.about || place.description;
  const related = places.filter(
    (other) =>
      other.id !== place.id &&
      place.locationGroup &&
      other.locationGroup === place.locationGroup &&
      other.city === place.city,
  );
  const icons = { wifi: Wifi, pool: Waves, fitness: Dumbbell, info: Info };
  return (
    <div className="place-context">
      <section aria-labelledby="about-place">
        <h2 id="about-place">About</h2>
        <motion.div
          layout={reduced ? false : "size"}
          transition={{ duration: reduced ? 0 : 0.24 }}
          className="about-container"
        >
          <p className={expanded ? "about-copy" : "about-copy about-collapsed"}>{about}</p>
        </motion.div>
        {about.length > 180 && (
          <button
            className="about-more"
            aria-expanded={expanded}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Less" : "More"}
          </button>
        )}
        {place.wikipedia && (
          <a className="context-source" href={place.wikipedia} target="_blank" rel="noreferrer">
            More on Wikipedia <ArrowUpRight size={14} />
          </a>
        )}
        {place.aboutLicense && (
          <a className="context-license" href={place.aboutLicense} target="_blank" rel="noreferrer">
            Wikipedia contributors · CC BY-SA 4.0 · excerpt
          </a>
        )}
      </section>
      <section aria-labelledby="good-to-know">
        <h2 id="good-to-know">Good to know</h2>
        {place.goodToKnow?.length ? (
          <ul className="venue-facts">
            {place.goodToKnow.map((fact) => {
              const Icon = icons[fact.icon];
              return (
                <li key={fact.label}>
                  <Icon size={20} aria-hidden="true" />
                  <a href={fact.source} target="_blank" rel="noreferrer">
                    {fact.label}
                    <ArrowUpRight size={12} />
                  </a>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="facts-unconfirmed">
            Payment methods, Wi-Fi and accessibility details haven’t been confirmed.{" "}
            <a href={place.website} target="_blank" rel="noreferrer">
              Check with the venue <ArrowUpRight size={14} />
            </a>
          </p>
        )}
      </section>
      {related.length > 0 && (
        <section aria-labelledby="same-location">
          <h2 id="same-location">Also at this location</h2>
          <div className="same-location-rail">
            {related.map((other) => (
              <Link
                className="location-card"
                key={other.id}
                href={`/${other.city}/${categorySlug(other.category)}/${other.id}`}
              >
                <CategoryIcon index={categories.indexOf(other.category)} size={25} />
                <h3>{other.name}</h3>
                <p>{other.category}</p>
                <ArrowUpRight size={15} />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
