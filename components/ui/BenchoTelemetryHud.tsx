"use client";

/**
 * Bencho Telemetry HUD
 * Sleek 3D stage telemetry & visualizer capsule inspired by Bencho (bencho.dev) by Lorenzo Cabra.
 * Displays real-time camera azimuth, scale metrics, and live visualizer waveforms.
 */

import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Compass, Waves, Eye, EyeSlash } from "@phosphor-icons/react";
import { benchoAudio } from "../../lib/bencho-audio";

interface BenchoTelemetryHudProps {
  landmarkName: string;
  cityName: string;
  azimuthDeg?: number;
  scalePercent?: number;
  cameraMode?: string;
  pinType?: string;
  className?: string;
}

export function BenchoTelemetryHud({
  landmarkName,
  cityName,
  azimuthDeg = 45,
  scalePercent = 100,
  cameraMode = "Overview",
  pinType = "venue pin",
  className = "",
}: BenchoTelemetryHudProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [waveSeed, setWaveSeed] = useState(0);
  const reduced = useReducedMotion();

  // Subtle live fluctuation for the waveform bars
  useEffect(() => {
    if (reduced) return;
    const interval = setInterval(() => {
      setWaveSeed((s) => (s + 1) % 100);
    }, 400);
    return () => clearInterval(interval);
  }, [reduced]);

  const toggleExpand = () => {
    benchoAudio.playClick(620);
    setIsExpanded((v) => !v);
  };

  return (
    <motion.aside
      className={`bencho-telemetry-hud ${isExpanded ? "is-expanded" : "is-compact"} ${className}`}
      aria-label="3D stage telemetry"
      layout
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
    >
      <div className="bencho-hud-header">
        <div className="bencho-hud-title-group">
          <span className="bencho-hud-dot" aria-hidden="true" />
          <span className="bencho-hud-label">STAGE TELEMETRY</span>
        </div>
        <button
          type="button"
          onClick={toggleExpand}
          className="bencho-hud-toggle-btn"
          aria-label={isExpanded ? "Collapse telemetry" : "Expand telemetry"}
        >
          {isExpanded ? <EyeSlash size={14} /> : <Eye size={14} />}
        </button>
      </div>

      {isExpanded && (
        <motion.div
          className="bencho-hud-body"
          initial={reduced ? undefined : { opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={reduced ? undefined : { opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="bencho-hud-landmark-row">
            <span className="bencho-hud-landmark-name">{landmarkName}</span>
            <span className="bencho-hud-city-name">{cityName}</span>
          </div>

          <div className="bencho-hud-metrics-grid">
            <div className="bencho-hud-metric-cell">
              <span className="bencho-metric-title">
                <Compass size={12} /> AZIMUTH
              </span>
              <span className="bencho-metric-value">{Math.round(azimuthDeg)}°</span>
            </div>

            <div className="bencho-hud-metric-cell">
              <span className="bencho-metric-title">SCALE</span>
              <span className="bencho-metric-value">{scalePercent}%</span>
            </div>

            <div className="bencho-hud-metric-cell">
              <span className="bencho-metric-title">CAMERA</span>
              <span className="bencho-metric-value">{cameraMode}</span>
            </div>

            <div className="bencho-hud-metric-cell">
              <span className="bencho-metric-title">ACCURACY</span>
              <span className="bencho-metric-value">{pinType}</span>
            </div>
          </div>

          {/* Live Waveform Visualizer Bars (Bencho Biometric / Audio capsule style) */}
          <div className="bencho-hud-waveform-row" aria-hidden="true">
            <Waves size={13} className="bencho-waveform-icon" />
            <div className="bencho-waveform-bars">
              {[0.4, 0.7, 0.9, 0.6, 0.85, 0.5, 0.95, 0.65, 0.45, 0.8, 0.55, 0.75].map(
                (baseHeight, i) => {
                  const dynamicHeight = reduced
                    ? baseHeight * 16
                    : Math.max(
                        3,
                        Math.min(20, (baseHeight + Math.sin(waveSeed + i * 0.8) * 0.3) * 18),
                      );

                  return (
                    <motion.span
                      key={i}
                      className="bencho-waveform-bar"
                      animate={{ height: dynamicHeight }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                    />
                  );
                },
              )}
            </div>
            <span className="bencho-waveform-status">LIVE SYNC</span>
          </div>
        </motion.div>
      )}
    </motion.aside>
  );
}

export default BenchoTelemetryHud;
