import type { NextConfig } from "next";
import path from "path";

const worker = "https://scf-analytics-poc.alexander-wurzer.workers.dev";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: path.join(__dirname),
  },
  async redirects() {
    return [{ source: "/scf", destination: "/", permanent: false }];
  },
  async rewrites() {
    return ["/demo/roster", "/s/e", "/v1/traces", "/tenants", "/metrics/web"].map((path) => ({
      source: path,
      destination: worker + path,
    }));
  },
};

export default nextConfig;
