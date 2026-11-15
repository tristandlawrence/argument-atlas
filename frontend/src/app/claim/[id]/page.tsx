import { notFound } from "next/navigation";
import { loadClaim, loadClaims } from "@/lib/data.server";
import { IS_STATIC } from "@/lib/static";
import { ClaimPageClient } from "./ClaimPageClient";

// The static snapshot needs every claim page listed up front; the live app
// renders on demand.
export async function generateStaticParams() {
  if (!IS_STATIC) return [];
  const claims = await loadClaims();
  return claims.map((c) => ({ id: c.slug }));
}

export default async function ClaimPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const claim = await loadClaim(id);
  if (!claim) notFound();
  return <ClaimPageClient initialClaim={claim} />;
}
