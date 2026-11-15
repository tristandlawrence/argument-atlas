import { Router } from "express";
import { prisma } from "../lib/prisma.ts";
import { requireVoterId } from "../lib/voter.ts";
import { expireIfStale } from "../lib/contested.ts";

export const connectionsRouter = Router();

connectionsRouter.post("/connections", async (req, res) => {
  const { fromClaimId, toClaimId, relation, statedStrength, statedReason, authorName, summary } = req.body;
  if (!fromClaimId || !toClaimId || !relation || !authorName || !summary) {
    return res.status(400).json({ error: "fromClaimId, toClaimId, relation, authorName and summary are required" });
  }
  const connection = await prisma.connection.create({
    data: {
      fromClaimId,
      toClaimId,
      relation,
      statedStrength: statedStrength ?? "RELEVANT",
      statedReason,
      revisions: {
        create: { authorId: authorName, authorName, summary, snapshot: {}, pending: false },
      },
    },
  });
  res.status(201).json(connection);
});

connectionsRouter.patch("/connections/:id", async (req, res) => {
  const { authorName, summary, ...fields } = req.body;
  if (!authorName || !summary) return res.status(400).json({ error: "authorName and summary are required" });

  const connection = await prisma.connection.findUnique({ where: { id: req.params.id } });
  if (!connection) return res.status(404).json({ error: "Connection not found" });

  const owningClaim = await prisma.claim.findUniqueOrThrow({ where: { id: connection.fromClaimId } });
  await expireIfStale(owningClaim);
  const freshOwner = await prisma.claim.findUniqueOrThrow({ where: { id: connection.fromClaimId } });

  const snapshot: Record<string, unknown> = {};
  for (const key of Object.keys(fields)) {
    snapshot[key] = (connection as Record<string, unknown>)[key];
  }

  if (freshOwner.contestedAt) {
    await prisma.connectionRevision.create({
      data: { connectionId: connection.id, authorId: authorName, authorName, summary, snapshot: fields, pending: true },
    });
    return res.json({ pending: true });
  }

  await prisma.$transaction([
    prisma.connection.update({ where: { id: connection.id }, data: fields }),
    prisma.connectionRevision.create({
      data: { connectionId: connection.id, authorId: authorName, authorName, summary, snapshot, pending: false },
    }),
  ]);
  res.json({ pending: false });
});

connectionsRouter.post("/connections/:id/strength-vote", async (req, res) => {
  const voterId = requireVoterId(req);
  const { value } = req.body;
  const vote = await prisma.connectionStrengthVote.upsert({
    where: { connectionId_voterId: { connectionId: req.params.id, voterId } },
    create: { connectionId: req.params.id, voterId, value },
    update: { value },
  });
  res.json(vote);
});

// A challenge says the connection does not belong as placed: the child does
// no work for the parent (NOT_RELEVANT) or points the other way
// (WRONG_DIRECTION). One per voter per connection; posting again replaces it.
connectionsRouter.post("/connections/:id/challenge", async (req, res) => {
  const voterId = requireVoterId(req);
  const { kind } = req.body;
  if (kind !== "NOT_RELEVANT" && kind !== "WRONG_DIRECTION") {
    return res.status(400).json({ error: "kind must be NOT_RELEVANT or WRONG_DIRECTION" });
  }
  const challenge = await prisma.connectionChallenge.upsert({
    where: { connectionId_voterId: { connectionId: req.params.id, voterId } },
    create: { connectionId: req.params.id, voterId, kind },
    update: { kind },
  });
  res.json(challenge);
});

connectionsRouter.delete("/connections/:id/challenge", async (req, res) => {
  const voterId = requireVoterId(req);
  await prisma.connectionChallenge.deleteMany({ where: { connectionId: req.params.id, voterId } });
  res.status(204).end();
});
