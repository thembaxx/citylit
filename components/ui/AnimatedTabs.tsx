"use client";

/**
 * Animated tabs adapted from EasyUI's MIT-licensed Animated Tabs component.
 * https://github.com/Surajmaurya1/easyui/blob/main/src/components/ui/AnimatedTabs.tsx
 * Uses Citylit's Motion package and tokens, with tab semantics and arrow-key navigation.
 */
import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

export type EasyUITabItem = {
  id: string;
  label: string;
  badge?: string | number;
  icon?: ReactNode;
};

export function AnimatedTabs({
  items,
  value,
  onChange,
  ariaLabel,
  idPrefix,
  className = "",
}: {
  items: EasyUITabItem[];
  value: string;
  onChange: (id: string) => void;
  ariaLabel: string;
  idPrefix: string;
  className?: string;
}) {
  const generatedId = useId();
  const reduced = useReducedMotion();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = items.findIndex((item) => item.id === value);
  const selected = items[selectedIndex] ?? items[0];
  const indicatorId = `easyui-tab-indicator-${generatedId}`;
  const transition = reduced
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 260, damping: 30, mass: 0.8 };

  const selectRelative = (event: KeyboardEvent<HTMLButtonElement>) => {
    let nextIndex = selectedIndex;
    if (event.key === "ArrowRight") nextIndex = (selectedIndex + 1) % items.length;
    else if (event.key === "ArrowLeft")
      nextIndex = (selectedIndex - 1 + items.length) % items.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = items.length - 1;
    else return;

    event.preventDefault();
    onChange(items[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  };

  if (!selected) return null;

  return (
    <div className={`easyui-tabs-root ${className}`}>
      <div className="hub-tabs easyui-tabs-list" role="tablist" aria-label={ariaLabel}>
        {items.map((item, index) => {
          const isSelected = item.id === selected.id;
          return (
            <button
              key={item.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              id={`${idPrefix}-tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls={`${idPrefix}-panel`}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => onChange(item.id)}
              onKeyDown={selectRelative}
              className="easyui-tab"
            >
              {isSelected && (
                <motion.span
                  aria-hidden="true"
                  className="easyui-tab-indicator"
                  layoutId={indicatorId}
                  transition={transition}
                />
              )}
              <span className="easyui-tab-content">
                {item.icon}
                {item.label}
                {item.badge != null && (
                  <span className="easyui-tab-badge" aria-hidden="true">
                    {item.badge}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
