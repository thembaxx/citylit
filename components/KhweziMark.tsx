import type { KhweziPose } from "../lib/brand";

// Original vector counterpart of the procedural model: no textures or network assets.
export default function KhweziMark({
  pose = "idle",
  className = "",
}: {
  pose?: KhweziPose;
  className?: string;
}) {
  return (
    <svg
      className={`khwezi-mark ${className}`}
      data-pose={pose}
      viewBox="0 0 180 200"
      fill="none"
      aria-hidden="true"
    >
      <ellipse cx="92" cy="184" rx="43" ry="7" fill="currentColor" opacity=".08" />
      <g className="khwezi-body">
        <path
          d="M120 151Q156 160 147 120Q147 106 138 109"
          stroke="#17243C"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <g className="khwezi-ear khwezi-ear-left">
          <path d="M64 96 45 43 50 14 66 29 78 92Z" fill="#F3EFE3" />
          <path d="m45 43 5-29 16 15-9 22Z" fill="#17243C" />
          <path d="m60 53 10 38-8-3-10-34Z" fill="#E9B2BA" />
        </g>
        <g className="khwezi-ear khwezi-ear-right">
          <path d="m102 92 9-67 15-12 9 27-20 57Z" fill="#F3EFE3" />
          <path d="m111 25 15-12 9 27-13 9Z" fill="#17243C" />
          <path d="m119 56-9 34 8-2 12-33Z" fill="#E9B2BA" />
        </g>
        <path d="m63 135-9 33 16 14 23-6 23 6 13-14-10-33Z" fill="#DED8CE" />
        <path d="m67 133-8 21 34 18 29-21-6-20Z" fill="#F3EFE3" />
        <path d="m53 172 17-6 13 13-5 10H48l-3-7Z" fill="#17243C" />
        <path d="m111 166 18 6 8 10-3 7h-32l-4-10Z" fill="#17243C" />
        <path d="m49 99 20-22 41-1 24 20-2 28-23 21-38-1-25-21Z" fill="#F3EFE3" />
        <path d="m49 99-3 24 25 21 20-2-27-17Z" fill="#DED8CE" />
        <path d="m110 76 24 20-2 28-23 21 10-33Z" fill="#E5DED4" />
        <path d="m68 137-15 8 1 15 13-2 11-13Z" fill="#F3EFE3" />
        <path d="m113 137 16 8-1 15-13-2-11-13Z" fill="#F3EFE3" />
        <g className="khwezi-eyes">
          <ellipse cx="72" cy="109" rx="6" ry="8" fill="#17243C" />
          <ellipse cx="108" cy="109" rx="6" ry="8" fill="#17243C" />
          <circle cx="74" cy="107" r="2" fill="white" />
          <circle cx="110" cy="107" r="2" fill="white" />
        </g>
        <path d="m85 123 6-5 6 5-6 6Z" fill="#6558F5" />
        <path d="M83 132q8 7 16 0" stroke="#17243C" strokeWidth="2.5" strokeLinecap="round" />
        <path d="m90 84 7 8-7 8-7-8Z" fill="var(--khwezi-spark, #6558F5)" />
        {pose === "welcome" && (
          <g className="khwezi-prop">
            <path d="m68 141 17-5 13 6 16-5v25l-16 5-13-6-17 5Z" fill="#7B82C7" />
            <path d="m85 136 13 6v25l-13-6Z" fill="#C3D2ED" />
            <path d="m73 148 13-3 8 6 14-5" stroke="#F3EFE3" strokeWidth="2" />
          </g>
        )}
        {pose === "search" && (
          <g className="khwezi-prop">
            <circle
              cx="122"
              cy="112"
              r="17"
              fill="#8DC6E8"
              fillOpacity=".3"
              stroke="#6558F5"
              strokeWidth="5"
            />
            <path d="m134 126 12 14" stroke="#17243C" strokeWidth="7" strokeLinecap="round" />
          </g>
        )}
      </g>
      {pose === "offline" && (
        <g className="khwezi-lantern">
          <path d="m141 154 10-9 10 9Z" fill="#17243C" />
          <path d="M143 154h16v23h-16Z" fill="#F3C975" />
          <path d="M143 154h16v23h-16ZM151 154v23" stroke="#17243C" strokeWidth="3" />
          <path d="M145 177h12" stroke="#17243C" strokeWidth="4" />
        </g>
      )}
      {(pose === "saved" || pose === "loading" || pose === "gesture") && (
        <g className="khwezi-orbit-spark">
          <path d="m145 66 9 13-9 13-9-13Z" fill="var(--khwezi-spark, #6558F5)" />
          <path d="m145 66 9 13h-9Z" fill="#C7C0FF" />
        </g>
      )}
    </svg>
  );
}
