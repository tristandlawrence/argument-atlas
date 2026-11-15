import "dotenv/config";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Write a read-only snapshot of the API into frontend/public/data, in exactly
 * the shapes the pages consume, so the static export (GitHub Pages) can be
 * built without a database. Run against a live API:
 *
 *   SNAPSHOT_API=http://localhost:4000/api npm run snapshot
 */

const API = process.env.SNAPSHOT_API ?? "http://localhost:4000/api";
const OUT = path.resolve(import.meta.dirname, "../../frontend/public/data");

async function get<T>(p: string): Promise<T> {
  const res = await fetch(`${API}${p}`);
  if (!res.ok) throw new Error(`${p} → ${res.status}`);
  return res.json() as Promise<T>;
}

async function write(rel: string, data: unknown) {
  const file = path.join(OUT, rel);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(data), "utf8");
}

async function main() {
  await rm(OUT, { recursive: true, force: true });
  const claims = await get<{ slug: string }[]>("/claims");
  const [facets, graph] = await Promise.all([get("/claims/facets"), get("/graph")]);
  await write("claims.json", claims);
  await write("facets.json", facets);
  await write("graph.json", graph);
  let n = 0;
  for (const c of claims) {
    await write(`claims/${c.slug}.json`, await get(`/claims/${c.slug}`));
    n++;
  }
  await write("meta.json", { takenAt: new Date().toISOString(), claimCount: n, source: API });
  console.log(`Snapshot written to ${OUT}: ${n} claims, facets, graph.`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
