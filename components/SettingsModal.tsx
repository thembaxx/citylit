"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useDragControls,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
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
import { handleRovingKeyDown } from "../lib/ui-primitives";

const SETTINGS_TABS: ReadonlyArray<readonly [SettingsTab, string]> = [
  ["appearance", "Appearance"],
  ["map", "Map"],
  ["about", "About"],
];

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
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const dragControls = useDragControls();
  const dragY = useMotionValue(0);
  const backdropOpacity = useTransform(dragY, [0, 260], [1, 0]);

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
    if (isOpen) {
      setActiveTab(initialTab);
      setAudioFeedback(benchoAudio.isEnabled());
      setAmbientAudio(benchoAudio.isAmbientEnabled());
      benchoAudio.playModalOpen();
    }
  }, [isOpen, initialTab]);

  // Accessible focus trap, initial focus, focus restore, and background inert
  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    // Mark background siblings inert
    const guideShell = dialogRef.current?.closest(".discovery-guide");
    const backgroundSiblings: HTMLElement[] = [];
    if (guideShell) {
      Array.from(guideShell.children).forEach((child) => {
        if (child !== dialogRef.current?.parentElement && child instanceof HTMLElement) {
          child.setAttribute("inert", "");
          backgroundSiblings.push(child);
        }
      });
    }

    // Set initial focus inside dialog
    const focusTimer = setTimeout(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        dialog.focus();
      }
    }, 30);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "Tab") {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const focusable = Array.from(
          dialog.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((el) => el.offsetParent !== null || el.offsetWidth > 0 || el.offsetHeight > 0);

        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first || !dialog.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !dialog.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKeyDown);
      backgroundSiblings.forEach((el) => el.removeAttribute("inert"));
      if (
        previouslyFocusedRef.current &&
        typeof previouslyFocusedRef.current.focus === "function"
      ) {
        previouslyFocusedRef.current.focus();
      }
    };
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

  const handleClose = () => {
    benchoAudio.playModalClose();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="citylit-settings-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
          style={reducedMotion ? undefined : { opacity: backdropOpacity }}
          onClick={handleClose}
          role="presentation"
        >
          <motion.div
            ref={dialogRef}
            className="citylit-settings-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-sheet-title"
            onClick={(e) => e.stopPropagation()}
            drag={reducedMotion ? false : "y"}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            style={reducedMotion ? undefined : { y: dragY }}
            onDragEnd={(_e, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                handleClose();
              }
            }}
            initial={
              reducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 24, scale: 0.96, filter: "blur(2px)" }
            }
            animate={
              reducedMotion
                ? { opacity: 1 }
                : {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    filter: "blur(0px)",
                    transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
                  }
            }
            exit={
              reducedMotion
                ? { opacity: 0 }
                : {
                    opacity: 0,
                    y: 16,
                    scale: 0.97,
                    transition: { duration: 0.15, ease: [0.22, 1, 0.36, 1] },
                  }
            }
          >
            {/* Mobile Sheet Drag Handle */}
            <div
              className="citylit-sheet-handle-wrap"
              onPointerDown={(e) => dragControls.start(e)}
              aria-hidden="true"
            >
              <span className="citylit-sheet-handle" />
            </div>

            {/* Modal Header */}
            <div
              className="citylit-settings-header"
              onPointerDown={(e) => {
                if ((e.target as HTMLElement).closest("button")) return;
                dragControls.start(e);
              }}
            >
              <h2 id="settings-sheet-title">Settings</h2>
              <button
                type="button"
                className="citylit-settings-close citylit-settings-close-btn"
                onClick={handleClose}
                aria-label="Close settings"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            {/* Segmented Tabs */}
            <div className="citylit-settings-tabs" role="tablist" aria-label="Settings categories">
              {SETTINGS_TABS.map(([tabKey, tabLabel], idx) => {
                const isActive = activeTab === tabKey;
                return (
                  <button
                    key={tabKey}
                    ref={(el) => {
                      tabRefs.current[idx] = el;
                    }}
                    type="button"
                    role="tab"
                    id={`settings-tab-${tabKey}`}
                    aria-selected={isActive}
                    aria-controls={`settings-panel-${tabKey}`}
                    data-state={isActive ? "active" : "inactive"}
                    tabIndex={isActive ? 0 : -1}
                    className={`citylit-settings-tab ${isActive ? "is-active" : ""}`}
                    onKeyDown={(e) =>
                      handleRovingKeyDown(e, idx, SETTINGS_TABS.length, tabRefs, (nextIdx) =>
                        setActiveTab(SETTINGS_TABS[nextIdx][0]),
                      )
                    }
                    onClick={() => setActiveTab(tabKey)}
                  >
                    <span>{tabLabel}</span>
                    {isActive && (
                      <motion.div
                        layoutId="settings-tab-indicator"
                        className="citylit-settings-tab-pill"
                        transition={{ type: "spring", stiffness: 360, damping: 28 }}
                      />
                    )}
                  </button>
                );
              })}
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
                      aria-label="Dark theme"
                      title="Dark theme"
                    >
                      <Moon size={22} weight={night ? "fill" : "regular"} />
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
                      aria-label="System theme"
                      title="System theme"
                    >
                      <Sparkle size={22} weight={theme === "system" ? "fill" : "regular"} />
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
                      aria-label="Light theme"
                      title="Light theme"
                    >
                      <Sun size={22} weight={!night ? "fill" : "regular"} />
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
