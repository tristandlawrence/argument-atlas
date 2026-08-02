"use client";

import { useState } from "react";
import styles from "./PostcodeElectorateField.module.css";
import formStyles from "../app/(auth)/AuthForm.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type LookupResult = { postcode: string; state: string; electorates: string[]; coverage: "curated" | "state-only" };

export function PostcodeElectorateField({
  postcode,
  state,
  federalElectorate,
  onChange,
}: {
  postcode: string;
  state: string;
  federalElectorate: string;
  onChange: (next: { postcode: string; state: string; federalElectorate: string }) => void;
}) {
  const [lookup, setLookup] = useState<LookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePostcodeChange(value: string) {
    onChange({ postcode: value, state: "", federalElectorate: "" });
    setLookup(null);
    setError(null);
    if (value.length !== 4) return;
    const res = await fetch(`${API_URL}/electorates/lookup?postcode=${value}`);
    if (!res.ok) {
      setError((await res.json()).error ?? "Couldn't look up that postcode.");
      return;
    }
    const data: LookupResult = await res.json();
    setLookup(data);
    onChange({
      postcode: value,
      state: data.state,
      federalElectorate: data.electorates.length === 1 ? data.electorates[0] : "",
    });
  }

  return (
    <div>
      <div className={styles.row}>
        <input
          className={`${formStyles.input} ${styles.postcodeInput}`}
          placeholder="Postcode"
          maxLength={4}
          inputMode="numeric"
          value={postcode}
          onChange={(e) => handlePostcodeChange(e.target.value.replace(/\D/g, ""))}
        />
        {state && <span className={styles.stateDisplay}>{state}</span>}
      </div>
      {error && <p className={styles.note}>{error}</p>}
      {lookup && lookup.electorates.length > 1 && (
        <div className={styles.electorateBlock}>
          <p className={styles.note}>This postcode spans more than one electorate — which one applies to you?</p>
          {lookup.electorates.map((e) => (
            <label className={styles.electorateOption} key={e}>
              <input
                type="radio"
                name="electorate"
                checked={federalElectorate === e}
                onChange={() => onChange({ postcode, state, federalElectorate: e })}
              />
              {e}
            </label>
          ))}
        </div>
      )}
      {lookup && lookup.coverage === "state-only" && (
        <p className={styles.note}>
          We don&rsquo;t have your electorate for this postcode yet. You can look it up at{" "}
          <a href="https://electorate.aec.gov.au/" target="_blank" rel="noreferrer">
            the AEC&rsquo;s electorate finder
          </a>{" "}
          and enter it below, or leave it blank.
        </p>
      )}
      {lookup && lookup.coverage === "state-only" && (
        <input
          className={formStyles.input}
          style={{ marginTop: 6 }}
          placeholder="Federal electorate (optional)"
          value={federalElectorate}
          onChange={(e) => onChange({ postcode, state, federalElectorate: e.target.value })}
        />
      )}
    </div>
  );
}
