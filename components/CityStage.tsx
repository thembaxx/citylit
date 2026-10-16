"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Plus, Check, Path } from "@phosphor-icons/react";
import { places, landmarkSources, type Place } from "../lib/data";
import { landmarkPath, landmarkVenue, venuePath, type GuideCity } from "../lib/discovery-guide";
import { stageModel } from "../lib/stage-models";
import { MAX_TRIP_STOPS } from "../lib/client-data";
import { useDiscovery } from "./useDiscovery";
import GuideShell from "./GuideShell";
const LandmarkRing = dynamic(() => import("./LandmarkRing"), {
  ssr: false,
  loading: () => (
    <p className="stage-loading" role="status">
      Lighting the stage… The guides below are ready to explore.
    </p>
  ),
});
export type StageItem = {
  name: string;
  description: string;
  href: string;
  model: string;
  place?: Place;
};
const factLabels: Record<string, string> = {
  openingHours: "Hours",
  price: "Tickets",
  admission: "Entry",
  booking: "Booking",
  accessNotes: "Access",
};

export default function CityStage({
  city,
  mode,
}: {
  city: GuideCity;
  mode: "landmarks" | "places";
}) {
  const { state, update } = useDiscovery();
  const [index, setIndex] = useState(0);
  const [message, setMessage] = useState("");
  const local = places.filter((place) => place.city === city.slug);
  const items: StageItem[] =
    mode === "places"
      ? local.map((place) => ({
          name: place.name,
          description: place.description,
          href: venuePath(place),
          model: stageModel(place.name, place.category),
          place,
        }))
      : city.landmarks.map((name) => {
          const place = landmarkVenue(city.slug, name);
          const record = landmarkSources.find((item) => item.name === name);
          return {
            name,
            description:
              place?.description ||
              record?.about?.split("\n")[0] ||
              `Discover the story of ${name} in ${city.name}.`,
            href: landmarkPath(city, name),
            model: stageModel(name, place?.category),
            place,
          };
        });
  const item = items[index];
  const pick = (value: number) => {
    setIndex((value + items.length) % items.length);
    setMessage("");
  };
  const selected = item.place && state.itinerary.includes(item.place.id);
  const add = () => {
    const place = item.place;
    if (!place) return;
    const first = places.find((row) => row.id === state.itinerary[0]);
    if (!selected && first && first.city !== city.slug) {
      setMessage("Your day belongs to another city. Clear it in My day before starting a new one.");
      return;
    }
    if (!selected && state.itinerary.length >= MAX_TRIP_STOPS) {
      setMessage("Your day is full. Remove a stop in My day first.");
      return;
    }
    const saved = update((previous) => ({
      itinerary: selected
        ? previous.itinerary.filter((id) => id !== place.id)
        : [...new Set([...previous.itinerary, place.id])],
    }));
    setMessage(
      saved
        ? selected
          ? "Removed from your day."
          : "Added to your day."
        : "This browser could not save your day. Allow site storage and try again.",
    );
  };
  return (
    <GuideShell stage>
      <section className="atlas-stage" aria-labelledby="stage-title">
        <LandmarkRing items={items} selected={index} onSelect={pick} itinerary={state.itinerary} />
        <header className="atlas-stage-heading">
          <nav className="atlas-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href={`/${city.slug}`}>{city.name}</Link>
            <span>/ {mode}</span>
          </nav>
          <h1 id="stage-title">
            {city.name} {mode}
          </h1>
          <p>Drag to turn the ring. Tap a model or choose its name.</p>
        </header>
        <div className="atlas-stage-content">
          <div
            className="atlas-stage-chips"
            aria-label={`Choose a ${mode === "places" ? "place" : "landmark"}`}
          >
            {items.map((row, i) => (
              <button key={row.name} aria-pressed={index === i} onClick={() => pick(i)}>
                {row.name}
              </button>
            ))}
          </div>
          <article className="atlas-stage-sheet" aria-live="polite">
            <p className="atlas-eyebrow">
              {city.name} / {mode === "places" ? "PLACE" : "LANDMARK"} {index + 1} OF {items.length}
            </p>
            <h2>{item.name}</h2>
            <p className="atlas-stage-description">{item.description}</p>
            <div className="atlas-stage-actions">
              <Link href={item.href} className="atlas-button atlas-primary">
                Open the full guide <ArrowUpRight size={17} />
              </Link>
              {item.place && (
                <button onClick={add} aria-pressed={!!selected} className="atlas-button">
                  {selected ? <Check size={17} /> : <Plus size={17} />}
                  {selected ? "In my day" : "Add to my day"}
                </button>
              )}
            </div>
            <dl className="atlas-stage-facts">
              <div>
                <dt>
                  {item.place?.coordinateAccuracy === "venue"
                    ? "Venue reference"
                    : "City reference"}
                </dt>
                <dd>
                  {Math.abs((item.place?.coords || city.coords)[1]).toFixed(2)}° S /{" "}
                  {(item.place?.coords || city.coords)[0].toFixed(2)}° E
                </dd>
              </div>
              <div>
                <dt>Chapter</dt>
                <dd>{city.province}</dd>
              </div>
              {["openingHours", "price", "admission", "booking", "accessNotes"]
                .filter((key) => item.place?.facts?.[key]?.value != null)
                .slice(0, 3)
                .flatMap((key) => {
                  const fact = item.place?.facts?.[key];
                  return fact && fact.value !== null ? (
                    <div key={key} className="stage-fact-wide">
                      <dt>{factLabels[key]}</dt>
                      <dd>
                        {String(fact.value)}
                        <a
                          href={fact.source.startsWith("https:") ? fact.source : item.href}
                          target={fact.source.startsWith("https:") ? "_blank" : undefined}
                          rel="noreferrer"
                        >
                          Source · {fact.checkedAt} <ArrowUpRight size={12} />
                        </a>
                      </dd>
                    </div>
                  ) : (
                    []
                  );
                })}
            </dl>
            <p role="status" className="stage-message">
              {message}
            </p>
            <div className="atlas-stage-controls">
              <button aria-label="Previous discovery" onClick={() => pick(index - 1)}>
                <ArrowLeft size={17} /> Prev
              </button>
              <span>
                {String(index + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
              </span>
              <button aria-label="Next discovery" onClick={() => pick(index + 1)}>
                Next <ArrowRight size={17} />
              </button>
            </div>
            <p className="atlas-stage-note">
              Models are illustrative. Check the guide for photographs, source dates and visitor
              information. Hours and access can change.
            </p>
          </article>
          <nav className="atlas-stage-switch">
            <Link href={`/${city.slug}/${mode === "places" ? "landmarks" : "places"}`}>
              {mode === "places" ? "Landmarks" : "Places"} in 3D <ArrowUpRight size={15} />
            </Link>
            <Link href={`/explore?city=${city.slug}&tab=day`}>
              <Path size={17} /> My day{" "}
              {state.itinerary.length ? `(${state.itinerary.length})` : ""}
            </Link>
          </nav>
        </div>
      </section>
      <noscript>
        <p className="atlas-section">
          Open a researched guide:{" "}
          {items.map((row) => (
            <Link key={row.name} href={row.href}>
              {row.name}
              {" · "}
            </Link>
          ))}
        </p>
      </noscript>
    </GuideShell>
  );
}
