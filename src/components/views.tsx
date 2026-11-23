"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CountryMap } from "@/components/CountryMap";
import { ProjectIcon } from "@/components/ProjectIcon";
import { Bars, Donut, GroupedChart, Stack, type ChartSeries } from "@/components/charts";
import {
  ACCOUNT,
  METRICS,
  WEB_REPORTS,
  PIE,
  PRIOR,
  PROFILES,
  UMAMI_PROJECT_DOMAINS,
  profileOf,
  RANGE_LABELS,
  WEB_VITALS,
  liveSites,
  SNIPPET,
  addSeries,
  categoryRows,
  dayLabels,
  duration,
  erasureImpact,
  headline,
  isPublic,
  listingOf,
  ms,
  nameOf,
  num,
  pct,
  pointWhen,
  previewPath,
  privacyTargets,
  scopeIds,
  seedOfPublic,
  stats,
  tone,
  visibleApi,
  windowLabel,
  webMetricSource,
  type AppState,
  type DetailView,
  type Named,
  type RangeKey,
} from "@/lib/model";

function Change({ value, goodWhenUp, range }: { value: number; goodWhenUp: boolean; range: RangeKey }) {
  if (!Number.isFinite(value) || Math.abs(value) < 0.0005) return <span className="quiet">Selected range</span>;
  const up = value >= 0;
  const good = goodWhenUp ? up : !up;
  return (
    <>
      <span className={good ? "up" : "down"}>
        {up ? "↑ " : "↓ "}
        {Math.abs(value * 100).toFixed(1)}%
      </span>{" "}
      vs {PRIOR[range]}
    </>
  );
}

function SourceBadge({ source }: { source: string }) {
  const live = source === "Live" || source === "Umami" || source === "Live data" || source.startsWith("Live");
  return <span className={"kpi-badge" + (live ? " live" : "")}>{source}</span>;
}

function apiBadge(state: AppState, long = false) {
  if (state.apiSource === "collector") return long ? "Live data" : "Live";
  if (state.apiSource === "mixed") return long ? "Live + sample" : "Live + Sample";
  return long ? "Sample data" : "Sample";
}

function apiBadgeLive(state: AppState) {
  return state.apiSource === "collector" || state.apiSource === "mixed";
}

function Kpi({
  label,
  value,
  hint,
  icon,
  badge,
  active,
  onSelect,
}: {
  label: string;
  value: string;
  hint: ReactNode;
  icon?: ReactNode;
  badge?: string;
  active?: boolean;
  onSelect?: () => void;
}) {
  const body = (
    <>
      <div className="kpi-top">
        <p className="label">{label}</p>
        <span className="kpi-meta">
          {badge ? <SourceBadge source={badge} /> : null}
          {icon}
        </span>
      </div>
      <p className="value">{value}</p>
      {hint ? <p className="hint">{hint}</p> : null}
    </>
  );
  if (onSelect) {
    return (
      <button type="button" className={"kpi selectable" + (active ? " on" : "")} aria-pressed={active} onClick={onSelect}>
        {body}
      </button>
    );
  }
  return <article className="kpi">{body}</article>;
}

const visitorIcon = (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <circle cx="8" cy="5.5" r="2.2" fill="none" stroke="currentColor" />
    <path d="M3.5 13.2c.7-2.2 2.4-3.3 4.5-3.3s3.8 1.1 4.5 3.3" fill="none" stroke="currentColor" />
  </svg>
);
const viewsIcon = (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <circle cx="8" cy="8" r="5.2" fill="none" stroke="currentColor" />
    <path d="M3 8h10" fill="none" stroke="currentColor" />
  </svg>
);
const apiIcon = (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M2 12.5 6 8l2.2 2.2L14 4" fill="none" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);
const latencyIcon = (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M3 13V7M8 13V3M13 13V9" fill="none" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);

function chartProps(state: AppState, series: ChartSeries[]) {
  const count = series[0]?.values.length ?? 0;
  const labels = dayLabels(state);
  const aligned = labels.length === count ? labels : Array.from({ length: count }, (_, index) => labels[index] || "");
  const whens = Array.from({ length: count }, (_, index) => pointWhen(state, index, count));
  return { labels: aligned, whens };
}

const PRIVACY_LINE =
  "Live web reports use aggregate Umami metrics. Geographic reporting is limited to the country level. The data erasure controls demonstrate the proposed workflow.";

function PrivacyCard() {
  return (
    <section className="panel privacy-card">
      <svg width="22" height="22" viewBox="0 0 18 18" aria-hidden="true">
        <path d="M9 2.2 15.5 5v4.2c0 3.4-2.6 5.6-6.5 6.6-3.9-1-6.5-3.2-6.5-6.6V5Z" fill="none" stroke="#d4c4ff" strokeWidth="1.3" />
      </svg>
      <h2>Privacy by design</h2>
      <p className="quiet">{PRIVACY_LINE}</p>
    </section>
  );
}

function PrivacyNote() {
  return (
    <p className="caption privacy-note">
      <strong>Privacy by design.</strong> {PRIVACY_LINE}
    </p>
  );
}

function Freshness({ state }: { state: AppState }) {
  const ids = scopeIds(state);
  const source = webMetricSource(state, ids);
  const alternateProjects = ids.filter((id) => state.umami?.[id]?.details?.alternateDomain);
  const showSource = state.view !== "web" || source !== "Live";
  if (!showSource && !alternateProjects.length) return null;
  return (
    <p className="freshness">
      {showSource ? <span className={source === "Live" ? "live" : ""}>{source === "Live"
        ? "Web · Umami synced" : source === "Sample" ? "Web · sample" : "Web · live and sample"}</span> : null}
      {state.view === "overview" && !isPublic(state) && state.apiMetrics ? (
        <span className={apiBadgeLive(state) ? "live" : ""}>
          {state.apiSource === "collector" ? "API · live collector"
            : state.apiSource === "mixed" ? "API · live and sample"
            : "API · sample"}
        </span>
      ) : null}
      {alternateProjects.map((id) => <span key={id}>{nameOf(id, state.umamiSites)} · Umami data from a different domain</span>)}
    </p>
  );
}

function webHeadline(state: AppState, ids: string[], data: ReturnType<typeof headline>) {
  if (liveSites(state, ids).length || !state.metric || !state.slice || !METRICS[state.metric]) return data;
  const rows = categoryRows(state, ids, state.metric);
  const chosen = rows.find((row) => row.name === state.slice);
  if (!chosen) return data;
  const total = rows.reduce((summed, row) => summed + row.count, 0) || 1;
  const share = chosen.count / total;
  const views = state.metric === "pages" ? chosen.count : Math.max(1, Math.round(data.views * share));
  const visitors =
    state.metric === "pages"
      ? Math.min(views, Math.max(1, Math.round(views * (data.visitors / Math.max(data.views, 1)))))
      : Math.max(1, Math.round(data.visitors * share));
  return {
    ...data,
    views,
    visitors,
    bounce: chosen.bounce ?? data.bounce,
    duration: chosen.duration ?? data.duration,
  };
}

function pinDay(state: AppState, bump: () => void, source: "web" | "api") {
  return (index: number | null) => {
    if (index == null) {
      if (state.detail?.kind === "day") state.detail = null;
    } else {
      state.detail = { kind: "day", index, source };
    }
    bump();
  };
}

function openApiDetail(
  state: AppState,
  row: { tenantId: string; route: string; service: string; status: number },
  bump: () => void,
) {
  state.detail = { kind: "api", tenantId: row.tenantId, route: row.route, service: row.service, status: row.status };
  bump();
}

function Activity({ state, ids, bump }: { state: AppState; ids: string[]; bump: () => void }) {
  if (!ids.length) {
    return (
      <section className="panel" style={{ marginTop: 12 }}>
        <h2>No listed projects</h2>
        <p className="quiet">List a project in SCF managing to show it here.</p>
      </section>
    );
  }
  const focus = state.chartFocus;
  const publicMode = isPublic(state);
  const periodOnly = publicMode || Boolean(state.umami && ids.some((id) => !state.umami?.[id]?.seriesViews?.length));
  const data = headline(state, ids);
  const series: ChartSeries[] = [];
  if (focus !== "views") series.push({
    name: "Visitors", values: periodOnly ? [data.visitors] : addSeries(state, ids, "seriesVisitors"), color: "#f0a090",
  });
  if (focus !== "visitors") series.push({
    name: "Views", values: periodOnly ? [data.views] : addSeries(state, ids, "seriesViews"), color: "#d4c4ff",
  });
  const title = "Web activity";
  const period = RANGE_LABELS[state.range];
  const dateLabels = periodOnly ? { labels: [period], whens: [period] } : chartProps(state, series);
  return (
    <section className="panel" style={{ marginTop: 12 }}>
      <div className="panel-head">
        <div>
          <h2>{title}</h2>
          <p>
            {periodOnly
              ? publicMode ? "Totals for the selected period." : "Activity over time is unavailable for this scope. Showing period totals."
              : state.range === "24h" ? "Select an hour to inspect its activity." : "Select a day to inspect its activity."}
          </p>
        </div>
        <SourceBadge source={webMetricSource(state, ids)} />
      </div>
      <div className={periodOnly ? "activity-period" : undefined}>
        <GroupedChart series={series} label={title} {...dateLabels} onPin={periodOnly ? undefined : pinDay(state, bump, "web")} />
      </div>
    </section>
  );
}

function SecondaryStats({ ids, data, webSource }: { ids: string[]; data: ReturnType<typeof headline>; webSource: string }) {
  if (!ids.length) return null;
  return (
    <section className="secondary-stats slim">
      <div>
        <p className="metric-label"><span>Bounce rate</span><SourceBadge source={webSource} /></p>
        <strong>{pct(data.bounce)}</strong>
      </div>
      <div>
        <p className="metric-label"><span>Visit duration</span><SourceBadge source={webSource} /></p>
        <strong>{duration(data.duration)}</strong>
      </div>
      <div>
        <p className="metric-label"><span>{data.visits == null ? "Average views per visitor" : "Average views per visit"}</span><SourceBadge source={webSource} /></p>
        <strong>{(data.visits ?? data.visitors) > 0 ? (data.views / (data.visits ?? data.visitors)).toFixed(1) : "—"}</strong>
      </div>
      <div>
        <p className="metric-label"><span>Listed projects</span><SourceBadge source="Workspace" /></p>
        <strong>{ids.length}</strong>
      </div>
    </section>
  );
}

function ApiCurve({ state, ids, bump }: { state: AppState; ids: string[]; bump: () => void }) {
  if (!ids.length) return null;
  const series: ChartSeries[] =
    ids.length === 1
      ? [{ name: "API requests", values: stats(state, ids[0]).seriesRequests, color: "#d4c4ff" }]
      : ids.map((id) => ({ name: nameOf(id, state.umamiSites), values: stats(state, id).seriesRequests, color: id === "alpha" ? "#d4c4ff" : "#f0a090" }));
  return (
    <section className="panel" style={{ marginTop: 12 }}>
      <div className="panel-head">
        <div>
          <h2>API volume</h2>
          <p>Requests per {state.range === "24h" ? "hour" : "day"} · pin a day to inspect.</p>
        </div>
        <span className={"badge" + ((apiBadgeLive(state) ? " live" : ""))}>{apiBadge(state, true)}</span>
      </div>
      <GroupedChart series={series} label="API requests" {...chartProps(state, series)} onPin={pinDay(state, bump, "api")} />
    </section>
  );
}

function ProjectTable({ state, ids, bump, onOpen }: { state: AppState; ids: string[]; bump: () => void; onOpen: (id: string) => void }) {
  const privateMode = !isPublic(state);
  const showApi = privateMode && Boolean(state.apiMetrics);
  const sort = showApi ? state.projectSort : state.projectSort === "name" ? "name" : "visitors";
  const query = state.projectQuery.trim().toLowerCase();
  let rows = ids.map((id) => ({ id, meta: profileOf(id, state.umamiSites), data: stats(state, id) }));
  if (query) rows = rows.filter((row) => (row.meta.name + " " + (row.meta.domain || row.meta.detail)).toLowerCase().includes(query));
  rows.sort((a, b) => {
    if (sort === "visitors") return b.data.visitors - a.data.visitors;
    if (sort === "errors") return b.data.errorRate - a.data.errorRate;
    if (sort === "p95") return (b.data.p95 || 0) - (a.data.p95 || 0);
    if (sort === "name") return a.meta.name.localeCompare(b.meta.name);
    return b.data.requests - a.data.requests;
  });
  return (
    <section className="panel" style={{ marginTop: 12 }}>
      <div className="panel-head">
        <div>
          <h2>Ecosystem projects</h2>
        </div>
        <span className="count">{rows.length}</span>
      </div>
      {ids.length > 1 ? (
        <div className="table-tools">
          <input
            type="search"
            placeholder="Search projects…"
            value={state.projectQuery}
            aria-label="Search projects"
            onChange={(event) => {
              state.projectQuery = event.target.value;
              bump();
            }}
          />
          <select
            aria-label="Sort projects"
            value={sort}
            onChange={(event) => {
              state.projectSort = event.target.value;
              bump();
            }}
          >
            {showApi ? <option value="requests">API requests ↓</option> : null}
            <option value="visitors">Visitors ↓</option>
            {showApi ? <option value="errors">Error rate ↓</option> : null}
            {showApi ? <option value="p95">p95 ↓</option> : null}
            <option value="name">Name A–Z</option>
          </select>
        </div>
      ) : null}
      <div className="table-wrap">
        <table className="project-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Visitors</th>
              <th>Views</th>
              <th>Web source</th>
              {showApi ? (
                <>
                  <th>API <SourceBadge source={apiBadge(state)} /></th>
                  <th>Errors <SourceBadge source={apiBadge(state)} /></th>
                  <th>p95 <SourceBadge source={apiBadge(state)} /></th>
                </>
              ) : null}
              {privateMode ? <th /> : null}
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <span className="who">
                      <ProjectIcon id={row.id} name={row.meta.name} />
                      <span>
                        <strong>{row.meta.name}</strong>
                        <span className="quiet">{row.meta.domain || row.meta.detail}</span>
                      </span>
                    </span>
                  </td>
                  <td className="num">{num(row.data.visitors)}</td>
                  <td className="num">{num(row.data.views)}</td>
                  <td><SourceBadge source={webMetricSource(state, [row.id])} /></td>
                  {showApi ? (
                    <>
                      <td className="num">{num(row.data.requests)}</td>
                      <td className="num">{pct(row.data.errorRate)}</td>
                      <td className="num">{ms(row.data.p95)}</td>
                    </>
                  ) : null}
                  {privateMode ? (
                    <td>
                      {state.roster?.tenants.some((tenant) => tenant.id === row.id) ? (
                        <button className="ghost" type="button" onClick={() => onOpen(row.id)}>
                          Open as tenant
                        </button>
                      ) : null}
                    </td>
                  ) : null}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4 + (showApi ? 3 : 0) + Number(privateMode)}>No project matches.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ProjectRollout({ state, ids }: { state: AppState; ids: string[] }) {
  if (state.role !== "operator" || !ids.length) return null;
  const projects = ids.map((id) => ({ id, name: nameOf(id, state.umamiSites) }));
  return (
    <section className="panel project-rollout">
      <div className="panel-head">
        <div>
          <h2>Project rollout</h2>
          <p>Each segment represents one project.</p>
        </div>
      </div>
      <div className="project-rollout-body">
        <Donut rows={projects.map(({ id, name }) => ({ id, name, count: 1 }))} colors={PIE} label="Projects with recorded pageviews" large />
        <ul aria-label="Projects with recorded pageviews">
          {projects.map(({ id, name }, index) => (
            <li key={id}>
              <i className="swatch" style={{ background: PIE[index % PIE.length] }} aria-hidden="true" />
              <span><strong>{name}</strong></span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function WebBreakdownTable({ state, ids, bump }: { state: AppState; ids: string[]; bump: () => void }) {
  const report = state.webReport;
  const [country, setCountry] = useState<string | null>(null);
  const sampleState = { ...state, umami: null };
  const sites = liveSites(state, ids);
  const pages = report === "pages";
  const showProject = pages && ids.length > 1;
  const available = sites.length > 0 && sites.every((site) => pages ? site.topPages != null : site.audience?.[report] != null);
  const pageRows = pages
    ? ids.flatMap((id) => {
      const live = state.umami?.[id];
      if (available && live?.topPages == null) return [];
      return stats(available ? state : sampleState, id).pages;
    }).filter((row) => row.views > 0).sort((a, b) => b.views - a.views)
    : [];
  const counts = new Map<string, Named>();
  if (available && !pages) {
    for (const site of sites) {
      for (const row of site.audience?.[report] ?? []) {
        const key = row.code ?? row.name;
        counts.set(key, { ...row, count: (counts.get(key)?.count ?? 0) + row.count });
      }
    }
  }
  const rows: Named[] = pages ? [] : available
    ? [...counts.values()].sort((a, b) => b.count - a.count)
    : categoryRows(sampleState, ids, report).filter((row) => row.count > 0);

  function filterSample(name: string | null) {
    if (state.umami) return;
    const enabled = name !== null && (state.metric !== report || state.slice !== name);
    state.metric = enabled ? report : "";
    state.slice = enabled ? name : "";
    bump();
  }

  function selectCountry(key: string | null) {
    setCountry(key);
    filterSample(rows.find((row) => (row.code ?? row.name) === key)?.name ?? null);
  }

  return (
    <section className="panel web-breakdowns web-report-table">
      <div className="panel-head">
        <h2>Web breakdowns</h2>
        {available ? null : <span className="badge">Sample</span>}
      </div>
      <div className="soft-tabs" role="group" aria-label="Web report">
        {WEB_REPORTS.map((metric) => (
          <button key={metric} type="button" aria-pressed={metric === report} onClick={() => {
            state.webReport = metric;
            setCountry(null);
            if (state.metric && state.metric !== metric) {
              state.metric = "";
              state.slice = "";
            }
            bump();
          }}>{METRICS[metric]}</button>
        ))}
      </div>
      {!available && sites.length > 0 ? (
        <p className="caption">Umami data is unavailable for this report. Showing sample data.</p>
      ) : null}
      {report === "countries" ? (
        <>
          <p className="caption">To protect visitor privacy, geographic data is available only at country level.</p>
          <CountryMap rows={rows} selected={country} onSelect={selectCountry} />
        </>
      ) : null}
      <div className="table-wrap">
        <table aria-label={METRICS[report]}>
          <thead>
            {pages ? (
              <tr>
                <th>Path</th>
                {showProject ? <th>Project</th> : null}
                <th>Views</th>
                <th>Visitors</th>
                <th>Visits</th>
                <th>Bounce rate</th>
                <th>Average visit duration</th>
              </tr>
            ) : (
              <tr><th>{METRICS[report]}</th><th>Visitors</th></tr>
            )}
          </thead>
          <tbody>
            {pages ? pageRows.map((row) => (
              <tr key={row.tenantId + row.path}>
                <td><button className="report-link mono" type="button" onClick={() => {
                  filterSample(ids.length > 1 ? nameOf(row.tenantId, state.umamiSites) + " · " + row.path : row.path);
                  state.detail = { kind: "path", tenantId: row.tenantId, path: row.path, sample: !available };
                  bump();
                }}>{row.path}</button></td>
                {showProject ? <td><span className="who"><ProjectIcon id={row.tenantId} compact />{nameOf(row.tenantId, state.umamiSites)}</span></td> : null}
                <td className="num">{num(row.views)}</td>
                <td className="num">{row.visitors == null ? "—" : num(row.visitors)}</td>
                <td className="num">{row.visits == null ? "—" : num(row.visits)}</td>
                <td className="num">{row.bounce == null ? "—" : pct(row.bounce)}</td>
                <td className="num">{row.duration == null ? "—" : duration(row.duration)}</td>
              </tr>
            )) : rows.map((row) => {
              const key = row.code ?? row.name;
              return (
                <tr key={key} className={report === "countries" && country === key ? "row-on" : undefined}>
                  <td>{report === "countries" ? (
                    <button type="button" className="report-link" aria-pressed={country === key}
                      onClick={() => selectCountry(country === key ? null : key)}>{row.name}</button>
                  ) : !state.umami ? (
                    <button type="button" className="report-link" onClick={() => filterSample(row.name)}>{row.name}</button>
                  ) : row.name}</td>
                  <td className="num">{num(row.count)}</td>
                </tr>
              );
            })}
            {(pages ? pageRows.length === 0 : rows.length === 0) ? (
              <tr><td colSpan={pages ? 6 + Number(showProject) : 2}>No data for this period.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function WebPerformance({ state, ids }: { state: AppState; ids: string[] }) {
  const rows = ids.flatMap((id) => liveSites(state, [id]).flatMap((site) => {
    const report = site.details?.performance;
    if (!report?.count) return [];
    return (Object.entries(WEB_VITALS) as [keyof typeof WEB_VITALS, string][]).flatMap(([metric, label]) => {
      const value = report[metric];
      return value ? [{ id, label, metric, value }] : [];
    });
  }));
  return (
    <section className="panel" style={{ marginTop: 12 }}>
      <div className="panel-head"><h2>Web performance</h2></div>
      {rows.length ? (
        <div className="table-wrap">
          <table>
            <thead><tr>{ids.length > 1 ? <th>Project</th> : null}<th>Metric</th><th>p50</th><th>p75</th><th>p95</th></tr></thead>
            <tbody>
              {rows.map(({ id, label, metric, value }) => (
                <tr key={id + metric}>
                  {ids.length > 1 ? <td>{nameOf(id, state.umamiSites)}</td> : null}
                  <th scope="row">{label} ({metric.toUpperCase()})</th>
                  {[value.p50, value.p75, value.p95].map((measurement, index) => (
                    <td className="num" key={index}>{metric === "cls" ? measurement.toFixed(3) : ms(measurement)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="empty">No performance measurements available for this period.</p>}
    </section>
  );
}

function FilterChip({ state, bump }: { state: AppState; bump: () => void }) {
  if (!state.metric || !state.slice || !METRICS[state.metric]) return null;
  return (
    <div className="filter-chip">
      <span>
        Filtered by <strong>{METRICS[state.metric]}</strong> · {state.slice}
        <em> · KPIs and chart scaled</em>
      </span>
      <button
        className="ghost"
        type="button"
        onClick={() => {
          state.metric = "";
          state.slice = "";
          bump();
        }}
      >
        Clear
      </button>
    </div>
  );
}

function ApiFilterChip({ state, bump, projects }: { state: AppState; bump: () => void; projects: boolean }) {
  const narrowed = state.status !== "all" || (projects && state.project !== "all");
  if (!narrowed) return null;
  return (
    <div className="filter-chip">
      <span>
        Table filtered
        {state.status !== "all" ? (
          <>
            {" "}
            · status <strong>{state.status}</strong>
          </>
        ) : null}
        {projects && state.project !== "all" ? (
          <>
            {" "}
            · <strong>{nameOf(state.project, state.umamiSites)}</strong>
          </>
        ) : null}
      </span>
      <button
        className="ghost"
        type="button"
        onClick={() => {
          state.status = "all";
          state.project = "all";
          bump();
        }}
      >
        Clear
      </button>
    </div>
  );
}

function MetricBoard({ state, ids, bump }: { state: AppState; ids: string[]; bump: () => void }) {
  if (!ids.length) return <Activity state={state} ids={ids} bump={bump} />;
  if (liveSites(state, ids).length || !state.metric || !METRICS[state.metric] || !state.slice) {
    return (
      <>
        <Activity state={state} ids={ids} bump={bump} />
      </>
    );
  }
  const rows = categoryRows(state, ids, state.metric);
  const chosen = rows.find((row) => row.name === state.slice) || rows[0];
  if (!chosen) return <Activity state={state} ids={ids} bump={bump} />;
  const total = rows.reduce((summed, row) => summed + row.count, 0) || 1;
  const color = PIE[Math.max(0, rows.indexOf(chosen)) % PIE.length];
  const count = stats(state, ids[0]).seriesViews.length || 30;
  const share = chosen.count / total;
  const baseVisitors = addSeries(state, ids, "seriesVisitors").map((value) => Math.max(0, Math.round(value * share)));
  const baseViews = addSeries(state, ids, "seriesViews").map((value) => Math.max(0, Math.round(value * share)));
  const series: ChartSeries[] =
    state.chartFocus === "visitors"
      ? [{ name: chosen.name, values: baseVisitors, color }]
      : state.chartFocus === "views"
        ? [{ name: chosen.name, values: baseViews.length ? baseViews : waveCount(seedOfPublic(state, ids[0], chosen.name.length + 4), count, chosen.count), color }]
        : [
            { name: "Visitors", values: baseVisitors, color: "#f0a090" },
            { name: "Views", values: baseViews, color },
          ];
  return (
    <section className="panel" style={{ marginTop: 12 }}>
      <div className="panel-head">
        <div>
          <h2>{chosen.name}</h2>
          <p>
            {METRICS[state.metric]} filter · {num(chosen.count)} · {pct(share)} of this breakdown. Chart scaled to the filter share.
          </p>
        </div>
        <button
          className="ghost"
          type="button"
          onClick={() => {
            state.metric = "";
            state.slice = "";
            bump();
          }}
        >
          Clear filter
        </button>
      </div>
      <GroupedChart series={series} label={chosen.name} {...chartProps(state, series)} onPin={pinDay(state, bump, "web")} />
    </section>
  );
}

function waveCount(seed: number, count: number, total: number) {
  let value = seed >>> 0;
  const next = () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const raw = [];
  for (let index = 0; index < count; index += 1) {
    const cycle = 0.72 + 0.38 * Math.sin((index / Math.max(count, 1)) * Math.PI * (count > 12 ? 6 : 2));
    raw.push(cycle * (0.65 + next() * 0.7));
  }
  const weight = raw.reduce((summed, item) => summed + item, 0) || 1;
  const points = raw.map((item) => Math.max(0, Math.round((item / weight) * total)));
  if (points.length) points[points.length - 1] += total - points.reduce((summed, item) => summed + item, 0);
  return points;
}

function Filters({ state, ids, projects, bump }: { state: AppState; ids: string[]; projects: boolean; bump: () => void }) {
  return (
    <div className="filters">
      {projects
        ? ["all", ...ids].map((value) => (
            <button key={value} type="button" aria-pressed={state.project === value} onClick={() => { state.project = value; bump(); }}>
              {value === "all" ? "All projects" : nameOf(value, state.umamiSites)}
            </button>
          ))
        : null}
      {["all", "2xx", "4xx", "5xx"].map((value) => (
        <button key={value} type="button" aria-pressed={state.status === value} onClick={() => { state.status = value; bump(); }}>
          {value === "all" ? "All statuses" : value}
        </button>
      ))}
    </div>
  );
}

function ApiTable({ state, rows, showProject, bump }: { state: AppState; rows: ReturnType<typeof visibleApi>; showProject: boolean; bump: () => void }) {
  if (!rows.length) return <p className="empty">Nothing matches this filter.</p>;
  return (
    <>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {showProject ? <th>Project</th> : null}
              <th>Service</th>
              <th>Route</th>
              <th>Status</th>
              <th>
                <button type="button" aria-pressed={state.sort === "requests"} onClick={() => { state.sort = "requests"; bump(); }}>
                  Requests
                </button>
              </th>
              <th>p50</th>
              <th>
                <button type="button" aria-pressed={state.sort === "p95"} onClick={() => { state.sort = "p95"; bump(); }}>
                  p95
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.tenantId + row.route + row.status + index}
                className={
                  state.detail?.kind === "api" &&
                  state.detail.tenantId === row.tenantId &&
                  state.detail.route === row.route &&
                  state.detail.status === row.status
                    ? "row-on"
                    : undefined
                }
                style={{ cursor: "pointer" }}
                onClick={() => openApiDetail(state, row, bump)}
              >
                {showProject ? (
                  <td>
                    <span className="who">
                      <ProjectIcon id={row.tenantId} compact />
                      {nameOf(row.tenantId, state.umamiSites)}
                    </span>
                  </td>
                ) : null}
                <td>{row.service}</td>
                <td>
                  <code>{row.route}</code>
                </td>
                <td>
                  <span className={"pill " + tone(row.status)}>{row.status}</span>
                </td>
                <td className="num">{num(row.count)}</td>
                <td className="num">{ms(row.p50)}</td>
                <td className="num">{ms(row.p95)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="caption">p50 and p95 are the histogram bucket ceiling, so a 40 ms call is reported as 50 ms.</p>
    </>
  );
}

function statusTone(status: string) {
  const map: Record<string, [string, string]> = { listed: ["ok", "Listed"], hidden: ["warn", "Enrolled"], pending: ["warn", "Pending"], removed: ["bad", "Removed"] };
  return map[status] || map.hidden;
}

function closeDetail(state: AppState, bump: () => void) {
  state.detail = null;
  bump();
}

function DetailSheet({ state, ids, bump }: { state: AppState; ids: string[]; bump: () => void }) {
  const detail = state.detail;
  useEffect(() => {
    if (!detail) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        state.detail = null;
        bump();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [detail, state, bump]);
  if (!detail) return null;
  return (
    <div className="detail-overlay" onClick={(event) => { if (event.target === event.currentTarget) closeDetail(state, bump); }}>
      <aside className="detail-sheet panel" role="dialog" aria-modal="true" aria-label="Detail">
        <div className="detail-head">
          <button className="ghost" type="button" onClick={() => closeDetail(state, bump)}>
            Close
          </button>
        </div>
        {detail.kind === "path" ? <PathDetail state={state} detail={detail} bump={bump} /> : null}
        {detail.kind === "api" ? <ApiDetail state={state} detail={detail} bump={bump} /> : null}
        {detail.kind === "day" ? <DayDetail state={state} ids={ids} detail={detail} bump={bump} /> : null}
      </aside>
    </div>
  );
}

function PathDetail({
  state,
  detail,
  bump,
}: {
  state: AppState;
  detail: Extract<DetailView, { kind: "path" }>;
  bump: () => void;
}) {
  const report = state.umami?.[detail.tenantId];
  const live = !detail.sample && Boolean(report?.topPages ?? report?.details?.pages);
  const site = stats(live ? state : { ...state, umami: null }, detail.tenantId);
  const page = site.pages.find((row) => row.path === detail.path);
  if (!page) {
    return (
      <>
        <h2>Path not found</h2>
        <p className="quiet">This path is unavailable for {nameOf(detail.tenantId, state.umamiSites)}.</p>
      </>
    );
  }
  const share = site.views ? page.views / site.views : 0;
  if (live) {
    return (
      <>
        <div className="panel-head">
          <div>
            <p className="detail-kicker">{nameOf(detail.tenantId, state.umamiSites)} · path</p>
            <h2><code>{detail.path}</code></h2>
            <p>{windowLabel(state)}</p>
          </div>
        </div>
        <div className="detail-kpis">
          <div><span>Views</span><strong>{num(page.views)}</strong></div>
          {page.visitors != null ? <div><span>Visitors</span><strong>{num(page.visitors)}</strong></div> : null}
          {page.visits != null ? <div><span>Visits</span><strong>{num(page.visits)}</strong></div> : null}
          {page.bounces != null ? <div><span>Bounces</span><strong>{num(page.bounces)}</strong></div> : null}
          {page.bounce != null ? <div><span>Bounce rate</span><strong>{pct(page.bounce)}</strong></div> : null}
          {page.duration != null ? <div><span>Visit duration</span><strong>{duration(page.duration)}</strong></div> : null}
          <div><span>Share of project pageviews</span><strong>{pct(share)}</strong></div>
        </div>
      </>
    );
  }
  const series: ChartSeries[] = [
    {
      name: "Views",
      values: site.seriesViews.map((value) => Math.max(0, Math.round(value * share))),
      color: "#d4c4ff",
    },
    {
      name: "Visitors",
      values: site.seriesVisitors.map((value) => Math.max(0, Math.round(value * share))),
      color: "#f0a090",
    },
  ];
  const referrers = site.referrers.slice(0, 5).map((row) => ({
    name: row.name,
    count: Math.max(1, Math.round(row.count * share)),
  }));
  const devices = site.devices.slice(0, 4).map((row) => ({
    name: row.name,
    count: Math.max(1, Math.round(row.count * share)),
  }));
  const filterLabel = scopeIds(state).length > 1 ? nameOf(detail.tenantId, state.umamiSites) + " · " + detail.path : detail.path;
  return (
    <>
      <div className="panel-head">
        <div>
          <p className="detail-kicker">{nameOf(detail.tenantId, state.umamiSites)} · path</p>
          <h2>
            <code>{detail.path}</code>
          </h2>
          <p>{pct(share)} of project pageviews · {windowLabel(state)}</p>
        </div>
        <span className="badge">Sample</span>
      </div>
      <div className="detail-kpis">
        <div>
          <span>Views</span>
          <strong>{num(page.views)}</strong>
        </div>
        <div>
          <span>Visitors</span>
          <strong>{page.visitors == null ? "—" : num(page.visitors)}</strong>
        </div>
        <div>
          <span>Bounce</span>
          <strong>{page.bounce == null ? "—" : pct(page.bounce)}</strong>
        </div>
        <div>
          <span>Duration</span>
          <strong>{page.duration == null ? "—" : duration(page.duration)}</strong>
        </div>
      </div>
      <GroupedChart series={series} label={detail.path} {...chartProps(state, series)} />
      <div className="detail-split">
        <div>
          <h3>Top referrers</h3>
          <Bars rows={referrers} />
        </div>
        <div>
          <h3>Devices</h3>
          <Bars rows={devices} />
        </div>
      </div>
      <div className="detail-actions">
        {!state.umami ? (
          <button
            type="button"
            onClick={() => {
              state.metric = "pages";
              state.slice = filterLabel;
              bump();
            }}
          >
            Apply as filter
          </button>
        ) : null}
        <button className="ghost" type="button" onClick={() => closeDetail(state, bump)}>
          Done
        </button>
      </div>
      <p className="caption">Breakdowns for this path are share-scaled from project audience fixtures.</p>
    </>
  );
}

function ApiDetail({
  state,
  detail,
  bump,
}: {
  state: AppState;
  detail: Extract<DetailView, { kind: "api" }>;
  bump: () => void;
}) {
  const site = stats(state, detail.tenantId);
  const siblings = site.api.filter((row) => row.route === detail.route && row.service === detail.service);
  const focus = siblings.find((row) => row.status === detail.status) || siblings[0];
  if (!focus) {
    return (
      <>
        <h2>Route not found</h2>
        <p className="quiet">No sample rows for this endpoint.</p>
      </>
    );
  }
  const total = siblings.reduce((summed, row) => summed + row.count, 0);
  const share = site.requests ? total / site.requests : 0;
  const ok = siblings.filter((row) => row.status < 400).reduce((summed, row) => summed + row.count, 0);
  const client = siblings.filter((row) => row.status >= 400 && row.status < 500).reduce((summed, row) => summed + row.count, 0);
  const server = siblings.filter((row) => row.status >= 500).reduce((summed, row) => summed + row.count, 0);
  const series: ChartSeries[] = [
    {
      name: "Requests",
      values: site.seriesRequests.map((value) => Math.max(0, Math.round(value * share))),
      color: "#d4c4ff",
    },
  ];
  const buckets = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
  const latencyRows = buckets.map((edge) => {
    const hit = siblings.some((row) => (row.p50 ?? 0) <= edge && (row.p95 ?? 0) >= edge * 0.4);
    const weight = siblings
      .filter((row) => (row.p95 ?? 0) <= edge || (row.p50 ?? 0) <= edge)
      .reduce((summed, row) => summed + row.count, 0);
    return {
      name: "≤ " + (edge >= 1000 ? edge / 1000 + " s" : edge + " ms"),
      count: hit ? Math.max(1, Math.round(weight * (edge === (focus.p95 || edge) ? 0.45 : 0.12))) : 0,
    };
  }).filter((row) => row.count > 0).slice(0, 6);
  return (
    <>
      <div className="panel-head">
        <div>
          <p className="detail-kicker">{nameOf(detail.tenantId, state.umamiSites)} · {detail.service}</p>
          <h2>
            <code>{detail.route}</code>
          </h2>
          <p>
            Focus status {focus.status} · {pct(share)} of project API volume · {windowLabel(state)}
          </p>
        </div>
        <span className={"badge" + ((apiBadgeLive(state) ? " live" : ""))}>{apiBadge(state)}</span>
      </div>
      <div className="detail-kpis">
        <div>
          <span>Requests</span>
          <strong>{num(total)}</strong>
        </div>
        <div>
          <span>This status</span>
          <strong>{num(focus.count)}</strong>
        </div>
        <div>
          <span>p50</span>
          <strong>{ms(focus.p50)}</strong>
        </div>
        <div>
          <span>p95</span>
          <strong>{ms(focus.p95)}</strong>
        </div>
      </div>
      <div className="status-compact">
        <Stack
          parts={[
            { label: "2xx", value: ok, className: "s-ok" },
            { label: "4xx", value: client, className: "s-warn" },
            { label: "5xx", value: server, className: "s-bad" },
          ]}
        />
      </div>
      <GroupedChart series={series} label={detail.route} {...chartProps(state, series)} />
      <h3>Status mix</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Requests</th>
              <th>p50</th>
              <th>p95</th>
            </tr>
          </thead>
          <tbody>
            {siblings
              .slice()
              .sort((a, b) => b.count - a.count)
              .map((row) => (
                <tr
                  key={row.status}
                  className={row.status === detail.status ? "row-on" : undefined}
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    state.detail = { ...detail, status: row.status };
                    bump();
                  }}
                >
                  <td>
                    <span className={"pill " + tone(row.status)}>{row.status}</span>
                  </td>
                  <td className="num">{num(row.count)}</td>
                  <td className="num">{ms(row.p50)}</td>
                  <td className="num">{ms(row.p95)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {latencyRows.length ? (
        <>
          <h3>Latency ceiling</h3>
          <Bars rows={latencyRows} />
        </>
      ) : null}
      <div className="detail-actions">
        <button
          type="button"
          onClick={() => {
            state.project = detail.tenantId;
            state.status = focus.status >= 500 ? "5xx" : focus.status >= 400 ? "4xx" : "2xx";
            state.sort = "requests";
            state.view = "api";
            bump();
          }}
        >
          Filter table
        </button>
        <button className="ghost" type="button" onClick={() => closeDetail(state, bump)}>
          Done
        </button>
      </div>
    </>
  );
}

function DayDetail({
  state,
  ids,
  detail,
  bump,
}: {
  state: AppState;
  ids: string[];
  detail: Extract<DetailView, { kind: "day" }>;
  bump: () => void;
}) {
  const showApi = Boolean(state.apiMetrics) && (detail.source === "api" || !state.umami);
  const when = pointWhen(state, detail.index, Math.max(...ids.map((id) => stats(state, id).seriesViews.length), 1));
  const rows = ids.map((id) => {
    const site = stats(state, id);
    return {
      id,
      visitors: site.seriesVisitors[detail.index] || 0,
      views: site.seriesViews[detail.index] || 0,
      requests: site.seriesRequests[detail.index] || 0,
    };
  });
  const visitors = rows.reduce((summed, row) => summed + row.visitors, 0);
  const views = rows.reduce((summed, row) => summed + row.views, 0);
  const requests = rows.reduce((summed, row) => summed + row.requests, 0);
  return (
    <>
      <div className="panel-head">
        <div>
          <p className="detail-kicker">{detail.source === "api" ? "API day" : "Web day"}</p>
          <h2>{when}</h2>
          <p>Pinned point · {windowLabel(state)} · click the bar again to unpin</p>
        </div>
      </div>
      <div className="detail-kpis">
        <div>
          <p className="metric-label"><span>Visitors</span><SourceBadge source={webMetricSource(state, ids)} /></p>
          <strong>{num(visitors)}</strong>
        </div>
        <div>
          <p className="metric-label"><span>Views</span><SourceBadge source={webMetricSource(state, ids)} /></p>
          <strong>{num(views)}</strong>
        </div>
        {showApi ? (
          <div>
            <p className="metric-label"><span>API requests</span><SourceBadge source={apiBadge(state)} /></p>
            <strong>{num(requests)}</strong>
          </div>
        ) : null}
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Project</th>
              <th>Visitors</th>
              <th>Views</th>
              <th>Web source</th>
              {showApi ? <th>API <SourceBadge source={apiBadge(state)} /></th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <span className="who">
                    <ProjectIcon id={row.id} compact />
                    {nameOf(row.id, state.umamiSites)}
                  </span>
                </td>
                <td className="num">{num(row.visitors)}</td>
                <td className="num">{num(row.views)}</td>
                <td><SourceBadge source={webMetricSource(state, [row.id])} /></td>
                {showApi ? <td className="num">{num(row.requests)}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="detail-actions">
        <button className="ghost" type="button" onClick={() => closeDetail(state, bump)}>
          Close
        </button>
      </div>
    </>
  );
}

export function Stage({ state, bump, onOpen }: {
  state: AppState;
  bump: () => void;
  onOpen: (id: string) => void;
}) {
  const publicMode = isPublic(state);
  const operator = state.role === "operator" || publicMode;
  const showApi = !publicMode && Boolean(state.apiMetrics);
  const ids = scopeIds(state);
  const data = headline(state, ids);
  if (state.view === "overview") {
    const webBadge = webMetricSource(state, ids);
    const focus = state.chartFocus;
    return (
      <>
        <section className="kpis">
          <Kpi
            label="Unique visitors"
            value={num(data.visitors)}
            hint="Distinct sessions in range"
            icon={visitorIcon}
            badge={webBadge}
            active={focus === "visitors"}
            onSelect={() => {
              state.chartFocus = focus === "visitors" ? "both" : "visitors";
              bump();
            }}
          />
          <Kpi
            label="Page views"
            value={num(data.views)}
            hint="Frontend activity"
            icon={viewsIcon}
            badge={webBadge}
            active={focus === "views"}
            onSelect={() => {
              state.chartFocus = focus === "views" ? "both" : "views";
              bump();
            }}
          />
          {showApi ? (
            <>
              <Kpi
                label="API requests"
                value={num(data.requests)}
                hint={pct(data.errorRate) + " error rate"}
                icon={apiIcon}
                badge={apiBadge(state)}
                onSelect={() => {
                  state.view = "api";
                  bump();
                }}
              />
              <Kpi
                label="API latency · p95"
                value={ms(data.p95)}
                hint={"p50 " + ms(data.p50)}
                icon={latencyIcon}
                badge={apiBadge(state)}
                onSelect={() => {
                  state.view = "api";
                  bump();
                }}
              />
            </>
          ) : null}
        </section>
        <SecondaryStats ids={ids} data={data} webSource={webBadge} />
        <Freshness state={state} />
        <Activity state={state} ids={ids} bump={bump} />
        <ProjectTable state={state} ids={ids} bump={bump} onOpen={onOpen} />
        {!publicMode ? <PrivacyNote /> : null}
        <DetailSheet state={state} ids={ids} bump={bump} />
      </>
    );
  }
  if (state.view === "web") {
    const source = webMetricSource(state, ids);
    const webBadge = source === "Live" ? undefined : source;
    const web = webHeadline(state, ids, data);
    const activeCounts = liveSites(state, ids).flatMap((site) => site.details?.activeVisitors == null ? [] : [site.details.activeVisitors]);
    const summary = (
      <>
        <section className="kpis">
          <Kpi label="Pageviews" value={num(web.views)} hint={<Change value={data.delta.pageviews} goodWhenUp range={state.range} />} badge={webBadge} />
          <Kpi label="Visitors" value={num(web.visitors)} hint={<Change value={data.delta.visitors} goodWhenUp range={state.range} />} badge={webBadge} />
          <Kpi label="Bounce rate" value={pct(web.bounce)} hint={<Change value={data.delta.bounce} goodWhenUp={false} range={state.range} />} badge={webBadge} />
          <Kpi label="Visit duration" value={duration(web.duration)} hint={<Change value={data.delta.duration} goodWhenUp range={state.range} />} badge={webBadge} />
        </section>
        {web.visits != null && web.bounces != null ? (
          <section className="secondary-stats slim">
            <div><span>Visits</span><strong>{num(web.visits)}</strong></div>
            <div><span>Bounces</span><strong>{num(web.bounces)}</strong></div>
            <div><span>Average views per visit</span><strong>{web.visits ? (web.views / web.visits).toFixed(1) : "—"}</strong></div>
            {activeCounts.length ? <div><span>Active visitors · last 5 min</span><strong>{num(activeCounts.reduce((sum, count) => sum + count, 0))}</strong></div> : null}
          </section>
        ) : null}
        {web.visits === 0 && web.views === 0 ? (
          <p className="caption">Umami reports no web traffic for this period.</p>
        ) : null}
        <Freshness state={state} />
      </>
    );
    if (publicMode) return summary;
    const sites = liveSites(state, ids);
    return (
      <>
        {summary}
        {!state.umami || sites.some((site) => site.seriesViews?.length) ? (
          <>
            <FilterChip state={state} bump={bump} />
            <MetricBoard state={state} ids={ids} bump={bump} />
          </>
        ) : null}
        <WebBreakdownTable state={state} ids={ids} bump={bump} />
        {sites.some((site) => site.details?.performance) ? <WebPerformance state={state} ids={ids} /> : null}
        <DetailSheet state={state} ids={ids} bump={bump} />
      </>
    );
  }
  if (state.view === "api" && showApi) {
    const ok = data.requests - data.errors - data.client;
    const buckets = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
    const counts = buckets.map(() => 0);
    for (const id of ids) {
      for (const row of stats(state, id).api) {
        const mid = buckets.findIndex((edge) => (row.p50 ?? row.p95) <= edge);
        const tail = buckets.findIndex((edge) => row.p95 <= edge);
        const start = mid < 0 ? buckets.length - 1 : mid;
        const end = tail < 0 ? buckets.length - 1 : tail;
        const head = Math.round(row.count * 0.7);
        counts[start] += head;
        counts[end] += row.count - head;
      }
    }
    const allApi = ids.flatMap((id) => stats(state, id).api);
    const failing = allApi
      .filter((row) => row.status >= 500)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    const slowest = [...allApi].sort((a, b) => (b.p95 ?? 0) - (a.p95 ?? 0) || b.count - a.count).slice(0, 5);
    return (
      <>
        <section className="kpis">
          <Kpi label="API requests" value={num(data.requests)} hint={<Change value={data.delta.requests} goodWhenUp range={state.range} />} badge={apiBadge(state)} />
          <Kpi label="Error rate" value={pct(data.errorRate)} hint={<Change value={data.delta.errors} goodWhenUp={false} range={state.range} />} badge={apiBadge(state)} />
          <Kpi label="p50" value={ms(data.p50)} hint="Bucket ceiling" badge={apiBadge(state)} />
          <Kpi label="p95" value={ms(data.p95)} hint="Bucket ceiling" badge={apiBadge(state)} />
        </section>
        <div className="attention-grid">
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Needs attention · 5xx</h2>
                <p>Highest volume server errors in range.</p>
              </div>
              <span className={"badge" + ((apiBadgeLive(state) ? " live" : ""))}>{apiBadge(state)}</span>
            </div>
            {failing.length ? (
              <div className="rank-list">
                {failing.map((row) => (
                  <button
                    key={row.tenantId + row.route + row.status}
                    type="button"
                    className="rank-row"
                    onClick={() => {
                      state.status = "5xx";
                      state.project = operator ? row.tenantId : "all";
                      state.sort = "requests";
                      openApiDetail(state, row, bump);
                    }}
                  >
                    <span className="rank-fill bad" style={{ width: Math.max(8, Math.round((row.count / (failing[0].count || 1)) * 100)) + "%" }} aria-hidden="true" />
                    <span className="rank-label">
                      <strong>{row.route}</strong>
                      <span className="quiet">{operator ? nameOf(row.tenantId, state.umamiSites) + " · " : ""}{row.service} · {row.status}</span>
                    </span>
                    <span className="rank-nums">
                      <b>{num(row.count)}</b>
                      <em>{ms(row.p95)}</em>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="quiet">No 5xx routes in this selection.</p>
            )}
          </section>
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Needs attention · slowest p95</h2>
                <p>Routes with the highest latency ceiling.</p>
              </div>
              <span className={"badge" + ((apiBadgeLive(state) ? " live" : ""))}>{apiBadge(state)}</span>
            </div>
            <div className="rank-list">
              {slowest.map((row) => (
                <button
                  key={"slow-" + row.tenantId + row.route + row.status}
                  type="button"
                  className="rank-row"
                  onClick={() => {
                    state.sort = "p95";
                    state.project = operator ? row.tenantId : "all";
                    openApiDetail(state, row, bump);
                  }}
                >
                  <span className="rank-fill warn" style={{ width: Math.max(8, Math.round(((row.p95 || 0) / (slowest[0].p95 || 1)) * 100)) + "%" }} aria-hidden="true" />
                  <span className="rank-label">
                    <strong>{row.route}</strong>
                    <span className="quiet">{operator ? nameOf(row.tenantId, state.umamiSites) + " · " : ""}{row.service} · {row.status}</span>
                  </span>
                  <span className="rank-nums">
                    <b>{ms(row.p95)}</b>
                    <em>{num(row.count)}</em>
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
        <ApiCurve state={state} ids={ids} bump={bump} />
        <div className="layout two">
          <section className="panel">
            <h2>HTTP status</h2>
            <div className="status-compact">
              <Stack
                parts={[
                  { label: "2xx", value: Math.max(0, ok), className: "s-ok" },
                  { label: "4xx", value: data.client, className: "s-warn" },
                  { label: "5xx", value: data.errors, className: "s-bad" },
                ]}
              />
            </div>
            <div className="mini">
              <div><span>2xx · Successful</span><span className="num">{num(ok)}</span></div>
              <div><span>4xx · Client error</span><span className="num">{num(data.client)}</span></div>
              <div><span>5xx · Server error</span><span className="num">{num(data.errors)}</span></div>
            </div>
          </section>
          <section className="panel">
            <h2>Latency buckets</h2>
            <p className="sub">Fixed histogram. Dashboard reads the bucket ceiling.</p>
            <Bars rows={buckets.map((edge, index) => ({ name: "≤ " + (edge >= 1000 ? edge / 1000 + " s" : edge + " ms"), count: counts[index] }))} />
          </section>
        </div>
        <section className="panel" style={{ marginTop: 12 }}>
          <h2>Normalized endpoints</h2>
          <ApiFilterChip state={state} bump={bump} projects={operator} />
          <Filters state={state} ids={ids} projects={operator} bump={bump} />
          <ApiTable state={state} rows={visibleApi(state, ids)} showProject={operator} bump={bump} />
        </section>
        <TryPath />
        <DetailSheet state={state} ids={ids} bump={bump} />
      </>
    );
  }
  if (publicMode && state.view !== "compare") return null;
  if (state.view === "manage") return <Manage state={state} bump={bump} />;
  if (state.view === "privacy") return <Privacy state={state} bump={bump} />;
  if (state.view === "compare" && ids.length > 1) {
    const [left, right] = ids.map((id) => stats(state, id));
    const metrics: [string, string, string][] = [
      ["Pageviews", num(left.views), num(right.views)],
      ["Visitors", num(left.visitors), num(right.visitors)],
      ["Bounce rate", pct(left.bounce), pct(right.bounce)],
      ["Visit duration", duration(left.duration), duration(right.duration)],
    ];
    if (showApi) metrics.push(
      ["API requests", num(left.requests), num(right.requests)],
      ["Error rate", pct(left.errorRate), pct(right.errorRate)],
      ["p95", ms(left.p95), ms(right.p95)],
    );
    return (
      <>
        <ProjectRollout state={state} ids={ids} />
        <ProjectTable state={state} ids={ids} bump={bump} onOpen={onOpen} />
        <section className="panel" style={{ marginTop: 12 }}>
          <h2>Same numbers</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th><span className="who"><ProjectIcon id={left.id} compact />{nameOf(left.id, state.umamiSites)}</span></th>
                  <th><span className="who"><ProjectIcon id={right.id} compact />{nameOf(right.id, state.umamiSites)}</span></th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((row) => (
                  <tr key={row[0]}>
                    <td>{row[0]}</td>
                    <td className="num">{row[1]}</td>
                    <td className="num">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        {showApi ? (
          <section className="panel" style={{ marginTop: 12 }}>
            <h2>Routes</h2>
            <p className="sub">
              Routes and API metrics are simulated in this POC. Live API metrics will come from the OpenTelemetry Protocol (OTLP) collector once implemented.
            </p>
            <Filters state={state} ids={ids} projects bump={bump} />
            <ApiTable state={state} rows={visibleApi(state, ids)} showProject bump={bump} />
          </section>
        ) : null}
      </>
    );
  }
  if (state.view === "compare") {
    return (
      <>
        <ProjectRollout state={state} ids={ids} />
        {ids.map((id) => {
          const site = stats(state, id);
          const meta = profileOf(id, state.umamiSites);
          const cells: [string, string][] = [
            ["Pageviews", num(site.views)],
            ["Visitors", num(site.visitors)],
            ["Bounce", pct(site.bounce)],
            ["Duration", duration(site.duration)],
          ];
          if (showApi) cells.push(
            ["API requests", num(site.requests)],
            ["Error rate", pct(site.errorRate)],
            ["p50", ms(site.p50)],
            ["p95", ms(site.p95)],
          );
          return (
            <article key={id} className={"panel project " + meta.hue}>
              <div className="name">
                <ProjectIcon id={id} name={meta.name} compact />
                {meta.name}
              </div>
              <p className="quiet">{meta.detail}</p>
              <div className="stats">
                {cells.map((cell) => (
                  <div key={cell[0]}>
                    <strong>{cell[1]}</strong>
                    <span>{cell[0]}</span>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </>
    );
  }
  return <Integration state={state} bump={bump} />;
}

function TryPath() {
  const sample = "/accounts/" + ACCOUNT + "/payments/42/";
  const [value, setValue] = useState(sample);
  return (
    <section className="panel try" style={{ marginTop: 12 }}>
      <h2>Try path normalization</h2>
      <p className="sub">Fixed rules for ids, UUIDs, hashes, and Stellar addresses.</p>
      <label className="quiet">
        Request path
        <input value={value} onChange={(event) => setValue(event.target.value)} />
      </label>
      <p className="try-out mono">{previewPath(value)}</p>
    </section>
  );
}

function Manage({ state, bump }: { state: AppState; bump: () => void }) {
  const directory = state.managedSites ?? state.umamiSites;
  const projectIds = new Set([...Object.keys(UMAMI_PROJECT_DOMAINS), ...Object.keys(directory ?? {})]);
  const known = [...projectIds].map((id) => {
    const profile = profileOf(id, directory);
    const registered = directory?.[id];
    const metrics = state.umami?.[id];
    const umamiStatus = !registered
      ? state.managedSites ? "No matching site in Umami" : "Umami discovery unavailable"
      : !metrics ? "Web metrics unavailable"
      : metrics.views > 0 ? "Pageviews recorded"
      : "No pageviews recorded";
    return {
      id,
      name: profile.name,
      detail: profile.domain || profile.detail,
      umamiStatus,
      status: registered ? listingOf(state, id) : "pending",
      live: Boolean(metrics),
      missingUmamiId: !registered,
    };
  });
  const rows = [
    ...known,
    ...state.waiting.filter((item) => !projectIds.has(item.id)).map((item) => ({
      ...item,
      status: listingOf(state, item.id),
      live: false,
      missingUmamiId: false,
    })),
  ];
  const listed = rows.filter((row) => row.status === "listed").length;
  const pending = rows.filter((row) => row.status === "pending").length;
  const hidden = rows.filter((row) => row.status === "hidden").length;
  const removed = rows.filter((row) => row.status === "removed").length;
  const activeKeys = state.keys.filter((key) => !key.revoked).length;
  const query = state.projectQuery.trim().toLowerCase();
  const visible = query
    ? rows.filter((row) => (row.name + " " + row.detail + " " + row.umamiStatus).toLowerCase().includes(query))
    : rows;

  function act(action: string, id = "") {
    const waiting = state.waiting.find((item) => item.id === id);
    if (action === "open") state.approval = false;
    if (action === "approval") state.approval = true;
    if (action === "list") {
      delete state.removed[id];
      if (waiting) waiting.status = "listed";
      else state.listing[id] = "listed";
      state.audit.unshift({
        at: new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC",
        actor: "SCF operator",
        project: nameOf(id, directory) || id,
        projectId: id,
        action: "Listed on dashboard",
        period: "—",
        reason: "Operator listing",
        visitors: 0,
        views: 0,
        requests: 0,
      });
    }
    if (action === "hide") {
      if (waiting) waiting.status = "hidden";
      else state.listing[id] = "hidden";
      state.audit.unshift({
        at: new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC",
        actor: "SCF operator",
        project: nameOf(id, directory) || id,
        projectId: id,
        action: "Hidden from dashboard",
        period: "—",
        reason: "Still enrolled",
        visitors: 0,
        views: 0,
        requests: 0,
      });
    }
    if (action === "remove") {
      state.removed[id] = true;
      state.audit.unshift({
        at: new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC",
        actor: "SCF operator",
        project: nameOf(id, directory) || id,
        projectId: id,
        action: "Removed from ecosystem",
        period: "—",
        reason: "Not on Stellar / out of scope",
        visitors: 0,
        views: 0,
        requests: 0,
      });
    }
    if (action === "restore") {
      delete state.removed[id];
      if (waiting) waiting.status = "hidden";
      else state.listing[id] = "hidden";
    }
    if (action === "mint") {
      const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
      let suffix = "";
      for (let index = 0; index < 8; index += 1) suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
      const token = "scf_mtr_" + suffix;
      const tenantBound = state.keyScope === "tenant";
      state.keys.unshift({
        id: suffix,
        name: tenantBound ? nameOf(state.keyTenant, directory) + " reader" : "Ecosystem reader",
        hint: token,
        revoked: false,
        scope: state.keyScope,
        tenantId: tenantBound ? state.keyTenant : undefined,
      });
      state.freshKey = token;
    }
    if (action === "revoke") {
      const key = state.keys.find((item) => item.id === id);
      if (key) key.revoked = true;
      if (state.freshKey && key && state.freshKey === key.hint) state.freshKey = "";
    }
    bump();
  }

  return (
    <>
      <section className="ops-kpis">
        <article><span>Listed</span><strong>{listed}</strong><em>On the shared dashboard</em></article>
        <article><span>Pending</span><strong>{pending}</strong><em>Waiting on approval</em></article>
        <article><span>Enrolled</span><strong>{hidden}</strong><em>Hidden until listed</em></article>
        <article><span>Removed</span><strong>{removed}</strong><em>Out of ecosystem</em></article>
        <article><span>Active keys</span><strong>{activeKeys}</strong><em>Operator read access</em></article>
      </section>

      <section className="panel" style={{ marginTop: 12 }}>
        <div className="panel-head">
          <div>
            <h2>Lifecycle</h2>
            <p>Enrollment never equals a dashboard listing. SCF decides what the ecosystem view shows.</p>
          </div>
          <div className="switch">
            <button type="button" aria-pressed={!state.approval} onClick={() => act("open")}>Open enrollment</button>
            <button type="button" aria-pressed={state.approval} onClick={() => act("approval")}>Approval required</button>
          </div>
        </div>
        <ol className="lifecycle">
          <li className="on"><strong>1. Enroll</strong><span>Project mints a tenant token</span></li>
          <li className={state.approval ? "on" : ""}><strong>2. Approve</strong><span>{state.approval ? "Held until SCF accepts" : "Skipped in open mode"}</span></li>
          <li><strong>3. List</strong><span>Operator publishes to the dashboard</span></li>
          <li><strong>4. Observe</strong><span>Shared web + API metrics</span></li>
        </ol>
      </section>

      <section className="panel" style={{ marginTop: 12 }}>
        <div className="panel-head">
          <div>
            <h2>Projects</h2>
            <p>Umami web activity · {RANGE_LABELS[state.range]}. List publishes, hide keeps enrollment, and remove takes a project out of the dashboard.</p>
          </div>
          <span className="count">{visible.length}</span>
        </div>
        <div className="table-tools">
          <input
            type="search"
            placeholder="Search projects, domains, or Umami status…"
            value={state.projectQuery}
            aria-label="Search managed projects"
            onChange={(event) => {
              state.projectQuery = event.target.value;
              bump();
            }}
          />
        </div>
        <div className="table-wrap">
          <table className="manage-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Umami status</th>
                <th>Visitors</th>
                <th>Views</th>
                <th>API</th>
                <th>Dashboard</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visible.length ? (
                visible.map((row) => {
                  const pill = statusTone(row.status);
                  const site = row.live ? stats(state, row.id) : null;
                  return (
                    <tr key={row.id}>
                      <td>
                        <span className="who">
                          <ProjectIcon id={row.id} name={row.name} />
                          <span>
                            <strong>{row.name}</strong>
                            <span className="quiet">{row.detail}</span>
                          </span>
                        </span>
                      </td>
                      <td className="mono">{row.umamiStatus}</td>
                      <td className="num">{site ? num(site.visitors) : "—"}</td>
                      <td className="num">{site ? num(site.views) : "—"}</td>
                      <td className="num">{site && state.apiMetrics?.[row.id] ? num(site.requests) : "—"}</td>
                      <td>
                        <span className={"pill " + pill[0]}>{pill[1]}</span>
                      </td>
                      <td>
                        <div className="manage-actions">
                          {row.missingUmamiId ? null : row.status === "removed" ? (
                            <button className="ghost" type="button" onClick={() => act("restore", row.id)}>Restore</button>
                          ) : (
                            <>
                              {row.status === "listed" ? null : (
                                <button className="ghost" type="button" onClick={() => act("list", row.id)}>List</button>
                              )}
                              {row.status === "listed" ? (
                                <button className="ghost" type="button" onClick={() => act("hide", row.id)}>Hide</button>
                              ) : null}
                              <button className="ghost" type="button" onClick={() => act("remove", row.id)}>Remove</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7}>No project matches.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="layout split" style={{ marginTop: 12 }}>
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Metrics keys</h2>
              <p>Downstream tools read aggregates. Keys are hashed in production. This demo shows the secret once.</p>
            </div>
          </div>
          <div className="key-mint">
            <div className="switch">
              <button type="button" aria-pressed={state.keyScope === "global"} onClick={() => { state.keyScope = "global"; bump(); }}>Global</button>
              <button type="button" aria-pressed={state.keyScope === "tenant"} onClick={() => { state.keyScope = "tenant"; bump(); }}>One project</button>
            </div>
            {state.keyScope === "tenant" ? (
              <select
                aria-label="Key tenant"
                value={state.keyTenant}
                onChange={(event) => {
                  state.keyTenant = event.target.value;
                  bump();
                }}
              >
                {rows.filter((row) => !row.missingUmamiId && row.status !== "removed").map((row) => (
                  <option key={row.id} value={row.id}>{row.name}</option>
                ))}
              </select>
            ) : null}
            <button className="primary" type="button" onClick={() => act("mint")}>Generate key</button>
          </div>
          {state.freshKey ? (
            <div className="fresh-key">
              <span>Copy now · shown once</span>
              <code className="mono">{state.freshKey}</code>
            </div>
          ) : null}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Scope</th>
                  <th>Key</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {state.keys.map((key) => (
                  <tr key={key.id}>
                    <td>{key.name}</td>
                    <td>{key.scope === "global" ? "All projects" : nameOf(key.tenantId || "", directory)}</td>
                    <td className="mono">{key.revoked ? "revoked" : key.hint.slice(0, 12) + "••••"}</td>
                    <td>{key.revoked ? <span className="pill bad">Revoked</span> : <span className="pill ok">Active</span>}</td>
                    <td>{key.revoked ? null : <button className="ghost" type="button" onClick={() => act("revoke", key.id)}>Revoke</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Operator actions</h2>
              <p>Session log of listing and removal choices. Refresh clears it.</p>
            </div>
          </div>
          <div className="ops-feed">
            {state.audit.filter((entry) => entry.actor === "SCF operator").slice(0, 8).length ? (
              state.audit
                .filter((entry) => entry.actor === "SCF operator")
                .slice(0, 8)
                .map((entry, index) => (
                  <div key={entry.at + index}>
                    <strong>{entry.action}</strong>
                    <span>{entry.project}</span>
                    <em>{entry.at}</em>
                  </div>
                ))
            ) : (
              <p className="quiet">List, hide, or remove a project to see operator actions here.</p>
            )}
          </div>
          <div className="ops-notes">
            <div>
              <strong>What SCF controls</strong>
              <p>Listing, removal, and metrics keys. Tenants still own their property data.</p>
            </div>
            <div>
              <strong>What tenants control</strong>
              <p>Enrollment, script install, OTLP export, and erasure requests.</p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function Privacy({ state, bump }: { state: AppState; bump: () => void }) {
  const targets = privacyTargets(state);
  const log = state.audit.filter((entry) =>
    state.role === "operator"
      ? Boolean(state.umamiSites?.[entry.projectId])
      : entry.projectId === state.tenantId,
  );
  const logTable = (
    <section className="panel" style={{ marginTop: 12 }}>
      <h2>Session log</h2>
      <p className="quiet">Kept for this browser session, including after a project is removed. Refresh clears it. This does not delete Umami rows.</p>
      <div className="table-wrap session-log">
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>Actor</th>
              <th>Project</th>
              <th>Action</th>
              <th>Period</th>
              <th>Visitors / views / API</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {log.length ? (
              log.map((entry, index) => (
                <tr key={entry.at + index}>
                  <td>{entry.at}</td>
                  <td>{entry.actor}</td>
                  <td>{entry.project}</td>
                  <td>{entry.action}</td>
                  <td>{entry.period}</td>
                  <td className="num">{num(entry.visitors)} / {num(entry.views)} / {num(entry.requests)}</td>
                  <td>{entry.reason}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7}>No data actions yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
  if (!targets.length) {
    return (
      <>
        <PrivacyCard />
        <section className="panel" style={{ marginTop: 12 }}>
          <h2>No enrolled projects</h2>
          <p className="quiet">Every project with sample traffic was removed in this session. Refresh restores the configured projects.</p>
        </section>
        {logTable}
      </>
    );
  }
  if (!targets.includes(state.privacyProject)) state.privacyProject = targets[0];
  const id = state.privacyProject;
  const remove = state.privacyAction === "remove";
  const impact = erasureImpact(state, id, state.privacyAction, state.privacyStream, state.privacyPeriod);
  const available = impact.views > 0 || impact.requests > 0 || impact.visitors > 0;
  function confirm() {
    if (state.privacyConfirm !== nameOf(id, state.umamiSites)) {
      state.privacyError = "Type " + nameOf(id, state.umamiSites) + " exactly.";
      bump();
      return;
    }
    const streams = remove || state.privacyStream === "both" ? (["web", "api"] as const) : ([state.privacyStream] as ("web" | "api")[]);
    for (const name of streams) {
      if (!state.erasure[id]) state.erasure[id] = { web: { all: false, ranges: {} }, api: { all: false, ranges: {} } };
      const box = state.erasure[id][name];
      if (remove || state.privacyPeriod === "all") box.all = true;
      else box.ranges[state.range] = true;
    }
    if (remove) state.removed[id] = true;
    state.audit.unshift({
      at: new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC",
      actor: state.role === "operator" ? "SCF operator" : nameOf(state.tenantId, state.umamiSites),
      project: nameOf(id, state.umamiSites),
      projectId: id,
      action: remove ? "Removed project" : "Erased " + (state.privacyStream === "both" ? "web and API" : state.privacyStream === "web" ? "web" : "API"),
      period: remove || state.privacyPeriod === "all" ? "All demo history" : windowLabel(state),
      reason: state.privacyReason.trim(),
      visitors: impact.visitors,
      views: impact.views,
      requests: impact.requests,
    });
    state.privacyReason = "";
    state.privacyConfirm = "";
    state.privacyStep = "";
    state.privacyError = "";
    bump();
  }
  return (
    <>
      <PrivacyCard />
      <section className="panel privacy-form" style={{ marginTop: 12 }}>
        <div className="panel-head">
          <div>
            <h2>Control your project data</h2>
            <p>{state.role === "operator" ? "Erase sample analytics for any enrolled project, or remove one that is outside the ecosystem." : "Erase sample analytics for this project, or delete the project and its data."}</p>
          </div>
          <span className="badge">Session only</span>
        </div>
        <p className="quiet">{nameOf(id, state.umamiSites)}</p>
        <div className="choice-row">
          <button className="ghost" type="button" aria-pressed={!remove} onClick={() => { state.privacyAction = "erase"; state.privacyStep = ""; state.privacyConfirm = ""; bump(); }}>
            <strong>Erase analytics</strong>
            <small>Keep the project and its id.</small>
          </button>
          <button className="ghost" type="button" aria-pressed={remove} onClick={() => { state.privacyAction = "remove"; state.privacyStep = ""; state.privacyConfirm = ""; bump(); }}>
            <strong>Delete project and all data</strong>
            <small>Remove enrollment and both streams.</small>
          </button>
        </div>
        <div className="data-fields">
          <label>
            Project
            <select
              aria-label="Data management project"
              value={id}
              disabled={state.role !== "operator"}
              onChange={(event) => {
                state.privacyProject = event.target.value;
                state.privacyStep = "";
                state.privacyConfirm = "";
                bump();
              }}
            >
              {targets.map((item) => (
                <option key={item} value={item}>{nameOf(item, state.umamiSites)}</option>
              ))}
            </select>
          </label>
          {remove ? <span /> : (
            <label>
              Data to erase
              <select
                aria-label="Data to erase"
                value={state.privacyStream}
                onChange={(event) => {
                  state.privacyStream = event.target.value;
                  state.privacyStep = "";
                  bump();
                }}
              >
                <option value="both">Web + API analytics</option>
                <option value="web">Web analytics only</option>
                <option value="api">API analytics only</option>
              </select>
            </label>
          )}
        </div>
        {remove ? null : (
          <label>
            Period
            <select
              aria-label="Erasure period"
              value={state.privacyPeriod}
              onChange={(event) => {
                state.privacyPeriod = event.target.value;
                state.privacyStep = "";
                bump();
              }}
            >
              <option value="range">Selected dashboard period ({windowLabel(state)})</option>
              <option value="all">All available history (90-day demo)</option>
            </select>
          </label>
        )}
        <div className="impact-grid">
          <div><span>Visitors affected</span><strong>{num(impact.visitors)}</strong></div>
          <div><span>Page views affected</span><strong>{num(impact.views)}</strong></div>
          <div><span>API requests affected</span><strong>{num(impact.requests)}</strong></div>
        </div>
        <label>
          Reason for this action
          <textarea
            aria-label="Deletion reason"
            maxLength={500}
            rows={3}
            placeholder="Tenant-requested erasure, or a project that is no longer on Stellar."
            value={state.privacyReason}
            onChange={(event) => {
              state.privacyReason = event.target.value;
              bump();
            }}
          />
        </label>
        <p className="quiet">Charts in this session update immediately. Refresh puts the view back. This does not delete Umami rows, keys, or backups. Production erasure deletes the property and its rows.</p>
        <div className="form-foot">
          <span className="quiet">{available ? "The next step asks for the project name." : "No matching sample data remains in this selection."}</span>
          <button
            className="primary danger"
            type="button"
            disabled={!available || !state.privacyReason.trim()}
            onClick={() => {
              state.privacyStep = "confirm";
              state.privacyConfirm = "";
              state.privacyError = "";
              bump();
            }}
          >
            Review
          </button>
        </div>
      </section>
      <section className="panel" style={{ marginTop: 12 }}>
        <h2>What gets erased?</h2>
        <div className="explain">
          <div>
            <strong>Web analytics</strong>
            <p>Visitors, page views, duration, bounce, and the audience breakdowns for the selected period.</p>
          </div>
          <div>
            <strong>API analytics</strong>
            <p>Request counts, status mix, and latency for the selected period.</p>
          </div>
          <div>
            <strong>Project deletion</strong>
            <p>The project leaves the demo. This does not revoke a production key or touch a backup.</p>
          </div>
        </div>
      </section>
      {state.privacyStep === "confirm" ? (
        <section className="panel privacy-form" style={{ marginTop: 12 }}>
          <h2>{remove ? "Remove this project?" : "Erase selected analytics?"}</h2>
          <p className="quiet">{remove ? "The project leaves enrollment, dashboards, and comparisons in this session." : "The project and its integration id stay. Only the selected sample data is cleared in this session."}</p>
          <div className="impact-grid">
            <div><span>Project</span><strong className="name-stat">{nameOf(id, state.umamiSites)}</strong></div>
            <div><span>Visitors</span><strong>{num(impact.visitors)}</strong></div>
            <div><span>Page views</span><strong>{num(impact.views)}</strong></div>
          </div>
          <p className="quiet">{num(impact.requests)} API requests. Reason: {state.privacyReason}</p>
          <label>
            Type <strong>{nameOf(id, state.umamiSites)}</strong> to confirm
            <input
              aria-label="Confirm project name"
              value={state.privacyConfirm}
              autoComplete="off"
              onChange={(event) => {
                state.privacyConfirm = event.target.value;
                bump();
              }}
            />
          </label>
          {state.privacyError ? <p className="caption">{state.privacyError}</p> : null}
          <div className="form-foot">
            <span className="quiet">Refresh restores the view. Umami rows stay.</span>
            <span>
              <button className="ghost" type="button" onClick={() => { state.privacyStep = ""; state.privacyConfirm = ""; bump(); }}>Cancel</button>{" "}
              <button className="primary danger" type="button" onClick={confirm}>Confirm</button>
            </span>
          </div>
        </section>
      ) : null}
      {logTable}
    </>
  );
}

function Integration({ state, bump }: { state: AppState; bump: () => void }) {
  const operator = state.role === "operator";
  const [copied, setCopied] = useState(false);
  async function run(action: string) {
    if (state.busy || operator) return;
    state.busy = true;
    bump();
    try {
      const headers = { authorization: "Bearer " + state.token, "content-type": "application/json" };
      if (action === "page") {
        const raw = "/accounts/" + ACCOUNT + "/";
        const response = await fetch("/s/e", { method: "POST", headers, body: JSON.stringify({ path: raw }) });
        const body = await response.json();
        if (response.ok) {
          const extra = state.extra[state.tenantId];
          if (extra) {
            extra.views += 1;
            extra.paths["/accounts/:account"] = (extra.paths["/accounts/:account"] || 0) + 1;
          }
          state.receipt = { tone: "ok", title: "Page view stored", rows: [["Sent", raw], ["Stored", body.path]] };
        } else state.receipt = { tone: "bad", title: "Page view rejected", rows: [["Reason", body.error || String(response.status)]] };
      } else if (action === "api") {
        const route = "/accounts/" + ACCOUNT + "/payments/42/";
        const response = await fetch("/v1/traces", {
          method: "POST",
          headers,
          body: JSON.stringify({
            resourceSpans: [{
              resource: { attributes: [{ key: "tenant.id", value: { stringValue: state.tenantId } }, { key: "service.name", value: { stringValue: "payments" } }] },
              scopeSpans: [{ spans: [{ traceId: "not-stored", startTimeUnixNano: "0", endTimeUnixNano: "80000000", attributes: [{ key: "http.route", value: { stringValue: route } }, { key: "http.response.status_code", value: { intValue: 200 } }] }] }],
            }],
            resourceLogs: [{ scopeLogs: [{ logRecords: [{ body: { stringValue: "card number was here" } }] }] }],
          }),
        });
        const body = await response.json();
        if (response.ok) {
          const extra = state.extra[state.tenantId];
          const key = "payments|/accounts/:account/payments/:id|200";
          if (extra) extra.api[key] = (extra.api[key] || 0) + 1;
          state.receipt = { tone: "ok", title: "Request counted", rows: [["Kept", body.retained || "route, status, latency"], ["Dropped", body.droppedSpans + " span, " + body.droppedLogs + " log"], ["Not returned", "trace id and log line"]] };
        } else state.receipt = { tone: "bad", title: "Request rejected", rows: [["Reason", body.error || String(response.status)]] };
      }
    } catch (error) {
      state.receipt = { tone: "bad", title: "Request failed", rows: [["Reason", error instanceof Error ? error.message : "error"]] };
    } finally {
      state.busy = false;
      bump();
    }
  }
  const siteId = state.tenantId && PROFILES[state.tenantId] ? state.tenantId : "SITE_ID";
  return (
    <>
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Install in two steps</h2>
            <p>Web uses a pinned script. API dual-exports OpenTelemetry to this collector. The tenant demo shows one project at a time.</p>
          </div>
          <span className="badge">Live collector</span>
        </div>
      </section>
      <div className="install-steps">
        <section className="panel step">
          <p className="step-num">1 · Web</p>
          <h2>Pin the tracker</h2>
          <p className="quiet">One script tag. The file is versioned and the hash is pinned. Placeholders stand in for the live host.</p>
          <p className="mono quiet">data-website-id · {siteId}</p>
          <div className="step-actions">
            <button
              className="ghost"
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(SNIPPET);
                  setCopied(true);
                } catch {
                  setCopied(false);
                }
                setTimeout(() => setCopied(false), 1200);
              }}
            >
              {copied ? "Copied" : "Copy snippet"}
            </button>
            <button className="card compact" type="button" disabled={operator || state.busy} onClick={() => run("page")}>
              <strong>Record a page view</strong>
              <span>Send a Stellar account path and store the normalized form.</span>
            </button>
          </div>
          <pre className="mono">{SNIPPET}</pre>
        </section>
        <section className="panel step">
          <p className="step-num">2 · API</p>
          <h2>Dual-export OTLP</h2>
          <p className="quiet">Keep your own APM. Add a second export to this collector. It keeps route, status, and latency, then drops spans and logs.</p>
          <div className="chips">
            <span>tenant.id</span>
            <span>service.name</span>
            <span>http.route</span>
            <span>http.response.status_code</span>
            <span>duration</span>
          </div>
          <div className="step-actions">
            <button className="card compact" type="button" disabled={operator || state.busy} onClick={() => run("api")}>
              <strong>Send an API call</strong>
              <span>Keep route, status, latency. Drop the span and the log.</span>
            </button>
            {operator ? (
              <button className="card compact" type="button" onClick={() => { state.view = "compare"; bump(); }}>
                <strong>Compare projects</strong>
                <span>Same web and API numbers, side by side.</span>
              </button>
            ) : null}
          </div>
        </section>
      </div>
      {state.receipt ? (
        <dl className={"receipt " + state.receipt.tone}>
          <dt>Result</dt>
          <dd>{state.receipt.title}</dd>
          {state.receipt.rows.map((row) => (
            <span key={row[0]} style={{ display: "contents" }}>
              <dt>{row[0]}</dt>
              <dd className="mono">{row[1]}</dd>
            </span>
          ))}
        </dl>
      ) : null}
      {operator ? <p className="caption">Switch to a project workspace to run the live collector buttons.</p> : null}
    </>
  );
}
