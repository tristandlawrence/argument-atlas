import { notFound } from "next/navigation";
import { fetchClaim } from "@/lib/api";
import { ClaimPageClient } from "./ClaimPageClient";

export default async function ClaimPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const claim = await fetchClaim(id);
  if (!claim) notFound();
  return <ClaimPageClient initialClaim={claim} />;
}
