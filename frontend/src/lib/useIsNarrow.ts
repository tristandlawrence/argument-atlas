"use client";

import { useEffect, useState } from "react";

export function useIsNarrow(breakpoint = 720) {
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    setNarrow(mq.matches);
    const listener = (e: MediaQueryListEvent) => setNarrow(e.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, [breakpoint]);

  return narrow;
}
