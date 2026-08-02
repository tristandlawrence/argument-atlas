import type { ClaimDetail, ClaimListItem, ConnectionStrength } from "./types";
import { authClient } from "./authClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

function anonymousVoterId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("voterId");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("voterId", id);
  }
  return id;
}

// Signed-in votes attribute to the real account, so they can feed the
// aggregate demographic cross-tabs; signed-out votes stay anonymous.
export async function getVoterId(): Promise<string> {
  const { data } = await authClient.getSession();
  return data?.user.id ?? anonymousVoterId();
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed with ${res.status}`);
  }
  return res.json();
}

export async function fetchClaims(): Promise<ClaimListItem[]> {
  return json(await fetch(`${API_URL}/claims`, { cache: "no-store" }));
}

export async function fetchClaim(idOrSlug: string): Promise<ClaimDetail | null> {
  const res = await fetch(`${API_URL}/claims/${idOrSlug}`, { cache: "no-store" });
  if (res.status === 404) return null;
  return json(res);
}

export async function voteClaim(claimId: string, agree: boolean, wellConstructed: boolean) {
  return json(
    await fetch(`${API_URL}/claims/${claimId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-voter-id": await getVoterId() },
      body: JSON.stringify({ agree, wellConstructed }),
    })
  );
}

export async function voteStrength(connectionId: string, value: ConnectionStrength) {
  return json(
    await fetch(`${API_URL}/connections/${connectionId}/strength-vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-voter-id": await getVoterId() },
      body: JSON.stringify({ value }),
    })
  );
}

export async function flagClaim(claimId: string, reason?: string) {
  return json(
    await fetch(`${API_URL}/claims/${claimId}/flag`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-voter-id": await getVoterId() },
      body: JSON.stringify({ reason }),
    })
  );
}

export async function revertRevision(claimId: string, revisionId: string, authorName: string) {
  return json(
    await fetch(`${API_URL}/claims/${claimId}/revisions/${revisionId}/revert`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-voter-id": await getVoterId() },
      body: JSON.stringify({ authorName }),
    })
  );
}

export async function patchClaim(
  claimId: string,
  fields: Record<string, unknown>,
  authorName: string,
  summary: string
) {
  return json(
    await fetch(`${API_URL}/claims/${claimId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...fields, authorName, summary }),
    })
  );
}

export async function addEvidence(claimId: string, type: string, citation: string, url?: string) {
  return json(
    await fetch(`${API_URL}/claims/${claimId}/evidence`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, citation, url }),
    })
  );
}

export async function removeEvidence(claimId: string, evidenceId: string) {
  const res = await fetch(`${API_URL}/claims/${claimId}/evidence/${evidenceId}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error("Failed to remove evidence");
}

export async function patchConnection(
  connectionId: string,
  fields: Record<string, unknown>,
  authorName: string,
  summary: string
) {
  return json(
    await fetch(`${API_URL}/connections/${connectionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...fields, authorName, summary }),
    })
  );
}
