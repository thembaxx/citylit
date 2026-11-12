"use client";

/**
 * Bencho-inspired Liquid Toggle
 * Viscous, physics-based switch with fluid stretch & snap animation based on Bencho (bencho.dev).
 * Thumb deforms organically during travel and settles with spring damping.
 * Proportioned strictly to 48px × 26px with a 20px thumb and accessible hit target.
 */

import { useId } from "react";
import { motion, useReducedMotion } from "motion/react";

interface LiquidToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  label?: string;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
}

export function LiquidToggle({
  checked,
  onChange,
  id,
  label,
  ariaLabel,
  disabled = false,
  className = "",
}: LiquidToggleProps) {
  const generatedId = useId();
  const toggleId = id || `liquid-toggle-${generatedId}`;
  const reduced = useReducedMotion();

  const handleToggle = () => {
    if (disabled) return;
    onChange(!checked);
  };

  return (
    <div className={`bencho-liquid-toggle-wrapper ${className}`}>
      <button
        type="button"
        role="switch"
        id={toggleId}
        aria-checked={checked}
        aria-label={ariaLabel || label}
        disabled={disabled}
        onClick={handleToggle}
        className={`bencho-liquid-toggle-track ${checked ? "is-checked" : ""} ${disabled ? "is-disabled" : ""}`}
      >
        <motion.span
          className="bencho-liquid-thumb"
          layout
          transition={
            reduced
              ? { duration: 0.12 }
              : {
                  type: "spring",
                  stiffness: 520,
                  damping: 26,
                  mass: 0.65,
                  scaleX: {
                    type: "tween",
                    duration: 0.18,
                    times: [0, 0.4, 0.75, 1],
                    ease: [0.23, 1, 0.32, 1],
                  },
                  scaleY: {
                    type: "tween",
                    duration: 0.18,
                    times: [0, 0.4, 0.75, 1],
                    ease: [0.23, 1, 0.32, 1],
                  },
                }
          }
          animate={{
            x: checked ? 23 : 3,
            scaleX: reduced ? 1 : [1, 1.24, 0.94, 1],
            scaleY: reduced ? 1 : [1, 0.84, 1.05, 1],
          }}
        />
        <span className="bencho-liquid-track-glow" aria-hidden="true" />
      </button>
      {label && (
        <label htmlFor={toggleId} className="bencho-liquid-toggle-label">
          {label}
        </label>
      )}
    </div>
  );
}

export default LiquidToggle;
