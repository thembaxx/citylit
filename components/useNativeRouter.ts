"use client";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
/** Offline route changes need a document navigation so the worker can open the pocket guide. */
export function useNativeRouter() {
  const router = useRouter();
  return useMemo(
    () => ({
      ...router,
      push: (href: string, options?: { scroll?: boolean }) => {
        if (!navigator.onLine) window.location.assign(href);
        else router.push(href, options);
      },
      replace: (href: string, options?: { scroll?: boolean }) => {
        if (!navigator.onLine) window.location.replace(href);
        else router.replace(href, options);
      },
    }),
    [router],
  );
}
