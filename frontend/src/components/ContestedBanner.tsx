import styles from "./ContestedBanner.module.css";

export function ContestedBanner({ reason, until }: { reason: string; until: string }) {
  const untilLabel = new Date(until).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
  return (
    <div className={styles.banner}>
      <span className={styles.title}>CONTESTED</span>
      <span className={styles.reason}>{reason}</span>
      <span className={styles.note}>
        Reading, rating and commenting stay open. Edits from non-moderators queue for review until this expires on {untilLabel}.
      </span>
    </div>
  );
}
