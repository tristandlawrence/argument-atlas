"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/authClient";
import { OAuthButtonRow } from "@/components/OAuthButtonRow";
import styles from "../AuthForm.module.css";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [needsTotp, setNeedsTotp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { data, error: signInError } = await authClient.signIn.email({ email, password });
    setSubmitting(false);
    if (signInError) {
      setError(signInError.message ?? "Couldn't sign you in.");
      return;
    }
    if (data && "twoFactorRedirect" in data && data.twoFactorRedirect) {
      setNeedsTotp(true);
      return;
    }
    router.push("/");
  }

  async function handleTotpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error: totpError } = await authClient.twoFactor.verifyTotp({ code: totpCode, trustDevice: true });
    setSubmitting(false);
    if (totpError) {
      setError(totpError.message ?? "That code didn't work.");
      return;
    }
    router.push("/");
  }

  async function handlePasskey() {
    setError(null);
    const { error: passkeyError } = await authClient.signIn.passkey();
    if (passkeyError) {
      setError(passkeyError.message ?? "Passkey sign-in failed.");
      return;
    }
    router.push("/");
  }

  if (needsTotp) {
    return (
      <main className={styles.page}>
        <h1 className={styles.heading}>Enter your authenticator code</h1>
        <p className={styles.subheading}>This account has two-factor authentication enabled.</p>
        <div className={styles.card}>
          <form className={styles.form} onSubmit={handleTotpSubmit}>
            <div className={styles.field}>
              <span className={styles.label}>6-DIGIT CODE</span>
              <input
                className={styles.input}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                maxLength={6}
                autoFocus
                required
              />
            </div>
            {error && <span className={styles.error}>{error}</span>}
            <button type="submit" className={styles.primaryButton} disabled={submitting}>
              Verify
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>Sign in</h1>
      <p className={styles.subheading}>Vote, rate connection strength, and edit claims under your own account.</p>

      <div className={styles.card}>
        <OAuthButtonRow />
        <button type="button" className={styles.secondaryButton} onClick={handlePasskey}>
          Sign in with a passkey →
        </button>
        <div className={styles.divider}>OR</div>

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
          <div className={styles.field}>
            <span className={styles.label}>PASSWORD</span>
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <span className={styles.error}>{error}</span>}
          <button type="submit" className={styles.primaryButton} disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </button>
          <Link href="/forgot-password" className={styles.secondaryButton}>
            Forgot your password?
          </Link>
        </form>
      </div>

      <p className={styles.footNote}>
        Don&rsquo;t have an account? <Link href="/sign-up">Sign up</Link>
      </p>
    </main>
  );
}
