"use client";

import { useState } from "react";
import styles from "./Term.module.css";

export function Term({
  children,
  tooltip,
  placement = "below",
  className,
}: {
  children: React.ReactNode;
  tooltip: string;
  placement?: "above" | "below";
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <span className={`${styles.term} ${className ?? ""}`}>
      <button
        type="button"
        className={styles.trigger}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        {children}
      </button>
      {open && (
        <span className={`${styles.tooltip} ${placement === "above" ? styles.tooltipAbove : styles.tooltipBelow}`}>
          {tooltip}
        </span>
      )}
    </span>
  );
}
