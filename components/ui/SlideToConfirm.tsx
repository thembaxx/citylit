"use client";

/**
 * Bencho-inspired Slide to Confirm
 * Interactive tactile swipe/drag micro-interaction based on Bencho (bencho.dev).
 * Smooth spring physics, liquid progress fill, snap-to-confirm threshold,
 * and keyboard accessibility.
 */

import { useRef, useState, useEffect } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useReducedMotion,
  animate,
  type PanInfo,
} from "motion/react";
import { ArrowRight, Check } from "@phosphor-icons/react";

interface SlideToConfirmProps {
  label?: string;
  confirmedLabel?: string;
  isConfirmed?: boolean;
  onConfirm: () => void;
  onReset?: () => void;
  className?: string;
}

export function SlideToConfirm({
  label = "Slide to add to day",
  confirmedLabel = "Added to your day",
  isConfirmed = false,
  onConfirm,
  onReset,
  className = "",
}: SlideToConfirmProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [maxDrag, setMaxDrag] = useState(200);
  const [confirmed, setConfirmed] = useState(isConfirmed);
  const dragX = useMotionValue(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    setConfirmed(isConfirmed);
    if (!isConfirmed) {
      dragX.set(0);
    }
  }, [isConfirmed, dragX]);

  useEffect(() => {
    const updateBounds = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        setMaxDrag(Math.max(120, width - 52));
      }
    };
    updateBounds();
    window.addEventListener("resize", updateBounds);
    return () => window.removeEventListener("resize", updateBounds);
  }, []);

  const progress = useTransform(dragX, [0, maxDrag], [0, 1]);
  const textOpacity = useTransform(progress, [0, 0.5], [1, 0.1]);
  const fillWidth = useTransform(dragX, (x) => `${Math.max(48, x + 48)}px`);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const currentX = dragX.get();
    const vx = info?.velocity?.x ?? 0;
    const isFlick = vx > 300;
    if (currentX >= maxDrag * 0.68 || isFlick) {
      // Confirmed! Snap to end with seeded gesture velocity
      if (reduced) {
        animate(dragX, maxDrag, { duration: 0.1 });
      } else {
        animate(dragX, maxDrag, {
          type: "spring",
          stiffness: 400,
          damping: 25,
          velocity: vx,
        });
      }
      setConfirmed(true);
      onConfirm();
    } else {
      // Rebound back to start with seeded gesture velocity
      if (reduced) {
        animate(dragX, 0, { duration: 0.1 });
      } else {
        animate(dragX, 0, {
          type: "spring",
          stiffness: 450,
          damping: 28,
          velocity: vx,
        });
      }
    }
  };

  const handleKeyboardTrigger = () => {
    if (confirmed) {
      onReset?.();
      setConfirmed(false);
      animate(dragX, 0, { type: "spring", stiffness: 400, damping: 25 });
    } else {
      setConfirmed(true);
      animate(dragX, maxDrag, { type: "spring", stiffness: 400, damping: 25 });
      onConfirm();
    }
  };

  return (
    <div
      ref={containerRef}
      className={`bencho-slide-confirm-track ${confirmed ? "is-confirmed" : ""} ${className}`}
      role="button"
      tabIndex={0}
      aria-label={confirmed ? confirmedLabel : label}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleKeyboardTrigger();
        }
      }}
    >
      {/* Background liquid progress fill */}
      <motion.div className="bencho-slide-fill" style={{ width: confirmed ? "100%" : fillWidth }} />

      {/* Shimmer text label */}
      <motion.span
        className="bencho-slide-text"
        style={reduced ? undefined : { opacity: confirmed ? 1 : textOpacity }}
      >
        {confirmed ? confirmedLabel : label}
      </motion.span>

      {/* Interactive Draggable Handle */}
      {!confirmed && (
        <motion.div
          className="bencho-slide-thumb"
          drag="x"
          dragConstraints={{ left: 0, right: maxDrag }}
          dragElastic={0.2}
          dragMomentum={false}
          style={{ x: dragX, touchAction: "pan-y" }}
          onDragEnd={handleDragEnd}
          whileTap={{ scale: 0.94 }}
        >
          <ArrowRight size={18} weight="bold" />
        </motion.div>
      )}

      {/* Confirmed check badge */}
      {confirmed && (
        <div className="bencho-slide-thumb is-confirmed-thumb">
          <Check size={18} weight="bold" />
        </div>
      )}
    </div>
  );
}

export default SlideToConfirm;
