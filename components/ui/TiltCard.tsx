"use client";

/**
 * Spring-physics 3D tilt and specular glare surface inspired by Amicro (@amicro/tilt-card)
 * and adapted to Citylit's Motion runtime, semantic tokens, and reduced-motion rules.
 */
import { useRef, type PointerEvent, type ReactNode } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type HTMLMotionProps,
} from "motion/react";

export type TiltCardProps = HTMLMotionProps<"article"> & {
  children: ReactNode;
  maxTilt?: number;
};

export default function TiltCard({
  children,
  className = "",
  maxTilt = 3.2,
  onPointerMove,
  onPointerLeave,
  ...props
}: TiltCardProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);
  const glareOpacity = useMotionValue(0);

  const rotateX = useSpring(rawRotateX, { stiffness: 320, damping: 28, mass: 0.6 });
  const rotateY = useSpring(rawRotateY, { stiffness: 320, damping: 28, mass: 0.6 });
  const smoothGlareOpacity = useSpring(glareOpacity, { stiffness: 280, damping: 30 });
  const glareBackground = useMotionTemplate`radial-gradient(320px circle at ${glareX}% ${glareY}%, color-mix(in srgb, var(--citylit-reference-gold) 14%, transparent), transparent 72%)`;

  const reset = () => {
    rawRotateX.set(0);
    rawRotateY.set(0);
    glareOpacity.set(0);
  };

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    onPointerMove?.(event);
    if (
      reduced ||
      event.pointerType !== "mouse" ||
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches
    )
      return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) return;
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    rawRotateX.set((0.5 - py) * maxTilt * 2);
    rawRotateY.set((px - 0.5) * maxTilt * 2);
    glareX.set(Math.round(px * 100));
    glareY.set(Math.round(py * 100));
    glareOpacity.set(1);
  };

  return (
    <motion.article
      {...props}
      ref={ref}
      className={`amicro-tilt-card ${className}`.trim()}
      style={
        reduced
          ? props.style
          : {
              ...props.style,
              rotateX,
              rotateY,
              transformPerspective: 960,
            }
      }
      onPointerMove={handlePointerMove}
      onPointerLeave={(event) => {
        reset();
        onPointerLeave?.(event);
      }}
    >
      {!reduced && (
        <motion.span
          aria-hidden="true"
          className="amicro-tilt-glare"
          style={{
            background: glareBackground,
            opacity: smoothGlareOpacity,
          }}
        />
      )}
      {children}
    </motion.article>
  );
}
