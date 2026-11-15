import { Suspense } from "react";
import { loadGraph } from "@/lib/data.server";
import { GraphRoute } from "@/components/GraphRoute";

export default async function GraphPage() {
  const data = await loadGraph();
  return (
    <Suspense fallback={null}>
      <GraphRoute data={data} />
    </Suspense>
  );
}
