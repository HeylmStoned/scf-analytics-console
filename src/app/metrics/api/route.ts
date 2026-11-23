import { fetchCollectorApiMetrics } from "@/lib/collector";
import { API_FIXTURES } from "@/lib/api-fixtures";
import { isAnalyticsProjectId } from "@/lib/model";
import { activeUmamiProjects } from "@/lib/umami";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const mode = params.get("mode");
  if (mode !== "scf" && mode !== "tenant") return Response.json({ error: "Select a demo workspace" }, { status: 403 });

  const tenant = params.get("tenant");
  if (mode === "tenant" && (!tenant || !isAnalyticsProjectId(tenant))) {
    return Response.json({ error: "Invalid demo project" }, { status: 400 });
  }

  let catalog = API_FIXTURES;
  let liveIds = new Set<string>();
  try {
    const live = await fetchCollectorApiMetrics(process.env);
    if (live && Object.keys(live).length) {
      liveIds = new Set(Object.keys(live));
      catalog = { ...API_FIXTURES, ...live };
    }
  } catch {
    catalog = API_FIXTURES;
    liveIds = new Set();
  }

  const candidates = mode === "tenant" && tenant
    ? Object.keys(catalog).filter((id) => id === tenant)
    : Object.keys(catalog);
  const active = candidates.length ? await activeUmamiProjects(process.env).catch(() => null) : null;
  const projects = Object.fromEntries(
    candidates
      .filter((id) => (active ? active[id] || catalog[id] : catalog[id]))
      .filter((id) => catalog[id])
      .map((id) => [id, catalog[id]]),
  );
  const selected = Object.keys(projects);
  const liveSelected = selected.filter((id) => liveIds.has(id));
  const source =
    liveSelected.length === 0 ? "sample"
    : liveSelected.length === selected.length ? "collector"
    : "mixed";
  return Response.json({ source, liveIds: liveSelected, projects });
}
