"use client";

import { useRef, useState, useCallback, type PointerEvent, type KeyboardEvent } from "react";
import { motion, useReducedMotion } from "motion/react";

interface ThermalDialProps {
  value: number; // e.g., temperature in degrees Celsius (10 - 40)
  min?: number;
  max?: number;
  onChange?: (val: number) => void;
  label?: string;
  unit?: string;
  className?: string;
}

/**
 * Hardware-inspired Thermal Dial adapted from Pin UI (pinui.xyz).
 * Features 96 radial ticks, circular pointer drag with inertia, dynamic temperature heat wash,
 * and keyboard arrow stepper controls.
 */
export function ThermalDial({
  value,
  min = 10,
  max = 40,
  onChange,
  label = "Atmosphere",
  unit = "°C",
  className = "",
}: ThermalDialProps) {
  const dialRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const reducedMotion = useReducedMotion();

  const totalTicks = 64;
  const clampedValue = Math.min(Math.max(value, min), max);
  const progress = (clampedValue - min) / (max - min); // 0 to 1
  const angle = progress * 270 - 135; // -135deg to +135deg

  // Dynamic heat wash gradient based on progress: cool blue -> amber -> warm crimson
  const getHeatColor = (p: number) => {
    if (p < 0.35) return "rgb(96, 165, 250)"; // Arctic Blue
    if (p < 0.7) return "rgb(251, 191, 36)"; // Golden Amber
    return "rgb(239, 68, 68)"; // Scorching Crimson
  };

  const currentColor = getHeatColor(progress);

  const calculateAngleFromPoint = useCallback(
    (clientX: number, clientY: number) => {
      if (!dialRef.current) return;
      const rect = dialRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = clientX - centerX;
      const dy = clientY - centerY;

      let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      if (deg < 0) deg += 360;

      // Map 0 - 360 to our 270 degree arc
      // Arc starts at 225 deg (bottom-left) and ends at 135 deg (bottom-right)
      let normalized = (deg - 45 + 360) % 360;
      if (normalized > 270) {
        normalized = normalized > 315 ? 0 : 270;
      }
      const newProgress = normalized / 270;
      const newVal = Math.round(min + newProgress * (max - min));
      onChange?.(newVal);
    },
    [min, max, onChange],
  );

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    calculateAngleFromPoint(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    calculateAngleFromPoint(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer already released
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowUp" || e.key === "ArrowRight") {
      e.preventDefault();
      onChange?.(Math.min(clampedValue + 1, max));
    } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
      e.preventDefault();
      onChange?.(Math.max(clampedValue - 1, min));
    }
  };

  return (
    <div
      ref={dialRef}
      role="slider"
      tabIndex={0}
      aria-label={`${label} dial`}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={clampedValue}
      aria-valuetext={`${clampedValue}${unit}`}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`pin-thermal-dial-root ${isDragging ? "is-dragging" : ""} ${className}`.trim()}
      style={{ "--dial-color": currentColor } as React.CSSProperties}
    >
      {/* Background Heat Wash Glow */}
      <div
        className="pin-dial-glow"
        style={{
          background: `radial-gradient(circle, ${currentColor} 0%, transparent 68%)`,
          opacity: 0.12 + progress * 0.2,
        }}
      />

      {/* Radial Ticks */}
      <div className="pin-dial-ticks" aria-hidden="true">
        {Array.from({ length: totalTicks }).map((_, i) => {
          const tickProgress = i / (totalTicks - 1);
          const tickAngle = tickProgress * 270 - 135;
          const isLit = tickProgress <= progress;
          return (
            <span
              key={i}
              className={`pin-dial-tick ${isLit ? "is-lit" : ""}`}
              style={{
                transform: `rotate(${tickAngle}deg) translateY(-88px)`,
                backgroundColor: isLit ? currentColor : undefined,
              }}
            />
          );
        })}
      </div>

      {/* Needle indicator */}
      <motion.div
        className="pin-dial-needle"
        aria-hidden="true"
        animate={{ rotate: angle }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : { type: "spring", stiffness: isDragging ? 480 : 220, damping: isDragging ? 32 : 24 }
        }
      >
        <span className="pin-needle-head" style={{ backgroundColor: currentColor }} />
      </motion.div>

      {/* Central Dial Readout */}
      <div className="pin-dial-center">
        <span className="pin-dial-label">{label}</span>
        <div className="pin-dial-value-row">
          <span className="pin-dial-value">{clampedValue}</span>
          <span className="pin-dial-unit">{unit}</span>
        </div>
      </div>
    </div>
  );
}

export default ThermalDial;
