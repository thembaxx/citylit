"use client";

import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

export interface LiquidTabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: string | number;
}

interface LiquidTabsProps {
  items: LiquidTabItem[];
  value: string;
  onChange: (id: string) => void;
  ariaLabel: string;
  className?: string;
}

/**
 * Liquid Tabs with Pin UI's tactile styling and Vercel Labs ui-sdk roving focus.
 * Features an animated spring pill, subtle chamfer highlight, and roving keyboard navigation.
 */
export function LiquidTabs({ items, value, onChange, ariaLabel, className = "" }: LiquidTabsProps) {
  const generatedId = useId();
  const reducedMotion = useReducedMotion();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex = index;
    if (event.key === "ArrowRight") {
      nextIndex = (index + 1) % items.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (index - 1 + items.length) % items.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = items.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    onChange(items[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`pin-liquid-tabs-root ${className}`.trim()}
    >
      {items.map((tab, idx) => {
        const isActive = tab.id === value;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[idx] = el;
            }}
            type="button"
            role="tab"
            id={`liquid-tab-${generatedId}-${tab.id}`}
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`pin-liquid-tab ${isActive ? "is-active" : ""}`}
            data-state={isActive ? "active" : "inactive"}
          >
            {tab.icon && <span className="pin-tab-icon">{tab.icon}</span>}
            <span className="pin-tab-label">{tab.label}</span>
            {tab.badge !== undefined && <span className="pin-tab-badge">{tab.badge}</span>}
            {isActive && (
              <motion.div
                layoutId={`pin-tab-indicator-${generatedId}`}
                className="pin-tab-indicator"
                transition={
                  reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 28 }
                }
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default LiquidTabs;
