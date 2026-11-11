"use client";

/**
 * Bencho-inspired Liquid Toggle
 * Viscous, physics-based switch with fluid stretch & snap animation based on Bencho (bencho.dev).
 * Thumb deforms organically during travel and settles with spring damping.
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
              ? { duration: 0.1 }
              : {
                  type: "spring",
                  stiffness: 480,
                  damping: 24,
                  mass: 0.7,
                }
          }
          animate={{
            x: checked ? 20 : 2,
            scaleX: reduced ? 1 : [1, 1.28, 0.92, 1],
            scaleY: reduced ? 1 : [1, 0.82, 1.06, 1],
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
