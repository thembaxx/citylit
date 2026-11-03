"use client";

/**
 * Adapted from EasyUI's MIT-licensed Magnetic Button by Suraj Maurya.
 * https://github.com/Surajmaurya1/easyui
 * Uses Citylit's existing motion package and design tokens, with no added dependency.
 */
import { useRef, type PointerEvent } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type HTMLMotionProps,
} from "motion/react";

export type MagneticButtonProps = HTMLMotionProps<"button"> & {
  strength?: number;
};

export default function MagneticButton({
  strength = 0.22,
  className = "",
  onPointerMove,
  onPointerLeave,
  onBlur,
  type = "button",
  children,
  ...props
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const reduced = useReducedMotion();
  const dx = useMotionValue(0);
  const dy = useMotionValue(0);
  const x = useSpring(dx, { stiffness: 300, damping: 27, mass: 0.65 });
  const y = useSpring(dy, { stiffness: 300, damping: 27, mass: 0.65 });
  const reset = () => {
    dx.set(0);
    dy.set(0);
  };
  const move = (event: PointerEvent<HTMLButtonElement>) => {
    onPointerMove?.(event);
    if (
      reduced ||
      event.pointerType !== "mouse" ||
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches
    )
      return;
    const box = ref.current?.getBoundingClientRect();
    if (!box) return;
    dx.set((event.clientX - box.left - box.width / 2) * strength);
    dy.set((event.clientY - box.top - box.height / 2) * strength);
  };
  return (
    <motion.button
      {...props}
      type={type}
      ref={ref}
      className={`easyui-magnetic-button ${className}`}
      style={{ x: reduced ? 0 : x, y: reduced ? 0 : y }}
      onPointerMove={move}
      onPointerLeave={(event) => {
        reset();
        onPointerLeave?.(event);
      }}
      onBlur={(event) => {
        reset();
        onBlur?.(event);
      }}
      whileTap={reduced ? undefined : { scale: 0.96 }}
      transition={{ type: "spring", stiffness: 460, damping: 35 }}
    >
      {children}
    </motion.button>
  );
}
