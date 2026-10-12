"use client";
import UiIcon from "./UiIcon";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState, useMemo, useRef, type CSSProperties } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useDrag } from "@use-gesture/react";
import {
  ArrowLeft,
  ArrowUpRight,
  Compass,
  GearSix,
  Heart,
  MagnifyingGlass,
  Moon,
  SpeakerHigh,
  SpeakerSlash,
  Sun,
  Vibrate,
  X,
} from "@phosphor-icons/react";
import MiniSearch from "minisearch";
import Gallery from "./Gallery";
import PlaceContext from "./PlaceContext";
import CategoryPlaces from "./CategoryPlaces";
import CategoryNav from "./CategoryNav";
import { useDiscovery } from "./useDiscovery";
import useTheme from "./useTheme";
import PlaceActions from "./PlaceActions";
import { useNativeRouter } from "./useNativeRouter";
import PwaPanel from "./PwaPanel";
import { provinceColors, availableProvinces } from "../lib/province-colors";
import { useKhwezi } from "./KhweziProvider";
import BrandWordmark from "./BrandWordmark";
import KhweziWelcome from "./KhweziWelcome";
import KhweziMoment from "./KhweziMoment";
import LandmarkSheet from "./LandmarkSheet";
const Atmosphere = dynamic(() => import("./Atmosphere"), { ssr: false });
import {
  cities,
  categories,
  categoryBlurbs,
  places,
  categorySlug,
  landmarkSources,
} from "../lib/data";
const Scene = dynamic(() => import("./Scene"), {
  ssr: false,
  loading: () => (
    <div className="scene-loading">
      <KhweziMoment pose="loading" compact />
    </div>
  ),
});
const PlaceMap = dynamic(() => import("./PlaceMap"), { ssr: false });
const cityDescriptions = [
  "Gauteng. Big energy, bold ideas and a city that keeps becoming.",
  "Western Cape. Between mountain and sea, find your own adventure.",
  "KwaZulu-Natal. Ocean air, colourful streets and a warmer rhythm.",
];
const themes = [
  { name: "gold", glow: "214,140,48" },
  { name: "ocean", glow: "214,96,72" },
  { name: "coast", glow: "92,150,78" },
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
function findVenue(citySlug: string, landmark: string) {
  const norm = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  const name = norm(landmark);
  if (name.length < 4) return;
  return places.find((place) => {
    if (place.city !== citySlug) return false;
    const title = norm(place.name);
    return title === name || title.includes(name) || (name.includes(title) && title.length > 8);
  });
}
function FadeHint({ children, token }: { children: string; token: string }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 4400);
    return () => window.clearTimeout(timer);
  }, [token]);
  if (!visible) return null;
  return <p className="fade-hint">{children}</p>;
}
export default function Explorer() {
  const pathname = usePathname(),
    router = useNativeRouter(),
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
  const { night, toggleTheme } = useTheme();
  const [notice, setNotice] = useState("");
  const [showProvinces, setShowProvinces] = useState(false);
  const {
    sound,
    haptics,
    feedback,
    toggleSound,
    toggleHaptics,
    animations: animate,
    dismissWelcome,
    moving,
  } = useKhwezi();
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 1800);
    return () => clearTimeout(timer);
  }, [notice]);
  const switchTheme = () => {
    toggleTheme();
    setNotice(night ? "A little sunshine." : "Welcome to the night garden.");
  };
  const [index, setIndex] = useState(0),
    [query, setQuery] = useState(params.get("q") || "");
  const [showSaved, setShowSaved] = useState(false),
    [help, setHelp] = useState(false),
    [showSettings, setShowSettings] = useState(false),
    [spot, setSpot] = useState<number | null>(null),
    [bloom, setBloom] = useState(false);
  useEffect(() => {
    if (!bloom) return;
    const timer = window.setTimeout(() => setBloom(false), 1800);
    return () => clearTimeout(timer);
  }, [bloom]);
  useEffect(() => {
    if (mode !== "city") return;
    const key = "citylit-skyline-" + city.slug;
    let seen = new Set<number>();
    try {
      const parsed = JSON.parse(sessionStorage.getItem(key) || "[]");
      if (Array.isArray(parsed))
        seen = new Set(parsed.filter((value) => typeof value === "number"));
    } catch {}
    const before = seen.size;
    seen.add(index);
    try {
      sessionStorage.setItem(key, JSON.stringify([...seen]));
    } catch {}
    if (before < city.landmarks.length && seen.size === city.landmarks.length) {
      setNotice("You found the whole skyline.");
      setBloom(true);
    }
  }, [mode, city.slug, city.landmarks.length, index]);
  const reset = 0;
  const panelOpen = showSaved || help || showSettings;
  const modalRef = useRef<HTMLDialogElement>(null),
    searchRef = useRef<HTMLInputElement>(null),
    screenRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion(),
    listing = mode === "category" && (params.get("view") === "places" || query.trim().length > 0);
  const theme =
    mode === "map" ? { name: "country", glow: "140,138,132" } : { ...themes[ci % themes.length] };
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
    setSpot(null);
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
    const frame = requestAnimationFrame(() => {
      if (modalRef.current && !modalRef.current.open) modalRef.current.showModal();
      modalRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    });
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
      cancelAnimationFrame(frame);
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
  const openLandmark = (i: number) => {
    feedback("tap");
    const name = city.landmarks[i];
    const venue = findVenue(city.slug, name);
    if (venue) {
      router.push(`/${city.slug}/${categorySlug(venue.category)}/${venue.id}`);
      return;
    }
    setSpot(i);
  };
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
    ({ last, tap, swipe: [x], movement: [mx] }) => {
      if (tap) {
        if (mode === "city") openLandmark(index);
        return;
      }
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
      className={`game-screen game-${mode} theme-${theme.name} ${listing ? "has-results" : ""} ${bloom ? "secret-bloom" : ""}`}
      style={
        {
          "--city-glow": theme.glow,
          "--city-color": mode === "map" ? "#ff6a3d" : city.accentColor,
          "--khwezi-spark": mode === "map" ? "#ff6a3d" : city.accentColor,
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
        <div className="horizon" />
        <div className="motes">
          {Array.from({ length: 7 }, (_, i) => (
            <i key={i} style={{ "--i": String(i) } as CSSProperties} />
          ))}
        </div>
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
              <ArrowLeft size={16} weight="bold" />
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
            <Compass size={18} weight="regular" />
          </Link>
          <button
            className="icon-button"
            aria-label={night ? "Switch to day theme" : "Switch to night theme"}
            onClick={switchTheme}
          >
            {night ? <Sun size={18} weight="fill" /> : <Moon size={18} weight="fill" />}
          </button>
          <button
            className="icon-button"
            aria-label={`Your discoveries ${saved.length}`}
            onClick={() => setShowSaved(true)}
          >
            <Heart size={18} weight={saved.length ? "fill" : "regular"} />
            {saved.length > 0 && <span className="save-count">{saved.length}</span>}
          </button>
          <button
            className="icon-button"
            aria-label="Experience settings"
            aria-haspopup="dialog"
            onClick={() => setShowSettings(true)}
          >
            <GearSix size={18} weight={showSettings ? "fill" : "regular"} />
          </button>
        </div>
      </nav>
      {mode === "place" && (
        <nav className="chapter-breadcrumbs" aria-label="Breadcrumb">
          <ol>
            <li>
              <Link href="/">South Africa</Link>
            </li>
            <li>
              <Link href={`/${city.slug}`}>{city.name}</Link>
            </li>
            <li>
              <Link href={categoryPath}>{categories[cat]}</Link>
            </li>
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
            <h1>
              {mode === "map" ? (
                <>
                  Discover
                  <br />
                  South Africa
                </>
              ) : mode === "city" ? (
                city.short
              ) : mode === "category" ? (
                city.short
              ) : (
                place?.name
              )}
            </h1>
            {mode !== "city" && (
              <p className="heading-description">
                {mode === "map"
                  ? "Follow the glow."
                  : mode === "category"
                    ? categoryBlurbs[categories[cat]]
                    : place?.description}
              </p>
            )}
          </motion.div>
          {mode === "category" && (
            <label className="game-search">
              <MagnifyingGlass size={18} weight="bold" />
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
                  <X size={16} weight="bold" />
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
                onSelect={mode === "city" ? () => openLandmark(index) : openPlaces}
                onCycle={
                  mode === "city" && spot === null
                    ? (step) => {
                        feedback("swipe");
                        next(step);
                      }
                    : undefined
                }
                onSecret={() => {
                  const lines = [
                    "It likes you.",
                    "A small light answered.",
                    "Khwezi left a spark.",
                  ];
                  setNotice(lines[index % lines.length]);
                  setBloom(true);
                }}
              />
            </div>
            {mode === "map" && (
              <FadeHint token="map">Drag the land. Tap a province that glows.</FadeHint>
            )}
            {mode === "city" && (
              <FadeHint token={city.slug}>
                Drag to turn. Swipe to discover. Tap to step inside.
              </FadeHint>
            )}
            {mode === "category" && (
              <FadeHint token={city.slug + "-" + cat}>
                Swipe a chapter. Tap the toy to open it.
              </FadeHint>
            )}
          </div>
          <footer className="game-controls">
            {mode === "map" ? (
              <>
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
                  <Link className="coming-legend" href="/destinations">
                    <i />
                    Browse city guides <UiIcon name="arrow-up-right" />
                  </Link>
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
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={index}
                      className="landmark-copy"
                      initial={{ opacity: 0, x: reduced ? 0 : direction * 15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: reduced ? 0 : direction * -15 }}
                      transition={{ duration: reduced ? 0 : 0.18 }}
                    >
                      <button className="landmark-open" onClick={() => openLandmark(index)}>
                        <h3>{city.landmarks[index]}</h3>
                      </button>
                    </motion.div>
                  </AnimatePresence>
                </div>
                <div className="carousel-progress" aria-hidden="true">
                  {city.landmarks.map((name, i) => (
                    <span key={name} className={index === i ? "selected" : ""} />
                  ))}
                </div>
                <Link
                  className="pill-button ivory-button"
                  href={`/${city.slug}/entertainment`}
                  prefetch={false}
                >
                  Explore {city.short}
                </Link>
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
              <Gallery images={place.images} context={place.imageContext} name={place.name} />
              <div className="detail-chips">
                <span>{place.category}</span>
                <span>{city.short}</span>
                {place.district && <span>{place.district}</span>}
              </div>
              <div className="detail-actions">
                <button className="detail-save" onClick={() => toggle(place.id)}>
                  <Heart size={18} weight={saved.includes(place.id) ? "fill" : "regular"} />
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
              <PlaceActions place={place} />
              <p className="detail-address">
                {place.address} · {city.name}
              </p>
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
              <details className="source-details">
                <summary>Behind this discovery · sources &amp; credits</summary>
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
        {mode === "city" && spot !== null && (
          <LandmarkSheet
            key={city.slug + spot}
            city={city.short}
            name={city.landmarks[spot]}
            description={
              city.descriptions[spot] ||
              landmarkDescriptions[ci]?.[spot] ||
              cityDescriptions[ci] ||
              city.intro
            }
            photo={
              landmarkSources.find((source) => source.name === city.landmarks[spot])?.images?.[0]
            }
            href={
              landmarkSources.find((source) => source.name === city.landmarks[spot])?.wikipedia ||
              city.landmarkLinks[spot] ||
              undefined
            }
            onClose={() => setSpot(null)}
          />
        )}
      </AnimatePresence>
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
            <motion.dialog
              closedby="any"
              onClose={() => {
                setShowSaved(false);
                setHelp(false);
                setShowSettings(false);
              }}
              onCancel={() => {
                setShowSaved(false);
                setHelp(false);
                setShowSettings(false);
              }}
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
                <X size={18} weight="bold" />
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
                  <PwaPanel />
                  <button
                    className="preference-button sound-toggle"
                    aria-label={sound ? "Mute sounds" : "Enable sounds"}
                    aria-pressed={sound}
                    onClick={toggleSound}
                  >
                    {sound ? (
                      <SpeakerHigh size={18} weight="fill" />
                    ) : (
                      <SpeakerSlash size={18} weight="regular" />
                    )}
                    <span>
                      Quiet sound effects
                      <small>
                        {sound ? "On · two little notes" : "Off · always quiet on reload"}
                      </small>
                    </span>
                  </button>
                  <button
                    className="preference-button"
                    aria-pressed={haptics}
                    onClick={toggleHaptics}
                  >
                    <Vibrate size={18} weight={haptics ? "fill" : "regular"} />
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
                  <div className="settings-play">
                    <p className="tiny-label">How the toys work</p>
                    <p>
                      Drag a toy to turn it. Pinch or scroll to lean in. A quick swipe finds the
                      next one.
                    </p>
                    <p>
                      Tap the toy, or its name, to open that place. Explore city is the only door
                      into the chapters.
                    </p>
                    <p>Hold a toy a moment longer. Some of them answer.</p>
                    <p>
                      Map geometry: geoBoundaries / OCHA / MDB, adapted,{" "}
                      <a
                        href="https://www.geoboundaries.org/api/current/gbOpen/ZAF/ADM1/"
                        target="_blank"
                        rel="noreferrer"
                      >
                        CC BY 3.0 IGO
                      </a>
                      . Citylit toys are original illustrations.
                    </p>
                  </div>
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
                    Meet Khwezi &amp; the Citylit story <ArrowUpRight size={14} />
                  </Link>
                  <div className="settings-information">
                    <Link href="/about">About &amp; sources</Link>
                    <Link href="/privacy">Privacy &amp; data</Link>
                  </div>
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
                        <span>
                          <UiIcon name="arrow-left" size={24} />
                        </span>
                        <i />
                        <span>
                          <UiIcon name="arrow-right" size={24} />
                        </span>
                      </div>
                      <p>
                        Drag a toy to turn it. Pinch or scroll to lean closer. Swipe to find the
                        next one.
                      </p>
                      <p>
                        Tap the toy to open that place. Explore city is the door into the chapters.
                      </p>
                      <p>Hold a toy if you are feeling curious. Tap a heart to keep a discovery.</p>
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
            </motion.dialog>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
