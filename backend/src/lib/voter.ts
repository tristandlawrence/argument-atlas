import type { Request } from "express";

export function requireVoterId(req: Request): string {
  const voterId = req.header("x-voter-id");
  if (!voterId) {
    throw Object.assign(new Error("x-voter-id header is required"), { status: 400 });
  }
  return voterId;
}
