import { isAnalyticsProjectId } from "@/lib/model";
import { umamiDashboard } from "@/lib/umami";

export const dynamic = "force-dynamic";

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const range = params.get("range") || "30d";
  const mode = params.get("mode") ?? "public";
  const view = params.get("view") ?? "overview";
  const tenant = params.get("tenant");
  if (!["public", "scf", "tenant"].includes(mode) || !["overview", "web", "compare", "manage"].includes(view)) {
    return json({ error: "Invalid analytics view" }, 400);
  }

  if (mode === "tenant" && (!tenant || !isAnalyticsProjectId(tenant))) {
    return json({ error: "Invalid project" }, 400);
  }
  if (view === "manage" && mode !== "scf") return json({ error: "Select the SCF demo workspace" }, 403);

  const level = mode === "public" ? "totals"
    : view === "overview" ? "activity"
    : view === "web" ? "audience"
    : "totals";

  try {
    const body = await umamiDashboard(process.env, range, mode === "tenant" ? tenant : null, level, view === "manage");
    if (!body) return json({ error: "Umami is not configured for this scope" }, 404);
    return json(body);
  } catch {
    return json({ error: "Umami request failed" }, 502);
  }
}
