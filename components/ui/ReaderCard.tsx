"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { X, BookOpen } from "@phosphor-icons/react";

interface ReaderCardProps {
  title: string;
  subtitle?: string;
  author?: string;
  excerpt: string;
  fullText: string;
  category?: string;
  className?: string;
  coverImage?: ReactNode;
}

/**
 * Editorial Reader Card adapted from Pin UI (pinui.xyz).
 * Features high-contrast serif typography, vertical gradient mask cutoff,
 * and a spring-animated expansion into a focused distraction-free reading view.
 */
export function ReaderCard({
  title,
  subtitle,
  author,
  excerpt,
  fullText,
  category = "Story",
  className = "",
  coverImage,
}: ReaderCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [fontSize, setFontSize] = useState<"normal" | "large" | "xlarge">("normal");
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const reducedMotion = useReducedMotion();

  // Escape key handler and focus restore
  useEffect(() => {
    if (!isOpen) {
      openButtonRef.current?.focus();
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const fontSizeClass =
    fontSize === "large" ? "text-lg" : fontSize === "xlarge" ? "text-xl" : "text-base";

  return (
    <>
      {/* Compact Reader Card */}
      <article className={`pin-reader-card-root ${className}`.trim()}>
        {coverImage && <div className="pin-reader-media">{coverImage}</div>}
        <div className="pin-reader-body">
          <div className="pin-reader-badge">
            <BookOpen size={12} weight="bold" />
            <span>{category}</span>
          </div>
          <h3 className="pin-reader-title">{title}</h3>
          {subtitle && <p className="pin-reader-subtitle">{subtitle}</p>}
          <div className="pin-reader-excerpt-container">
            <p className="pin-reader-excerpt">{excerpt}</p>
          </div>
          <div className="pin-reader-footer">
            {author && <span className="pin-reader-author">{author}</span>}
            <button
              ref={openButtonRef}
              type="button"
              className="pin-reader-open-btn"
              onClick={() => setIsOpen(true)}
              aria-label={`Open story: ${title}`}
            >
              <span>Read Story</span>
            </button>
          </div>
        </div>
      </article>

      {/* Expanded Reader Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="pin-reader-backdrop" onClick={() => setIsOpen(false)} role="presentation">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="reader-modal-title"
              className="pin-reader-modal"
              onClick={(e) => e.stopPropagation()}
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
              animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Modal Toolbar */}
              <div className="pin-reader-toolbar">
                <div className="pin-reader-toolbar-left">
                  <span className="pin-reader-modal-badge">{category}</span>
                </div>
                <div className="pin-reader-toolbar-center">
                  <div className="pin-reader-font-controls" role="group" aria-label="Text sizing">
                    <button
                      type="button"
                      className={`pin-font-btn ${fontSize === "normal" ? "is-active" : ""}`}
                      onClick={() => setFontSize("normal")}
                      aria-label="Standard text size"
                      title="Standard text"
                    >
                      A
                    </button>
                    <button
                      type="button"
                      className={`pin-font-btn text-md ${fontSize === "large" ? "is-active" : ""}`}
                      onClick={() => setFontSize("large")}
                      aria-label="Large text size"
                      title="Large text"
                    >
                      A+
                    </button>
                    <button
                      type="button"
                      className={`pin-font-btn text-lg ${fontSize === "xlarge" ? "is-active" : ""}`}
                      onClick={() => setFontSize("xlarge")}
                      aria-label="Extra large text size"
                      title="Extra large text"
                    >
                      A++
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  className="pin-reader-close-btn"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close reader"
                >
                  <X size={18} weight="bold" />
                </button>
              </div>

              {/* Reader Content */}
              <div className="pin-reader-scrollable">
                <header className="pin-reader-header">
                  <h2 id="reader-modal-title" className="pin-reader-modal-heading">
                    {title}
                  </h2>
                  {subtitle && <p className="pin-reader-modal-sub">{subtitle}</p>}
                  {author && <p className="pin-reader-modal-meta">By {author}</p>}
                </header>

                <div className={`pin-reader-prose ${fontSizeClass}`}>
                  {fullText.split("\n\n").map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default ReaderCard;
