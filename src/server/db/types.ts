export const USER_ROLES = ["user", "admin", "super_admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];
export type UserStatus = "active" | "disabled";

export interface SessionUser {
  id: string;
  email: string;
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
  actorEmail: string;
  action: string;
  targetUserId: string | null;
  result: "success" | "failure";
  ipAddress: string;
  details: string | null;
  createdAt: string;
}
