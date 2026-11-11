"use client";

/**
 * Bencho-inspired Magnifying Dock
 * Interactive React UI micro-interaction based on Bencho (bencho.dev) by Lorenzo Cabra.
 * Uses spring physics to dynamically scale dock items based on cursor distance,
 * with tactile spring response, active glow indicator, and reduced-motion support.
 */

import { useRef, type ReactNode } from "react";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "motion/react";

export interface DockItemData {
  href: string;
  label: string;
  ariaLabel?: string;
  isActive?: boolean;
  icon: ReactNode;
  activeIcon?: ReactNode;
  className?: string;
}

interface MagnifyingDockProps {
  items: DockItemData[];
  ariaLabel?: string;
  className?: string;
}

function DockIcon({ item, mouseX }: { item: DockItemData; mouseX: MotionValue<number> }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const reduced = useReducedMotion();

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - (bounds.x + bounds.width / 2);
  });

  const widthSync = useTransform(distance, [-140, 0, 140], [56, 76, 56]);
  const width = useSpring(widthSync, {
    mass: 0.1,
    stiffness: 180,
    damping: 14,
  });

  const scaleSync = useTransform(distance, [-140, 0, 140], [1, 1.22, 1]);
  const iconScale = useSpring(scaleSync, {
    mass: 0.1,
    stiffness: 180,
    damping: 14,
  });

  return (
    <motion.div style={reduced ? undefined : { width }} className="bencho-dock-item-wrapper">
      <Link
        ref={ref}
        href={item.href}
        aria-label={item.ariaLabel || item.label}
        aria-current={item.isActive ? "page" : undefined}
        className={`citylit-dock-item bencho-dock-item ${item.isActive ? "is-active" : ""} ${item.className || ""}`}
      >
        <motion.div
          className="bencho-dock-icon-inner"
          style={reduced ? undefined : { scale: iconScale }}
          whileTap={reduced ? undefined : { scale: 0.9 }}
          whileHover={reduced ? undefined : { y: -2 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          {item.isActive && item.activeIcon ? item.activeIcon : item.icon}
        </motion.div>
        <span className="bencho-dock-label">{item.label}</span>
        {item.isActive && (
          <motion.span
            layoutId="bencho-dock-active-pill"
            className="citylit-dock-pill bencho-dock-pill"
            aria-hidden="true"
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
          />
        )}
      </Link>
    </motion.div>
  );
}

export function MagnifyingDock({
  items,
  ariaLabel = "Mobile navigation",
  className = "",
}: MagnifyingDockProps) {
  const mouseX = useMotionValue(Infinity);

  return (
    <nav
      className={`atlas-native-dock citylit-bottom-dock bencho-magnifying-dock ${className}`}
      aria-label={ariaLabel}
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
    >
      {items.map((item) => (
        <DockIcon key={item.href + item.label} item={item} mouseX={mouseX} />
      ))}
    </nav>
  );
}

export default MagnifyingDock;
