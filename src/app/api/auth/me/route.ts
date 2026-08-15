import { getCurrentUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";
export async function GET() {
  return Response.json(
    { authenticated: Boolean(await getCurrentUser()) },
    { headers: { "Cache-Control": "no-store, private" } },
  );
}
