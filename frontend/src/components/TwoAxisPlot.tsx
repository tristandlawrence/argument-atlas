import type { Voice } from "@/lib/types";
import styles from "./TwoAxisPlot.module.css";

const STANCE_LABEL: Record<Voice["stance"], string> = { SUPPORTS: "for", CONTRADICTS: "against", MIXED: "mixed" };

export function TwoAxisPlot({
  dots,
  voices = [],
  variant = "full",
}: {
  dots: { left: number; top: number }[];
  /** Rated voices appear as rings at their aggregate position. Full variant only. */
  voices?: Voice[];
  variant?: "mini" | "full";
}) {
  const dotSize = variant === "mini" ? 5 : 7;
  const placed = variant === "full" ? voices.filter((v) => v.plot) : [];
  return (
    <div className={styles.wrap}>
      {variant === "full" && (
        <div className={styles.axisLabel}>
          <span className={styles.axisLabelText}>POORLY MADE &nbsp;→&nbsp; WELL MADE</span>
        </div>
      )}
      <div className={styles.plotColumn}>
        <div className={styles.plot}>
          <div className={`${styles.quadrant} ${styles.qSteelman}`} />
          <div className={`${styles.quadrant} ${styles.qCompelling}`} />
          <div className={`${styles.quadrant} ${styles.qWeak}`} />
          <div className={`${styles.quadrant} ${styles.qPartisan}`} />
          <div className={styles.vLine} />
          <div className={styles.hLine} />
          {variant === "full" && (
            <>
              <span className={`${styles.corner} ${styles.cornerTL}`}>STEELMAN</span>
              <span className={`${styles.corner} ${styles.cornerTR}`}>COMPELLING</span>
              <span className={`${styles.corner} ${styles.cornerBL}`}>WEAK</span>
              <span className={`${styles.corner} ${styles.cornerBR}`}>PARTISAN</span>
            </>
          )}
          {dots.map((dot, i) => (
            <span
              key={i}
              className={styles.dot}
              style={{ left: `${dot.left}%`, top: `${dot.top}%`, width: dotSize, height: dotSize }}
            />
          ))}
          {placed.map((v) => {
            const { left, top } = v.plot!;
            return (
              <a
                key={v.id}
                href={v.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.voiceRing}
                data-stance={v.stance}
                style={{ left: `${left}%`, top: `${top}%` }}
                aria-label={`${v.title} — ${v.outlet}, argues ${STANCE_LABEL[v.stance]}`}
              >
                <span
                  className={`${styles.voiceTip} ${top < 50 ? styles.voiceTipBelow : styles.voiceTipAbove} ${left < 50 ? styles.voiceTipRight : styles.voiceTipLeft}`}
                >
                  <span className={styles.voiceTipTitle}>{v.title}</span>
                  <span className={styles.voiceTipMeta}>
                    {v.outlet} · argues {STANCE_LABEL[v.stance]} · {v.raterCount} {v.raterCount === 1 ? "rater" : "raters"}
                  </span>
                </span>
              </a>
            );
          })}
        </div>
        {variant === "full" && (
          <div className={styles.footerAxis}>
            <span>DISAGREE</span>
            {placed.length > 0 && <span className={styles.footerNote}>○ rated voices</span>}
            <span>AGREE</span>
          </div>
        )}
      </div>
    </div>
  );
}
