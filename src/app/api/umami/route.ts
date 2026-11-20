import { umamiDashboard } from "@/lib/umami";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const range = new URL(request.url).searchParams.get("range") || "30d";
  try {
    const body = await umamiDashboard(
      {
        UMAMI_API_KEY: process.env.UMAMI_API_KEY,
        UMAMI_API_CLIENT_ENDPOINT: process.env.UMAMI_API_CLIENT_ENDPOINT,
        UMAMI_URL: process.env.UMAMI_URL,
        UMAMI_USER: process.env.UMAMI_USER,
        UMAMI_PASSWORD: process.env.UMAMI_PASSWORD,
        UMAMI_ALPHA: process.env.UMAMI_ALPHA,
        UMAMI_BETA: process.env.UMAMI_BETA,
      },
      range,
    );
    if (!body) return Response.json({ error: "Umami is not configured" }, { status: 404 });
    return Response.json(body);
  } catch {
    return Response.json({ error: "Umami request failed" }, { status: 502 });
  }
}
