"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Plus,
  Check,
  Leaf,
  Mountains,
  Buildings,
  CornersOut,
  CornersIn,
} from "@phosphor-icons/react";
import { places, landmarkSources, categorySlug, type Place } from "../lib/data";
import { landmarkPath, landmarkVenue, venuePath, type GuideCity } from "../lib/discovery-guide";
import { stageModel } from "../lib/stage-models";
import { MAX_TRIP_STOPS } from "../lib/client-data";
import { useDiscovery } from "./useDiscovery";
import GuideShell from "./GuideShell";
import { useKhwezi } from "./KhweziProvider";
import AnimatedPillGroup from "./ui/AnimatedPillGroup";
import MagneticButton from "./ui/MagneticButton";
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

function getLandmarkIcon(name: string, category?: string) {
  const lower = (name + " " + (category || "")).toLowerCase();
  if (
    lower.includes("garden") ||
    lower.includes("park") ||
    lower.includes("botanical") ||
    lower.includes("nature")
  ) {
    return <Leaf size={15} aria-hidden="true" weight="fill" />;
  }
  if (
    lower.includes("cave") ||
    lower.includes("mountain") ||
    lower.includes("hill") ||
    lower.includes("point") ||
    lower.includes("rock")
  ) {
    return <Mountains size={15} aria-hidden="true" weight="fill" />;
  }
  return <Buildings size={15} aria-hidden="true" weight="fill" />;
}

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
  const [message, setMessage] = useState("");
  const [focusMode, setFocusMode] = useState(false);
  const local = places.filter((place) => place.city === city.slug);

  useEffect(() => {
    if (!focusMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFocusMode(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusMode]);
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
      <section
        className={`atlas-stage${focusMode ? " is-focused-stage" : ""}`}
        aria-labelledby="stage-title"
      >
        <LandmarkRing
          items={items}
          selected={index}
          onSelect={pick}
          itinerary={state.itinerary}
          accent={city.accentColor}
          onOpenGuide={(nextIndex) => router.push(items[nextIndex]?.href ?? item.href)}
        />
        {focusMode && (
          <button
            type="button"
            className="atlas-stage-unfocus-pill"
            onClick={() => setFocusMode(false)}
            aria-label="Restore guide details"
          >
            <CornersIn size={16} /> Show guide details
          </button>
        )}
        <header className="atlas-stage-heading">
          <nav className="atlas-breadcrumb" aria-label="Breadcrumb">
            <Link href={`/${city.slug}`}>{city.name}</Link>
          </nav>
          <h1 id="stage-title">
            {city.name} {mode}
          </h1>
        </header>
        <div className="atlas-stage-content">
          <AnimatedPillGroup
            className="atlas-stage-chips"
            ariaLabel={`Choose a ${mode === "places" ? "place" : "landmark"}`}
            activeId={item.name}
            onChange={(_id, i) => pick(i)}
            items={items.map((row) => ({
              id: row.name,
              label: row.name,
              icon: getLandmarkIcon(row.name, row.place?.category),
              ariaControls: "stage-detail",
            }))}
          />
          <div id="stage-detail" className="atlas-stage-sheet">
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
                <MagneticButton
                  onClick={add}
                  aria-pressed={!!selected}
                  className="atlas-button"
                  strength={0.16}
                >
                  {selected ? <Check size={17} /> : <Plus size={17} />}
                  {selected ? "In my day" : "Add to my day"}
                </MagneticButton>
              )}
              <MagneticButton
                onClick={() => setFocusMode((v) => !v)}
                className="atlas-button atlas-stage-focus-btn"
                strength={0.16}
                aria-pressed={focusMode}
                aria-label={focusMode ? "Show guide sheet" : "Focus on 3D view"}
              >
                {focusMode ? <CornersIn size={17} /> : <CornersOut size={17} />}
                {focusMode ? "Show details" : "Focus 3D"}
              </MagneticButton>
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
              <MagneticButton
                aria-label="Previous discovery"
                strength={0.18}
                onClick={() => pick(index - 1)}
              >
                <ArrowLeft size={17} /> Prev
              </MagneticButton>
              <span>
                {String(index + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
              </span>
              <MagneticButton
                aria-label="Next discovery"
                strength={0.18}
                onClick={() => pick(index + 1)}
              >
                Next <ArrowRight size={17} />
              </MagneticButton>
            </div>
          </div>
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
