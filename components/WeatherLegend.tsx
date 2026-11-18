"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AnimatePresence,
  motion,
  useDragControls,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { Info, Question, X } from "@phosphor-icons/react";
import { benchoAudio } from "../lib/bencho-audio";
import { placeWeatherIcons, placeWeatherLegend } from "./PlaceWeatherBadge";

/**
 * A compact, self-contained legend for the live weather glyphs shown on Place
 * cards in the 3D stages. The trigger sits beside a PlaceWeatherBadge; the
 * dialog is portalled to the body so it always paints above the WebGL stage.
 */
export default function WeatherLegend() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const reducedMotion = useReducedMotion();
  const dragControls = useDragControls();
  const dragY = useMotionValue(0);
  const backdropOpacity = useTransform(dragY, [0, 260], [1, 0]);

  useEffect(() => {
    const host = document.createElement("div");
    host.className = "weather-legend-portal";
    document.body.appendChild(host);
    hostRef.current = host;
    setMounted(true);
    return () => {
      host.remove();
      hostRef.current = null;
    };
  }, []);

  const openDialog = () => {
    benchoAudio.playModalOpen();
    setOpen(true);
  };

  const closeDialog = useCallback(() => {
    benchoAudio.playModalClose();
    setOpen(false);
  }, []);

  // Focus trap, initial focus, focus restore, inert background and scroll lock.
  useEffect(() => {
    if (!open) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    dragY.set(0);

    const host = hostRef.current;
    const inertTargets: HTMLElement[] = [];
    if (host) {
      for (const child of Array.from(document.body.children)) {
        if (child === host || !(child instanceof HTMLElement)) continue;
        if (["SCRIPT", "STYLE", "LINK"].includes(child.tagName)) continue;
        child.setAttribute("inert", "");
        inertTargets.push(child);
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 30);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDialog();
        return;
      }
      if (event.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null || el.offsetWidth > 0 || el.offsetHeight > 0);

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey) {
        if (document.activeElement === first || !dialog.contains(document.activeElement)) {
          event.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last || !dialog.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKeyDown);
      inertTargets.forEach((el) => el.removeAttribute("inert"));
      document.body.style.overflow = previousOverflow;
      const previous = previouslyFocusedRef.current;
      if (previous && typeof previous.focus === "function") previous.focus();
    };
  }, [open, closeDialog, dragY]);

  return (
    <>
      <button
        type="button"
        className="weather-legend-trigger"
        onClick={openDialog}
        aria-label="What do the weather icons mean?"
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Weather icon legend"
      >
        <Question size={13} weight="bold" aria-hidden="true" />
      </button>

      {mounted && hostRef.current
        ? createPortal(
            <AnimatePresence>
              {open && (
                <motion.div
                  className="weather-legend-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reducedMotion ? 0 : 0.16, ease: [0.22, 1, 0.36, 1] }}
                  style={reducedMotion ? undefined : { opacity: backdropOpacity }}
                  onClick={closeDialog}
                  role="presentation"
                >
                  <motion.div
                    ref={dialogRef}
                    className="weather-legend-sheet"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="weather-legend-title"
                    aria-describedby="weather-legend-intro"
                    onClick={(event) => event.stopPropagation()}
                    drag={reducedMotion ? false : "y"}
                    dragControls={dragControls}
                    dragListener={false}
                    dragConstraints={{ top: 0 }}
                    dragElastic={0.2}
                    style={reducedMotion ? undefined : { y: dragY }}
                    onDragEnd={(_event, info) => {
                      if (info.offset.y > 100 || info.velocity.y > 500) closeDialog();
                    }}
                    initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.97 }}
                    animate={
                      reducedMotion
                        ? { opacity: 1 }
                        : {
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
                          }
                    }
                    exit={
                      reducedMotion
                        ? { opacity: 0 }
                        : {
                            opacity: 0,
                            y: 12,
                            scale: 0.98,
                            transition: { duration: 0.14, ease: [0.22, 1, 0.36, 1] },
                          }
                    }
                  >
                    <div
                      className="weather-legend-grip"
                      onPointerDown={(event) => dragControls.start(event)}
                      aria-hidden="true"
                    >
                      <span />
                    </div>

                    <header
                      className="weather-legend-header"
                      onPointerDown={(event) => {
                        if ((event.target as HTMLElement).closest("button")) return;
                        dragControls.start(event);
                      }}
                    >
                      <span className="weather-legend-heading-icon" aria-hidden="true">
                        <Info size={18} weight="fill" />
                      </span>
                      <div className="weather-legend-heading">
                        <h2 id="weather-legend-title">Weather legend</h2>
                        <p id="weather-legend-intro">What the icons on place cards mean.</p>
                      </div>
                      <button
                        ref={closeRef}
                        type="button"
                        className="weather-legend-close"
                        onClick={closeDialog}
                        aria-label="Close weather legend"
                      >
                        <X size={18} weight="bold" aria-hidden="true" />
                      </button>
                    </header>

                    <ul className="weather-legend-list">
                      {placeWeatherLegend.map(({ condition, label, description }) => {
                        const Icon = placeWeatherIcons[condition];
                        return (
                          <li key={condition} className="weather-legend-item">
                            <span
                              className={`place-weather-badge weather-legend-glyph is-${condition}`}
                              aria-hidden="true"
                            >
                              <Icon size={13} weight="fill" className="place-weather-glyph" />
                            </span>
                            <span className="weather-legend-copy">
                              <strong>{label}</strong>
                              <span>{description}</span>
                            </span>
                          </li>
                        );
                      })}
                    </ul>

                    <p className="weather-legend-footnote">
                      Badges use the live forecast for each place. If a forecast is unavailable
                      offline, the badge stays hidden rather than guessing.
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>,
            hostRef.current,
          )
        : null}
    </>
  );
}
