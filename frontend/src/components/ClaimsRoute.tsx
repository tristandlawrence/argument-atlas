"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { HomeBrowser, type BrowserState } from "./HomeBrowser";
import type { ClaimListItem } from "@/lib/types";

const list = (v: string | null) => (v ? v.split(",").map((x) => x.trim().toUpperCase()).filter(Boolean) : []);

/** Parses the initial filter state from the URL on the client, once, so the page can be statically exported. */
export function ClaimsRoute({ claims }: { claims: ClaimListItem[] }) {
  const sp = useSearchParams();
  // Only the first render seeds the state; HomeBrowser owns it after that and
  // mirrors it back into the URL itself.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initial = useMemo<BrowserState>(
    () => ({
      view: sp.get("view") === "table" ? "table" : "cards",
      q: sp.get("q") ?? "",
      tag: sp.get("tag") ? sp.get("tag")!.toUpperCase() : null,
      types: list(sp.get("type")),
      evidence: list(sp.get("evidence")),
      quadrants: list(sp.get("quadrant")),
      status: list(sp.get("status")),
      sort: (["raters", "arguments", "newest", "alpha"].includes(sp.get("sort") ?? "") ? sp.get("sort") : "raters") as BrowserState["sort"],
    }),
    []
  );
  return <HomeBrowser claims={claims} initial={initial} />;
}
