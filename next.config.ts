import type { NextConfig } from "next";

// cacheComponents/partialPrefetching are off on purpose: almost every page reads
// the login cookie, and the MVP favours simple request-time rendering.
const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
