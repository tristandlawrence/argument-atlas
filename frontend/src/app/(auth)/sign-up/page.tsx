"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/authClient";
import { OAuthButtonRow } from "@/components/OAuthButtonRow";
import { PostcodeElectorateField } from "@/components/PostcodeElectorateField";
import {
  GENDER_OPTIONS,
  AGE_RANGE_OPTIONS,
  EDUCATION_LEVEL_OPTIONS,
  RELATIONSHIP_STATUS_OPTIONS,
} from "@/lib/demographicOptions";
import styles from "../AuthForm.module.css";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [postcode, setPostcode] = useState("");
  const [state, setState] = useState("");
  const [federalElectorate, setFederalElectorate] = useState("");
  const [gender, setGender] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [relationshipStatus, setRelationshipStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error: signUpError } = await authClient.signUp.email({
      name,
      email,
      password,
      callbackURL: `${window.location.origin}/`,
      postcode: postcode || undefined,
      state: state || undefined,
      federalElectorate: federalElectorate || undefined,
      gender: gender || undefined,
      ageRange: ageRange || undefined,
      educationLevel: educationLevel || undefined,
      relationshipStatus: relationshipStatus || undefined,
    } as never);
    setSubmitting(false);
    if (signUpError) {
      setError(signUpError.message ?? "Something went wrong signing you up.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <main className={styles.page}>
        <h1 className={styles.heading}>Check your email</h1>
        <p className={styles.subheading}>
          We&rsquo;ve sent a verification link to {email}. Follow it to activate your account, then{" "}
          <Link href="/sign-in">sign in</Link>.
        </p>
      </main>
    );
  }

  return (
    <main className={styles.pageWide}>
      <h1 className={styles.heading}>Create an account</h1>
      <p className={styles.subheading}>
        Sign up to vote, rate connection strength, and edit claims. Demographic details are optional, shown to
        readers only as aggregated cross-tabs (never linked to your individual votes), and help align the platform
        with how real polling firms report results.
      </p>

      <div className={styles.card}>
        <OAuthButtonRow />
        <div className={styles.divider}>OR</div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.sectionLabel}>ACCOUNT</div>
          <div className={styles.field}>
            <span className={styles.label}>NAME</span>
            <input className={styles.input} value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
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
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className={styles.sectionLabel}>
            DEMOGRAPHICS <span className={styles.optionalHint}>— all optional</span>
          </div>
          <div className={styles.field}>
            <span className={styles.label}>POSTCODE</span>
            <PostcodeElectorateField
              postcode={postcode}
              state={state}
              federalElectorate={federalElectorate}
              onChange={(next) => {
                setPostcode(next.postcode);
                setState(next.state);
                setFederalElectorate(next.federalElectorate);
              }}
            />
          </div>
          <div className={styles.field}>
            <span className={styles.label}>GENDER</span>
            <select className={styles.select} value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">Prefer not to say</option>
              {GENDER_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <span className={styles.label}>AGE RANGE</span>
            <select className={styles.select} value={ageRange} onChange={(e) => setAgeRange(e.target.value)}>
              <option value="">Prefer not to say</option>
              {AGE_RANGE_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <span className={styles.label}>EDUCATION LEVEL</span>
            <select
              className={styles.select}
              value={educationLevel}
              onChange={(e) => setEducationLevel(e.target.value)}
            >
              <option value="">Prefer not to say</option>
              {EDUCATION_LEVEL_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <span className={styles.label}>RELATIONSHIP STATUS</span>
            <select
              className={styles.select}
              value={relationshipStatus}
              onChange={(e) => setRelationshipStatus(e.target.value)}
            >
              <option value="">Prefer not to say</option>
              {RELATIONSHIP_STATUS_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>

          {error && <span className={styles.error}>{error}</span>}
          <button type="submit" className={styles.primaryButton} disabled={submitting}>
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>
      </div>

      <p className={styles.footNote}>
        Already have an account? <Link href="/sign-in">Sign in</Link>
      </p>
    </main>
  );
}
