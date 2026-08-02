"use client";

import { useState } from "react";
import { TypeBadge, EvidenceBadge, TagBadge } from "@/components/ClassificationBadge";
import { ContestedBanner } from "@/components/ContestedBanner";
import { ConnectionRowList } from "@/components/ConnectionRowList";
import { RateClaim } from "@/components/RateClaim";
import { EditPanel } from "@/components/EditPanel";
import { fetchClaim } from "@/lib/api";
import type { ClaimDetail } from "@/lib/types";
import styles from "./ClaimPage.module.css";

export function ClaimPageClient({ initialClaim }: { initialClaim: ClaimDetail }) {
  const [claim, setClaim] = useState(initialClaim);
  const [editOpen, setEditOpen] = useState(false);

  async function refetch() {
    const fresh = await fetchClaim(claim.slug);
    if (fresh) setClaim(fresh);
  }

  const primaryTag = claim.tags[0] ?? "CLAIMS";

  return (
    <main className={styles.main}>
      <div className={styles.breadcrumb}>
        CLAIMS / {primaryTag} / {claim.title.slice(0, 40).toUpperCase()}
      </div>

      {claim.contested && <ContestedBanner reason={claim.contested.reason} until={claim.contested.until} />}

      <div className={styles.header}>
        <div className={styles.badgeRow}>
          <TypeBadge type={claim.type} />
          <EvidenceBadge evidenceStrength={claim.evidenceStrength} />
          {claim.tags.map((tag) => (
            <TagBadge tag={tag} key={tag} />
          ))}
        </div>
        <h1 className={styles.title}>{claim.title}</h1>
        <p className={styles.oneLiner}>{claim.oneLiner}</p>
        <button type="button" className={styles.editButton} onClick={() => setEditOpen(true)}>
          EDIT THIS CLAIM
        </button>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionHeading}>CONTEXT &amp; HISTORY</h2>
        <div className={styles.contextGrid}>
          <div>
            <p className={styles.prose}>{claim.contextBackground}</p>
            {claim.timeline.length > 0 && (
              <>
                <h3 className={styles.timelineHeading}>HOW WE GOT HERE</h3>
                {claim.timeline.map((t, i) => (
                  <div className={styles.timelineRow} key={i}>
                    <span className={styles.timelineYear}>{t.label}</span>
                    <span className={styles.timelineText}>{t.text}</span>
                  </div>
                ))}
              </>
            )}
          </div>
          <div>
            <div className={styles.sideCard}>
              <h3 className={styles.sideCardHeading}>WHERE THE DISAGREEMENT SITS</h3>
              <p className={styles.sideCardText}>{claim.contextDisagreement}</p>
            </div>
            <div className={styles.sideCard}>
              <h3 className={styles.sideCardHeading}>THIS CLAIM</h3>
              <div className={styles.statLine}>
                <span>Opened</span>
                <span className={styles.statValue}>{claim.ageLabel}</span>
              </div>
              <div className={styles.statLine}>
                <span>Revisions</span>
                <span className={styles.statValue}>
                  {claim.stats.revisionCount} by {claim.stats.revisionAuthorCount}{" "}
                  {claim.stats.revisionAuthorCount === 1 ? "person" : "people"}
                </span>
              </div>
              <div className={styles.statLine}>
                <span>Connected claims</span>
                <span className={styles.statValue}>{claim.stats.connectionCount}</span>
              </div>
              <div className={styles.statLine}>
                <span>Evidence items</span>
                <span className={styles.statValue}>{claim.stats.evidenceCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {claim.usedIn.length > 0 && (
        <div className={styles.section}>
          <div className={styles.usedInHeader}>
            <h2 className={styles.sectionHeading} style={{ borderBottomColor: "var(--primary)", color: "var(--primary)" }}>
              WHERE THIS CLAIM IS USED&nbsp;&nbsp;({claim.usedIn.length})
            </h2>
            {claim.stats.crossDebateUsedInCount > 0 && (
              <span className={styles.usedInNote}>
                {claim.stats.crossDebateUsedInCount} of these sit in other debates
              </span>
            )}
          </div>
          <ConnectionRowList rows={claim.usedIn} direction="upward" onMutated={refetch} />
        </div>
      )}

      <div className={styles.section}>
        <div className={styles.twoCol}>
          <div>
            <h2 className={`${styles.sectionHeading} ${styles.supportsHeading}`}>
              WHAT SUPPORTS THIS CLAIM&nbsp;&nbsp;({claim.supports.length})
            </h2>
            <ConnectionRowList rows={claim.supports} direction="downward" align="left" onMutated={refetch} />
          </div>
          <div>
            <h2 className={`${styles.sectionHeading} ${styles.contradictsHeading}`}>
              WHAT CONTRADICTS THIS CLAIM&nbsp;&nbsp;({claim.contradicts.length})
            </h2>
            <ConnectionRowList rows={claim.contradicts} direction="downward" align="right" onMutated={refetch} />
          </div>
        </div>
      </div>

      <RateClaim claimId={claim.id} votes={claim.votes} onMutated={refetch} />

      {editOpen && <EditPanel claim={claim} onClose={() => setEditOpen(false)} onMutated={refetch} />}
    </main>
  );
}
