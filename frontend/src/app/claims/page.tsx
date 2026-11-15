import { Suspense } from "react";
import { loadClaims } from "@/lib/data.server";
import { ClaimsRoute } from "@/components/ClaimsRoute";

export default async function ClaimsPage() {
  const claims = await loadClaims();
  return (
    <Suspense fallback={null}>
      <ClaimsRoute claims={claims} />
    </Suspense>
  );
}
