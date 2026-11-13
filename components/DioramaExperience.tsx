"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  ArrowCounterClockwise,
  ArrowsClockwise,
  ArrowsOutSimple,
  CaretRight,
  Cube,
  Info,
  MoonStars,
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
import type { DioramaEngine, Quality, RendererKind } from "../lib/diorama/types";

const TIME_OPTIONS: { mode: TimeMode; label: string; icon: typeof Sun }[] = [
  { mode: "day", label: "Day", icon: Sun },
  { mode: "golden", label: "Golden", icon: SunHorizon },
  { mode: "night", label: "Night", icon: MoonStars },
];

function detectQuality(): Quality {
  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const width = window.innerWidth;
  if (width < 720 || cores <= 4 || memory <= 4) {
    return {
      tier: "saver",
      terrainSegments: 64,
      waterSegments: 40,
      treeCount: 0.6,
      detail: 0.6,
      shadows: false,
      dpr: 1.3,
    };
  }
  if (width < 1100 || cores <= 8) {
    return {
      tier: "balanced",
      terrainSegments: 96,
      waterSegments: 64,
      treeCount: 0.85,
      detail: 0.8,
      shadows: true,
      dpr: 1.6,
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<DioramaEngine | null>(null);
  const slugRef = useRef<DioramaSlug>("soweto");
  const timeRef = useRef<TimeMode>("day");
  const explodedRef = useRef(false);
  const autoRotateRef = useRef(false);

  const [slug, setSlug] = useState<DioramaSlug>("soweto");
  const [timeMode, setTimeMode] = useState<TimeMode>("day");
  const [exploded, setExploded] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [landmarks, setLandmarks] = useState<DioramaLandmark[]>(DIORAMA_BY_SLUG.soweto.landmarks);
  const [renderer, setRenderer] = useState<RendererKind | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [engineReady, setEngineReady] = useState(false);

  const scene = DIORAMA_BY_SLUG[slug];
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
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    (async () => {
      try {
        const { createDioramaEngine } = await import("../lib/diorama/engine");
        if (cancelled) return;
        const engine = createDioramaEngine({
          canvas,
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
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

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

  const selectLandmark = useCallback((id: string) => {
    setSelectedId(id);
    engineRef.current?.focus(id);
  }, []);

  const resetView = useCallback(() => {
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
        <p className="dioramas-eyebrow">FOUR PLACES · ONE COUNTRY</p>
        <h1 id="dioramas-title">Walk into the landscape.</h1>
        <p className="dioramas-lede">
          Cutaway blocks of South Africa, built in real time. Orbit the scene, change the light, or
          open the earth to see how each place is layered.
        </p>
      </header>

      <div className="dioramas-grid">
        <div className="dioramas-main">
          <div className="dioramas-tabs" role="tablist" aria-label="Choose a diorama">
            {DIORAMAS.map((item) => (
              <button
                key={item.slug}
                type="button"
                role="tab"
                aria-selected={item.slug === slug}
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
                {renderer ?? "Starting"}
              </span>
            </div>
            <p className="dioramas-hint" id="dioramas-instructions">
              Drag to orbit · Scroll or pinch to zoom · Select a marker to focus
            </p>
            {status === "loading" ? (
              <div className="dioramas-status" role="status">
                <span className="dioramas-spinner" aria-hidden="true" />
                <span>Building {scene.name}…</span>
              </div>
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
                    onClick={() => setTimeMode(option.mode)}
                  >
                    <Icon size={17} aria-hidden="true" weight="regular" />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="dioramas-toggles" role="group" aria-label="Scene options">
              <button
                type="button"
                className={`dioramas-control${exploded ? " is-active" : ""}`}
                aria-pressed={exploded}
                onClick={() => setExploded((value) => !value)}
              >
                <ArrowsOutSimple size={17} aria-hidden="true" />
                <span>Explode</span>
              </button>
              <button
                type="button"
                className={`dioramas-control${autoRotate ? " is-active" : ""}`}
                aria-pressed={autoRotate}
                disabled={reducedMotion}
                title={
                  reducedMotion ? "Auto-rotate is off because reduced motion is enabled" : undefined
                }
                onClick={() => setAutoRotate((value) => !value)}
              >
                <ArrowsClockwise size={17} aria-hidden="true" />
                <span>Auto-rotate</span>
              </button>
              <button type="button" className="dioramas-control" onClick={resetView}>
                <ArrowCounterClockwise size={17} aria-hidden="true" />
                <span>Reset</span>
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
          </div>
        </aside>
      </div>
    </section>
  );
}
