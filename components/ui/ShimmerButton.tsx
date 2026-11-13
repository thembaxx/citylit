"use client";

import { useRef, type ReactNode, type ButtonHTMLAttributes } from "react";
import { motion, useReducedMotion } from "motion/react";
import benchoAudio from "../../lib/bencho-audio";

interface ShimmerButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  className?: string;
}

/**
 * EasyUI Shimmer Button adapted to Citylit squircle controls & motion preferences.
 */
export function ShimmerButton({
  children,
  shimmerColor = "var(--citylit-amber, #e59934)",
  _shimmerSize = "0.08em",
  borderRadius = "14px",
  _shimmerDuration = "2.8s",
  background = "var(--surface)",
  className = "",
  onClick,
  ...props
}: ShimmerButtonProps & { _shimmerSize?: string; _shimmerDuration?: string }) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const reduced = useReducedMotion();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    benchoAudio.playTap();
    onClick?.(e);
  };

  return (
    <motion.button
      ref={buttonRef}
      whileHover={reduced ? {} : { scale: 1.02 }}
      whileTap={reduced ? {} : { scale: 0.98 }}
      onClick={handleClick}
      className={`easyui-shimmer-btn ${className}`.trim()}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        borderRadius,
        background,
        border: "1px solid var(--line)",
        color: "var(--ink)",
        minHeight: "44px",
        padding: "10px 18px",
        fontWeight: 650,
        cursor: "pointer",
        touchAction: "manipulation",
      }}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      {!reduced && (
        <span
          aria-hidden="true"
          style={{
            pointerEvents: "none",
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            borderRadius,
          }}
        >
          <span
            style={{
              position: "absolute",
              inset: "-100%",
              animation: "spin 3.2s linear infinite",
              background: `conic-gradient(from 0deg at 50% 50%, transparent 0%, transparent 78%, ${shimmerColor} 100%)`,
            }}
          />
        </span>
      )}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: "1px",
          borderRadius,
          background,
        }}
      />
      <span
        style={{
          position: "relative",
          zIndex: 1,
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        {children}
      </span>
    </motion.button>
  );
}

export default ShimmerButton;
