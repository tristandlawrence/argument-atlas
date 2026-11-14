"use client";

import { useState } from "react";
import { TwoAxisPlot } from "./TwoAxisPlot";
import { voteClaim, voteVoice } from "@/lib/api";
import type { Voice, VoteStats } from "@/lib/types";
import styles from "./RateClaim.module.css";

const STANCE: Record<Voice["stance"], { label: string; color: string }> = {
  SUPPORTS: { label: "FOR", color: "var(--supports-ink)" },
  CONTRADICTS: { label: "AGAINST", color: "var(--contradicts)" },
  MIXED: { label: "MIXED", color: "var(--accent)" },
};

export function RateClaim({
  claimId,
  claimTitle,
  votes,
  voices,
  onMutated,
}: {
  claimId: string;
  claimTitle: string;
  votes: VoteStats;
  voices: Voice[];
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
          <p className={styles.restate}>&ldquo;{claimTitle}&rdquo;</p>
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
          <TwoAxisPlot dots={votes.scatter} voices={voices} variant="full" />
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

      <Voices voices={voices} onMutated={onMutated} />
    </div>
  );
}

function Voices({ voices, onMutated }: { voices: Voice[]; onMutated: () => void }) {
  return (
    <div className={styles.voices}>
      <div className={styles.voicesHeader}>
        <h3 className={styles.voicesHeading}>WHO ARGUES THIS IN PUBLIC</h3>
        <span className={styles.voicesNote}>
          Voices are not evidence. Rate one and it appears on the chart as a ring.
        </span>
      </div>
      {voices.length === 0 ? (
        <p className={styles.voicesEmpty}>No voices attached yet. Add an op-ed, explainer, speech or submission from the edit panel.</p>
      ) : (
        <div className={styles.voiceList}>
          {voices.map((v) => (
            <VoiceRow key={v.id} voice={v} onMutated={onMutated} />
          ))}
        </div>
      )}
    </div>
  );
}

function VoiceRow({ voice, onMutated }: { voice: Voice; onMutated: () => void }) {
  const [agree, setAgree] = useState<boolean | null>(null);
  const [well, setWell] = useState<boolean | null>(null);
  const stance = STANCE[voice.stance];

  async function set(nextAgree: boolean | null, nextWell: boolean | null) {
    setAgree(nextAgree);
    setWell(nextWell);
    if (nextAgree !== null && nextWell !== null) {
      await voteVoice(voice.id, nextAgree, nextWell);
      onMutated();
    }
  }

  return (
    <div className={styles.voiceRow}>
      <span className={styles.voiceStance} style={{ color: stance.color }}>
        {stance.label}
      </span>
      <div className={styles.voiceMain}>
        <a href={voice.url} target="_blank" rel="noopener noreferrer" className={styles.voiceTitle}>
          {voice.title}
        </a>
        <div className={styles.voiceMeta}>
          {voice.outlet}
          {voice.author ? ` · ${voice.author}` : ""} · {voice.kind}
          {voice.raterCount > 0
            ? ` · ${voice.agreePct}% persuaded · ${voice.wellConstructedPct}% well made · ${voice.raterCount} ${voice.raterCount === 1 ? "rater" : "raters"}`
            : " · not yet rated"}
        </div>
      </div>
      <div className={styles.voiceControls}>
        <span className={styles.voiceControlLabel}>Persuaded?</span>
        <button type="button" className={`${styles.miniChoice} ${agree === true ? styles.choiceActive : ""}`} onClick={() => set(true, well)}>
          ▲
        </button>
        <button type="button" className={`${styles.miniChoice} ${agree === false ? styles.choiceActive : ""}`} onClick={() => set(false, well)}>
          ▼
        </button>
        <span className={styles.voiceControlLabel}>Well made?</span>
        <button type="button" className={`${styles.miniChoice} ${well === true ? styles.choiceActive : ""}`} onClick={() => set(agree, true)}>
          ▲
        </button>
        <button type="button" className={`${styles.miniChoice} ${well === false ? styles.choiceActive : ""}`} onClick={() => set(agree, false)}>
          ▼
        </button>
      </div>
    </div>
  );
}
