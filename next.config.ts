import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.DOCKER_BUILD ? "standalone" : undefined,
  // Exclut playwright-core du bundle Webpack/Turbopack (Node.js natif uniquement)
  serverExternalPackages: ["playwright-core"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
