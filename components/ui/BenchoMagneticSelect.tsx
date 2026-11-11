"use client";

/**
 * Bencho Magnetic Select
 * Fluid pill selection control based on Bencho (bencho.dev) by Lorenzo Cabra.
 * Features:
 * - Fluid background capsule morphing via spring layoutId
 * - Magnetic pull on cursor hover
 * - Synthesized click audio triggers via benchoAudio
 * - Keyboard navigation and full ARIA tab/radiogroup support
 */

import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { benchoAudio } from "../../lib/bencho-audio";

export interface MagneticSelectItem {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: string | number;
}

interface BenchoMagneticSelectProps {
  items: MagneticSelectItem[];
  value: string;
  onChange: (id: string) => void;
  ariaLabel: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function BenchoMagneticSelect({
  items,
  value,
  onChange,
  ariaLabel,
  className = "",
  size = "md",
}: BenchoMagneticSelectProps) {
  const generatedId = useId();
  const reduced = useReducedMotion();
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const activeIndex = items.findIndex((item) => item.id === value);

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    let nextIndex = activeIndex;
    if (e.key === "ArrowRight") nextIndex = (activeIndex + 1) % items.length;
    else if (e.key === "ArrowLeft") nextIndex = (activeIndex - 1 + items.length) % items.length;
    else if (e.key === "Home") nextIndex = 0;
    else if (e.key === "End") nextIndex = items.length - 1;
    else return;

    e.preventDefault();
    const nextItem = items[nextIndex];
    if (nextItem) {
      benchoAudio.playClick(600 + nextIndex * 30);
      onChange(nextItem.id);
      itemRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`bencho-magnetic-select-root size-${size} ${className}`}
    >
      {items.map((item, index) => {
        const isSelected = item.id === value;

        return (
          <button
            key={item.id}
            ref={(node) => {
              itemRefs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={`bencho-mag-tab-${generatedId}-${item.id}`}
            aria-selected={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => {
              benchoAudio.playClick(580 + index * 30);
              onChange(item.id);
            }}
            onKeyDown={handleKeyDown}
            className={`bencho-magnetic-item ${isSelected ? "is-selected" : ""}`}
          >
            {isSelected && (
              <motion.div
                layoutId={`bencho-mag-pill-${generatedId}`}
                className="bencho-magnetic-active-bg"
                transition={
                  reduced
                    ? { duration: 0 }
                    : {
                        type: "spring",
                        stiffness: 450,
                        damping: 28,
                        mass: 0.8,
                      }
                }
              />
            )}
            <span className="bencho-magnetic-content">
              {item.icon && <span className="bencho-magnetic-icon">{item.icon}</span>}
              <span className="bencho-magnetic-label">{item.label}</span>
              {item.badge !== undefined && (
                <span className="bencho-magnetic-badge">{item.badge}</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default BenchoMagneticSelect;
