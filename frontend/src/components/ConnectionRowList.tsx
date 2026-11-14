"use client";

import { useState } from "react";
import { StrengthBar } from "./StrengthBar";
import { HoverCard } from "./HoverCard";
import { useIsNarrow } from "@/lib/useIsNarrow";
import type { ConnectionRow } from "@/lib/types";
import styles from "./ConnectionRowList.module.css";

export function ConnectionRowList({
  rows,
  direction,
  align = "left",
  onMutated,
}: {
  rows: ConnectionRow[];
  direction: "upward" | "downward";
  align?: "left" | "right";
  onMutated: () => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [placement, setPlacement] = useState<"above" | "below">("below");
  const isNarrow = useIsNarrow();

  function openRow(el: HTMLElement, id: string) {
    const rect = el.getBoundingClientRect();
    setPlacement(rect.top < window.innerHeight * 0.45 ? "below" : "above");
    setOpenId(id);
  }

  return (
    <div className={styles.list} onMouseLeave={() => setOpenId(null)}>
      {rows.map((row) => {
        const isOpen = openId === row.connectionId;
        return (
          <div
            key={row.connectionId}
            className={styles.rowWrap}
            onMouseEnter={isNarrow ? undefined : (e) => openRow(e.currentTarget, row.connectionId)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpenId(null);
            }}
          >
            <button
              type="button"
              className={styles.row}
              onFocus={isNarrow ? undefined : (e) => openRow(e.currentTarget, row.connectionId)}
              onClick={(e) => {
                if (isNarrow) {
                  isOpen ? setOpenId(null) : openRow(e.currentTarget, row.connectionId);
                } else if (!isOpen) {
                  openRow(e.currentTarget, row.connectionId);
                }
              }}
            >
              {direction === "upward" ? (
                <>
                  <span
                    className={styles.relationTag}
                    style={{
                      color: row.relation === "SUPPORTS" ? "var(--supports-ink)" : "var(--contradicts)",
                      background: row.relation === "SUPPORTS" ? "var(--supports-wash)" : "var(--contradicts-wash)",
                    }}
                  >
                    {row.relation}
                  </span>
                  <div className={styles.claimTextCol}>
                    <div className={styles.claimText}>
                      {row.otherClaim.title}
                      <RowMarks row={row} />
                    </div>
                    <div className={styles.contextLine}>{row.contextLabel}</div>
                  </div>
                  <StrengthBar relation={row.relation} weight={row.weight} opacity={row.opacity} />
                </>
              ) : (
                <>
                  <StrengthBar relation={row.relation} weight={row.weight} opacity={row.opacity} />
                  <span className={styles.claimText}>
                    {row.otherClaim.title}
                    <RowMarks row={row} />
                  </span>
                </>
              )}
            </button>
            {isOpen &&
              (isNarrow ? (
                <div className={styles.inlineCard}>
                  <HoverCard row={row} inline onMutated={onMutated} />
                </div>
              ) : (
                <div
                  className={`${styles.floating} ${placement === "below" ? styles.floatingBelow : styles.floatingAbove} ${align === "left" ? styles.alignLeft : styles.alignRight}`}
                >
                  <HoverCard row={row} inline={false} onMutated={onMutated} />
                </div>
              ))}
          </div>
        );
      })}
    </div>
  );
}

function RowMarks({ row }: { row: ConnectionRow }) {
  if (!row.crux && row.challenges.total === 0) return null;
  return (
    <>
      {row.crux && (
        <span className={styles.cruxTag} title="The debate currently turns on this connection">
          CRUX
        </span>
      )}
      {row.challenges.total > 0 && (
        <span
          className={styles.challengeTag}
          title={`${row.challenges.notRelevant} say it doesn't belong here, ${row.challenges.wrongDirection} say it points the other way`}
        >
          {row.challenges.total} CHALLENGED
        </span>
      )}
    </>
  );
}
