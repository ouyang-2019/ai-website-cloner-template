import type { NextConfig } from "next";

const buildWorkers = Math.max(1, Number.parseInt(process.env.NEXT_BUILD_WORKERS ?? "2", 10) || 2);

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    cpus: buildWorkers,
    staticGenerationMaxConcurrency: buildWorkers,
    staticGenerationMinPagesPerWorker: 1,
  },
};

export default nextConfig;
