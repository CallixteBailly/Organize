import type { NextConfig } from "next";

// Validate required environment variables at runtime only (not during Vercel build)
if (process.env.NODE_ENV === "production" && !process.env.NEXT_PHASE) {
  const requiredEnvVars = ["DATABASE_URL", "AUTH_SECRET"] as const;
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Variable d'environnement requise manquante : ${envVar}`);
    }
  }
}

const nextConfig: NextConfig = {
  output: process.env.DOCKER_BUILD ? "standalone" : undefined,
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
