import { Router } from "express";
import { prisma } from "../lib/prisma.ts";
import { uniqueSlug } from "../lib/slug.ts";
import { requireVoterId } from "../lib/voter.ts";
import { expireIfStale, checkAutoContest, enterContested } from "../lib/contested.ts";
import { claimVoteDemographicBreakdown, isDemographicDimension } from "../lib/demographics.ts";
import {
  ageLabel,
  challengeCounts,
  claimSummary,
  contentiousStatus,
  voiceSummary,
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
  voices: { include: { votes: true }, orderBy: { createdAt: "asc" as const } },
  usedIn: {
    include: {
      toClaim: { include: { votes: true, arguedBy: { include: { fromClaim: true } } } },
      strengthVotes: true,
      challenges: true,
    },
  },
  arguedBy: {
    include: {
      fromClaim: { include: { votes: true, arguedBy: { include: { fromClaim: true } } } },
      strengthVotes: true,
      challenges: true,
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
    contentiousAsOf: Date | null;
    strengthVotes: { value: string }[];
    challenges: { kind: string }[];
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
    contentious: contentiousStatus(conn.contentiousAsOf),
    challenges: challengeCounts(conn.challenges),
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
  contentiousAsOf: Date | null;
  strengthVotes: { value: string }[];
  challenges: { kind: string }[];
  fromClaim: Parameters<typeof claimSummary>[0];
}, thisClaim: { title: string }) {
  const child = conn.fromClaim;
  const relWord = conn.relation === "SUPPORTS" ? "Supports" : "Contradicts";
  return {
    connectionId: conn.id,
    relation: conn.relation,
    statedStrength: conn.statedStrength,
    contentious: contentiousStatus(conn.contentiousAsOf),
    challenges: challengeCounts(conn.challenges),
    ...strengthMark(conn.statedStrength),
    otherClaim: { id: child.id, slug: child.slug, title: child.title },
    claimItself: claimSummary(child),
    relationSentence: `${relWord} “${thisClaim.title}”`,
    strengthDistribution: strengthDistribution(conn.strengthVotes),
    strengthDefinitions: strengthDefinitions(conn.relation),
  };
}

const CLAIM_TYPES = ["FACT", "OPINION", "VALUE", "PROPOSAL"];

claimsRouter.get("/claims", async (req, res) => {
  const type = typeof req.query.type === "string" ? req.query.type.toUpperCase() : undefined;
  const tag = typeof req.query.tag === "string" ? req.query.tag.toUpperCase() : undefined;
  if (type && !CLAIM_TYPES.includes(type)) return res.status(400).json({ error: "Unknown claim type" });
  const claims = await prisma.claim.findMany({
    where: {
      ...(type ? { type: type as "FACT" | "OPINION" | "VALUE" | "PROPOSAL" } : {}),
      ...(tag ? { tags: { has: tag } } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      oneLiner: true,
      type: true,
      tags: true,
      evidenceStrength: true,
      contestedAt: true,
      createdAt: true,
      votes: { select: { agree: true, wellConstructed: true } },
      arguedBy: {
        select: {
          relation: true,
          contentiousAsOf: true,
          fromClaim: { select: { slug: true, title: true, _count: { select: { votes: true } } } },
        },
      },
      usedIn: { select: { contentiousAsOf: true } },
      _count: { select: { usedIn: true, voices: true } },
    },
  });
  // The browse list carries enough to filter by every classification the
  // product uses, without a second request per claim.
  res.json(
    claims.map((c) => {
      const raterCount = c.votes.length;
      const agreePct = raterCount ? Math.round((c.votes.filter((v) => v.agree).length / raterCount) * 100) : null;
      const wellPct = raterCount ? Math.round((c.votes.filter((v) => v.wellConstructed).length / raterCount) * 100) : null;
      const contentious = c.arguedBy.find((a) => a.contentiousAsOf);
      return {
        id: c.id,
        slug: c.slug,
        title: c.title,
        oneLiner: c.oneLiner,
        type: c.type,
        tags: c.tags,
        evidenceStrength: c.evidenceStrength,
        contestedAt: c.contestedAt,
        createdAt: c.createdAt,
        raterCount,
        agreePct,
        wellConstructedPct: wellPct,
        supportsCount: c.arguedBy.filter((a) => a.relation === "SUPPORTS").length,
        contradictsCount: c.arguedBy.filter((a) => a.relation === "CONTRADICTS").length,
        usedInCount: c._count.usedIn,
        voiceCount: c._count.voices,
        isRoot: c._count.usedIn === 0 && c.arguedBy.length > 0,
        isTurningPoint: c.usedIn.some((u) => u.contentiousAsOf),
        turnsOn: contentious
          ? {
              slug: contentious.fromClaim.slug,
              title: contentious.fromClaim.title,
              raterCount: contentious.fromClaim._count.votes,
              reviewDue: !!contentiousStatus(contentious.contentiousAsOf)?.reviewDue,
            }
          : null,
      };
    })
  );
});

// Counts per type and per tag, for the classification pages and tooltips.
claimsRouter.get("/claims/facets", async (_req, res) => {
  const claims = await prisma.claim.findMany({ select: { type: true, tags: true } });
  const byType: Record<string, number> = {};
  const byTag: Record<string, number> = {};
  for (const c of claims) {
    byType[c.type] = (byType[c.type] ?? 0) + 1;
    for (const t of c.tags) byTag[t] = (byTag[t] ?? 0) + 1;
  }
  res.json({ byType, byTag });
});

// The whole atlas as nodes and edges, for the graph view. Light on purpose:
// titles, types, tags, counts and the connection relation/strength only.
claimsRouter.get("/graph", async (_req, res) => {
  const [claims, connections] = await Promise.all([
    prisma.claim.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        type: true,
        tags: true,
        _count: { select: { votes: true, usedIn: true, arguedBy: true } },
      },
    }),
    prisma.connection.findMany({
      select: { id: true, fromClaimId: true, toClaimId: true, relation: true, statedStrength: true, contentiousAsOf: true },
    }),
  ]);
  res.json({
    nodes: claims.map((c) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      type: c.type,
      tags: c.tags,
      raterCount: c._count.votes,
      arguedByCount: c._count.arguedBy,
      usedInCount: c._count.usedIn,
      isRoot: c._count.usedIn === 0 && c._count.arguedBy > 0,
    })),
    edges: connections.map((e) => ({
      id: e.id,
      from: e.fromClaimId,
      to: e.toClaimId,
      relation: e.relation,
      strength: e.statedStrength,
      contentious: !!e.contentiousAsOf,
    })),
  });
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
    voices: fresh.voices.map(voiceSummary),
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

// --- voices: public pieces that make the argument, rated like claims ----------

const VOICE_STANCES = ["SUPPORTS", "CONTRADICTS", "MIXED"];

claimsRouter.post("/claims/:id/voices", async (req, res) => {
  const { title, outlet, author, url, kind, stance } = req.body;
  if (!title || !outlet || !url || !stance) {
    return res.status(400).json({ error: "title, outlet, url and stance are required" });
  }
  if (!VOICE_STANCES.includes(stance)) return res.status(400).json({ error: "stance must be SUPPORTS, CONTRADICTS or MIXED" });
  if (!/^https?:\/\//.test(url)) return res.status(400).json({ error: "url must start with http:// or https://" });
  const voice = await prisma.voice.create({
    data: { claimId: req.params.id, title, outlet, author: author || null, url, kind: kind || "article", stance },
  });
  res.status(201).json(voice);
});

claimsRouter.delete("/claims/:id/voices/:voiceId", async (req, res) => {
  await prisma.voiceVote.deleteMany({ where: { voiceId: req.params.voiceId } });
  await prisma.voice.delete({ where: { id: req.params.voiceId } });
  res.status(204).end();
});

claimsRouter.post("/voices/:id/vote", async (req, res) => {
  const voterId = requireVoterId(req);
  const { agree, wellConstructed } = req.body;
  const vote = await prisma.voiceVote.upsert({
    where: { voiceId_voterId: { voiceId: req.params.id, voterId } },
    create: { voiceId: req.params.id, voterId, agree: !!agree, wellConstructed: !!wellConstructed },
    update: { agree: !!agree, wellConstructed: !!wellConstructed },
  });
  res.json(vote);
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
