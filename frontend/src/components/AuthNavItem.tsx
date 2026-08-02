"use client";

import Link from "next/link";
import { useSession } from "@/lib/authClient";
import styles from "./SiteHeader.module.css";

export function AuthNavItem() {
  const { data: session, isPending } = useSession();

  if (isPending) return null;

  if (session) {
    return (
      <Link href="/account" className={styles.signIn}>
        {session.user.name || "ACCOUNT"}
      </Link>
    );
  }

  return (
    <Link href="/sign-in" className={styles.signIn}>
      SIGN IN
    </Link>
  );
}
