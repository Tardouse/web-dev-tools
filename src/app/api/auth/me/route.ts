import { getCurrentUser } from "@/server/auth/session";
import {
  apiRateLimitHeaders,
  checkApiRateLimit,
  rateLimitedResponse,
} from "@/server/api/rate-limit";
import { incrementDailyMetric } from "@/server/db/metrics";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  await incrementDailyMetric("api_requests");
  const user = await getCurrentUser();
  const rateLimit = await checkApiRateLimit(request, user);
  if (!rateLimit.allowed) {
    await incrementDailyMetric("error_count");
    return rateLimitedResponse(rateLimit);
  }
  return Response.json(
    { authenticated: Boolean(user) },
    {
      headers: {
        "Cache-Control": "no-store, private",
        ...apiRateLimitHeaders(rateLimit),
      },
    },
  );
}
