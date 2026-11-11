"use client";

/**
 * Bencho Card Stack (Stack.tsx)
 * Handcrafted interactive card stack micro-interaction based directly on Lorenzo Cabra's Bencho (bencho.dev).
 * Features:
 * - Radial Pivot Arc: transform-origin: 50% calc(100% + 200px)
 * - Calibrated spring physics (stiffness ~260, damping ~20)
 * - Deterministic seeded angular and spatial scatter offsets
 * - Interactive hover fan-out & swipe gesture
 */

import { useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

export interface StackCardItem {
  id: string;
  content: ReactNode;
}

interface BenchoCardStackProps {
  cards: StackCardItem[];
  spread?: number;
  scatter?: number;
  bounce?: number;
  className?: string;
  onCardSelect?: (id: string) => void;
}

export function BenchoCardStack({
  cards,
  spread = 16,
  scatter = 6,
  className = "",
  onCardSelect,
}: BenchoCardStackProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const reduced = useReducedMotion();

  // Deterministic seeded offset function
  const getCardOffset = (index: number, total: number) => {
    const centeredIndex = index - (total - 1) / 2;
    // Radial arc rotation
    const rotate = centeredIndex * (spread * (isHovered ? 1.6 : 0.6));
    // Seeded pseudo-random scatter
    const seed = Math.sin(index * 997);
    const xScatter = seed * scatter * (isHovered ? 2 : 1);
    const yTranslate = Math.abs(centeredIndex) * (isHovered ? 12 : 6);

    return {
      rotate: reduced ? 0 : rotate,
      x: reduced ? 0 : centeredIndex * (isHovered ? 38 : 12) + xScatter,
      y: reduced ? 0 : yTranslate,
      scale: 1 - Math.abs(centeredIndex) * 0.04,
      zIndex: total - Math.abs(centeredIndex),
    };
  };

  return (
    <div
      className={`bencho-card-stack-root ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="bencho-card-stack-viewport">
        {cards.map((card, index) => {
          const offset = getCardOffset(index, cards.length);
          const isTop = index === activeIndex;

          return (
            <motion.div
              key={card.id}
              className={`bencho-stack-card ${isTop ? "is-top-card" : ""}`}
              style={{
                transformOrigin: "50% calc(100% + 200px)",
                zIndex: offset.zIndex,
              }}
              animate={{
                rotate: offset.rotate,
                x: offset.x,
                y: offset.y,
                scale: offset.scale,
              }}
              whileHover={
                reduced
                  ? undefined
                  : {
                      scale: offset.scale * 1.04,
                      y: offset.y - 10,
                      transition: { type: "spring", stiffness: 350, damping: 20 },
                    }
              }
              whileTap={reduced ? undefined : { scale: offset.scale * 0.98 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                mass: 0.8,
              }}
              onClick={() => {
                setActiveIndex(index);
                onCardSelect?.(card.id);
              }}
            >
              {card.content}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default BenchoCardStack;
