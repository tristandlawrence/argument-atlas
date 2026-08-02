import Link from "next/link";
import { fetchClaims } from "@/lib/api";
import styles from "./page.module.css";

export default async function Home() {
  const claims = await fetchClaims();
  return (
    <main className={styles.main}>
      <h1 className={styles.heading}>Claims</h1>
      <div className={styles.list}>
        {claims.map((claim) => (
          <Link href={`/claim/${claim.slug}`} className={styles.row} key={claim.id}>
            <div className={styles.rowTitle}>{claim.title}</div>
            <div className={styles.rowMeta}>
              {claim.type} · {claim.tags.join(" · ")}
              {claim.contestedAt ? " · CONTESTED" : ""}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
