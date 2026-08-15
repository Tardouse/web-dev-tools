import "server-only";

import { getClientIp } from "@/server/auth/session";
import { consumeApiRateLimit } from "@/server/db/settings";
import type { SessionUser } from "@/server/db/types";

export async function checkApiRateLimit(
  request: Request,
  user: SessionUser | null,
) {
  return consumeApiRateLimit({
    identifier: user?.id ?? getClientIp(request.headers),
    authenticated: Boolean(user),
  });
}

export function apiRateLimitHeaders(result: {
  limit: number;
  remaining: number;
  resetAt: string;
}): HeadersInit {
  return {
    "RateLimit-Limit": String(result.limit),
    "RateLimit-Remaining": String(result.remaining),
    "RateLimit-Reset": String(Math.ceil(Date.parse(result.resetAt) / 1000)),
  };
}

export function rateLimitedResponse(result: {
  limit: number;
  remaining: number;
  resetAt: string;
}): Response {
  const retryAfter = Math.max(
    1,
    Math.ceil((Date.parse(result.resetAt) - Date.now()) / 1000),
  );
  return Response.json(
    { error: "Too many requests." },
    {
      status: 429,
      headers: {
        ...apiRateLimitHeaders(result),
        "Retry-After": String(retryAfter),
        "Cache-Control": "no-store",
      },
    },
  );
}
