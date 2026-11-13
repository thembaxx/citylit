"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CaretDown, Check } from "@phosphor-icons/react";
import { benchoAudio } from "../../lib/bencho-audio";

export interface DropdownOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
  icon?: ReactNode;
}

interface DropdownSelectProps<T extends string = string> {
  value: T;
  options: readonly DropdownOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}

export function DropdownSelect<T extends string = string>({
  value,
  options,
  onChange,
  ariaLabel,
  className = "",
}: DropdownSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const reducedMotion = useReducedMotion();
  const listboxId = useId();

  const selectedOption = options.find((opt) => opt.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      const currentIdx = Math.max(
        0,
        options.findIndex((o) => o.value === value),
      );
      requestAnimationFrame(() => optionRefs.current[currentIdx]?.focus());
    }
  };

  const handleOptionKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      const next = (idx + 1) % options.length;
      optionRefs.current[next]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      const prev = (idx - 1 + options.length) % options.length;
      optionRefs.current[prev]?.focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      optionRefs.current[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      optionRefs.current[options.length - 1]?.focus();
    }
  };

  return (
    <div ref={rootRef} className={`citylit-dropdown ${open ? "is-open" : ""} ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        className="citylit-dropdown-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        onClick={() => {
          benchoAudio.playTap(820);
          setOpen((prev) => !prev);
        }}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className="citylit-dropdown-trigger-lead">
          {selectedOption?.icon && (
            <span className="citylit-dropdown-icon" aria-hidden="true">
              {selectedOption.icon}
            </span>
          )}
          <span className="citylit-dropdown-label">{selectedOption?.label}</span>
        </span>
        <CaretDown
          size={16}
          weight="bold"
          aria-hidden="true"
          className={`citylit-dropdown-caret ${open ? "is-rotated" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={listboxId}
            role="listbox"
            aria-label={ariaLabel}
            className="citylit-dropdown-menu"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: reducedMotion ? 0 : 0.16, ease: [0.22, 1, 0.36, 1] }}
          >
            {options.map((option, idx) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  ref={(el) => {
                    optionRefs.current[idx] = el;
                  }}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`citylit-dropdown-option ${isSelected ? "is-selected" : ""}`}
                  onClick={() => {
                    benchoAudio.playTap(860);
                    onChange(option.value);
                    setOpen(false);
                    triggerRef.current?.focus();
                  }}
                  onKeyDown={(e) => handleOptionKeyDown(e, idx)}
                >
                  <span className="citylit-dropdown-option-lead">
                    {option.icon && (
                      <span className="citylit-dropdown-icon" aria-hidden="true">
                        {option.icon}
                      </span>
                    )}
                    <span className="citylit-dropdown-option-text">
                      <span className="citylit-dropdown-option-label">{option.label}</span>
                      {option.description && (
                        <span className="citylit-dropdown-option-desc">{option.description}</span>
                      )}
                    </span>
                  </span>
                  {isSelected && (
                    <Check
                      size={16}
                      weight="bold"
                      aria-hidden="true"
                      className="citylit-dropdown-check"
                    />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DropdownSelect;
