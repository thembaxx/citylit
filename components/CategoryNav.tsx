"use client";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef } from "react";
import { categories } from "../lib/data";
import CategoryIcon from "./CategoryIcon";
export default function CategoryNav({
  selected,
  onSelect,
  compact = false,
}: {
  selected: number;
  onSelect: (index: number) => void;
  compact?: boolean;
}) {
  const id = useId();
  const reduced = useReducedMotion();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => {
    // Keep the selected tab visible without moving the document or the hero.
    const button = buttons.current[selected],
      rail = button?.parentElement;
    if (!button || !rail || rail.scrollWidth <= rail.clientWidth) return;
    const left = button.offsetLeft - rail.offsetLeft - (rail.clientWidth - button.offsetWidth) / 2;
    rail.scrollTo({ left, behavior: reduced ? "instant" : "smooth" });
  }, [selected, reduced]);
  return (
    <LayoutGroup id={id}>
      <nav
        className={`glass-category-nav ${compact ? "glass-category-compact" : "glass-category-tabs"}`}
        aria-label="Attraction categories"
      >
        {categories.map((name, index) => (
          <motion.button
            key={name}
            ref={(element) => {
              buttons.current[index] = element;
            }}
            aria-label={name}
            aria-current={selected === index ? "page" : undefined}
            onClick={() => onSelect(index)}
            whileTap={reduced ? undefined : { scale: 0.98 }}
            onKeyDown={(event) => {
              if (
                event.key !== "ArrowLeft" &&
                event.key !== "ArrowRight" &&
                event.key !== "Home" &&
                event.key !== "End"
              )
                return;
              event.preventDefault();
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? categories.length - 1
                    : (index + (event.key === "ArrowRight" ? 1 : -1) + categories.length) %
                      categories.length;
              onSelect(next);
              buttons.current[next]?.focus({ preventScroll: true });
            }}
          >
            {selected === index && (
              <motion.span
                className="glass-active-pill"
                layoutId="category-selection"
                aria-hidden="true"
                transition={
                  reduced
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 440, damping: 38, mass: 0.8 }
                }
              />
            )}
            <span className="glass-category-icon">
              <CategoryIcon index={index} size={compact ? 24 : 19} />
            </span>
            <span className="glass-category-name">{name}</span>
          </motion.button>
        ))}
      </nav>
    </LayoutGroup>
  );
}
