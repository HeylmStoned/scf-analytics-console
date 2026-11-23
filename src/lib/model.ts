export const ACCOUNT = "G" + "A".repeat(55);
export const RANGES = ["24h", "7d", "30d", "90d"] as const;
export type RangeKey = (typeof RANGES)[number];

export const API_METRICS_NOTICE =
  "API route, status, and latency from the OTLP collector when Prism dual-exports. Falls back to sample fixtures if the collector is empty or unreachable.";
export const SNIPPET =
  '<script defer src="https://s.example/s/v1.0.0/s.js" data-website-id="SITE_ID" integrity="sha384-..." crossorigin="anonymous"></script>';

const POINTS: Record<RangeKey, number> = { "24h": 24, "7d": 7, "30d": 30, "90d": 30 };
const SCALE: Record<RangeKey, number> = { "24h": 0.034, "7d": 0.22, "30d": 1, "90d": 2.85 };
export const PRIOR: Record<RangeKey, string> = {
  "24h": "prior day",
  "7d": "prior week",
  "30d": "prior 30 days",
  "90d": "prior 90 days",
};
export const RANGE_LABELS: Record<RangeKey, string> = {
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
};
export const METRICS: Record<string, string> = {
  pages: "Top pages",
  referrers: "Referrers",
  countries: "Countries",
  browsers: "Browsers",
  devices: "Devices",
  os: "Operating systems",
};
export const PIE = ["#d4c4ff", "#f0a090", "#9ed9bc", "#e4c48a", "#8f82b8", "#6d6558", "#7eb6d6", "#c4b4a4"];
const DEMO_END = new Date(Date.UTC(2026, 10, 17));

export type Named = { name: string; count: number; code?: string };
export const WEB_AUDIENCE_DIMENSIONS = {
  countries: "country",
  referrers: "referrer",
  devices: "device",
  browsers: "browser",
  os: "os",
} as const;
type WebAudienceDimension = keyof typeof WEB_AUDIENCE_DIMENSIONS;
export const WEB_REPORTS = ["pages", "countries", "referrers", "devices", "browsers", "os"] as const;
export type PageRow = {
  path: string;
  share?: number;
  bounce?: number;
  duration?: number;
  tenantId: string;
  views: number;
  visitors: number | null;
  visits?: number;
  bounces?: number;
};
export type ApiRow = {
  service: string;
  route: string;
  status: number;
  p50: number;
  p95: number;
  tenantId: string;
  count: number;
};
export type ApiFixture = {
  apiRequests: number;
  delta: { requests: number; errors: number };
  api: { service: string; route: string; status: number; share: number; p50: number; p95: number }[];
  /** True when rows come from the OTLP collector rather than demo fixtures. */
  live?: boolean;
};
export type SiteStats = {
  id: string;
  views: number;
  visitors: number;
  bounce: number;
  duration: number;
  pages: PageRow[];
  api: ApiRow[];
  requests: number;
  errors: number;
  client: number;
  errorRate: number;
  p50: number | null;
  p95: number | null;
  seriesViews: number[];
  seriesVisitors: number[];
  seriesRequests: number[];
  referrers: Named[];
  countries: Named[];
  devices: Named[];
  browsers: Named[];
  os: Named[];
  delta: { pageviews: number; visitors: number; bounce: number; duration: number; requests: number; errors: number };
};
export const WEB_VITALS = {
  lcp: "Largest Contentful Paint",
  inp: "Interaction to Next Paint",
  cls: "Cumulative Layout Shift",
  fcp: "First Contentful Paint",
  ttfb: "Time to First Byte",
};
export type WebVitals = Partial<Record<keyof typeof WEB_VITALS, { p50: number; p75: number; p95: number }>> & { count: number };

export type LiveProject = {
  views: number;
  visitors: number;
  visits: number;
  bounces: number;
  audience?: Partial<Record<WebAudienceDimension, Named[] | null>>;
  topPages?: PageRow[] | null;
  details?: {
    alternateDomain: boolean;
    extra: { label: string; rows: Named[] | null }[];
    activeVisitors?: number;
    performance?: WebVitals;
    pages: PageRow[];
    referrers: Named[];
    countries: Named[];
    browsers: Named[];
    devices: Named[];
    os: Named[];
  };
  bounce: number;
  duration: number;
  seriesViews?: number[];
  seriesVisitors?: number[];
  dates?: string[];
  labels?: string[];
  when?: string[];
  delta: { pageviews: number; visitors: number; bounce: number; duration: number };
};
export type Waiting = { id: string; name: string; detail: string; umamiStatus: string; status: string };
export type Audit = {
  at: string;
  actor: string;
  project: string;
  projectId: string;
  action: string;
  period: string;
  reason: string;
  visitors: number;
  views: number;
  requests: number;
};
export type DetailView =
  | { kind: "path"; tenantId: string; path: string; sample?: boolean }
  | { kind: "api"; tenantId: string; route: string; service: string; status: number }
  | { kind: "day"; index: number; source: "web" | "api" };

export type AppState = {
  token: string;
  role: string;
  mode: "" | "public" | "scf" | "tenant";
  gateStep: "modes" | "tenant";
  tenantId: string;
  umamiSites: UmamiDirectory | null;
  managedSites: UmamiDirectory | null;
  roster: { tenants: { id: string; token: string }[]; operatorToken: string } | null;
  view: string;
  range: RangeKey;
  status: string;
  project: string;
  sort: string;
  projectQuery: string;
  projectSort: string;
  receipt: { tone: string; title: string; rows: [string, string][] } | null;
  busy: boolean;
  metric: string;
  slice: string;
  detail: DetailView | null;
  approval: boolean;
  listing: Record<string, string>;
  removed: Record<string, boolean>;
  erasure: Record<string, { web: StreamMark; api: StreamMark }>;
  audit: Audit[];
  privacyProject: string;
  privacyAction: string;
  privacyStream: string;
  privacyPeriod: string;
  privacyReason: string;
  privacyConfirm: string;
  privacyStep: string;
  privacyError: string;
  waiting: Waiting[];
  keys: { id: string; name: string; hint: string; revoked: boolean; scope: "global" | "tenant"; tenantId?: string }[];
  chartFocus: "both" | "visitors" | "views";
  webReport: (typeof WEB_REPORTS)[number];
  keyScope: "global" | "tenant";
  keyTenant: string;
  apiMetrics: Record<string, ApiFixture> | null;
  apiSource: "collector" | "sample" | "mixed" | null;
  apiLiveIds: string[];
  umami: Record<string, LiveProject> | null;
  umamiLabels: string[] | null;
  umamiWhen: string[] | null;
  freshKey: string;
  extra: Record<string, { views: number; paths: Record<string, number>; api: Record<string, number> }>;
  gateError: string;
  enrollOpen: boolean;
  enrollId: string;
  enrollName: string;
  enrollStep: "details" | "confirm" | "done";
  enrollToken: string;
  enrollResult: string;
  menuOpen: boolean;
};
type StreamMark = { all: boolean; ranges: Record<string, boolean> };
type Profile = {
  name: string;
  detail: string;
  hue: string;
  pageviews: number;
  visitors: number;
  bounce: number;
  durationSec: number;
  delta: Omit<SiteStats["delta"], "requests" | "errors">;
  pages: { path: string; share: number; bounce: number; duration: number }[];
  referrers: { name: string; share: number }[];
  countries: { name: string; share: number }[];
  devices: { name: string; share: number }[];
  browsers: { name: string; share: number }[];
  os: { name: string; share: number }[];
};

export const UMAMI_PROJECT_DOMAINS = {
  alpha: "scf-umami-poc-production.up.railway.app",
  beta: "prismfi.cc",
  lend: "lend.xyz",
} as const;
export type UmamiProjectId = keyof typeof UMAMI_PROJECT_DOMAINS;

export function isUmamiProject(id: string): id is UmamiProjectId {
  return Object.hasOwn(UMAMI_PROJECT_DOMAINS, id);
}

export type UmamiDirectory = Record<string, { name: string; domain: string }>;

export function isAnalyticsProjectId(id: string) {
  return isUmamiProject(id) || id.startsWith("site:");
}

const EMPTY_WEB_PROFILE = {
  detail: "Stellar project",
  hue: "lavender",
  pageviews: 0,
  visitors: 0,
  bounce: 0,
  durationSec: 0,
  delta: { pageviews: 0, visitors: 0, bounce: 0, duration: 0 },
  pages: [],
  referrers: [],
  countries: [],
  devices: [],
  browsers: [],
  os: [],
} satisfies Omit<Profile, "name">;

export const PROFILES: Record<string, Profile> = {
  alpha: {
    name: UMAMI_PROJECT_DOMAINS.alpha,
    detail: "Analytics demo",
    hue: "lavender",
    pageviews: 48210,
    visitors: 19440,
    bounce: 0.384,
    durationSec: 134,
    delta: { pageviews: 0.084, visitors: 0.051, bounce: -0.012, duration: 0.037 },
    pages: [
      { path: "/", share: 0.41, bounce: 0.29, duration: 52 },
      { path: "/swap", share: 0.22, bounce: 0.33, duration: 96 },
      { path: "/accounts/:account", share: 0.14, bounce: 0.22, duration: 214 },
      { path: "/markets/usdc", share: 0.11, bounce: 0.41, duration: 74 },
      { path: "/portfolio", share: 0.07, bounce: 0.18, duration: 248 },
      { path: "/docs", share: 0.05, bounce: 0.62, duration: 38 },
    ],
    referrers: [
      { name: "Direct", share: 0.38 },
      { name: "stellar.org", share: 0.21 },
      { name: "lab.stellar.org", share: 0.14 },
      { name: "github.com", share: 0.11 },
      { name: "x.com", share: 0.09 },
      { name: "Discord", share: 0.07 },
    ],
    countries: [
      { name: "United States", share: 0.28 },
      { name: "Germany", share: 0.14 },
      { name: "Brazil", share: 0.11 },
      { name: "Nigeria", share: 0.09 },
      { name: "South Korea", share: 0.08 },
      { name: "United Kingdom", share: 0.07 },
      { name: "France", share: 0.06 },
      { name: "Japan", share: 0.05 },
    ],
    devices: [
      { name: "Desktop", share: 0.62 },
      { name: "Mobile", share: 0.34 },
      { name: "Tablet", share: 0.04 },
    ],
    browsers: [
      { name: "Chrome", share: 0.58 },
      { name: "Firefox", share: 0.18 },
      { name: "Safari", share: 0.14 },
      { name: "Edge", share: 0.1 },
    ],
    os: [
      { name: "Windows", share: 0.41 },
      { name: "macOS", share: 0.28 },
      { name: "iOS", share: 0.16 },
      { name: "Android", share: 0.12 },
      { name: "Linux", share: 0.03 },
    ],
  },
  beta: {
    name: "Prismfi.cc",
    detail: "Stellar project",
    hue: "coral",
    pageviews: 30110,
    visitors: 9800,
    bounce: 0.512,
    durationSec: 78,
    delta: { pageviews: 0.041, visitors: 0.016, bounce: 0.008, duration: -0.02 },
    pages: [
      { path: "/", share: 0.34, bounce: 0.46, duration: 40 },
      { path: "/markets/usdc", share: 0.28, bounce: 0.38, duration: 126 },
      { path: "/trade", share: 0.18, bounce: 0.44, duration: 154 },
      { path: "/markets/:id", share: 0.12, bounce: 0.52, duration: 88 },
      { path: "/contracts/:contract", share: 0.08, bounce: 0.61, duration: 36 },
    ],
    referrers: [
      { name: "Direct", share: 0.31 },
      { name: "stellar.org", share: 0.24 },
      { name: "defillama.com", share: 0.16 },
      { name: "x.com", share: 0.14 },
      { name: "github.com", share: 0.09 },
      { name: "Discord", share: 0.06 },
    ],
    countries: [
      { name: "United States", share: 0.22 },
      { name: "Germany", share: 0.16 },
      { name: "Singapore", share: 0.12 },
      { name: "Brazil", share: 0.11 },
      { name: "South Korea", share: 0.09 },
      { name: "Nigeria", share: 0.08 },
      { name: "France", share: 0.07 },
      { name: "Japan", share: 0.05 },
    ],
    devices: [
      { name: "Desktop", share: 0.71 },
      { name: "Mobile", share: 0.26 },
      { name: "Tablet", share: 0.03 },
    ],
    browsers: [
      { name: "Chrome", share: 0.64 },
      { name: "Firefox", share: 0.16 },
      { name: "Safari", share: 0.12 },
      { name: "Edge", share: 0.08 },
    ],
    os: [
      { name: "Windows", share: 0.48 },
      { name: "macOS", share: 0.22 },
      { name: "Linux", share: 0.14 },
      { name: "Android", share: 0.11 },
      { name: "iOS", share: 0.05 },
    ],
  },
  lend: {
    ...EMPTY_WEB_PROFILE,
    name: "Lend.xyz",
    hue: "mint",
  },
};

export function profileOf(id: string, sites?: UmamiDirectory | null): Profile & { domain?: string } {
  const profile = Object.hasOwn(PROFILES, id) ? PROFILES[id] : { ...EMPTY_WEB_PROFILE, name: id };
  const site = sites?.[id];
  return site ? { ...profile, ...site } : profile;
}

export function createState(umamiSites: UmamiDirectory | null): AppState {
  return {
    token: "",
    role: "",
    mode: "",
    gateStep: "modes",
    tenantId: "",
    umamiSites,
    managedSites: null,
    roster: null,
    view: "overview",
    range: "30d",
    status: "all",
    project: "all",
    sort: "requests",
    projectQuery: "",
    projectSort: "requests",
    receipt: null,
    busy: false,
    metric: "",
    slice: "",
    detail: null,
    approval: false,
    listing: {},
    removed: {},
    erasure: {},
    audit: [],
    privacyProject: "alpha",
    privacyAction: "erase",
    privacyStream: "both",
    privacyPeriod: "range",
    privacyReason: "",
    privacyConfirm: "",
    privacyStep: "",
    privacyError: "",
    waiting: [],
    keys: [{ id: "live", name: "Ecosystem reader", hint: "scf_mtr_9f3a2c1e", revoked: false, scope: "global" }],
    chartFocus: "both",
    webReport: "pages",
    keyScope: "global",
    keyTenant: "alpha",
    apiMetrics: null,
    apiSource: null,
    apiLiveIds: [],
    umami: null,
    umamiLabels: null,
    umamiWhen: null,
    freshKey: "",
    extra: { alpha: { views: 0, paths: {}, api: {} }, beta: { views: 0, paths: {}, api: {} } },
    gateError: "",
    enrollOpen: false,
    enrollId: "",
    enrollName: "",
    enrollStep: "details",
    enrollToken: "",
    enrollResult: "",
    menuOpen: false,
  };
}

export function num(value: number) {
  return Number(value || 0).toLocaleString("en");
}
export function pct(value: number) {
  return (value * 100).toFixed(1) + "%";
}
export function duration(seconds: number) {
  const rounded = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(rounded / 60);
  const rest = rounded % 60;
  return minutes ? minutes + "m " + String(rest).padStart(2, "0") + "s" : rest + "s";
}
export function ms(value: number | null) {
  if (value == null) return "—";
  return value >= 1000 ? (value / 1000).toLocaleString("en", { maximumFractionDigits: 1 }) + " s" : value + " ms";
}
export function nameOf(id: string, sites?: UmamiDirectory | null) {
  return sites?.[id]?.name ?? PROFILES[id]?.name ?? id;
}
export function hueOf(id: string) {
  return PROFILES[id]?.hue ?? "lavender";
}
export function tone(code: number) {
  return code >= 500 ? "bad" : code >= 400 ? "warn" : "ok";
}
function sum<T>(rows: T[], pick: (row: T) => number) {
  return rows.reduce((total, row) => total + pick(row), 0);
}

function seedOf(state: AppState, id: string, salt: number) {
  return ((id === "alpha" ? 101 : 307) + salt * 17 + state.range.length * 13) >>> 0;
}
function wave(seed: number, count: number, total: number) {
  let value = seed >>> 0;
  const next = () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const raw = [];
  for (let index = 0; index < count; index += 1) {
    const cycle = 0.72 + 0.38 * Math.sin((index / count) * Math.PI * (count > 12 ? 6 : 2));
    raw.push(cycle * (0.65 + next() * 0.7));
  }
  const weight = raw.reduce((totalled, item) => totalled + item, 0) || 1;
  const points = raw.map((item) => Math.max(0, Math.round((item / weight) * total)));
  points[points.length - 1] += total - points.reduce((totalled, item) => totalled + item, 0);
  return points;
}
function shareRows(items: { name: string; share: number }[], total: number): Named[] {
  return items.map((item) => ({ name: item.name, count: Math.round(item.share * total) }));
}

function streamOff(state: AppState, id: string, stream: "web" | "api", range: RangeKey) {
  const mark = state.erasure[id];
  if (!mark) return false;
  return mark[stream].all || Boolean(mark[stream].ranges[range]);
}

export function stats(state: AppState, id: string, range: RangeKey = state.range): SiteStats {
  const profile = profileOf(id);
  const extra = state.extra[id] || { views: 0, paths: {}, api: {} };
  const scale = SCALE[range];
  const baseViews = Math.round(profile.pageviews * scale);
  let visitors = Math.round(profile.visitors * scale);
  const bounceShift = range === "24h" ? 0.018 : range === "90d" ? -0.012 : 0;
  const durationShift = range === "24h" ? -8 : range === "7d" ? 4 : 0;
  let bounce = profile.pageviews ? profile.bounce + bounceShift : 0;
  let durationValue = profile.pageviews ? profile.durationSec + durationShift : 0;
  const pages = profile.pages.map((page) => {
    const views = Math.round(page.share * baseViews) + (extra.paths[page.path] || 0);
    const ratio = profile.visitors / profile.pageviews;
    const pageVisitors = Math.min(views, Math.max(1, Math.round(views * ratio * (1.2 - page.bounce))));
    return { ...page, tenantId: id, views, visitors: pageVisitors };
  });
  let views = pages.reduce((total, page) => total + page.views, 0);
  let pageRows: PageRow[] = pages;
  const apiFixture = isPublic(state) ? undefined : state.apiMetrics?.[id];
  const apiLive = Boolean(apiFixture?.live || state.apiLiveIds.includes(id));
  let api: ApiRow[] = apiFixture?.api.map((row) => {
    const key = row.service + "|" + row.route + "|" + row.status;
    const base = apiLive ? apiFixture.apiRequests : Math.round(apiFixture.apiRequests * scale);
    return { ...row, tenantId: id, count: Math.round(row.share * base) + (extra.api[key] || 0) };
  }) ?? [];
  if (streamOff(state, id, "web", range)) {
    views = 0;
    visitors = 0;
    bounce = 0;
    durationValue = 0;
    pageRows = pages.map((page) => ({ ...page, views: 0, visitors: 0 }));
  }
  if (streamOff(state, id, "api", range)) api = api.map((row) => ({ ...row, count: 0 }));
  const requests = sum(api, (row) => row.count);
  const errors = sum(api.filter((row) => row.status >= 500), (row) => row.count);
  const client = sum(api.filter((row) => row.status >= 400 && row.status < 500), (row) => row.count);
  const busiest = api.slice().sort((a, b) => b.count - a.count)[0];
  const slowest = api.slice().sort((a, b) => (b.p95 ?? 0) - (a.p95 ?? 0))[0];
  const built: SiteStats = {
    id,
    views,
    visitors,
    bounce,
    duration: durationValue,
    pages: pageRows,
    api,
    requests,
    errors,
    client,
    errorRate: requests ? errors / requests : 0,
    p50: requests ? (busiest?.p50 ?? null) : null,
    p95: requests ? (slowest?.p95 ?? null) : null,
    seriesViews: wave(seedOf(state, id, 1), POINTS[range], views),
    seriesVisitors: wave(seedOf(state, id, 2), POINTS[range], visitors),
    seriesRequests: wave(seedOf(state, id, 3), POINTS[range], requests),
    referrers: shareRows(profile.referrers, visitors),
    countries: shareRows(profile.countries, visitors),
    devices: shareRows(profile.devices, visitors),
    browsers: shareRows(profile.browsers, visitors),
    os: shareRows(profile.os, visitors),
    delta: { ...profile.delta, requests: apiFixture?.delta.requests ?? 0, errors: apiFixture?.delta.errors ?? 0 },
  };
  const live = range === state.range ? state.umami?.[id] : undefined;
  if (!live) return built;
  const webOff = streamOff(state, id, "web", range);
  const zeros = () => Array.from({ length: live.seriesViews?.length ?? 0 }, () => 0);
  const details = live.details;
  const breakdown = (rows: Named[] = []) => webOff ? [] : rows;
  return {
    ...built,
    views: webOff ? 0 : live.views,
    visitors: webOff ? 0 : live.visitors,
    bounce: webOff ? 0 : live.bounce,
    duration: webOff ? 0 : live.duration,
    pages: webOff ? [] : live.topPages ?? details?.pages ?? [],
    seriesViews: webOff ? zeros() : live.seriesViews ?? [],
    seriesVisitors: webOff ? zeros() : live.seriesVisitors ?? [],
    referrers: breakdown(details?.referrers),
    countries: breakdown(details?.countries),
    devices: breakdown(details?.devices),
    browsers: breakdown(details?.browsers),
    os: breakdown(details?.os),
    delta: {
      ...live.delta,
      requests: built.delta.requests,
      errors: built.delta.errors,
    },
  };
}

export function availableProject(state: AppState, id: string) {
  return Boolean(state.umamiSites && Object.hasOwn(state.umamiSites, id));
}

export function liveSites(state: AppState, ids: string[]) {
  return ids.flatMap((id) => {
    const site = state.umami?.[id];
    return site && !streamOff(state, id, "web", state.range) ? [site] : [];
  });
}

export function webMetricSource(state: AppState, ids: string[]) {
  const live = ids.filter((id) => state.umami?.[id]).length;
  if (!live) return "Sample";
  return live === ids.length ? "Live" : "Live + Sample";
}

export function listingOf(state: AppState, id: string) {
  if (state.removed[id]) return "removed";
  const waiting = state.waiting.find((item) => item.id === id);
  if (waiting) return waiting.status;
  return state.listing[id] || "listed";
}
export function scopeIds(state: AppState) {
  if (state.role === "operator" || state.role === "public") {
    const rosterIds = state.roster?.tenants.map((tenant) => tenant.id) ?? [];
    const ids = new Set([...rosterIds, ...Object.keys(state.umamiSites ?? {})]);
    return [...ids].filter((id) => {
      if (!availableProject(state, id) || state.removed[id]) return false;
      if (!isPublic(state)) return true;
      return listingOf(state, id) === "listed" && (!state.umami || Object.hasOwn(state.umami, id));
    });
  }
  return availableProject(state, state.tenantId) ? [state.tenantId] : [];
}

export function isOperator(state: AppState) {
  return state.role === "operator" || state.mode === "scf";
}

export function isPublic(state: AppState) {
  return state.role === "public" || state.mode === "public";
}
export function merged(state: AppState, ids: string[], key: "referrers" | "countries" | "devices" | "browsers" | "os") {
  const map = new Map<string, number>();
  for (const id of ids) {
    for (const row of stats(state, id)[key]) map.set(row.name, (map.get(row.name) || 0) + row.count);
  }
  return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}
export function headline(state: AppState, ids: string[]) {
  const parts = ids.map((id) => stats(state, id));
  const empty = {
    views: 0, visitors: 0, visits: null as number | null, bounces: null as number | null, requests: 0, errors: 0, client: 0, bounce: 0, duration: 0, p50: null as number | null, p95: null as number | null, errorRate: 0,
    delta: { pageviews: 0, visitors: 0, bounce: 0, duration: 0, requests: 0, errors: 0 },
  };
  if (!parts.length) return empty;
  const views = sum(parts, (part) => part.views);
  const visitors = sum(parts, (part) => part.visitors);
  const requests = sum(parts, (part) => part.requests);
  const errors = sum(parts, (part) => part.errors);
  const client = sum(parts, (part) => part.client);
  const live = liveSites(state, ids);
  const visits = live.length === ids.length ? sum(live, (site) => site.visits) : null;
  const bounces = visits == null ? null : sum(live, (site) => site.bounces);
  const bounce = visits == null
    ? views ? sum(parts, (part) => part.bounce * part.views) / views : 0
    : visits ? (bounces ?? 0) / visits : 0;
  const visit = visits == null
    ? visitors ? sum(parts, (part) => part.duration * part.visitors) / visitors : 0
    : visits ? sum(live, (site) => site.duration * site.visits) / visits : 0;
  const p95 = Math.max(...parts.map((part) => part.p95 ?? 0));
  const p50 = parts.slice().sort((a, b) => b.requests - a.requests)[0]?.p50 ?? null;
  const blend = (key: keyof SiteStats["delta"]) => {
    if (parts.length === 1) return parts[0].delta[key];
    const weight = sum(parts, (part) => part.views) || 1;
    return sum(parts, (part) => part.delta[key] * part.views) / weight;
  };
  return {
    views, visitors, visits, bounces, requests, errors, client, bounce, duration: visit, p50, p95,
    errorRate: requests ? errors / requests : 0,
    delta: { pageviews: blend("pageviews"), visitors: blend("visitors"), bounce: blend("bounce"), duration: blend("duration"), requests: blend("requests"), errors: blend("errors") },
  };
}
export function priorValue(value: number, delta: number) {
  if (!Number.isFinite(delta) || delta <= -1) return 0;
  return value / (1 + delta);
}
export function dayLabels(state: AppState) {
  if (state.umamiLabels?.length) {
    const labels = state.umamiLabels;
    const step = labels.length > 16 ? Math.ceil(labels.length / 6) : 1;
    return labels.map((label, index) => (index % step === 0 || index === labels.length - 1 ? label : ""));
  }
  const count = POINTS[state.range];
  if (state.range === "24h") return Array.from({ length: count }, (_, index) => (index % 6 === 0 ? String(index).padStart(2, "0") + ":00" : ""));
  const span = state.range === "7d" ? 6 : state.range === "30d" ? 29 : 89;
  const step = count > 14 ? 5 : 1;
  return Array.from({ length: count }, (_, index) => {
    if (index % step !== 0 && index !== count - 1) return "";
    const date = new Date(DEMO_END);
    date.setUTCDate(DEMO_END.getUTCDate() - (span - Math.round((span * index) / (count - 1))));
    return date.toLocaleDateString("en", { month: "short", day: "numeric", timeZone: "UTC" });
  });
}
export function windowLabel(state: AppState) {
  if (state.umami) return RANGE_LABELS[state.range] + " · UTC";
  const end = new Date(DEMO_END);
  const back = state.range === "24h" ? 0 : state.range === "7d" ? 6 : state.range === "30d" ? 29 : 89;
  const start = new Date(end);
  start.setUTCDate(end.getUTCDate() - back);
  const fmt = (date: Date) => date.toISOString().slice(0, 10);
  return back === 0 ? fmt(end) : fmt(start) + " → " + fmt(end);
}
export function addSeries(state: AppState, ids: string[], key: "seriesViews" | "seriesVisitors" | "seriesRequests") {
  const series = ids.map((id) => stats(state, id)[key]);
  if (!series.length || !series[0]) return [];
  return series[0].map((_, index) => series.reduce((total, values) => total + (values[index] || 0), 0));
}
function ordinal(day: number) {
  const teen = day % 100;
  const suffix = teen >= 11 && teen <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[day % 10] || "th";
  return day + suffix;
}
export function pointWhen(state: AppState, index: number, count: number) {
  if (state.umamiWhen?.[index]) return state.umamiWhen[index];
  const date = new Date(DEMO_END);
  if (state.range === "24h") {
    date.setUTCHours(index, 0, 0, 0);
    return date.toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC" });
  }
  const span = state.range === "7d" ? 6 : state.range === "30d" ? 29 : 89;
  date.setUTCDate(DEMO_END.getUTCDate() - (span - Math.round((span * index) / Math.max(count - 1, 1))));
  const weekday = date.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
  const month = date.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });
  return weekday + ", " + month + " " + ordinal(date.getUTCDate()) + ", " + date.getUTCFullYear();
}
export function band(seed: number, count: number, center: number, spread: number) {
  return Array.from({ length: count }, (_, index) => {
    const wobble = Math.sin((index + seed) * 0.7) * 0.62 + Math.sin((index + 2) * 0.27) * 0.38;
    return Math.max(0, center + wobble * spread);
  });
}
export function categoryRows(state: AppState, ids: string[], metric: string): { name: string; count: number; bounce?: number; duration?: number }[] {
  if (!ids.length) return [];
  if (metric === "pages") {
    return ids
      .flatMap((id) =>
        stats(state, id).pages.map((page) => ({
          name: ids.length > 1 ? nameOf(id, state.umamiSites) + " · " + page.path : page.path,
          count: page.views,
          bounce: page.bounce,
          duration: page.duration,
        })),
      )
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }
  const key = (metric === "status" ? "countries" : metric) as "referrers" | "countries" | "devices" | "browsers" | "os";
  return merged(state, ids, key);
}
export function previewPath(input: string) {
  const account = /^G[A-Z2-7]{55}$/;
  const contract = /^C[A-Z2-7]{55}$/;
  const muxed = /^M[A-Z2-7]{68}$/;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const numeric = /^\d+$/;
  const hex = /^(?:0x[0-9a-f]{16,}|[0-9a-f]{32,})$/i;
  const path = (input.split("#")[0] ?? "").split("?")[0] ?? "";
  const segments = path
    .split("/")
    .filter((part) => part.length > 0)
    .map((part) => {
      if (muxed.test(part)) return ":muxed";
      if (contract.test(part)) return ":contract";
      if (account.test(part)) return ":account";
      if (uuid.test(part)) return ":uuid";
      if (numeric.test(part)) return ":id";
      if (hex.test(part)) return ":hash";
      return part;
    });
  if (segments.length === 0) return "/";
  return (path.startsWith("/") ? "/" : "") + segments.join("/");
}
export function privacyTargets(state: AppState) {
  const ids = state.role === "operator" ? Object.keys(state.umamiSites ?? {}) : [state.tenantId];
  return ids.filter((id) => availableProject(state, id) && !state.removed[id]);
}
export function erasureImpact(state: AppState, id: string, action: string, stream: string, period: string) {
  const data = stats(state, id, action === "remove" || period === "all" ? "90d" : state.range);
  const web = action === "remove" || stream !== "api";
  const api = action === "remove" || stream !== "web";
  return { visitors: web ? data.visitors : 0, views: web ? data.views : 0, requests: api ? data.requests : 0 };
}
export function visibleApi(state: AppState, ids: string[]) {
  return ids
    .flatMap((id) => stats(state, id).api)
    .filter((row) => state.project === "all" || row.tenantId === state.project)
    .filter((row) => {
      if (state.status === "2xx") return row.status >= 200 && row.status < 300;
      if (state.status === "4xx") return row.status >= 400 && row.status < 500;
      if (state.status === "5xx") return row.status >= 500;
      return true;
    })
    .sort((a, b) => {
      if (state.sort === "p95") return (b.p95 ?? -1) - (a.p95 ?? -1) || b.count - a.count;
      if (state.sort === "status") return a.status - b.status || b.count - a.count;
      return b.count - a.count || a.route.localeCompare(b.route);
    });
}
export function seedOfPublic(state: AppState, id: string, salt: number) {
  return seedOf(state, id, salt);
}
export function pointsFor(range: RangeKey) {
  return POINTS[range];
}
