import { z } from "zod";
import {
  apiRateLimitHeaders,
  checkApiRateLimit,
  rateLimitedResponse,
} from "@/server/api/rate-limit";
import { getCurrentUser } from "@/server/auth/session";
import { incrementDailyMetric, recordPageView } from "@/server/db/metrics";
import { getPublicTool } from "@/server/db/tool-management";

export const dynamic = "force-dynamic";

const payloadSchema = z.object({
  path: z.string().min(1).max(500).startsWith("/"),
  visitorId: z.string().uuid(),
});

export async function POST(request: Request) {
  await incrementDailyMetric("api_requests");
  const user = await getCurrentUser();
  const rateLimit = await checkApiRateLimit(request, user);
  if (!rateLimit.allowed) {
    await incrementDailyMetric("error_count");
    return rateLimitedResponse(rateLimit);
  }
  const parsed = payloadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    await incrementDailyMetric("error_count");
    return Response.json({ error: "Invalid metrics payload." }, { status: 400 });
  }
  const segments = parsed.data.path.split("/").filter(Boolean);
  const locale = segments[0] === "zh" || segments[0] === "en" ? segments[0] : null;
  const toolSlug =
    segments.length >= 3 &&
    locale &&
    segments[1] === "tools" &&
    (await getPublicTool(segments[2], locale))
      ? segments[2]
      : undefined;
  await recordPageView({
    ...parsed.data,
    userId: user?.id,
    toolSlug,
  });
  return new Response(null, {
    status: 204,
    headers: {
      "Cache-Control": "no-store",
      ...apiRateLimitHeaders(rateLimit),
    },
  });
}
