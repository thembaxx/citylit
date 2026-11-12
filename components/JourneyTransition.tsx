"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useReducedMotion } from "motion/react";
import { Compass } from "@phosphor-icons/react";
import gsap from "gsap";
import { cities } from "../lib/data";
import { useKhwezi } from "./KhweziProvider";

type PendingRoute = { key: string; label: string };
type PortalDetail = { label: string; x?: number; y?: number; href?: string };

function routeLabel(pathname: string, search: string) {
  const query = new URLSearchParams(search);
  if (query.get("view") === "3d") return "The 3D atlas";
  if (query.get("view") === "guide") return "The city guide";
  if (query.get("tab") === "day") return "Your day";
  if (pathname === "/") return "The living atlas";
  if (pathname === "/destinations") return "All cities";
  if (pathname === "/explore") return "Your discoveries";
  const city = cities.find(
    (item) => pathname === `/${item.slug}` || pathname.startsWith(`/${item.slug}/`),
  );
  if (!city) return "Your next discovery";
  if (pathname.endsWith("/landmarks")) return `${city.name} landmarks`;
  if (pathname.endsWith("/places")) return `${city.name} places`;
  return city.name;
}

export default function JourneyTransition() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const view = searchParams.get("view");
  const routeKey = `${pathname}${search ? `?${search}` : ""}`;
  const reduced = !!useReducedMotion();
  const { feedback } = useKhwezi();
  const veilRef = useRef<HTMLDivElement>(null);
  const lastRoute = useRef(routeKey);
  const lastScreen = useRef({ pathname, view });
  const pending = useRef<PendingRoute | null>(null);
  const covered = useRef(false);
  const routeChanged = useRef(false);
  const focusAfterReveal = useRef(false);
  const coverTween = useRef<gsap.core.Tween | null>(null);
  const revealTween = useRef<gsap.core.Tween | null>(null);
  const fallbackTimer = useRef<number | null>(null);
  const announcementTimer = useRef<number | null>(null);
  const [label, setLabel] = useState("The living atlas");
  const [announcement, setAnnouncement] = useState("");

  const finish = useCallback(() => {
    const veil = veilRef.current;
    if (veil) veil.style.visibility = "hidden";
    if (focusAfterReveal.current) {
      document
        .querySelector<HTMLElement>("#guide-main, main.game-screen")
        ?.focus({ preventScroll: true });
    }
    pending.current = null;
    covered.current = false;
    routeChanged.current = false;
    focusAfterReveal.current = false;
    if (announcementTimer.current) window.clearTimeout(announcementTimer.current);
    announcementTimer.current = window.setTimeout(() => setAnnouncement(""), 1400);
  }, []);

  const reveal = useCallback(() => {
    const veil = veilRef.current;
    if (!veil) return;
    coverTween.current?.kill();
    revealTween.current?.kill();
    const x = veil.dataset.portalX || `${window.innerWidth / 2}px`;
    const y = veil.dataset.portalY || `${window.innerHeight / 2}px`;
    veil.style.visibility = "visible";
    if (CSS.supports("clip-path", "circle(1px at 1px 1px)")) {
      veil.style.opacity = "1";
      revealTween.current = gsap.to(veil, {
        clipPath: `circle(0px at ${x} ${y})`,
        duration: 0.24,
        ease: "power3.out",
        onComplete: finish,
      });
    } else {
      revealTween.current = gsap.to(veil, {
        opacity: 0,
        duration: 0.18,
        ease: "power2.out",
        onComplete: finish,
      });
    }
  }, [finish]);

  const cover = useCallback(
    (key: string, nextLabel: string, x: number, y: number, local = false) => {
      if (reduced) return;
      const veil = veilRef.current;
      if (!veil) return;
      if (fallbackTimer.current) window.clearTimeout(fallbackTimer.current);
      pending.current = { key, label: nextLabel };
      routeChanged.current = false;
      covered.current = false;
      focusAfterReveal.current = false;
      setLabel(nextLabel);
      setAnnouncement(`Following the trail to ${nextLabel}.`);
      veil.dataset.portalX = `${x}px`;
      veil.dataset.portalY = `${y}px`;
      veil.style.setProperty("--portal-x", `${x}px`);
      veil.style.setProperty("--portal-y", `${y}px`);
      veil.style.visibility = "visible";
      veil.style.opacity = "1";
      coverTween.current?.kill();
      revealTween.current?.kill();

      const complete = () => {
        covered.current = true;
        if (local || routeChanged.current) reveal();
      };
      if (CSS.supports("clip-path", "circle(1px at 1px 1px)")) {
        coverTween.current = gsap.fromTo(
          veil,
          { clipPath: `circle(0px at ${x}px ${y}px)` },
          {
            clipPath: `circle(160vmax at ${x}px ${y}px)`,
            duration: 0.18,
            ease: "power2.out",
            onComplete: complete,
          },
        );
      } else {
        coverTween.current = gsap.fromTo(
          veil,
          { opacity: 0 },
          { opacity: 1, duration: 0.14, onComplete: complete },
        );
      }
      if (!local) {
        fallbackTimer.current = window.setTimeout(() => {
          if (!routeChanged.current) reveal();
        }, 2400);
      }
    },
    [reduced, reveal],
  );

  useLayoutEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        reduced
      )
        return;
      const link =
        event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (
        !link ||
        !link.dataset.transitionLabel ||
        link.hasAttribute("download") ||
        (link.target && link.target !== "_self")
      )
        return;
      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      const key = `${destination.pathname}${destination.search}`;
      if (key === lastRoute.current) return;
      const nextLabel =
        link.dataset.transitionLabel || routeLabel(destination.pathname, destination.search);
      cover(
        key,
        nextLabel,
        event.detail === 0 ? window.innerWidth / 2 : event.clientX,
        event.detail === 0 ? window.innerHeight / 2 : event.clientY,
      );
    };
    const onPortal = (event: Event) => {
      const { label: nextLabel, x, y, href } = (event as CustomEvent<PortalDetail>).detail;
      cover(
        href || `local:${performance.now()}`,
        nextLabel,
        x ?? window.innerWidth / 2,
        y ?? window.innerHeight / 2,
        !href,
      );
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener("citylit:portal", onPortal);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("citylit:portal", onPortal);
      coverTween.current?.kill();
      revealTween.current?.kill();
      if (fallbackTimer.current) window.clearTimeout(fallbackTimer.current);
      if (announcementTimer.current) window.clearTimeout(announcementTimer.current);
    };
  }, [cover, reduced]);

  useLayoutEffect(() => {
    if (lastRoute.current === routeKey) return;
    lastRoute.current = routeKey;
    const shouldFocus =
      lastScreen.current.pathname !== pathname || lastScreen.current.view !== view;
    lastScreen.current = { pathname, view };
    const nextLabel =
      pending.current?.key === routeKey ? pending.current.label : routeLabel(pathname, search);
    setLabel(nextLabel);
    setAnnouncement(`${nextLabel}.`);
    feedback("swipe");
    focusAfterReveal.current = shouldFocus;
    routeChanged.current = true;

    if (reduced) {
      if (shouldFocus) {
        document
          .querySelector<HTMLElement>("#guide-main, main.game-screen")
          ?.focus({ preventScroll: true });
      }
      return;
    }
    if (fallbackTimer.current) window.clearTimeout(fallbackTimer.current);
    if (pending.current?.key === routeKey) {
      if (covered.current) reveal();
      return;
    }
    if (shouldFocus) {
      document
        .querySelector<HTMLElement>("#guide-main, main.game-screen")
        ?.focus({ preventScroll: true });
    }
  }, [routeKey, pathname, search, view, reduced, feedback, reveal]);

  return (
    <>
      <div
        ref={veilRef}
        className="journey-transition"
        aria-hidden="true"
        style={{ visibility: "hidden" }}
      >
        <div className="journey-transition-orbit" />
        <div className="journey-transition-copy">
          <span className="journey-transition-mark">
            <Compass size={22} weight="duotone" />
          </span>
          <strong>{label}</strong>
        </div>
      </div>
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
    </>
  );
}
