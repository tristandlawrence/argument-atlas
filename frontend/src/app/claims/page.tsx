import { fetchClaims } from "@/lib/api";
import { HomeBrowser, type BrowserState } from "@/components/HomeBrowser";

const list = (v?: string) => (v ? v.split(",").map((x) => x.trim().toUpperCase()).filter(Boolean) : []);

export default async function ClaimsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const [p, claims] = await Promise.all([searchParams, fetchClaims()]);
  const initial: BrowserState = {
    view: p.view === "table" ? "table" : "cards",
    q: p.q ?? "",
    tag: p.tag ? p.tag.toUpperCase() : null,
    types: list(p.type),
    evidence: list(p.evidence),
    quadrants: list(p.quadrant),
    status: list(p.status),
    sort: (["raters", "arguments", "newest", "alpha"].includes(p.sort ?? "") ? p.sort : "raters") as BrowserState["sort"],
  };
  return <HomeBrowser claims={claims} initial={initial} />;
}
