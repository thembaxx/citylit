"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState, useMemo, useRef, type CSSProperties } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useDrag } from "@use-gesture/react";
import {
  ArrowUpRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Vibrate,
  Map,
  Search,
  Heart,
  X,
  RotateCcw,
  Pause,
  Play,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Settings2,
} from "lucide-react";
import MiniSearch from "minisearch";
import Gallery from "./Gallery";
import PlaceContext from "./PlaceContext";
import CategoryPlaces from "./CategoryPlaces";
import CategoryNav from "./CategoryNav";
import { useDiscovery } from "./useDiscovery";
import PlaceActions from "./PlaceActions";
import { provinceColors, availableProvinces } from "../lib/province-colors";
import { useKhwezi } from "./KhweziProvider";
import BrandWordmark from "./BrandWordmark";
import KhweziWelcome from "./KhweziWelcome";
import KhweziMoment from "./KhweziMoment";
import { brand } from "../lib/brand";
const Atmosphere = dynamic(() => import("./Atmosphere"), { ssr: false });
import { cities, categories, places, categorySlug, landmarkSources } from "../lib/data";
const Scene = dynamic(() => import("./Scene"), {
  ssr: false,
  loading: () => (
    <div className="scene-loading">
      <KhweziMoment pose="loading" compact />
    </div>
  ),
});
const PlaceMap = dynamic(() => import("./PlaceMap"), { ssr: false });
const categoryDescriptions = [
  "Big thrills, curious museums and unexpected ways to spend a day.",
  "Find a place to rest, from city hideaways to coastal escapes.",
  "Step into a story. Discover local stages and live performances.",
  "Slow down among gardens, wildlife and a little more green.",
  "Follow the music. Find a dance floor and a new city rhythm.",
];
const cityDescriptions = [
  "Gauteng. Big energy, bold ideas and a city that keeps becoming.",
  "Western Cape. Between mountain and sea, find your own adventure.",
  "KwaZulu-Natal. Ocean air, colourful streets and a warmer rhythm.",
];
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
  const { state: discovery, update: updateDiscovery } = useDiscovery();
  const saved = discovery.saved;
  const setSaved = (change: string[] | ((previous: string[]) => string[])) =>
    updateDiscovery({ saved: typeof change === "function" ? change(discovery.saved) : change });
  const [night, setNight] = useState(true);
  const [notice, setNotice] = useState("");
  const [showProvinces, setShowProvinces] = useState(false);
  const {
    sound,
    haptics,
    feedback,
    toggleSound,
    toggleHaptics,
    animations: animate,
    toggleAnimations,
    dismissWelcome,
    moving,
  } = useKhwezi();
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
    [query, setQuery] = useState(params.get("q") || "");
  const [showSaved, setShowSaved] = useState(false),
    [help, setHelp] = useState(false),
    [showSettings, setShowSettings] = useState(false),
    [reset, setReset] = useState(0);
  const panelOpen = showSaved || help || showSettings;
  const modalRef = useRef<HTMLDivElement>(null),
    searchRef = useRef<HTMLInputElement>(null),
    screenRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion(),
    listing = mode === "category" && (params.get("view") === "places" || query.trim().length > 0);
  const theme =
    mode === "map" ? { name: "country", glow: "77,71,110" } : { ...themes[ci % themes.length] };
  if (ci >= 3 && mode !== "map") {
    const hex = city.accentColor.slice(1);
    theme.glow = [0, 2, 4].map((start) => parseInt(hex.slice(start, start + 2), 16)).join(",");
  }
  const categoryPath = `/${city.slug}/${categorySlug(categories[cat])}`;
  useEffect(() => {
    if (listing && query.trim()) searchRef.current?.focus({ preventScroll: false });
  }, [listing]);
  useEffect(() => {
    if (!showProvinces) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowProvinces(false);
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [showProvinces]);
  useEffect(() => {
    setShowProvinces(false);
    setQuery(params.get("q") || "");
  }, [pathname, params]);
  useEffect(() => {
    try {
      setIndex(Number(sessionStorage.getItem("citylit-landmark-" + city.slug) || 0) % 3);
    } catch {}
  }, [city.slug]);
  const changeQuery = (value: string) => {
    setQuery(value);
    const search = new URLSearchParams(params);
    search.set("view", "places");
    if (value) search.set("q", value);
    else search.delete("q");
    window.history.replaceState(null, "", categoryPath + "?" + search);
  };
  useEffect(() => {
    if (mode !== "place") screenRef.current?.focus({ preventScroll: true });
  }, [mode, city.slug]);
  useEffect(() => {
    if (!panelOpen) return;
    const before = document.activeElement as HTMLElement | null;
    requestAnimationFrame(() =>
      modalRef.current?.querySelector<HTMLButtonElement>("button")?.focus(),
    );
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowSaved(false);
        setHelp(false);
        setShowSettings(false);
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
  }, [panelOpen]);
  const toggle = (id: string) => {
    if (saved.includes(id)) setNotice("Released back into the wild.");
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
    dismissWelcome();
    router.push("/" + cities[i].slug);
  };
  const selectLandmark = (v: number) => {
    setIndex(v);
    try {
      sessionStorage.setItem("citylit-landmark-" + city.slug, String(v));
    } catch {}
  };
  const [direction, setDirection] = useState(1);
  const next = (step: number) => {
    setDirection(step);
    selectLandmark((index + step + 3) % 3);
  };
  const chooseCategory = (i: number) => {
    setQuery("");
    router.replace(`/${city.slug}/${categorySlug(categories[i])}${listing ? "?view=places" : ""}`, {
      scroll: false,
    });
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
          !target.classList.contains("detail-save") &&
          !target.classList.contains("sound-toggle")
        )
          feedback("tap");
      }}
      className={`game-screen game-${mode} theme-${theme.name} ${listing ? "has-results" : ""}`}
      style={
        {
          "--city-glow": theme.glow,
          "--city-color": mode === "map" ? brand.colors.electric : city.accentColor,
          "--khwezi-spark": mode === "map" ? brand.colors.electric : city.accentColor,
        } as CSSProperties
      }
    >
      <Atmosphere
        mode={mode}
        city={ci}
        category={cat}
        night={night}
        animate={animate && !discovery.essential && !panelOpen}
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
            <BrandWordmark />
          ) : (
            <>
              <ArrowLeft size={15} />
              {navLabel}
            </>
          )}
        </button>
        <div className="utility-nav">
          <Link
            className="icon-button"
            href={`/explore?city=${city.slug}`}
            aria-label="Plan an adventure"
          >
            <Map size={17} />
          </Link>
          <button
            className="icon-button"
            aria-label={night ? "Switch to day theme" : "Switch to night theme"}
            onClick={switchTheme}
          >
            {night ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button
            className="icon-button"
            aria-label={`Your discoveries ${saved.length}`}
            onClick={() => setShowSaved(true)}
          >
            <Heart size={17} />
            {saved.length > 0 && <span className="save-count">{saved.length}</span>}
          </button>
          <button
            className="icon-button"
            aria-label="Experience settings"
            aria-haspopup="dialog"
            onClick={() => setShowSettings(true)}
          >
            <Settings2 size={18} />
          </button>
        </div>
      </nav>
      {mode !== "map" && (
        <nav className="chapter-breadcrumbs" aria-label="Breadcrumb">
          <ol>
            <li>
              <Link href="/">South Africa</Link>
            </li>
            <li>
              <Link href={`/${city.slug}`} aria-current={mode === "city" ? "page" : undefined}>
                {city.name}
              </Link>
            </li>
            {mode !== "city" && (
              <li>
                <Link href={categoryPath} aria-current={mode === "category" ? "page" : undefined}>
                  {categories[cat]}
                </Link>
              </li>
            )}
            {place && (
              <li>
                <Link href={pathname} aria-current="page">
                  {place.name}
                </Link>
              </li>
            )}
          </ol>
        </nav>
      )}
      {!listing && (
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
            <p className="heading-description">
              {mode === "map"
                ? "Every city has a spark. Twelve destinations. Nine provinces. Follow a little curiosity."
                : mode === "city"
                  ? cityDescriptions[ci] || city.intro
                  : mode === "category"
                    ? `A new side of ${city.short}. Swipe a chapter and find somewhere worth exploring.`
                    : place?.description}
            </p>
          </motion.div>
          {mode === "category" && (
            <label className="game-search">
              <Search size={17} />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (e.target.value.trim())
                    router.push(
                      `${categoryPath}?view=places&q=${encodeURIComponent(e.target.value)}`,
                      { scroll: false },
                    );
                }}
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
      )}
      {mode === "map" && <KhweziWelcome onHelp={() => setHelp(true)} />}
      {listing ? (
        <CategoryPlaces
          key={city.slug + cat}
          city={ci}
          category={cat}
          places={visible}
          query={query}
          saved={saved}
          reset={reset}
          animate={animate && !discovery.essential && !panelOpen}
          searchRef={searchRef}
          onQuery={changeQuery}
          onCategory={chooseCategory}
          onSave={toggle}
          onPlace={(p) => router.push(`/${city.slug}/${categorySlug(p.category)}/${p.id}`)}
          onHelp={() => setHelp(true)}
        />
      ) : mode !== "place" ? (
        <>
          <div className="game-stage">
            <div className="scene">
              <Scene
                mode={mode}
                city={ci}
                index={index}
                category={cat}
                reset={reset}
                animate={animate && !discovery.essential && !panelOpen}
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
                <p className="map-hint">
                  <button onClick={() => setShowProvinces(true)}>
                    Choose from {cities.length} destinations ↗
                  </button>{" "}
                  · Drag the map to turn it.
                </p>
                <div className="map-legend">
                  <button
                    className="available-legend"
                    aria-expanded={showProvinces}
                    aria-controls="province-picker"
                    onClick={() => setShowProvinces(!showProvinces)}
                  >
                    <i />
                    {Object.keys(availableProvinces).length} provinces ready to explore
                  </button>
                  <span className="coming-legend">
                    <i />
                    More chapters coming
                  </span>
                </div>
                {showProvinces && (
                  <nav
                    id="province-picker"
                    className="province-picker"
                    aria-label="Available provinces"
                  >
                    {cities.map((c) => (
                      <Link key={c.slug} href={`/${c.slug}`}>
                        <i style={{ background: provinceColors[c.provinceCode] }} />
                        {c.province}
                        <span>{c.short}</span>
                      </Link>
                    ))}
                  </nav>
                )}
                <a
                  className="geography-credit"
                  href="https://www.geoboundaries.org/api/current/gbOpen/ZAF/ADM1/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Map: geoBoundaries / OCHA / MDB · adapted · CC BY 3.0 IGO
                </a>
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
                      initial={{ opacity: 0, x: reduced ? 0 : direction * 15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: reduced ? 0 : direction * -15 }}
                      transition={{ duration: reduced ? 0 : 0.18 }}
                    >
                      <button
                        className="landmark-open"
                        onClick={() => router.push(`/${city.slug}/entertainment`)}
                      >
                        <h3>{city.landmarks[index]}</h3>
                      </button>
                      <p>{landmarkDescriptions[ci]?.[index] || city.descriptions[index]}</p>
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
                      onClick={() => selectLandmark(i)}
                    />
                  ))}
                </div>
                <p className="swipe-hint">Swipe the caption for more. Drag the model to rotate.</p>
                <button
                  className="pill-button ivory-button"
                  onClick={() => router.push(`/${city.slug}/entertainment`)}
                >
                  Explore {city.short}
                </button>
                <a
                  className="landmark-wiki"
                  href={
                    landmarkSources[ci * 3 + index]?.wikipedia ||
                    city.landmarkLinks[index] ||
                    `https://en.wikipedia.org/wiki/${encodeURIComponent(city.short.replace(/ /g, "_"))}`
                  }
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
                  <p className="category-description">{categoryDescriptions[cat]}</p>
                  <button className="pill-button" onClick={openPlaces}>
                    Open {categories[cat]}
                  </button>
                  <span className="category-count">{cat + 1} / 5</span>
                </div>
                <CategoryNav selected={cat} onSelect={chooseCategory} compact />
              </>
            )}
          </footer>
        </>
      ) : (
        place && (
          <div className="detail-scroll">
            <div className="place-detail">
              <PlaceActions place={place} />
              <div className="detail-actions">
                <button className="detail-save" onClick={() => toggle(place.id)}>
                  <Heart size={17} fill={saved.includes(place.id) ? "currentColor" : "none"} />
                  {saved.includes(place.id) ? "Saved to discoveries" : "Save this discovery"}
                </button>
                <a
                  className="pill-button"
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.name + " " + place.address + " " + city.name)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Get directions <ArrowUpRight size={17} />
                </a>
              </div>
              <details className="navigation-options">
                <summary>More navigation options</summary>
                <a
                  href={`https://maps.apple.com/?daddr=${encodeURIComponent(place.name + " " + place.address + " " + city.name)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Apple Maps <ArrowUpRight size={14} />
                </a>
                <a
                  href={`https://www.waze.com/ul?${place.coordinateAccuracy === "venue" ? `ll=${place.coords[1]},${place.coords[0]}&navigate=yes` : `q=${encodeURIComponent(place.name + " " + place.address + " " + city.name)}`}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Waze <ArrowUpRight size={14} />
                </a>
              </details>
              <p className="detail-address">
                {place.address} · {city.name}
              </p>
              <motion.dl className="detail-facts" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div>
                  <dt>Experience</dt>
                  <dd>{place.category}</dd>
                </div>
                <div>
                  <dt>City</dt>
                  <dd>{city.name}</dd>
                </div>
                <div className="fact-address">
                  <dt>Find it</dt>
                  <dd>{place.address}</dd>
                </div>
              </motion.dl>
              <Gallery images={place.images} context={place.imageContext} name={place.name} />
              <PlaceContext key={place.id} place={place} />
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
        {panelOpen && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowSaved(false);
              setHelp(false);
              setShowSettings(false);
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
              aria-label={
                showSettings ? "Experience settings" : help ? "How to explore" : "Your discoveries"
              }
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="modal-close icon-button"
                onClick={() => {
                  setShowSaved(false);
                  setHelp(false);
                  setShowSettings(false);
                }}
                aria-label="Close"
              >
                <X />
              </button>
              <span className="tiny-label">YOUR OWN LITTLE ADVENTURE</span>
              <h2>
                {showSettings
                  ? "Your kind of magic."
                  : help
                    ? "Follow a little curiosity."
                    : "Your discoveries."}
              </h2>
              {showSettings ? (
                <div className="experience-settings">
                  <p>A little delight, on your terms.</p>
                  <button
                    className="preference-button sound-toggle"
                    aria-label={sound ? "Mute sounds" : "Enable sounds"}
                    aria-pressed={sound}
                    onClick={toggleSound}
                  >
                    {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
                    <span>
                      Quiet sound effects
                      <small>
                        {sound ? "On · two little notes" : "Off · always quiet on reload"}
                      </small>
                    </span>
                  </button>
                  <button
                    className="preference-button"
                    aria-label={animate ? "Pause animations" : "Play animations"}
                    aria-pressed={!animate}
                    onClick={toggleAnimations}
                  >
                    {animate ? <Pause size={18} /> : <Play size={18} />}
                    <span>
                      {animate ? "Pause animations" : "Play animations"}
                      <small>Applies to the map, landmarks and Khwezi</small>
                    </span>
                  </button>
                  <button
                    className="preference-button"
                    aria-pressed={haptics}
                    onClick={toggleHaptics}
                  >
                    <Vibrate size={18} />
                    <span>
                      Touch feedback {haptics ? "on" : "off"}
                      <small>Where your device supports vibration</small>
                    </span>
                  </button>
                  <label className="setting-row">
                    <input
                      type="checkbox"
                      checked={discovery.essential}
                      onChange={(e) => updateDiscovery({ essential: e.target.checked })}
                    />
                    Essential motion: keep transitions, stop continuous movement
                  </label>
                  {reduced && <p>Your device’s reduced-motion preference is respected.</p>}
                  {mode !== "place" && (
                    <button
                      className="preference-button"
                      aria-label="Reset 3D view"
                      onClick={() => setReset((v) => v + 1)}
                    >
                      <RotateCcw size={18} />
                      <span>
                        Reset illustration<small>Return to its original view</small>
                      </span>
                    </button>
                  )}
                  <button
                    className="pill-button"
                    onClick={() => {
                      setShowSettings(false);
                      setHelp(true);
                    }}
                  >
                    How to explore <ArrowUpRight size={14} />
                  </button>
                  <Link className="brand-link" href="/brand">
                    Meet Khwezi & the Citylit story <ArrowUpRight size={14} />
                  </Link>
                </div>
              ) : help ? (
                <KhweziMoment pose="gesture" />
              ) : !saved.length ? (
                <KhweziMoment pose="welcome" />
              ) : null}
              {!showSettings && (
                <>
                  {help ? (
                    <>
                      <div className="gesture-demo" data-moving={moving} aria-hidden="true">
                        <span>←</span>
                        <i />
                        <span>→</span>
                      </div>
                      <p>
                        Drag the map or landmark to give it a spin. Pinch or scroll to get closer.
                      </p>
                      <p>
                        Choose a colored province, swipe its landmark captions, then explore one
                        category at a time. Open a category to browse its places.
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
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
