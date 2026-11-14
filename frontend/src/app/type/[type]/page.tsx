import Link from "next/link";
import { notFound } from "next/navigation";
import { TypeBadge, TagBadge } from "@/components/ClassificationBadge";
import { fetchClaims } from "@/lib/api";
import { CLASSIFICATION_COPY, TYPE_LABEL } from "@/lib/copy";
import styles from "../../page.module.css";

const TYPES = ["fact", "opinion", "value", "proposal"];

export default async function TypePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (!TYPES.includes(type)) notFound();
  const upper = type.toUpperCase();
  const claims = await fetchClaims({ type: upper });

  return (
    <main className={styles.main}>
      <div className={styles.crumb}>
        <Link href="/">CLAIMS</Link> / TYPE / {upper}
      </div>
      <div className={styles.facetHeader}>
        <TypeBadge type={upper} />
        <h1 className={styles.heading}>{TYPE_LABEL[upper]} claims</h1>
      </div>
      <p className={styles.definition}>{CLASSIFICATION_COPY[upper]}</p>
      <p className={styles.count}>
        {claims.length} {claims.length === 1 ? "claim" : "claims"} · other types:{" "}
        {TYPES.filter((t) => t !== type).map((t, i) => (
          <span key={t}>
            {i > 0 ? " · " : ""}
            <Link href={`/type/${t}`}>{TYPE_LABEL[t.toUpperCase()]}</Link>
          </span>
        ))}
      </p>
      <div className={styles.list}>
        {claims.map((claim) => (
          <div className={styles.row} key={claim.id}>
            <Link href={`/claim/${claim.slug}`} className={styles.rowTitle}>
              {claim.title}
            </Link>
            <div className={styles.rowMeta}>
              {claim.tags.map((tag) => (
                <TagBadge tag={tag} key={tag} />
              ))}
              {claim.contestedAt ? <span className={styles.contested}>CONTESTED</span> : null}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
