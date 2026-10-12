"use client";
import { ArrowUpRight, X } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Photo } from "../lib/data";

export type LandmarkFact = { label: string; value: string };
export type LandmarkVideo = {
  src: string;
  title: string;
  author: string;
  license: string;
  licenseUrl?: string;
  sourceUrl: string;
};

type Props = {
  city: string;
  name: string;
  description: string;
  about?: string;
  aboutHref?: string;
  facts?: LandmarkFact[];
  photos?: Photo[];
  video?: LandmarkVideo;
  href?: string;
  detailsHref: string;
  detailsLabel: string;
  detailsHint: string;
  onClose: () => void;
};

export default function LandmarkSheet({
  city,
  name,
  description,
  about,
  aboutHref,
  facts,
  photos = [],
  video,
  href,
  detailsHref,
  detailsLabel,
  detailsHint,
  onClose,
}: Props) {
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
        <p className="spot-lead">{description}</p>
        <Link className="pill-button ivory-button spot-open" href={detailsHref} onClick={onClose}>
          <span>
            <strong>{detailsLabel}</strong>
            <small>{detailsHint}</small>
          </span>
          <ArrowUpRight size={18} weight="bold" />
        </Link>
        {!!facts?.length && (
          <ul className="spot-facts">
            {facts.map((fact) => (
              <li key={fact.label}>
                <span>{fact.label}</span>
                {fact.value}
              </li>
            ))}
          </ul>
        )}
        {!!photos.length && (
          <div className="spot-gallery">
            {photos.map((photo) => (
              <figure key={photo.src}>
                <img src={photo.src} alt={photo.alt} />
                <figcaption>
                  {photo.author} · {photo.license}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
        {about && <p className="spot-about">{about}</p>}
        {aboutHref && (
          <a className="photo-link" href={aboutHref} target="_blank" rel="noreferrer">
            Background from Wikipedia <ArrowUpRight size={14} weight="bold" />
          </a>
        )}
        {video && (
          <figure className="spot-film">
            <video controls playsInline preload="metadata" poster={photos[0]?.src}>
              <source src={video.src} />
            </video>
            <figcaption>
              {video.title} · {video.author} · {video.license}
            </figcaption>
          </figure>
        )}
        {href && (
          <a className="photo-link" href={href} target="_blank" rel="noreferrer">
            The story behind it <ArrowUpRight size={14} weight="bold" />
          </a>
        )}
      </motion.section>
    </motion.div>
  );
}
