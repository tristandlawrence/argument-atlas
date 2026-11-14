"use client";

import Link from "next/link";
import { useState } from "react";
import { Term } from "./Term";
import { CLASSIFICATION_COPY, EVIDENCE_LABEL, TAG_COPY, TYPE_LABEL } from "@/lib/copy";
import styles from "./ClassificationBadge.module.css";
import termStyles from "./Term.module.css";

/**
 * A badge that explains itself on hover or focus and opens its classification
 * page on click. Every place a type or topic appears behaves the same way.
 */
function BadgeLink({
  href,
  tooltip,
  className,
  children,
}: {
  href: string;
  tooltip: string;
  className: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <span className={termStyles.term}>
      <Link
        href={href}
        className={`${styles.badge} ${className}`}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </Link>
      {open && (
        <span className={`${termStyles.tooltip} ${termStyles.tooltipBelow}`} role="tooltip">
          {tooltip}
          <span className={styles.tooltipHint}>Click to see every claim with this label.</span>
        </span>
      )}
    </span>
  );
}

const TYPE_CLASS: Record<string, string> = {
  FACT: styles.typeFact,
  OPINION: styles.typeOpinion,
  VALUE: styles.typeValue,
  PROPOSAL: styles.typeProposal,
};

export function TypeBadge({ type }: { type: string }) {
  return (
    <BadgeLink href={`/type/${type.toLowerCase()}`} tooltip={CLASSIFICATION_COPY[type] ?? ""} className={TYPE_CLASS[type] ?? ""}>
      {TYPE_LABEL[type]?.toUpperCase() ?? type}
    </BadgeLink>
  );
}

const EVIDENCE_CLASS: Record<string, string> = {
  STRONG: "strong",
  MODERATE: "moderate",
  WEAK: "weak",
  NONE: "moderate",
};

export function EvidenceBadge({ evidenceStrength }: { evidenceStrength: string }) {
  return (
    <Term tooltip={CLASSIFICATION_COPY[evidenceStrength] ?? ""}>
      <span className={`${styles.badge} ${styles[EVIDENCE_CLASS[evidenceStrength] ?? "moderate"]}`}>
        {EVIDENCE_LABEL[evidenceStrength] ?? evidenceStrength}
      </span>
    </Term>
  );
}

/** Deterministic palette slot so the same topic is always the same colour. */
export function tagSlot(tag: string) {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) >>> 0;
  return h % 6;
}

export function TagBadge({ tag }: { tag: string }) {
  const slot = tagSlot(tag);
  return (
    <BadgeLink
      href={`/tag/${encodeURIComponent(tag.toLowerCase())}`}
      tooltip={TAG_COPY[tag] ?? `Claims tagged ${tag}.`}
      className={`${styles.tag} ${styles[`tag${slot}`]}`}
    >
      {tag}
    </BadgeLink>
  );
}
