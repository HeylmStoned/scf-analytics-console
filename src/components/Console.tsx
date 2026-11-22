"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ProjectIcon } from "@/components/ProjectIcon";
import { Roadmap } from "@/components/Roadmap";
import { Stage } from "@/components/views";
import { API_METRICS_NOTICE, PROFILES, RANGE_LABELS, RANGES, SNIPPET, availableProject, createState, headline, isPublic, nameOf, profileOf, scopeIds, webMetricSource, windowLabel, type ApiFixture, type AppState, type LiveProject, type RangeKey } from "@/lib/model";

const MARK = "M12.003 1.716c-1.37 0-2.7.27-3.948.78A10.18 10.18 0 0 0 2.66 7.901a10.136 10.136 0 0 0-.797 3.954c0 .258.01.516.027.775a1.942 1.942 0 0 1-1.055 1.88L0 14.934v1.902l2.463-1.26.072-.032v.005l.77-.39.758-.385.066-.039 14.807-7.56 1.666-.847 3.392-1.732V2.694L17.792 5.86 3.744 13.025l-.104.055-.017-.115a8.286 8.286 0 0 1-.071-1.105c0-2.255.88-4.377 2.474-5.977a8.462 8.462 0 0 1 2.71-1.82 8.513 8.513 0 0 1 3.2-.654h.067a8.41 8.41 0 0 1 4.09 1.055l1.628-.83.126-.066a10.11 10.11 0 0 0-5.845-1.853zM24 7.143 5.047 16.808l-1.666.847L0 19.382v1.902l3.282-1.671 2.91-1.485 14.058-7.153.105-.055.016.115c.05.369.072.743.072 1.11 0 2.255-.88 4.383-2.475 5.978a8.461 8.461 0 0 1-2.71 1.82 8.305 8.305 0 0 1-3.2.654h-.06c-1.441 0-2.86-.369-4.102-1.061l-.066.033-1.683.857c.594.418 1.232.776 1.903 1.062a10.11 10.11 0 0 0 3.947.797 10.09 10.09 0 0 0 7.17-2.975 10.136 10.136 0 0 0 2.969-7.18c0-.259-.005-.523-.027-.781a1.942 1.942 0 0 1 1.055-1.88L24 9.044z";

const COPY: Record<string, (wide: boolean, name: string, detail: string) => [string, string]> = {
  overview: (wide, name) =>
    wide
      ? ["Ecosystem overview", "Shared web and API usage across Stellar projects."]
      : [name + " overview", "Only this project. Other tenants stay hidden."],
  web: (wide) => ["Web analytics", wide ? "Pages, referrers, country, device, and browser across projects." : "Pages, referrers, country, device, and browser."],
  api: () => ["API analytics", API_METRICS_NOTICE],
  compare: (wide) => ["Projects", wide ? "Compare available projects. More Stellar projects will be added to the analytics dashboard over time." : "View analytics for this project."],
  integration: () => ["Integration", "Pin the web script, then dual-export the API collector."],
  manage: () => ["SCF managing", "Enrollment policy, dashboard listing, and operator metrics keys."],
  roadmap: () => ["Roadmap", "Proposed delivery milestones, deliverables and completion criteria."],
  privacy: () => ["Data & privacy", "Erase sample web or API data, or remove a project from this session."],
};

const RANGE_VIEWS = new Set(["overview", "web", "api", "compare"]);

const WEB_REPORT_VIEWS = new Set(["overview", "web", "compare", "manage"]);

type UmamiResult = { scope: string; projects: Record<string, LiveProject> | null; directory?: AppState["managedSites"]; error?: string };

export function Console({ introduction, umamiSites }: {
  introduction: ReactNode;
  umamiSites: AppState["umamiSites"];
}) {
  const state = useRef<AppState>(createState(umamiSites));
  const [report, setReport] = useState<UmamiResult | null>(null);
  const [traffic, setTraffic] = useState<{ scope: string; projects?: Record<string, ApiFixture>; error?: string } | null>(null);
  const [, setTick] = useState(0);
  const [booting, setBooting] = useState(true);
  const [tenantPicker, setTenantPicker] = useState(false);
  const bump = () => setTick((value) => value + 1);
  const current = state.current;

  const { mode, view, tenantId, range } = current;
  const scope = WEB_REPORT_VIEWS.has(view) && mode
    ? new URLSearchParams({ mode, view, tenant: tenantId, range }).toString()
    : "";
  const trafficScope = mode === "scf" || mode === "tenant"
    ? new URLSearchParams({ mode, tenant: tenantId }).toString()
    : "";
  const activeTraffic = traffic?.scope === trafficScope ? traffic : null;
  current.apiMetrics = activeTraffic?.projects ?? null;
  const activeReport = report?.scope === scope ? report : null;
  const first = Object.values(activeReport?.projects ?? {})[0];
  current.umami = activeReport?.projects ?? null;
  current.managedSites = activeReport?.directory ?? null;
  current.umamiLabels = first?.labels ?? null;
  current.umamiWhen = first?.when ?? null;

  useEffect(() => {
    if (!scope) return;
    const controller = new AbortController();
    fetch("/api/umami?" + scope, {
      signal: controller.signal,
    }).then(async (response) => {
      if (!response.ok) {
        const error = response.status === 404 ? "No project with recorded pageviews is available for this workspace."
          : "Umami metrics are temporarily unavailable.";
        if (!controller.signal.aborted) setReport({ scope, projects: null, error });
        return;
      }
      const body = (await response.json()) as Pick<UmamiResult, "projects" | "directory">;
      if (!controller.signal.aborted) setReport({ scope, ...body });
    }).catch(() => {
      if (!controller.signal.aborted) setReport({ scope, projects: null, error: "Umami metrics are temporarily unavailable." });
    });
    return () => controller.abort();
  }, [scope]);

  useEffect(() => {
    if (!trafficScope) return;
    const controller = new AbortController();
    fetch("/metrics/api?" + trafficScope, {
      signal: controller.signal,
    }).then(async (response) => {
      if (!response.ok) {
        if (!controller.signal.aborted) setTraffic({ scope: trafficScope, error: "API metrics are temporarily unavailable." });
        return;
      }
      const { projects } = await response.json() as { projects: Record<string, ApiFixture> };
      if (!controller.signal.aborted) setTraffic({ scope: trafficScope, projects });
    }).catch(() => {
      if (!controller.signal.aborted) setTraffic({ scope: trafficScope, error: "API metrics are temporarily unavailable." });
    });
    return () => controller.abort();
  }, [trafficScope]);

  function selectRole(role: string, token: string, tenantId: string, mode?: AppState["mode"]) {
    current.role = role;
    current.token = token;
    current.tenantId = tenantId;
    current.mode = mode || (role === "operator" ? "scf" : role === "public" ? "public" : "tenant");
    current.project = "all";
    current.receipt = null;
    current.menuOpen = false;
    current.detail = null;
    if (current.view === "manage" && role !== "operator") current.view = "overview";
    if (current.view === "privacy" && role === "public") current.view = "overview";
    bump();
  }

  function enterPublic() {
    setTenantPicker(false);
    selectRole("public", "", "", "public");
    current.view = "overview";
    bump();
  }

  function enterScf() {
    setTenantPicker(false);
    selectRole("operator", current.roster?.operatorToken || "", "", "scf");
    current.view = "overview";
    bump();
  }

  function enterTenant(id: string) {
    const tenant = current.roster?.tenants.find((item) => item.id === id);
    if (!tenant || !availableProject(current, id)) return;
    setTenantPicker(false);
    selectRole(tenant.id, tenant.token, tenant.id, "tenant");
    current.view = "overview";
    bump();
  }

  function changeMode() {
    setTenantPicker(false);
    current.role = "";
    current.mode = "";
    current.tenantId = "";
    current.token = current.roster?.operatorToken || "";
    current.gateStep = "modes";
    current.detail = null;
    current.menuOpen = false;
    current.view = "overview";
    bump();
  }

  function openTenantPicker() {
    current.menuOpen = false;
    setTenantPicker(true);
    bump();
  }

  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        const roster = await fetch("/demo/roster");
        if (!roster.ok) throw new Error("Demo roster unavailable");
        const data = await roster.json();
        if (stop) return;
        current.roster = data;
        current.token = current.roster?.operatorToken || "";
        current.role = "";
        current.mode = "";
        current.gateStep = "modes";
      } catch {
        if (!stop) current.gateError = "The demo roster did not load.";
      } finally {
        if (!stop) {
          setBooting(false);
          bump();
        }
      }
    })();
    return () => {
      stop = true;
    };
    // Boot once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const wide = current.role === "operator" || current.role === "public";
    const title = COPY[current.view]?.(wide, nameOf(current.tenantId, current.umamiSites), PROFILES[current.tenantId]?.detail || "This project")[0];
    if (title && !booting && current.role) document.title = title + " · Stellar ecosystem analytics";
    else if (!booting && !current.role) document.title = "Choose a view · Stellar ecosystem analytics";
  });

  if (booting) {
    return (
      <main className="gate">
        <div className="panel gate-panel gate-home">
          {introduction}
          <noscript><p className="caption">Enable JavaScript to open the interactive dashboards.</p></noscript>
        </div>
      </main>
    );
  }

  if (!current.roster) {
    return (
      <div className="gate">
        <form
          className="panel"
          onSubmit={async (event) => {
            event.preventDefault();
            const token = String(new FormData(event.currentTarget).get("token") || "").trim();
            const probe = await fetch("/metrics/web?all=1", { headers: { authorization: "Bearer " + token } });
            if (probe.status === 401) {
              current.gateError = "Unknown token.";
              bump();
              return;
            }
            current.roster = current.roster ?? { tenants: [], operatorToken: token };
            if (probe.ok) selectRole("operator", token, "", "scf");
            else selectRole("token", token, "", "tenant");
          }}
        >
          {introduction}
          <h2>Open a project</h2>
          <p className="lede">Paste a project or operator token.</p>
          <input name="token" autoComplete="off" placeholder="Token" />
          <button type="submit">Open</button>
          <p className="caption">{current.gateError}</p>
        </form>
      </div>
    );
  }

  if (!current.role) {
    const tenants = (current.roster.tenants || []).filter((tenant) => availableProject(current, tenant.id));
    if (current.gateStep === "tenant") {
      return (
        <div className="gate">
          <div className="panel gate-panel">
            {introduction}
            <h2>Choose a tenant</h2>
            <p className="lede">Open one project workspace. Other tenants stay hidden.</p>
            <div className="tenant-pick">
              {tenants.map((tenant) => (
                <button key={tenant.id} type="button" onClick={() => enterTenant(tenant.id)}>
                  <ProjectIcon id={tenant.id} />
                  <span>
                    <strong>{nameOf(tenant.id, current.umamiSites)}</strong>
                    <span>{profileOf(tenant.id, current.umamiSites).domain || profileOf(tenant.id).detail}</span>
                  </span>
                </button>
              ))}
            </div>
            <button className="ghost gate-back" type="button" onClick={() => { current.gateStep = "modes"; bump(); }}>
              Back to modes
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="gate">
        <div className="panel gate-panel gate-home">
          {introduction}
          <h2>Choose a view</h2>
          <p className="lede">Three demo modes for reviewers. You can switch anytime from the workspace menu.</p>
          <div className="mode-grid">
            <button type="button" onClick={enterPublic}>
              <strong>Public</strong>
              <small>Read-only website metrics for listed projects.</small>
            </button>
            <button type="button" onClick={enterScf}>
              <strong>SCF</strong>
              <small>Operator console with listing, keys, and enrollment.</small>
            </button>
            <button
              type="button"
              onClick={() => {
                current.gateStep = "tenant";
                bump();
              }}
            >
              <strong>Tenant</strong>
              <small>One project’s analytics, integration, and privacy tools.</small>
            </button>
          </div>
          {current.gateError ? <p className="caption">{current.gateError}</p> : null}
        </div>
      </div>
    );
  }

  const operator = current.role === "operator";
  const publicMode = isPublic(current);
  const showReportStatus = Boolean(scope && !activeReport);
  const fallbackMessage = activeReport?.error;
  const wide = operator || publicMode;
  const profile = current.tenantId ? profileOf(current.tenantId, current.umamiSites) : undefined;
  const copy = (COPY[current.view] || COPY.overview)(wide, profile?.name || "Project", profile?.detail || "This project");
  const liveWeb = view === "web" && current.umami
    ? "Live web totals come directly from Umami for the selected period."
    : "";
  const description = publicMode
    ? scope && [liveWeb, "To protect visitor privacy, the public dashboard shows only aggregate web totals for connected projects."].filter(Boolean).join(" ")
    : liveWeb || copy[1];
  const ids = scopeIds(current);
  const listed = ids.length;
  const overviewSource = view === "overview" && webMetricSource(current, ids) === "Live + Sample";
  const showApiSource = !publicMode && !showReportStatus && Boolean(current.apiMetrics)
    && (view === "overview" || view === "compare" || view === "manage");
  const showRange = RANGE_VIEWS.has(current.view);
  const showRoadmap = current.view === "roadmap";
  const workspaceLabel = publicMode ? "Public · Ecosystem" : operator ? "SCF · All projects" : profile?.name || "Project";
  const workspaceMark = publicMode ? "P" : operator ? "S" : profile?.name?.[0] || "P";

  function exportData() {
    if (isPublic(current) || showReportStatus) return;

    const projectIds = scopeIds(current).filter((id) =>
      current.view !== "api" || current.project === "all" || id === current.project,
    );
    if (projectIds.length === 0) return;

    const payload = {
      range: current.range,
      view: current.view,
      projectIds,
      ...headline(current, projectIds),
    };
    const file = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    const scope = projectIds.length === 1 ? projectIds[0] : "ecosystem";
    link.download = "stellar-analytics-" + scope + "-" + current.range + ".json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function openEnroll() {
    current.enrollOpen = true;
    current.enrollStep = "details";
    current.enrollId = "";
    current.enrollName = "";
    current.enrollToken = "";
    current.enrollResult = "";
    bump();
  }

  function closeEnroll() {
    current.enrollOpen = false;
    bump();
  }

  async function enroll(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (current.enrollStep === "details") {
      const id = current.enrollId.trim().toLowerCase().replace(/\s+/g, "-");
      if (!id) {
        current.enrollResult = "A project id is required.";
        bump();
        return;
      }
      if (!/^[a-z0-9][a-z0-9-]{1,31}$/.test(id)) {
        current.enrollResult = "Use 2–32 characters: letters, numbers, and hyphens.";
        bump();
        return;
      }
      current.enrollId = id;
      if (!current.enrollName.trim()) current.enrollName = id;
      current.enrollResult = "";
      current.enrollStep = "confirm";
      bump();
      return;
    }
    if (current.enrollStep !== "confirm") return;
    const id = current.enrollId.trim();
    const response = await fetch("/tenants", {
      method: "POST",
      headers: { authorization: "Bearer " + current.token, "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const body = await response.json();
    if (response.ok) {
      const label = current.enrollName.trim() || id;
      if (!current.waiting.some((item) => item.id === id) && !PROFILES[id]) {
        current.waiting.push({
          id,
          name: label,
          detail: "Just enrolled",
          umamiStatus: "Tracking setup pending",
          status: current.approval ? "pending" : "hidden",
        });
      }
      current.enrollToken = body.token || "";
      current.enrollStep = "done";
      current.enrollResult = "";
    } else {
      current.enrollResult = body.error || "Could not enroll.";
    }
    bump();
  }

  const enrollSnippet = SNIPPET.replace("SITE_ID", current.enrollId.trim() || "SITE_ID");

  return (
    <div className="app">
      <aside>
        <a className="brand" href="https://stellar.org" target="_blank" rel="noreferrer">
          <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d={MARK} />
          </svg>
          <span>
            <strong>stellar</strong>
            <span>ecosystem analytics</span>
          </span>
        </a>
        <div>
          <p className="kicker">Workspace</p>
          <div className="workspace-menu">
            <button type="button" aria-haspopup="listbox" aria-expanded={current.menuOpen} onClick={() => { current.menuOpen = !current.menuOpen; bump(); }}>
              {current.mode === "tenant" && current.tenantId ? <ProjectIcon id={current.tenantId} /> : <span className="avatar">{workspaceMark}</span>}
              <span>{workspaceLabel}</span>
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                <path d="M3 5.2 7 9l4-3.8" fill="none" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </button>
            <div className="menu" role="listbox" hidden={!current.menuOpen}>
              <button type="button" aria-pressed={publicMode} onClick={() => enterPublic()}>
                <span className="avatar">P</span>
                <span>Public · Ecosystem</span>
              </button>
              <button type="button" aria-pressed={operator} onClick={() => enterScf()}>
                <span className="avatar">S</span>
                <span>SCF · All projects</span>
              </button>
              {current.roster.tenants.filter((tenant) => availableProject(current, tenant.id)).map((tenant) => (
                <button key={tenant.id} type="button" aria-pressed={current.role === tenant.id} onClick={() => enterTenant(tenant.id)}>
                  <ProjectIcon id={tenant.id} />
                  <span>{nameOf(tenant.id, current.umamiSites)}</span>
                </button>
              ))}
              <button type="button" onClick={openTenantPicker}>
                <span className="avatar">T</span>
                <span>Pick tenant…</span>
              </button>
              <button type="button" onClick={changeMode}>
                <span className="avatar">⇄</span>
                <span>All modes</span>
              </button>
            </div>
          </div>
        </div>
        <nav aria-label="Sections">
          <p className="nav-group">Project</p>
          <NavButton current={current} id="overview" bump={bump} icon={<IconOverview />}>Overview</NavButton>
          <NavButton current={current} id="roadmap" bump={bump} icon={<IconRoadmap />}>Roadmap</NavButton>
          <a className="nav-link" href="https://scf.gitbook.io/scf-docs-1" target="_blank" rel="noreferrer">
            <span className="nav-label"><IconBook />GitBook</span>
          </a>
          <p className="nav-group">Analytics</p>
          <NavButton current={current} id="web" bump={bump} icon={<IconWeb />}>Web</NavButton>
          {!publicMode ? <NavButton current={current} id="api" bump={bump} icon={<IconApi />}>API</NavButton> : null}
          <NavButton current={current} id="compare" bump={bump} icon={<IconProjects />} extra={<span className="count">{listed}</span>}>Projects</NavButton>
          {!publicMode ? (
            <>
              <p className="nav-group">Setup</p>
              <NavButton current={current} id="integration" bump={bump} icon={<IconCode />}>Integration</NavButton>
            </>
          ) : null}
          {!publicMode ? <p className="nav-group">Ops</p> : null}
          {operator ? <NavButton current={current} id="manage" bump={bump} icon={<IconManage />}>SCF managing</NavButton> : null}
          {!publicMode ? <NavButton current={current} id="privacy" bump={bump} icon={<IconPrivacy />}>Data & privacy</NavButton> : null}
        </nav>
        <div className="promo">
          <a className="umami" href="https://umami.is" target="_blank" rel="noreferrer">◕ Powered by Umami</a>
          <p>Free for every Stellar project. Enrollment does not list a project on the dashboard.</p>
        </div>
      </aside>
      <div className="workspace" onClick={() => { if (current.menuOpen) { current.menuOpen = false; bump(); } }}>
        <div className="workspace-inner">
          <header className="top">
            <div>
              <h1>{copy[0]}</h1>
              {description ? <p className="lede">{description}</p> : null}
            </div>
            {!showRoadmap && !publicMode && (
              <div className="top-tools">
                <button className="ghost" type="button" onClick={exportData} disabled={showReportStatus}>
                  {current.mode === "tenant" ? "Export data from your project" : "Export data"}
                </button>
                <button className="primary" type="button" onClick={openEnroll}>
                  + Add project <span className="free">Free</span>
                </button>
              </div>
            )}
          </header>
          {!showRoadmap && (
            <div className="context-strip">
              <div className="context-tools">
                {view === "api" ? (
                  <span className="status-pill sample">Sample API</span>
                ) : (
                  <span className={"status-pill" + (current.umami && !overviewSource ? " live" : "")}>
                    {showReportStatus
                      ? "Loading Umami"
                      : fallbackMessage ? "Sample web data"
                      : overviewSource ? "Live and sample web data"
                      : current.umami ? "Live web" : "Sample data"}
                  </span>
                )}
                {showApiSource ? <span className="status-pill sample">Sample API</span> : null}
                {showRange ? (
                  <div className="range-wrap">
                    <span className="window">{showReportStatus ? RANGE_LABELS[current.range] : windowLabel(current)}</span>
                    <label className="range">
                      <span className="sr">Time range</span>
                      <select
                        aria-label="Time range"
                        value={current.range}
                        onChange={(event) => {
                          current.range = event.target.value as RangeKey;
                          current.detail = null;
                          bump();
                        }}
                      >
                        {RANGES.map((range) => (
                          <option key={range} value={range}>{RANGE_LABELS[range]}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                ) : null}
              </div>
            </div>
          )}
          {fallbackMessage ? <p className="caption" role="status">{fallbackMessage}{ids.length && view !== "manage" ? " Showing sample web metrics." : ""}</p> : null}
          <div className={showRoadmap ? "enter roadmap-content" : "enter"}>
            {showRoadmap ? (
              <Roadmap />
            ) : showReportStatus ? (
              <section className="panel" role="status" aria-busy="true">
                <p className="quiet">Loading Umami metrics…</p>
              </section>
            ) : view === "api" && !current.apiMetrics ? (
              <section className="panel" role="status">
                <p className="quiet">{activeTraffic?.error ?? "Loading sample API metrics…"}</p>
              </section>
            ) : view === "api" && current.apiMetrics && !Object.keys(current.apiMetrics).length ? (
              <section className="panel" role="status">
                <p className="quiet">No simulated API metrics are available for this project.</p>
              </section>
            ) : (
              <Stage state={current} bump={bump} onOpen={enterTenant} />
            )}
          </div>
        </div>
      </div>
      {current.enrollOpen ? (
        <div className="modal" onClick={(event) => { if (event.target === event.currentTarget) closeEnroll(); }}>
          <form className="panel enroll-modal" onSubmit={enroll}>
            <div className="enroll-steps" aria-label="Enrollment steps">
              <span className={current.enrollStep === "details" ? "on" : ""}>1 · Details</span>
              <span className={current.enrollStep === "confirm" ? "on" : ""}>2 · Confirm</span>
              <span className={current.enrollStep === "done" ? "on" : ""}>3 · Install</span>
            </div>
            {current.enrollStep === "details" ? (
              <>
                <h2>Add a project</h2>
                <p className="lede">Free enrollment. SCF still decides what appears on the shared dashboard.</p>
                <label>
                  Display name
                  <input
                    value={current.enrollName}
                    autoComplete="off"
                    placeholder="Example project"
                    onChange={(event) => {
                      current.enrollName = event.target.value;
                      bump();
                    }}
                  />
                </label>
                <label>
                  Project id
                  <input
                    value={current.enrollId}
                    autoComplete="off"
                    placeholder="example-project"
                    onChange={(event) => {
                      current.enrollId = event.target.value;
                      bump();
                    }}
                  />
                </label>
                <p className="field-hint">Used in the script tag and API tenant id. Letters, numbers, hyphens.</p>
                <p className="field-label">Umami setup</p>
                <p className="field-hint">Add the Umami tracking script to the project website to complete the setup.</p>
                <div className="modal-actions">
                  <button className="ghost" type="button" onClick={closeEnroll}>Cancel</button>
                  <button className="primary" type="submit">Continue</button>
                </div>
              </>
            ) : null}
            {current.enrollStep === "confirm" ? (
              <>
                <h2>Confirm enrollment</h2>
                <p className="lede">This mints a project token. It does not list the project on the dashboard.</p>
                <dl className="enroll-summary">
                  <div><dt>Name</dt><dd>{current.enrollName.trim() || current.enrollId}</dd></div>
                  <div><dt>Project id</dt><dd className="mono">{current.enrollId}</dd></div>
                  <div><dt>Setup</dt><dd>Install the Umami tracking script</dd></div>
                  <div><dt>Dashboard</dt><dd>Hidden until SCF lists it</dd></div>
                </dl>
                <div className="modal-actions">
                  <button className="ghost" type="button" onClick={() => { current.enrollStep = "details"; bump(); }}>Back</button>
                  <button className="primary" type="submit">Enroll project</button>
                </div>
              </>
            ) : null}
            {current.enrollStep === "done" ? (
              <>
                <h2>Project enrolled</h2>
                <p className="lede">{current.enrollName.trim() || current.enrollId} is enrolled and waiting for a listing decision.</p>
                {current.enrollToken ? (
                  <label>
                    Project token
                    <input className="mono" readOnly value={current.enrollToken} onFocus={(event) => event.currentTarget.select()} />
                  </label>
                ) : null}
                <label>
                  Web snippet
                  <textarea className="mono" readOnly rows={3} value={enrollSnippet} onFocus={(event) => event.currentTarget.select()} />
                </label>
                <p className="field-hint">Pin this script, then dual-export API traces from Integration.</p>
                <div className="modal-actions">
                  <button
                    className="ghost"
                    type="button"
                    onClick={() => {
                      closeEnroll();
                      current.view = "integration";
                      bump();
                    }}
                  >
                    Open Integration
                  </button>
                  <button className="primary" type="button" onClick={closeEnroll}>Done</button>
                </div>
              </>
            ) : null}
            {current.enrollResult ? <p className="caption">{current.enrollResult}</p> : null}
          </form>
        </div>
      ) : null}
      {tenantPicker ? (
        <div className="modal" onClick={(event) => { if (event.target === event.currentTarget) setTenantPicker(false); }}>
          <div className="panel gate-panel">
            <p className="eyebrow">Reviewer mode</p>
            <h2>Choose a tenant</h2>
            <p className="lede">Switch into one project workspace. Other tenants stay hidden.</p>
            <div className="tenant-pick">
              {(current.roster.tenants || [])
                .filter((tenant) => availableProject(current, tenant.id))
                .map((tenant) => (
                  <button key={tenant.id} type="button" aria-pressed={current.role === tenant.id} onClick={() => enterTenant(tenant.id)}>
                    <ProjectIcon id={tenant.id} />
                    <span>
                      <strong>{nameOf(tenant.id, current.umamiSites)}</strong>
                      <span>{profileOf(tenant.id, current.umamiSites).domain || profileOf(tenant.id).detail}</span>
                    </span>
                  </button>
                ))}
            </div>
            <div className="modal-actions">
              <button className="ghost" type="button" onClick={() => setTenantPicker(false)}>
                Cancel
              </button>
              <button className="ghost" type="button" onClick={changeMode}>
                All modes
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function goView(current: AppState, id: string, bump: () => void) {
  if (current.view === id && !current.detail) {
    document.querySelector(".workspace")?.scrollTo({ top: 0, behavior: "smooth" });
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  current.view = id;
  current.detail = null;
  bump();
  requestAnimationFrame(() => {
    document.querySelector(".workspace")?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  });
}

function NavButton({ current, id, bump, icon, extra, children }: { current: AppState; id: string; bump: () => void; icon?: ReactNode; extra?: ReactNode; children: ReactNode }) {
  return (
    <button type="button" aria-current={current.view === id ? "page" : undefined} onClick={() => goView(current, id, bump)}>
      <span className="nav-label">{icon}{children}</span>
      {extra}
    </button>
  );
}

function IconOverview() {
  return <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="2" width="5" height="5" rx="1" fill="none" stroke="currentColor" /><rect x="9" y="2" width="5" height="5" rx="1" fill="none" stroke="currentColor" /><rect x="2" y="9" width="5" height="5" rx="1" fill="none" stroke="currentColor" /><rect x="9" y="9" width="5" height="5" rx="1" fill="none" stroke="currentColor" /></svg>;
}
function IconRoadmap() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="m5 11 6-6" />
      <circle cx="3.5" cy="12.5" r="2" />
      <circle cx="12.5" cy="3.5" r="2" />
    </svg>
  );
}
function IconBook() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
      <path d="M8 4.5C6.5 3 4.5 2.8 2 3.7v8.5c2.5-.9 4.5-.7 6 .8 1.5-1.5 3.5-1.7 6-.8V3.7c-2.5-.9-4.5-.7-6 .8ZM8 4.5V13" />
    </svg>
  );
}
function IconWeb() {
  return <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.2" fill="none" stroke="currentColor" /><path d="M3 8h10M8 2.8c1.6 1.6 1.6 8.8 0 10.4M8 2.8c-1.6 1.6-1.6 8.8 0 10.4" fill="none" stroke="currentColor" /></svg>;
}
function IconApi() {
  return <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 12.5 6 8l2.2 2.2L14 4" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>;
}
function IconProjects() {
  return <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="3" width="12" height="3" rx="1" fill="none" stroke="currentColor" /><rect x="2" y="8" width="12" height="5" rx="1" fill="none" stroke="currentColor" /></svg>;
}
function IconManage() {
  return <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 4.5h12M2 8h12M2 11.5h12" fill="none" stroke="currentColor" /><circle cx="5.5" cy="4.5" r="1.3" fill="currentColor" /><circle cx="10.5" cy="8" r="1.3" fill="currentColor" /><circle cx="6.5" cy="11.5" r="1.3" fill="currentColor" /></svg>;
}
function IconPrivacy() {
  return <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.8 13.5 4v3.6c0 2.9-2.2 4.8-5.5 5.6C4.7 12.4 2.5 10.5 2.5 7.6V4Z" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>;
}
function IconCode() {
  return <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 4.5 2.5 8 6 11.5M10 4.5 13.5 8 10 11.5" fill="none" stroke="currentColor" strokeWidth="1.3" /></svg>;
}
