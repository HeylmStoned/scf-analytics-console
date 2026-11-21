import { API_FIXTURES } from "@/lib/api-fixtures";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const mode = params.get("mode");
  if (mode !== "scf" && mode !== "tenant") return Response.json({ error: "Select a demo workspace" }, { status: 403 });

  const tenant = params.get("tenant");
  if (mode === "tenant" && tenant !== "alpha" && tenant !== "beta") {
    return Response.json({ error: "Invalid demo project" }, { status: 400 });
  }
  const scope = mode === "tenant" && tenant ? [tenant] : ["alpha", "beta"];
  const visible = scope.filter((id) => id !== "beta" || Boolean(process.env.UMAMI_BETA?.trim()));
  const projects = Object.fromEntries(visible.map((id) => [id, API_FIXTURES[id]]));
  return Response.json({ source: "sample", projects });
}
