"use client";

import { useRef, useState, type ReactNode, type MouseEvent } from "react";

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  spotlightColor?: string;
  borderColor?: string;
  onClick?: () => void;
}

/**
 * EasyUI Spotlight Card
 * Radial gradient illuminates on pointer hover with smooth falloff and Citylit hairline border.
 */
export function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(229, 153, 52, 0.14)",
  borderColor = "var(--line)",
  onClick,
}: SpotlightCardProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!divRef.current || isFocused) return;
    const div = divRef.current;
    const rect = div.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleFocus = () => {
    setIsFocused(true);
    setOpacity(1);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setOpacity(0);
  };

  const handleMouseEnter = () => {
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`citylit-spotlight-card ${className}`.trim()}
      style={{
        position: "relative",
        overflow: "hidden",
        borderColor,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          pointerEvents: "none",
          position: "absolute",
          inset: "-1px",
          opacity,
          transition: "opacity 260ms ease",
          background: `radial-gradient(360px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 70%)`,
        }}
      />
      {children}
    </div>
  );
}

export default SpotlightCard;
