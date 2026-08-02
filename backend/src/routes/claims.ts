import { Router } from "express";
import { prisma } from "../lib/prisma.ts";
import { uniqueSlug } from "../lib/slug.ts";
import { requireVoterId } from "../lib/voter.ts";
import { expireIfStale, checkAutoContest, enterContested } from "../lib/contested.ts";
import { claimVoteDemographicBreakdown, isDemographicDimension } from "../lib/demographics.ts";
import {
  ageLabel,
  claimSummary,
  strengthDefinition,
  strengthDistribution,
  strengthMark,
  voteStats,
} from "../lib/serialize.ts";

export const claimsRouter = Router();

const DETAIL_INCLUDE = {
  timeline: { orderBy: { sortOrder: "asc" as const } },
  evidenceItems: { orderBy: { createdAt: "asc" as const } },
  votes: true,
  revisions: { orderBy: { createdAt: "desc" as const } },
  usedIn: {
    include: {
      toClaim: { include: { votes: true, arguedBy: { include: { fromClaim: true } } } },
      strengthVotes: true,
    },
  },
  arguedBy: {
    include: {
      fromClaim: { include: { votes: true, arguedBy: { include: { fromClaim: true } } } },
      strengthVotes: true,
    },
  },
};

function strengthDefinitions(relation: string) {
  return {
    decisive: strengthDefinition("DECISIVE", relation),
    relevant: strengthDefinition("RELEVANT", relation),
    tangential: strengthDefinition("TANGENTIAL", relation),
  };
}

function buildUpwardRow(
  conn: {
    id: string;
    relation: string;
    statedStrength: string;
    strengthVotes: { value: string }[];
    toClaim: Parameters<typeof claimSummary>[0] & { tags: string[]; votes: { id: string; agree: boolean; wellConstructed: boolean }[] };
  },
  thisClaim: { tags: string[] }
) {
  const parent = conn.toClaim;
  const crossDebate = (parent.tags[0] ?? null) !== (thisClaim.tags[0] ?? null);
  const relWord = conn.relation === "SUPPORTS" ? "supports" : "contradicts";
  return {
    connectionId: conn.id,
    relation: conn.relation,
    statedStrength: conn.statedStrength,
    ...strengthMark(conn.statedStrength),
    otherClaim: { id: parent.id, slug: parent.slug, title: parent.title },
    crossDebate,
    contextLabel: crossDebate ? `ANOTHER DEBATE · ${parent.tags[0] ?? ""}` : parent.tags.join(" · "),
    raterCount: parent.votes.length,
    claimItself: claimSummary(parent),
    relationSentence: `This claim ${relWord} “${parent.title}”`,
    strengthDistribution: strengthDistribution(conn.strengthVotes),
    strengthDefinitions: strengthDefinitions(conn.relation),
  };
}

function buildDownwardRow(conn: {
  id: string;
  relation: string;
  statedStrength: string;
  strengthVotes: { value: string }[];
  fromClaim: Parameters<typeof claimSummary>[0];
}, thisClaim: { title: string }) {
  const child = conn.fromClaim;
  const relWord = conn.relation === "SUPPORTS" ? "Supports" : "Contradicts";
  return {
    connectionId: conn.id,
    relation: conn.relation,
    statedStrength: conn.statedStrength,
    ...strengthMark(conn.statedStrength),
    otherClaim: { id: child.id, slug: child.slug, title: child.title },
    claimItself: claimSummary(child),
    relationSentence: `${relWord} “${thisClaim.title}”`,
    strengthDistribution: strengthDistribution(conn.strengthVotes),
    strengthDefinitions: strengthDefinitions(conn.relation),
  };
}

claimsRouter.get("/claims", async (req, res) => {
  const claims = await prisma.claim.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, slug: true, title: true, oneLiner: true, type: true, tags: true, contestedAt: true },
  });
  res.json(claims);
});

claimsRouter.get("/claims/:idOrSlug", async (req, res) => {
  const claim = await prisma.claim.findFirst({
    where: { OR: [{ id: req.params.idOrSlug }, { slug: req.params.idOrSlug }] },
    include: DETAIL_INCLUDE,
  });
  if (!claim) return res.status(404).json({ error: "Claim not found" });

  await expireIfStale(claim);
  const fresh = claim.contestedAt && claim.contestedUntil && claim.contestedUntil.getTime() < Date.now()
    ? await prisma.claim.findUniqueOrThrow({ where: { id: claim.id }, include: DETAIL_INCLUDE })
    : claim;

  const stats = voteStats(fresh.votes);
  const revisionAuthorCount = new Set(fresh.revisions.map((r) => r.authorId)).size;
  const usedIn = fresh.usedIn.map((c) => buildUpwardRow(c, fresh));
  const supports = fresh.arguedBy.filter((c) => c.relation === "SUPPORTS").map((c) => buildDownwardRow(c, fresh));
  const contradicts = fresh.arguedBy.filter((c) => c.relation === "CONTRADICTS").map((c) => buildDownwardRow(c, fresh));

  res.json({
    id: fresh.id,
    slug: fresh.slug,
    title: fresh.title,
    oneLiner: fresh.oneLiner,
    body: fresh.body,
    type: fresh.type,
    evidenceStrength: fresh.evidenceStrength,
    tags: fresh.tags,
    contextBackground: fresh.contextBackground,
    contextDisagreement: fresh.contextDisagreement,
    contested: fresh.contestedAt
      ? { reason: fresh.contestedReason, since: fresh.contestedAt, until: fresh.contestedUntil }
      : null,
    ageLabel: ageLabel(fresh.createdAt),
    timeline: fresh.timeline.map((t) => ({ label: t.label, text: t.text })),
    evidenceItems: fresh.evidenceItems,
    stats: {
      revisionCount: fresh.revisions.length,
      revisionAuthorCount,
      connectionCount: usedIn.length + supports.length + contradicts.length,
      evidenceCount: fresh.evidenceItems.length,
      crossDebateUsedInCount: usedIn.filter((r) => r.crossDebate).length,
    },
    votes: stats,
    usedIn,
    supports,
    contradicts,
    revisions: fresh.revisions.map((r) => ({
      id: r.id,
      authorName: r.authorName,
      summary: r.summary,
      pending: r.pending,
      createdAt: r.createdAt,
      snapshot: r.snapshot,
    })),
  });
});

claimsRouter.get("/claims/:id/demographics/:dimension", async (req, res) => {
  if (!isDemographicDimension(req.params.dimension)) {
    return res.status(400).json({ error: "Unknown demographic dimension" });
  }
  const breakdown = await claimVoteDemographicBreakdown(req.params.id, req.params.dimension);
  res.json({ dimension: req.params.dimension, minGroupSize: 20, groups: breakdown });
});

claimsRouter.post("/claims", async (req, res) => {
  const { title, oneLiner, body, type, evidenceStrength, tags, contextBackground, contextDisagreement, authorName, summary, connection } = req.body;
  if (!title || !authorName || !summary) {
    return res.status(400).json({ error: "title, authorName and summary are required" });
  }
  const slug = await uniqueSlug(title);
  const claim = await prisma.claim.create({
    data: {
      slug,
      title,
      oneLiner: oneLiner ?? "",
      body: body ?? "",
      type: type ?? "OPINION",
      evidenceStrength: evidenceStrength ?? "NONE",
      tags: tags ?? [],
      contextBackground: contextBackground ?? "",
      contextDisagreement: contextDisagreement ?? "",
      revisions: {
        create: { authorId: authorName, authorName, summary, snapshot: {}, pending: false },
      },
      ...(connection
        ? {
            usedIn: {
              create: {
                toClaimId: connection.toClaimId,
                relation: connection.relation,
                statedStrength: connection.statedStrength ?? "RELEVANT",
                statedReason: connection.statedReason ?? summary,
              },
            },
          }
        : {}),
    },
  });
  res.status(201).json({ id: claim.id, slug: claim.slug });
});

claimsRouter.patch("/claims/:id", async (req, res) => {
  const { authorName, summary, ...fields } = req.body;
  if (!authorName || !summary) return res.status(400).json({ error: "authorName and summary are required" });

  const claim = await prisma.claim.findUnique({ where: { id: req.params.id } });
  if (!claim) return res.status(404).json({ error: "Claim not found" });
  await expireIfStale(claim);
  const current = await prisma.claim.findUniqueOrThrow({ where: { id: claim.id } });

  const snapshot: Record<string, unknown> = {};
  for (const key of Object.keys(fields)) {
    snapshot[key] = (current as Record<string, unknown>)[key];
  }

  if (current.contestedAt) {
    await prisma.claimRevision.create({
      data: { claimId: claim.id, authorId: authorName, authorName, summary, snapshot: fields, pending: true },
    });
    return res.json({ pending: true });
  }

  await prisma.$transaction([
    prisma.claim.update({ where: { id: claim.id }, data: fields }),
    prisma.claimRevision.create({
      data: { claimId: claim.id, authorId: authorName, authorName, summary, snapshot, pending: false },
    }),
  ]);
  res.json({ pending: false });
});

claimsRouter.post("/claims/:id/vote", async (req, res) => {
  const voterId = requireVoterId(req);
  const { agree, wellConstructed } = req.body;
  const vote = await prisma.claimVote.upsert({
    where: { claimId_voterId: { claimId: req.params.id, voterId } },
    create: { claimId: req.params.id, voterId, agree: !!agree, wellConstructed: !!wellConstructed },
    update: { agree: !!agree, wellConstructed: !!wellConstructed },
  });
  res.json(vote);
});

claimsRouter.post("/claims/:id/revisions/:revisionId/revert", async (req, res) => {
  const voterId = requireVoterId(req);
  const { authorName } = req.body;
  const revision = await prisma.claimRevision.findUnique({ where: { id: req.params.revisionId } });
  if (!revision || revision.claimId !== req.params.id) return res.status(404).json({ error: "Revision not found" });

  const snapshot = revision.snapshot as Record<string, unknown>;
  await prisma.$transaction([
    prisma.claim.update({ where: { id: req.params.id }, data: snapshot }),
    prisma.claimRevision.create({
      data: {
        claimId: req.params.id,
        authorId: authorName ?? voterId,
        authorName: authorName ?? "Anonymous",
        summary: `Reverted to a previous version (from revision ${revision.id.slice(0, 8)})`,
        snapshot: {},
        pending: false,
      },
    }),
    prisma.claimRevert.create({ data: { claimId: req.params.id, revertedBy: voterId } }),
  ]);
  await checkAutoContest(req.params.id);
  res.json({ ok: true });
});

claimsRouter.post("/claims/:id/flag", async (req, res) => {
  const voterId = requireVoterId(req);
  await prisma.claimFlag.create({ data: { claimId: req.params.id, flaggedBy: voterId, reason: req.body?.reason } });
  await checkAutoContest(req.params.id);
  res.status(201).json({ ok: true });
});

claimsRouter.post("/claims/:id/contest", async (req, res) => {
  const { reason } = req.body;
  if (!reason) return res.status(400).json({ error: "reason is required" });
  await enterContested(req.params.id, reason);
  res.json({ ok: true });
});

claimsRouter.post("/claims/:id/evidence", async (req, res) => {
  const { type, citation, url } = req.body;
  if (!type || !citation) return res.status(400).json({ error: "type and citation are required" });
  const item = await prisma.evidenceItem.create({ data: { claimId: req.params.id, type, citation, url } });
  res.status(201).json(item);
});

claimsRouter.delete("/claims/:id/evidence/:evidenceId", async (req, res) => {
  await prisma.evidenceItem.delete({ where: { id: req.params.evidenceId } });
  res.status(204).end();
});
