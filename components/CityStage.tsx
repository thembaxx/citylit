"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type KeyboardEvent } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Plus, Check, Path } from "@phosphor-icons/react";
import { places, landmarkSources, categorySlug, type Place } from "../lib/data";
import { landmarkPath, landmarkVenue, venuePath, type GuideCity } from "../lib/discovery-guide";
import { stageModel } from "../lib/stage-models";
import { MAX_TRIP_STOPS } from "../lib/client-data";
import { useDiscovery } from "./useDiscovery";
import GuideShell from "./GuideShell";
import { useKhwezi } from "./KhweziProvider";
const LandmarkRing = dynamic(() => import("./LandmarkRing"), {
  ssr: false,
  loading: () => (
    <p className="stage-loading" role="status">
      Loading 3D…
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
  initialItem,
}: {
  city: GuideCity;
  mode: "landmarks" | "places";
  initialItem?: string;
}) {
  const { state, update } = useDiscovery();
  const router = useRouter();
  const { feedback } = useKhwezi();
  const chipsRef = useRef<HTMLDivElement>(null);
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
  const [index, setIndex] = useState(() => {
    if (!initialItem) return 0;
    const normalized = categorySlug(initialItem);
    const match = items.findIndex((row) =>
      mode === "places"
        ? row.place?.id === initialItem || categorySlug(row.name) === normalized
        : categorySlug(row.name) === normalized,
    );
    return match < 0 ? 0 : match;
  });
  const item = items[index];
  const availableFacts = ["openingHours", "price", "admission", "booking", "accessNotes"]
    .filter((key) => item.place?.facts?.[key]?.value != null)
    .slice(0, 3);
  const pick = (value: number, interaction: "tap" | "swipe" = "tap") => {
    feedback(interaction);
    setIndex((value + items.length) % items.length);
    setMessage("");
  };
  const onChipKeyDown = (event: KeyboardEvent<HTMLButtonElement>, current: number) => {
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? items.length - 1
          : event.key === "ArrowRight"
            ? (current + 1) % items.length
            : event.key === "ArrowLeft"
              ? (current - 1 + items.length) % items.length
              : null;
    if (next === null) return;
    event.preventDefault();
    pick(next);
    chipsRef.current?.querySelectorAll<HTMLButtonElement>("button")[next]?.focus();
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
        <LandmarkRing
          items={items}
          selected={index}
          onSelect={pick}
          itinerary={state.itinerary}
          accent={city.accentColor}
          onOpenGuide={(nextIndex) => router.push(items[nextIndex]?.href ?? item.href)}
        />
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
        </header>
        <div className="atlas-stage-content">
          <div
            ref={chipsRef}
            className="atlas-stage-chips"
            role="group"
            aria-label={`Choose a ${mode === "places" ? "place" : "landmark"}`}
          >
            {items.map((row, i) => (
              <button
                type="button"
                key={row.name}
                aria-pressed={index === i}
                aria-controls="stage-detail"
                onKeyDown={(event) => onChipKeyDown(event, i)}
                onClick={() => pick(i)}
              >
                {row.name}
              </button>
            ))}
          </div>
          <article id="stage-detail" className="atlas-stage-sheet">
            <div
              key={item.href}
              className="atlas-stage-reveal"
              aria-live="polite"
              aria-atomic="true"
            >
              <h2>{item.name}</h2>
              <p className="atlas-stage-description">{item.description}</p>
            </div>
            <div className="atlas-stage-actions">
              <Link href={item.href} className="atlas-button atlas-primary">
                Open guide <ArrowUpRight size={17} />
              </Link>
              {item.place && (
                <button onClick={add} aria-pressed={!!selected} className="atlas-button">
                  {selected ? <Check size={17} /> : <Plus size={17} />}
                  {selected ? "In my day" : "Add to my day"}
                </button>
              )}
            </div>
            {availableFacts.length > 0 && (
              <dl className="atlas-stage-facts">
                {availableFacts.flatMap((key) => {
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
            )}
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
              Models are illustrative. Confirm visiting details in the guide.
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
