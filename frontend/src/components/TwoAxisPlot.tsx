import styles from "./TwoAxisPlot.module.css";

export function TwoAxisPlot({
  dots,
  variant = "full",
}: {
  dots: { left: number; top: number }[];
  variant?: "mini" | "full";
}) {
  const dotSize = variant === "mini" ? 5 : 7;
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
        </div>
        {variant === "full" && (
          <div className={styles.footerAxis}>
            <span>DISAGREE</span>
            <span>AGREE</span>
          </div>
        )}
      </div>
    </div>
  );
}
