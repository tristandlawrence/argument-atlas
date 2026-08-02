import { prisma } from "./prisma.ts";

const MIN_GROUP_SIZE = 20;

const DIMENSIONS = ["gender", "ageRange", "educationLevel", "relationshipStatus", "state"] as const;
export type DemographicDimension = (typeof DIMENSIONS)[number];

export function isDemographicDimension(value: string): value is DemographicDimension {
  return (DIMENSIONS as readonly string[]).includes(value);
}

// Enforces the aggregate-only privacy rule: individual votes are never
// joined to a person's demographic profile in an API response. Groups
// smaller than MIN_GROUP_SIZE are dropped entirely rather than shown with
// a small, potentially re-identifying count — the same suppression
// approach public pollsters use for small cross-tab cells.
export async function claimVoteDemographicBreakdown(claimId: string, dimension: DemographicDimension) {
  const votes = await prisma.claimVote.findMany({
    where: { claimId },
    select: { voterId: true, agree: true, wellConstructed: true },
  });

  const userIds = votes.map((v) => v.voterId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, [dimension]: true },
  });
  const dimensionByUserId = new Map(users.map((u) => [u.id, (u as Record<string, unknown>)[dimension] as string | null]));

  const groups = new Map<string, { total: number; agree: number; wellConstructed: number }>();
  for (const vote of votes) {
    const value = dimensionByUserId.get(vote.voterId);
    if (!value) continue; // anonymous voters or unset profile fields carry no demographic signal
    const group = groups.get(value) ?? { total: 0, agree: 0, wellConstructed: 0 };
    group.total += 1;
    if (vote.agree) group.agree += 1;
    if (vote.wellConstructed) group.wellConstructed += 1;
    groups.set(value, group);
  }

  return [...groups.entries()]
    .filter(([, g]) => g.total >= MIN_GROUP_SIZE)
    .map(([value, g]) => ({
      value,
      raterCount: g.total,
      agreePct: Math.round((g.agree / g.total) * 100),
      wellConstructedPct: Math.round((g.wellConstructed / g.total) * 100),
    }));
}
