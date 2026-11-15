import Link from "next/link";
import { TypeBadge, TagBadge } from "@/components/ClassificationBadge";
import { loadClaims, loadFacets } from "@/lib/data.server";
import { IS_STATIC } from "@/lib/static";
import { TAG_COPY } from "@/lib/copy";
import styles from "../../page.module.css";

export async function generateStaticParams() {
  if (!IS_STATIC) return [];
  const facets = await loadFacets();
  return Object.keys(facets.byTag).map((t) => ({ tag: t.toLowerCase() }));
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const upper = decodeURIComponent(tag).toUpperCase();
  const [claims, facets] = await Promise.all([loadClaims({ tag: upper }), loadFacets()]);
  const otherTags = Object.keys(facets.byTag)
    .filter((t) => t !== upper)
    .sort();

  return (
    <main className={styles.main}>
      <div className={styles.crumb}>
        <Link href="/">CLAIMS</Link> / TOPIC / {upper}
      </div>
      <div className={styles.facetHeader}>
        <TagBadge tag={upper} />
        <h1 className={styles.heading}>{upper.charAt(0) + upper.slice(1).toLowerCase()}</h1>
      </div>
      <p className={styles.definition}>{TAG_COPY[upper] ?? `Claims tagged ${upper}. Topics are free text until the tag taxonomy ships.`}</p>
      <p className={styles.count}>
        {claims.length} {claims.length === 1 ? "claim" : "claims"}
        {otherTags.length > 0 ? " · other topics: " : ""}
        {otherTags.map((t, i) => (
          <span key={t}>
            {i > 0 ? " · " : ""}
            <Link href={`/tag/${encodeURIComponent(t.toLowerCase())}`}>
              {t} ({facets.byTag[t]})
            </Link>
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
              <TypeBadge type={claim.type} />
              {claim.tags
                .filter((t) => t !== upper)
                .map((t) => (
                  <TagBadge tag={t} key={t} />
                ))}
              {claim.contestedAt ? <span className={styles.contested}>CONTESTED</span> : null}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
