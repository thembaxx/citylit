"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowCounterClockwise,
  Check,
  Compass,
  Globe,
  Moon,
  SpeakerHigh,
  Sparkle,
  Sun,
  Waveform,
  X,
} from "@phosphor-icons/react";
import useTheme from "./useTheme";
import { useDiscovery } from "./useDiscovery";
import { cities } from "../lib/data";
import LiquidToggle from "./ui/LiquidToggle";
import { benchoAudio } from "../lib/bencho-audio";

export type SettingsTab = "appearance" | "map" | "about";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: SettingsTab;
}

export default function SettingsModal({
  isOpen,
  onClose,
  initialTab = "appearance",
}: SettingsModalProps) {
  const { theme, night, setTheme } = useTheme();
  const { state: discovery, update: updateDiscovery } = useDiscovery();
  const reducedMotion = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [audioFeedback, setAudioFeedback] = useState(() => benchoAudio.isEnabled());
  const [ambientAudio, setAmbientAudio] = useState(() => benchoAudio.isAmbientEnabled());

  const toggleAudioFeedback = () => {
    const next = !audioFeedback;
    setAudioFeedback(next);
    benchoAudio.setEnabled(next);
    if (next) benchoAudio.playTap(900);
  };

  const toggleAmbientAudio = () => {
    const next = !ambientAudio;
    setAmbientAudio(next);
    benchoAudio.setAmbientEnabled(next);
    if (next) benchoAudio.playLiquidToggle(true);
  };

  useEffect(() => {
    if (isOpen) setActiveTab(initialTab);
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Trap body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const toggleSurroundings = () => {
    updateDiscovery((prev) => ({
      essential: !prev.essential,
    }));
  };

  const toggleReducedMotion = () => {
    // In our app, essential mode also suppresses animations
    updateDiscovery((prev) => ({
      essential: !prev.essential,
    }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="citylit-settings-backdrop" onClick={onClose} role="presentation">
          <motion.div
            ref={dialogRef}
            className="citylit-settings-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-sheet-title"
            onClick={(e) => e.stopPropagation()}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.96 }}
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Modal Header */}
            <div className="citylit-settings-header">
              <h2 id="settings-sheet-title">Settings</h2>
              <button
                type="button"
                className="citylit-settings-close citylit-settings-close-btn"
                onClick={onClose}
                aria-label="Close settings"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            {/* Segmented Tabs */}
            <div className="citylit-settings-tabs" role="tablist" aria-label="Settings categories">
              <button
                type="button"
                role="tab"
                id="settings-tab-appearance"
                aria-selected={activeTab === "appearance"}
                aria-controls="settings-panel-appearance"
                className={`citylit-settings-tab ${activeTab === "appearance" ? "is-active" : ""}`}
                onClick={() => setActiveTab("appearance")}
              >
                Appearance
              </button>
              <button
                type="button"
                role="tab"
                id="settings-tab-map"
                aria-selected={activeTab === "map"}
                aria-controls="settings-panel-map"
                className={`citylit-settings-tab ${activeTab === "map" ? "is-active" : ""}`}
                onClick={() => setActiveTab("map")}
              >
                Map
              </button>
              <button
                type="button"
                role="tab"
                id="settings-tab-about"
                aria-selected={activeTab === "about"}
                aria-controls="settings-panel-about"
                className={`citylit-settings-tab ${activeTab === "about" ? "is-active" : ""}`}
                onClick={() => setActiveTab("about")}
              >
                About
              </button>
            </div>

            {/* Tab Panel: Appearance */}
            <div className="citylit-settings-content">
              {activeTab === "appearance" && (
                <div
                  className="citylit-settings-section"
                  id="settings-panel-appearance"
                  role="tabpanel"
                  aria-labelledby="settings-tab-appearance"
                >
                  <span className="citylit-settings-subhead">Theme</span>
                  <div className="citylit-theme-grid">
                    {/* Dark */}
                    <button
                      type="button"
                      className={`citylit-theme-card ${night ? "is-selected" : ""}`}
                      onClick={() => setTheme("dark")}
                      aria-pressed={night}
                    >
                      <Moon size={22} weight={night ? "fill" : "regular"} />
                      <span>Dark</span>
                      {night && (
                        <div className="citylit-card-check">
                          <Check size={12} weight="bold" />
                        </div>
                      )}
                    </button>

                    {/* System */}
                    <button
                      type="button"
                      className={`citylit-theme-card ${theme === "system" ? "is-selected" : ""}`}
                      onClick={() => setTheme("system")}
                      aria-pressed={theme === "system"}
                    >
                      <Sparkle size={22} weight={theme === "system" ? "fill" : "regular"} />
                      <span>System</span>
                      {theme === "system" && (
                        <div className="citylit-card-check">
                          <Check size={12} weight="bold" />
                        </div>
                      )}
                    </button>

                    {/* Light */}
                    <button
                      type="button"
                      className={`citylit-theme-card ${!night ? "is-selected" : ""}`}
                      onClick={() => setTheme("light")}
                      aria-pressed={!night}
                    >
                      <Sun size={22} weight={!night ? "fill" : "regular"} />
                      <span>Light</span>
                      {!night && (
                        <div className="citylit-card-check">
                          <Check size={12} weight="bold" />
                        </div>
                      )}
                    </button>
                  </div>

                  {/* Toggles */}
                  <div className="citylit-setting-rows">
                    <div className="citylit-setting-row">
                      <div className="citylit-setting-label">
                        <SpeakerHigh size={19} className="citylit-setting-icon" />
                        <span>Tactile UI sound</span>
                      </div>
                      <LiquidToggle
                        checked={audioFeedback}
                        onChange={toggleAudioFeedback}
                        ariaLabel="Toggle tactile UI sound"
                      />
                    </div>

                    <div className="citylit-setting-row">
                      <div className="citylit-setting-label">
                        <Waveform size={19} className="citylit-setting-icon" />
                        <span>Ambient soundscapes</span>
                      </div>
                      <LiquidToggle
                        checked={ambientAudio}
                        onChange={toggleAmbientAudio}
                        ariaLabel="Toggle ambient soundscapes"
                      />
                    </div>

                    <div className="citylit-setting-row">
                      <div className="citylit-setting-label">
                        <Sun size={19} className="citylit-setting-icon" />
                        <span>Show surroundings</span>
                      </div>
                      <LiquidToggle
                        checked={!discovery.essential}
                        onChange={toggleSurroundings}
                        ariaLabel="Toggle surroundings"
                      />
                    </div>

                    <div className="citylit-setting-row">
                      <div className="citylit-setting-label">
                        <ArrowCounterClockwise size={19} className="citylit-setting-icon" />
                        <span>Reduce motion</span>
                      </div>
                      <LiquidToggle
                        checked={discovery.essential}
                        onChange={toggleReducedMotion}
                        ariaLabel="Toggle reduced motion"
                      />
                    </div>

                    <div className="citylit-setting-row citylit-setting-select">
                      <div className="citylit-setting-label">
                        <Globe size={19} className="citylit-setting-icon" />
                        <span>Language</span>
                      </div>
                      <span className="citylit-setting-value">English &rsaquo;</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "map" && (
                <div
                  className="citylit-settings-section"
                  id="settings-panel-map"
                  role="tabpanel"
                  aria-labelledby="settings-tab-map"
                >
                  <span className="citylit-settings-subhead">Living Atlas coverage</span>
                  <p className="citylit-settings-desc">
                    12 South African cities mapped in 3D geometry with interactive landmarks, venue
                    stories and daylight simulation.
                  </p>
                  <div className="citylit-map-cities-list">
                    {cities.map((c) => (
                      <div key={c.slug} className="citylit-map-city-item">
                        <Compass size={16} />
                        <strong>{c.name}</strong>
                        <span>{c.province}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "about" && (
                <div
                  className="citylit-settings-section"
                  id="settings-panel-about"
                  role="tabpanel"
                  aria-labelledby="settings-tab-about"
                >
                  <span className="citylit-settings-subhead">About Citylit</span>
                  <div className="citylit-about-card">
                    <p>
                      <strong>Citylit</strong> is a mobile-first 3D discovery atlas for South
                      African cities. Explore real researched landmarks, culture, architecture, and
                      build your perfect day.
                    </p>
                    <div className="citylit-about-meta">
                      <span>Version 1.0.0</span>
                      <span>12 Cities · 9 Provinces</span>
                    </div>
                  </div>

                  <span className="citylit-settings-subhead" style={{ marginTop: 20 }}>
                    Controls &amp; navigation
                  </span>
                  <div className="citylit-about-card citylit-shortcuts-card">
                    <ul className="citylit-shortcuts-list">
                      <li>
                        <kbd>?</kbd> / <kbd>/</kbd> <span>Open settings &amp; controls</span>
                      </li>
                      <li>
                        <kbd>Esc</kbd> <span>Close dialogs &amp; clear overlays</span>
                      </li>
                      <li>
                        <kbd>Drag / Swipe</kbd> <span>Rotate 3D stage miniature</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
