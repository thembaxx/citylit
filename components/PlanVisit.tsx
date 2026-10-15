"use client";
import Link from "next/link";
import { useState } from "react";
import { Plus, Check, ArrowUpRight, ArrowRight, Clock } from "@phosphor-icons/react";
import { places, type Place } from "../lib/data";
import { venuePath } from "../lib/discovery-guide";
import { MAX_TRIP_STOPS } from "../lib/client-data";
import { useDiscovery } from "./useDiscovery";

export default function PlanVisit({
  city,
  cityName,
  stops,
}: {
  city: string;
  cityName: string;
  stops: Place[];
}) {
  const { state, update } = useDiscovery();
  const [message, setMessage] = useState("");
  const localDay = state.itinerary.filter(
    (id) => places.find((place) => place.id === id)?.city === city,
  );
  const toggle = (place: Place) => {
    const included = state.itinerary.includes(place.id);
    const other = places.find((item) => item.id === state.itinerary[0]);
    if (!included && other && other.city !== city) {
      setMessage(
        "You already have a day in another city. Review or clear it in My day before starting here.",
      );
      return;
    }
    if (!included && state.itinerary.length >= MAX_TRIP_STOPS) {
      setMessage(
        `Your day has reached ${MAX_TRIP_STOPS} stops. Remove a stop before adding another.`,
      );
      return;
    }
    const saved = update((previous) => ({
      itinerary: included
        ? previous.itinerary.filter((id) => id !== place.id)
        : [...previous.itinerary, place.id],
    }));
    setMessage(
      saved
        ? `${place.name} ${included ? "removed from" : "added to"} your day.`
        : "This browser could not save your day. Allow site storage and try again.",
    );
  };
  return (
    <section className="atlas-plan atlas-section" id="plan" aria-labelledby="visit-title">
      <div className="atlas-section-heading">
        <div>
          <p className="atlas-eyebrow">A DAY, YOUR WAY</p>
          <h2 id="visit-title">
            A little plan.
            <br />
            <em>Room for the unexpected.</em>
          </h2>
        </div>
        <p>
          A few ideas to get you going in {cityName}.<br />
          Pick a stop. Make it yours.
        </p>
      </div>
      <p className="atlas-plan-note">
        <Clock size={16} aria-hidden="true" /> An editorial starting point. Check opening days,
        travel time and bookings before setting out.
      </p>
      <div className="atlas-plan-grid">
        {stops.map((place, index) => (
          <article key={place.id} className="atlas-plan-stop">
            <span className="atlas-plan-time">
              0{index + 1} /{" "}
              {index === 0
                ? "START SLOW"
                : index === 1
                  ? "FOLLOW YOUR CURIOSITY"
                  : "ONE MORE DISCOVERY"}
            </span>
            <Link href={venuePath(place)} className="atlas-plan-stop-link">
              <h3>{place.name}</h3>
              <p>{place.description}</p>
              <span>
                Plan a visit <ArrowUpRight size={18} />
              </span>
            </Link>
            <button
              className="atlas-button"
              aria-pressed={state.itinerary.includes(place.id)}
              onClick={() => toggle(place)}
            >
              {state.itinerary.includes(place.id) ? <Check size={18} /> : <Plus size={18} />}
              {state.itinerary.includes(place.id) ? "Added to my day" : "Add to my day"}
              <span className="sr-only">: {place.name}</span>
            </button>
          </article>
        ))}
      </div>
      <div className="atlas-plan-bottom">
        <p role="status">
          {message ||
            (localDay.length
              ? `${localDay.length} stop${localDay.length === 1 ? "" : "s"} saved for ${cityName}.`
              : "Your picks stay in this browser. No account needed.")}
        </p>
        <Link href={`/explore?city=${city}&tab=day`} className="atlas-text-link">
          View &amp; arrange my day <ArrowRight size={18} />
        </Link>
      </div>
    </section>
  );
}
