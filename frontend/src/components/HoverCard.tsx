"use client";

import Link from "next/link";
import { Term } from "./Term";
import { ScoreBar } from "./ScoreBar";
import { TwoAxisPlot } from "./TwoAxisPlot";
import { TypeBadge, EvidenceBadge } from "./ClassificationBadge";
import { voteStrength } from "@/lib/api";
import { AGREE_TOOLTIP, WELL_CONSTRUCTED_TOOLTIP } from "@/lib/copy";
import type { ConnectionRow } from "@/lib/types";
import styles from "./HoverCard.module.css";

export function HoverCard({
  row,
  inline,
  onMutated,
}: {
  row: ConnectionRow;
  inline: boolean;
  onMutated: () => void;
}) {
  const claim = row.claimItself;

  async function cast(value: "DECISIVE" | "RELEVANT" | "TANGENTIAL") {
    await voteStrength(row.connectionId, value);
    onMutated();
  }

  return (
    <div className={inline ? styles.cardInline : styles.card}>
      <div className={styles.bandOne}>
        <div className={styles.bandLabel}>THE CLAIM ITSELF</div>
        <p className={styles.body}>{claim.body}</p>
        <div className={styles.badgeRow}>
          <TypeBadge type={claim.type} />
          <EvidenceBadge evidenceStrength={claim.evidenceStrength} />
        </div>
        <div className={styles.scoreArea}>
          <div className={styles.scoreCol}>
            <ScoreBar label="People agree" tooltip={AGREE_TOOLTIP} pct={claim.agreePct} />
            <ScoreBar label="Well made" tooltip={WELL_CONSTRUCTED_TOOLTIP} pct={claim.wellConstructedPct} />
            <span className={styles.raterCount}>{claim.raterCount} RATERS</span>
          </div>
          <div style={{ width: 96, flexShrink: 0 }}>
            <TwoAxisPlot dots={claim.scatter} variant="mini" />
          </div>
        </div>

        {claim.ownArguments.length > 0 && (
          <div className={styles.ownArgs}>
            <div className={styles.ownArgsLabel}>WHAT ARGUES FOR AND AGAINST IT</div>
            {claim.ownArguments.map((arg, i) => (
              <div className={styles.ownArgRow} key={i}>
                <span style={{ width: 20, flexShrink: 0, display: "flex", alignItems: "center" }}>
                  <span
                    style={{
                      width: "100%",
                      height: arg.weight,
                      opacity: arg.opacity,
                      background: arg.relation === "SUPPORTS" ? "var(--supports)" : "var(--contradicts)",
                    }}
                  />
                </span>
                <span
                  className={styles.ownArgLabel}
                  style={{ color: arg.relation === "SUPPORTS" ? "var(--supports-ink)" : "var(--contradicts)" }}
                >
                  {arg.label}
                </span>
                <span className={styles.ownArgText}>{arg.text}</span>
              </div>
            ))}
          </div>
        )}
        <Link href={`/claim/${claim.slug}`} className={styles.readMore}>
          Read more and rate &ldquo;{claim.title}&rdquo; on its own page →
        </Link>
      </div>

      <div className={styles.bandTwo}>
        <div className={styles.bandTwoHeader}>
          <span
            className={styles.relationSentence}
            style={{ color: row.relation === "SUPPORTS" ? "var(--supports-ink)" : "var(--contradicts)" }}
          >
            {row.relationSentence}
          </span>
          <span className={styles.howStrongly}>HOW STRONGLY?</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {row.strengthDistribution.map((d) => (
            <div className={styles.distRow} key={d.value}>
              <Term
                tooltip={row.strengthDefinitions[d.value.toLowerCase() as "decisive" | "relevant" | "tangential"]}
                placement="above"
                className={styles.distLabel}
              >
                {d.label}
              </Term>
              <div className={styles.distTrack}>
                <div
                  style={{
                    width: `${d.pct ?? 0}%`,
                    height: d.weight,
                    background: row.relation === "SUPPORTS" ? "var(--supports)" : "var(--contradicts)",
                  }}
                />
              </div>
              <span className={styles.distCount}>{d.count}</span>
              <button type="button" className={styles.voteButton} onClick={() => cast(d.value)}>
                Vote
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
