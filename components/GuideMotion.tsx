"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const REVEAL_TARGETS = [
  ".atlas-section-heading",
  ".atlas-directory-tools",
  ".atlas-city-facts",
  ".atlas-venue-heading",
  ".atlas-visit-panel",
  ".atlas-stage-sheet",
  ".atlas-story-facts",
].join(", ");

export default function GuideMotion({ essential }: { essential: boolean }) {
  const path = usePathname();
  useEffect(() => {
    if (essential || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const host = document.querySelector(".reference-guide");
    if (!host) return;
    gsap.registerPlugin(ScrollTrigger);
    const context = gsap.context(() => {
      gsap.fromTo(
        host.querySelectorAll("h1"),
        { y: 12 },
        { y: 0, duration: 0.56, ease: "power3.out" },
      );

      // Keep content fully opaque during reveals. Fading text panels reduces
      // their effective contrast below WCAG AA while the animation runs.
      // Translation alone preserves the motion without weakening readability.
      host.querySelectorAll(REVEAL_TARGETS).forEach((element) => {
        gsap.fromTo(
          element,
          { y: 12 },
          {
            y: 0,
            duration: 0.56,
            ease: "power3.out",
            scrollTrigger: {
              trigger: element,
              scroller: host,
              start: "top 92%",
              once: true,
            },
          },
        );
      });
    }, host);
    return () => context.revert();
  }, [path, essential]);
  return null;
}
