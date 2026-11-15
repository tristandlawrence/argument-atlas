import { Router } from "express";
import { ALL_OAUTH_PROVIDERS, enabledOAuthProviders } from "../lib/auth.ts";

export const authInfoRouter = Router();

authInfoRouter.get("/auth-info/providers", (_req, res) => {
  res.json(
    ALL_OAUTH_PROVIDERS.map((id) => ({ id, enabled: enabledOAuthProviders[id] }))
  );
});
