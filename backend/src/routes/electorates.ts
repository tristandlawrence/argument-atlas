import { Router } from "express";
import { prisma } from "../lib/prisma.ts";
import { stateForPostcode } from "../lib/postcodeState.ts";

export const electoratesRouter = Router();

electoratesRouter.get("/electorates/lookup", async (req, res) => {
  const postcode = String(req.query.postcode ?? "");
  const rangeState = stateForPostcode(postcode);
  if (!rangeState) {
    return res.status(400).json({ error: "Enter a valid 4-digit Australian postcode." });
  }

  const curated = await prisma.postcode.findUnique({ where: { postcode } });

  res.json({
    postcode,
    state: curated?.state ?? rangeState,
    electorates: curated?.federalElectorates ?? [],
    coverage: curated ? "curated" : "state-only",
  });
});
