import { nameOf, type LiveProject } from "./model";

export type UmamiEnv = {
  UMAMI_API_KEY?: string;
  UMAMI_API_CLIENT_ENDPOINT?: string;
  UMAMI_URL?: string;
  UMAMI_USER?: string;
  UMAMI_PASSWORD?: string;
  UMAMI_ALPHA?: string;
  UMAMI_BETA?: string;
};

const RANGES: Record<string, { period: string; unit: string }> = {
  "24h": { period: "24h", unit: "hour" },
  "7d": { period: "7d", unit: "day" },
  "30d": { period: "30d", unit: "day" },
  "90d": { period: "90day", unit: "day" },
};

const EXTRA_DIMENSIONS = {
  channel: "Acquisition channels",
  event: "Custom events",
  title: "Page titles",
  hostname: "Hostnames",
  region: "Regions",
  city: "Cities",
  language: "Languages",
  screen: "Screen resolutions",
};

const regions = new Intl.DisplayNames(["en"], { type: "region" });
let session: { token: string; until: number } | null = null;
const boards = new Map<string, { until: number; body: unknown }>();

function num(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function ratio(current: number, previous: number): number {
  if (!previous) return 0;
  return (current - previous) / previous;
}

function title(value: string): string {
  if (!value) return "Unknown";
  const first = value[0];
  if (first >= "a" && first <= "z") return first.toUpperCase() + value.slice(1);
  return value;
}

function place(code: string): string {
  if (!code) return "Unknown";
  try {
    return regions.of(code) || code;
  } catch {
    return code;
  }
}

async function umami(endpoint: string, path: string, token: string): Promise<unknown> {
  const response = await fetch(endpoint + path, {
    headers: { authorization: "Bearer " + token },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("Umami " + response.status);
  return response.json();
}

async function tokenFor(env: UmamiEnv, endpoint: string): Promise<string> {
  if (session && session.until > Date.now()) return session.token;
  const response = await fetch(endpoint + "/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: env.UMAMI_USER || "admin", password: env.UMAMI_PASSWORD }),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("Umami login failed");
  const body = (await response.json()) as { token?: string };
  if (!body.token) throw new Error("Umami login failed");
  session = { token: body.token, until: Date.now() + 10 * 60 * 1000 };
  return body.token;
}

function rows(data: unknown, kind: string): { name: string; count: number }[] {
  if (!Array.isArray(data)) return [];
  return data.map((row) => {
    const item = row as { x?: string; y?: number };
    const raw = item.x || "";
    const name = kind === "country" ? place(raw) : kind === "referrer" ? raw || "Direct" : kind === "path" ? raw || "/" : title(raw);
    return { name, count: num(item.y) };
  });
}

function stamp(value: string, unit: string): { label: string; when: string } {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { label: value, when: value };
  if (unit === "hour") {
    return {
      label: date.toLocaleTimeString("en-US", { hour: "numeric", timeZone: "UTC" }),
      when: date.toLocaleString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: "UTC",
      }),
    };
  }
  return {
    label: date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
    when: date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }),
  };
}

export async function umamiDashboard(env: UmamiEnv, range: string): Promise<unknown | null> {
  const sites = Object.entries({ alpha: env.UMAMI_ALPHA, beta: env.UMAMI_BETA })
    .flatMap(([id, websiteId]) => websiteId?.trim() ? [{ id, websiteId: websiteId.trim() }] : []);
  if (!sites.length) return null;
  const apiKey = env.UMAMI_API_KEY?.trim();
  const selfHostedUrl = env.UMAMI_URL?.replace(/\/+$/, "");
  if (!apiKey && (!selfHostedUrl || !env.UMAMI_PASSWORD)) return null;
  const endpoint = apiKey
    ? (env.UMAMI_API_CLIENT_ENDPOINT?.trim() || "https://api.umami.is/v1").replace(/\/+$/, "")
    : selfHostedUrl + "/api";
  const spec = RANGES[range] ?? RANGES["30d"];
  const hit = boards.get(spec.period);
  if (hit && hit.until > Date.now()) return hit.body;
  const token = apiKey || (await tokenFor(env, endpoint));
  const query = "period=" + spec.period + "&timezone=UTC";
  const projects = await Promise.all(sites.map(({ id, websiteId }) =>
    project(endpoint, token, id, websiteId, query, spec.unit, Boolean(apiKey)),
  ));
  const body = { source: "umami", range, projects: Object.fromEntries(projects) };
  boards.set(spec.period, { until: Date.now() + 60_000, body });
  return body;
}

async function project(
  endpoint: string,
  token: string,
  id: string,
  websiteId: string,
  query: string,
  unit: string,
  includeExtraDimensions: boolean,
): Promise<[string, LiveProject]> {
  const root = "/websites/" + encodeURIComponent(websiteId);
  const metric = (type: string) => umami(endpoint, root + "/metrics?" + query + "&type=" + type + "&limit=8", token);
  const extraDimensions = includeExtraDimensions
    ? Object.entries(EXTRA_DIMENSIONS)
    : [];
  const [stats, series, paths, referrers, countries, browsers, devices, systems, website, extra] = await Promise.all([
    umami(endpoint, root + "/stats?" + query + (includeExtraDimensions ? "&compare=prev" : ""), token),
    umami(endpoint, root + "/pageviews?" + query + "&unit=" + unit, token),
    metric("path"),
    metric("referrer"),
    metric("country"),
    metric("browser"),
    metric("device"),
    metric("os"),
    includeExtraDimensions ? umami(endpoint, root, token).catch(() => null) : null,
    Promise.all(extraDimensions.map(async ([kind, label]) => {
      const data = await metric(kind).catch(() => null);
      return Array.isArray(data) ? [{ label, rows: rows(data, kind) }] : [];
    })),
  ]);
  const domain = (website as { domain?: string } | null)?.domain?.toLowerCase();
  const expectedDomain = nameOf(id).toLowerCase();
  const alternateDomain = Boolean(domain && domain !== expectedDomain && !domain.endsWith("." + expectedDomain));
  const current = stats as {
    pageviews?: number;
    visitors?: number;
    visits?: number;
    bounces?: number;
    totaltime?: number;
    comparison?: { pageviews?: number; visitors?: number; bounces?: number; visits?: number; totaltime?: number };
  };
  const visits = num(current.visits);
  const bounces = num(current.bounces);
  const bounce = visits ? bounces / visits : 0;
  const previousVisits = num(current.comparison?.visits);
  const previousBounces = num(current.comparison?.bounces);
  const previousBounce = previousVisits ? previousBounces / previousVisits : 0;
  const duration = visits ? num(current.totaltime) / visits : 0;
  const previousDuration = previousVisits ? num(current.comparison?.totaltime) / previousVisits : 0;
  const pageviews = (series as { pageviews?: { x: string; y: number }[] }).pageviews || [];
  const sessions = (series as { sessions?: { x: string; y: number }[] }).sessions || [];
  const visitorsByDay = new Map(sessions.map((point) => [point.x, num(point.y)]));
  const marks = pageviews.map((point) => stamp(point.x, unit));
  return [
    id,
    {
      views: num(current.pageviews),
      visitors: num(current.visitors),
      visits,
      bounces,
      alternateDomain,
      extra: extra.flat(),
      bounce,
      duration,
      pages: rows(paths, "path").map((row) => ({
        path: row.name === "Unknown" ? "/" : row.name,
        views: row.count,
        visitors: null,
        tenantId: id,
      })),
      seriesViews: pageviews.map((point) => num(point.y)),
      seriesVisitors: pageviews.map((point) => visitorsByDay.get(point.x) || 0),
      labels: marks.map((mark) => mark.label),
      when: marks.map((mark) => mark.when),
      referrers: rows(referrers, "referrer"),
      countries: rows(countries, "country"),
      browsers: rows(browsers, "browser"),
      devices: rows(devices, "device"),
      os: rows(systems, "os"),
      delta: {
        pageviews: ratio(num(current.pageviews), num(current.comparison?.pageviews)),
        visitors: ratio(num(current.visitors), num(current.comparison?.visitors)),
        bounce: ratio(bounce, previousBounce),
        duration: ratio(duration, previousDuration),
      },
    },
  ];
}
