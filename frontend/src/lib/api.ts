import type { ChallengeKind, ClaimDetail, ClaimListItem, ConnectionStrength, GraphData, VoiceStance } from "./types";
import { authClient } from "./authClient";
import { DATA_URL, IS_STATIC } from "./static";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

// In the read-only snapshot build there is no API: reads come from the
// pre-written JSON under /data and writes are quietly ignored (the page
// banner explains). Server components use lib/data.server.ts instead.
const READ_ONLY = { readOnly: true as const };

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
  if (IS_STATIC) return anonymousVoterId();
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

export async function fetchClaims(filter: { type?: string; tag?: string } = {}): Promise<ClaimListItem[]> {
  if (IS_STATIC) {
    const all: ClaimListItem[] = await json(await fetch(`${DATA_URL}/claims.json`, { cache: "no-store" }));
    return all.filter((c) => (!filter.type || c.type === filter.type.toUpperCase()) && (!filter.tag || c.tags.includes(filter.tag.toUpperCase())));
  }
  const qs = new URLSearchParams();
  if (filter.type) qs.set("type", filter.type);
  if (filter.tag) qs.set("tag", filter.tag);
  const suffix = qs.toString() ? `?${qs}` : "";
  return json(await fetch(`${API_URL}/claims${suffix}`, { cache: "no-store" }));
}

export async function fetchFacets(): Promise<{ byType: Record<string, number>; byTag: Record<string, number> }> {
  if (IS_STATIC) return json(await fetch(`${DATA_URL}/facets.json`, { cache: "no-store" }));
  return json(await fetch(`${API_URL}/claims/facets`, { cache: "no-store" }));
}

export async function fetchClaim(idOrSlug: string): Promise<ClaimDetail | null> {
  const res = await fetch(IS_STATIC ? `${DATA_URL}/claims/${idOrSlug}.json` : `${API_URL}/claims/${idOrSlug}`, { cache: "no-store" });
  if (res.status === 404) return null;
  return json(res);
}

export async function voteClaim(claimId: string, agree: boolean, wellConstructed: boolean) {
  if (IS_STATIC) return READ_ONLY;
  return json(
    await fetch(`${API_URL}/claims/${claimId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-voter-id": await getVoterId() },
      body: JSON.stringify({ agree, wellConstructed }),
    })
  );
}

export async function voteStrength(connectionId: string, value: ConnectionStrength) {
  if (IS_STATIC) return READ_ONLY;
  return json(
    await fetch(`${API_URL}/connections/${connectionId}/strength-vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-voter-id": await getVoterId() },
      body: JSON.stringify({ value }),
    })
  );
}

export async function flagClaim(claimId: string, reason?: string) {
  if (IS_STATIC) return READ_ONLY;
  return json(
    await fetch(`${API_URL}/claims/${claimId}/flag`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-voter-id": await getVoterId() },
      body: JSON.stringify({ reason }),
    })
  );
}

export async function revertRevision(claimId: string, revisionId: string, authorName: string) {
  if (IS_STATIC) return READ_ONLY;
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
  if (IS_STATIC) return READ_ONLY;
  return json(
    await fetch(`${API_URL}/claims/${claimId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...fields, authorName, summary }),
    })
  );
}

export async function addEvidence(claimId: string, type: string, citation: string, url?: string) {
  if (IS_STATIC) return READ_ONLY;
  return json(
    await fetch(`${API_URL}/claims/${claimId}/evidence`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, citation, url }),
    })
  );
}

export async function removeEvidence(claimId: string, evidenceId: string) {
  if (IS_STATIC) return READ_ONLY;
  const res = await fetch(`${API_URL}/claims/${claimId}/evidence/${evidenceId}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error("Failed to remove evidence");
}

export async function patchConnection(
  connectionId: string,
  fields: Record<string, unknown>,
  authorName: string,
  summary: string
) {
  if (IS_STATIC) return READ_ONLY;
  return json(
    await fetch(`${API_URL}/connections/${connectionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...fields, authorName, summary }),
    })
  );
}

export async function challengeConnection(connectionId: string, kind: ChallengeKind) {
  if (IS_STATIC) return READ_ONLY;
  return json(
    await fetch(`${API_URL}/connections/${connectionId}/challenge`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-voter-id": await getVoterId() },
      body: JSON.stringify({ kind }),
    })
  );
}

export async function addVoice(
  claimId: string,
  voice: { title: string; outlet: string; author?: string; url: string; kind: string; stance: VoiceStance }
) {
  if (IS_STATIC) return READ_ONLY;
  return json(
    await fetch(`${API_URL}/claims/${claimId}/voices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(voice),
    })
  );
}

export async function removeVoice(claimId: string, voiceId: string) {
  if (IS_STATIC) return READ_ONLY;
  const res = await fetch(`${API_URL}/claims/${claimId}/voices/${voiceId}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error("Failed to remove voice");
}

export async function voteVoice(voiceId: string, agree: boolean, wellConstructed: boolean) {
  if (IS_STATIC) return READ_ONLY;
  return json(
    await fetch(`${API_URL}/voices/${voiceId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-voter-id": await getVoterId() },
      body: JSON.stringify({ agree, wellConstructed }),
    })
  );
}

export async function fetchGraph(): Promise<GraphData> {
  if (IS_STATIC) return json(await fetch(`${DATA_URL}/graph.json`, { cache: "no-store" }));
  return json(await fetch(`${API_URL}/graph`, { cache: "no-store" }));
}
