"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/authClient";
import { OAUTH_PROVIDER_LABELS } from "@/lib/demographicOptions";
import styles from "./OAuthButtonRow.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type ProviderInfo = { id: string; enabled: boolean };

export function OAuthButtonRow() {
  const [providers, setProviders] = useState<ProviderInfo[]>(
    Object.keys(OAUTH_PROVIDER_LABELS).map((id) => ({ id, enabled: false }))
  );

  useEffect(() => {
    fetch(`${API_URL}/auth-info/providers`)
      .then((res) => res.json())
      .then(setProviders)
      .catch(() => {});
  }, []);

  return (
    <div className={styles.grid}>
      {providers.map((provider) => (
        <button
          key={provider.id}
          type="button"
          disabled={!provider.enabled}
          className={`${styles.button} ${provider.enabled ? "" : styles.buttonDisabled}`}
          onClick={() =>
            authClient.signIn.social({ provider: provider.id as never, callbackURL: `${window.location.origin}/` })
          }
        >
          {OAUTH_PROVIDER_LABELS[provider.id] ?? provider.id}
          {!provider.enabled && <span className={styles.comingSoon}>SOON</span>}
        </button>
      ))}
    </div>
  );
}
