"use client";

import { useState } from "react";
import { Term } from "./Term";
import {
  patchClaim,
  addEvidence,
  removeEvidence,
  revertRevision,
  patchConnection,
} from "@/lib/api";
import { STRENGTH_DEFINITIONS } from "@/lib/copy";
import type { ClaimDetail, ConnectionStrength } from "@/lib/types";
import styles from "./EditPanel.module.css";

type Tab = "write" | "evidence" | "history";

export function EditPanel({
  claim,
  onClose,
  onMutated,
}: {
  claim: ClaimDetail;
  onClose: () => void;
  onMutated: () => void;
}) {
  const [tab, setTab] = useState<Tab>("write");

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>Edit claim</span>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            Close
          </button>
        </div>
        <div className={styles.tabs}>
          {(["write", "evidence", "history"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              className={`${styles.tab} ${tab === t ? styles.tabActive : ""}`}
              onClick={() => setTab(t)}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
        {tab === "write" && <WriteTab claim={claim} onMutated={onMutated} />}
        {tab === "evidence" && <EvidenceTab claim={claim} onMutated={onMutated} />}
        {tab === "history" && <HistoryTab claim={claim} onMutated={onMutated} />}
      </div>
    </div>
  );
}

function WriteTab({ claim, onMutated }: { claim: ClaimDetail; onMutated: () => void }) {
  const [title, setTitle] = useState(claim.title);
  const [oneLiner, setOneLiner] = useState(claim.oneLiner);
  const [body, setBody] = useState(claim.body);
  const [type, setType] = useState(claim.type);
  const [evidenceStrength, setEvidenceStrength] = useState(claim.evidenceStrength);
  const [tags, setTags] = useState(claim.tags.join(", "));
  const [authorName, setAuthorName] = useState("");
  const [summary, setSummary] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!authorName || !summary) return;
    setSaving(true);
    try {
      await patchClaim(
        claim.id,
        {
          title,
          oneLiner,
          body,
          type,
          evidenceStrength,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        },
        authorName,
        summary
      );
      onMutated();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.content}>
      <div className={styles.field}>
        <span className={styles.label}>CLAIM</span>
        <input className={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className={styles.field}>
        <span className={styles.label}>ONE-LINE DESCRIPTION</span>
        <input className={styles.input} value={oneLiner} onChange={(e) => setOneLiner(e.target.value)} />
      </div>
      <div className={styles.field}>
        <span className={styles.label}>BODY</span>
        <textarea className={styles.textarea} value={body} onChange={(e) => setBody(e.target.value)} />
      </div>
      <div className={styles.field}>
        <span className={styles.label}>TYPE</span>
        <select className={styles.select} value={type} onChange={(e) => setType(e.target.value as ClaimDetail["type"])}>
          <option value="FACT">Fact</option>
          <option value="OPINION">Opinion</option>
          <option value="VALUE">Value</option>
          <option value="PROPOSAL">Proposal</option>
        </select>
      </div>
      <div className={styles.field}>
        <span className={styles.label}>EVIDENCE STRENGTH</span>
        <select
          className={styles.select}
          value={evidenceStrength}
          onChange={(e) => setEvidenceStrength(e.target.value as ClaimDetail["evidenceStrength"])}
        >
          <option value="NONE">No evidence</option>
          <option value="WEAK">Weak evidence</option>
          <option value="MODERATE">Moderate evidence</option>
          <option value="STRONG">Strong evidence</option>
        </select>
      </div>
      <div className={styles.field}>
        <span className={styles.label}>TAGS (comma separated)</span>
        <input className={styles.input} value={tags} onChange={(e) => setTags(e.target.value)} />
      </div>
      <div className={styles.field}>
        <span className={styles.label}>YOUR NAME (REQUIRED TO SAVE)</span>
        <input className={styles.input} value={authorName} onChange={(e) => setAuthorName(e.target.value)} />
      </div>
      <div className={styles.field}>
        <span className={styles.label}>WHY THIS CHANGE? (REQUIRED TO SAVE)</span>
        <input className={styles.input} value={summary} onChange={(e) => setSummary(e.target.value)} required />
      </div>
      <button type="button" className={styles.saveButton} disabled={saving || !authorName || !summary} onClick={save}>
        {saving ? "Saving…" : "Save change"}
      </button>
      {!authorName || !summary ? (
        <span className={styles.requiredHint}>Add your name and a reason above to enable saving.</span>
      ) : null}
    </div>
  );
}

function EvidenceTab({ claim, onMutated }: { claim: ClaimDetail; onMutated: () => void }) {
  const [type, setType] = useState("Reporting");
  const [citation, setCitation] = useState("");
  const [url, setUrl] = useState("");

  async function add() {
    if (!citation) return;
    await addEvidence(claim.id, type, citation, url || undefined);
    setCitation("");
    setUrl("");
    onMutated();
  }

  return (
    <div className={styles.content}>
      {claim.evidenceItems.map((item) => (
        <div className={styles.evidenceItem} key={item.id}>
          <span>
            <strong>{item.type}</strong> — {item.citation}
          </span>
          <button
            type="button"
            className={styles.removeButton}
            onClick={async () => {
              await removeEvidence(claim.id, item.id);
              onMutated();
            }}
          >
            Remove
          </button>
        </div>
      ))}
      <div className={styles.field}>
        <span className={styles.label}>ADD EVIDENCE — TYPE</span>
        <input className={styles.input} value={type} onChange={(e) => setType(e.target.value)} />
      </div>
      <div className={styles.field}>
        <span className={styles.label}>CITATION</span>
        <input className={styles.input} value={citation} onChange={(e) => setCitation(e.target.value)} />
      </div>
      <div className={styles.field}>
        <span className={styles.label}>URL (OPTIONAL)</span>
        <input className={styles.input} value={url} onChange={(e) => setUrl(e.target.value)} />
      </div>
      <button type="button" className={styles.saveButton} onClick={add} disabled={!citation}>
        Add evidence
      </button>

      {claim.usedIn.length > 0 && (
        <>
          <span className={styles.label} style={{ marginTop: 10 }}>
            CONNECTION STRENGTH
          </span>
          {claim.usedIn.map((row) => (
            <ConnectionEditor key={row.connectionId} row={row} claimTitle={claim.title} onMutated={onMutated} />
          ))}
        </>
      )}
    </div>
  );
}

function ConnectionEditor({
  row,
  claimTitle,
  onMutated,
}: {
  row: ClaimDetail["usedIn"][number];
  claimTitle: string;
  onMutated: () => void;
}) {
  const [strength, setStrength] = useState<ConnectionStrength>(row.statedStrength);
  const [reason, setReason] = useState("");
  const [authorName, setAuthorName] = useState("");
  const relWord = row.relation === "SUPPORTS" ? "supports" : "contradicts";

  async function save() {
    if (!reason || !authorName) return;
    await patchConnection(row.connectionId, { statedStrength: strength, statedReason: reason }, authorName, reason);
    onMutated();
  }

  return (
    <div className={styles.connectionBlock}>
      <div className={styles.connectionHeader}>
        <strong>{claimTitle}</strong> <span style={{ color: "var(--text-2)" }}>{relWord}</span>{" "}
        <strong>{row.otherClaim.title}</strong>
      </div>
      <div className={styles.connectionDist}>
        {row.strengthDistribution.map((d) => (
          <div key={d.value} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11.5, width: 74, color: "var(--text-2)" }}>{d.label}</span>
            <div style={{ flex: 1, display: "flex", alignItems: "center", height: 11 }}>
              <div
                style={{
                  width: `${d.pct ?? 0}%`,
                  height: d.weight,
                  background: row.relation === "SUPPORTS" ? "var(--supports)" : "var(--contradicts)",
                }}
              />
            </div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--text-2)", width: 28, textAlign: "right" }}>
              {d.count}
            </span>
          </div>
        ))}
      </div>
      <div className={styles.connectionControls}>
        <div className={styles.segmented}>
          {(["TANGENTIAL", "RELEVANT", "DECISIVE"] as ConnectionStrength[]).map((s) => (
            <Term
              key={s}
              tooltip={STRENGTH_DEFINITIONS[s][row.relation === "SUPPORTS" ? "supports" : "contradicts"]}
              placement="above"
              className={`${styles.segment} ${strength === s ? styles.segmentActive : ""}`}
            >
              <span onClick={() => setStrength(s)} style={{ display: "block", cursor: "pointer" }}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </span>
            </Term>
          ))}
        </div>
        <input
          className={styles.input}
          placeholder="Your name (required to save)"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
        />
        <input
          className={styles.input}
          placeholder="One-line reason for this stated strength (required to save)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <button type="button" className={styles.saveButton} onClick={save} disabled={!reason || !authorName}>
          Save connection
        </button>
        {!reason || !authorName ? (
          <span className={styles.requiredHint}>Add your name and a reason above to enable saving.</span>
        ) : null}
      </div>
    </div>
  );
}

function HistoryTab({ claim, onMutated }: { claim: ClaimDetail; onMutated: () => void }) {
  const [authorName, setAuthorName] = useState("");

  return (
    <div className={styles.content}>
      <div className={styles.field}>
        <span className={styles.label}>YOUR NAME (FOR REVERTS)</span>
        <input className={styles.input} value={authorName} onChange={(e) => setAuthorName(e.target.value)} />
      </div>
      {claim.revisions.map((rev) => (
        <div className={styles.revisionRow} key={rev.id}>
          <span>
            <strong>{rev.authorName}</strong> — {new Date(rev.createdAt).toLocaleDateString()}
            {rev.pending && <span className={styles.pendingTag}>PENDING REVIEW</span>}
          </span>
          <span>{rev.summary}</span>
          {!rev.pending && (
            <button
              type="button"
              className={styles.revertButton}
              disabled={!authorName}
              onClick={async () => {
                await revertRevision(claim.id, rev.id, authorName);
                onMutated();
              }}
            >
              Revert to before this change
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
