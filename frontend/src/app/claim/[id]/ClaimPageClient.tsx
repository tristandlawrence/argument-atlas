"use client";

import { useEffect, useRef, useState } from "react";
import { TypeBadge, EvidenceBadge, TagBadge } from "@/components/ClassificationBadge";
import { ContestedBanner } from "@/components/ContestedBanner";
import { ConnectionRowList } from "@/components/ConnectionRowList";
import { RateClaim } from "@/components/RateClaim";
import { EditPanel } from "@/components/EditPanel";
import { Markdown } from "@/components/Markdown";
import { fetchClaim } from "@/lib/api";
import type { ClaimDetail } from "@/lib/types";
import styles from "./ClaimPage.module.css";

export function ClaimPageClient({ initialClaim }: { initialClaim: ClaimDetail }) {
  const [claim, setClaim] = useState(initialClaim);
  const [editOpen, setEditOpen] = useState(false);
  const [headerGone, setHeaderGone] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  // The compact bar appears once the claim header has scrolled off, so the
  // title and the edit control stay in reach down the whole page.
  useEffect(() => {
    const el = headerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(([entry]) => setHeaderGone(!entry.isIntersecting), { threshold: 0 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  async function refetch() {
    const fresh = await fetchClaim(claim.slug);
    if (fresh) setClaim(fresh);
  }

  const primaryTag = claim.tags[0] ?? "CLAIMS";

  return (
    <main className={styles.main}>
      <div className={`${styles.stickyBar} ${headerGone ? styles.stickyBarVisible : ""}`} aria-hidden={!headerGone}>
        <div className={styles.stickyInner}>
          <span className={styles.stickyTitle}>{claim.title}</span>
          <button type="button" className={styles.stickyEdit} onClick={() => setEditOpen(true)} tabIndex={headerGone ? 0 : -1}>
            <PencilIcon /> EDIT
          </button>
        </div>
      </div>

      <div className={styles.breadcrumb}>
        CLAIMS / {primaryTag} / {claim.title.slice(0, 40).toUpperCase()}
      </div>

      {claim.contested && <ContestedBanner reason={claim.contested.reason} until={claim.contested.until} />}

      <div className={styles.header} ref={headerRef}>
        <div className={styles.badgeRow}>
          <TypeBadge type={claim.type} />
          <EvidenceBadge evidenceStrength={claim.evidenceStrength} />
          {claim.tags.map((tag) => (
            <TagBadge tag={tag} key={tag} />
          ))}
        </div>
        <h1 className={styles.title}>{claim.title}</h1>
        <p className={styles.oneLiner}>{claim.oneLiner}</p>
        {claim.body && <Markdown source={claim.body} className={styles.bodyProse} />}
        <button type="button" className={styles.editButton} onClick={() => setEditOpen(true)}>
          <PencilIcon /> EDIT THIS CLAIM
        </button>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionHeading}>CONTEXT &amp; HISTORY</h2>
        <div className={styles.contextGrid}>
          <div>
            <Markdown source={claim.contextBackground} className={styles.prose} />
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
              <Markdown source={claim.contextDisagreement} className={styles.sideCardText} />
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
            <p className={styles.columnHint}>
              Hover or tap a row to rate how much it does for this claim. Open it to rate the claim itself.
            </p>
            <ConnectionRowList rows={claim.supports} direction="downward" align="left" onMutated={refetch} />
          </div>
          <div>
            <h2 className={`${styles.sectionHeading} ${styles.contradictsHeading}`}>
              WHAT CONTRADICTS THIS CLAIM&nbsp;&nbsp;({claim.contradicts.length})
            </h2>
            <p className={styles.columnHint}>
              Hover or tap a row to rate how much it counts against this claim. Open it to rate the claim itself.
            </p>
            <ConnectionRowList rows={claim.contradicts} direction="downward" align="right" onMutated={refetch} />
          </div>
        </div>
      </div>

      <RateClaim claimId={claim.id} claimTitle={claim.title} votes={claim.votes} voices={claim.voices} onMutated={refetch} />

      {editOpen && <EditPanel claim={claim} onClose={() => setEditOpen(false)} onMutated={refetch} />}
    </main>
  );
}

function PencilIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" style={{ marginRight: 6, verticalAlign: -1 }}>
      <path d="M11.5 2.5l2 2L5 13H3v-2l8.5-8.5z" />
      <path d="M10 4l2 2" />
    </svg>
  );
}
