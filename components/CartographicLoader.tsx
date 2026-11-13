"use client";

import { useEffect, useState } from "react";
import { Compass } from "@phosphor-icons/react";

const PHASES = [
  "Projecting coordinates",
  "Extruding terrain & boundaries",
  "Texturing stone & strata",
  "Calibrating light",
];

export default function CartographicLoader({
  title,
  subtitle,
  coordinates,
  variant = "atlas",
}: {
  title: string;
  subtitle?: string;
  coordinates?: string;
  variant?: "atlas" | "globe";
}) {
  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPhaseIndex((prev) => (prev < PHASES.length - 1 ? prev + 1 : prev));
    }, 380);
    return () => window.clearInterval(timer);
  }, []);

  const progress = ((phaseIndex + 1) / PHASES.length) * 100;

  return (
    <div
      className={`carto-loader${variant === "globe" ? " is-globe" : ""}`}
      role="status"
      aria-live="polite"
      aria-label={`Loading ${title}`}
    >
      <div className="carto-loader-grid" aria-hidden="true" />
      <div className="carto-loader-card">
        <div className="carto-loader-blueprint" aria-hidden="true">
          <svg viewBox="0 0 180 180" className="carto-loader-svg">
            <circle cx="90" cy="90" r="76" className="carto-ring carto-ring-outer" />
            <circle cx="90" cy="90" r="56" className="carto-ring carto-ring-mid" />
            <circle cx="90" cy="90" r="34" className="carto-ring carto-ring-inner" />
            <path
              d="M34 96 C46 64, 72 48, 102 52 C126 56, 144 74, 140 100 C136 122, 114 138, 86 136 C60 134, 42 118, 34 96 Z"
              className="carto-contour"
            />
            <path
              d="M54 94 C64 74, 84 68, 104 72 C120 76, 126 92, 118 108 C110 122, 86 124, 68 116 C58 112, 50 102, 54 94 Z"
              className="carto-contour carto-contour-inner"
            />
            <line x1="90" y1="8" x2="90" y2="172" className="carto-crosshair" />
            <line x1="8" y1="90" x2="172" y2="90" className="carto-crosshair" />
          </svg>
          <span className="carto-loader-compass">
            <Compass size={18} weight="regular" />
          </span>
        </div>

        <div className="carto-loader-meta">
          {coordinates ? <span className="carto-loader-coords">{coordinates}</span> : null}
          <strong className="carto-loader-title">{title}</strong>
          {subtitle ? <span className="carto-loader-subtitle">{subtitle}</span> : null}
        </div>

        <div className="carto-loader-progress" aria-hidden="true">
          <span className="carto-loader-bar" style={{ width: `${progress}%` }} />
        </div>
        <span className="carto-loader-phase">{PHASES[phaseIndex]}…</span>
      </div>
    </div>
  );
}
