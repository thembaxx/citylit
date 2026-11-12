import { type KeyboardEvent, type RefObject } from "react";

/**
 * Headless roving focus keyboard handler inspired by Vercel Labs ui-sdk (createRovingFocus).
 * Moves focus and selection across a horizontal or vertical group of controls.
 */
export function handleRovingKeyDown<T extends HTMLElement>(
  event: KeyboardEvent<T>,
  index: number,
  count: number,
  refs: RefObject<Array<T | null>>,
  onSelect: (nextIndex: number) => void,
  orientation: "horizontal" | "vertical" = "horizontal",
) {
  if (count <= 0) return;

  const prevKey = orientation === "horizontal" ? "ArrowLeft" : "ArrowUp";
  const nextKey = orientation === "horizontal" ? "ArrowRight" : "ArrowDown";

  let nextIndex = -1;
  if (event.key === nextKey) {
    nextIndex = (index + 1) % count;
  } else if (event.key === prevKey) {
    nextIndex = (index - 1 + count) % count;
  } else if (event.key === "Home") {
    nextIndex = 0;
  } else if (event.key === "End") {
    nextIndex = count - 1;
  } else {
    return;
  }

  event.preventDefault();
  onSelect(nextIndex);
  refs.current[nextIndex]?.focus();
}

/**
 * Focus recovery helper inspired by Vercel Labs ui-sdk (createFocusRecovery).
 * Ensures focus returns to a stable target (e.g. search input) when a transient control unmounts.
 */
export function recoverFocus(target: HTMLElement | null | undefined) {
  if (!target) return;
  requestAnimationFrame(() => {
    target.focus();
  });
}
