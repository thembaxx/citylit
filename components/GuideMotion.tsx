"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

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
        { y: 24, opacity: 0.3 },
        { y: 0, opacity: 1, duration: 0.85, ease: "power3.out" },
      );
      host.querySelectorAll(".atlas-section-heading, .atlas-city-facts").forEach((element) => {
        gsap.fromTo(
          element,
          { y: 20, opacity: 0.3 },
          {
            y: 0,
            opacity: 1,
            duration: 0.65,
            scrollTrigger: { trigger: element, scroller: host, start: "top 94%", once: true },
          },
        );
      });
    }, host);
    return () => context.revert();
  }, [path, essential]);
  return null;
}
