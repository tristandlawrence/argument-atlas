"use client";

import Link from "next/link";
import { useSession } from "@/lib/authClient";
import { IS_STATIC } from "@/lib/static";
import styles from "./SiteHeader.module.css";

export function AuthNavItem() {
  if (IS_STATIC) return <AuthNavStatic />;
  return <AuthNavLive />;
}

function AuthNavStatic() {
  return (
    <span className={styles.signIn} title="Sign-in is not available on the read-only snapshot" aria-disabled="true">
      READ-ONLY
    </span>
  );
}

function AuthNavLive() {
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
