"use client";

/**
 * Bencho-inspired Dynamic Island Toast
 * Fluid pill micro-interaction for system feedback and actions based on Bencho (bencho.dev).
 * Animates organically with spring expansion, icon morphing, and auto-dismiss.
 */

import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, X } from "@phosphor-icons/react";

interface DynamicIslandToastProps {
  message: string;
  onDismiss: () => void;
  icon?: ReactNode;
  durationMs?: number;
  actionLabel?: string;
  onAction?: () => void;
}

export function DynamicIslandToast({
  message,
  onDismiss,
  icon,
  durationMs = 4000,
  actionLabel,
  onAction,
}: DynamicIslandToastProps) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [message, durationMs, onDismiss]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          role="status"
          aria-live="polite"
          className="bencho-dynamic-island-container"
          initial={
            reduced ? { opacity: 0 } : { opacity: 0, y: -14, scale: 0.96, filter: "blur(4px)" }
          }
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.97, filter: "blur(4px)" }}
          transition={{
            type: "spring",
            stiffness: 420,
            damping: 26,
            mass: 0.8,
          }}
          layout
        >
          <div className="bencho-dynamic-island-pill">
            <div className="bencho-dynamic-island-icon">
              {icon || <Check size={16} weight="bold" />}
            </div>
            <span className="bencho-dynamic-island-text">{message}</span>
            {actionLabel && onAction && (
              <button type="button" onClick={onAction} className="bencho-dynamic-island-action">
                {actionLabel}
              </button>
            )}
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss notification"
              className="bencho-dynamic-island-close"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default DynamicIslandToast;
