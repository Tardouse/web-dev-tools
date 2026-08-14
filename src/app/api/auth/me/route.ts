import { isAdminRole } from "@/server/auth/authorization";
import { getCurrentUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  return Response.json(
    { admin: Boolean(user && isAdminRole(user.role)) },
    { headers: { "Cache-Control": "no-store, private" } },
  );
}
