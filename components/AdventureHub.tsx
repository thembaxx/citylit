"use client";
import UiIcon from "./UiIcon";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { MAX_TRIP_STOPS, parseSharedTrip } from "../lib/client-data";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  MapPin,
  BookmarkSimple,
  ArrowUpRight,
  Heart,
  Check,
  Plus,
  X,
  ShareNetwork as Share2,
  Download,
  NavigationArrow as Navigation,
  Sparkle as Sparkles,
  ArrowUp as MoveUp,
  ArrowDown as MoveDown,
} from "@phosphor-icons/react";
import { DropdownSelect } from "./ui/DropdownSelect";
import { cities, places, type Place } from "../lib/data";
import {
  collections,
  activeEvents,
  suggestions,
  placePath,
  orderItinerary,
  distanceKm,
  tripLink,
} from "../lib/adventure";
import { useKhwezi } from "./KhweziProvider";
import GuideShell from "./GuideShell";
import useTheme from "./useTheme";

import PwaPanel from "./PwaPanel";
import { sharedPlace } from "../lib/pwa-share";
import { readyWorker, workerRequest } from "../lib/pwa";
import { usePwa } from "./PwaProvider";
import { useDiscovery } from "./useDiscovery";
import { ItineraryFeasibility } from "./ItineraryFeasibility";
import { AnimatedTabs } from "./ui/AnimatedTabs";
import AnimatedPillGroup from "./ui/AnimatedPillGroup";
import MagneticButton from "./ui/MagneticButton";
import TiltCard from "./ui/TiltCard";
import DynamicIslandToast from "./ui/DynamicIslandToast";
import BenchoMagneticSelect from "./ui/BenchoMagneticSelect";
import BenchoSloshSlider from "./ui/BenchoSloshSlider";
import { benchoAudio } from "../lib/bencho-audio";
const Atmosphere = dynamic(() => import("./Atmosphere"), { ssr: false });

async function requestItineraryTravel(coordinates: number[][]) {
  const response = await fetch("/api/itinerary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ coordinates }),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok)
    throw new Error("Route estimates are unavailable. Enter travel times manually.");
  return response.json();
}

export default function AdventureHub() {
  const { feedback, sound, haptics, toggleSound, toggleHaptics, celebrate, moving } = useKhwezi();
  const pwa = usePwa();
  const params = useSearchParams();
  const incoming = sharedPlace(params.get("shared-url") || params.get("shared-text"));
  const hasIncoming = params.has("shared-url") || params.has("shared-text");
  const initialCity = cities.some((c) => c.slug === params.get("city"))
    ? params.get("city")!
    : cities[0].slug;
  const requestedTab = params.get("trip") ? "day" : params.get("tab");
  const [city, setCity] = useState(initialCity),
    [tab, setTab] = useState(
      requestedTab === "saved"
        ? "day"
        : requestedTab === "collections"
          ? "discover"
          : ["day", "passport", "discover"].includes(requestedTab || "")
            ? requestedTab!
            : "discover",
    ),
    [daySubTab, setDaySubTab] = useState<"saved" | "itineraries">(
      requestedTab === "saved" ? "saved" : "itineraries",
    ),
    [mood, setMood] = useState("culture"),
    [time, setTime] = useState(180),
    [budget, setBudget] = useState("any"),
    [origin, setOrigin] = useState<number[] | null>(null),
    [geoStatus, setGeoStatus] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const { state, update } = useDiscovery();
  const reduced = useReducedMotion();
  const [variant, setVariant] = useState(0);
  const { night } = useTheme();
  const [shared, setShared] = useState<string[]>(() =>
    parseSharedTrip(params.get("trip"), initialCity),
  );
  const local = places.filter((p) => p.city === city);
  const cityCollections = collections.filter((c) => c.city === city);
  const picked = suggestions(city, mood, time, budget, variant);
  const trip = state.itinerary
    .map((id) => places.find((p) => p.id === id))
    .filter((p): p is Place => !!p);
  const events = activeEvents().filter((e) => local.some((p) => p.id === e.placeId));
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(""), 4500);
    return () => clearTimeout(t);
  }, [message]);
  const add = (id: string) => {
    if (state.itinerary.includes(id)) {
      setMessage("Already in your day.");
      return;
    }
    if (trip.length && trip[0].city !== places.find((p) => p.id === id)?.city) {
      setMessage("Your day is in another city. Clear it before changing destinations.");
      setTab("day");
      return;
    }
    if (trip.length >= MAX_TRIP_STOPS) {
      setMessage(`Your day has reached ${MAX_TRIP_STOPS} stops. Remove a stop first.`);
      return;
    }
    const saved = update((previous) => ({
      itinerary: Array.from(new Set([...previous.itinerary, id])),
    }));
    setDaySubTab("itineraries");
    if (saved) benchoAudio.playConfirm();
    setMessage(
      saved
        ? "Added to your day."
        : "This browser could not save your day. Allow site storage and try again.",
    );
  };
  const addMany = (placeIds: string[]) => {
    const additions = Array.from(new Set(placeIds)).filter(
      (id) => !state.itinerary.includes(id) && places.some((place) => place.id === id),
    );
    const firstNewPlace = places.find((place) => place.id === additions[0]);
    if (!additions.length) {
      setMessage("These places are already in your day.");
      setTab("day");
      return;
    }
    if (trip.length && firstNewPlace && trip[0].city !== firstNewPlace.city) {
      setMessage("Your day is in another city. Clear it before changing destinations.");
      setTab("day");
      return;
    }
    const available = MAX_TRIP_STOPS - state.itinerary.length;
    if (additions.length > available) {
      setMessage(
        `This collection adds ${additions.length} places, but your day has room for ${available}. Remove a stop first.`,
      );
      setTab("day");
      return;
    }
    const saved = update((previous) => ({
      itinerary: Array.from(new Set([...previous.itinerary, ...additions])),
    }));
    setDaySubTab("itineraries");
    if (saved) benchoAudio.playConfirm();
    setMessage(
      saved
        ? `Added ${additions.length} ${additions.length === 1 ? "place" : "places"} to your day.`
        : "This browser could not save your day. Allow site storage and try again.",
    );
    setTab("day");
  };
  const moveStop = (placeId: string, direction: -1 | 1) => {
    const ids = trip.map((place) => place.id);
    const index = ids.indexOf(placeId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= ids.length) return;
    [ids[index], ids[nextIndex]] = [ids[nextIndex], ids[index]];
    update({ itinerary: ids });
    const name = places.find((place) => place.id === placeId)?.name || "Stop";
    setMessage(`${name} moved ${direction < 0 ? "earlier" : "later"}.`);
  };
  const removeStop = (placeId: string) => {
    const name = places.find((place) => place.id === placeId)?.name || "Place";
    update({ itinerary: state.itinerary.filter((id) => id !== placeId) });
    setMessage(`${name} removed from your day.`);
  };
  const share = async (ids: string[]) => {
    const url = new URL(
      tripLink(ids, places.find((p) => p.id === ids[0])?.city || city),
      location.origin,
    ).href;
    try {
      if (navigator.share) {
        await navigator.share({ title: "My Citylit adventure", url });
        setMessage("Adventure shared.");
      } else {
        await navigator.clipboard.writeText(url);
        setMessage("Link copied.");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setMessage(url);
    }
  };
  const nearby = () => {
    if (!navigator.geolocation) {
      setGeoStatus("Location is unavailable. You can still browse by city.");
      return;
    }
    setBusy(true);
    setGeoStatus("Finding your location…");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setOrigin([p.coords.longitude, p.coords.latitude]);
        setGeoStatus("Distances are straight-line estimates to verified venue pins.");
        setBusy(false);
      },
      () => {
        setGeoStatus("Location was not available. Choose a city to keep exploring.");
        setBusy(false);
      },
      { timeout: 10000, maximumAge: 60000 },
    );
  };
  const download = async () => {
    if (pwa.waiting || pwa.reloadReady) {
      setMessage("Update Citylit in app settings before preparing the latest guide.");
      return;
    }
    setMessage("Saving your field guide…");
    try {
      const response = await workerRequest(
        await readyWorker(),
        "SAVE_GUIDE",
        Array.from(new Set([...state.saved, ...state.itinerary])),
      );
      setMessage(
        response.ok
          ? "Field guide ready for offline use."
          : response.textSaved
            ? "Some images were unavailable; text is saved."
            : "The guide could not be saved. Connect and try again.",
      );
      await pwa.refreshStatus();
      if (response.textSaved)
        celebrate(
          "offline",
          response.ok
            ? "Your field guide is downloaded and ready to travel."
            : "Your text guide is downloaded. Some photos could not be saved.",
        );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Offline saving needs a secure browser with service workers.",
      );
    }
  };
  const card = (p: Place, near = false) => (
    <TiltCard className="adventure-card" maxTilt={2.2} key={p.id}>
      <Link href={placePath(p)}>
        <span className="tiny-label">
          {p.category} · {cities.find((item) => item.slug === p.city)?.short || p.city}
          {near && origin ? ` · ${distanceKm(origin, p.coords).toFixed(1)} km` : ""}
        </span>
        <h3>{p.name}</h3>
        <p>{p.description}</p>
        <span className="address">{p.address}</span>
      </Link>
      <div className="adventure-card-actions">
        <MagneticButton
          className="adventure-card-add is-icon-only"
          aria-label={
            state.itinerary.includes(p.id) ? `In your day: ${p.name}` : `Add to day: ${p.name}`
          }
          title={state.itinerary.includes(p.id) ? "In your day" : "Add to day"}
          aria-pressed={state.itinerary.includes(p.id)}
          onClick={() => add(p.id)}
        >
          {state.itinerary.includes(p.id) ? <Check size={17} /> : <Plus size={17} />}
        </MagneticButton>
        <button
          className={`adventure-card-save ${state.saved.includes(p.id) ? "is-saved" : ""}`}
          aria-label={
            state.saved.includes(p.id) ? `Saved discovery: ${p.name}` : `Save discovery: ${p.name}`
          }
          aria-pressed={state.saved.includes(p.id)}
          onClick={() =>
            update({
              saved: state.saved.includes(p.id)
                ? state.saved.filter((id) => id !== p.id)
                : [...state.saved, p.id],
            })
          }
        >
          <Heart size={18} weight={state.saved.includes(p.id) ? "fill" : "regular"} />
        </button>
      </div>
    </TiltCard>
  );
  return (
    <GuideShell backdrop={false}>
      <div
        className="field-guide guide-planner"
        onClickCapture={(event) => {
          const button = (event.target as HTMLElement).closest("button");
          if (button && !button.getAttribute("aria-label")?.startsWith("Save")) feedback("tap");
        }}
      >
        <Atmosphere
          mode="guide"
          city={Math.max(
            0,
            cities.findIndex((c) => c.slug === city),
          )}
          category={0}
          night={night}
          animate={moving}
        />
        <div className="citylit-myday-header-wrap">
          <h1>
            {tab === "day" ? "My day" : tab === "passport" ? "My discoveries" : "Discover places"}
          </h1>
          {tab === "day" && (
            <button
              type="button"
              className="citylit-myday-plus-btn"
              aria-label="Add places to your day"
              onClick={() => setTab("discover")}
            >
              <Plus size={20} weight="bold" />
            </button>
          )}
        </div>
        <p className="field-guide-intro">
          {tab === "day"
            ? "Choose a few places and make a day of it."
            : tab === "passport"
              ? "Your saved discoveries and travel settings."
              : `Find something to love in ${cities.find((item) => item.slug === city)?.name || "South Africa"}.`}
        </p>
        {hasIncoming && (
          <section className="incoming-discovery" aria-label="Shared discovery">
            <span className="tiny-label">A SPARK SHARED WITH YOU</span>
            {incoming ? (
              <>
                <h2>{incoming.name}</h2>
                <p>{incoming.description}</p>
                <div className="pwa-actions">
                  <Link href={placePath(incoming)}>
                    Open discovery <UiIcon name="arrow-up-right" />
                  </Link>
                  <button
                    aria-pressed={state.saved.includes(incoming.id)}
                    onClick={() =>
                      update({
                        saved: state.saved.includes(incoming.id)
                          ? state.saved.filter((id) => id !== incoming.id)
                          : [...state.saved, incoming.id],
                      })
                    }
                  >
                    {state.saved.includes(incoming.id)
                      ? "Saved discovery"
                      : "Save shared discovery"}
                  </button>
                </div>
              </>
            ) : (
              <p>
                This link isn’t in the catalog yet. Choose a destination below to find a little
                adventure.
              </p>
            )}
          </section>
        )}
        {tab !== "passport" && (
          <div className="select-city">
            <DropdownSelect
              ariaLabel="Choose a city"
              value={city}
              onChange={(nextCity) => {
                setCity(nextCity);
                setOrigin(null);
              }}
              options={cities.map((c) => ({
                value: c.slug,
                label: c.name,
                description: c.province,
                icon: <MapPin size={16} weight="duotone" />,
              }))}
            />
          </div>
        )}
        <AnimatedTabs
          ariaLabel="Your guide"
          idPrefix="planner"
          value={tab}
          onChange={(nextTab) => {
            setTab(nextTab);
            if (nextTab === "day" && trip.length > 0) {
              setDaySubTab("itineraries");
            }
          }}
          items={[
            ["discover", "Discover"],
            ["day", "My day"],
            ["passport", "Passport"],
          ].map(([id, label]) => ({
            id,
            label,
            badge: id === "day" && state.itinerary.length ? state.itinerary.length : undefined,
          }))}
        />
        {/* Bencho Dynamic Island Status Pill */}
        <DynamicIslandToast message={message} onDismiss={() => setMessage("")} />

        <p className="hub-message" role="status">
          {message}
        </p>
        <div
          key={tab}
          id="planner-panel"
          role="tabpanel"
          aria-labelledby={`planner-tab-${tab}`}
          tabIndex={0}
        >
          {tab === "discover" && (
            <>
              <section className="adventure-section">
                <h2 className="sr-only">Places to add to your day</h2>
                <details className="planner-refine">
                  <summary>Refine my adventure</summary>
                  <div className="preference-grid planner-pill-filters">
                    <div className="planner-pill-row">
                      <span className="planner-pill-label">Mood</span>
                      <AnimatedPillGroup
                        ariaLabel="Filter by mood"
                        activeId={mood}
                        onChange={(id) => setMood(id)}
                        items={[
                          { id: "culture", label: "Art & stories" },
                          { id: "nature", label: "Fresh air" },
                          { id: "night", label: "Night on stage" },
                          { id: "surprise", label: "Surprise me" },
                        ]}
                      />
                    </div>
                    <div className="planner-pill-row bencho-time-slider-row">
                      <BenchoSloshSlider
                        label="Available Time"
                        value={time}
                        onChange={(val) => setTime(val)}
                        detents={[
                          { value: 60, label: "1h" },
                          { value: 180, label: "3h" },
                          { value: 360, label: "All day" },
                        ]}
                        min={60}
                        max={360}
                      />
                    </div>
                    <div className="planner-pill-row">
                      <span className="planner-pill-label">Budget</span>
                      <AnimatedPillGroup
                        ariaLabel="Filter by budget"
                        activeId={budget}
                        onChange={(id) => setBudget(id)}
                        items={[
                          { id: "any", label: "Any budget" },
                          { id: "free", label: "Free entry" },
                          { id: "under200", label: "Up to R200" },
                        ]}
                      />
                    </div>
                  </div>
                  <p className="planning-note">
                    A starting point, not a timed booking. Visit durations are editorial estimates;
                    check tickets and opening hours with each venue.{" "}
                    {budget === "under200" &&
                      "Budget uses standard adult entry rates, excluding travel and conditional discounts."}
                  </p>
                </details>
                <div className="adventure-grid">{picked.map((p) => card(p))}</div>
                {!picked.length && (
                  <p>
                    No places fit these preferences yet. Try more time, any budget or another
                    destination.
                  </p>
                )}
                <MagneticButton
                  className="pill-button planner-shuffle"
                  onClick={() => setVariant((v) => v + 1)}
                >
                  Find another adventure <Sparkles size={16} />
                </MagneticButton>
              </section>
              <section className="adventure-section">
                <h2>Local collections</h2>
                <p>Ready-made trails through {cities.find((item) => item.slug === city)?.name}.</p>
                {cityCollections.length ? (
                  <div className="adventure-grid">
                    {cityCollections.map((c) => (
                      <TiltCard className="collection-card" maxTilt={2.0} key={c.id}>
                        <Sparkles size={24} />
                        <h3>{c.title}</h3>
                        <p>{c.description}</p>
                        <ol>
                          {c.placeIds.map((id) => {
                            const p = places.find((p) => p.id === id)!;
                            return (
                              <li key={id}>
                                <Link href={placePath(p)}>{p.name}</Link>
                              </li>
                            );
                          })}
                        </ol>
                        <div className="collection-card-actions">
                          <MagneticButton strength={0.14} onClick={() => addMany(c.placeIds)}>
                            Make this my day <ArrowUpRight size={15} />
                          </MagneticButton>
                          <button
                            className="is-icon-only"
                            aria-label={`Share ${c.title} collection`}
                            title="Share collection"
                            onClick={() => share(c.placeIds)}
                          >
                            <Share2 size={16} />
                          </button>
                        </div>
                      </TiltCard>
                    ))}
                  </div>
                ) : (
                  <p>No ready-made trail for this city yet. Add places from the list above.</p>
                )}
              </section>
              <section className="adventure-section">
                <h2>Nearby discoveries</h2>
                <p>Your location stays in this page and is never sent to Citylit.</p>
                <MagneticButton
                  className="pill-button"
                  strength={0.15}
                  disabled={busy}
                  onClick={nearby}
                >
                  <Navigation size={16} />
                  Use my location
                </MagneticButton>
                <p role="status">{geoStatus}</p>
                {origin && (
                  <div className="adventure-grid">
                    {places
                      .filter(
                        (p) =>
                          p.coordinateAccuracy === "venue" && distanceKm(origin, p.coords) <= 50,
                      )
                      .sort((a, b) => distanceKm(origin, a.coords) - distanceKm(origin, b.coords))
                      .slice(0, 6)
                      .map((p) => card(p, true))}
                  </div>
                )}
                {origin &&
                  !places.some(
                    (p) => p.coordinateAccuracy === "venue" && distanceKm(origin, p.coords) <= 50,
                  ) && (
                    <p>
                      No verified venue pins within 50 km. Browse your chosen destination instead.
                    </p>
                  )}
              </section>
              <section className="adventure-section">
                <h2>On the calendar</h2>
                {events.map((e) => (
                  <TiltCard className="event-card" maxTilt={1.8} key={e.id}>
                    <h3>{e.title}</h3>
                    <p>
                      {e.start} to {e.end}
                    </p>
                    <Link href={placePath(places.find((p) => p.id === e.placeId)!)}>
                      {places.find((p) => p.id === e.placeId)!.name}
                    </Link>
                    <a href={e.source} target="_blank" rel="noreferrer">
                      Programme &amp; tickets <ArrowUpRight size={14} />
                    </a>
                    <p className="planning-note">
                      Checked {e.checkedAt}. Confirm availability with the venue.
                    </p>
                  </TiltCard>
                ))}
                {!events.length && (
                  <p>No current events have been verified for this destination yet.</p>
                )}
              </section>
            </>
          )}

          {tab === "day" && (
            <section className="adventure-section citylit-myday-section">
              <BenchoMagneticSelect
                ariaLabel="My day sections"
                value={daySubTab}
                onChange={(id) => setDaySubTab(id as "saved" | "itineraries")}
                className="citylit-myday-pill-nav"
                items={[
                  { id: "saved", label: "Saved" },
                  {
                    id: "itineraries",
                    label: "Itineraries",
                    badge: trip.length > 0 ? trip.length : undefined,
                  },
                ]}
              />

              {daySubTab === "saved" ? (
                <div className="citylit-saved-view">
                  <div className="citylit-saved-list">
                    {(state.saved.length > 0
                      ? state.saved
                          .map((id) => places.find((p) => p.id === id))
                          .filter((p): p is Place => !!p)
                      : places.slice(0, 3)
                    ).map((p) => {
                      const placeCity = cities.find((c) => c.slug === p.city);
                      const isSaved = state.saved.includes(p.id);
                      return (
                        <div className="citylit-saved-card" key={p.id}>
                          <div className="citylit-saved-thumb">
                            {p.images[0] && (
                              <Image
                                src={p.images[0].src}
                                alt={p.images[0].alt}
                                fill
                                sizes="56px"
                              />
                            )}
                          </div>
                          <div className="citylit-saved-info">
                            <Link href={placePath(p)}>
                              <h3 className="citylit-saved-name">{p.name}</h3>
                            </Link>
                            <p className="citylit-saved-location">
                              {placeCity
                                ? `${placeCity.name}, ${placeCity.province}`
                                : "South Africa"}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="citylit-saved-bookmark-btn"
                            aria-label={isSaved ? `Remove ${p.name} from saved` : `Save ${p.name}`}
                            onClick={() => {
                              update({
                                saved: isSaved
                                  ? state.saved.filter((id) => id !== p.id)
                                  : [...state.saved, p.id],
                              });
                              setMessage(
                                isSaved ? `${p.name} removed from saved.` : `${p.name} saved.`,
                              );
                            }}
                          >
                            <BookmarkSimple size={22} weight={isSaved ? "fill" : "regular"} />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="citylit-adventure-callout">
                    <div className="citylit-adventure-callout-icon">
                      <Sparkles size={24} weight="bold" />
                    </div>
                    <div className="citylit-adventure-callout-body">
                      <h3>Plan your next adventure</h3>
                      <p>Save places and build your perfect trip.</p>
                    </div>
                    <button
                      type="button"
                      className="citylit-adventure-callout-btn"
                      onClick={() => setDaySubTab("itineraries")}
                    >
                      Create itinerary
                    </button>
                  </div>
                </div>
              ) : (
                <div className="citylit-itineraries-view">
                  <h2>
                    {trip.length
                      ? `Your day · ${trip.length} ${trip.length === 1 ? "stop" : "stops"}`
                      : "Build a day"}
                  </h2>
                  {!trip.length && shared.length === 0 && (
                    <div className="reference-trip-empty">
                      <MapPin size={26} aria-hidden="true" />
                      <div>
                        <h3>Start with a place that makes you curious.</h3>
                        <p>Find places one by one, or start with a ready-made collection.</p>
                      </div>
                      <div className="reference-trip-empty-actions">
                        <button className="pill-button" onClick={() => setTab("discover")}>
                          Find places <ArrowUpRight size={15} />
                        </button>
                        <button className="pill-button" onClick={() => setTab("discover")}>
                          Browse collections <ArrowUpRight size={15} />
                        </button>
                      </div>
                    </div>
                  )}
                  {shared.length > 0 && (
                    <div className="shared-trip">
                      <p>A shared adventure with {shared.length} stops.</p>
                      <button
                        onClick={() => {
                          const first = places.find((p) => p.id === shared[0])!;
                          const same = shared.filter(
                            (id) => places.find((p) => p.id === id)?.city === first.city,
                          );
                          update({ itinerary: same });
                          setCity(first.city);
                          setShared([]);
                          setMessage("Shared day imported.");
                        }}
                      >
                        Import shared day
                      </button>
                    </div>
                  )}
                  {trip.length > 0 && (
                    <p>
                      Stops can be reordered. Nearby grouping uses verified venue pins and keeps
                      city reference pins at the end.
                    </p>
                  )}
                  {trip.length > 0 && (
                    <div className="day-actions">
                      <button
                        onClick={() => {
                          update({
                            itinerary: orderItinerary(state.itinerary, origin || undefined).map(
                              (p) => p.id,
                            ),
                          });
                          setMessage(
                            "Verified pins grouped by proximity; approximate pins kept at the end.",
                          );
                        }}
                        disabled={!trip.length}
                      >
                        <MapPin size={16} />
                        Group nearby stops
                      </button>
                      <button
                        className="is-icon-only"
                        aria-label="Share day"
                        title="Share day"
                        onClick={() => share(state.itinerary)}
                        disabled={!trip.length}
                      >
                        <Share2 size={16} />
                      </button>
                      <button
                        onClick={() => {
                          update({ itinerary: [] });
                          setMessage("Your day has been cleared.");
                        }}
                        disabled={!trip.length}
                      >
                        Clear day
                      </button>
                    </div>
                  )}
                  <ol className="trip-stops">
                    {trip.map((p, i) => (
                      <li key={p.id}>
                        <span className="stop-number">{i + 1}</span>
                        <div>
                          <Link href={placePath(p)}>
                            <h3>{p.name}</h3>
                          </Link>
                          <p>{p.address}</p>
                          <span className="planning-note">
                            {p.facts?.durationMinutes?.value || 90} min planning estimate ·{" "}
                            {p.coordinateAccuracy === "venue" ? "venue pin" : "city reference pin"}
                          </span>
                          <a
                            className="is-icon-only"
                            aria-label={`Directions to ${p.name}`}
                            title="Directions"
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name + " " + p.address)}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ArrowUpRight size={15} />
                          </a>
                        </div>
                        <div className="stop-actions">
                          {([-1, 1] as const).map((d) => (
                            <button
                              key={d}
                              disabled={i + d < 0 || i + d >= trip.length}
                              aria-label={`Move ${p.name} ${d < 0 ? "up" : "down"}`}
                              onClick={() => moveStop(p.id, d)}
                            >
                              {d < 0 ? <MoveUp size={16} /> : <MoveDown size={16} />}
                            </button>
                          ))}
                          <button
                            aria-label={`Remove ${p.name} from day`}
                            onClick={() => removeStop(p.id)}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ol>
                  {trip.length > 0 && (
                    <p className="planning-note">
                      About{" "}
                      {trip.reduce((n, p) => n + Number(p.facts?.durationMinutes?.value || 90), 0)}{" "}
                      minutes at venues, excluding travel. Confirm distances and routes in your maps
                      app.
                    </p>
                  )}
                  <ItineraryFeasibility places={trip} onRequestTravel={requestItineraryTravel} />
                </div>
              )}
            </section>
          )}
          {tab === "passport" && (
            <section className="adventure-section">
              <h2>Your discovery passport</h2>
              <PwaPanel />
              <div className="passport-settings" role="group" aria-label="Passport preferences">
                <label className="setting-row">
                  <input
                    type="checkbox"
                    checked={state.passport}
                    onChange={(e) => update({ passport: e.target.checked })}
                  />
                  Collect illustrated stamps
                </label>
                <label className="setting-row">
                  <input
                    type="checkbox"
                    checked={state.essential}
                    onChange={(event) => update({ essential: event.target.checked })}
                  />
                  Essential motion
                </label>
                <label className="setting-row">
                  <input type="checkbox" checked={sound} onChange={toggleSound} />
                  Quiet sound effects
                </label>
                <label className="setting-row">
                  <input type="checkbox" checked={haptics} onChange={toggleHaptics} />
                  Touch feedback where supported
                </label>
              </div>
              <p>
                {state.saved.length} saved · {state.visited.length} marked visited. Saved places and
                visits are separate.
              </p>
              {state.passport && (
                <div className="passport-stamps">
                  {cities
                    .filter((c) =>
                      places.some((p) => p.city === c.slug && state.visited.includes(p.id)),
                    )
                    .map((c) => (
                      <motion.div
                        key={c.slug}
                        className="passport-stamp"
                        initial={{ scale: reduced ? 1 : 0.96, opacity: reduced ? 1 : 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: reduced ? 0 : 0.18, ease: "easeOut" }}
                      >
                        <Check size={25} />
                        <strong>{c.short}</strong>
                        <span>Visited chapter</span>
                      </motion.div>
                    ))}
                </div>
              )}
              {state.saved.length || state.visited.length ? (
                <div className="adventure-grid">
                  {places
                    .filter((p) => state.saved.includes(p.id) || state.visited.includes(p.id))
                    .map((p) => (
                      <article className="adventure-card" key={p.id}>
                        <Link href={placePath(p)}>
                          <h3>{p.name}</h3>
                        </Link>
                        <button
                          onClick={() =>
                            update({
                              visited: state.visited.includes(p.id)
                                ? state.visited.filter((id) => id !== p.id)
                                : [...state.visited, p.id],
                            })
                          }
                        >
                          {state.visited.includes(p.id) ? "Undo visited" : "Mark as visited"}
                        </button>
                      </article>
                    ))}
                </div>
              ) : (
                <div className="reference-saved-empty">
                  <BookmarkSimple size={28} />
                  <h3>Your saved places will live here.</h3>
                  <p>
                    Save a landmark or venue while exploring, then come back when you are ready to
                    plan.
                  </p>
                  <button className="pill-button" onClick={() => setTab("discover")}>
                    Discover places <ArrowUpRight size={15} />
                  </button>
                </div>
              )}
              <button className="pill-button" onClick={download}>
                <Download size={16} />
                Save field guide offline
              </button>
            </section>
          )}
        </div>
      </div>
    </GuideShell>
  );
}
