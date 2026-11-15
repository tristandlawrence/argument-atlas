import { fetchClaim, fetchClaims, fetchFacets, fetchGraph } from "./api";
import { IS_STATIC } from "./static";
import type { ClaimDetail, ClaimListItem, GraphData } from "./types";

/**
 * Data access for server components. In the normal build this is the API.
 * In the static snapshot build the API is not reachable at build time, so
 * the same shapes are read from frontend/public/data, written by
 * backend/scripts/snapshot.ts. Only import this from server components.
 */

async function readJson<T>(rel: string): Promise<T | null> {
  const [{ readFile }, path] = await Promise.all([import("node:fs/promises"), import("node:path")]);
  try {
    const raw = await readFile(path.join(process.cwd(), "public", "data", rel), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function loadClaims(filter: { type?: string; tag?: string } = {}): Promise<ClaimListItem[]> {
  if (!IS_STATIC) return fetchClaims(filter);
  const all = (await readJson<ClaimListItem[]>("claims.json")) ?? [];
  return all.filter((c) => (!filter.type || c.type === filter.type.toUpperCase()) && (!filter.tag || c.tags.includes(filter.tag.toUpperCase())));
}

export async function loadClaim(slug: string): Promise<ClaimDetail | null> {
  if (!IS_STATIC) return fetchClaim(slug);
  return readJson<ClaimDetail>(`claims/${slug}.json`);
}

export async function loadFacets(): Promise<{ byType: Record<string, number>; byTag: Record<string, number> }> {
  if (!IS_STATIC) return fetchFacets();
  return (await readJson<{ byType: Record<string, number>; byTag: Record<string, number> }>("facets.json")) ?? { byType: {}, byTag: {} };
}

export async function loadGraph(): Promise<GraphData> {
  if (!IS_STATIC) return fetchGraph();
  return (await readJson<GraphData>("graph.json")) ?? { nodes: [], edges: [] };
}

export async function loadSnapshotMeta(): Promise<{ takenAt: string; claimCount: number; source: string } | null> {
  if (!IS_STATIC) return null;
  return readJson("meta.json");
}
