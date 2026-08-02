import { prisma } from "./prisma.ts";

const REVERT_WINDOW_MS = 24 * 60 * 60 * 1000;
const REVERT_THRESHOLD = 3;
const FLAG_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const FLAG_THRESHOLD = 5;
const QUIET_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;

export async function expireIfStale(claim: { id: string; contestedAt: Date | null; contestedUntil: Date | null }) {
  if (claim.contestedAt && claim.contestedUntil && claim.contestedUntil.getTime() < Date.now()) {
    await prisma.claim.update({
      where: { id: claim.id },
      data: { contestedAt: null, contestedReason: null, contestedUntil: null },
    });
    return true;
  }
  return false;
}

export async function checkAutoContest(claimId: string) {
  const claim = await prisma.claim.findUnique({ where: { id: claimId } });
  if (!claim || claim.contestedAt) return;

  const reverts = await prisma.claimRevert.findMany({
    where: { claimId, createdAt: { gte: new Date(Date.now() - REVERT_WINDOW_MS) } },
  });
  const distinctReverters = new Set(reverts.map((r) => r.revertedBy)).size;
  if (distinctReverters >= REVERT_THRESHOLD) {
    await enterContested(claimId, "Three or more reverts by different users inside 24 hours.");
    return;
  }

  const flags = await prisma.claimFlag.findMany({
    where: { claimId, createdAt: { gte: new Date(Date.now() - FLAG_WINDOW_MS) } },
  });
  const distinctFlaggers = new Set(flags.map((f) => f.flaggedBy)).size;
  if (distinctFlaggers >= FLAG_THRESHOLD) {
    await enterContested(claimId, "Flagged by a number of distinct accounts.");
  }
}

export async function enterContested(claimId: string, reason: string) {
  await prisma.claim.update({
    where: { id: claimId },
    data: {
      contestedAt: new Date(),
      contestedReason: reason,
      contestedUntil: new Date(Date.now() + QUIET_PERIOD_MS),
    },
  });
}
