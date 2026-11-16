import Link from "next/link";
import { loadSnapshotMeta } from "@/lib/data.server";
import { IS_STATIC } from "@/lib/static";
import styles from "./StaticBanner.module.css";

/** Shown only on the read-only snapshot build. */
export async function StaticBanner() {
  if (!IS_STATIC) return null;
  const meta = await loadSnapshotMeta();
  const taken = meta ? new Date(meta.takenAt).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }) : null;
  return (
    <div className={styles.banner} role="note">
      <span className={styles.label}>READ-ONLY SNAPSHOT</span>
      <span>
        A static copy of the prototype{taken ? ` taken on ${taken}` : ""}. You can read everything; voting, challenging and editing do nothing here.
        {" "}
        <Link href="/about/prototype">What we are testing and how to help →</Link>
      </span>
    </div>
  );
}
