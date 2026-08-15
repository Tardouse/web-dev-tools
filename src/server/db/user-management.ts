import "server-only";

import { z } from "zod";
import { assertCanManageUser } from "@/server/auth/authorization";
import { generateTemporaryPassword, hashPassword } from "@/server/auth/password";
import { revokeUserSessions } from "@/server/auth/session";
import { writeAuditLog } from "@/server/db/audit";
import { getDatabase, initializeDatabase } from "@/server/db/database";
import type { SessionUser, UserRole, UserStatus } from "@/server/db/types";
import { getSessionUserById } from "@/server/db/users";

const idSchema = z.uuid();
const roleSchema = z.enum(["user", "admin", "super_admin"]);

const emailSchema = z.email().trim().max(254);
const nameSchema = z.string().trim().min(2).max(80);

export class UserManagementError extends Error {
  constructor(
    message: string,
    readonly code:
      | "not_found"
      | "forbidden"
      | "invalid"
      | "last_super_admin" = "invalid",
  ) {
    super(message);
    this.name = "UserManagementError";
  }
}

async function targetOrThrow(userId: string): Promise<SessionUser> {
  const id = idSchema.safeParse(userId);
  if (!id.success) throw new UserManagementError("Invalid user ID.", "invalid");
  const target = await getSessionUserById(id.data);
  if (!target) throw new UserManagementError("User not found.", "not_found");
  return target;
}

async function executeAudited<T>(input: {
  actor: SessionUser;
  action: string;
  targetUserId: string;
  details?: Record<string, unknown>;
  operation: () => Promise<T> | T;
}): Promise<T> {
  try {
    const result = await input.operation();
    await writeAuditLog({
      actor: input.actor,
      action: input.action,
      targetUserId: input.targetUserId,
      result: "success",
      details: input.details,
    });
    return result;
  } catch (error) {
    if (error instanceof Error && error.name === "AuthorizationError") {
      error = new UserManagementError(error.message, "forbidden");
    }
    await writeAuditLog({
      actor: input.actor,
      action: input.action,
      targetUserId: input.targetUserId,
      result: "failure",
      details: {
        ...input.details,
        reason: error instanceof Error ? error.message : "Unknown failure",
      },
    });
    throw error;
  }
}

export async function createManagedUser(
  actor: SessionUser,
  input: { name: string; email: string },
): Promise<{ userId: string; temporaryPassword: string }> {
  const name = nameSchema.safeParse(input.name);
  const email = emailSchema.safeParse(input.email);
  if (!name.success || !email.success) {
    throw new UserManagementError("Invalid user details.", "invalid");
  }
  await initializeDatabase();
  const database = getDatabase();
  const normalizedEmail = email.data.toLowerCase();
  if (database.prepare("SELECT 1 FROM users WHERE email = ? COLLATE NOCASE").get(normalizedEmail)) {
    throw new UserManagementError("Email already exists.", "invalid");
  }
  const userId = crypto.randomUUID();
  const temporaryPassword = generateTemporaryPassword();
  const now = new Date().toISOString();
  database
    .prepare(
      `INSERT INTO users (
        id, email, username, name, password_hash, role, status,
        must_change_password, password_version, email_verified_at, created_at, updated_at
      ) VALUES (?, ?, NULL, ?, ?, 'user', 'active', 1, 1, ?, ?, ?)`,
    )
    .run(userId, normalizedEmail, name.data, await hashPassword(temporaryPassword), now, now, now);
  await writeAuditLog({
    actor,
    action: "user.create",
    targetUserId: userId,
    result: "success",
    details: { targetEmail: normalizedEmail },
  });
  return { userId, temporaryPassword };
}

export async function setUserStatus(
  actor: SessionUser,
  userId: string,
  status: UserStatus,
): Promise<void> {
  if (status !== "active" && status !== "disabled") {
    throw new UserManagementError("Invalid status.", "invalid");
  }
  await initializeDatabase();
  return executeAudited({
    actor,
    action: status === "disabled" ? "user.disable" : "user.enable",
    targetUserId: userId,
    details: { status },
    operation: async () => {
      const target = await targetOrThrow(userId);
      assertCanManageUser(actor, target);
      getDatabase()
        .prepare("UPDATE users SET status = ?, updated_at = ? WHERE id = ?")
        .run(status, new Date().toISOString(), userId);
      if (status === "disabled") await revokeUserSessions(userId);
    },
  });
}

export async function changeUserRole(
  actor: SessionUser,
  userId: string,
  roleValue: string,
): Promise<void> {
  const parsed = roleSchema.safeParse(roleValue);
  if (!parsed.success) throw new UserManagementError("Invalid role.", "invalid");
  const role: UserRole = parsed.data;
  await initializeDatabase();
  return executeAudited({
    actor,
    action: "user.role.change",
    targetUserId: userId,
    details: { role },
    operation: async () => {
      const target = await targetOrThrow(userId);
      assertCanManageUser(actor, target);
      if (actor.role !== "super_admin" && role !== "user") {
        throw new UserManagementError(
          "Only a Super Admin can grant administrator roles.",
          "forbidden",
        );
      }
      if (role === "super_admin" && actor.role !== "super_admin") {
        throw new UserManagementError(
          "Only a Super Admin can grant this role.",
          "forbidden",
        );
      }
      const username = role === "user" ? null : target.username ?? `admin-${target.id.slice(0, 8)}`;
      getDatabase()
        .prepare(
          `UPDATE users SET role = ?, username = ?,
            password_version = password_version + 1, updated_at = ? WHERE id = ?`,
        )
        .run(role, username, new Date().toISOString(), userId);
      await revokeUserSessions(userId);
    },
  });
}

export async function resetUserPassword(
  actor: SessionUser,
  userId: string,
): Promise<string> {
  await initializeDatabase();
  return executeAudited({
    actor,
    action: "user.password.reset",
    targetUserId: userId,
    operation: async () => {
      const target = await targetOrThrow(userId);
      assertCanManageUser(actor, target);
      const temporaryPassword = generateTemporaryPassword();
      getDatabase()
        .prepare(
          `UPDATE users SET password_hash = ?, password_version = password_version + 1,
            must_change_password = 1, updated_at = ? WHERE id = ?`,
        )
        .run(await hashPassword(temporaryPassword), new Date().toISOString(), userId);
      await revokeUserSessions(userId);
      return temporaryPassword;
    },
  });
}

export async function deleteUser(
  actor: SessionUser,
  userId: string,
): Promise<void> {
  await initializeDatabase();
  let target: SessionUser;
  try {
    target = await targetOrThrow(userId);
    assertCanManageUser(actor, target);
  } catch (error) {
    await writeAuditLog({
      actor,
      action: "user.delete",
      targetUserId: userId,
      result: "failure",
      details: {
        reason: error instanceof Error ? error.message : "Unknown failure",
      },
    });
    throw error;
  }
  const database = getDatabase();
  try {
    database.prepare("DELETE FROM users WHERE id = ?").run(userId);
    await writeAuditLog({
      actor,
      action: "user.delete",
      targetUserId: userId,
      result: "success",
      details: { targetIdentifier: target.username ?? target.email, targetRole: target.role },
    });
  } catch (error) {
    await writeAuditLog({
      actor,
      action: "user.delete.failure",
      targetUserId: userId,
      result: "failure",
      details: {
        targetIdentifier: target.username ?? target.email,
        reason: error instanceof Error ? error.message : "Unknown failure",
      },
    });
    throw error;
  }
}

export async function changeOwnPassword(
  actor: SessionUser,
  password: string,
): Promise<void> {
  const { passwordSchema } = await import("@/server/auth/password");
  if (!passwordSchema.safeParse(password).success) {
    throw new UserManagementError("Password does not meet the policy.", "invalid");
  }
  await initializeDatabase();
  await executeAudited({
    actor,
    action: "user.password.change",
    targetUserId: actor.id,
    operation: async () => {
      getDatabase()
        .prepare(
          `UPDATE users SET password_hash = ?, password_version = password_version + 1,
            must_change_password = 0, updated_at = ? WHERE id = ?`,
        )
        .run(await hashPassword(password), new Date().toISOString(), actor.id);
      await revokeUserSessions(actor.id);
    },
  });
}
