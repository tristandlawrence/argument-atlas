import { Term } from "./Term";
import { CLASSIFICATION_COPY, EVIDENCE_LABEL } from "@/lib/copy";
import styles from "./ClassificationBadge.module.css";

export function TypeBadge({ type }: { type: string }) {
  return (
    <Term tooltip={CLASSIFICATION_COPY[type] ?? ""}>
      <span className={styles.badge}>{type}</span>
    </Term>
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

export function TagBadge({ tag }: { tag: string }) {
  return <span className={`${styles.badge} ${styles.tag}`}>{tag}</span>;
}
