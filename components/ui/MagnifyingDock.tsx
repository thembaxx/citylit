"use client";

import type { ReactNode } from "react";
import Link from "next/link";

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

export function MagnifyingDock({
  items,
  ariaLabel = "Mobile navigation",
  className = "",
}: MagnifyingDockProps) {
  return (
    <nav
      className={`atlas-native-dock citylit-bottom-dock bencho-magnifying-dock ${className}`}
      aria-label={ariaLabel}
    >
      {items.map((item) => (
        <Link
          key={item.href + item.label}
          href={item.href}
          aria-label={item.ariaLabel || item.label}
          aria-current={item.isActive ? "page" : undefined}
          className={`citylit-dock-item bencho-dock-item ${item.isActive ? "is-active" : ""} ${item.className || ""}`}
        >
          <span className="bencho-dock-icon-inner">
            {item.isActive && item.activeIcon ? item.activeIcon : item.icon}
          </span>
          <span className="bencho-dock-label">{item.label}</span>
          {item.isActive ? (
            <span className="citylit-dock-pill bencho-dock-pill" aria-hidden="true" />
          ) : null}
        </Link>
      ))}
    </nav>
  );
}

export default MagnifyingDock;
