import { fetchGraph } from "@/lib/api";
import { GraphView } from "@/components/GraphView";

export default async function GraphPage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string; tag?: string }>;
}) {
  const [{ focus, tag }, data] = await Promise.all([searchParams, fetchGraph()]);
  return <GraphView data={data} focusSlug={focus} initialTag={tag?.toUpperCase()} />;
}
