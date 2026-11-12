import type { KhweziPose } from "../lib/brand";

/**
 * Clean, modern SVG brand symbol for state illustrations,
 * replacing the previous character mascot with an elegant geometric prism & compass.
 */
export default function KhweziMark({
  pose = "idle",
  className = "",
}: {
  pose?: KhweziPose;
  className?: string;
}) {
  return (
    <svg
      className={`khwezi-mark citylit-state-mark ${className}`}
      data-pose={pose}
      viewBox="0 0 180 200"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="citylitSparkGrad"
          x1="45"
          y1="45"
          x2="135"
          y2="135"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#a78bfa" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
        <radialGradient id="citylitGlowGrad" cx="90" cy="90" r="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7c3aed" stopOpacity="0.28" />
          <stop offset="1" stopColor="#7c3aed" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="90" cy="90" r="62" fill="url(#citylitGlowGrad)" />
      <rect
        x="36"
        y="36"
        width="108"
        height="108"
        rx="28"
        fill="#1e1b4b"
        stroke="rgba(167, 139, 250, 0.4)"
        strokeWidth="3"
      />
      {/* 4-point compass star / travel prism */}
      <path
        d="M90 48 L99 79 L132 90 L99 101 L90 132 L81 101 L48 90 L81 79 Z"
        fill="url(#citylitSparkGrad)"
      />
      <circle cx="90" cy="90" r="5" fill="#fde047" />
    </svg>
  );
}
