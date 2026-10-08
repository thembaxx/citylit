"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useGesture } from "@use-gesture/react";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import type { Photo } from "../lib/data";
export default function Gallery({
  images,
  context,
  name,
}: {
  images: Photo[];
  context: string;
  name: string;
}) {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<[number, number]>([0, 0]);
  const dialog = useRef<HTMLDialogElement>(null);
  const area = useRef<HTMLDivElement>(null);
  const image = images[index];
  useEffect(() => {
    setIndex(0);
  }, [name]);
  useEffect(() => {
    setScale(1);
    setOffset([0, 0]);
  }, [index, open]);
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  const select = (dir: number) => setIndex((i) => (i + dir + images.length) % images.length);
  useGesture(
    {
      onPinch: ({ offset: [s] }) => setScale(s),
      onDrag: ({ offset: [x, y], movement: [mx, my], last, swipe: [swipe] }) => {
        if (scale > 1) setOffset([x, y]);
        else if (last && my > 100 && my > Math.abs(mx) * 1.5) setOpen(false);
        else if (last && swipe) select(swipe > 0 ? -1 : 1);
      },
    },
    {
      target: area,
      pinch: { scaleBounds: { min: 1, max: 3 }, from: () => [scale, 0] },
      drag: { filterTaps: true, from: () => offset },
    },
  );
  if (!image)
    return (
      <div className="gallery-empty">Venue photos are available on the official website below.</div>
    );
  return (
    <>
      <button
        className="photo-hero gallery-hero"
        onClick={() => setOpen(true)}
        aria-label={`Open ${context === "city" ? "city" : "venue"} photo gallery`}
      >
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="(max-width: 640px) 100vw,60vw"
          preload
          className="gallery-image"
        />
        <span>
          {context === "city" ? "CITY ATMOSPHERE" : "IN PICTURES"} · {index + 1} / {images.length}
        </span>
        <span className="gallery-zoom">
          <ZoomIn size={17} /> Take a closer look
        </span>
      </button>
      <div className="gallery-thumbs">
        {images.map((im, i) => (
          <button
            key={im.src}
            className={i === index ? "selected" : ""}
            onClick={() => setIndex(i)}
            aria-label={`Show photo ${i + 1}`}
          >
            <Image src={im.src} alt={im.alt} width={105} height={70} sizes="105px" />
          </button>
        ))}
      </div>
      <p className="photo-credit">
        <a href={image.sourceUrl} target="_blank" rel="noreferrer">
          Photo: {image.author || "Wikimedia Commons"}
        </a>{" "}
        ·{" "}
        <a href={image.licenseUrl || image.sourceUrl} target="_blank" rel="noreferrer">
          {image.license}
        </a>
        {context === "city" && " · City photograph, not the venue"}
      </p>
      <dialog
        ref={dialog}
        closedby="any"
        onClose={() => setOpen(false)}
        className="gallery-dialog"
        aria-label={`${name} photograph gallery`}
        onCancel={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === dialog.current) setOpen(false);
        }}
      >
        <button
          className="round lightbox-close"
          aria-label="Close gallery"
          onClick={() => setOpen(false)}
        >
          <X />
        </button>
        <div ref={area} className="lightbox-image-area">
          <motion.div
            className="lightbox-image"
            animate={{ scale, x: offset[0], y: offset[1] }}
            transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 30 }}
          >
            <Image src={image.src} alt={image.alt} fill sizes="90vw" draggable={false} />
          </motion.div>
        </div>
        <div className="lightbox-controls">
          <button className="round" onClick={() => select(-1)} aria-label="Previous photo">
            <ChevronLeft />
          </button>
          <div>
            <span>
              {index + 1} / {images.length} · PINCH TO ZOOM · SWIPE DOWN TO CLOSE
            </span>
            <a href={image.sourceUrl} target="_blank" rel="noreferrer">
              {image.author} · {image.license}
            </a>
          </div>
          <button className="round" onClick={() => select(1)} aria-label="Next photo">
            <ChevronRight />
          </button>
        </div>
      </dialog>
    </>
  );
}
