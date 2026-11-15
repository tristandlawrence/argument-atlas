import type { NextConfig } from "next";

// Two builds from one codebase:
//  - default: a server-rendered app talking to the Express API.
//  - NEXT_PUBLIC_STATIC_EXPORT=1: a read-only static snapshot for GitHub
//    Pages, with the data baked in from frontend/public/data (see
//    backend/scripts/snapshot.ts) and served under NEXT_PUBLIC_BASE_PATH.
const isStatic = process.env.NEXT_PUBLIC_STATIC_EXPORT === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  ...(isStatic
    ? {
        output: "export",
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
  ...(basePath ? { basePath } : {}),
};

export default nextConfig;
