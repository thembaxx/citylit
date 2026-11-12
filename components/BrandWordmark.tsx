"use client";

import { Compass } from "@phosphor-icons/react";

/** Clean, modern brand mark for Citylit with Phosphor icon accent. */
export default function BrandWordmark() {
  return (
    <span className="wordmark citylit-logo" role="img" aria-label="cıtylit">
      <span className="citylit-logo-symbol-wrap" aria-hidden="true">
        <Compass size={22} weight="fill" className="citylit-brand-icon" />
      </span>
      <span className="wordmark-letters" aria-hidden="true">
        c
        <span className="wordmark-i">
          ı<span className="wordmark-spark" />
        </span>
        tylit
      </span>
    </span>
  );
}
