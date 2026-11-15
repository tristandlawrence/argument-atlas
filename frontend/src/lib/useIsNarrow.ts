"use client";

import { useSyncExternalStore } from "react";

/** True on touch-sized viewports, where hover cards expand inline instead of floating. */
export function useIsNarrow(breakpoint = 720) {
  const query = `(max-width: ${breakpoint}px)`;
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}
