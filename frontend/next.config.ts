import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {
    root: rootDir,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
