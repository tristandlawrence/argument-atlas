import { Term } from "./Term";
import styles from "./ScoreBar.module.css";

export function ScoreBar({ label, tooltip, pct }: { label: string; tooltip: string; pct: number | null }) {
  return (
    <div className={styles.row}>
      <Term tooltip={tooltip} placement="above" className={styles.label}>
        {label}
      </Term>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${pct ?? 0}%` }} />
      </div>
      <span className={styles.value}>{pct === null ? "—" : `${pct}%`}</span>
    </div>
  );
}
