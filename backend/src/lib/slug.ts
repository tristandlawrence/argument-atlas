import { prisma } from "./prisma.ts";

function baseSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export async function uniqueSlug(title: string) {
  const base = baseSlug(title) || "claim";
  let candidate = base;
  let suffix = 1;
  while (await prisma.claim.findUnique({ where: { slug: candidate } })) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}
