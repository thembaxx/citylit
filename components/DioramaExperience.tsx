"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import {
  ArrowCounterClockwise,
  ArrowLeft,
  ArrowRight,
  ArrowsClockwise,
  ArrowsOutSimple,
  ArrowUpRight,
  CaretRight,
  Check,
  Compass,
  Cube,
  Info,
  MoonStars,
  Mountains,
  Plus,
  Sun,
  SunHorizon,
} from "@phosphor-icons/react";
import {
  DIORAMAS,
  DIORAMA_BY_SLUG,
  type DioramaLandmark,
  type DioramaSlug,
  type TimeMode,
} from "../lib/diorama/content";
import type { DioramaEngine, Quality, RenderBackend, RendererKind } from "../lib/diorama/types";
import { categorySlug, cities, landmarkSources, places } from "../lib/data";
import { landmarkPath, landmarkVenue, venuePath } from "../lib/discovery-guide";
import { MAX_TRIP_STOPS } from "../lib/client-data";
import { stageModel } from "../lib/stage-models";
import { useDiscovery } from "./useDiscovery";
import CartographicLoader from "./CartographicLoader";
import type { StageItem } from "./CityStage";
import { benchoAudio } from "../lib/bencho-audio";
import DropdownSelect, { type DropdownOption } from "./ui/DropdownSelect";
import PlaceWeatherBadge from "./PlaceWeatherBadge";
import WeatherLegend from "./WeatherLegend";

const LandmarkRing = dynamic(() => import("./LandmarkRing"), {
  ssr: false,
  loading: () => (
    <CartographicLoader title="City Landmarks & Places" subtitle="Procedural 3D stage" />
  ),
});

const Pixi3DStage = dynamic(() => import("./Pixi3DStage"), {
  ssr: false,
  loading: () => (
    <CartographicLoader title="PixiJS 3D Stage" subtitle="glTF & Draco PBR renderer" />
  ),
});

type DioramaScope = "diorama" | "landmark" | "pixi3d";

const SCOPE_OPTIONS: readonly DropdownOption<DioramaScope>[] = [
  {
    value: "diorama",
    label: "Regional Dioramas",
    description: "14 cutaway South African landscapes",
    icon: <Mountains size={18} weight="duotone" />,
  },
  {
    value: "landmark",
    label: "Cities & Landmarks",
    description: "Procedural 3D city landmark stage",
    icon: <Compass size={18} weight="duotone" />,
  },
  {
    value: "pixi3d",
    label: "PixiJS 3D Stage",
    description: "Interactive @pixi/3d GLB & PBR models",
    icon: <Cube size={18} weight="duotone" />,
  },
];

const TIME_OPTIONS: { mode: TimeMode; label: string; icon: typeof Sun }[] = [
  { mode: "day", label: "Day", icon: Sun },
  { mode: "golden", label: "Golden", icon: SunHorizon },
  { mode: "night", label: "Night", icon: MoonStars },
];

const BACKENDS: { value: RenderBackend; label: string; hint: string }[] = [
  {
    value: "auto",
    label: "WebGPU",
    hint: "Use the WebGPU backend when the browser supports it. Shaders compile to WGSL.",
  },
  {
    value: "webgl",
    label: "WebGL 2",
    hint: "Force the WebGL 2 backend. The same shader graph compiles to GLSL.",
  },
];

function detectQuality(): Quality {
  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const width = window.innerWidth;
  if (width < 720 || cores <= 4 || memory <= 4) {
    return {
      tier: "saver",
      terrainSegments: 80,
      waterSegments: 48,
      treeCount: 0.7,
      detail: 0.75,
      shadows: true,
      dpr: 1.75,
    };
  }
  if (width < 1100 || cores <= 8) {
    return {
      tier: "balanced",
      terrainSegments: 108,
      waterSegments: 72,
      treeCount: 0.9,
      detail: 0.9,
      shadows: true,
      dpr: 2,
    };
  }
  return {
    tier: "high",
    terrainSegments: 128,
    waterSegments: 96,
    treeCount: 1,
    detail: 1,
    shadows: true,
    dpr: 2,
  };
}

export default function DioramaExperience() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, update } = useDiscovery();
  const initialScope = (searchParams.get("scope") as DioramaScope | null) ?? "diorama";
  const initialScene = searchParams.get("scene") as DioramaSlug | null;
  const initialCity = searchParams.get("city") || cities[0]?.slug || "cape-town";
  const initialMode = searchParams.get("mode") === "places" ? "places" : "landmarks";
  const initialItem = searchParams.get("item") || undefined;

  const [scope, setScope] = useState<DioramaScope>(
    initialScope === "landmark" ? "landmark" : initialScope === "pixi3d" ? "pixi3d" : "diorama",
  );
  const [landmarkCitySlug, setLandmarkCitySlug] = useState<string>(initialCity);
  const [landmarkMode, setLandmarkMode] = useState<"landmarks" | "places">(initialMode);
  const [landmarkIndex, setLandmarkIndex] = useState(0);
  const [landmarkMessage, setLandmarkMessage] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<DioramaEngine | null>(null);
  const slugRef = useRef<DioramaSlug>(
    initialScene && DIORAMA_BY_SLUG[initialScene] ? initialScene : "hole-in-the-wall",
  );
  const timeRef = useRef<TimeMode>("day");
  const explodedRef = useRef(false);
  const autoRotateRef = useRef(false);

  const [slug, setSlug] = useState<DioramaSlug>(
    initialScene && DIORAMA_BY_SLUG[initialScene] ? initialScene : "hole-in-the-wall",
  );
  const [timeMode, setTimeMode] = useState<TimeMode>("day");
  const [exploded, setExploded] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [backend, setBackend] = useState<RenderBackend>("auto");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [landmarks, setLandmarks] = useState<DioramaLandmark[]>(
    DIORAMA_BY_SLUG["hole-in-the-wall"].landmarks,
  );
  const [renderer, setRenderer] = useState<RendererKind | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [engineReady, setEngineReady] = useState(false);

  const scene = DIORAMA_BY_SLUG[slug];
  const landmarkCity = useMemo(
    () => cities.find((c) => c.slug === landmarkCitySlug) ?? cities[0],
    [landmarkCitySlug],
  );
  const landmarkItems: StageItem[] = useMemo(() => {
    if (!landmarkCity) return [];
    const cityPlaces: StageItem[] = places
      .filter((p) => p.city === landmarkCity.slug)
      .slice(0, 6)
      .map((place) => ({
        name: place.name,
        description: place.description,
        href: venuePath(place),
        model: stageModel(place.name, place.category),
        place,
      }));
    if (landmarkMode === "places" && cityPlaces.length > 0) return cityPlaces;
    const cityLandmarks = landmarkCity.landmarks.map((name) => {
      const place = landmarkVenue(landmarkCity.slug, name);
      const record = landmarkSources.find((item) => item.name === name);
      return {
        name,
        description:
          place?.description ||
          record?.about?.split("\n")[0] ||
          `Discover the story of ${name} in ${landmarkCity.name}.`,
        href: landmarkPath(landmarkCity, name),
        model: stageModel(name, place?.category),
        place,
      };
    });
    return cityLandmarks.length > 0 ? cityLandmarks : cityPlaces;
  }, [landmarkCity, landmarkMode]);

  useEffect(() => {
    if (!initialItem || landmarkItems.length === 0) return;
    const normalized = categorySlug(initialItem);
    const found = landmarkItems.findIndex(
      (item) =>
        item.name.toLowerCase() === initialItem.toLowerCase() ||
        item.place?.id === initialItem ||
        categorySlug(item.name) === normalized,
    );
    if (found >= 0) setLandmarkIndex(found);
  }, [initialItem, landmarkItems]);

  const activeLandmarkIndex =
    landmarkItems.length > 0 ? Math.min(landmarkIndex, landmarkItems.length - 1) : 0;
  const activeLandmark = landmarkItems[activeLandmarkIndex];
  const activeInDay = !!(
    activeLandmark?.place && state.itinerary.includes(activeLandmark.place.id)
  );

  const toggleActiveLandmarkInDay = useCallback(() => {
    const place = activeLandmark?.place;
    if (!place || !landmarkCity) return;
    const first = places.find((row) => row.id === state.itinerary[0]);
    if (!activeInDay && first && first.city !== landmarkCity.slug) {
      benchoAudio.playClick(360);
      setLandmarkMessage(
        "Your day belongs to another city. Clear it in My day before starting a new one.",
      );
      return;
    }
    if (!activeInDay && state.itinerary.length >= MAX_TRIP_STOPS) {
      benchoAudio.playClick(360);
      setLandmarkMessage("Your day is full. Remove a stop in My day first.");
      return;
    }
    const saved = update((previous) => ({
      itinerary: activeInDay
        ? previous.itinerary.filter((id) => id !== place.id)
        : [...new Set([...previous.itinerary, place.id])],
    }));
    if (saved) {
      if (activeInDay) benchoAudio.playClick(440);
      else benchoAudio.playConfirm();
    }
    setLandmarkMessage(
      saved
        ? activeInDay
          ? "Removed from your day."
          : "Added to your day."
        : "This browser could not save your day. Allow site storage and try again.",
    );
  }, [activeInDay, activeLandmark, landmarkCity, state.itinerary, update]);

  const selected = useMemo(
    () => landmarks.find((landmark) => landmark.id === selectedId) ?? null,
    [landmarks, selectedId],
  );

  slugRef.current = slug;
  timeRef.current = timeMode;
  explodedRef.current = exploded;
  autoRotateRef.current = autoRotate;

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (scope !== "diorama") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let engine: DioramaEngine | null = null;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    setEngineReady(false);
    setStatus("loading");
    setRenderer(null);
    setError("");

    (async () => {
      try {
        const { createDioramaEngine } = await import("../lib/diorama/engine");
        if (cancelled) return;
        engine = createDioramaEngine({
          canvas,
          backend,
          quality: detectQuality(),
          reducedMotion: reduce,
          onRenderer: setRenderer,
          onLandmarks: (next) => {
            setLandmarks(next);
            setSelectedId(null);
          },
          onSelect: (id) => setSelectedId(id),
          onError: (message) => {
            setError(message);
            setStatus("error");
          },
        });
        engineRef.current = engine;
        await engine.init();
        if (cancelled) {
          engine.dispose();
          return;
        }
        setEngineReady(true);
      } catch (cause) {
        if (cancelled) return;
        setError(
          cause instanceof Error ? cause.message : "The 3D scene could not start in this browser.",
        );
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      engine?.dispose();
      if (engineRef.current === engine) engineRef.current = null;
    };
  }, [backend, scope]);

  useEffect(() => {
    if (!engineReady) return;
    let cancelled = false;
    setStatus("loading");
    const engine = engineRef.current;
    if (!engine) return;
    engine
      .load(slug)
      .then(() => {
        if (cancelled) return;
        engine.setAtmosphere(timeRef.current);
        engine.setExploded(explodedRef.current);
        engine.setAutoRotate(autoRotateRef.current);
        setStatus("ready");
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : "This diorama could not be built.");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [slug, engineReady]);

  useEffect(() => {
    engineRef.current?.setAtmosphere(timeMode);
  }, [timeMode]);

  useEffect(() => {
    engineRef.current?.setExploded(exploded);
  }, [exploded]);

  useEffect(() => {
    engineRef.current?.setAutoRotate(autoRotate);
  }, [autoRotate]);

  const tabRefs = useRef(new Map<DioramaSlug, HTMLButtonElement>());

  const onTabKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
    if (!keys.includes(event.key)) return;
    const index = DIORAMAS.findIndex((item) => item.slug === slugRef.current);
    if (index < 0) return;
    event.preventDefault();
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % DIORAMAS.length;
    if (event.key === "ArrowLeft") next = (index - 1 + DIORAMAS.length) % DIORAMAS.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = DIORAMAS.length - 1;
    const nextSlug = DIORAMAS[next].slug;
    setSlug(nextSlug);
    tabRefs.current.get(nextSlug)?.focus();
  }, []);

  const selectLandmark = useCallback((id: string) => {
    benchoAudio.playBeaconSelect();
    setSelectedId(id);
    engineRef.current?.focus(id);
  }, []);

  const resetView = useCallback(() => {
    benchoAudio.playWhoosh();
    engineRef.current?.resetView();
    setSelectedId(null);
  }, []);

  const stageStyle = {
    "--scene-accent": scene.accent,
    "--scene-soft": timeMode === "night" ? "#3c4763" : scene.accentSoft,
    "--scene-sky": timeMode === "night" ? "#2b3550" : scene.sky,
  } as CSSProperties;

  return (
    <section className="dioramas" aria-labelledby="dioramas-title">
      <header className="dioramas-header">
        <h1 id="dioramas-title">Walk into the landscape.</h1>
        <p className="dioramas-lede">
          Explore fourteen cutaway South African landscapes or inspect procedural city landmarks in
          3D.
        </p>

        <div className="dioramas-scope-dropdown-wrap">
          <DropdownSelect
            value={scope}
            options={SCOPE_OPTIONS}
            onChange={(nextScope) => setScope(nextScope)}
            ariaLabel="Choose 3D view"
          />
        </div>
      </header>

      {scope === "landmark" ? (
        <div className="dioramas-landmark-panel">
          <div className="dioramas-landmark-cities" role="tablist" aria-label="Choose a city">
            {cities.map((c) => (
              <button
                key={c.slug}
                type="button"
                role="tab"
                aria-selected={c.slug === landmarkCity?.slug}
                className={`dioramas-tab${c.slug === landmarkCity?.slug ? " is-active" : ""}`}
                onClick={() => {
                  benchoAudio.playTap(780);
                  setLandmarkCitySlug(c.slug);
                  setLandmarkMode("landmarks");
                  setLandmarkIndex(0);
                  setLandmarkMessage("");
                }}
              >
                <span className="dioramas-tab-name">{c.name}</span>
                <span className="dioramas-tab-province">{c.province}</span>
              </button>
            ))}
          </div>
          {landmarkItems.length > 0 && activeLandmark ? (
            <>
              <div
                className="dioramas-landmark-picker"
                role="group"
                aria-label={`Choose a ${landmarkMode === "places" ? "place" : "landmark"} in ${landmarkCity?.name ?? "city"}`}
              >
                {landmarkItems.map((item, idx) => {
                  const isActive = idx === activeLandmarkIndex;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      aria-pressed={isActive}
                      className={`dioramas-landmark-pill${isActive ? " is-active" : ""}`}
                      onClick={() => {
                        benchoAudio.playTap(780);
                        setLandmarkIndex(idx);
                        setLandmarkMessage("");
                      }}
                    >
                      {item.name}
                    </button>
                  );
                })}
              </div>
              <div className="dioramas-landmark-stage">
                <LandmarkRing
                  items={landmarkItems}
                  selected={activeLandmarkIndex}
                  onSelect={(idx) => {
                    setLandmarkIndex(idx);
                    setLandmarkMessage("");
                  }}
                  itinerary={state.itinerary}
                  onOpenGuide={() => router.push(activeLandmark.href)}
                />
              </div>
              <div className="dioramas-landmark-sheet" aria-live="polite">
                <div className="dioramas-landmark-sheet-head">
                  <div className="dioramas-landmark-heading">
                    <h2>{activeLandmark.name}</h2>
                    <PlaceWeatherBadge
                      name={activeLandmark.name}
                      longitude={activeLandmark.place?.coords?.[0] ?? landmarkCity?.coords[0]}
                      latitude={activeLandmark.place?.coords?.[1] ?? landmarkCity?.coords[1]}
                    />
                    <WeatherLegend />
                  </div>
                  <div className="dioramas-landmark-stepper">
                    <button
                      type="button"
                      aria-label="Previous discovery"
                      onClick={() => {
                        benchoAudio.playTap(740);
                        setLandmarkIndex(
                          (activeLandmarkIndex - 1 + landmarkItems.length) % landmarkItems.length,
                        );
                        setLandmarkMessage("");
                      }}
                    >
                      <ArrowLeft size={17} aria-hidden="true" />
                    </button>
                    <span>
                      {String(activeLandmarkIndex + 1).padStart(2, "0")} /{" "}
                      {String(landmarkItems.length).padStart(2, "0")}
                    </span>
                    <button
                      type="button"
                      aria-label="Next discovery"
                      onClick={() => {
                        benchoAudio.playTap(820);
                        setLandmarkIndex((activeLandmarkIndex + 1) % landmarkItems.length);
                        setLandmarkMessage("");
                      }}
                    >
                      <ArrowRight size={17} aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <p className="dioramas-landmark-desc">{activeLandmark.description}</p>
                <div className="dioramas-landmark-sheet-actions">
                  <Link href={activeLandmark.href} className="dioramas-landmark-guide">
                    Open guide <ArrowUpRight size={17} aria-hidden="true" />
                  </Link>
                  {activeLandmark.place ? (
                    <button
                      type="button"
                      aria-pressed={activeInDay}
                      onClick={toggleActiveLandmarkInDay}
                    >
                      {activeInDay ? (
                        <Check size={17} aria-hidden="true" />
                      ) : (
                        <Plus size={17} aria-hidden="true" />
                      )}
                      {activeInDay ? "In my day" : "Add to my day"}
                    </button>
                  ) : null}
                </div>
                <p className="dioramas-landmark-status" role="status">
                  {landmarkMessage}
                </p>
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      {scope === "pixi3d" ? <Pixi3DStage /> : null}

      {scope === "diorama" ? (
        <div className="dioramas-grid">
          <div className="dioramas-main">
            <div
              className="dioramas-tabs"
              role="tablist"
              aria-label="Choose a diorama"
              onKeyDown={onTabKeyDown}
            >
              {DIORAMAS.map((item) => (
                <button
                  key={item.slug}
                  ref={(node) => {
                    if (node) tabRefs.current.set(item.slug, node);
                    else tabRefs.current.delete(item.slug);
                  }}
                  type="button"
                  role="tab"
                  aria-selected={item.slug === slug}
                  tabIndex={item.slug === slug ? 0 : -1}
                  className={`dioramas-tab${item.slug === slug ? " is-active" : ""}`}
                  onClick={() => setSlug(item.slug)}
                >
                  <span className="dioramas-tab-name">{item.name}</span>
                  <span className="dioramas-tab-province">{item.province}</span>
                </button>
              ))}
            </div>

            <div className="dioramas-stage" style={stageStyle} data-time={timeMode}>
              <canvas
                key={backend}
                ref={canvasRef}
                className="dioramas-canvas"
                aria-label={`Interactive 3D diorama of ${scene.name}: ${scene.title}`}
                aria-describedby="dioramas-instructions"
              />
              <div className="dioramas-stage-glow" aria-hidden="true" />
              <div className="dioramas-stage-top">
                <div className="dioramas-stage-title">
                  <span>{scene.name}</span>
                  <strong>{scene.title}</strong>
                </div>
                <span className={`dioramas-badge${renderer ? " is-live" : ""}`}>
                  <span className="dioramas-dot" aria-hidden="true" />
                  {renderer ? renderer : "Starting"}
                </span>
              </div>
              <p className="dioramas-hint" id="dioramas-instructions">
                Drag to orbit · Scroll or pinch to zoom · Select a marker to focus
              </p>
              {status === "loading" ? (
                <CartographicLoader
                  title={scene.name}
                  subtitle={scene.title}
                  coordinates={scene.province}
                />
              ) : null}
              {status === "error" ? (
                <div className="dioramas-status is-error" role="alert">
                  <Info size={20} aria-hidden="true" />
                  <span>{error || "This scene could not be rendered."}</span>
                  <button type="button" onClick={() => window.location.reload()}>
                    Reload
                  </button>
                </div>
              ) : null}
            </div>

            <div className="dioramas-controls">
              <div className="dioramas-segment" role="group" aria-label="Time of day">
                {TIME_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.mode}
                      type="button"
                      className={`dioramas-control${timeMode === option.mode ? " is-active" : ""}`}
                      aria-pressed={timeMode === option.mode}
                      aria-label={option.label}
                      title={option.label}
                      onClick={() => setTimeMode(option.mode)}
                    >
                      <Icon size={18} aria-hidden="true" weight="regular" />
                    </button>
                  );
                })}
              </div>
              <div className="dioramas-toggles" role="group" aria-label="Scene options">
                <button
                  type="button"
                  className={`dioramas-control${exploded ? " is-active" : ""}`}
                  aria-pressed={exploded}
                  aria-label="Explode layers"
                  title="Explode layers"
                  onClick={() => setExploded((value) => !value)}
                >
                  <ArrowsOutSimple size={18} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={`dioramas-control${autoRotate ? " is-active" : ""}`}
                  aria-pressed={autoRotate}
                  aria-label="Auto-rotate"
                  disabled={reducedMotion}
                  title={
                    reducedMotion
                      ? "Auto-rotate is off because reduced motion is enabled"
                      : "Auto-rotate"
                  }
                  onClick={() => setAutoRotate((value) => !value)}
                >
                  <ArrowsClockwise size={18} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={`dioramas-control${""}`}
                  aria-label="Reset camera"
                  title="Reset camera"
                  onClick={resetView}
                >
                  <ArrowCounterClockwise size={18} aria-hidden="true" />
                </button>
              </div>
            </div>

            <p className="dioramas-caption">{scene.description}</p>
          </div>

          <aside className="dioramas-side" aria-label="Landmarks and sources">
            <div className="dioramas-panel">
              <div className="dioramas-panel-heading">
                <h2>Landmarks</h2>
                <span>{landmarks.length} to find</span>
              </div>
              <ul className="dioramas-landmarks">
                {landmarks.map((landmark) => (
                  <li key={landmark.id}>
                    <button
                      type="button"
                      className={`dioramas-landmark${selectedId === landmark.id ? " is-active" : ""}`}
                      aria-pressed={selectedId === landmark.id}
                      onClick={() => selectLandmark(landmark.id)}
                    >
                      <span className="dioramas-landmark-copy">
                        <span className="dioramas-landmark-kicker">{landmark.kicker}</span>
                        <span className="dioramas-landmark-name">{landmark.name}</span>
                      </span>
                      <CaretRight size={16} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="dioramas-panel dioramas-info" aria-live="polite">
              {selected ? (
                <>
                  <p className="dioramas-info-kicker">{selected.kicker}</p>
                  <h2>{selected.name}</h2>
                  <p>{selected.description}</p>
                  <p className="dioramas-fact">{selected.fact}</p>
                  <a
                    className="dioramas-source"
                    href={selected.source.url}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Source: {selected.source.label}
                  </a>
                </>
              ) : (
                <>
                  <p className="dioramas-info-kicker">
                    <Cube size={14} aria-hidden="true" /> The scene
                  </p>
                  <h2>{scene.tagline}</h2>
                  <p>
                    Choose a landmark from the list, or tap one of the glowing markers in the scene.
                    The camera will move in for a closer look.
                  </p>
                  <p className="dioramas-fact">
                    {scene.province} · {scene.name}
                  </p>
                </>
              )}
            </div>

            <div className="dioramas-panel dioramas-sources">
              <h2>Sources</h2>
              <ul>
                {scene.sources.map((source) => (
                  <li key={source.url}>
                    <a href={source.url} target="_blank" rel="noreferrer noopener">
                      {source.label}
                    </a>
                  </li>
                ))}
              </ul>
              <p>
                Landmark positions and terrain are an artistic interpretation, not a survey. Facts
                follow the linked references.
              </p>
              <details className="dioramas-advanced-details">
                <summary>Graphics backend</summary>
                <div
                  className="dioramas-segment dioramas-renderer-segment"
                  role="group"
                  aria-label="Renderer backend"
                >
                  {BACKENDS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`dioramas-control${backend === option.value ? " is-active" : ""}`}
                      aria-pressed={backend === option.value}
                      aria-description={option.hint}
                      title={option.hint}
                      onClick={() => setBackend(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </details>
            </div>
          </aside>
        </div>
      ) : null}
    </section>
  );
}
