"use client";

/**
 * Bencho Comparison Slider
 * Interactive dual-layer comparison slider based on Bencho (bencho.dev) by Lorenzo Cabra.
 * Features:
 * - Fluid drag handle with spring physics
 * - Clip-path interpolation for seamless before/after reveal
 * - Keyboard accessible arrow-key scrubbing
 * - Synthesized tactile clicks on movement
 */

import { useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { benchoAudio } from "../../lib/bencho-audio";

interface BenchoComparisonSliderProps {
  beforeLayer: ReactNode;
  afterLayer: ReactNode;
  beforeLabel?: string;
  afterLabel?: string;
  initialPosition?: number; // 0 to 100%
  className?: string;
}

export function BenchoComparisonSlider({
  beforeLayer,
  afterLayer,
  beforeLabel = "Day",
  afterLabel = "Night",
  initialPosition = 50,
  className = "",
}: BenchoComparisonSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPos, setSliderPos] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const reduced = useReducedMotion();

  const updatePosition = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percentage);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    benchoAudio.playClick(600);
    updatePosition(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    updatePosition(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
    benchoAudio.playClick(500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setSliderPos((p) => Math.max(0, p - 5));
      benchoAudio.playClick(540);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setSliderPos((p) => Math.min(100, p + 5));
      benchoAudio.playClick(660);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`bencho-comparison-slider-root ${className}`}
      style={{ touchAction: "pan-y" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      tabIndex={0}
      role="slider"
      aria-label="Layer comparison"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(sliderPos)}
      onKeyDown={handleKeyDown}
    >
      {/* Background layer (After / Night) */}
      <div className="bencho-comparison-layer bencho-after-layer">
        {afterLayer}
        {afterLabel && <span className="bencho-layer-label bencho-after-label">{afterLabel}</span>}
      </div>

      {/* Foreground layer (Before / Day) clipped by slider position */}
      <div
        className="bencho-comparison-layer bencho-before-layer"
        style={{
          clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)`,
        }}
      >
        {beforeLayer}
        {beforeLabel && (
          <span className="bencho-layer-label bencho-before-label">{beforeLabel}</span>
        )}
      </div>

      {/* Divider handle */}
      <motion.div
        className="bencho-comparison-divider"
        style={{ left: `${sliderPos}%` }}
        animate={{ scale: isDragging ? 1.05 : 1 }}
        transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 25 }}
      >
        <div className="bencho-divider-line" />
        <div className="bencho-divider-knob">
          <CaretLeft size={12} weight="bold" />
          <CaretRight size={12} weight="bold" />
        </div>
        <div className="bencho-divider-line" />
      </motion.div>
    </div>
  );
}

export default BenchoComparisonSlider;
