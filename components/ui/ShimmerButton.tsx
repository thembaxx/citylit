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
 * EasyUI inspired Shimmer Button
 * Seamless rotating beam of light along the button perimeter with haptic/tactile feedback.
 */
export function ShimmerButton({
  children,
  shimmerColor = "#a78bfa",
  _shimmerSize = "0.08em",
  borderRadius = "9999px",
  _shimmerDuration = "2.8s",
  background = "rgba(23, 20, 38, 0.95)",
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
      whileTap={reduced ? {} : { scale: 0.97 }}
      onClick={handleClick}
      className={`relative inline-flex items-center justify-center overflow-hidden border border-white/10 px-5 py-2.5 font-medium text-white shadow-xl transition-all duration-200 active:shadow-inner ${className}`}
      style={{
        borderRadius,
        background,
        minHeight: "44px",
      }}
      {...(props as any)}
    >
      {!reduced && (
        <span
          className="pointer-events-none absolute inset-0 overflow-visible"
          aria-hidden="true"
        >
          <span
            className="absolute inset-[-100%] animate-[spin_3s_linear_infinite]"
            style={{
              background: `conic-gradient(from 0deg at 50% 50%, transparent 0%, transparent 75%, ${shimmerColor} 100%)`,
            }}
          />
        </span>
      )}
      <span
        className="absolute inset-[1px] -z-0"
        style={{
          borderRadius,
          background,
        }}
      />
      <span className="relative z-10 inline-flex items-center gap-2">
        {children}
      </span>
    </motion.button>
  );
}

export default ShimmerButton;
