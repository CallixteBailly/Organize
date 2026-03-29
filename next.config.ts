import type { NextConfig } from "next";

// Validate required environment variables at build/start time
const requiredEnvVars = ["DATABASE_URL", "AUTH_SECRET"] as const;
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar] && process.env.NODE_ENV === "production") {
    throw new Error(`Variable d'environnement requise manquante : ${envVar}`);
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
