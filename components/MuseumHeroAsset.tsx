"use client";

import MuseumShowcase, { type MuseumProps } from "./MuseumShowcase";

/**
 * The heritage museum is generated entirely at runtime with Three.js geometry
 * and procedural PBR surfaces. No GLB, Draco decoder, external model, or
 * Blender-authored asset is loaded by this component.
 *
 * Keep the component boundary stable for ExpandedLandmark and preserve the
 * existing roof/landscape exploded view, night lighting, reduced motion, and
 * feature hotspots implemented by MuseumShowcase.
 */
export default function MuseumHeroAsset(props: MuseumProps) {
  return <MuseumShowcase {...props} />;
}
