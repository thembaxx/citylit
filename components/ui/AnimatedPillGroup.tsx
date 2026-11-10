"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { useId, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";

export type AnimatedPillItem = {
  id: string;
  label: ReactNode;
  badge?: string | number;
  ariaControls?: string;
};

type AnimatedPillGroupProps = {
  items: AnimatedPillItem[];
  activeId: string;
  onChange: (id: string, index: number) => void;
  ariaLabel: string;
  className?: string;
  pillClassName?: string;
};

/**
 * EasyUI-inspired animated pill group (adapted from Surajmaurya1/easyui)
 * Preserves role="group" and button[aria-pressed] semantics while rendering
 * a spring-physics active indicator pill and arrow-key keyboard navigation.
 */
export default function AnimatedPillGroup({
  items,
  activeId,
  onChange,
  ariaLabel,
  className = "",
  pillClassName = "",
}: AnimatedPillGroupProps) {
  const layoutId = useId();
  const reduceMotion = useReducedMotion();
  const groupRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!items.length) return;
    const currentIndex = Math.max(
      0,
      items.findIndex((item) => item.id === activeId),
    );
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % items.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + items.length) % items.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = items.length - 1;
    }

    if (nextIndex === null) return;
    event.preventDefault();
    const nextItem = items[nextIndex];
    if (!nextItem) return;
    onChange(nextItem.id, nextIndex);
    const buttons = groupRef.current?.querySelectorAll<HTMLButtonElement>("button");
    buttons?.[nextIndex]?.focus();
  };

  return (
    <div
      ref={groupRef}
      className={`easyui-pill-group ${className}`.trim()}
      role="group"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
    >
      {items.map((item, index) => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={isActive}
            aria-controls={item.ariaControls}
            className={`easyui-pill-button ${pillClassName} ${isActive ? "is-active" : ""}`.trim()}
            onClick={() => onChange(item.id, index)}
          >
            {isActive && (
              <motion.span
                layoutId={`easyui-pill-${layoutId}`}
                className="easyui-pill-indicator"
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : {
                        type: "spring",
                        stiffness: 420,
                        damping: 32,
                        mass: 0.72,
                      }
                }
              />
            )}
            <span className="easyui-pill-content">
              <span className="easyui-pill-label">{item.label}</span>
              {item.badge !== undefined && <span className="easyui-pill-badge">{item.badge}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
