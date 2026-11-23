import type { ApiFixture } from "./model";

type CollectorRow = {
  tenantId: string;
  serviceName: string;
  route: string;
  statusCode: number;
  count: number;
  p50Ms: number | null;
  p95Ms: number | null;
};

function share(count: number, total: number) {
  return total > 0 ? count / total : 0;
}

export function fixturesFromCollectorRows(rows: CollectorRow[]): Record<string, ApiFixture> {
  const byTenant = new Map<string, CollectorRow[]>();
  for (const row of rows) {
    const list = byTenant.get(row.tenantId) ?? [];
    list.push(row);
    byTenant.set(row.tenantId, list);
  }

  const out: Record<string, ApiFixture> = {};
  for (const [tenantId, tenantRows] of byTenant) {
    const total = tenantRows.reduce((sum, row) => sum + row.count, 0);
    const errors = tenantRows.filter((row) => row.statusCode >= 400).reduce((sum, row) => sum + row.count, 0);
    out[tenantId] = {
      apiRequests: total,
      delta: {
        requests: 0,
        errors: total > 0 ? errors / total : 0,
      },
      api: tenantRows
        .slice()
        .sort((a, b) => b.count - a.count)
        .slice(0, 12)
        .map((row) => ({
          service: row.serviceName,
          route: row.route,
          status: row.statusCode,
          share: share(row.count, total),
          p50: row.p50Ms ?? 0,
          p95: row.p95Ms ?? 0,
        })),
    };
  }
  return out;
}

export async function fetchCollectorApiMetrics(env: NodeJS.ProcessEnv = process.env) {
  const base = env.OTLP_COLLECTOR_URL?.trim().replace(/\/+$/, "");
  const token = env.OTLP_OPERATOR_TOKEN?.trim();
  if (!base || !token) return null;

  const response = await fetch(`${base}/metrics/api?all=1`, {
    headers: { authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`collector metrics ${response.status}`);
  const body = (await response.json()) as { rows?: CollectorRow[] };
  if (!Array.isArray(body.rows)) throw new Error("invalid collector metrics payload");
  return fixturesFromCollectorRows(body.rows);
}
