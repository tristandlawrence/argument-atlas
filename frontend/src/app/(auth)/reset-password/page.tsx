"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/authClient";
import styles from "../AuthForm.module.css";

function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setError("This reset link is missing its token — request a new one.");
      return;
    }
    setSubmitting(true);
    const { error: resetError } = await authClient.resetPassword({ newPassword, token });
    setSubmitting(false);
    if (resetError) {
      setError(resetError.message ?? "That reset link is invalid or has expired.");
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/sign-in"), 1500);
  }

  if (done) {
    return (
      <main className={styles.page}>
        <h1 className={styles.heading}>Password updated</h1>
        <p className={styles.subheading}>
          Redirecting you to sign in… <Link href="/sign-in">or click here</Link>.
        </p>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>Choose a new password</h1>
      <div className={styles.card}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <span className={styles.label}>NEW PASSWORD</span>
            <input
              className={styles.input}
              type="password"
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          {error && <span className={styles.error}>{error}</span>}
          <button type="submit" className={styles.primaryButton} disabled={submitting}>
            {submitting ? "Saving…" : "Save new password"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
