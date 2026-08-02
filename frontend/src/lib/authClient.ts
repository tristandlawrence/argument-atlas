import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export const authClient = createAuthClient({
  baseURL: API_URL.replace(/\/api$/, "") + "/api/auth",
  plugins: [twoFactorClient(), passkeyClient()],
});

export const { useSession, signIn, signOut, signUp } = authClient;
