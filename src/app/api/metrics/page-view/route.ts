import { z } from "zod";
import { getCurrentUser } from "@/server/auth/session";
import { incrementDailyMetric, recordPageView } from "@/server/db/metrics";
import { getTool } from "@/lib/tool-registry";

export const dynamic = "force-dynamic";

const payloadSchema = z.object({
  path: z.string().min(1).max(500).startsWith("/"),
  visitorId: z.string().uuid(),
});

export async function POST(request: Request) {
  await incrementDailyMetric("api_requests");
  const parsed = payloadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid metrics payload." }, { status: 400 });
  }
  const user = await getCurrentUser();
  const segments = parsed.data.path.split("/").filter(Boolean);
  const toolSlug =
    segments.length >= 3 &&
    (segments[0] === "zh" || segments[0] === "en") &&
    segments[1] === "tools" &&
    getTool(segments[2], segments[0])
      ? segments[2]
      : undefined;
  await recordPageView({
    ...parsed.data,
    userId: user?.id,
    toolSlug,
  });
  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}
