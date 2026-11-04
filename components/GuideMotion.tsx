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
        { y: 16, opacity: 0.85 },
        { y: 0, opacity: 1, duration: 0.75, ease: "power3.out" },
      );

      // Reveals never change layout dimensions or interfere with WebGL dragging.
      host.querySelectorAll(REVEAL_TARGETS).forEach((element) => {
        gsap.fromTo(
          element,
          { y: 16, opacity: 0.85 },
          {
            y: 0,
            opacity: 1,
            duration: 0.68,
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
