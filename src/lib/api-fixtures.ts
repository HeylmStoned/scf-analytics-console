import type { ApiFixture } from "./model";

export const API_FIXTURES: Record<string, ApiFixture> = {
  alpha: {
    apiRequests: 186400,
    delta: { requests: 0.112, errors: -0.021 },
    api: [
      { service: "payments", route: "/accounts/:account/payments/:id", status: 200, share: 0.62, p50: 50, p95: 250 },
      { service: "payments", route: "/accounts/:account/payments/:id", status: 201, share: 0.12, p50: 100, p95: 250 },
      { service: "payments", route: "/accounts/:account/payments/:id", status: 404, share: 0.04, p50: 25, p95: 50 },
      { service: "rpc", route: "/contracts/:contract", status: 200, share: 0.18, p50: 100, p95: 250 },
      { service: "rpc", route: "/contracts/:contract", status: 500, share: 0.04, p50: 1000, p95: 2500 },
    ],
  },
  beta: {
    apiRequests: 94200,
    delta: { requests: 0.063, errors: 0.014 },
    api: [
      { service: "quotes", route: "/markets/usdc", status: 200, share: 0.55, p50: 25, p95: 100 },
      { service: "quotes", route: "/markets/:id", status: 200, share: 0.22, p50: 50, p95: 250 },
      { service: "payments", route: "/accounts/:account/payments/:id", status: 200, share: 0.14, p50: 100, p95: 250 },
      { service: "payments", route: "/accounts/:account/payments/:id", status: 500, share: 0.09, p50: 1000, p95: 2500 },
    ],
  },
};
