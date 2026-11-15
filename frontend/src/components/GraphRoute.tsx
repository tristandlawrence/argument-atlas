"use client";

import { useSearchParams } from "next/navigation";
import { GraphView } from "./GraphView";
import type { GraphData } from "@/lib/types";

/** Reads focus/tag from the URL on the client so the page can be statically exported. */
export function GraphRoute({ data }: { data: GraphData }) {
  const sp = useSearchParams();
  const focus = sp.get("focus") ?? undefined;
  const tag = sp.get("tag")?.toUpperCase() ?? undefined;
  return <GraphView key={`${focus ?? ""}|${tag ?? ""}`} data={data} focusSlug={focus} initialTag={tag} />;
}
