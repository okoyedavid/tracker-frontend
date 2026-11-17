import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep production checks from replacing a running dev server's output.
  distDir: process.env.NODE_ENV === "production" ? ".next-production" : ".next",
  async rewrites() {
    const upstream = (process.env.API_UPSTREAM_URL || "http://localhost:5000").replace(/\/$/, "");
    return [
      { source: "/api/:path*", destination: `${upstream}/api/:path*` },
    ];
  },
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
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
