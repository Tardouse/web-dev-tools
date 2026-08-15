export const USER_ROLES = ["user", "admin", "super_admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];
export type UserStatus = "active" | "disabled";
export type SessionAudience = "user" | "admin";

export interface SessionUser {
  id: string;
  email: string | null;
  username: string | null;
  name: string;
  role: UserRole;
  status: UserStatus;
  mustChangePassword: boolean;
}

export interface ManagedUser extends SessionUser {
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  toolUsageCount: number;
}

export interface AdminAuditEntry {
  id: number;
  actorName: string;
  actorIdentifier: string;
  action: string;
  targetUserId: string | null;
  result: "success" | "failure";
  ipAddress: string;
  details: string | null;
  createdAt: string;
}

export function accountIdentifier(
  user: Pick<SessionUser, "email" | "username">,
): string {
  return user.username ?? user.email ?? "unknown";
}
