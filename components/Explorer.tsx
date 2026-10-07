"use client";
import dynamic from "next/dynamic";
import { useEffect, useState, useMemo, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useDrag } from "@use-gesture/react";
import {
  ArrowUpRight,
  ArrowRight,
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
  Volume2,
  VolumeX,
} from "lucide-react";
import MiniSearch from "minisearch";
import Gallery from "./Gallery";
import { cities, categories, places, categorySlug, landmarkSources } from "../lib/data";
const Scene = dynamic(() => import("./Scene"), {
  ssr: false,
  loading: () => <div className="scene-loading">ASSEMBLING YOUR ADVENTURE…</div>,
});
const PlaceMap = dynamic(() => import("./PlaceMap"), { ssr: false });
const icons = [Ticket, BedDouble, Drama, Trees, Music];
export default function Explorer() {
  const pathname = usePathname(),
    router = useRouter();
  const parts = pathname.split("/").filter(Boolean);
  const ci = Math.max(
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
  const [index, setIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [help, setHelp] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const [sound, setSound] = useState(false);
  const [reset, setReset] = useState(0);
  const [animate, setAnimate] = useState(true);
  const reduced = useReducedMotion();
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
    if (!showSaved && !help) return;
    const before = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
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
      document.body.style.overflow = oldOverflow;
      before?.focus();
    };
  }, [showSaved, help]);
  const toggle = (id: string) =>
    setSaved((prev) => {
      const next = prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id];
      try {
        localStorage.setItem("mzansi-saved", JSON.stringify(next));
      } catch {}
      return next;
    });
  const goCity = (i: number) => router.push("/" + cities[i].slug);
  const next = (direction: number) => setIndex((v) => (v + direction + 3) % 3);
  const bind = useDrag(
    ({ last, swipe: [x], movement: [mx] }) => {
      if (last && (x || Math.abs(mx) > 70)) next((x || mx) > 0 ? -1 : 1);
    },
    { axis: "x", filterTaps: true },
  );
  const search = useMemo(() => {
    const engine = new MiniSearch({
      fields: ["name", "description", "category", "address"],
      storeFields: ["id"],
    });
    engine.addAll(places);
    return engine;
  }, []);
  const ids = query ? search.search(query, { prefix: true, fuzzy: 0.2 }).map((r) => r.id) : null;
  const visible = places.filter(
    (p) => p.city === city.slug && (query ? ids?.includes(p.id) : p.category === categories[cat]),
  );
  return (
    <main>
      <header className="header">
        <button className="brand" onClick={() => router.push("/")} aria-label="Citylit home">
          <span className="brand-symbol">
            c<ArrowUpRight size={17} />
          </span>
          citylit
        </button>
        <span className="header-note">A LITTLE CURIOSITY. A WHOLE COUNTRY.</span>
        <div className="header-actions">
          <button className="saved-button" onClick={() => setShowSaved(true)}>
            <Heart size={16} /> Your discoveries{" "}
            <span>{saved.length.toString().padStart(2, "0")}</span>
          </button>
          <button className="round" onClick={() => setHelp(true)} aria-label="How to explore">
            <Compass size={19} />
          </button>
        </div>
      </header>
      <div className="breadcrumb">
        <button onClick={() => router.push("/")}>SOUTH AFRICA</button>
        {mode !== "map" && (
          <>
            <span>/</span>
            <button onClick={() => goCity(ci)}>{city.name.toUpperCase()}</button>
          </>
        )}
        {parts.length > 1 && (
          <>
            <span>/</span>
            <button onClick={() => router.push(`/${city.slug}/${categorySlug(categories[cat])}`)}>
              {categories[cat].toUpperCase()}
            </button>
          </>
        )}
        <span className="live">
          <i /> OPEN TO EXPLORATION
        </span>
      </div>
      <section className={`experience ${mode === "place" ? "detail-experience" : ""}`}>
        <div className="intro">
          <div className="eyebrow">
            <span className="chapter">
              {mode === "map" ? "I" : mode === "city" ? "II" : mode === "category" ? "III" : "IV"}
            </span>
            {mode === "map"
              ? "CHOOSE YOUR NEXT CHAPTER"
              : mode === "city"
                ? "GET TO KNOW THE CITY"
                : mode === "category"
                  ? "FOLLOW YOUR CURIOSITY"
                  : "A NEW DISCOVERY"}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={mode + city.slug + cat}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.3 }}
            >
              <h1>
                {mode === "map" ? (
                  <>
                    <span className="heading-main">A whole country.</span>
                    <span>A world to discover.</span>
                  </>
                ) : mode === "city" ? (
                  <>
                    {city.name.split(" ").map((word, i) => (
                      <span className={i ? "blue" : ""} key={word}>
                        {word}
                        <br />
                      </span>
                    ))}
                  </>
                ) : mode === "category" ? (
                  <>
                    {categories[cat].split(" & ").map((word, i) => (
                      <span key={word} className={i ? "blue" : ""}>
                        {word}
                        <br />
                      </span>
                    ))}
                  </>
                ) : (
                  <>{place?.name}</>
                )}
              </h1>
              <p className="intro-copy">
                {mode === "map"
                  ? "Three cities. Endless possibilities. Take a spin, pick a place, and see where your curiosity takes you."
                  : mode === "city"
                    ? city.intro
                    : mode === "category"
                      ? `The places that make ${city.short}, ${city.short}. Find something worth stepping out for.`
                      : place?.description}
              </p>
            </motion.div>
          </AnimatePresence>
          {mode === "map" ? (
            <div className="intro-bottom">
              <span className="tiny-label">YOUR ADVENTURE STARTS HERE</span>
              <span className="down-arrow">↓</span>
            </div>
          ) : (
            <button
              className="back-button"
              onClick={() =>
                router.push(
                  mode === "city"
                    ? "/"
                    : mode === "place"
                      ? `/${city.slug}/${categorySlug(categories[cat])}`
                      : `/${city.slug}`,
                )
              }
            >
              <ArrowLeft size={16} /> Back to{" "}
              {mode === "city" ? "the map" : mode === "place" ? "places" : "the city"}
            </button>
          )}
        </div>
        {mode === "place" && place ? (
          <div className="place-detail">
            <Gallery images={place.images} context={place.imageContext} name={place.name} />
            <button className="detail-save" onClick={() => toggle(place.id)}>
              <Heart size={17} fill={saved.includes(place.id) ? "currentColor" : "none"} />
              {saved.includes(place.id) ? "Saved to discoveries" : "Save this discovery"}
            </button>
            <div className="detail-info">
              <div>
                <span className="tiny-label">FIND YOUR WAY</span>
                <h3>{place.address}</h3>
                <p>{city.name}, South Africa</p>
              </div>
              <a
                className="primary"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + " " + place.address + " " + city.name)}`}
                target="_blank"
                rel="noreferrer"
              >
                Get directions <ArrowUpRight size={18} />
              </a>
            </div>
            <PlaceMap coords={place.coords} name={place.name} accuracy={place.coordinateAccuracy} />
            <p className="data-note">
              {place.coordinateAccuracy === "venue"
                ? "Pin sourced from venue geographic data."
                : "Map shows the city centre; venue coordinates are not available."}{" "}
              Check opening hours and event details with the venue.
            </p>
            <div className="venue-links">
              <a className="photo-link" href={place.website} target="_blank" rel="noreferrer">
                Official website <ArrowUpRight size={16} />
              </a>
              {place.wikipedia && (
                <a className="photo-link" href={place.wikipedia} target="_blank" rel="noreferrer">
                  Read on Wikipedia <ArrowUpRight size={16} />
                </a>
              )}
            </div>
            <details className="source-details">
              <summary>Behind this discovery · sources & credits</summary>
              <p>Source pages checked {place.checkedAt}. Hours and event programmes can change.</p>
              {place.sources.map((source) => (
                <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
                  {source.title} <ArrowUpRight size={13} />
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
                Map coordinate source <ArrowUpRight size={13} />
              </a>
            </details>
          </div>
        ) : (
          <div className="scene-panel">
            <div className="scene-top">
              <span>{mode === "map" ? "29° S / 24° E" : city.province.toUpperCase()}</span>
              <span>AN INTERACTIVE FIELD GUIDE ↗</span>
            </div>
            <div className="scene">
              <Scene
                mode={mode}
                city={ci}
                index={index}
                category={cat}
                reset={reset}
                animate={animate}
                onCity={goCity}
                onSelect={() => router.push(`/${city.slug}/entertainment`)}
              />
            </div>
            <div className="scene-tools">
              <button
                className="round"
                aria-label="Reset 3D view"
                onClick={() => setReset((v) => v + 1)}
              >
                <RotateCcw size={17} />
              </button>
              <button
                className="round"
                aria-label={animate ? "Pause animations" : "Play animations"}
                onClick={() => setAnimate((v) => !v)}
              >
                {animate ? <Pause size={16} /> : <Play size={16} />}
              </button>
            </div>
            {mode === "map" && (
              <div className="map-legend">
                <span>
                  <i className="legend-active" />3 provinces ready to explore
                </span>
                <span>
                  <i />
                  More chapters coming
                </span>
              </div>
            )}
            {mode === "map" && (
              <a
                className="map-credit"
                href="https://www.geoboundaries.org/api/current/gbOpen/ZAF/ADM1/"
                target="_blank"
                rel="noreferrer"
              >
                Map: geoBoundaries / OCHA / MDB · adapted · CC BY 3.0 IGO
              </a>
            )}
            <div className="scene-bottom">
              <span className="gesture">
                <span>⤧</span> DRAG TO ROTATE · PINCH TO ZOOM
              </span>
              <button onClick={() => setHelp(true)} className="text-button">
                HOW TO PLAY <ArrowUpRight size={13} />
              </button>
            </div>
            {mode === "city" && (
              <div
                className="landmark-caption"
                {...bind()}
                onKeyDown={(e) => {
                  if (e.key === "ArrowLeft") next(-1);
                  if (e.key === "ArrowRight") next(1);
                }}
                tabIndex={0}
                aria-label="Landmark carousel. Use arrow keys or swipe."
              >
                <button className="round" onClick={() => next(-1)} aria-label="Previous landmark">
                  <ChevronLeft />
                </button>
                <button
                  className="landmark-open"
                  onClick={() => router.push(`/${city.slug}/entertainment`)}
                >
                  <span className="tiny-label">LANDMARK {index + 1} / 3</span>
                  <h3>
                    {city.landmarks[index]} <ArrowUpRight size={23} />
                  </h3>
                  <span>Tap to discover what’s around</span>
                </button>
                <button className="round" onClick={() => next(1)} aria-label="Next landmark">
                  <ChevronRight />
                </button>
              </div>
            )}
            {mode === "city" && (
              <a
                className="landmark-wiki"
                href={landmarkSources[ci * 3 + index]?.wikipedia}
                target="_blank"
                rel="noreferrer"
              >
                The story behind {city.landmarks[index]} <ArrowUpRight size={12} />
              </a>
            )}
          </div>
        )}
        {mode === "city" && (
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
        )}
      </section>
      {mode === "map" ? (
        <section className="cities-section">
          <div className="section-heading">
            <h2>
              Pick a city. <span>Find your story.</span>
            </h2>
            <span className="tiny-label">01 — 03 / THE FIRST CHAPTERS</span>
          </div>
          <div className="city-grid">
            {cities.map((c, i) => (
              <button className="city-card" key={c.slug} onClick={() => goCity(i)}>
                <span className="city-number">0{i + 1}</span>
                <div>
                  <span className="tiny-label">{c.province}</span>
                  <h3>{c.name}</h3>
                  <p>{c.tag}</p>
                </div>
                <ArrowUpRight className="city-arrow" size={26} />
                <span className="card-line" />
              </button>
            ))}
          </div>
        </section>
      ) : mode === "city" ? (
        <section className="cities-section">
          <div className="section-heading">
            <h2>
              What’s your <span>kind of adventure?</span>
            </h2>
            <span className="tiny-label">FIVE WAYS TO EXPLORE</span>
          </div>
          <div className="category-grid">
            {categories.map((c, i) => {
              const Icon = icons[i];
              return (
                <button key={c} onClick={() => router.push(`/${city.slug}/${categorySlug(c)}`)}>
                  <Icon size={28} strokeWidth={1.3} />
                  <span>{c}</span>
                  <ArrowUpRight size={17} />
                </button>
              );
            })}
          </div>
        </section>
      ) : mode === "category" ? (
        <section className="places-section">
          <div className="category-tabs">
            {categories.map((c, i) => {
              const Icon = icons[i];
              return (
                <button
                  className={i === cat ? "active" : ""}
                  key={c}
                  onClick={() => router.push(`/${city.slug}/${categorySlug(c)}`)}
                >
                  <Icon size={17} />
                  {c}
                </button>
              );
            })}
          </div>
          <div className="section-heading">
            <h2>
              Your next <span>“let’s go there.”</span>
            </h2>
            <label className="search">
              <Search size={17} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${city.short}…`}
              />
              {query && (
                <button onClick={() => setQuery("")} aria-label="Clear search">
                  <X size={15} />
                </button>
              )}
            </label>
          </div>
          <div className="places-grid">
            {visible.map((p) => (
              <motion.article layout key={p.id} className="place-card">
                <div className="place-icon">
                  {(() => {
                    const Icon = icons[categories.indexOf(p.category)];
                    return <Icon size={30} strokeWidth={1.2} />;
                  })()}
                </div>
                <button
                  className="place-open"
                  onClick={() => router.push(`/${city.slug}/${categorySlug(p.category)}/${p.id}`)}
                >
                  <span className="tiny-label">{p.category}</span>
                  <h3>{p.name}</h3>
                  <p>{p.description}</p>
                  <span className="address">
                    <MapPin size={12} />
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
                <ArrowUpRight size={20} />
              </motion.article>
            ))}
          </div>
          {!visible.length && <p className="empty">No discoveries yet. Try another search.</p>}
        </section>
      ) : null}
      <footer>
        <span>MADE FOR THE WANDERERS. THE LOCALS. THE CURIOUS.</span>
        <span className="footer-center">
          <i /> SOUTH AFRICA, A LITTLE CLOSER.
        </span>
        <button
          onClick={() => {
            setSound((v) => !v);
            if (!sound) {
              const audio = new AudioContext();
              const osc = audio.createOscillator(),
                gain = audio.createGain();
              osc.connect(gain);
              gain.connect(audio.destination);
              osc.frequency.value = 440;
              gain.gain.setValueAtTime(0.04, audio.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.4);
              osc.start();
              osc.stop(audio.currentTime + 0.4);
              osc.onended = () => {
                void audio.close();
              };
            }
          }}
        >
          {sound ? <Volume2 size={14} /> : <VolumeX size={14} />} SOUND {sound ? "ON" : "OFF"}
        </button>
      </footer>
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
              initial={{ y: 30 }}
              animate={{ y: 0 }}
              role="dialog"
              aria-modal="true"
              aria-label={help ? "How to explore" : "Your discoveries"}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="modal-close round"
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
              {help ? (
                <>
                  <p>Drag the map or landmark to give it a spin. Pinch or scroll to get closer.</p>
                  <p>
                    Choose a numbered city, swipe through its landmarks, and follow a category to
                    find your next favourite place.
                  </p>
                  <p>Tap the heart to keep a discovery for later.</p>
                  <button className="primary" onClick={() => setHelp(false)}>
                    Let’s explore <ArrowRight size={18} />
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
