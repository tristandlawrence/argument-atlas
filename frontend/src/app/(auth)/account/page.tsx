"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { authClient, useSession } from "@/lib/authClient";
import { PostcodeElectorateField } from "@/components/PostcodeElectorateField";
import {
  GENDER_OPTIONS,
  AGE_RANGE_OPTIONS,
  EDUCATION_LEVEL_OPTIONS,
  RELATIONSHIP_STATUS_OPTIONS,
  OAUTH_PROVIDER_LABELS,
} from "@/lib/demographicOptions";
import formStyles from "../AuthForm.module.css";
import styles from "./AccountPage.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export default function AccountPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) router.push("/sign-in");
  }, [isPending, session, router]);

  if (isPending || !session) {
    return (
      <main className={formStyles.pageWide}>
        <p className={formStyles.subheading}>Loading…</p>
      </main>
    );
  }

  return (
    <main className={formStyles.pageWide}>
      <h1 className={formStyles.heading}>Your account</h1>
      <p className={formStyles.subheading}>
        Signed in as {session.user.email}
        {session.user.emailVerified ? (
          <span className={styles.statusPill} style={{ marginLeft: 8 }}>
            VERIFIED
          </span>
        ) : (
          <span className={formStyles.error} style={{ marginLeft: 8 }}>
            Email not verified
          </span>
        )}
      </p>

      <div className={formStyles.card}>
        <DemographicsSection />
        <TwoFactorSection />
        <PasskeySection />
        <LinkedAccountsSection />

        <div className={formStyles.sectionLabel}>SESSION</div>
        <button
          type="button"
          className={styles.smallButton}
          onClick={async () => {
            await authClient.signOut();
            router.push("/");
          }}
        >
          Sign out
        </button>
      </div>
    </main>
  );
}

function DemographicsSection() {
  const { data: session } = useSession();
  const user = session?.user as Record<string, unknown> | undefined;
  const [postcode, setPostcode] = useState((user?.postcode as string) ?? "");
  const [state, setState] = useState((user?.state as string) ?? "");
  const [federalElectorate, setFederalElectorate] = useState((user?.federalElectorate as string) ?? "");
  const [gender, setGender] = useState((user?.gender as string) ?? "");
  const [ageRange, setAgeRange] = useState((user?.ageRange as string) ?? "");
  const [educationLevel, setEducationLevel] = useState((user?.educationLevel as string) ?? "");
  const [relationshipStatus, setRelationshipStatus] = useState((user?.relationshipStatus as string) ?? "");
  const [saved, setSaved] = useState(false);

  async function save() {
    await authClient.updateUser({
      postcode,
      state,
      federalElectorate,
      gender,
      ageRange,
      educationLevel,
      relationshipStatus,
    } as never);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <>
      <div className={formStyles.sectionLabel}>DEMOGRAPHICS</div>
      <div className={formStyles.form}>
        <div className={formStyles.field}>
          <span className={formStyles.label}>POSTCODE</span>
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
        <div className={formStyles.field}>
          <span className={formStyles.label}>GENDER</span>
          <select className={formStyles.select} value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="">Prefer not to say</option>
            {GENDER_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
        <div className={formStyles.field}>
          <span className={formStyles.label}>AGE RANGE</span>
          <select className={formStyles.select} value={ageRange} onChange={(e) => setAgeRange(e.target.value)}>
            <option value="">Prefer not to say</option>
            {AGE_RANGE_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
        <div className={formStyles.field}>
          <span className={formStyles.label}>EDUCATION LEVEL</span>
          <select
            className={formStyles.select}
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
        <div className={formStyles.field}>
          <span className={formStyles.label}>RELATIONSHIP STATUS</span>
          <select
            className={formStyles.select}
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
        <button type="button" className={styles.smallButtonPrimary} style={{ alignSelf: "flex-start" }} onClick={save}>
          Save demographics
        </button>
        {saved && <span className={formStyles.success}>Saved.</span>}
      </div>
    </>
  );
}

function TwoFactorSection() {
  const { data: session } = useSession();
  const enabled = !!(session?.user as Record<string, unknown> | undefined)?.twoFactorEnabled;
  const [step, setStep] = useState<"idle" | "password" | "enroll" | "verify">("idle");
  const [password, setPassword] = useState("");
  const [totpUri, setTotpUri] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function startEnroll(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const { data, error: enableError } = await authClient.twoFactor.enable({ password, issuer: "Argument Atlas" });
    if (enableError) {
      setError(enableError.message ?? "Couldn't start 2FA setup.");
      return;
    }
    setTotpUri(data.totpURI);
    setBackupCodes(data.backupCodes);
    setQrDataUrl(await QRCode.toDataURL(data.totpURI));
    setStep("enroll");
  }

  async function confirmEnroll(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const { error: verifyError } = await authClient.twoFactor.verifyTotp({ code });
    if (verifyError) {
      setError(verifyError.message ?? "That code didn't match.");
      return;
    }
    setStep("idle");
    window.location.reload();
  }

  return (
    <>
      <div className={formStyles.sectionLabel}>AUTHENTICATOR APP (2FA)</div>
      {step === "idle" && (
        <div className={styles.row}>
          <span className={styles.rowLabel}>{enabled ? "Enabled" : "Not enabled"}</span>
          {!enabled && (
            <button type="button" className={styles.smallButton} onClick={() => setStep("password")}>
              Set up
            </button>
          )}
          {enabled && (
            <button
              type="button"
              className={styles.smallButtonDanger}
              onClick={async () => {
                const pw = window.prompt("Confirm your password to disable 2FA:");
                if (pw) {
                  await authClient.twoFactor.disable({ password: pw });
                  window.location.reload();
                }
              }}
            >
              Disable
            </button>
          )}
        </div>
      )}
      {step === "password" && (
        <form className={formStyles.form} onSubmit={startEnroll}>
          <div className={formStyles.field}>
            <span className={formStyles.label}>CONFIRM YOUR PASSWORD</span>
            <input
              className={formStyles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <span className={formStyles.error}>{error}</span>}
          <button type="submit" className={styles.smallButtonPrimary} style={{ alignSelf: "flex-start" }}>
            Continue
          </button>
        </form>
      )}
      {step === "enroll" && (
        <div>
          <p className={formStyles.subheading}>Scan this with your authenticator app, then enter a code to confirm.</p>
          {qrDataUrl && <img src={qrDataUrl} alt="Scan with your authenticator app" className={styles.qrImage} />}
          <p className={formStyles.subheading} style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
            {totpUri}
          </p>
          <div className={styles.backupCodes}>{backupCodes.join("\n")}</div>
          <p className={formStyles.subheading}>Save these backup codes somewhere safe — each works once if you lose your device.</p>
          <form className={formStyles.form} onSubmit={confirmEnroll}>
            <div className={formStyles.field}>
              <span className={formStyles.label}>6-DIGIT CODE</span>
              <input className={formStyles.input} value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} required />
            </div>
            {error && <span className={formStyles.error}>{error}</span>}
            <button type="submit" className={styles.smallButtonPrimary} style={{ alignSelf: "flex-start" }}>
              Confirm and enable
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function PasskeySection() {
  const [passkeys, setPasskeys] = useState<{ id: string; name?: string | null; createdAt?: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const { data } = await authClient.passkey.listUserPasskeys();
    setPasskeys(data ?? []);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function addPasskey() {
    setError(null);
    const { error: addError } = await authClient.passkey.addPasskey({ name: `Passkey ${passkeys.length + 1}` });
    if (addError) {
      setError(addError.message ?? "Couldn't register that passkey.");
      return;
    }
    refresh();
  }

  return (
    <>
      <div className={formStyles.sectionLabel}>PASSKEYS</div>
      {passkeys.map((pk) => (
        <div className={styles.row} key={pk.id}>
          <div>
            <div className={styles.rowLabel}>{pk.name || "Passkey"}</div>
            {pk.createdAt && <div className={styles.rowMeta}>Added {new Date(pk.createdAt).toLocaleDateString()}</div>}
          </div>
          <button
            type="button"
            className={styles.smallButtonDanger}
            onClick={async () => {
              await authClient.passkey.deletePasskey({ id: pk.id });
              refresh();
            }}
          >
            Remove
          </button>
        </div>
      ))}
      <button type="button" className={styles.smallButton} style={{ marginTop: 8 }} onClick={addPasskey}>
        Add a passkey
      </button>
      {error && <span className={formStyles.error}>{error}</span>}
    </>
  );
}

function LinkedAccountsSection() {
  const [linked, setLinked] = useState<string[]>([]);
  const [enabledProviders, setEnabledProviders] = useState<{ id: string; enabled: boolean }[]>([]);

  useEffect(() => {
    async function load() {
      const result = await authClient.listAccounts();
      const accounts = result.data ?? [];
      setLinked(accounts.map((a: { provider: string }) => a.provider));
    }
    load();
    fetch(`${API_URL}/auth-info/providers`)
      .then((res) => res.json())
      .then(setEnabledProviders);
  }, []);

  return (
    <>
      <div className={formStyles.sectionLabel}>LINKED SIGN-IN METHODS</div>
      {enabledProviders.map((provider) => {
        const isLinked = linked.includes(provider.id);
        return (
          <div className={styles.row} key={provider.id}>
            <span className={styles.rowLabel}>{OAUTH_PROVIDER_LABELS[provider.id]}</span>
            {!provider.enabled ? (
              <span className={styles.rowMeta}>Coming soon</span>
            ) : isLinked ? (
              <button
                type="button"
                className={styles.smallButtonDanger}
                onClick={async () => {
                  await authClient.unlinkAccount({ providerId: provider.id });
                  window.location.reload();
                }}
              >
                Unlink
              </button>
            ) : (
              <button
                type="button"
                className={styles.smallButton}
                onClick={() =>
                  authClient.linkSocial({ provider: provider.id as never, callbackURL: `${window.location.origin}/account` })
                }
              >
                Link
              </button>
            )}
          </div>
        );
      })}
    </>
  );
}
