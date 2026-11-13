"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { installPixi3DUnsafeEvalCompat } from "../lib/pixi3d-csp-compat";
import { Application, Assets } from "pixi.js";

installPixi3DUnsafeEvalCompat();
import {
  CylinderGeometry,
  DirectionalLight,
  Material3D,
  Mesh3D,
  Model3D,
  PointLight,
  TorusGeometry,
  View3D,
  setDracoDecoderPath,
  type Scene3DSource,
} from "@pixi/3d";
import { OrbitCamera } from "@pixi/3d/extras";
import { useReducedMotion } from "motion/react";
import {
  ArrowCounterClockwise,
  ArrowsClockwise,
  Cube,
  Info,
  MapPin,
  MoonStars,
  Sun,
  SunHorizon,
} from "@phosphor-icons/react";
import type { TimeMode } from "../lib/diorama/content";
import type { RenderBackend } from "../lib/diorama/types";
import { benchoAudio } from "../lib/bencho-audio";

export interface PixiStageEntry {
  id: string;
  name: string;
  city: string;
  modelUrl: string;
  summary: string;
}

const PIXI_MODELS: readonly PixiStageEntry[] = [
  {
    id: "table-mountain",
    name: "Table Mountain",
    city: "Cape Town",
    modelUrl: "/models/stage/table-mountain.glb",
    summary: "Sandstone plateau and Twelve Apostles escarpment in real-time GLB lighting.",
  },
  {
    id: "mcgregor-museum",
    name: "McGregor Museum",
    city: "Kimberley",
    modelUrl: "/models/hero/mcgregor-museum.glb",
    summary: "Historic 1897 Kimberley sanatorium and natural-history archive.",
  },
  {
    id: "union-buildings",
    name: "Union Buildings",
    city: "Pretoria",
    modelUrl: "/models/stage/union-buildings.glb",
    summary: "Baker's semicircular sandstone colonnade, twin clock towers and terraced lawns.",
  },
  {
    id: "stadium",
    name: "Moses Mabhida Stadium",
    city: "Durban",
    modelUrl: "/models/stage/stadium.glb",
    summary: "106-metre Y-shaped coastal arch and cable-stayed bowl on the Golden Mile.",
  },
  {
    id: "bo-kaap",
    name: "Bo-Kaap Terraces",
    city: "Cape Town",
    modelUrl: "/models/stage/bo-kaap.glb",
    summary: "Steep Signal Hill slope lined with 19th-century polychrome Cape Dutch cottages.",
  },
  {
    id: "lighthouse",
    name: "Cape Point Lighthouse",
    city: "Cape Town",
    modelUrl: "/models/stage/lighthouse.glb",
    summary: "High-cliff cast-iron beacon above the meeting currents of Cape Point.",
  },
  {
    id: "cooling-towers",
    name: "Orlando Towers",
    city: "Johannesburg",
    modelUrl: "/models/stage/cooling-towers.glb",
    summary: "Twin Soweto hyperboloid power station stacks transformed into civic murals.",
  },
  {
    id: "bridge",
    name: "Nelson Mandela Bridge",
    city: "Johannesburg",
    modelUrl: "/models/stage/bridge.glb",
    summary: "284-metre asymmetric cable-stayed span bridging Newtown and Braamfontein.",
  },
  {
    id: "hole",
    name: "The Big Hole",
    city: "Kimberley",
    modelUrl: "/models/stage/hole.glb",
    summary: "Terraced open-pit diamond crater and turquoise groundwater basin.",
  },
  {
    id: "ponte",
    name: "Ponte City",
    city: "Johannesburg",
    modelUrl: "/models/stage/ponte.glb",
    summary: "54-storey hollow-core residential cylinder on Berea ridge.",
  },
  {
    id: "fort",
    name: "Constitution Hill & Fort",
    city: "Johannesburg",
    modelUrl: "/models/stage/fort.glb",
    summary: "Rampart citadel walls framing South Africa's Constitutional Court precinct.",
  },
  {
    id: "aquarium",
    name: "uShaka Marine World",
    city: "Durban",
    modelUrl: "/models/stage/aquarium.glb",
    summary: "Cargo-steamer hull pavilion overlooking Indian Ocean reefs.",
  },
];

const TIME_THEMES: Record<
  TimeMode,
  {
    skyColor: number;
    groundColor: number;
    sunColor: number;
    sunIntensity: number;
    rimColor: number;
    rimIntensity: number;
    exposure: number;
    cssSky: string;
    cssSoft: string;
  }
> = {
  day: {
    skyColor: 0xe6efe8,
    groundColor: 0x3b483d,
    sunColor: 0xfff5e4,
    sunIntensity: 3.1,
    rimColor: 0x9fc2a8,
    rimIntensity: 2.4,
    exposure: 1.15,
    cssSky: "#dbe6dc",
    cssSoft: "#b5c9b8",
  },
  golden: {
    skyColor: 0xf4cfb0,
    groundColor: 0x3a2c22,
    sunColor: 0xffb86b,
    sunIntensity: 3.4,
    rimColor: 0xe59934,
    rimIntensity: 3.2,
    exposure: 1.22,
    cssSky: "#eec29a",
    cssSoft: "#d48d4d",
  },
  night: {
    skyColor: 0x161f29,
    groundColor: 0x0b1116,
    sunColor: 0x9bb8d8,
    sunIntensity: 1.35,
    rimColor: 0xe59934,
    rimIntensity: 5.5,
    exposure: 1.05,
    cssSky: "#1a2430",
    cssSoft: "#283546",
  },
};

export default function Pixi3DStage() {
  const hostRef = useRef<HTMLDivElement>(null);
  const crownRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 1.9, z: 0 });
  const orbitRef = useRef<OrbitCamera | null>(null);
  const viewRef = useRef<View3D | null>(null);
  const sunRef = useRef<DirectionalLight | null>(null);
  const rimRef = useRef<PointLight | null>(null);
  const reducedMotion = useReducedMotion() ?? false;

  const [selectedId, setSelectedId] = useState<string>(PIXI_MODELS[0].id);
  const [timeMode, setTimeMode] = useState<TimeMode>("golden");
  const [backend, setBackend] = useState<RenderBackend>("webgl");
  const [autoRotate, setAutoRotate] = useState<boolean>(() => !reducedMotion);
  const [activeRenderer, setActiveRenderer] = useState<string>("Starting");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [statusError, setStatusError] = useState<string>("");
  const [hudPos, setHudPos] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false,
  });

  const entry = useMemo(
    () => PIXI_MODELS.find((item) => item.id === selectedId) ?? PIXI_MODELS[0],
    [selectedId],
  );

  const autoRotateRef = useRef(autoRotate && !reducedMotion);
  useEffect(() => {
    autoRotateRef.current = autoRotate && !reducedMotion;
  }, [autoRotate, reducedMotion]);

  const timeRef = useRef<TimeMode>(timeMode);
  useEffect(() => {
    timeRef.current = timeMode;
    const view = viewRef.current;
    const sun = sunRef.current;
    const rim = rimRef.current;
    const theme = TIME_THEMES[timeMode];
    if (view) {
      view.environment = { skyColor: theme.skyColor, groundColor: theme.groundColor };
      view.exposure = theme.exposure;
    }
    if (sun) {
      sun.color = theme.sunColor;
      sun.intensity = theme.sunIntensity;
    }
    if (rim) {
      rim.color = theme.rimColor;
      rim.intensity = theme.rimIntensity;
    }
  }, [timeMode]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let app: Application | null = null;
    let orbit: OrbitCamera | null = null;
    let modelContainer: Model3D | null = null;

    setDracoDecoderPath({
      jsUrl: "/draco/draco_wasm_wrapper.js",
      wasmUrl: "/draco/draco_decoder.wasm",
    });
    setStatus("loading");
    setStatusError("");
    setActiveRenderer("Starting");

    const initPixiStage = async () => {
      try {
        const instance = new Application();
        const prefOrder: Array<"webgpu" | "webgl"> =
          backend === "auto" ? ["webgpu", "webgl"] : ["webgl"];

        let initialized = false;
        let lastErr: unknown = null;

        for (const preference of prefOrder) {
          try {
            await instance.init({
              preference,
              resizeTo: host,
              antialias: true,
              backgroundAlpha: 0,
              resolution: Math.min(window.devicePixelRatio || 1, 2),
              autoDensity: true,
            });
            initialized = true;
            break;
          } catch (err) {
            lastErr = err;
          }
        }

        if (!initialized) {
          throw lastErr instanceof Error ? lastErr : new Error("PixiJS renderer unavailable");
        }

        if (disposed) {
          instance.destroy(true);
          return;
        }

        app = instance;
        host.replaceChildren(instance.canvas);
        instance.canvas.className = "dioramas-canvas pixi3d-canvas";
        instance.canvas.setAttribute(
          "aria-label",
          `Interactive PixiJS 3D model of ${entry.name} in ${entry.city}`,
        );

        setActiveRenderer(instance.renderer.name === "webgpu" ? "WebGPU" : "WebGL 2");

        const initialTheme = TIME_THEMES[timeRef.current];
        const view = new View3D({
          autoResize: true,
          toneMapping: "aces",
          exposure: initialTheme.exposure,
          shadowQuality: "medium",
          environment: {
            skyColor: initialTheme.skyColor,
            groundColor: initialTheme.groundColor,
          },
        });
        viewRef.current = view;
        instance.stage.addChild(view);

        const sun = new DirectionalLight({
          color: initialTheme.sunColor,
          intensity: initialTheme.sunIntensity,
          castShadow: true,
        });
        sun.rotation.set(-Math.PI / 3.4, Math.PI / 4, 0);
        sunRef.current = sun;
        view.root.addChild(sun);

        const rim = new PointLight({
          color: initialTheme.rimColor,
          intensity: initialTheme.rimIntensity,
          range: 14,
        });
        rim.position.set(-2.6, 2.8, -2.2);
        rimRef.current = rim;
        view.root.addChild(rim);

        // Architectural limestone & amber survey plinth built natively in @pixi/3d
        const plinth = new Mesh3D({
          geometry: new CylinderGeometry({
            radiusTop: 1.72,
            radiusBottom: 1.88,
            height: 0.24,
            radialSegments: 48,
          }),
          material: new Material3D({
            baseColor: 0x26322b,
            roughness: 0.85,
            metallic: 0.08,
          }),
          receiveShadow: true,
          castShadow: false,
        });
        plinth.position.set(0, -0.12, 0);
        view.root.addChild(plinth);

        const surveyRing = new Mesh3D({
          geometry: new TorusGeometry({
            radius: 1.76,
            tube: 0.022,
            radialSegments: 10,
            tubularSegments: 64,
          }),
          material: new Material3D({
            baseColor: 0xe59934,
            emissive: { color: 0xe59934, strength: 0.65 },
            roughness: 0.4,
            metallic: 0.65,
          }),
          castShadow: false,
        });
        surveyRing.rotation.x = Math.PI / 2;
        surveyRing.position.set(0, 0.01, 0);
        view.root.addChild(surveyRing);

        // Load real GLB asset via Pixi Assets + @pixi/3d Model3D
        const source = await Assets.load<Scene3DSource>(entry.modelUrl);
        if (disposed) return;

        modelContainer = new Model3D({
          source,
          autoPlay: true,
          castShadow: true,
          receiveShadow: true,
        });
        view.root.addChild(modelContainer);

        const bounds = modelContainer.getLocalBounds();
        const size = bounds.getSize();
        const center = bounds.getCenter();
        const maxSpan = Math.max(size.x, size.y, size.z, 0.001);
        const targetSpan = 2.4;
        const scale = targetSpan / maxSpan;

        modelContainer.scale.set(scale, scale, scale);
        modelContainer.position.set(
          -center.x * scale,
          -bounds.min.y * scale + 0.01,
          -center.z * scale,
        );

        const modelTopY = (bounds.max.y - bounds.min.y) * scale + 0.35;
        crownRef.current = { x: 0, y: modelTopY, z: 0 };

        view.camera.position.set(3.2, 2.25, 3.6);
        orbit = new OrbitCamera({
          view,
          target: { x: 0, y: Math.min(modelTopY * 0.45, 0.9), z: 0 },
          enableDamping: true,
          dampingFactor: 0.08,
          minDistance: 2.1,
          maxDistance: 10,
          minPolarAngle: 0.2,
          maxPolarAngle: Math.PI * 0.48,
          touches: { one: "rotate", two: "zoom-pan" },
        });
        orbitRef.current = orbit;

        instance.ticker.add((ticker) => {
          if (disposed) return;
          if (autoRotateRef.current && modelContainer) {
            modelContainer.rotation.y += (ticker.deltaMS / 1000) * 0.28;
          }
          const screen = view.worldToScreen(crownRef.current);
          if (screen && Number.isFinite(screen.x) && Number.isFinite(screen.y)) {
            setHudPos({ x: screen.x, y: screen.y, visible: true });
          }
        });

        setStatus("ready");
      } catch (err) {
        if (disposed) return;
        setStatus("error");
        setStatusError(
          err instanceof Error ? err.message : "Could not initialize PixiJS 3D stage.",
        );
      }
    };

    initPixiStage();

    return () => {
      disposed = true;
      orbitRef.current = null;
      viewRef.current = null;
      sunRef.current = null;
      rimRef.current = null;
      try {
        orbit?.destroy();
      } catch {
        // Ignored during teardown
      }
      try {
        app?.destroy(true);
      } catch {
        // Ignored during teardown
      }
    };
  }, [entry.modelUrl, entry.name, entry.city, backend]);

  const resetCamera = useCallback(() => {
    benchoAudio.playWhoosh();
    orbitRef.current?.reset();
  }, []);

  const themeVars = TIME_THEMES[timeMode];
  const stageStyle = {
    "--scene-accent": "#e59934",
    "--scene-soft": themeVars.cssSoft,
    "--scene-sky": themeVars.cssSky,
  } as CSSProperties;

  return (
    <div className="dioramas-grid pixi3d-grid">
      <div className="dioramas-main">
        <div
          className="dioramas-tabs"
          role="tablist"
          aria-label="Choose a PixiJS 3D landmark model"
        >
          {PIXI_MODELS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={item.id === entry.id}
              className={`dioramas-tab${item.id === entry.id ? " is-active" : ""}`}
              onClick={() => {
                benchoAudio.playTap(740);
                setSelectedId(item.id);
              }}
            >
              <span className="dioramas-tab-name">{item.name}</span>
              <span className="dioramas-tab-province">{item.city}</span>
            </button>
          ))}
        </div>

        <div className="dioramas-stage pixi3d-stage" style={stageStyle} data-time={timeMode}>
          <div ref={hostRef} className="pixi3d-canvas-host" />

          {hudPos.visible && status === "ready" && (
            <div
              className="pixi3d-projected-pin"
              style={{
                transform: `translate(${Math.round(hudPos.x)}px, ${Math.round(hudPos.y)}px) translate(-50%, -100%)`,
              }}
              aria-hidden="true"
            >
              <MapPin size={13} weight="fill" />
              <span>{entry.name}</span>
            </div>
          )}

          <div className="dioramas-stage-top">
            <div className="dioramas-stage-title">
              <span>{entry.city} · @pixi/3d</span>
              <strong>{entry.name}</strong>
            </div>
            <span className={`dioramas-badge${status === "ready" ? " is-live" : ""}`}>
              <span className="dioramas-dot" aria-hidden="true" />
              {status === "ready" ? `PixiJS ${activeRenderer}` : activeRenderer}
            </span>
          </div>

          <p className="dioramas-hint">
            Drag to orbit · Pinch or scroll to zoom · glTF + Draco PBR pipeline
          </p>

          {status === "error" && (
            <div className="dioramas-status is-error" role="alert">
              <Info size={20} aria-hidden="true" />
              <span>{statusError}</span>
            </div>
          )}
        </div>

        <div className="dioramas-controls">
          <div className="dioramas-segment" role="group" aria-label="Lighting atmosphere">
            {(
              [
                { mode: "day", label: "Day", Icon: Sun },
                { mode: "golden", label: "Golden", Icon: SunHorizon },
                { mode: "night", label: "Night", Icon: MoonStars },
              ] as const
            ).map(({ mode, label, Icon }) => (
              <button
                key={mode}
                type="button"
                className={`dioramas-control${timeMode === mode ? " is-active" : ""}`}
                aria-pressed={timeMode === mode}
                aria-label={label}
                title={label}
                onClick={() => setTimeMode(mode)}
              >
                <Icon size={18} aria-hidden="true" />
              </button>
            ))}
          </div>

          <div className="dioramas-toggles" role="group" aria-label="Stage camera">
            <button
              type="button"
              className={`dioramas-control${autoRotate && !reducedMotion ? " is-active" : ""}`}
              aria-pressed={autoRotate && !reducedMotion}
              disabled={reducedMotion}
              aria-label="Auto-rotate PixiJS model"
              title="Auto-rotate"
              onClick={() => setAutoRotate((v) => !v)}
            >
              <ArrowsClockwise size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="dioramas-control"
              aria-label="Reset PixiJS camera"
              title="Reset camera"
              onClick={resetCamera}
            >
              <ArrowCounterClockwise size={18} aria-hidden="true" />
            </button>
          </div>

          <div
            className="dioramas-segment dioramas-renderer-segment"
            role="group"
            aria-label="PixiJS graphics backend"
          >
            <span className="dioramas-segment-label" aria-hidden="true">
              Renderer
            </span>
            {(
              [
                { value: "auto", label: "WebGPU", short: "GPU" },
                { value: "webgl", label: "WebGL 2", short: "GL2" },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                className={`dioramas-control${backend === option.value ? " is-active" : ""}`}
                aria-pressed={backend === option.value}
                aria-label={`PixiJS ${option.label}`}
                onClick={() => setBackend(option.value)}
              >
                <span className="dioramas-backend-full">{option.label}</span>
                <span className="dioramas-backend-short" aria-hidden="true">
                  {option.short}
                </span>
              </button>
            ))}
          </div>
        </div>

        <p className="dioramas-caption">{entry.summary}</p>
      </div>

      <aside className="dioramas-side" aria-label="PixiJS 3D asset details">
        <div className="dioramas-panel dioramas-info">
          <p className="dioramas-info-kicker">
            <Cube size={14} aria-hidden="true" /> PixiJS 3D Open Beta
          </p>
          <h2>{entry.name}</h2>
          <p>{entry.summary}</p>
          <p className="dioramas-fact">{entry.city} · ACES Filmic · Local Draco Decoder</p>
        </div>
      </aside>
    </div>
  );
}
