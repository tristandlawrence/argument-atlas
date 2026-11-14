import Link from "next/link";
import { TypeBadge, TagBadge } from "@/components/ClassificationBadge";
import { fetchClaims } from "@/lib/api";
import styles from "./page.module.css";

export default async function Home() {
  const claims = await fetchClaims();
  return (
    <main className={styles.main}>
      <h1 className={styles.heading}>Claims</h1>
      <div className={styles.list}>
        {claims.map((claim) => (
          <div className={styles.row} key={claim.id}>
            <Link href={`/claim/${claim.slug}`} className={styles.rowTitle}>
              {claim.title}
            </Link>
            <div className={styles.rowMeta}>
              <TypeBadge type={claim.type} />
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
