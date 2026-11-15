import Link from "next/link";
import { fetchClaims } from "@/lib/api";
import { SLICES } from "@/lib/slices";
import { DebateCard } from "@/components/HomeBrowser";
import { showTurnsOn } from "@/lib/types";
import styles from "./home.module.css";

/**
 * The front door: a few recommended ways in, each a pre-canned filter view
 * derived from a principle in the requirements, then the live debates.
 * The full browser lives at /claims.
 */
export default async function Home() {
  const claims = await fetchClaims();
  const slices = SLICES.map((s) => {
    const hits = claims.filter(s.test);
    const example = [...hits].sort((a, b) => b.raterCount - a.raterCount)[0];
    return { ...s, count: hits.length, example };
  }).filter((s) => s.count > 0);
  const live = claims.filter((c) => c.isRoot && showTurnsOn(c)).sort((a, b) => b.raterCount - a.raterCount);
  const otherRoots = claims.filter((c) => c.isRoot && !showTurnsOn(c)).sort((a, b) => b.raterCount - a.raterCount);

  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <h1 className={styles.heading}>Arguments worth having</h1>
        <p className={styles.lede}>
          Public debates, taken apart into claims you can read, rate and improve. Each claim says one thing. Each debate shows what supports it, what contradicts
          it, and where it currently turns.
        </p>
        <div className={styles.heroLinks}>
          <Link href="/claims" className={styles.primaryLink}>
            Browse all {claims.length} claims →
          </Link>
          <Link href="/graph" className={styles.secondaryLink}>
            See the atlas as a graph →
          </Link>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>START HERE</h2>
        <p className={styles.sectionSub}>Recommended slices. Each opens the browser with the filters set, so you can widen it from there.</p>
        <div className={styles.sliceGrid}>
          {slices.map((s) => (
            <Link key={s.key} href={`/claims?${new URLSearchParams(s.params).toString()}`} className={styles.slice}>
              <div className={styles.sliceTop}>
                <span className={styles.sliceTitle}>{s.title}</span>
                <span className={styles.sliceCount}>{s.count}</span>
              </div>
              <p className={styles.sliceBlurb}>{s.blurb}</p>
              {s.example && (
                <p className={styles.sliceExample}>
                  <span className={styles.sliceExampleLabel}>E.G.</span> {s.example.title}
                </p>
              )}
              <p className={styles.sliceWhy} title="Which principle in the requirements this slice comes from">
                {s.why}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {live.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>CONTENTIOUS PROPOSALS</h2>
          <p className={styles.sectionSub}>Debates with a confident live question. The line under each one is the claim it currently turns on.</p>
          {live.map((c) => (
            <DebateCard key={c.id} c={c} />
          ))}
        </section>
      )}

      {otherRoots.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>OTHER DEBATES</h2>
          <p className={styles.sectionSub}>Debates whose live question is not yet confidently marked, or not rated by enough people to show.</p>
          <ul className={styles.plainList}>
            {otherRoots.map((c) => (
              <li key={c.id}>
                <Link href={`/claim/${c.slug}`}>{c.title}</Link>
                <span className={styles.plainMeta}>
                  {" "}
                  · {c.supportsCount} for, {c.contradictsCount} against · {c.raterCount} raters
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
