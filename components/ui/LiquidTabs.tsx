"use client";

import { useId, useRef, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { handleRovingKeyDown } from "../../lib/ui-primitives";

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
  variant?: "pill" | "folder";
  className?: string;
}

/**
 * Liquid Tabs with Pin UI's tactile styling (pill or inverted-fillet folder variant)
 * and Vercel Labs ui-sdk roving focus.
 */
export function LiquidTabs({
  items,
  value,
  onChange,
  ariaLabel,
  variant = "pill",
  className = "",
}: LiquidTabsProps) {
  const generatedId = useId();
  const reducedMotion = useReducedMotion();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      data-variant={variant}
      className={`pin-liquid-tabs-root ${variant === "folder" ? "is-folder" : ""} ${className}`.trim()}
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
            onKeyDown={(e) =>
              handleRovingKeyDown(
                e,
                idx,
                items.length,
                tabRefs,
                (nextIdx) => onChange(items[nextIdx].id),
                "horizontal",
              )
            }
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
