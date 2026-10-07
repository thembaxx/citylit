"use client";
import dynamic from "next/dynamic";
import { useEffect, useState, useMemo, useRef, type CSSProperties } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useDrag } from "@use-gesture/react";
import {
  ArrowUpRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Compass,
  MapPin,
  Search,
  Heart,
  X,
  Ticket,
  BedDouble,
  Drama,
  Trees,
  Music,
  RotateCcw,
  Pause,
  Play,
  Sun,
  Moon,
  Volume2,
  VolumeX,
} from "lucide-react";
import MiniSearch from "minisearch";
import Gallery from "./Gallery";
import { useDelight } from "./useDelight";
const Atmosphere = dynamic(() => import("./Atmosphere"), { ssr: false });
import { cities, categories, places, categorySlug, landmarkSources } from "../lib/data";
const Scene = dynamic(() => import("./Scene"), {
  ssr: false,
  loading: () => <div className="scene-loading">ASSEMBLING YOUR ADVENTURE…</div>,
});
const PlaceMap = dynamic(() => import("./PlaceMap"), { ssr: false });
const icons = [Ticket, BedDouble, Drama, Trees, Music];
const glyphs = ["★", "⌂", "◐", "♣", "♪"];
const themes = [
  { name: "gold", glow: "169,112,40" },
  { name: "ocean", glow: "46,111,160" },
  { name: "coast", glow: "31,128,116" },
];
const landmarkDescriptions = [
  [
    "A cylindrical icon rising above the city’s skyline.",
    "A cable-stayed crossing connecting two sides of Joburg.",
    "Soweto’s colourful cooling towers, reimagined as an adventure landmark.",
  ],
  [
    "A flat-topped mountain, a drifting tablecloth of cloud, and a city below.",
    "Colourful houses and stories on the slopes of Signal Hill.",
    "A lighthouse above the cliffs at the edge of the peninsula.",
  ],
  [
    "A soaring arch above Durban’s landmark 2010 World Cup stadium.",
    "Marine life and water adventures beside the Indian Ocean.",
    "A coastal beacon overlooking Umhlanga’s rocky shoreline.",
  ],
];
export default function Explorer() {
  const pathname = usePathname(),
    router = useRouter(),
    params = useSearchParams();
  const parts = pathname.split("/").filter(Boolean),
    ci = Math.max(
      0,
      cities.findIndex((c) => c.slug === parts[0]),
    ),
    city = cities[ci];
  const cat = Math.max(
    0,
    categories.findIndex((c) => categorySlug(c) === parts[1]),
  );
  const place = places.find((p) => p.id === parts[2] && p.city === city.slug);
  const mode =
    parts.length === 0 ? "map" : parts.length === 1 ? "city" : place ? "place" : "category";
  const [night, setNight] = useState(true);
  const [notice, setNotice] = useState("");
  const { sound, haptics, feedback, toggleSound, toggleHaptics } = useDelight();
  useEffect(() => {
    try {
      const selected = localStorage.getItem("citylit-theme");
      setNight(
        selected
          ? selected === "night"
          : !window.matchMedia("(prefers-color-scheme: light)").matches,
      );
    } catch {}
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = night ? "night" : "day";
    return () => {
      delete document.documentElement.dataset.theme;
    };
  }, [night]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 1800);
    return () => clearTimeout(timer);
  }, [notice]);
  const switchTheme = () => {
    setNight(!night);
    setNotice(night ? "A little sunshine." : "Welcome to the night garden.");
    try {
      localStorage.setItem("citylit-theme", night ? "day" : "night");
    } catch {}
  };
  const [index, setIndex] = useState(0),
    [query, setQuery] = useState(""),
    [saved, setSaved] = useState<string[]>([]);
  const [showSaved, setShowSaved] = useState(false),
    [help, setHelp] = useState(false),
    [reset, setReset] = useState(0),
    [animate, setAnimate] = useState(true);
  const modalRef = useRef<HTMLDivElement>(null),
    searchRef = useRef<HTMLInputElement>(null),
    screenRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion(),
    listing = mode === "category" && (params.get("view") === "places" || query.trim().length > 0);
  const theme = mode === "map" ? { name: "country", glow: "77,71,110" } : themes[ci];
  const categoryPath = `/${city.slug}/${categorySlug(categories[cat])}`;
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("mzansi-saved") || "[]");
      if (Array.isArray(stored))
        setSaved(stored.filter((id) => typeof id === "string" && places.some((p) => p.id === id)));
    } catch {}
  }, []);
  useEffect(() => {
    setIndex(0);
    setQuery("");
  }, [pathname]);
  useEffect(() => {
    if (mode !== "place") screenRef.current?.focus({ preventScroll: true });
  }, [mode, city.slug]);
  useEffect(() => {
    if (!showSaved && !help) return;
    const before = document.activeElement as HTMLElement | null;
    requestAnimationFrame(() =>
      modalRef.current?.querySelector<HTMLButtonElement>("button")?.focus(),
    );
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowSaved(false);
        setHelp(false);
      }
      if (e.key === "Tab") {
        const elements = modalRef.current?.querySelectorAll<HTMLElement>(
          'button,a[href],input,[tabindex="0"]',
        );
        if (!elements?.length) return;
        const first = elements[0],
          last = elements[elements.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      before?.focus();
    };
  }, [showSaved, help]);
  const toggle = (id: string) => {
    feedback("save");
    setNotice(
      saved.includes(id) ? "Released back into the wild." : "A little treasure, collected.",
    );
    setSaved((prev) => {
      const next = prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id];
      try {
        localStorage.setItem("mzansi-saved", JSON.stringify(next));
      } catch {}
      return next;
    });
  };
  const goCity = (i: number) => {
    feedback("tap");
    router.push("/" + cities[i].slug);
  };
  const next = (direction: number) => setIndex((v) => (v + direction + 3) % 3);
  const chooseCategory = (i: number) => {
    setQuery("");
    router.replace(`/${city.slug}/${categorySlug(categories[i])}`, { scroll: false });
  };
  const bind = useDrag(
    ({ last, swipe: [x], movement: [mx] }) => {
      if (last && (x || Math.abs(mx) > 55)) {
        feedback("swipe");
        const d = (x || mx) > 0 ? -1 : 1;
        if (mode === "city") next(d);
        else chooseCategory((cat + d + 5) % 5);
      }
    },
    { axis: "x", filterTaps: true },
  );
  const engine = useMemo(() => {
    const search = new MiniSearch({
      fields: ["name", "description", "category", "address"],
      storeFields: ["id"],
    });
    search.addAll(places);
    return search;
  }, []);
  const ids = query.trim()
    ? engine.search(query, { prefix: true, fuzzy: 0.2 }).map((r) => r.id)
    : null;
  const visible = places.filter(
    (p) => p.city === city.slug && (ids ? ids.includes(p.id) : p.category === categories[cat]),
  );
  const openPlaces = () => {
    feedback("tap");
    router.push(`${categoryPath}?view=places`, { scroll: false });
  };
  const closePlaces = () => {
    setQuery("");
    router.replace(categoryPath, { scroll: false });
    searchRef.current?.blur();
  };
  const back = () => {
    if (listing) closePlaces();
    else
      router.push(
        mode === "place"
          ? `${categoryPath}?view=places`
          : mode === "category"
            ? `/${city.slug}`
            : "/",
      );
  };
  const navLabel = listing
    ? "Back to categories"
    : mode === "city"
      ? "Back to map"
      : mode === "category"
        ? `Back to ${city.short}`
        : mode === "place"
          ? "Back to places"
          : "Citylit home";
  return (
    <main
      ref={screenRef}
      tabIndex={-1}
      onClickCapture={(event) => {
        const target = (event.target as HTMLElement).closest("button,a");
        if (
          target &&
          !target.getAttribute("aria-label")?.startsWith("Save") &&
          !target.classList.contains("sound-toggle")
        )
          feedback("tap");
      }}
      className={`game-screen game-${mode} theme-${theme.name} ${listing ? "has-results" : ""}`}
      style={{ "--city-glow": theme.glow } as CSSProperties}
    >
      <Atmosphere
        mode={mode}
        city={ci}
        category={cat}
        night={night}
        animate={animate && !listing && !help && !showSaved}
      />
      <div className="game-atmosphere" aria-hidden="true">
        <div className="ambient-glow" />
      </div>
      <div className="delight-notice" role="status" aria-live="polite">
        {notice}
      </div>
      <nav className="game-nav" aria-label="Page navigation">
        <button
          className="game-back"
          onClick={mode === "map" ? () => router.push("/") : back}
          aria-label={navLabel}
        >
          {mode === "map" ? (
            <span className="wordmark">citylit</span>
          ) : (
            <>
              <ArrowLeft size={15} />
              {navLabel}
            </>
          )}
        </button>
        <div className="utility-nav">
          <button
            className="icon-button"
            aria-label={night ? "Switch to day theme" : "Switch to night theme"}
            onClick={switchTheme}
          >
            {night ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button
            className="icon-button sound-toggle"
            aria-label={sound ? "Mute sounds" : "Enable sounds"}
            aria-pressed={sound}
            onClick={() => {
              toggleSound();
              setNotice(sound ? "Quiet magic." : "Sound on. Tiny notes of wonder.");
            }}
          >
            {sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button
            className="icon-button"
            aria-label={`Your discoveries ${saved.length}`}
            onClick={() => setShowSaved(true)}
          >
            <Heart size={17} />
            {saved.length > 0 && <span className="save-count">{saved.length}</span>}
          </button>
          {mode !== "place" && (
            <>
              <button
                className="icon-button"
                aria-label="Reset 3D view"
                onClick={() => setReset((v) => v + 1)}
              >
                <RotateCcw size={16} />
              </button>
            </>
          )}
          <button
            className="icon-button"
            aria-label={animate ? "Pause animations" : "Play animations"}
            onClick={() => setAnimate((v) => !v)}
          >
            {animate ? <Pause size={15} /> : <Play size={15} />}
          </button>
          <button className="icon-button" aria-label="How to explore" onClick={() => setHelp(true)}>
            <Compass size={17} />
          </button>
        </div>
      </nav>
      <header className="game-heading">
        <motion.div
          key={mode + city.slug}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : 0.35 }}
        >
          <span className="roman-chapter">
            {mode === "map" ? "I" : mode === "city" ? "II" : mode === "category" ? "III" : "V"}
          </span>
          <h1>
            {mode === "map" ? (
              <>
                Discover
                <br />
                South Africa
              </>
            ) : mode === "city" ? (
              city.name
            ) : mode === "category" ? (
              "Explore"
            ) : (
              place?.name
            )}
          </h1>
          {mode === "city" && <p className="province-subtitle">{city.province}</p>}
          {mode === "place" && <p className="place-introduction">{place?.description}</p>}
        </motion.div>
        {mode === "category" && (
          <label className="game-search">
            <Search size={17} />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search places"
              aria-label={`Search ${city.short} places`}
            />
            {query && (
              <button onClick={() => setQuery("")} aria-label="Clear search">
                <X size={17} />
              </button>
            )}
          </label>
        )}
      </header>
      {mode !== "place" ? (
        <>
          <div className="game-stage">
            <div className="scene">
              <Scene
                mode={mode}
                city={ci}
                index={index}
                category={cat}
                reset={reset}
                animate={animate && !listing && !help && !showSaved}
                onCity={goCity}
                onSelect={
                  mode === "city"
                    ? () => {
                        feedback("tap");
                        router.push(`/${city.slug}/entertainment`);
                      }
                    : openPlaces
                }
              />
            </div>
          </div>
          <footer className="game-controls">
            {mode === "map" ? (
              <>
                <p className="map-hint">Tap a numbered pin. Drag the map to turn it.</p>
                <div className="city-shortcuts" aria-label="Cities">
                  {cities.map((c, i) => (
                    <button key={c.slug} onClick={() => goCity(i)}>
                      <span>{i + 1}</span>
                      {c.short}
                    </button>
                  ))}
                </div>
                <div className="map-legend">
                  <span>
                    <i />3 provinces ready to explore
                  </span>
                  <button onClick={() => setHelp(true)}>
                    Map & source credits <ArrowUpRight size={10} />
                  </button>
                </div>
              </>
            ) : mode === "city" ? (
              <>
                <div
                  className="landmark-caption"
                  {...bind()}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowLeft") next(-1);
                    if (e.key === "ArrowRight") next(1);
                  }}
                  aria-label="Landmark carousel. Use arrow keys or swipe."
                >
                  <button
                    className="carousel-arrow"
                    aria-label="Previous landmark"
                    onClick={() => next(-1)}
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={index}
                      className="landmark-copy"
                      initial={{ opacity: 0, x: 15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -15 }}
                      transition={{ duration: reduced ? 0 : 0.18 }}
                    >
                      <button
                        className="landmark-open"
                        onClick={() => router.push(`/${city.slug}/entertainment`)}
                      >
                        <h3>{city.landmarks[index]}</h3>
                      </button>
                      <p>{landmarkDescriptions[ci][index]}</p>
                    </motion.div>
                  </AnimatePresence>
                  <button
                    className="carousel-arrow"
                    aria-label="Next landmark"
                    onClick={() => next(1)}
                  >
                    <ChevronRight size={22} />
                  </button>
                </div>
                <div className="carousel-progress">
                  {city.landmarks.map((name, i) => (
                    <button
                      key={name}
                      className={index === i ? "selected" : ""}
                      aria-label={`Show ${name}`}
                      aria-current={index === i ? "true" : undefined}
                      onClick={() => setIndex(i)}
                    />
                  ))}
                </div>
                <p className="swipe-hint">Swipe here for more. Tap the landmark to explore.</p>
                <button
                  className="pill-button ivory-button"
                  onClick={() => router.push(`/${city.slug}/entertainment`)}
                >
                  Explore {city.short}
                </button>
                <a
                  className="landmark-wiki"
                  href={landmarkSources[ci * 3 + index]?.wikipedia}
                  target="_blank"
                  rel="noreferrer"
                >
                  The story behind the landmark <ArrowUpRight size={11} />
                </a>
              </>
            ) : (
              <>
                <div
                  className="category-caption"
                  {...bind()}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowLeft") chooseCategory((cat + 4) % 5);
                    if (e.key === "ArrowRight") chooseCategory((cat + 1) % 5);
                  }}
                  aria-label="Category carousel. Use arrow keys or swipe."
                >
                  <AnimatePresence mode="wait">
                    <motion.h2
                      key={cat}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: reduced ? 0 : 0.18 }}
                    >
                      {categories[cat]}
                    </motion.h2>
                  </AnimatePresence>
                  <button className="pill-button" onClick={openPlaces}>
                    Open {categories[cat]}
                  </button>
                  <span className="category-count">{cat + 1} / 5</span>
                </div>
                <nav className="category-glyphs" aria-label="Attraction categories">
                  {categories.map((c, i) => (
                    <button
                      key={c}
                      className={i === cat ? "active" : ""}
                      aria-label={c}
                      aria-current={i === cat ? "page" : undefined}
                      onClick={() => chooseCategory(i)}
                    >
                      <span aria-hidden="true">{glyphs[i]}</span>
                      <span className="glyph-tooltip">{c}</span>
                    </button>
                  ))}
                </nav>
              </>
            )}
          </footer>
          <AnimatePresence>
            {listing && (
              <motion.section
                className="places-sheet"
                key="places"
                initial={{ opacity: 0, y: 35 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 25 }}
                transition={{ duration: reduced ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
                aria-label="Places"
              >
                <div className="sheet-header">
                  <div>
                    <span className="roman-chapter">IV</span>
                    <h2>{query ? "Your discoveries" : categories[cat]}</h2>
                  </div>
                  <button className="icon-button" aria-label="Close places" onClick={closePlaces}>
                    <X size={21} />
                  </button>
                </div>
                <p className="result-count">
                  {visible.length} places in {city.short}
                  {query ? " · across all categories" : ""}
                </p>
                <div className="places-scroll">
                  {visible.map((p) => {
                    const Icon = icons[categories.indexOf(p.category)];
                    return (
                      <motion.article key={p.id} className="place-card" layout>
                        <div className="place-icon">
                          <Icon size={23} strokeWidth={1.3} />
                        </div>
                        <button
                          className="place-open"
                          onClick={() =>
                            router.push(`/${city.slug}/${categorySlug(p.category)}/${p.id}`)
                          }
                        >
                          <span className="tiny-label">{p.category}</span>
                          <h3>{p.name}</h3>
                          <p>{p.description}</p>
                          <span className="address">
                            <MapPin size={11} />
                            {p.address}
                          </span>
                        </button>
                        <button
                          className="save-icon"
                          onClick={() => toggle(p.id)}
                          aria-label={`Save ${p.name}`}
                        >
                          <Heart size={17} fill={saved.includes(p.id) ? "currentColor" : "none"} />
                        </button>
                        <ArrowUpRight size={17} />
                      </motion.article>
                    );
                  })}
                  {!visible.length && (
                    <p className="empty">No places found. Try another name or category.</p>
                  )}
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </>
      ) : (
        place && (
          <div className="detail-scroll">
            <div className="place-detail">
              <div className="detail-actions">
                <button className="detail-save" onClick={() => toggle(place.id)}>
                  <Heart size={17} fill={saved.includes(place.id) ? "currentColor" : "none"} />
                  {saved.includes(place.id) ? "Saved to discoveries" : "Save this discovery"}
                </button>
                <a
                  className="pill-button"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + " " + place.address + " " + city.name)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Get directions <ArrowUpRight size={17} />
                </a>
              </div>
              <p className="detail-address">
                {place.address} · {city.name}
              </p>
              <Gallery images={place.images} context={place.imageContext} name={place.name} />
              <PlaceMap
                coords={place.coords}
                name={place.name}
                accuracy={place.coordinateAccuracy}
              />
              <p className="data-note">
                {place.coordinateAccuracy === "venue"
                  ? "Pin sourced from venue geographic data."
                  : "Map shows the city centre; venue coordinates are not available."}{" "}
                Check opening hours and event details with the venue.
              </p>
              <div className="venue-links">
                <a className="photo-link" href={place.website} target="_blank" rel="noreferrer">
                  Official website <ArrowUpRight size={15} />
                </a>
                {place.wikipedia && (
                  <a className="photo-link" href={place.wikipedia} target="_blank" rel="noreferrer">
                    Read on Wikipedia <ArrowUpRight size={15} />
                  </a>
                )}
              </div>
              <details className="source-details">
                <summary>Behind this discovery · sources & credits</summary>
                <p>
                  Source pages checked {place.checkedAt}. Hours and event programmes can change.
                </p>
                {place.sources.map((s) => (
                  <a key={s.url} href={s.url} target="_blank" rel="noreferrer">
                    {s.title} <ArrowUpRight size={12} />
                  </a>
                ))}
                <a
                  href={
                    place.coordinateSource.startsWith("https:")
                      ? place.coordinateSource
                      : place.website
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  Map coordinate source <ArrowUpRight size={12} />
                </a>
              </details>
            </div>
          </div>
        )
      )}
      <AnimatePresence>
        {(showSaved || help) && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowSaved(false);
              setHelp(false);
            }}
          >
            <motion.div
              ref={modalRef}
              className="modal"
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ duration: reduced ? 0 : 0.2 }}
              role="dialog"
              aria-modal="true"
              aria-label={help ? "How to explore" : "Your discoveries"}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="modal-close icon-button"
                onClick={() => {
                  setShowSaved(false);
                  setHelp(false);
                }}
                aria-label="Close"
              >
                <X />
              </button>
              <span className="tiny-label">YOUR OWN LITTLE ADVENTURE</span>
              <h2>{help ? "Stay curious." : "Your discoveries."}</h2>
              {help && (
                <button className="haptics-toggle" aria-pressed={haptics} onClick={toggleHaptics}>
                  Touch feedback {haptics ? "on" : "off"} · where supported
                </button>
              )}
              {help ? (
                <>
                  <p>Drag the map or landmark to give it a spin. Pinch or scroll to get closer.</p>
                  <p>
                    Choose a numbered city, swipe its landmarks, then explore one category at a
                    time. Open a category to browse its places.
                  </p>
                  <p>Tap a heart to keep a discovery for later.</p>
                  <a
                    className="photo-link"
                    href="https://www.geoboundaries.org/api/current/gbOpen/ZAF/ADM1/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Map: geoBoundaries / OCHA / MDB · adapted · CC BY 3.0 IGO{" "}
                    <ArrowUpRight size={13} />
                  </a>
                  <button className="pill-button" onClick={() => setHelp(false)}>
                    Let’s explore
                  </button>
                </>
              ) : saved.length ? (
                places
                  .filter((p) => saved.includes(p.id))
                  .map((p) => (
                    <button
                      className="saved-row"
                      key={p.id}
                      onClick={() => {
                        setShowSaved(false);
                        router.push(`/${p.city}/${categorySlug(p.category)}/${p.id}`);
                      }}
                    >
                      {p.name}
                      <ArrowUpRight size={18} />
                    </button>
                  ))
              ) : (
                <p>
                  A blank page, full of possibilities. Tap a heart on any place to start your
                  collection.
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
