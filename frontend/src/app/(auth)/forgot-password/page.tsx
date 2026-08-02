"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/authClient";
import styles from "../AuthForm.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    setSent(true);
  }

  if (sent) {
    return (
      <main className={styles.page}>
        <h1 className={styles.heading}>Check your email</h1>
        <p className={styles.subheading}>
          If an account exists for {email}, we&rsquo;ve sent a link to reset your password.
        </p>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>Reset your password</h1>
      <p className={styles.subheading}>We&rsquo;ll email you a link to choose a new one.</p>
      <div className={styles.card}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <span className={styles.label}>EMAIL</span>
            <input
              className={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className={styles.primaryButton} disabled={submitting}>
            {submitting ? "Sending…" : "Send reset link"}
          </button>
        </form>
      </div>
      <p className={styles.footNote}>
        <Link href="/sign-in">Back to sign in</Link>
      </p>
    </main>
  );
}
