import type { NextConfig } from "next";
import path from "path";

const worker = "https://scf-analytics-poc.alexander-wurzer.workers.dev";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  async rewrites() {
    return ["/demo/roster", "/s/e", "/v1/traces", "/tenants", "/metrics/api", "/metrics/web"].map((path) => ({
      source: path,
      destination: worker + path,
    }));
  },
};

export default nextConfig;
