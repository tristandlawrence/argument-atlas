import { fetchClaims } from "@/lib/api";
import { HomeBrowser } from "@/components/HomeBrowser";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; type?: string; q?: string; scope?: string }>;
}) {
  const [params, claims] = await Promise.all([searchParams, fetchClaims()]);
  return (
    <HomeBrowser
      claims={claims}
      initial={{
        tag: params.tag?.toUpperCase() ?? null,
        type: params.type?.toUpperCase() ?? null,
        q: params.q ?? "",
        scope: params.scope === "all" ? "all" : "debates",
      }}
    />
  );
}
