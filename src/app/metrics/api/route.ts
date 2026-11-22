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
  const candidates = mode === "tenant" && tenant
    ? Object.keys(API_FIXTURES).filter((id) => id === tenant)
    : Object.keys(API_FIXTURES);
  const active = candidates.length ? await activeUmamiProjects(process.env).catch(() => null) : null;
  const projects = Object.fromEntries(candidates.filter((id) => active?.[id]).map((id) => [id, API_FIXTURES[id]]));
  return Response.json({ source: "sample", projects });
}
