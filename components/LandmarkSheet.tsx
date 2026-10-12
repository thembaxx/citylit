"use client";
import { ArrowUpRight, X } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import type { Photo } from "../lib/data";

type Props = {
  city: string;
  name: string;
  description: string;
  photo?: Photo;
  href?: string;
  onClose: () => void;
};

export default function LandmarkSheet({ city, name, description, photo, href, onClose }: Props) {
  const reduced = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <motion.div
      className="spot-layer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0 : 0.2 }}
      onClick={onClose}
    >
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-label={name}
        className="spot-sheet"
        initial={{ y: reduced ? 0 : 36 }}
        animate={{ y: 0 }}
        exit={{ y: reduced ? 0 : 28 }}
        transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          ref={closeRef}
          className="icon-button spot-close"
          onClick={onClose}
          aria-label="Close landmark"
        >
          <X size={18} weight="bold" />
        </button>
        <p className="spot-kicker">{city}</p>
        <h2>{name}</h2>
        <p>{description}</p>
        {photo && <img src={photo.src} alt={photo.alt} />}
        {href && (
          <a className="photo-link" href={href} target="_blank" rel="noreferrer">
            The story behind it <ArrowUpRight size={14} weight="bold" />
          </a>
        )}
      </motion.section>
    </motion.div>
  );
}
