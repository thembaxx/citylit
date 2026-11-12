"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, useReducedMotion, animate } from "motion/react";
import { useGesture } from "@use-gesture/react";
import { X, CaretLeft, CaretRight, MagnifyingGlassPlus } from "@phosphor-icons/react";
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
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const imageOpacity = useTransform(dragY, [0, 240], [1, 0.45]);
  const dialog = useRef<HTMLDialogElement>(null);
  const area = useRef<HTMLDivElement>(null);
  const image = images[index];
  useEffect(() => {
    setIndex(0);
  }, [name]);
  useEffect(() => {
    setScale(1);
    dragX.set(0);
    dragY.set(0);
  }, [index, open, dragX, dragY]);
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  const select = (dir: number) => setIndex((i) => (i + dir + images.length) % images.length);
  useGesture(
    {
      onPinch: ({ offset: [s] }) => setScale(s),
      onDrag: ({
        offset: [ox, oy],
        movement: [mx, my],
        velocity: [vx, vy],
        last,
        swipe: [swipeX],
      }) => {
        if (scale > 1) {
          dragX.set(ox);
          dragY.set(oy);
        } else {
          if (!last) {
            // Track phase: 1:1 mapping with pointer; rubber-band when dragging up past boundary
            const currentY = my > 0 ? my : my * 0.22;
            dragY.set(currentY);
            if (Math.abs(mx) > Math.abs(my) * 1.2) {
              dragX.set(mx * 0.35);
            }
          } else {
            // Release phase: dismiss on distance OR velocity
            const isDownward = (my > 80 || (vy > 0.45 && my > 20)) && my > Math.abs(mx) * 1.2;
            if (isDownward) {
              setOpen(false);
              dragX.set(0);
              dragY.set(0);
            } else if (swipeX || (Math.abs(vx) > 0.45 && Math.abs(mx) > 25)) {
              select((swipeX || mx) > 0 ? -1 : 1);
              animate(dragX, 0, { type: "spring", stiffness: 450, damping: 28 });
              animate(dragY, 0, { type: "spring", stiffness: 450, damping: 28 });
            } else {
              // Rapid snap-back seeded with velocity
              if (reduced) {
                dragX.set(0);
                dragY.set(0);
              } else {
                animate(dragY, 0, {
                  type: "spring",
                  stiffness: 450,
                  damping: 26,
                  velocity: vy * 1000,
                });
                animate(dragX, 0, {
                  type: "spring",
                  stiffness: 450,
                  damping: 26,
                  velocity: vx * 1000,
                });
              }
            }
          }
        }
      },
    },
    {
      target: area,
      pinch: { scaleBounds: { min: 1, max: 3 }, from: () => [scale, 0] },
      drag: { filterTaps: true, from: () => [dragX.get(), dragY.get()] },
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
          <MagnifyingGlassPlus size={17} weight="bold" /> Take a closer look
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
          <X size={18} weight="bold" />
        </button>
        <div ref={area} className="lightbox-image-area">
          <motion.div
            className="lightbox-image"
            style={{
              scale,
              x: dragX,
              y: dragY,
              opacity: reduced ? 1 : imageOpacity,
            }}
          >
            <Image src={image.src} alt={image.alt} fill sizes="90vw" draggable={false} />
          </motion.div>
        </div>
        <div className="lightbox-controls">
          <button className="round" onClick={() => select(-1)} aria-label="Previous photo">
            <CaretLeft size={22} weight="bold" />
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
            <CaretRight size={22} weight="bold" />
          </button>
        </div>
      </dialog>
    </>
  );
}
