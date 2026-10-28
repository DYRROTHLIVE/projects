import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the default request-time rendering needed by authenticated and database-backed routes.
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
