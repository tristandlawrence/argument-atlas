"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { TypeBadge, TagBadge, EvidenceBadge } from "./ClassificationBadge";
import { Term } from "./Term";
import { EVIDENCE_LABEL, QUADRANT_COPY, TAG_COPY } from "@/lib/copy";
import { quadrantOf, type ClaimListItem, type Quadrant } from "@/lib/types";
import styles from "./HomeBrowser.module.css";

/**
 * The homepage as a browser, not a feed. Debates (claims with arguments
 * beneath them and nothing above) come first, ordered by raters; every
 * classification the product uses is a filter: topic, type, evidence,
 * rating quadrant, status. Nothing here is ordered by agreement.
 */

type Scope = "debates" | "all";
type Sort = "raters" | "arguments" | "newest" | "alpha";
type Status = "CONTESTED" | "CONTENTIOUS" | "UNRATED" | "CROSS";

const TYPES = ["FACT", "OPINION", "VALUE", "PROPOSAL"];
const EVIDENCE = ["STRONG", "MODERATE", "WEAK", "NONE"];
const QUADRANTS: Quadrant[] = ["COMPELLING", "STEELMAN", "PARTISAN", "WEAK", "UNRATED"];
const STATUS: { key: Status; label: string; tip: string }[] = [
  { key: "CONTESTED", label: "CONTESTED", tip: "In contested status: edits queue for review while reading and rating stay open." },
  { key: "CONTENTIOUS", label: "HAS A LIVE QUESTION", tip: "Has a connection editors have marked as where the debate currently turns." },
  { key: "CROSS", label: "USED ELSEWHERE", tip: "Appears in more than one place in the atlas." },
  { key: "UNRATED", label: "NOT YET RATED", tip: "Nobody has rated this claim yet. A good place to start." },
];

export function HomeBrowser({
  claims,
  initial,
}: {
  claims: ClaimListItem[];
  initial: { tag: string | null; type: string | null; q: string; scope: Scope };
}) {
  const [scope, setScope] = useState<Scope>(initial.scope);
  const [q, setQ] = useState(initial.q);
  const [tag, setTag] = useState<string | null>(initial.tag);
  const [types, setTypes] = useState<Set<string>>(new Set(initial.type ? [initial.type] : []));
  const [evidence, setEvidence] = useState<Set<string>>(new Set());
  const [quadrants, setQuadrants] = useState<Set<Quadrant>>(new Set());
  const [status, setStatus] = useState<Set<Status>>(new Set());
  const [sort, setSort] = useState<Sort>("raters");

  const allTags = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of claims) for (const t of c.tags) counts[t] = (counts[t] ?? 0) + 1;
    return Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]));
  }, [claims]);

  const toggle = <T,>(set: Set<T>, value: T, setter: (s: Set<T>) => void) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  };

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = claims.filter((c) => {
      if (scope === "debates" && !c.isRoot) return false;
      if (tag && !c.tags.includes(tag)) return false;
      if (types.size && !types.has(c.type)) return false;
      if (evidence.size && !evidence.has(c.evidenceStrength)) return false;
      if (quadrants.size && !quadrants.has(quadrantOf(c))) return false;
      if (status.has("CONTESTED") && !c.contestedAt) return false;
      if (status.has("CONTENTIOUS") && !c.turnsOn) return false;
      if (status.has("CROSS") && c.usedInCount < 2) return false;
      if (status.has("UNRATED") && c.raterCount > 0) return false;
      if (needle && !`${c.title} ${c.oneLiner}`.toLowerCase().includes(needle)) return false;
      return true;
    });
    const by: Record<Sort, (a: ClaimListItem, b: ClaimListItem) => number> = {
      raters: (a, b) => b.raterCount - a.raterCount || b.supportsCount + b.contradictsCount - (a.supportsCount + a.contradictsCount),
      arguments: (a, b) => b.supportsCount + b.contradictsCount - (a.supportsCount + a.contradictsCount) || b.raterCount - a.raterCount,
      newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
      alpha: (a, b) => a.title.localeCompare(b.title),
    };
    return list.sort(by[sort]);
  }, [claims, scope, q, tag, types, evidence, quadrants, status, sort]);

  const activeCount = (tag ? 1 : 0) + types.size + evidence.size + quadrants.size + status.size + (q ? 1 : 0);
  const clearAll = () => {
    setTag(null);
    setTypes(new Set());
    setEvidence(new Set());
    setQuadrants(new Set());
    setStatus(new Set());
    setQ("");
  };

  const rootCount = claims.filter((c) => c.isRoot).length;

  return (
    <main className={styles.main}>
      <div className={styles.masthead}>
        <div>
          <h1 className={styles.heading}>Arguments worth having</h1>
          <p className={styles.sub}>
            {rootCount} debates, {claims.length} claims. Read a debate, find where it turns, rate what you think and how well it is argued.
          </p>
        </div>
        <div className={styles.scope} role="tablist" aria-label="Scope">
          <button type="button" role="tab" aria-selected={scope === "debates"} className={`${styles.scopeTab} ${scope === "debates" ? styles.scopeOn : ""}`} onClick={() => setScope("debates")}>
            DEBATES
          </button>
          <button type="button" role="tab" aria-selected={scope === "all"} className={`${styles.scopeTab} ${scope === "all" ? styles.scopeOn : ""}`} onClick={() => setScope("all")}>
            ALL CLAIMS
          </button>
          <Link href="/graph" className={styles.scopeLink}>
            GRAPH →
          </Link>
        </div>
      </div>

      <div className={styles.layout}>
        <aside className={styles.filters} aria-label="Filters">
          <input
            type="search"
            className={styles.search}
            placeholder="Search titles…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search claim titles"
          />

          <FilterGroup label="TOPIC">
            <Chip on={tag === null} onClick={() => setTag(null)}>
              ALL
            </Chip>
            {allTags.map(([t, n]) => (
              <Chip key={t} on={tag === t} onClick={() => setTag(tag === t ? null : t)} tip={TAG_COPY[t]} count={n}>
                {t}
              </Chip>
            ))}
          </FilterGroup>

          <FilterGroup label="TYPE" hint="Facts can be settled by evidence; values cannot. Proposals stand on both.">
            {TYPES.map((t) => (
              <Chip key={t} on={types.has(t)} onClick={() => toggle(types, t, setTypes)}>
                {t}
              </Chip>
            ))}
          </FilterGroup>

          <FilterGroup label="EVIDENCE">
            {EVIDENCE.map((e) => (
              <Chip key={e} on={evidence.has(e)} onClick={() => toggle(evidence, e, setEvidence)}>
                {EVIDENCE_LABEL[e].replace(" EVIDENCE", "")}
              </Chip>
            ))}
          </FilterGroup>

          <FilterGroup label="HOW IT RATES" hint="Agreement and craft are rated separately, so a claim can be well made and still unpersuasive.">
            {QUADRANTS.map((qd) => (
              <Chip key={qd} on={quadrants.has(qd)} onClick={() => toggle(quadrants, qd, setQuadrants)} tip={QUADRANT_COPY[qd]}>
                {qd}
              </Chip>
            ))}
          </FilterGroup>

          <FilterGroup label="STATUS">
            {STATUS.map((st) => (
              <Chip key={st.key} on={status.has(st.key)} onClick={() => toggle(status, st.key, setStatus)} tip={st.tip}>
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
              {filtered.length} {scope === "debates" ? (filtered.length === 1 ? "debate" : "debates") : filtered.length === 1 ? "claim" : "claims"}
            </span>
            <label className={styles.sortLabel}>
              SORT
              <select className={styles.sort} value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                <option value="raters">Most rated</option>
                <option value="arguments">Most argued</option>
                <option value="newest">Newest</option>
                <option value="alpha">A to Z</option>
              </select>
            </label>
          </div>

          {filtered.length === 0 && <p className={styles.empty}>Nothing matches those filters. Loosen one, or switch to all claims.</p>}

          {filtered.map((c) => (scope === "debates" || c.isRoot ? <DebateCard key={c.id} c={c} /> : <ClaimRow key={c.id} c={c} />))}
        </section>
      </div>
    </main>
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

function DebateCard({ c }: { c: ClaimListItem }) {
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
      </div>
      <h2 className={styles.cardTitle}>
        <Link href={`/claim/${c.slug}`}>{c.title}</Link>
      </h2>
      {c.oneLiner && <p className={styles.cardOneLiner}>{c.oneLiner}</p>}
      {c.turnsOn && (
        <p className={styles.turnsOn}>
          <span className={styles.turnsOnLabel}>TURNS ON</span>{" "}
          <Link href={`/claim/${c.turnsOn.slug}`}>{c.turnsOn.title}</Link>
        </p>
      )}
      <div className={styles.cardMeta}>
        <span>
          <strong style={{ color: "var(--supports-ink)" }}>{c.supportsCount}</strong> for ·{" "}
          <strong style={{ color: "var(--contradicts)" }}>{c.contradictsCount}</strong> against
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

function ClaimRow({ c }: { c: ClaimListItem }) {
  const quadrant = quadrantOf(c);
  return (
    <div className={styles.row}>
      <div className={styles.rowMain}>
        <Link href={`/claim/${c.slug}`} className={styles.rowTitle}>
          {c.title}
        </Link>
        <div className={styles.rowBadges}>
          <TypeBadge type={c.type} />
          <EvidenceBadge evidenceStrength={c.evidenceStrength} />
          {c.tags.map((t) => (
            <TagBadge tag={t} key={t} />
          ))}
          {c.contestedAt && <span className={styles.contested}>CONTESTED</span>}
        </div>
      </div>
      <div className={styles.rowStats}>
        <span>
          {c.supportsCount + c.contradictsCount} beneath · used in {c.usedInCount}
        </span>
        <span title={QUADRANT_COPY[quadrant]}>
          {c.raterCount} raters{c.raterCount > 0 ? ` · ${quadrant}` : ""}
        </span>
      </div>
    </div>
  );
}
