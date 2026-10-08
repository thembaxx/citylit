"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  MapPin,
  ArrowUpRight,
  Heart,
  Check,
  Plus,
  X,
  Share2,
  Download,
  Navigation,
  Sparkles,
  MoveUp,
  MoveDown,
} from "lucide-react";
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
import ThemeToggle from "./ThemeToggle";
import { useDelight } from "./useDelight";
import { useDiscovery } from "./useDiscovery";
const Atmosphere = dynamic(() => import("./Atmosphere"), { ssr: false });
export default function AdventureHub() {
  const { feedback, sound, haptics, toggleSound, toggleHaptics } = useDelight();
  const params = useSearchParams();
  const initialCity = cities.some((c) => c.slug === params.get("city"))
    ? params.get("city")!
    : cities[0].slug;
  const [city, setCity] = useState(initialCity),
    [tab, setTab] = useState(params.get("trip") ? "day" : "discover"),
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
  const [night, setNight] = useState(true);
  const [shared, setShared] = useState<string[]>(
    () =>
      params
        .get("trip")
        ?.split(",")
        .filter((id) => places.some((p) => p.id === id)) || [],
  );
  const local = places.filter((p) => p.city === city);
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
    update({ itinerary: [...state.itinerary, id] });
    setMessage("Added to your day.");
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
    } catch {
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
    try {
      if (!("serviceWorker" in navigator)) throw new Error();
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<never>((_, reject) =>
          window.setTimeout(() => reject(new Error("Service worker unavailable")), 5000),
        ),
      ]);
      const target = registration.active;
      if (!target) throw new Error();
      const channel = new MessageChannel();
      channel.port1.onmessage = (e) =>
        setMessage(
          e.data.ok
            ? "Field guide ready for offline use."
            : e.data.textSaved
              ? "Some images were unavailable; text is saved."
              : "The guide could not be saved. Connect and try again.",
        );
      target.postMessage({ type: "SAVE_GUIDE", ids: state.saved }, [channel.port2]);
      setMessage("Saving your field guide…");
    } catch {
      setMessage("Offline saving needs a secure browser with service workers.");
    }
  };
  const card = (p: Place, near = false) => (
    <article className="adventure-card" key={p.id}>
      <Link href={placePath(p)}>
        <span className="tiny-label">
          {p.category}
          {near && origin ? ` · ${distanceKm(origin, p.coords).toFixed(1)} km` : ""}
        </span>
        <h3>{p.name}</h3>
        <p>{p.description}</p>
        <span className="address">{p.address}</span>
      </Link>
      <div className="adventure-card-actions">
        <button aria-label={`Add ${p.name} to day`} onClick={() => add(p.id)}>
          <Plus size={16} />
          Add to day
        </button>
        <button
          aria-label={`Save ${p.name}`}
          aria-pressed={state.saved.includes(p.id)}
          onClick={() =>
            update({
              saved: state.saved.includes(p.id)
                ? state.saved.filter((id) => id !== p.id)
                : [...state.saved, p.id],
            })
          }
        >
          <Heart size={16} fill={state.saved.includes(p.id) ? "currentColor" : "none"} />
        </button>
      </div>
    </article>
  );
  return (
    <main
      className="field-guide"
      onClickCapture={(event) => {
        if ((event.target as HTMLElement).closest("button")) feedback("tap");
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
        animate={!state.essential}
      />
      <header className="field-guide-header">
        <ThemeToggle onChange={setNight} />
        <Link href="/">← Back to the map</Link>
        <Link href="/offline.html">
          <Download size={16} />
          Offline guide
        </Link>
      </header>
      <span className="tiny-label">A LITTLE CURIOSITY. A WHOLE DAY.</span>
      <h1>Your next chapter.</h1>
      <p className="field-guide-intro">
        Find a small adventure, collect a few discoveries, and make a day of it.
      </p>
      <label className="select-city">
        Destination
        <select
          value={city}
          onChange={(e) => {
            setCity(e.target.value);
            setOrigin(null);
          }}
        >
          {cities.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name} · {c.province}
            </option>
          ))}
        </select>
      </label>
      <nav className="hub-tabs" aria-label="Field guide sections">
        {[
          ["discover", "Discover"],
          ["collections", "Collections"],
          ["day", "Build a day"],
          ["passport", "Passport"],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            aria-current={tab === id ? "page" : undefined}
          >
            {label}
          </button>
        ))}
      </nav>
      <p className="hub-message" role="status">
        {message}
      </p>
      <motion.div
        key={tab}
        initial={{ opacity: 0, y: reduced ? 0 : 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0 : 0.2 }}
      >
        {tab === "discover" && (
          <>
            <section className="adventure-section">
              <h2>Find my next adventure</h2>
              <div className="preference-grid">
                <label>
                  Mood
                  <select value={mood} onChange={(e) => setMood(e.target.value)}>
                    <option value="culture">Art & stories</option>
                    <option value="nature">Fresh air</option>
                    <option value="night">A night on stage</option>
                    <option value="surprise">Surprise me</option>
                  </select>
                </label>
                <label>
                  Time
                  <select value={time} onChange={(e) => setTime(Number(e.target.value))}>
                    <option value={60}>An hour</option>
                    <option value={180}>A few hours</option>
                    <option value={360}>A day</option>
                  </select>
                </label>
                <label>
                  Budget
                  <select value={budget} onChange={(e) => setBudget(e.target.value)}>
                    <option value="any">Any budget</option>
                    <option value="free">Confirmed free entry</option>
                    <option value="under200">Confirmed adult entry up to R200</option>
                  </select>
                </label>
              </div>
              <button className="pill-button" onClick={() => setVariant((v) => v + 1)}>
                Find another adventure <Sparkles size={16} />
              </button>
              <p className="planning-note">
                A starting point, not a timed booking. Visit durations are editorial estimates;
                check tickets and opening hours with each venue.
              </p>
              {budget === "under200" && (
                <p className="planning-note">
                  Uses standard adult entry rates, excluding travel and conditional discounts.
                </p>
              )}
              <div className="adventure-grid">{picked.map((p) => card(p))}</div>
              {!picked.length && (
                <p>
                  No places fit these preferences yet. Try more time, any budget or another
                  destination.
                </p>
              )}
            </section>
            <section className="adventure-section">
              <h2>Nearby discoveries</h2>
              <p>Your location stays in this page and is never sent to Citylit.</p>
              <button className="pill-button" disabled={busy} onClick={nearby}>
                <Navigation size={16} />
                Use my location
              </button>
              <p role="status">{geoStatus}</p>
              {origin && (
                <div className="adventure-grid">
                  {places
                    .filter(
                      (p) => p.coordinateAccuracy === "venue" && distanceKm(origin, p.coords) <= 50,
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
                <article className="event-card" key={e.id}>
                  <h3>{e.title}</h3>
                  <p>
                    {e.start} → {e.end}
                  </p>
                  <Link href={placePath(places.find((p) => p.id === e.placeId)!)}>
                    {places.find((p) => p.id === e.placeId)!.name}
                  </Link>
                  <a href={e.source} target="_blank" rel="noreferrer">
                    Programme & tickets <ArrowUpRight size={14} />
                  </a>
                  <p className="planning-note">
                    Checked {e.checkedAt}. Confirm availability with the venue.
                  </p>
                </article>
              ))}
              {!events.length && (
                <p>No current events have been verified for this destination yet.</p>
              )}
            </section>
          </>
        )}
        {tab === "collections" && (
          <section className="adventure-section">
            <h2>Small trails. Big stories.</h2>
            <div className="adventure-grid">
              {collections
                .filter((c) => c.city === city)
                .map((c) => (
                  <article className="collection-card" key={c.id}>
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
                    <button
                      onClick={() => {
                        if (trip.length && trip[0].city !== city) {
                          setMessage("Clear the current day before adding a different city.");
                          setTab("day");
                          return;
                        }
                        update({
                          itinerary: Array.from(new Set([...state.itinerary, ...c.placeIds])),
                        });
                        setTab("day");
                      }}
                    >
                      Make this my day <ArrowUpRight size={15} />
                    </button>
                    <button onClick={() => share(c.placeIds)}>
                      Share collection <Share2 size={15} />
                    </button>
                  </article>
                ))}
            </div>
          </section>
        )}
        {tab === "day" && (
          <section className="adventure-section">
            <h2>Build a day</h2>
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
            <p>
              Start with a collection or add places as you explore. Stops can be reordered;
              geography ordering uses verified pins only.
            </p>
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
              <button onClick={() => share(state.itinerary)} disabled={!trip.length}>
                <Share2 size={16} />
                Share day
              </button>
              <button onClick={() => update({ itinerary: [] })} disabled={!trip.length}>
                Clear day
              </button>
            </div>
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
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name + " " + p.address)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Directions <ArrowUpRight size={13} />
                    </a>
                  </div>
                  <div className="stop-actions">
                    {[-1, 1].map((d) => (
                      <button
                        key={d}
                        disabled={i + d < 0 || i + d >= trip.length}
                        aria-label={`Move ${p.name} ${d < 0 ? "up" : "down"}`}
                        onClick={() => {
                          const ids = [...state.itinerary];
                          [ids[i], ids[i + d]] = [ids[i + d], ids[i]];
                          update({ itinerary: ids });
                        }}
                      >
                        {d < 0 ? <MoveUp size={16} /> : <MoveDown size={16} />}
                      </button>
                    ))}
                    <button
                      aria-label={`Remove ${p.name} from day`}
                      onClick={() =>
                        update({ itinerary: state.itinerary.filter((id) => id !== p.id) })
                      }
                    >
                      <X size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ol>
            {!trip.length && <p>Your day is a blank page. Choose a collection to get started.</p>}
            {trip.length > 0 && (
              <p className="planning-note">
                About {trip.reduce((n, p) => n + Number(p.facts?.durationMinutes?.value || 90), 0)}{" "}
                minutes at venues, excluding travel. Confirm distances and routes in your maps app.
              </p>
            )}
          </section>
        )}
        {tab === "passport" && (
          <section className="adventure-section">
            <h2>Your discovery passport</h2>
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
            <p>
              {state.saved.length} discovered · {state.visited.length} marked visited. Saved places
              and visits are separate.
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
                      initial={{ scale: reduced ? 1 : 0.8 }}
                      animate={{ scale: 1 }}
                    >
                      <Check size={25} />
                      <strong>{c.short}</strong>
                      <span>Visited chapter</span>
                    </motion.div>
                  ))}
              </div>
            )}
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
            <button className="pill-button" onClick={download}>
              <Download size={16} />
              Save field guide offline
            </button>
          </section>
        )}
      </motion.div>
      <footer className="field-guide-footer">
        <Link href="/editorial">Data quality & correction review</Link>
        <p>
          Your saves, passport and itinerary live in this browser. Shared links contain only place
          IDs.
        </p>
      </footer>
    </main>
  );
}
