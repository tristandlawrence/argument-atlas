import "dotenv/config";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { twoFactor } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { prisma } from "./prisma.ts";
import { sendEmail } from "./email.ts";

const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";

function envPair(idVar: string, secretVar: string) {
  const clientId = process.env[idVar];
  const clientSecret = process.env[secretVar];
  return clientId && clientSecret ? { clientId, clientSecret } : undefined;
}

const google = envPair("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET");
const microsoft = envPair("MICROSOFT_CLIENT_ID", "MICROSOFT_CLIENT_SECRET");
const facebook = envPair("FACEBOOK_CLIENT_ID", "FACEBOOK_CLIENT_SECRET");
const twitter = envPair("TWITTER_CLIENT_ID", "TWITTER_CLIENT_SECRET");
const discord = envPair("DISCORD_CLIENT_ID", "DISCORD_CLIENT_SECRET");
const reddit = envPair("REDDIT_CLIENT_ID", "REDDIT_CLIENT_SECRET");
const apple =
  process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY
    ? {
        clientId: process.env.APPLE_CLIENT_ID!,
        teamId: process.env.APPLE_TEAM_ID!,
        keyId: process.env.APPLE_KEY_ID!,
        privateKey: process.env.APPLE_PRIVATE_KEY!,
      }
    : undefined;

// Every provider we intend to support, in a stable order — used by the
// frontend to render a full, consistently-ordered list of sign-in options
// with the not-yet-configured ones shown disabled rather than hidden.
export const ALL_OAUTH_PROVIDERS = ["google", "microsoft", "apple", "facebook", "twitter", "discord", "reddit"] as const;

export const enabledOAuthProviders = {
  google: !!google,
  microsoft: !!microsoft,
  apple: !!apple,
  facebook: !!facebook,
  twitter: !!twitter,
  discord: !!discord,
  reddit: !!reddit,
};

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:4000",
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [frontendUrl],
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail(user.email, "Reset your Argument Atlas password", `<p><a href="${url}">Reset your password</a></p>`);
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail(user.email, "Verify your Argument Atlas email", `<p><a href="${url}">Verify your email</a></p>`);
    },
    sendOnSignUp: true,
  },
  socialProviders: {
    ...(google ? { google } : {}),
    ...(microsoft ? { microsoft } : {}),
    ...(apple ? { apple } : {}),
    ...(facebook ? { facebook } : {}),
    ...(twitter ? { twitter } : {}),
    ...(discord ? { discord } : {}),
    ...(reddit ? { reddit } : {}),
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "microsoft", "apple", "facebook", "twitter", "discord", "reddit", "email-password"],
    },
  },
  user: {
    additionalFields: {
      postcode: { type: "string", required: false },
      state: { type: "string", required: false },
      federalElectorate: { type: "string", required: false },
      gender: { type: "string", required: false },
      ageRange: { type: "string", required: false },
      educationLevel: { type: "string", required: false },
      relationshipStatus: { type: "string", required: false },
    },
  },
  plugins: [
    twoFactor({ issuer: "Argument Atlas" }),
    passkey({ rpID: process.env.PASSKEY_RP_ID ?? "localhost", rpName: "Argument Atlas" }),
  ],
});
