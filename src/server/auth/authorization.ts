import "server-only";

import { redirect } from "next/navigation";
import { localePath, type Locale } from "@/i18n";
import { getCurrentAdmin } from "@/server/auth/session";
import type { SessionUser, UserRole } from "@/server/db/types";
import { canManageUser } from "@/lib/admin-permissions";

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export function isAdminRole(role: UserRole): boolean {
  return role === "admin" || role === "super_admin";
}

export async function requireAdmin(locale?: Locale): Promise<SessionUser> {
  const user = await getCurrentAdmin();
  if (!user || !isAdminRole(user.role)) {
    if (locale) redirect(localePath(locale, "/admin/login"));
    throw new AuthorizationError("Authentication required.");
  }
  return user;
}

export function assertCanManageUser(
  actor: SessionUser,
  target: Pick<SessionUser, "id" | "role">,
): void {
  if (!canManageUser(actor, target)) {
    throw new AuthorizationError(
      "You cannot manage your own account or a user with an equal or higher role.",
    );
  }
}
