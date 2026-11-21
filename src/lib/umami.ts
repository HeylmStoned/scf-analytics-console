import { nameOf, WEB_AUDIENCE_DIMENSIONS, type LiveProject, type Named, type WebVitals } from "./model";

export type UmamiEnv = {
  UMAMI_API_KEY?: string;
  UMAMI_API_CLIENT_ENDPOINT?: string;
  UMAMI_URL?: string;
  UMAMI_USER?: string;
  UMAMI_PASSWORD?: string;
  UMAMI_ALPHA?: string;
  UMAMI_BETA?: string;
};

const RANGES: Record<string, { days: number; unit: string }> = {
  "24h": { days: 1, unit: "hour" },
  "7d": { days: 7, unit: "day" },
  "30d": { days: 30, unit: "day" },
  "90d": { days: 90, unit: "day" },
};

const EXTRA_DIMENSIONS = {
  channel: "Acquisition channels",
  event: "Custom events",
  title: "Page titles",
  hostname: "Hostnames",
  language: "Languages",
  screen: "Screen resolutions",
};

const UTM_DIMENSIONS = {
  utm_source: "UTM sources",
  utm_medium: "UTM mediums",
  utm_campaign: "UTM campaigns",
  utm_content: "UTM content",
  utm_term: "UTM terms",
};

const countryNames = new Intl.DisplayNames(["en"], { type: "region", fallback: "none" });
const languages = new Intl.DisplayNames(["en"], { type: "language", fallback: "none" });
let session: { token: string; until: number } | null = null;
type Dashboard = { source: "umami"; range: string; projects: Record<string, LiveProject> };
const boards = new Map<string, { until: number; response: Promise<Dashboard> }>();

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

function metricLabel(kind: string, value: string) {
  if (kind === "language" && value) {
    try {
      return languages.of(value.replaceAll("_", "-")) || value;
    } catch {
      return value;
    }
  }
  if (kind === "referrer") return value || "Direct";
  if (kind === "event" || kind === "title" || kind === "hostname") return value || "Unknown";
  return title(value);
}

function rows(data: unknown, kind: string): Named[] {
  if (!Array.isArray(data)) return [];
  return data.map(({ x, y }) => {
    const value = typeof x === "string" ? x : "";
    const count = num(y);
    if (kind === "country") {
      const code = /^[a-z]{2}$/i.test(value) ? value.toUpperCase() : undefined;
      return code ? { name: countryNames.of(code) ?? code, count, code } : { name: "Unknown", count };
    }
    return { name: metricLabel(kind, value), count };
  });
}

type PathStats = { path?: string; views?: number; visitors?: number; visits?: number; bounces?: number; totaltime?: number };

function pageRows(id: string, breakdown: unknown) {
  if (!Array.isArray(breakdown)) return [];
  return (breakdown as PathStats[]).slice().sort((a, b) => num(b.views) - num(a.views)).slice(0, 50).map((row) => {
    const visits = num(row.visits);
    const bounces = num(row.bounces);
    return {
      path: row.path || "/",
      views: num(row.views),
      visitors: num(row.visitors),
      visits,
      bounces,
      bounce: visits ? bounces / visits : 0,
      duration: visits ? num(row.totaltime) / visits : 0,
      tenantId: id,
    };
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

type ReportLevel = "totals" | "audience" | "activity" | "detail";

export function publicUmamiProjects(value: string | undefined) {
  return (value ?? "alpha").split(",").map((id) => id.trim()).filter((id) => id === "alpha" || id === "beta");
}

export async function umamiDashboard(env: UmamiEnv, range: string, scope: string[], level: ReportLevel): Promise<Dashboard | null> {
  const sites = Object.entries({ alpha: env.UMAMI_ALPHA, beta: env.UMAMI_BETA })
    .flatMap(([id, websiteId]) => scope.includes(id) && websiteId?.trim() ? [{ id, websiteId: websiteId.trim() }] : []);
  if (!sites.length) return null;
  const apiKey = env.UMAMI_API_KEY?.trim();
  const selfHostedUrl = env.UMAMI_URL?.replace(/\/+$/, "");
  if (!apiKey && (!selfHostedUrl || !env.UMAMI_PASSWORD)) return null;
  const endpoint = apiKey
    ? (env.UMAMI_API_CLIENT_ENDPOINT?.trim() || "https://api.umami.is/v1").replace(/\/+$/, "")
    : selfHostedUrl + "/api";
  if (!Object.hasOwn(RANGES, range)) range = "30d";
  const spec = RANGES[range];
  const key = JSON.stringify([endpoint, range, sites, level]);
  const now = Date.now();
  const hit = boards.get(key);
  if (hit && hit.until > now) return hit.response;

  const response = (async (): Promise<Dashboard> => {
    const token = apiKey || (await tokenFor(env, endpoint));
    const query = new URLSearchParams({
      startAt: String(now - spec.days * 86_400_000),
      endAt: String(now),
      timezone: "UTC",
    }).toString();
    const projects = await Promise.all(sites.map(({ id, websiteId }) =>
      project(endpoint, token, id, websiteId, query, spec.unit, level),
    ));
    if (level === "activity" && projects.length > 1) alignActivity(projects, spec.unit);
    return { source: "umami", range, projects: Object.fromEntries(projects) };
  })();
  boards.set(key, { until: now + 60_000, response });
  try {
    return await response;
  } catch (error) {
    if (boards.get(key)?.response === response) boards.delete(key);
    throw error;
  }
}

async function project(
  endpoint: string,
  token: string,
  id: string,
  websiteId: string,
  query: string,
  unit: string,
  level: ReportLevel,
): Promise<[string, LiveProject]> {
  const root = "/websites/" + encodeURIComponent(websiteId);
  const get = (path: string) => umami(endpoint, root + path, token);
  const [data, series, details, audience, topPages] = await Promise.all([
    get("/stats?" + query + "&compare=prev"),
    level === "activity" || level === "detail" ? get("/pageviews?" + query + "&unit=" + unit).catch(() => null) : null,
    level === "detail" ? projectDetails(get, id, query) : null,
    level === "audience" ? Promise.all(Object.entries(WEB_AUDIENCE_DIMENSIONS).map(async ([key, type]) => {
      const response = await get("/metrics?" + query + "&type=" + type + "&limit=50").catch(() => null);
      return [key, Array.isArray(response) ? rows(response, type) : null] as const;
    })) : null,
    level === "audience" ? get("/breakdown?" + query + "&fields=" + encodeURIComponent(JSON.stringify(["path"]))).catch(() => null) : null,
  ]);
  const current = data as Stats & { comparison?: Stats };
  const values = totals(current);
  const previous = totals(current.comparison);
  const result: LiveProject = {
    ...values,
    delta: {
      pageviews: ratio(values.views, previous.views),
      visitors: ratio(values.visitors, previous.visitors),
      bounce: ratio(values.bounce, previous.bounce),
      duration: ratio(values.duration, previous.duration),
    },
  };
  if (series) Object.assign(result, activity(series, unit));
  if (details) result.details = details;
  if (audience) result.audience = Object.fromEntries(audience);
  if (level === "audience") result.topPages = Array.isArray(topPages) ? pageRows(id, topPages) : null;
  return [id, result];
}

type Stats = { pageviews?: number; visitors?: number; visits?: number; bounces?: number; totaltime?: number };

function totals(data?: Stats) {
  const visits = num(data?.visits);
  const bounces = num(data?.bounces);
  return {
    views: num(data?.pageviews),
    visitors: num(data?.visitors),
    visits,
    bounces,
    bounce: visits ? bounces / visits : 0,
    duration: visits ? num(data?.totaltime) / visits : 0,
  };
}

async function projectDetails(get: (path: string) => Promise<unknown>, id: string, query: string): Promise<NonNullable<LiveProject["details"]>> {
  const metric = (type: string) => get("/metrics?" + query + "&type=" + type + "&limit=50");
  const optional = (path: string) => get(path).catch(() => null);
  const [referrers, countries, browsers, devices, systems, website, breakdown, active, performance, extra, utm] = await Promise.all([
    metric("referrer"),
    metric("country"),
    metric("browser"),
    metric("device"),
    metric("os"),
    optional(""),
    optional("/breakdown?" + query + "&fields=" + encodeURIComponent(JSON.stringify(["path"]))),
    optional("/active"),
    optional("/performance/stats?" + query),
    Promise.all(Object.entries(EXTRA_DIMENSIONS).map(async ([kind, label]) => {
      const data = await metric(kind).catch(() => null);
      return { label, rows: Array.isArray(data) ? rows(data, kind) : null };
    })),
    Promise.all(Object.entries(UTM_DIMENSIONS).map(async ([kind, label]) => {
      const data = await optional("/utm/metrics?" + query + "&type=" + kind);
      return {
        label,
        rows: Array.isArray(data) ? data.map(({ utm, views }) => ({ name: String(utm), count: num(views) })) : null,
      };
    })),
  ]);
  const domain = (website as { domain?: string } | null)?.domain?.toLowerCase();
  const expectedDomain = nameOf(id).toLowerCase();
  const alternateDomain = Boolean(domain && domain !== expectedDomain && !domain.endsWith("." + expectedDomain));
  return {
    alternateDomain,
    extra: [...extra, ...utm],
    activeVisitors: (active as { visitors?: number } | null)?.visitors,
    performance: (performance as WebVitals | null) ?? undefined,
    pages: pageRows(id, breakdown),
    referrers: rows(referrers, "referrer"),
    countries: rows(countries, "country"),
    browsers: rows(browsers, "browser"),
    devices: rows(devices, "device"),
    os: rows(systems, "os"),
  };
}

function alignActivity(projects: [string, LiveProject][], unit: string) {
  const dates = [...new Set(projects.flatMap(([, site]) => site.dates ?? []))].sort();
  const marks = dates.map((date) => stamp(date, unit));
  for (const [, site] of projects) {
    if (!site.dates) continue;
    const indexByDate = new Map(site.dates.map((date, index) => [date, index]));
    const { seriesViews, seriesVisitors } = site;
    site.seriesViews = dates.map((date) => seriesViews?.[indexByDate.get(date) ?? -1] ?? 0);
    site.seriesVisitors = dates.map((date) => seriesVisitors?.[indexByDate.get(date) ?? -1] ?? 0);
    site.labels = marks.map((mark) => mark.label);
    site.when = marks.map((mark) => mark.when);
    site.dates = dates;
  }
}

function activity(series: unknown, unit: string) {
  const pageviews = (series as { pageviews?: { x: string; y: number }[] }).pageviews || [];
  const sessions = (series as { sessions?: { x: string; y: number }[] }).sessions || [];
  const visitorsByDay = new Map(sessions.map((point) => [point.x, num(point.y)]));
  const viewsByDay = new Map(pageviews.map((point) => [point.x, num(point.y)]));
  const dates = [...new Set([...viewsByDay.keys(), ...visitorsByDay.keys()])].sort();
  const marks = dates.map((date) => stamp(date, unit));
  return {
    dates,
    seriesViews: dates.map((date) => viewsByDay.get(date) ?? 0),
    seriesVisitors: dates.map((date) => visitorsByDay.get(date) ?? 0),
    labels: marks.map((mark) => mark.label),
    when: marks.map((mark) => mark.when),
  };
}
