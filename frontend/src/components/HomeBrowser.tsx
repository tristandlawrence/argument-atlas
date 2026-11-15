"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { TypeBadge, TagBadge, EvidenceBadge } from "./ClassificationBadge";
import { Term } from "./Term";
import { EVIDENCE_LABEL, QUADRANT_COPY, TAG_COPY, TYPE_LABEL } from "@/lib/copy";
import { quadrantOf, showTurnsOn, type ClaimListItem, type Quadrant } from "@/lib/types";
import styles from "./HomeBrowser.module.css";

/**
 * The claims browser. Every classification the product uses is a filter, and
 * nothing is ever ordered by agreement. Two presentations: cards with a filter
 * rail, or a compact table with the same filters as dropdowns. Filter state is
 * mirrored into the URL so any view can be linked or pre-canned.
 */

export type View = "cards" | "table";
export type Sort = "raters" | "arguments" | "newest" | "alpha";
export type BrowserState = {
  view: View;
  q: string;
  tag: string | null;
  types: string[];
  evidence: string[];
  quadrants: string[];
  status: string[];
  sort: Sort;
};

const TYPES = ["FACT", "OPINION", "VALUE", "PROPOSAL"];
const EVIDENCE = ["STRONG", "MODERATE", "WEAK", "NONE"];
const QUADRANTS: Quadrant[] = ["COMPELLING", "STEELMAN", "PARTISAN", "WEAK", "UNRATED"];
const STATUS: { key: string; label: string; tip: string }[] = [
  { key: "ROOT", label: "DEBATE ROOT", tip: "A claim with arguments beneath it and nothing above: the top of a debate." },
  { key: "ARGUMENT", label: "ARGUMENT", tip: "A claim that argues for or against something else." },
  { key: "CONTENTIOUS", label: "HAS A LIVE QUESTION", tip: "Has a connection editors have marked as where the debate currently turns, rated by enough people to trust." },
  { key: "TURNING", label: "IS THE QUESTION", tip: "Is itself the claim a debate turns on." },
  { key: "CONTESTED", label: "CONTESTED", tip: "In contested status: edits queue for review while reading and rating stay open." },
  { key: "CROSS", label: "USED ELSEWHERE", tip: "Appears in more than one place in the atlas." },
  { key: "UNRATED", label: "NOT YET RATED", tip: "Nobody has rated this claim yet. A good place to start." },
];
const SORTS: { key: Sort; label: string }[] = [
  { key: "raters", label: "Most rated" },
  { key: "arguments", label: "Most argued" },
  { key: "newest", label: "Newest" },
  { key: "alpha", label: "A to Z" },
];

function matches(c: ClaimListItem, s: BrowserState) {
  const needle = s.q.trim().toLowerCase();
  if (s.tag && !c.tags.includes(s.tag)) return false;
  if (s.types.length && !s.types.includes(c.type)) return false;
  if (s.evidence.length && !s.evidence.includes(c.evidenceStrength)) return false;
  if (s.quadrants.length && !s.quadrants.includes(quadrantOf(c))) return false;
  for (const st of s.status) {
    if (st === "ROOT" && !c.isRoot) return false;
    if (st === "ARGUMENT" && c.isRoot) return false;
    if (st === "CONTENTIOUS" && !showTurnsOn(c)) return false;
    if (st === "TURNING" && !c.isTurningPoint) return false;
    if (st === "CONTESTED" && !c.contestedAt) return false;
    if (st === "CROSS" && c.usedInCount < 2) return false;
    if (st === "UNRATED" && c.raterCount > 0) return false;
  }
  if (needle && !`${c.title} ${c.oneLiner}`.toLowerCase().includes(needle)) return false;
  return true;
}

const BY: Record<Sort, (a: ClaimListItem, b: ClaimListItem) => number> = {
  raters: (a, b) => b.raterCount - a.raterCount || b.supportsCount + b.contradictsCount - (a.supportsCount + a.contradictsCount),
  arguments: (a, b) => b.supportsCount + b.contradictsCount - (a.supportsCount + a.contradictsCount) || b.raterCount - a.raterCount,
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  alpha: (a, b) => a.title.localeCompare(b.title),
};

export function toParams(s: BrowserState) {
  const p = new URLSearchParams();
  if (s.view !== "cards") p.set("view", s.view);
  if (s.q) p.set("q", s.q);
  if (s.tag) p.set("tag", s.tag.toLowerCase());
  if (s.types.length) p.set("type", s.types.join(",").toLowerCase());
  if (s.evidence.length) p.set("evidence", s.evidence.join(",").toLowerCase());
  if (s.quadrants.length) p.set("quadrant", s.quadrants.join(",").toLowerCase());
  if (s.status.length) p.set("status", s.status.join(",").toLowerCase());
  if (s.sort !== "raters") p.set("sort", s.sort);
  return p;
}

export function HomeBrowser({ claims, initial }: { claims: ClaimListItem[]; initial: BrowserState }) {
  const [s, setS] = useState<BrowserState>(initial);
  const set = <K extends keyof BrowserState>(k: K, v: BrowserState[K]) => setS((prev) => ({ ...prev, [k]: v }));
  const toggleIn = (k: "types" | "evidence" | "quadrants" | "status", v: string) =>
    setS((prev) => ({ ...prev, [k]: prev[k].includes(v) ? prev[k].filter((x) => x !== v) : [...prev[k], v] }));

  // Mirror state into the URL so the view is linkable; no navigation, no history entry.
  useEffect(() => {
    const qs = toParams(s).toString();
    const url = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
    if (url !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(null, "", url);
  }, [s]);

  const allTags = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of claims) for (const t of c.tags) counts[t] = (counts[t] ?? 0) + 1;
    return Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]));
  }, [claims]);

  const filtered = useMemo(() => claims.filter((c) => matches(c, s)).sort(BY[s.sort]), [claims, s]);

  const activeCount = (s.tag ? 1 : 0) + s.types.length + s.evidence.length + s.quadrants.length + s.status.length + (s.q ? 1 : 0);
  const clearAll = () => setS((prev) => ({ ...prev, q: "", tag: null, types: [], evidence: [], quadrants: [], status: [] }));

  return (
    <main className={styles.main}>
      <div className={styles.masthead}>
        <div>
          <h1 className={styles.heading}>Claims</h1>
          <p className={styles.sub}>
            {claims.length} claims across {claims.filter((c) => c.isRoot).length} debates. Filter by topic, type, evidence, how it rates and status. Nothing here is
            sorted by agreement.
          </p>
        </div>
        <div className={styles.scope} role="tablist" aria-label="View">
          <button type="button" role="tab" aria-selected={s.view === "cards"} className={`${styles.scopeTab} ${s.view === "cards" ? styles.scopeOn : ""}`} onClick={() => set("view", "cards")}>
            CARDS
          </button>
          <button type="button" role="tab" aria-selected={s.view === "table"} className={`${styles.scopeTab} ${s.view === "table" ? styles.scopeOn : ""}`} onClick={() => set("view", "table")}>
            TABLE
          </button>
          <Link href="/graph" className={styles.scopeLink}>
            GRAPH →
          </Link>
        </div>
      </div>

      {s.view === "table" ? (
        <>
          <div className={styles.dropdownBar}>
            <input type="search" className={styles.searchInline} placeholder="Search titles…" value={s.q} onChange={(e) => set("q", e.target.value)} aria-label="Search claim titles" />
            <Dropdown label="Topic" value={s.tag ?? ""} onChange={(v) => set("tag", v || null)} options={[["", "All topics"], ...allTags.map(([t, n]) => [t, `${t} (${n})`] as [string, string])]} />
            <Dropdown label="Type" value={s.types[0] ?? ""} onChange={(v) => set("types", v ? [v] : [])} options={[["", "All types"], ...TYPES.map((t) => [t, TYPE_LABEL[t]] as [string, string])]} />
            <Dropdown label="Evidence" value={s.evidence[0] ?? ""} onChange={(v) => set("evidence", v ? [v] : [])} options={[["", "Any evidence"], ...EVIDENCE.map((e) => [e, EVIDENCE_LABEL[e]] as [string, string])]} />
            <Dropdown label="Rates" value={s.quadrants[0] ?? ""} onChange={(v) => set("quadrants", v ? [v] : [])} options={[["", "Any rating"], ...QUADRANTS.map((q) => [q, q.charAt(0) + q.slice(1).toLowerCase()] as [string, string])]} />
            <Dropdown label="Status" value={s.status[0] ?? ""} onChange={(v) => set("status", v ? [v] : [])} options={[["", "Any status"], ...STATUS.map((st) => [st.key, st.label.charAt(0) + st.label.slice(1).toLowerCase()] as [string, string])]} />
            <Dropdown label="Sort" value={s.sort} onChange={(v) => set("sort", v as Sort)} options={SORTS.map((o) => [o.key, o.label] as [string, string])} />
            {activeCount > 0 && (
              <button type="button" className={styles.clear} onClick={clearAll}>
                Clear
              </button>
            )}
          </div>
          <div className={styles.resultsBar}>
            <span className={styles.resultsCount}>
              {filtered.length} {filtered.length === 1 ? "claim" : "claims"}
            </span>
          </div>
          <ClaimTable rows={filtered} />
        </>
      ) : (
        <div className={styles.layout}>
          <aside className={styles.filters} aria-label="Filters">
            <input type="search" className={styles.search} placeholder="Search titles…" value={s.q} onChange={(e) => set("q", e.target.value)} aria-label="Search claim titles" />
            <FilterGroup label="TOPIC">
              <Chip on={s.tag === null} onClick={() => set("tag", null)}>
                ALL
              </Chip>
              {allTags.map(([t, n]) => (
                <Chip key={t} on={s.tag === t} onClick={() => set("tag", s.tag === t ? null : t)} tip={TAG_COPY[t]} count={n}>
                  {t}
                </Chip>
              ))}
            </FilterGroup>
            <FilterGroup label="TYPE" hint="Facts can be settled by evidence; values cannot. Proposals stand on both.">
              {TYPES.map((t) => (
                <Chip key={t} on={s.types.includes(t)} onClick={() => toggleIn("types", t)}>
                  {t}
                </Chip>
              ))}
            </FilterGroup>
            <FilterGroup label="EVIDENCE">
              {EVIDENCE.map((e) => (
                <Chip key={e} on={s.evidence.includes(e)} onClick={() => toggleIn("evidence", e)}>
                  {EVIDENCE_LABEL[e].replace(" EVIDENCE", "")}
                </Chip>
              ))}
            </FilterGroup>
            <FilterGroup label="HOW IT RATES" hint="Agreement and craft are rated separately, so a claim can be well made and still unpersuasive.">
              {QUADRANTS.map((qd) => (
                <Chip key={qd} on={s.quadrants.includes(qd)} onClick={() => toggleIn("quadrants", qd)} tip={QUADRANT_COPY[qd]}>
                  {qd}
                </Chip>
              ))}
            </FilterGroup>
            <FilterGroup label="STATUS">
              {STATUS.map((st) => (
                <Chip key={st.key} on={s.status.includes(st.key)} onClick={() => toggleIn("status", st.key)} tip={st.tip}>
                  {st.label}
                </Chip>
              ))}
            </FilterGroup>
            {activeCount > 0 && (
              <button type="button" className={styles.clear} onClick={clearAll}>
                Clear {activeCount} {activeCount === 1 ? "filter" : "filters"}
              </button>
            )}
          </aside>

          <section className={styles.results}>
            <div className={styles.resultsBar}>
              <span className={styles.resultsCount}>
                {filtered.length} {filtered.length === 1 ? "claim" : "claims"}
              </span>
              <label className={styles.sortLabel}>
                SORT
                <select className={styles.sort} value={s.sort} onChange={(e) => set("sort", e.target.value as Sort)}>
                  {SORTS.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {filtered.length === 0 && <p className={styles.empty}>Nothing matches those filters. Loosen one.</p>}
            {filtered.map((c) => (
              <DebateCard key={c.id} c={c} />
            ))}
          </section>
        </div>
      )}
    </main>
  );
}

function Dropdown({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <label className={styles.dropdown}>
      <span className={styles.dropdownLabel}>{label.toUpperCase()}</span>
      <select className={styles.sort} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

function FilterGroup({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className={styles.group}>
      <div className={styles.groupLabel}>
        {hint ? (
          <Term tooltip={hint} className={styles.groupTerm}>
            {label}
          </Term>
        ) : (
          label
        )}
      </div>
      <div className={styles.chips}>{children}</div>
    </div>
  );
}

function Chip({ on, onClick, tip, count, children }: { on: boolean; onClick: () => void; tip?: string; count?: number; children: React.ReactNode }) {
  const btn = (
    <button type="button" className={`${styles.chip} ${on ? styles.chipOn : ""}`} onClick={onClick} aria-pressed={on}>
      {children}
      {count !== undefined && <span className={styles.chipCount}>{count}</span>}
    </button>
  );
  return tip ? (
    <span title={tip} className={styles.chipWrap}>
      {btn}
    </span>
  ) : (
    btn
  );
}

export function DebateCard({ c }: { c: ClaimListItem }) {
  const quadrant = quadrantOf(c);
  return (
    <article className={styles.card}>
      <div className={styles.cardBadges}>
        <TypeBadge type={c.type} />
        <EvidenceBadge evidenceStrength={c.evidenceStrength} />
        {c.tags.map((t) => (
          <TagBadge tag={t} key={t} />
        ))}
        {c.contestedAt && <span className={styles.contested}>CONTESTED</span>}
        {c.isRoot && <span className={styles.rootMark}>DEBATE</span>}
      </div>
      <h2 className={styles.cardTitle}>
        <Link href={`/claim/${c.slug}`}>{c.title}</Link>
      </h2>
      {c.oneLiner && <p className={styles.cardOneLiner}>{c.oneLiner}</p>}
      {showTurnsOn(c) && c.turnsOn && (
        <p className={styles.turnsOn}>
          <span className={styles.turnsOnLabel}>TURNS ON</span> <Link href={`/claim/${c.turnsOn.slug}`}>{c.turnsOn.title}</Link>
        </p>
      )}
      <div className={styles.cardMeta}>
        <span>
          <strong style={{ color: "var(--supports-ink)" }}>{c.supportsCount}</strong> for ·{" "}
          <strong style={{ color: "var(--contradicts)" }}>{c.contradictsCount}</strong> against
          {c.usedInCount > 0 ? <> · used in {c.usedInCount}</> : null}
        </span>
        <span>
          <strong>{c.raterCount}</strong> raters
          {c.raterCount > 0 ? (
            <>
              {" "}
              · {c.agreePct}% agree · {c.wellConstructedPct}% well made ·{" "}
              <span title={QUADRANT_COPY[quadrant]} className={styles.quadrant}>
                {quadrant}
              </span>
            </>
          ) : null}
        </span>
        {c.voiceCount > 0 && (
          <span>
            <strong>{c.voiceCount}</strong> {c.voiceCount === 1 ? "voice" : "voices"}
          </span>
        )}
        <Link href={`/graph?focus=${c.slug}`} className={styles.cardGraph}>
          GRAPH →
        </Link>
      </div>
    </article>
  );
}

function ClaimTable({ rows }: { rows: ClaimListItem[] }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Claim</th>
            <th>Type</th>
            <th>Topics</th>
            <th>Evidence</th>
            <th className={styles.num}>For</th>
            <th className={styles.num}>Against</th>
            <th className={styles.num}>Used in</th>
            <th className={styles.num}>Raters</th>
            <th className={styles.num}>Agree</th>
            <th className={styles.num}>Well made</th>
            <th>Rates</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={12} className={styles.empty}>
                Nothing matches those filters. Loosen one.
              </td>
            </tr>
          )}
          {rows.map((c) => {
            const quadrant = quadrantOf(c);
            const status = [c.isRoot ? "Debate" : null, c.isTurningPoint ? "Question" : null, c.contestedAt ? "Contested" : null, showTurnsOn(c) ? "Live question" : null].filter(Boolean).join(" · ");
            return (
              <tr key={c.id}>
                <td className={styles.tdTitle}>
                  <Link href={`/claim/${c.slug}`}>{c.title}</Link>
                </td>
                <td>
                  <TypeBadge type={c.type} />
                </td>
                <td className={styles.tdTags}>
                  {c.tags.map((t) => (
                    <TagBadge tag={t} key={t} />
                  ))}
                </td>
                <td>
                  <EvidenceBadge evidenceStrength={c.evidenceStrength} />
                </td>
                <td className={styles.num} style={{ color: "var(--supports-ink)" }}>
                  {c.supportsCount}
                </td>
                <td className={styles.num} style={{ color: "var(--contradicts)" }}>
                  {c.contradictsCount}
                </td>
                <td className={styles.num}>{c.usedInCount}</td>
                <td className={styles.num}>{c.raterCount}</td>
                <td className={styles.num}>{c.agreePct === null ? "—" : `${c.agreePct}%`}</td>
                <td className={styles.num}>{c.wellConstructedPct === null ? "—" : `${c.wellConstructedPct}%`}</td>
                <td>
                  <span title={QUADRANT_COPY[quadrant]} className={styles.quadrant}>
                    {quadrant.charAt(0) + quadrant.slice(1).toLowerCase()}
                  </span>
                </td>
                <td className={styles.tdStatus}>{status || "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
