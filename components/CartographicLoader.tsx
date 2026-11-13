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
          <span className="carto-loader-ring carto-loader-ring-outer" />
          <span className="carto-loader-ring carto-loader-ring-inner" />
          <span className="carto-loader-compass">
            <Compass size={26} weight="duotone" />
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
