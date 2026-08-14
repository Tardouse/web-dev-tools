import type { SessionUser } from "@/server/db/types";

export function canManageUser(
  actor: SessionUser,
  target: Pick<SessionUser, "id" | "role">,
): boolean {
  if (actor.id === target.id) return false;
  if (actor.role === "super_admin") return target.role !== "super_admin";
  return actor.role === "admin" && target.role === "user";
}
