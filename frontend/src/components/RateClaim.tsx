"use client";

import { useState } from "react";
import { TwoAxisPlot } from "./TwoAxisPlot";
import { voteClaim } from "@/lib/api";
import type { VoteStats } from "@/lib/types";
import styles from "./RateClaim.module.css";

export function RateClaim({
  claimId,
  votes,
  onMutated,
}: {
  claimId: string;
  votes: VoteStats;
  onMutated: () => void;
}) {
  const [agree, setAgree] = useState<boolean | null>(null);
  const [well, setWell] = useState<boolean | null>(null);

  async function set(nextAgree: boolean | null, nextWell: boolean | null) {
    setAgree(nextAgree);
    setWell(nextWell);
    if (nextAgree !== null && nextWell !== null) {
      await voteClaim(claimId, nextAgree, nextWell);
      onMutated();
    }
  }

  return (
    <div className={styles.panel}>
      <div className={styles.grid}>
        <div>
          <h2 className={styles.heading}>NOW RATE THE CLAIM</h2>
          <p className={styles.blurb}>
            Two independent signals. You can disagree with a claim and still judge it well made — that&rsquo;s the
            answer worth having.
          </p>
          <div className={styles.signalRow}>
            <span className={styles.signalLabel}>Do you agree?</span>
            <button
              type="button"
              className={`${styles.choice} ${agree === true ? styles.choiceActive : ""}`}
              onClick={() => set(true, well)}
            >
              ▲ Yes
            </button>
            <button
              type="button"
              className={`${styles.choice} ${agree === false ? styles.choiceActive : ""}`}
              onClick={() => set(false, well)}
            >
              ▼ No
            </button>
          </div>
          <div className={styles.signalRow}>
            <span className={styles.signalLabel}>Well constructed?</span>
            <button
              type="button"
              className={`${styles.choice} ${well === true ? styles.choiceActive : ""}`}
              onClick={() => set(agree, true)}
            >
              ▲ Yes
            </button>
            <button
              type="button"
              className={`${styles.choice} ${well === false ? styles.choiceActive : ""}`}
              onClick={() => set(agree, false)}
            >
              ▼ No
            </button>
          </div>
        </div>

        <div>
          <TwoAxisPlot dots={votes.scatter} variant="full" />
          <div className={styles.statsRow}>
            <span>
              <strong>{votes.agreePct === null ? "—" : `${votes.agreePct}%`}</strong> agree
            </span>
            <span>
              <strong>{votes.wellConstructedPct === null ? "—" : `${votes.wellConstructedPct}%`}</strong> well made
            </span>
            <span>
              <strong>{votes.raterCount}</strong> raters
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
