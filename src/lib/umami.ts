import { nameOf, UMAMI_PROJECT_DOMAINS, WEB_AUDIENCE_DIMENSIONS, type LiveProject, type Named, type UmamiDirectory, type WebVitals } from "./model";

type UmamiEnv = NodeJS.ProcessEnv & {
  UMAMI_API_KEY?: string;
  UMAMI_API_CLIENT_ENDPOINT?: string;
  UMAMI_URL?: string;
  UMAMI_USER?: string;
  UMAMI_PASSWORD?: string;
  UMAMI_TRACKER_DOMAINS?: string;
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
type Dashboard = { source: "umami"; range: string; projects: Record<string, LiveProject>; directory?: UmamiDirectory };
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
type UmamiSite = { id: string; websiteId: string; name: string; domain: string };
type WebsiteRecord = { id?: string; websiteId?: string; name?: string; domain?: string; deletedAt?: string | null };
type WebsitePage = { data: WebsiteRecord[]; count: number; pageSize: number };

let directoryCache: {
  endpoint: string;
  token: string;
  until: number;
  response: Promise<WebsiteRecord[]>;
  pageviewChecks: Map<string, Promise<boolean>>;
} | undefined;

function hostname(value: string) {
  const domain = value.trim();
  if (!domain) return "";
  try {
    const url = new URL(domain.includes("://") ? domain : "https://" + domain);
    return url.hostname.toLowerCase().replace(/\.$/, "").replace(/^www\./, "");
  } catch {
    return "";
  }
}

async function discoverUmami(env: UmamiEnv) {
  const apiKey = env.UMAMI_API_KEY?.trim();
  const selfHostedUrl = env.UMAMI_URL?.trim().replace(/\/+$/, "");
  if (!apiKey && (!selfHostedUrl || !env.UMAMI_PASSWORD)) return null;
  const endpoint = apiKey
    ? (env.UMAMI_API_CLIENT_ENDPOINT?.trim() || "https://api.umami.is/v1").replace(/\/+$/, "")
    : selfHostedUrl + "/api";
  const token = apiKey || (await tokenFor(env, endpoint));

  if (!directoryCache || directoryCache.endpoint !== endpoint ||
      directoryCache.token !== token || directoryCache.until <= Date.now()) {
    const response = listWebsites(endpoint, token);
    directoryCache = { endpoint, token, until: Date.now() + 60_000, response, pageviewChecks: new Map() };
    void response.catch(() => {
      if (directoryCache?.response === response) directoryCache = undefined;
    });
  }

  const cache = directoryCache;
  const properties = new Map<string, { name: string; domain: string; hostname: string }>();
  for (const site of await cache.response) {
    const websiteId = site?.id ?? site?.websiteId;
    const domain = typeof site?.domain === "string" ? site.domain.trim() : "";
    const host = hostname(domain);
    if (!host || typeof websiteId !== "string" || !websiteId.trim() || site.deletedAt) continue;
    const name = typeof site.name === "string" ? site.name.trim() : "";
    properties.set(websiteId.trim(), { name: name || domain, domain, hostname: host });
  }

  const trackerDomains = env.UMAMI_TRACKER_DOMAINS?.split(",").map(hostname).filter(Boolean);
  const demoDomains = trackerDomains?.length ? trackerDomains : [UMAMI_PROJECT_DOMAINS.alpha, "scf-console-production.up.railway.app"];
  // Keep established IDs for the demo roster and sample API fixtures.
  const aliases = new Map<string, string>();
  const candidates = [
    ["alpha", demoDomains],
    ["beta", [UMAMI_PROJECT_DOMAINS.beta]],
    ["lend", ["app.lend.xyz", UMAMI_PROJECT_DOMAINS.lend]],
  ] as const;
  for (const [id, domains] of candidates) {
    for (const domain of domains) {
      const match = [...properties].find(([websiteId, site]) => site.hostname === domain && !aliases.has(websiteId));
      if (match) {
        aliases.set(match[0], id);
        break;
      }
    }
  }
  const sites: UmamiSite[] = [...properties].map(([websiteId, { name, domain }]) => ({
    id: aliases.get(websiteId) ?? "site:" + websiteId,
    websiteId,
    name,
    domain,
  }));
  return { endpoint, token, sites, pageviewChecks: cache.pageviewChecks };
}

async function listWebsites(endpoint: string, token: string) {
  const websites: WebsiteRecord[] = [];
  for (let page = 1; ; page++) {
    const result = await umami(endpoint, "/websites?includeTeams=true&pageSize=100&page=" + page, token) as WebsitePage | WebsiteRecord[];
    if (Array.isArray(result)) return result;
    if (!Array.isArray(result?.data) || !Number.isInteger(result.count) ||
        !Number.isInteger(result.pageSize) || result.pageSize < 1) {
      throw new Error("Invalid Umami website list");
    }
    websites.push(...result.data);
    if (!result.data.length || page * result.pageSize >= result.count) return websites;
  }
}

function projectDirectory(sites: UmamiSite[]): UmamiDirectory {
  return Object.fromEntries(sites.map(({ id, name, domain }) => [id, { name, domain }]));
}

async function sitesWithPageviews(
  integration: NonNullable<Awaited<ReturnType<typeof discoverUmami>>>,
  candidates: UmamiSite[],
) {
  const { endpoint, token, pageviewChecks } = integration;
  const query = "?startAt=1&endAt=" + Date.now() + "&timezone=UTC";
  const checked = await Promise.all(candidates.map(async (site) => {
    let check = pageviewChecks.get(site.websiteId);
    if (!check) {
      const lookup = umami(endpoint, "/websites/" + encodeURIComponent(site.websiteId) + "/stats" + query, token)
        .then((data) => num((data as Stats | undefined)?.pageviews) > 0);
      pageviewChecks.set(site.websiteId, lookup);
      check = lookup;
    }

    try {
      return await check ? site : null;
    } catch {
      if (pageviewChecks.get(site.websiteId) === check) pageviewChecks.delete(site.websiteId);
      return null;
    }
  }));
  return checked.filter((site) => site !== null);
}

export async function activeUmamiProjects(env: UmamiEnv): Promise<UmamiDirectory> {
  const integration = await discoverUmami(env);
  return integration ? projectDirectory(await sitesWithPageviews(integration, integration.sites)) : {};
}

export async function umamiDashboard(
  env: UmamiEnv,
  range: string,
  tenant: string | null,
  level: ReportLevel,
  includeInactive = false,
): Promise<Dashboard | null> {
  const integration = await discoverUmami(env);
  if (!integration) return null;
  const { endpoint, token } = integration;
  const candidates = tenant ? integration.sites.filter(({ id }) => id === tenant) : integration.sites;
  const sites = includeInactive ? candidates : await sitesWithPageviews(integration, candidates);
  if (!sites.length && !includeInactive) return null;
  if (!Object.hasOwn(RANGES, range)) range = "30d";
  const spec = RANGES[range];
  const key = JSON.stringify([endpoint, range, sites, level, includeInactive]);
  const now = Date.now();
  const hit = boards.get(key);
  if (hit && hit.until > now) return hit.response;

  const response = (async (): Promise<Dashboard> => {
    const query = new URLSearchParams({
      startAt: String(now - spec.days * 86_400_000),
      endAt: String(now),
      timezone: "UTC",
    }).toString();
    const reports = sites.map(({ id, websiteId }) => project(endpoint, token, id, websiteId, query, spec.unit, level));
    if (includeInactive) {
      const results = await Promise.allSettled(reports);
      const projects = results.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
      return { source: "umami", range, projects: Object.fromEntries(projects), directory: projectDirectory(sites) };
    }

    const projects = await Promise.all(reports);
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
