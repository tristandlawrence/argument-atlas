import "dotenv/config";
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.ts";
import { claimsRouter } from "./routes/claims.ts";
import { connectionsRouter } from "./routes/connections.ts";
import { authInfoRouter } from "./routes/authInfo.ts";
import { electoratesRouter } from "./routes/electorates.ts";

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 4000;
const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";

app.use(cors({ origin: frontendUrl, credentials: true }));

// Better Auth's handler does its own body parsing and must be mounted
// before express.json() — parsing the body twice leaves it stuck pending.
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.use("/api", claimsRouter);
app.use("/api", connectionsRouter);
app.use("/api", authInfoRouter);
app.use("/api", electoratesRouter);

app.use((err: { status?: number; message?: string }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err.status ?? 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: err.message ?? "Internal server error" });
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
